const API_KEY_PREFIX = "sk_live_";

export type AgentStatus = "active" | "terminated";

export interface MockAgent {
  id: string;
  purpose: string;
  model: string;
  capabilities: string[];
  status: AgentStatus;
  spawnedAt: string;
  expiresAt: string;
}

export interface MockApiKey {
  id: string;
  maskedSecret: string;
  name: string;
  scopes: string[];
  lastUsedAt: string | null;
  createdAt: string;
}

export type AuditOutcome = "allowed" | "denied" | "info";

export interface MockAuditEvent {
  id: string;
  type: string;
  outcome: AuditOutcome;
  actor: string;
  resource: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

export interface MockWebhook {
  id: string;
  url: string;
  status: "active" | "inactive";
  events: string[];
  createdAt: string;
}

export interface MockDelivery {
  id: string;
  webhookId: string;
  status: "success" | "failed" | "pending";
  statusCode: number | null;
  attemptedAt: string;
  eventType: string;
}

export interface MockRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export const mockStats = {
  activeSessions: 1842,
  agentTokens24h: 128_400,
  permissionChecks: 2_891_000,
  deniedActions: 312,
};

export const mockAgents: MockAgent[] = [
  {
    id: "agent_7k2m9p",
    purpose: "Support triage",
    model: "gpt-4.1",
    capabilities: ["read:tickets", "write:notes"],
    status: "active",
    spawnedAt: "2026-04-10T08:12:00Z",
    expiresAt: "2026-04-10T20:12:00Z",
  },
  {
    id: "agent_3nq8wx",
    purpose: "CI release notes",
    model: "claude-3-5-sonnet",
    capabilities: ["read:repos", "write:docs"],
    status: "active",
    spawnedAt: "2026-04-09T14:00:00Z",
    expiresAt: "2026-04-11T14:00:00Z",
  },
  {
    id: "agent_1ab4cd",
    purpose: "Data export",
    model: "gpt-4o-mini",
    capabilities: ["read:warehouse"],
    status: "terminated",
    spawnedAt: "2026-04-08T09:30:00Z",
    expiresAt: "2026-04-08T18:30:00Z",
  },
];

export const mockApiKeys: MockApiKey[] = [
  {
    id: "key_01",
    maskedSecret: `${API_KEY_PREFIX}4xKj…9mN2`,
    name: "Production — API",
    scopes: ["agents:write", "audit:read"],
    lastUsedAt: "2026-04-10T15:42:11Z",
    createdAt: "2026-03-01T10:00:00Z",
  },
  {
    id: "key_02",
    maskedSecret: `${API_KEY_PREFIX}pL8v…qR3s`,
    name: "Staging",
    scopes: ["agents:read"],
    lastUsedAt: "2026-04-09T22:01:00Z",
    createdAt: "2026-02-14T12:30:00Z",
  },
  {
    id: "key_03",
    maskedSecret: `${API_KEY_PREFIX}zY1x…hJ7k`,
    name: "Local dev",
    scopes: ["agents:write", "roles:read", "webhooks:write"],
    lastUsedAt: null,
    createdAt: "2026-04-05T08:15:00Z",
  },
];

export const mockAuditEvents: MockAuditEvent[] = [
  {
    id: "evt_001",
    type: "permission.check",
    outcome: "allowed",
    actor: "agent_7k2m9p",
    resource: "ticket:8821",
    timestamp: "2026-04-10T15:44:02Z",
    metadata: { action: "read", scope: "tickets:read", latencyMs: 4 },
  },
  {
    id: "evt_002",
    type: "permission.check",
    outcome: "denied",
    actor: "agent_3nq8wx",
    resource: "billing:export",
    timestamp: "2026-04-10T15:40:18Z",
    metadata: { action: "write", reason: "missing_scope", required: "billing:write" },
  },
  {
    id: "evt_003",
    type: "token.issued",
    outcome: "info",
    actor: "usr_admin",
    resource: "agent_7k2m9p",
    timestamp: "2026-04-10T15:38:55Z",
    metadata: { ttlSeconds: 43200, scopes: ["read:tickets", "write:notes"] },
  },
  {
    id: "evt_004",
    type: "session.created",
    outcome: "info",
    actor: "usr_ops",
    resource: "sess_9f2a",
    timestamp: "2026-04-10T15:12:00Z",
    metadata: { ip: "203.0.113.10", device: "chrome-macos" },
  },
  {
    id: "evt_005",
    type: "webhook.delivery",
    outcome: "allowed",
    actor: "system",
    resource: "whk_01",
    timestamp: "2026-04-10T14:58:33Z",
    metadata: { statusCode: 200, durationMs: 142 },
  },
];

export const mockWebhooks: MockWebhook[] = [
  {
    id: "whk_01",
    url: "https://api.acme.com/hooks/forgeid",
    status: "active",
    events: ["audit.event", "agent.spawned", "agent.terminated"],
    createdAt: "2026-01-20T11:00:00Z",
  },
  {
    id: "whk_02",
    url: "https://hooks.slack.com/services/T00/B00/xxx",
    status: "active",
    events: ["permission.denied"],
    createdAt: "2026-02-02T09:15:00Z",
  },
  {
    id: "whk_03",
    url: "https://legacy.internal/events",
    status: "inactive",
    events: ["audit.event"],
    createdAt: "2025-11-01T16:45:00Z",
  },
];

export const mockDeliveries: MockDelivery[] = [
  {
    id: "dlv_101",
    webhookId: "whk_01",
    status: "success",
    statusCode: 200,
    attemptedAt: "2026-04-10T15:44:05Z",
    eventType: "audit.event",
  },
  {
    id: "dlv_102",
    webhookId: "whk_01",
    status: "failed",
    statusCode: 502,
    attemptedAt: "2026-04-10T14:10:22Z",
    eventType: "agent.spawned",
  },
  {
    id: "dlv_103",
    webhookId: "whk_02",
    status: "success",
    statusCode: 200,
    attemptedAt: "2026-04-10T15:30:00Z",
    eventType: "permission.denied",
  },
  {
    id: "dlv_104",
    webhookId: "whk_01",
    status: "pending",
    statusCode: null,
    attemptedAt: "2026-04-10T15:45:00Z",
    eventType: "audit.event",
  },
];

export const mockRoles: MockRole[] = [
  {
    id: "role_admin",
    name: "Org Admin",
    description: "Full access within the organization.",
    permissions: ["*"],
  },
  {
    id: "role_builder",
    name: "Agent Builder",
    description: "Create and manage agents and API keys.",
    permissions: ["agents:write", "agents:read", "keys:write", "keys:read"],
  },
  {
    id: "role_viewer",
    name: "Security Viewer",
    description: "Read-only audit and roles.",
    permissions: ["audit:read", "roles:read"],
  },
];

export function getDeliveriesForWebhook(webhookId: string): MockDelivery[] {
  return mockDeliveries.filter((d) => d.webhookId === webhookId);
}
