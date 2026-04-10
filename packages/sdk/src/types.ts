/**
 * SDK types: re-exports from `@forgeid/shared` plus API-aligned shapes for the HTTP client.
 */
export type {
  IdentityType,
  AgentType,
  AuthMethod,
  TokenType,
  SubjectType,
  PrincipalType,
  OrgPlan,
  AgentStatus,
  TokenStatus,
  DeliveryStatus,
  DelegationChainEntry,
  ForgeIDTokenClaims,
  ApiResponse,
  ApiError,
  TokenResponse,
  AgentWhoAmI,
  PermissionCheckResult,
  AuditEvent,
  WebhookEvent,
} from '@forgeid/shared';

export type {
  VerifyTokenInput,
  RevokeTokenInput,
  CreateApiKeyInput,
  CreateAgentInput,
  CreateRoleInput,
  CreateWebhookInput,
  QueryAuditInput,
  UpdateOrgInput,
  IssueTokenInput,
} from '@forgeid/shared';

export {
  IssueTokenSchema,
  VerifyTokenSchema,
  RevokeTokenSchema,
  CreateApiKeySchema,
  CreateAgentSchema,
  CheckPermissionSchema,
  CreateRoleSchema,
  CreateWebhookSchema,
  QueryAuditSchema,
  UpdateOrgSchema,
} from '@forgeid/shared';

export {
  ID_PREFIXES,
  API_KEY_PREFIX,
  PLAN_LIMITS,
  AUDIT_EVENT_TYPES,
  ERROR_CODES,
} from '@forgeid/shared';

export type { AuditEventType } from '@forgeid/shared';

export {
  ForgeIDError,
  AuthenticationError,
  PermissionError,
  NotFoundError,
  RateLimitError,
  ValidationError,
  InternalError,
} from '@forgeid/shared';

/**
 * Permission check request body as accepted by `POST /v1/permissions/check`.
 * (Broader than `CheckPermissionSchema` in shared, which only validates action/resource.)
 */
export interface CheckPermissionInput {
  principal_type: 'user' | 'agent';
  principal_id: string;
  action: string;
  resource?: string;
}

/** Agent record from `GET /v1/agents` and `GET /v1/agents/:id`. */
export interface Agent {
  id: string;
  org_id: string;
  status: import('@forgeid/shared').AgentStatus;
  purpose: string | null;
  model: string | null;
  capabilities: string[];
  max_tool_calls: number;
  tool_calls_used: number;
  max_lifetime_minutes: number | null;
  expires_at: string | null;
  created_at: string;
}

/** API key summary from `GET /v1/api-keys`. */
export interface ApiKeyInfo {
  id: string;
  org_id: string;
  name: string;
  masked_key: string;
  scopes: string[];
  revoked_at: string | null;
  last_used_at: string | null;
  expires_at: string | null;
  created_at: string;
}

/** Webhook endpoint without signing secret (list responses). */
export interface WebhookEndpoint {
  id: string;
  org_id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
  updated_at: string;
}

/** Webhook delivery row from `GET /v1/webhooks/:id/deliveries`. */
export interface WebhookDelivery {
  id: string;
  webhook_id: string;
  event_id: string;
  status: import('@forgeid/shared').DeliveryStatus;
  attempts: number;
  response_status: number | null;
  last_attempt_at: string | null;
  next_retry_at: string | null;
  created_at: string;
}

/** Organization from `GET/PATCH /v1/orgs/me`. */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: import('@forgeid/shared').OrgPlan;
  created_at: string;
  updated_at: string;
}

/** Org member from `GET /v1/orgs/me/members`. */
export interface User {
  user_id: string;
  org_id: string;
  email: string;
  name: string | null;
  role: string;
  email_verified: boolean;
  created_at: string;
}

/** Custom role from `GET/POST /v1/roles`. */
export interface Role {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  permissions: string[];
  is_system: boolean;
  created_at: string;
}

/**
 * JSON Web Key Set document (`GET /v1/token/jwks`).
 */
export interface JsonWebKeySet {
  keys: ReadonlyArray<Record<string, unknown>>;
}
