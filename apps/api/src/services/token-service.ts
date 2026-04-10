import { and, eq, isNull } from "drizzle-orm";
import type { Database } from "@forgeid/db";
import {
  agents,
  organizations,
  roles,
  sessions,
  tokens,
  users,
} from "@forgeid/db";
import {
  AuthenticationError,
  InternalError,
  NotFoundError,
  ID_PREFIXES,
  type DelegationChainEntry,
  type ForgeIDTokenClaims,
} from "@forgeid/shared";
import { recordAuditEvent } from "./audit-service.js";
import {
  generateId,
  getSigningMaterial,
  hashApiKey,
  signJwt,
  verifyJwt,
} from "./crypto.js";

const issuer = () => process.env.FORGEID_JWT_ISSUER ?? "https://forgeid.ai";
const audience = () => process.env.FORGEID_JWT_AUDIENCE ?? "forgeid-api";
const accessTtlSec = () => Number(process.env.FORGEID_ACCESS_TTL_SEC ?? 3600);
const refreshTtlSec = () => Number(process.env.FORGEID_REFRESH_TTL_SEC ?? 60 * 60 * 24 * 30);

function nowPlusMinutes(min: number): Date {
  return new Date(Date.now() + min * 60 * 1000);
}

async function loadUserPermissions(
  db: Database,
  orgId: string,
  userRole: string,
): Promise<string[]> {
  if (userRole === "owner") return ["*"];
  const [role] = await db
    .select()
    .from(roles)
    .where(and(eq(roles.orgId, orgId), eq(roles.name, userRole)))
    .limit(1);
  return role?.permissions ?? [];
}

async function assertTokenRowActive(db: Database, jti: string) {
  const [row] = await db.select().from(tokens).where(eq(tokens.jti, jti)).limit(1);
  if (!row) throw new NotFoundError("Token not found");
  if (row.revokedAt) throw new AuthenticationError("Token has been revoked");
  if (row.expiresAt.getTime() < Date.now()) throw new AuthenticationError("Token expired");
  return row;
}

export async function issueUserToken(
  db: Database,
  input: { userId: string; orgId: string; sessionId: string },
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const { privateKey, kid } = getSigningMaterial();
  const [org] = await db.select().from(organizations).where(eq(organizations.id, input.orgId)).limit(1);
  if (!org) throw new NotFoundError("Organization not found");
  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.id, input.userId), eq(users.orgId, input.orgId)))
    .limit(1);
  if (!user) throw new NotFoundError("User not found");

  const permissions = await loadUserPermissions(db, input.orgId, user.role);
  const accessJti = generateId("jti_");
  const refreshJti = generateId("jti_");
  const accessExp = new Date(Date.now() + accessTtlSec() * 1000);
  const refreshExp = new Date(Date.now() + refreshTtlSec() * 1000);

  await db.insert(tokens).values([
    {
      id: generateId(ID_PREFIXES.token),
      orgId: input.orgId,
      subjectType: "user",
      subjectId: user.id,
      tokenType: "access",
      jti: accessJti,
      expiresAt: accessExp,
    },
    {
      id: generateId(ID_PREFIXES.token),
      orgId: input.orgId,
      subjectType: "user",
      subjectId: user.id,
      tokenType: "refresh",
      jti: refreshJti,
      expiresAt: refreshExp,
    },
  ]);

  const accessPayload: Record<string, unknown> = {
    org_id: org.id,
    org_slug: org.slug,
    identity_type: "user",
    email: user.email,
    roles: [user.role],
    permissions,
    session_id: input.sessionId,
    auth_method: "password",
    token_use: "access",
  };

  const refreshPayload: Record<string, unknown> = {
    org_id: org.id,
    org_slug: org.slug,
    identity_type: "user",
    session_id: input.sessionId,
    token_use: "refresh",
  };

  const access_token = await signJwt(accessPayload, privateKey, kid, {
    issuer: issuer(),
    audience: audience(),
    subject: user.id,
    expiresInSeconds: accessTtlSec(),
    jti: accessJti,
  });

  const refresh_token = await signJwt(refreshPayload, privateKey, kid, {
    issuer: issuer(),
    audience: audience(),
    subject: user.id,
    expiresInSeconds: refreshTtlSec(),
    jti: refreshJti,
  });

  await recordAuditEvent(db, {
    id: generateId(ID_PREFIXES.event),
    orgId: input.orgId,
    eventType: "token.issued",
    actorType: "user",
    actorId: user.id,
    targetType: "token",
    targetId: accessJti,
    metadata: { token_type: "access", session_id: input.sessionId },
  });

  return { access_token, refresh_token, expires_in: accessTtlSec() };
}

export type IssueAgentTokenParams = {
  agentId: string;
  orgId: string;
  orgSlug: string;
  delegationChain: DelegationChainEntry[];
  capabilities: string[];
  maxToolCalls: number;
  purpose?: string;
  model?: string;
  maxLifetimeMinutes: number;
  toolCallsRemaining?: number;
  actorId: string;
  actorType: "user" | "agent";
};

