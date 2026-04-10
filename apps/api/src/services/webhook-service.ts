import { createHmac } from "node:crypto";
import { and, eq } from "drizzle-orm";
import type { Database } from "@forgeid/db";
import { webhookDeliveries, webhookEndpoints } from "@forgeid/db";
import type { AuditRow } from "./audit-service.js";
import { generateId } from "./crypto.js";

const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [2_000, 10_000] as const;
const FETCH_TIMEOUT_MS = 10_000;

export function computeSignature(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

function buildPayload(event: AuditRow): string {
  const body = {
    id: event.id,
    type: event.eventType,
    timestamp: event.createdAt.toISOString(),
    data: event.metadata,
  };
  return JSON.stringify(body);
}

async function deliverToEndpoint(
  db: Database,
  endpoint: typeof webhookEndpoints.$inferSelect,
  event: AuditRow,
): Promise<void> {
  const deliveryId = generateId("whd_");
  await db.insert(webhookDeliveries).values({
    id: deliveryId,
    webhookEndpointId: endpoint.id,
    eventId: event.id,
    status: "pending",
    attempts: 0,
  });

  const bodyStr = buildPayload(event);

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const tsHeader = String(Math.floor(Date.now() / 1000));
    const signature = computeSignature(bodyStr, endpoint.secret);

    await db
      .update(webhookDeliveries)
      .set({
        attempts: attempt,
        lastAttemptAt: new Date(),
      })
      .where(eq(webhookDeliveries.id, deliveryId));

    try {
      const res = await fetch(endpoint.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "ForgeID-Webhooks/1.0",
          "X-ForgeID-Signature": signature,
          "X-ForgeID-Timestamp": tsHeader,
        },
        body: bodyStr,
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (res.ok) {
        await db
          .update(webhookDeliveries)
          .set({
            status: "delivered",
            responseStatus: res.status,
            nextRetryAt: null,
          })
          .where(eq(webhookDeliveries.id, deliveryId));
        return;
      }

      await db
        .update(webhookDeliveries)
        .set({
          status: attempt >= MAX_ATTEMPTS ? "failed" : "pending",
          responseStatus: res.status,
          nextRetryAt:
            attempt >= MAX_ATTEMPTS
              ? null
              : new Date(Date.now() + RETRY_DELAYS_MS[attempt - 1]!),
        })
        .where(eq(webhookDeliveries.id, deliveryId));

      if (attempt >= MAX_ATTEMPTS) return;
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]!));
    } catch {
      await db
        .update(webhookDeliveries)
        .set({
          status: attempt >= MAX_ATTEMPTS ? "failed" : "pending",
          responseStatus: null,
          nextRetryAt:
            attempt >= MAX_ATTEMPTS
              ? null
              : new Date(Date.now() + RETRY_DELAYS_MS[attempt - 1]!),
        })
        .where(eq(webhookDeliveries.id, deliveryId));

      if (attempt >= MAX_ATTEMPTS) return;
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]!));
    }
  }
}

export async function dispatchWebhooks(db: Database, orgId: string, event: AuditRow): Promise<void> {
  const rows = await db
    .select()
    .from(webhookEndpoints)
    .where(and(eq(webhookEndpoints.orgId, orgId), eq(webhookEndpoints.active, true)));

  const matching = rows.filter((e) => e.events.includes(event.eventType));
  await Promise.all(matching.map((endpoint) => deliverToEndpoint(db, endpoint, event)));
}
