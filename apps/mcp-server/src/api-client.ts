import type { AgentWhoAmI, AuditEvent, ForgeIDTokenClaims, PermissionCheckResult } from "@forgeid/shared";
import { ID_PREFIXES } from "@forgeid/shared";
import { assertCapabilitiesSubset, capabilityAllowsAction, computeCannotDoHints } from "./permission-utils.js";

export type ForgeIdApiClientOptions = {
  baseUrl: string;
  agentToken: string;
};

type ApiEnvelope<T> = { data: T };
type ApiErrorBody = { error?: { message?: string; code?: string } };

export class ForgeIdApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "ForgeIdApiError";
  }
}

function trimBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

function formatRemaining(expSec: number): string {
  const now = Math.floor(Date.now() / 1000);
  let s = Math.max(0, expSec - now);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  s %= 60;
  if (m < 60) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  const h = Math.floor(m / 60);
  const mr = m % 60;
  return mr > 0 ? `${h}h ${mr}m` : `${h}h`;
}

function isoExpiry(expSec: number): string {
  return new Date(expSec * 1000).toISOString();
}

function resolveActingFor(claims: ForgeIDTokenClaims): string {
  if (claims.identity_type === "user") {
    return claims.email ? `${claims.email} (${claims.sub})` : claims.sub;
  }
  const chain = claims.delegation_chain ?? [];
  const userEntry = chain.find((e) => e.sub.startsWith(ID_PREFIXES.user));
  if (userEntry) {
    return `User (${userEntry.sub})`;
  }
  return "Unknown delegator";
}

export class ForgeIdApiClient {
  private readonly baseUrl: string;
  private agentToken: string;

  constructor(opts: ForgeIdApiClientOptions) {
    this.baseUrl = trimBaseUrl(opts.baseUrl);
    this.agentToken = opts.agentToken;
  }

  getToken(): string {
    return this.agentToken;
  }

  private async fetchJson<T>(
    path: string,
    init: RequestInit & { skipAuth?: boolean } = {},
  ): Promise<T> {
    const { skipAuth, ...req } = init;
    const headers = new Headers(req.headers);
    if (!headers.has("Content-Type") && req.body) {
      headers.set("Content-Type", "application/json");
    }
    if (!skipAuth && this.agentToken) {
      headers.set("Authorization", `Bearer ${this.agentToken}`);
    }
    const res = await fetch(`${this.baseUrl}${path}`, { ...req, headers });
    const text = await res.text();
    let body: unknown = undefined;
    try {
      body = text ? JSON.parse(text) : undefined;
    } catch {
      body = undefined;
    }

    if (!res.ok) {
      const msg =
        (body as ApiErrorBody)?.error?.message ??
        (text && text.length < 500 ? text : res.statusText);
      if (res.status === 401 || res.status === 403) {
        throw new ForgeIdApiError("Token expired or revoked. Please request a new token.", res.status);
      }
      throw new ForgeIdApiError(msg || `Request failed (${res.status})`, res.status);
    }
    return body as T;
  }

  async verifyTokenRaw(): Promise<ForgeIDTokenClaims> {
    const json = await this.fetchJson<ApiEnvelope<{ claims: ForgeIDTokenClaims; active: boolean }>>(
      "/v1/token/verify",
      {
        method: "POST",
        skipAuth: true,
        body: JSON.stringify({ token: this.agentToken }),
      },
    );
    return json.data.claims;
  }

  async getAgent(agentId: string): Promise<{
    id: string;
    org_id: string;
    capabilities: string[];
    max_tool_calls: number;
    tool_calls_used: number;
    purpose: string | null;
    model: string | null;
    expires_at: string | null;
  }> {
    const json = await this.fetchJson<
      ApiEnvelope<{
        agent: {
          id: string;
          org_id: string;
          capabilities: string[];
          max_tool_calls: number;
          tool_calls_used: number;
          purpose: string | null;
          model: string | null;
          expires_at: string | null;
        };
      }>
    >(`/v1/agents/${encodeURIComponent(agentId)}`, { method: "GET" });
    return json.data.agent;
  }

  async whoami(): Promise<AgentWhoAmI> {
    const claims = await this.verifyTokenRaw();
    const org = claims.org_slug ?? claims.org_id;
    const expSec = typeof claims.exp === "number" ? claims.exp : 0;
    const token_expires_in = expSec > 0 ? formatRemaining(expSec) : "unknown";

    if (claims.identity_type === "user") {
      const grants = claims.permissions ?? [];
      return {
        agent_id: claims.sub,
        acting_for: resolveActingFor(claims),
        org,
        capabilities: grants,
        cannot_do: computeCannotDoHints(grants),
        token_expires_in,
        tool_calls_remaining: claims.tool_calls_remaining ?? 0,
      };
    }

    const agentId = claims.sub;
    const agent = await this.getAgent(agentId);
    const grants = agent.capabilities?.length ? agent.capabilities : claims.capabilities ?? [];
    const tool_calls_remaining =
      claims.tool_calls_remaining ??
      Math.max(0, agent.max_tool_calls - agent.tool_calls_used);

    return {
      agent_id: agentId,
      acting_for: resolveActingFor(claims),
      org,
      capabilities: grants,
      cannot_do: computeCannotDoHints(grants),
      token_expires_in,
      tool_calls_remaining,
    };
  }