export async function issueAgentToken(
  db: Database,
  params: IssueAgentTokenParams,
): Promise<{ access_token: string; expires_in: number }> {
  const { privateKey, kid } = getSigningMaterial();
  const expDate = nowPlusMinutes(params.maxLifetimeMinutes);
  const expSec = Math.max(60, Math.floor((expDate.getTime() - Date.now()) / 1000));
  const jti = generateId("jti_");

  await db.insert(tokens).values({
    id: generateId(ID_PREFIXES.token),
    orgId: params.orgId,
    subjectType: "agent",
    subjectId: params.agentId,
    tokenType: "agent",
    jti,
    expiresAt: expDate,
  });

  const toolRemaining = params.toolCallsRemaining ?? params.maxToolCalls;
  const payload: Record<string, unknown> = {
    org_id: params.orgId,
    org_slug: params.orgSlug,
    identity_type: "agent",
    agent_type: "delegated",
    delegation_chain: params.delegationChain,
    capabilities: params.capabilities,
    max_tool_calls: params.maxToolCalls,
    tool_calls_remaining: toolRemaining,
    purpose: params.purpose,
    model: params.model,
    token_use: "access",
  };

  const access_token = await signJwt(payload, privateKey, kid, {
    issuer: issuer(),
    audience: audience(),
    subject: params.agentId,
    expiresInSeconds: expSec,
    jti,
  });

  await recordAuditEvent(db, {
    id: generateId(ID_PREFIXES.event),
    orgId: params.orgId,
    eventType: "token.issued",
    actorType: params.actorType,
    actorId: params.actorId,
    targetType: "agent",
    targetId: params.agentId,
    metadata: { token_type: "agent", jti },
  });

  return { access_token, expires_in: expSec };
}

export async function authenticateAccessToken(
  db: Database,
  token: string,
): Promise<ForgeIDTokenClaims> {
  const { publicKey } = getSigningMaterial();
  const payload = await verifyJwt(token, publicKey, { issuer: issuer(), audience: audience() });
  const jti = typeof payload.jti === "string" ? payload.jti : undefined;
  if (!jti) throw new AuthenticationError("Token missing jti");
  await assertTokenRowActive(db, jti);
  return payload as unknown as ForgeIDTokenClaims;
}

export async function verifyToken(db: Database, token: string): Promise<ForgeIDTokenClaims> {
  const claims = await authenticateAccessToken(db, token);
  const jti = claims.jti;

  await recordAuditEvent(db, {
    id: generateId(ID_PREFIXES.event),
    orgId: claims.org_id,
    eventType: "token.verified",
    actorType: "system",
    actorId: "forgeid_api",
    targetType: "token",
    targetId: jti,
    metadata: { sub: claims.sub },
  });

  return claims;
}

export async function revokeToken(
  db: Database,
  input: { jti: string; orgId: string; actorId: string; actorType: "user" | "agent" | "system"; reason?: string },
): Promise<void> {
  const [row] = await db.select().from(tokens).where(eq(tokens.jti, input.jti)).limit(1);
  if (!row) throw new NotFoundError("Token not found");
  if (row.orgId !== input.orgId) throw new NotFoundError("Token not found");

  await db
    .update(tokens)
    .set({
      revokedAt: new Date(),
      revokedReason: input.reason ?? null,
    })
    .where(eq(tokens.jti, input.jti));

  await recordAuditEvent(db, {
    id: generateId(ID_PREFIXES.event),
    orgId: input.orgId,
    eventType: "token.revoked",
    actorType: input.actorType,
    actorId: input.actorId,
    targetType: "token",
    targetId: input.jti,
    metadata: { reason: input.reason ?? null },
  });
}

export async function refreshToken(
  db: Database,
  refreshTokenJwt: string,
): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const { publicKey, privateKey, kid } = getSigningMaterial();
  const payload = await verifyJwt(refreshTokenJwt, publicKey, { issuer: issuer(), audience: audience() });
  if (payload.token_use !== "refresh") throw new AuthenticationError("Invalid refresh token");

  const jti = typeof payload.jti === "string" ? payload.jti : undefined;
  if (!jti) throw new AuthenticationError("Invalid refresh token");

  await assertTokenRowActive(db, jti);

  const orgId = typeof payload.org_id === "string" ? payload.org_id : undefined;
  const sessionId = typeof payload.session_id === "string" ? payload.session_id : undefined;
  const sub = typeof payload.sub === "string" ? payload.sub : undefined;
  if (!orgId || !sessionId || !sub) throw new AuthenticationError("Invalid refresh token");

  await db
    .update(tokens)
    .set({ revokedAt: new Date(), revokedReason: "rotated" })
    .where(eq(tokens.jti, jti));

  const result = await issueUserToken(db, { userId: sub, orgId, sessionId });

  await recordAuditEvent(db, {
    id: generateId(ID_PREFIXES.event),
    orgId,
    eventType: "token.refreshed",
    actorType: "user",
    actorId: sub,
    targetType: "token",
    targetId: jti,
    metadata: { rotated_from: jti },
  });

  return result;
}

