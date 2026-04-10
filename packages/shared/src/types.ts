// Identity types
export type IdentityType = 'user' | 'agent';
export type AgentType = 'delegated' | 'autonomous' | 'service';
export type AuthMethod = 'passkey' | 'magic_link' | 'otp' | 'sso' | 'api_key';
export type TokenType = 'access' | 'refresh' | 'agent';
export type SubjectType = 'user' | 'agent';
export type PrincipalType = 'user' | 'agent';

// Plan types
export type OrgPlan = 'free' | 'growth' | 'scale' | 'enterprise';

// Agent status
export type AgentStatus = 'active' | 'terminated' | 'expired';

// Token status
export type TokenStatus = 'active' | 'revoked' | 'expired';

// Webhook delivery status
export type DeliveryStatus = 'pending' | 'success' | 'failed';

// Delegation chain entry
export interface DelegationChainEntry {
  sub: string;
  sess?: string;
  auth_method?: AuthMethod;
  spawned_at?: string;
}

// JWT Claims for ForgeID tokens
export interface ForgeIDTokenClaims {
  iss: string;
  sub: string;
  aud: string[];
  iat: number;
  exp: number;
  jti: string;
  org_id: string;
  org_slug: string;
  identity_type: IdentityType;
  // User-specific
  email?: string;
  roles?: string[];
  permissions?: string[];
  session_id?: string;
  auth_method?: AuthMethod;
  // Agent-specific
  agent_type?: AgentType;
  delegation_chain?: DelegationChainEntry[];
  capabilities?: string[];
  max_tool_calls?: number;
  tool_calls_remaining?: number;
  purpose?: string;
  model?: string;
  agent_run_id?: string;
  allow_spawn?: boolean;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    doc_url: string;
  };
}

// Token response
export interface TokenResponse {
  access_token: string;
  token_type: 'Bearer';
  expires_in: number;
  refresh_token?: string;
  agent_id?: string;
}

// Agent whoami response (for MCP)
export interface AgentWhoAmI {
  agent_id: string;
  acting_for: string;
  org: string;
  capabilities: string[];
  cannot_do: string[];
  token_expires_in: string;
  tool_calls_remaining: number;
}

// Permission check response
export interface PermissionCheckResult {
  allowed: boolean;
  reason: string;
  evaluated_at: string;
}

// Audit event
export interface AuditEvent {
  id: string;
  org_id: string;
  event_type: string;
  actor_type: PrincipalType | 'system';
  actor_id: string;
  target_type?: string;
  target_id?: string;
  metadata: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

// Webhook event payload (Stripe-style)
export interface WebhookEvent {
  id: string;
  type: string;
  org_id: string;
  created_at: string;
  data: {
    object: Record<string, unknown>;
  };
}