  async checkPermission(action: string, resource?: string): Promise<PermissionCheckResult> {
    const claims = await this.verifyTokenRaw();
    const principal_type = claims.identity_type === "agent" ? "agent" : "user";
    const principal_id = claims.sub;
    const json = await this.fetchJson<ApiEnvelope<PermissionCheckResult>>("/v1/permissions/check", {
      method: "POST",
      body: JSON.stringify({
        principal_type,
        principal_id,
        action,
        resource,
      }),
    });
    return json.data;
  }

  async spawnAgent(params: {
    capabilities: string[];
    max_lifetime_minutes: number;
    purpose: string;
    model?: string;
    max_tool_calls?: number;
  }): Promise<{ access_token: string; agent_id: string; expires_in: number }> {
    const claims = await this.verifyTokenRaw();
    const parentGrants =
      claims.identity_type === "agent" ? (claims.capabilities ?? []) : (claims.permissions ?? []);
    const subsetErr = assertCapabilitiesSubset(params.capabilities, parentGrants);
    if (subsetErr) {
      throw new ForgeIdApiError(subsetErr, 400);
    }

    const max_tool_calls =
      params.max_tool_calls ??
      claims.max_tool_calls ??
      claims.tool_calls_remaining ??
      50;

    const json = await this.fetchJson<
      ApiEnvelope<{ access_token: string; agent_id: string; expires_in: number }>
    >("/v1/agents", {
      method: "POST",
      body: JSON.stringify({
        capabilities: params.capabilities,
        max_lifetime_minutes: params.max_lifetime_minutes,
        purpose: params.purpose,
        model: params.model,
        max_tool_calls,
      }),
    });
    return {
      access_token: json.data.access_token,
      agent_id: json.data.agent_id,
      expires_in: json.data.expires_in,
    };
  }

  async revokeSelf(reason?: string): Promise<{ revoked: true; jti: string }> {
    const json = await this.fetchJson<ApiEnvelope<{ revoked: boolean; jti: string }>>(
      "/v1/token/revoke",
      {
        method: "POST",
        body: JSON.stringify({ token: this.agentToken, reason }),
      },
    );
    return { revoked: true as const, jti: json.data.jti };
  }

  async getContextBlock(): Promise<string> {
    const claims = await this.verifyTokenRaw();
    const who = await this.whoami();
    const expSec = typeof claims.exp === "number" ? claims.exp : 0;
    const expIso = expSec > 0 ? isoExpiry(expSec) : "unknown";
    const remaining = expSec > 0 ? formatRemaining(expSec) : "unknown";

    const maxCalls = claims.max_tool_calls;

    const authHint =
      claims.identity_type === "user"
        ? claims.auth_method
        : claims.delegation_chain?.find((e) => e.sub.startsWith(ID_PREFIXES.user))?.auth_method;

    const via = authHint ? ` via ${authHint}` : "";
    const delegateNote = claims.identity_type === "agent" ? " (delegated)" : "";
    const principalLabel = claims.identity_type === "agent" ? "Agent" : "User";

    const purpose = claims.purpose ?? "—";
    const model = claims.model ?? "—";

    const lines = [
      "=== FORGEID IDENTITY CONTEXT ===",
      `${principalLabel}: ${who.agent_id}${delegateNote}`,
      `Acting for: ${who.acting_for}${via}`,
      `Organization: ${who.org}`,
      "",
      `ALLOWED: ${who.capabilities.length ? who.capabilities.join(", ") : "(none)"}`,
      `DENIED: ${who.cannot_do.length ? who.cannot_do.join(", ") : "(none)"}`,
      "",
      `Token expires: ${expIso} (${remaining} remaining)`,
    ];
    if (maxCalls !== undefined) {
      lines.push(`Tool calls: ${who.tool_calls_remaining} of ${maxCalls} remaining`);
    } else {
      lines.push(`Tool calls remaining: ${who.tool_calls_remaining}`);
    }
    lines.push(`Purpose: ${purpose}`, `Model: ${model}`, "=== END FORGEID CONTEXT ===");
    return lines.join("\n");
  }

  async listAuditEvents(params?: { event_type?: string; limit?: number }): Promise<
    Array<{
      id: string;
      type: string;
      actor: string;
      target: string;
      timestamp: string;
    }>
  > {
    const limit = Math.min(params?.limit ?? 20, 100);
    const q = new URLSearchParams();
    if (params?.event_type) q.set("event_type", params.event_type);
    q.set("limit", String(limit));
    const json = await this.fetchJson<ApiEnvelope<{ events: AuditEvent[] }>>(
      `/v1/audit?${q.toString()}`,
      { method: "GET" },
    );
    return json.data.events.map((e) => ({
      id: e.id,
      type: e.event_type,
      actor: `${e.actor_type}:${e.actor_id}`,
      target: e.target_id ? `${e.target_type ?? "unknown"}:${e.target_id}` : "—",
      timestamp: e.created_at,
    }));
  }
}
