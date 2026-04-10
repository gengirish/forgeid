import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { apiKeys } from "@forgeid/db";
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
  });
