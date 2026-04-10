import { Hono } from "hono";
import { streamSSE } from "hono/streaming";
import { QueryAuditSchema } from "@forgeid/shared";
import type { ForgeIdEnv } from "../types.js";
import { zodValidatorQuery } from "../lib/zod.js";
import { apiKeyOrTokenAuth } from "../middleware/auth.js";
import { queryAuditEvents, subscribeAuditStream, type AuditRow } from "../services/audit-service.js";

function serializeAudit(row: AuditRow) {
  return {
    id: row.id,
    org_id: row.orgId,
    event_type: row.eventType,
    actor_type: row.actorType,
    actor_id: row.actorId,
    target_type: row.targetType,
    target_id: row.targetId,
    metadata: row.metadata,
    ip_address: row.ipAddress,
    created_at: row.createdAt.toISOString(),
  };
}

export const auditRouter = new Hono<ForgeIdEnv>()
  .use("*", apiKeyOrTokenAuth)
  .get("/v1/audit", zodValidatorQuery(QueryAuditSchema), async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const q = c.req.valid("query");
    const rows = await queryAuditEvents(db, {
      orgId,
      eventType: q.event_type,
      actorId: q.actor_id,
      from: q.from,
      to: q.to,
      limit: q.limit,
      cursor: q.cursor,
    });
    return c.json({
      data: {
        events: rows.map(serializeAudit),
        cursor: rows.length > 0 ? rows[rows.length - 1].id : null,
        has_more: rows.length === (q.limit ?? 100),
      },
    });
  })
  .get("/v1/audit/stream", async (c) => {
    const orgId = c.get("orgId")!;
    return streamSSE(c, async (stream) => {
      const queue: AuditRow[] = [];
      const unsub = subscribeAuditStream((row) => {
        if (row.orgId === orgId) queue.push(row);
      });

      await stream.writeSSE({
        event: "ready",
        data: JSON.stringify({ org_id: orgId, message: "subscribed" }),
      });

      const signal = c.req.raw.signal;
      while (!signal.aborted) {
        const next = queue.shift();
        if (next) {
          await stream.writeSSE({
            event: "audit",
            data: JSON.stringify(serializeAudit(next)),
          });
        } else {
          await stream.sleep(500);
        }
      }
      unsub();
    });
  });
