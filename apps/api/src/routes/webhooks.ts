import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { webhookDeliveries, webhookEndpoints } from "@forgeid/db";
import { CreateWebhookSchema, ERROR_CODES, ID_PREFIXES } from "@forgeid/shared";
import type { ForgeIdEnv } from "../types.js";
import { zodValidatorJson } from "../lib/zod.js";
import { apiKeyOrTokenAuth } from "../middleware/auth.js";
import { recordAuditEvent } from "../services/audit-service.js";
import { generateId, generateRawSecret } from "../services/crypto.js";

export const webhooksRouter = new Hono<ForgeIdEnv>()
  .use("*", apiKeyOrTokenAuth)
  .post("/v1/webhooks", zodValidatorJson(CreateWebhookSchema), async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const body = c.req.valid("json");
    const id = generateId(ID_PREFIXES.webhook);
    const secret = generateRawSecret(32);
    const [row] = await db
      .insert(webhookEndpoints)
      .values({
        id,
        orgId,
        url: body.url,
        secret,
        events: body.events,
        active: true,
        updatedAt: new Date(),
      })
      .returning();

    const actorId = c.get("apiKeyId") ?? c.get("userId") ?? "system";
    const actorType = c.get("apiKeyId") ? ("system" as const) : ("user" as const);

    await recordAuditEvent(db, {
      id: generateId(ID_PREFIXES.event),
      orgId,
      eventType: "webhook.created",
      actorType,
      actorId,
      targetType: "webhook",
      targetId: id,
      metadata: { url: body.url, events: body.events },
    });

    return c.json({
      data: {
        webhook: {
          id: row!.id,
          org_id: row!.orgId,
          url: row!.url,
          secret,
          events: row!.events,
          active: row!.active,
          created_at: row!.createdAt.toISOString(),
        },
      },
    });
  })
  .get("/v1/webhooks", async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const rows = await db.select().from(webhookEndpoints).where(eq(webhookEndpoints.orgId, orgId));
    return c.json({
      data: {
        webhooks: rows.map((w) => ({
          id: w.id,
          org_id: w.orgId,
          url: w.url,
          events: w.events,
          active: w.active,
          created_at: w.createdAt.toISOString(),
          updated_at: w.updatedAt.toISOString(),
        })),
      },
    });
  })
  .delete("/v1/webhooks/:id", async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const id = c.req.param("id");
    const [row] = await db
      .select()
      .from(webhookEndpoints)
      .where(and(eq(webhookEndpoints.id, id), eq(webhookEndpoints.orgId, orgId)))
      .limit(1);
    if (!row) {
      return c.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: "Webhook not found",
            doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.NOT_FOUND}`,
          },
        },
        404,
      );
    }
    await db.delete(webhookEndpoints).where(and(eq(webhookEndpoints.id, id), eq(webhookEndpoints.orgId, orgId)));

    const actorId = c.get("apiKeyId") ?? c.get("userId") ?? "system";
    const actorType = c.get("apiKeyId") ? ("system" as const) : ("user" as const);

    await recordAuditEvent(db, {
      id: generateId(ID_PREFIXES.event),
      orgId,
      eventType: "webhook.deleted",
      actorType,
      actorId,
      targetType: "webhook",
      targetId: id,
      metadata: {},
    });

    return c.json({ data: { deleted: true, id } });
  })
  .get("/v1/webhooks/:id/deliveries", async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const id = c.req.param("id");
    const [hook] = await db
      .select()
      .from(webhookEndpoints)
      .where(and(eq(webhookEndpoints.id, id), eq(webhookEndpoints.orgId, orgId)))
      .limit(1);
    if (!hook) {
      return c.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: "Webhook not found",
            doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.NOT_FOUND}`,
          },
        },
        404,
      );
    }
    const limit = Math.min(100, Number(c.req.query("limit") ?? 50) || 50);
    const rows = await db
      .select()
      .from(webhookDeliveries)
      .where(eq(webhookDeliveries.webhookEndpointId, id))
      .orderBy(desc(webhookDeliveries.createdAt))
      .limit(limit);

    return c.json({
      data: {
        deliveries: rows.map((d) => ({
          id: d.id,
          webhook_id: d.webhookEndpointId,
          event_id: d.eventId,
          status: d.status,
          attempts: d.attempts,
          response_status: d.responseStatus,
          last_attempt_at: d.lastAttemptAt?.toISOString() ?? null,
          next_retry_at: d.nextRetryAt?.toISOString() ?? null,
          created_at: d.createdAt.toISOString(),
        })),
      },
    });
  });
