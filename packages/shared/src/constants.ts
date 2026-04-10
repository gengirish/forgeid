export const ID_PREFIXES = {
  org: 'org_',
  user: 'usr_',
  session: 'sess_',
  apiKey: 'key_',
  agent: 'agent_',
  token: 'tok_',
  role: 'role_',
  event: 'evt_',
  webhook: 'whk_',
  delivery: 'dlv_',
  signingKey: 'sk_',
} as const;

export const API_KEY_PREFIX = 'sk_live_';

export const PLAN_LIMITS = {
  free: { maus: 10_000, orgs: 1, agentTokensPerMonth: 50, auditRetentionDays: 7 },
  growth: { maus: 100_000, orgs: 5, agentTokensPerMonth: 5_000, auditRetentionDays: 90 },
  scale: { maus: Infinity, orgs: Infinity, agentTokensPerMonth: 50_000, auditRetentionDays: 365 },
  enterprise: { maus: Infinity, orgs: Infinity, agentTokensPerMonth: Infinity, auditRetentionDays: Infinity },
} as const;

export const AUDIT_EVENT_TYPES = [
  'user.created',
  'user.updated',
  'user.deleted',
  'session.created',
  'session.revoked',
  'token.issued',
  'token.verified',
  'token.refreshed',
  'token.revoked',
  'token.agent.spawned',
  'token.agent.terminated',
  'token.agent.expired',
  'apikey.created',
  'apikey.revoked',
  'apikey.used',
  'authz.check.allowed',
  'authz.check.denied',
  'role.created',
  'role.updated',
  'role.deleted',
  'role.assigned',
  'role.unassigned',
  'org.updated',
  'org.member.invited',
  'org.member.removed',
  'webhook.created',
  'webhook.deleted',
  'webhook.delivery.success',
  'webhook.delivery.failed',
  'signing_key.rotated',
  'agent.tool_call',
  'agent.spawn_child',
  'agent.self_revoked',
  'mcp.whoami',
  'mcp.check_permission',
  'mcp.context_block',
] as const;

export type AuditEventType = (typeof AUDIT_EVENT_TYPES)[number];

export const ERROR_CODES = {
  AUTHENTICATION_REQUIRED: 'authentication_required',
  PERMISSION_DENIED: 'permission_denied',
  NOT_FOUND: 'not_found',
  RATE_LIMITED: 'rate_limited',
  VALIDATION_ERROR: 'validation_error',
  TOKEN_EXPIRED: 'token_expired',
  TOKEN_REVOKED: 'token_revoked',
  CAPABILITY_NOT_GRANTED: 'capability_not_granted',
  AGENT_TERMINATED: 'agent_terminated',
  PLAN_LIMIT_EXCEEDED: 'plan_limit_exceeded',
  INTERNAL_ERROR: 'internal_error',
} as const;
