<p align="center">
  <strong>ForgeID</strong><br>
  Identity infrastructure for AI agents.
</p>

<p align="center">
  <a href="https://forgeid.ai">Website</a> ·
  <a href="https://api.forgeid.ai/health">API</a> ·
  <a href="https://app.forgeid.ai">Dashboard</a> ·
  <a href="https://forgeid.ai/docs">Docs</a>
</p>

---

ForgeID is an identity and access management platform purpose-built for the agentic era. It provides authentication, fine-grained authorization, and first-class agent identity — so AI agents get scoped credentials, delegation chains, and instant revocation out of the box.

**Not IAM with agent support bolted on. Identity infrastructure built for agents.**

## Why this exists

Every SaaS company in 2026 deploys AI agents. Those agents touch CRMs, invoices, and customer data. The problem: **no existing identity product handles agents as first-class principals.**

- **Auth0 / Clerk** — Login only. No fine-grained permissions. No agent identity.
- **Okta / Azure AD** — Enterprise-only. Terrible DX. No agent model.
- **Custom RBAC** — 3–6 months per product. No delegation chains. Security holes.

ForgeID solves all of it in one platform.

## What it does

```
Human authenticates → Spawns AI agent with scoped capabilities →
Agent checks permissions via MCP → Every action audited →
One click kills the agent → Token rejected instantly
```

### Core capabilities

| Capability | Description |
|-----------|-------------|
| **Authentication** | Password, API key, and agent delegation grants |
| **Fine-grained AuthZ** | `user:can:action:resource` — RBAC with real-time evaluation |
| **Agent Identity** | Agents are first-class principals with delegation chains in every JWT |
| **MCP Server** | 6 IAM tools — `whoami`, `check_permission`, `spawn_agent`, `revoke_self`, and more |
| **Audit Log** | Every IAM event logged with cursor-based pagination and filtering |
| **Webhooks** | Stripe-style typed events with HMAC-SHA256 signatures |
| **Instant Revocation** | Kill any agent or API key — effective immediately, not eventually |

### SDK example

```typescript
// Spawn a scoped AI agent — 5 lines
const agent = await forgeId.agents.spawn({
  capabilities: ['crm:write', 'invoice:read'],
  maxLifetimeMinutes: 120,
  purpose: 'nightly CRM reconciliation',
  model: 'claude-sonnet-4-20250514',
  maxToolCalls: 50
});
// agent.accessToken contains a JWT with full delegation chain
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                               │
│              SDK  ·  Dashboard  ·  MCP Agent                 │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
          ┌────────────┴────────────┐
          │     ForgeID API         │
          │     (Hono · Fly.io)     │
          │                         │
          │  Token Issue / Revoke   │
          │  RBAC Engine            │
          │  Agent Delegation       │
          │  Webhook Dispatch       │
          │  Audit Writer           │
          └────────────┬────────────┘
                       │
          ┌────────────┴────────────┐
          │   Neon PostgreSQL       │
          │   (Serverless)          │
          │                         │
          │  Orgs · Users · Agents  │
          │  Roles · API Keys       │
          │  Sessions · Audit Events│
          │  Webhooks · Signing Keys│
          └─────────────────────────┘
```

**Key design decisions:**
- **RSA-4096 signing keys** generated at startup — private keys never touch the database
- **JWT with delegation chains** — every agent token carries cryptographic proof of who authorized it
- **Instant revocation** — token blocklist checked on every verify call
- **Hono on Fly.io** — sub-50ms response times, auto-scaling, multi-region

## Project structure

```
forgeid/
├── apps/
│   ├── api/            # Hono REST API (Fly.io)
│   ├── dashboard/      # Next.js 15 — marketing site + admin UI (Vercel)
│   └── mcp-server/     # MCP server for agent IAM tools
├── packages/
│   ├── db/             # Drizzle ORM schema + migrations (Neon)
│   ├── shared/         # Types, constants, error classes
│   └── sdk/            # TypeScript client SDK
├── docs/               # Pitch deck, demo script
└── test-e2e.ts         # Comprehensive E2E test suite (98 tests)
```

**Stack:** TypeScript · Hono · Next.js 15 · Drizzle ORM · Neon PostgreSQL · Tailwind CSS 4 · pnpm workspaces · Turborepo

## Live deployment

| Service | URL | Platform |
|---------|-----|----------|
| **Website** | [forgeid.ai](https://forgeid.ai) | Vercel |
| **API** | [api.forgeid.ai](https://api.forgeid.ai/health) | Fly.io (Singapore) |
| **Dashboard** | [app.forgeid.ai](https://app.forgeid.ai) | Vercel |

## Getting started

```bash
# Prerequisites: Node.js ≥ 20, pnpm
git clone https://github.com/your-org/forgeid.git
cd forgeid
pnpm install

# Set up environment
cp .env.example .env
# Edit .env with your Neon DATABASE_URL

# Push schema to database
pnpm db:push

# Run all services
pnpm dev:all        # API (port 4000) + Dashboard (port 3000)
pnpm dev:mcp        # MCP server (port 4100)

# Run E2E tests
npx tsx test-e2e.ts
```

## API surface

All endpoints return `{ data: ... }` on success and `{ error: { code, message, doc_url } }` on failure.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| `POST` | `/v1/orgs` | Create organization |
| `GET` | `/v1/orgs/me` | Get current org |
| `POST` | `/v1/token` | Issue token (password, refresh, API key) |
| `POST` | `/v1/token/verify` | Verify any token |
| `GET` | `/v1/token/jwks` | Public JWKS endpoint |
| `POST` | `/v1/agents` | Spawn delegated agent |
| `GET` | `/v1/agents` | List agents |
| `DELETE` | `/v1/agents/:id` | Terminate agent |
| `POST` | `/v1/api-keys` | Create API key |
| `DELETE` | `/v1/api-keys/:id` | Revoke API key |
| `POST` | `/v1/permissions/check` | Check permission |
| `GET/POST` | `/v1/roles` | List / create roles |
| `GET` | `/v1/audit` | Query audit log |
| `GET/POST/DELETE` | `/v1/webhooks` | Manage webhooks |
| `POST` | `/v1/orgs/me/members` | Invite member |

## E2E test coverage

98 assertions across 20 scenarios — runs against the live API:

1. Health + JWKS
2. Org bootstrap + duplicate rejection
3. Human login (password grant)
4. Token verification + claims
5. Token refresh + rotation
6. Org read + update
7. Member invite, role change, removal
8. Custom role creation (RBAC)
9. API key lifecycle (create, patch)
10. API key authentication
11. Agent spawning with delegation
12. Agent token verification + chain
13. Permission checks (allowed + denied)
14. Webhook lifecycle
15. Agent list + detail + chain
16. Audit log + cursor pagination
17. API key revocation
18. Agent termination
19. Revoked token rejection
20. Webhook cleanup

## License

MIT
