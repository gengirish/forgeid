import { Hono } from "hono";
import { z } from "zod";
import { VerifyTokenSchema, RevokeTokenSchema, ERROR_CODES } from "@forgeid/shared";
import type { ForgeIdEnv } from "../types.js";
import { zodValidatorJson } from "../lib/zod.js";
import { apiKeyOrTokenAuth } from "../middleware/auth.js";
import { getJwks } from "../services/crypto.js";
import {
  authenticateAccessToken,
  authenticatePasswordGrant,
  issueUserToken,
  refreshToken,
  revokeToken,
  spawnDelegatedAgent,
  verifyParentAccessToken,
  verifyToken,
} from "../services/token-service.js";

const IssueTokenBody = z.discriminatedUnion("grant_type", [
  z.object({
    grant_type: z.literal("password"),
    username: z.string().min(3),
    password: z.string().min(1),
    org_id: z.string().min(1),
  }),
  z.object({
    grant_type: z.literal("refresh_token"),
    refresh_token: z.string().min(1),
  }),
  z.object({
    grant_type: z.literal("agent_delegation"),
    parent_token: z.string().min(1),
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
  }),
]);

export const tokensRouter = new Hono<ForgeIdEnv>()
  .post("/v1/token", zodValidatorJson(IssueTokenBody), async (c) => {
    const db = c.get("db");
    const body = c.req.valid("json");

    if (body.grant_type === "password") {
      const session = await authenticatePasswordGrant(db, {
        email: body.username,
        password: body.password,
        orgId: body.org_id,
      });
      const tokens = await issueUserToken(db, {
        userId: session.userId,
        orgId: session.orgId,
        sessionId: session.sessionId,
      });
      return c.json({
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_type: "Bearer" as const,
          expires_in: tokens.expires_in,
        },
      });
    }

    if (body.grant_type === "refresh_token") {
      const tokens = await refreshToken(db, body.refresh_token);
      return c.json({
        data: {
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_type: "Bearer" as const,
          expires_in: tokens.expires_in,
        },
      });
    }

    const parent = await verifyParentAccessToken(db, body.parent_token);
    const spawned = await spawnDelegatedAgent(db, parent, {
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
        access_token: spawned.access_token,
        token_type: "Bearer" as const,
        expires_in: spawned.expires_in,
        agent_id: spawned.agent_id,
        delegation_chain: spawned.delegation_chain,
      },
    });
  })
  .post("/v1/token/verify", zodValidatorJson(VerifyTokenSchema), async (c) => {
    const db = c.get("db");
    const { token } = c.req.valid("json");
    const claims = await verifyToken(db, token);
    return c.json({ data: { claims, active: true } });
  })
  .post("/v1/token/revoke", apiKeyOrTokenAuth, zodValidatorJson(RevokeTokenSchema), async (c) => {
    const db = c.get("db");
    const orgId = c.get("orgId")!;
    const body = c.req.valid("json");

    let jti = body.jti;
    if (!jti && body.token) {
      const claims = await authenticateAccessToken(db, body.token);
      jti = claims.jti;
    }
    if (!jti) {
      return c.json(
        {
          error: {
            code: ERROR_CODES.VALIDATION_ERROR,
            message: "jti or token required",
            doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.VALIDATION_ERROR}`,
          },
        },
        400,
      );
    }

    const actorId = c.get("apiKeyId") ?? c.get("userId");
    if (!actorId) {
      return c.json(
        {
          error: {
            code: ERROR_CODES.AUTHENTICATION_REQUIRED,
            message: "Actor not resolved",
            doc_url: `https://forgeid.ai/docs/errors/${ERROR_CODES.AUTHENTICATION_REQUIRED}`,
          },
        },
        401,
      );
    }

    const actorType = c.get("apiKeyId") ? ("system" as const) : ("user" as const);

    await revokeToken(db, {
      jti,
      orgId,
      actorId,
      actorType,
      reason: body.reason,
    });

    return c.json({ data: { revoked: true, jti } });
  })
  .get("/v1/token/jwks", async (c) => {
    const jwks = await getJwks();
    return c.json({ data: jwks });
  });
