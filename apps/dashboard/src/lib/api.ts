const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  method: string,
  path: string,
  opts?: { body?: unknown; token?: string; query?: Record<string, string> },
): Promise<T> {
  const url = new URL(path, API_BASE);
  if (opts?.query) {
    for (const [k, v] of Object.entries(opts.query)) {
      if (v) url.searchParams.set(k, v);
    }
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts?.token) headers["Authorization"] = `Bearer ${opts.token}`;

  const res = await fetch(url.toString(), {
    method,
    headers,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json?.error?.code ?? "unknown",
      json?.error?.message ?? `HTTP ${res.status}`,
    );
  }

  return json?.data as T;
}

export const api = {
  // Auth
  login: (username: string, password: string, org_id: string) =>
    request<{ access_token: string; refresh_token: string; token_type: string; expires_in: number }>(
      "POST", "/v1/token", { body: { grant_type: "password", username, password, org_id } },
    ),

  refresh: (refresh_token: string) =>
    request<{ access_token: string; refresh_token: string; token_type: string; expires_in: number }>(
      "POST", "/v1/token", { body: { grant_type: "refresh_token", refresh_token } },
    ),

  createOrg: (data: { org_name: string; org_slug: string; owner_email: string; owner_name: string; plan?: string }) =>
    request<{ org: any; user: any }>("POST", "/v1/orgs", { body: data }),

  // Org
  getOrg: (token: string) =>
    request<{ org: any }>("GET", "/v1/orgs/me", { token }),

  updateOrg: (token: string, data: { name?: string }) =>
    request<{ org: any }>("PATCH", "/v1/orgs/me", { token, body: data }),

  getMembers: (token: string) =>
    request<{ members: any[] }>("GET", "/v1/orgs/me/members", { token }),

  inviteMember: (token: string, data: { email: string; name: string; role: string }) =>
    request<{ member: any }>("POST", "/v1/orgs/me/members", { token, body: data }),

  removeMember: (token: string, userId: string) =>
    request<{ ok: boolean }>("DELETE", `/v1/orgs/me/members/${userId}`, { token }),

  changeMemberRole: (token: string, userId: string, role: string) =>
    request<{ member: any }>("POST", `/v1/orgs/me/members/${userId}/role`, { token, body: { role } }),

  // Agents
  listAgents: (token: string) =>
    request<{ agents: any[] }>("GET", "/v1/agents", { token }),

  getAgent: (token: string, id: string) =>
    request<{ agent: any }>("GET", `/v1/agents/${id}`, { token }),

  getAgentChain: (token: string, id: string) =>
    request<{ agent_id: string; delegation_chain: any[] }>("GET", `/v1/agents/${id}/chain`, { token }),

  spawnAgent: (token: string, data: {
    capabilities: string[];
    max_tool_calls: number;
    max_lifetime_minutes: number;
    purpose?: string;
    model?: string;
  }) =>
    request<{ agent_id: string; access_token: string; expires_in: number; delegation_chain: any[] }>(
      "POST", "/v1/agents", { token, body: data },
    ),

  terminateAgent: (token: string, id: string) =>
    request<{ terminated: boolean; agent_id: string }>("DELETE", `/v1/agents/${id}`, { token }),

  // API Keys
  listApiKeys: (token: string) =>
    request<{ api_keys: any[] }>("GET", "/v1/api-keys", { token }),

  createApiKey: (token: string, data: { name: string; scopes: string[] }) =>
    request<{ id: string; raw_key: string; name: string; key_prefix: string; scopes: string[]; org_id: string; created_at: string }>(
      "POST", "/v1/api-keys", { token, body: data },
    ),

  patchApiKey: (token: string, id: string, data: { name?: string; scopes?: string[] }) =>
    request<any>("PATCH", `/v1/api-keys/${id}`, { token, body: data }),

  revokeApiKey: (token: string, id: string) =>
    request<{ revoked: boolean; id: string }>("DELETE", `/v1/api-keys/${id}`, { token }),

  // Permissions
  checkPermission: (token: string, action: string, resource?: string) =>
    request<{ allowed: boolean; reason: string }>("POST", "/v1/permissions/check", {
      token, body: { action, resource },
    }),

  // Roles
  listRoles: (token: string) =>
    request<{ roles: any[] }>("GET", "/v1/roles", { token }),

  createRole: (token: string, data: { name: string; description?: string; permissions: string[] }) =>
    request<{ role: any }>("POST", "/v1/roles", { token, body: data }),

  // Audit
  queryAudit: (token: string, params?: { event_type?: string; limit?: string; cursor?: string }) =>
    request<{ events: any[]; cursor: string | null; has_more: boolean }>(
      "GET", "/v1/audit", { token, query: params as Record<string, string> },
    ),

  // Webhooks
  listWebhooks: (token: string) =>
    request<{ webhooks: any[] }>("GET", "/v1/webhooks", { token }),

  createWebhook: (token: string, data: { url: string; events: string[] }) =>
    request<{ webhook: any }>("POST", "/v1/webhooks", { token, body: data }),

  deleteWebhook: (token: string, id: string) =>
    request<{ deleted: boolean; id: string }>("DELETE", `/v1/webhooks/${id}`, { token }),

  getDeliveries: (token: string, webhookId: string) =>
    request<{ deliveries: any[] }>("GET", `/v1/webhooks/${webhookId}/deliveries`, { token }),

  // Token
  verifyToken: (token: string) =>
    request<{ claims: any; active: boolean }>("POST", "/v1/token/verify", { body: { token } }),
};
