import { Hono } from "hono";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { agents, tokens } from "@forgeid/db";
import { ERROR_CODES, ID_PREFIXES } from "@forgeid/shared";
import type { ForgeIdEnv } from "../types.js";
import { zodValidatorJson } from "../lib/zod.js";
import { apiKeyOrTokenAuth, tokenAuth } from "../middleware/auth.js";
import { findLatestAgentSpawnMetadata, recordAuditEvent } from "../services/audit-service.js";
import { generateId } from "../services/crypto.js";
import { spawnDelegatedAgent } from "../services/token-service.js";

const SpawnAgentBody = z.object({
  capabilities: z.array(z.string().min(1)),
  max_tool_calls: z.number().int().nonnegative(),
  max_lifetime_minutes: z.number().int().positive(),
  purpose: z.string().max(2048).optional(),
  model: z.string().max(256).optional(),
  delegation_chain: z
    .array(
      z.object({
        sub: z.string(),
        sess: z.string().optional(),
        auth_method: z.string().optional(),
        spawned_at: z.string().optional(),
      }),
    )
    .optional(),
  allow_spawn: z.boolean().optional(),
});

export const agentsRouter = new Hono<ForgeIdEnv>()
  .post("/v1/agents", tokenAuth, zodValidatorJson(SpawnAgentBody), async (c) => {
    const db = c.get("db");
    const claims = c.get("tokenClaims");
    if (!claims) {
      return c.json(
        {
          error: {
            code: ERROR_CODES.AUTHENTICATION_REQUIRED,
            message: "Bearer access token required to spawn an agent",
            doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.AUTHENTICATION_REQUIRED}`,
          },
        },
        401,
      );
    }
    const body = c.req.valid("json");
    const spawned = await spawnDelegatedAgent(db, claims, {
      capabilities: body.capabilities,
      maxToolCalls: body.max_tool_calls,
      maxLifetimeMinutes: body.max_lifetime_minutes,
      purpose: body.purpose,
      model: body.model,
      allowSpawn: body.allow_spawn,
      delegationChain: body.delegation_chain,
    });
    return c.json({
      data: {
        agent_id: spawned.agent_id,
        access_token: spawned.access_token,
        expires_in: spawned.expires_in,
        delegation_chain: spawned.delegation_chain,
      },
    });
  })
  .get("/v1/agents", apiKeyOrTokenAuth, async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const rows = await db.select().from(agents).where(eq(agents.orgId, orgId));
    return c.json({
      data: {
        agents: rows.map((a) => ({
          id: a.id,
          org_id: a.orgId,
          status: a.status,
          purpose: a.purpose,
          model: a.model,
          capabilities: a.capabilities,
          max_tool_calls: a.maxToolCalls,
          tool_calls_used: a.toolCallsUsed,
          max_lifetime_minutes: a.maxLifetimeMinutes,
          expires_at: a.expiresAt?.toISOString() ?? null,
          created_at: a.createdAt.toISOString(),
        })),
      },
    });
  })
  .get("/v1/agents/:id", apiKeyOrTokenAuth, async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const id = c.req.param("id");
    const [row] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.orgId, orgId)))
      .limit(1);
    if (!row) {
      return c.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: "Agent not found",
            doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.NOT_FOUND}`,
          },
        },
        404,
      );
    }
    return c.json({
      data: {
        agent: {
          id: row.id,
          org_id: row.orgId,
          status: row.status,
          purpose: row.purpose,
          model: row.model,
          capabilities: row.capabilities,
          max_tool_calls: row.maxToolCalls,
          tool_calls_used: row.toolCallsUsed,
          max_lifetime_minutes: row.maxLifetimeMinutes,
          expires_at: row.expiresAt?.toISOString() ?? null,
          created_at: row.createdAt.toISOString(),
        },
      },
    });
  })
  .delete("/v1/agents/:id", apiKeyOrTokenAuth, async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const id = c.req.param("id");
    const [row] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.orgId, orgId)))
      .limit(1);
    if (!row) {
      return c.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: "Agent not found",
            doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.NOT_FOUND}`,
          },
        },
        404,
      );
    }
    await db
      .update(agents)
      .set({ status: "terminated", terminatedAt: new Date() })
      .where(and(eq(agents.id, id), eq(agents.orgId, orgId)));

    await db
      .update(tokens)
      .set({ revokedAt: new Date(), revokedReason: "agent_terminated" })
      .where(
        and(eq(tokens.subjectType, "agent"), eq(tokens.subjectId, id), isNull(tokens.revokedAt)),
      );

    const actorId = c.get("apiKeyId") ?? c.get("userId") ?? "system";
    const actorType = c.get("apiKeyId") ? ("system" as const) : ("user" as const);

    await recordAuditEvent(db, {
      id: generateId(ID_PREFIXES.event),
      orgId,
      eventType: "token.agent.terminated",
      actorType,
      actorId,
      targetType: "agent",
      targetId: id,
      metadata: {},
    });

    return c.json({ data: { terminated: true, agent_id: id } });
  })
  .get("/v1/agents/:id/chain", apiKeyOrTokenAuth, async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const id = c.req.param("id");
    const [row] = await db
      .select()
      .from(agents)
      .where(and(eq(agents.id, id), eq(agents.orgId, orgId)))
      .limit(1);
    if (!row) {
      return c.json(
        {
          error: {
            code: ERROR_CODES.NOT_FOUND,
            message: "Agent not found",
            doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.NOT_FOUND}`,
          },
        },
        404,
      );
    }
    const meta = await findLatestAgentSpawnMetadata(db, orgId, id);
    const chain = (meta?.delegation_chain as unknown[]) ?? [];
    return c.json({ data: { agent_id: id, delegation_chain: chain } });
  });
