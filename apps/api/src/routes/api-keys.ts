import { Hono } from "hono";
import { and, desc, eq } from "drizzle-orm";
import { apiKeys, auditEvents } from "@forgeid/db";
import { z } from "zod";
import { CreateApiKeySchema, ERROR_CODES, API_KEY_PREFIX, ID_PREFIXES } from "@forgeid/shared";
import type { ForgeIdEnv } from "../types.js";
import { zodValidatorJson } from "../lib/zod.js";
import { apiKeyOrTokenAuth } from "../middleware/auth.js";
import { recordAuditEvent } from "../services/audit-service.js";
import { generateApiKey, generateId, hashApiKey } from "../services/crypto.js";

export const apiKeysRouter = new Hono<ForgeIdEnv>()
  .use("*", apiKeyOrTokenAuth)
  .post("/v1/api-keys", zodValidatorJson(CreateApiKeySchema), async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const body = c.req.valid("json");
    const raw = generateApiKey();
    const keyPrefix = raw.slice(0, API_KEY_PREFIX.length + 4);
    const id = generateId(ID_PREFIXES.apiKey);
    await db.insert(apiKeys).values({
      id,
      orgId,
      name: body.name,
      keyHash: hashApiKey(raw),
      keyPrefix,
      scopes: body.scopes,
    });

    const actorId = c.get("apiKeyId") ?? c.get("userId") ?? "system";
    const actorType = c.get("apiKeyId") ? ("system" as const) : ("user" as const);

    await recordAuditEvent(db, {
      id: generateId(ID_PREFIXES.event),
      orgId,
      eventType: "apikey.created",
      actorType,
      actorId,
      targetType: "api_key",
      targetId: id,
      metadata: { name: body.name, scopes: body.scopes },
    });

    return c.json({
      data: {
        id,
        org_id: orgId,
        name: body.name,
        key_prefix: keyPrefix,
        scopes: body.scopes,
        raw_key: raw,
        created_at: new Date().toISOString(),
      },
    });
  })
  .get("/v1/api-keys", async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const rows = await db.select().from(apiKeys).where(eq(apiKeys.orgId, orgId));
    return c.json({
      data: {
        api_keys: rows.map((k) => ({
          id: k.id,
          org_id: k.orgId,
          name: k.name,
          masked_key: `${k.keyPrefix}••••••••`,
          scopes: k.scopes,
          revoked_at: k.revokedAt?.toISOString() ?? null,
          last_used_at: k.lastUsedAt?.toISOString() ?? null,
          expires_at: k.expiresAt?.toISOString() ?? null,
          created_at: k.createdAt.toISOString(),
        })),
      },
    });
  })
  .delete("/v1/api-keys/:id", async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const id = c.req.param("id");
    const [row] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.orgId, orgId)))
      .limit(1);
    if (!row) {
      return c.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: "API key not found",
            doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.NOT_FOUND}`,
          },
        },
        404,
      );
    }
    await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.orgId, orgId)));

    const actorId = c.get("apiKeyId") ?? c.get("userId") ?? "system";
    const actorType = c.get("apiKeyId") ? ("system" as const) : ("user" as const);

    await recordAuditEvent(db, {
      id: generateId(ID_PREFIXES.event),
      orgId,
      eventType: "apikey.revoked",
      actorType,
      actorId,
      targetType: "api_key",
      targetId: id,
      metadata: {},
    });

    return c.json({ data: { revoked: true, id } });
  })
  .patch(
    "/v1/api-keys/:id",
    zodValidatorJson(
      z
        .object({
          name: z.string().min(1).max(256).optional(),
          scopes: z.array(z.string().min(1)).optional(),
          expires_at: z.string().datetime().optional(),
        })
        .refine((data) => data.name !== undefined || data.scopes !== undefined || data.expires_at !== undefined, {
          message: "At least one of name, scopes, or expires_at is required",
        }),
    ),
    async (c) => {
      const db = c.get("db");
      const orgId = c.get("orgId")!;
      const id = c.req.param("id");
      const body = c.req.valid("json");
      const [row] = await db
        .select()
        .from(apiKeys)
        .where(and(eq(apiKeys.id, id), eq(apiKeys.orgId, orgId)))
        .limit(1);
      if (!row) {
        return c.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: "API key not found",
              doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.NOT_FOUND}`,
            },
          },
          404,
        );
      }
      const patch: { name?: string; scopes?: string[]; expiresAt?: Date } = {};
      if (body.name !== undefined) patch.name = body.name;
      if (body.scopes !== undefined) patch.scopes = body.scopes;
      if (body.expires_at !== undefined) patch.expiresAt = new Date(body.expires_at);
      const [updated] = await db
        .update(apiKeys)
        .set(patch)
        .where(and(eq(apiKeys.id, id), eq(apiKeys.orgId, orgId)))
        .returning();
      if (!updated) {
        return c.json(
          {
            error: {
              code: ERROR_CODES.NOT_FOUND,
              message: "API key not found",
              doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.NOT_FOUND}`,
            },
          },
          404,
        );
      }

      const actorId = c.get("apiKeyId") ?? c.get("userId") ?? "system";
      const actorType = c.get("apiKeyId") ? ("system" as const) : ("user" as const);

      await recordAuditEvent(db, {
        id: generateId(ID_PREFIXES.event),
        orgId,
        eventType: "apikey.updated",
        actorType,
        actorId,
        targetType: "api_key",
        targetId: id,
        metadata: {
          ...(body.name !== undefined ? { name: body.name } : {}),
          ...(body.scopes !== undefined ? { scopes: body.scopes } : {}),
          ...(body.expires_at !== undefined ? { expires_at: body.expires_at } : {}),
        },
      });

      return c.json({
        data: {
          id: updated.id,
          org_id: updated.orgId,
          name: updated.name,
          masked_key: `${updated.keyPrefix}••••••••`,
          scopes: updated.scopes,
          revoked_at: updated.revokedAt?.toISOString() ?? null,
          last_used_at: updated.lastUsedAt?.toISOString() ?? null,
          expires_at: updated.expiresAt?.toISOString() ?? null,
          created_at: updated.createdAt.toISOString(),
        },
      });
    },
  )
  .get("/v1/api-keys/:id/usage", async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const id = c.req.param("id");
    const [key] = await db
      .select()
      .from(apiKeys)
      .where(and(eq(apiKeys.id, id), eq(apiKeys.orgId, orgId)))
      .limit(1);
    if (!key) {
      return c.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: "API key not found",
            doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.NOT_FOUND}`,
          },
        },
        404,
      );
    }
    const events = await db
      .select()
      .from(auditEvents)
      .where(and(eq(auditEvents.orgId, orgId), eq(auditEvents.actorId, id)))
      .orderBy(desc(auditEvents.createdAt))
      .limit(100);
    return c.json({
      data: {
        api_key_id: id,
        last_used_at: key.lastUsedAt?.toISOString() ?? null,
        recent_events: events.map((e) => ({
          id: e.id,
          event_type: e.eventType,
          actor_type: e.actorType,
          target_type: e.targetType,
          target_id: e.targetId,
          metadata: e.metadata,
          created_at: e.createdAt.toISOString(),
        })),
      },
    });
  });