export async function authenticatePasswordGrant(
  db: Database,
  input: { email: string; password: string; orgId: string },
): Promise<{ userId: string; orgId: string; sessionId: string }> {
  const devPassword = process.env.FORGEID_DEV_PASSWORD;
  if (!devPassword) {
    throw new InternalError("Password grants require FORGEID_DEV_PASSWORD to be set in this environment");
  }
  if (input.password !== devPassword) {
    throw new AuthenticationError("Invalid credentials");
  }

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.orgId, input.orgId), eq(users.email, input.email)))
    .limit(1);
  if (!user) throw new AuthenticationError("Invalid credentials");

  const sessionId = generateId(ID_PREFIXES.session);
  const sessionExpires = new Date(Date.now() + refreshTtlSec() * 1000);
  await db.insert(sessions).values({
    id: sessionId,
    userId: user.id,
    authMethod: "password",
    expiresAt: sessionExpires,
  });

  await recordAuditEvent(db, {
    id: generateId(ID_PREFIXES.event),
    orgId: input.orgId,
    eventType: "session.created",
    actorType: "user",
    actorId: user.id,
    targetType: "session",
    targetId: sessionId,
    metadata: {},
  });

  return { userId: user.id, orgId: input.orgId, sessionId };
}

export type SpawnAgentInput = {
  capabilities: string[];
  maxToolCalls: number;
  maxLifetimeMinutes: number;
  purpose?: string;
  model?: string;
  allowSpawn?: boolean;
  delegationChain?: DelegationChainEntry[];
};

export async function spawnDelegatedAgent(
  db: Database,
  parentClaims: ForgeIDTokenClaims,
  input: SpawnAgentInput,
): Promise<{ agent_id: string; access_token: string; expires_in: number; delegation_chain: DelegationChainEntry[] }> {
  const orgId = parentClaims.org_id;
  if (!orgId) throw new AuthenticationError("Missing org_id on parent token");

  const [org] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
  if (!org) throw new NotFoundError("Organization not found");

  const parentSub = parentClaims.sub;
  if (!parentSub) throw new AuthenticationError("Invalid parent token");

  const parentEntry: DelegationChainEntry = {
    sub: parentSub,
    sess: parentClaims.session_id,
    auth_method: parentClaims.auth_method,
    spawned_at: new Date().toISOString(),
  };
  const baseChain = [...(parentClaims.delegation_chain ?? [])];
  if (input.delegationChain?.length) {
    baseChain.push(...input.delegationChain);
  }
  baseChain.push(parentEntry);

  const agentId = generateId(ID_PREFIXES.agent);
  const parentUserId =
    parentClaims.identity_type === "user" ? parentSub : undefined;
  const parentAgentId =
    parentClaims.identity_type === "agent" ? parentSub : undefined;

  await db.insert(agents).values({
    id: agentId,
    orgId,
    parentUserId: parentUserId ?? null,
    parentAgentId: parentAgentId ?? null,
    purpose: input.purpose ?? null,
    model: input.model ?? null,
    capabilities: input.capabilities,
    maxToolCalls: input.maxToolCalls,
    maxLifetimeMinutes: input.maxLifetimeMinutes,
    status: "active",
    expiresAt: nowPlusMinutes(input.maxLifetimeMinutes),
  });

  const actorType = parentClaims.identity_type === "user" ? "user" : "agent";
  const { access_token, expires_in } = await issueAgentToken(db, {
    agentId,
    orgId,
    orgSlug: org.slug,
    delegationChain: baseChain,
    capabilities: input.capabilities,
    maxToolCalls: input.maxToolCalls,
    purpose: input.purpose,
    model: input.model,
    maxLifetimeMinutes: input.maxLifetimeMinutes,
    actorId: parentSub,
    actorType,
  });

  await recordAuditEvent(db, {
    id: generateId(ID_PREFIXES.event),
    orgId,
    eventType: "token.agent.spawned",
    actorType,
    actorId: parentSub,
    targetType: "agent",
    targetId: agentId,
    metadata: { delegation_chain: baseChain, capabilities: input.capabilities },
  });

  return { agent_id: agentId, access_token, expires_in, delegation_chain: baseChain };
}

export async function verifyParentAccessToken(
  db: Database,
  token: string,
): Promise<ForgeIDTokenClaims> {
  const claims = await authenticateAccessToken(db, token);
  const use = (claims as unknown as { token_use?: string }).token_use;
  if (use !== "access") throw new AuthenticationError("A parent access token is required");
  return claims;
}

export { hashApiKey };
