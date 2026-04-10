import type { Context } from "hono";
import { createMiddleware } from "hono/factory";
import { eq } from "drizzle-orm";
import type { Database } from "@forgeid/db";
import { apiKeys } from "@forgeid/db";
import { API_KEY_PREFIX, AuthenticationError } from "@forgeid/shared";
import type { ApiKeyRow, ForgeIdEnv } from "../types.js";
import { hashApiKey } from "../services/crypto.js";
import { authenticateAccessToken } from "../services/token-service.js";

function parseBearer(header: string | undefined): string | null {
  if (!header?.startsWith("Bearer ")) return null;
  const t = header.slice("Bearer ".length).trim();
  return t.length > 0 ? t : null;
}

function attachApiKeyContext(c: Context<ForgeIdEnv>, db: Database, row: ApiKeyRow): void {
  if (row.expiresAt && row.expiresAt < new Date()) {
    throw new AuthenticationError("API key has expired");
  }
  c.set("orgId", row.orgId);
  c.set("apiKeyId", row.id);
  c.set("apiKey", row);
  c.set("apiKeyScopes", row.scopes);
  void db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.id))
    .catch(() => {});
}

export const apiKeyAuth = createMiddleware<ForgeIdEnv>(async (c, next) => {
  const raw = parseBearer(c.req.header("Authorization"));
  if (!raw || !raw.startsWith(API_KEY_PREFIX)) {
    throw new AuthenticationError("API key required");
  }
  const db = c.get("db");
  const hash = hashApiKey(raw);
  const [row] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, hash)).limit(1);
  if (!row || row.revokedAt) {
    throw new AuthenticationError("Invalid API key");
  }
  attachApiKeyContext(c, db, row);
  await next();
});

export const tokenAuth = createMiddleware<ForgeIdEnv>(async (c, next) => {
  const raw = parseBearer(c.req.header("Authorization"));
  if (!raw) {
    throw new AuthenticationError("Bearer token required");
  }
  const db = c.get("db");
  const claims = await authenticateAccessToken(db, raw);
  const use = (claims as unknown as { token_use?: string }).token_use;
  if (use && use !== "access") {
    throw new AuthenticationError("Access token required");
  }
  const orgId = claims.org_id;
  if (!orgId) {
    throw new AuthenticationError("Token missing organization");
  }
  c.set("tokenClaims", claims);
  c.set("orgId", orgId);
  if (claims.identity_type === "user") {
    c.set("userId", claims.sub);
  }
  await next();
});

export const apiKeyOrTokenAuth = createMiddleware<ForgeIdEnv>(async (c, next) => {
  const raw = parseBearer(c.req.header("Authorization"));
  if (!raw) {
    throw new AuthenticationError("Authentication required");
  }
  const db = c.get("db");
  if (raw.startsWith(API_KEY_PREFIX)) {
    const hash = hashApiKey(raw);
    const [row] = await db.select().from(apiKeys).where(eq(apiKeys.keyHash, hash)).limit(1);
    if (!row || row.revokedAt) {
      throw new AuthenticationError("Invalid API key");
    }
    attachApiKeyContext(c, db, row);
    await next();
    return;
  }
  const claims = await authenticateAccessToken(db, raw);
  const use = (claims as unknown as { token_use?: string }).token_use;
  if (use && use !== "access") {
    throw new AuthenticationError("Access token required");
  }
  const orgId = claims.org_id;
  if (!orgId) {
    throw new AuthenticationError("Token missing organization");
  }
  c.set("tokenClaims", claims);
  c.set("orgId", orgId);
  if (claims.identity_type === "user") {
    c.set("userId", claims.sub);
  }
  await next();
});
