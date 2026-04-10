# ForgeID — Team Pitch Deck

**IntelliForge AI · Billion Dollar Build · 2026**

> Identity infrastructure built for AI agents.

8 weeks. 15 builders. One product.
Let's build the identity layer for the agentic internet.

`AuthN + AuthZ + Agent Identity` · `MCP Native` · `Vercel Edge + Fly.io` · `India-first pricing`

```js
// Spawn an AI agent — 4 lines
const agent = await iam.tokens.issueAgent({
  capabilities: ['crm:write'],
  maxLifetime: '2h',
  purpose: 'nightly sync'
})
```

| 8 wk | 5 | 15 |
|------|---|-----|
| Sprint | Squads | Builders |

---

## 01 / 11 — The Problem

### Every SaaS rebuilds IAM. Badly. Every time.

In 2026, every SaaS also deploys AI agents. Those agents need identity, scoped access, and audit trails. No existing product handles this end-to-end.

| Gap | Product | What's missing |
|-----|---------|----------------|
| AuthN gap | **Auth0 / Clerk** | Handles login only. No fine-grained permissions. No agent identity. No delegation chain. |
| Cost + DX gap | **Okta / Azure AD** | Enterprise-only. Terrible DX. ₹50L+ deals. Rebuilt from scratch for every new product. |
| Time + risk | **Custom RBAC** | 3–6 months to build per product. No agent model. Security vulnerabilities. Always abandoned. |

> The agentic era has no identity layer. **ForgeID is that layer.**

---

## 02 / 11 — The Solution

~~Not IAM with agent support bolted on.~~

**Identity infrastructure built from day one for agents.**

### Authentication
- Passkeys, magic link, OTP
- Enterprise SSO via SAML/OIDC
- MFA enforcement per org
- Custom JWT with any claims

### AuthZ Engine
- Fine-grained: `user:can:action:resource`
- RBAC + ABAC unified model
- Zanzibar-inspired, real-time
- <10ms verify at Vercel Edge

### Agent Identity
- Agents are first-class principals
- Delegation chain in every JWT
- MCP server — 6 IAM tools
- Capability limits + auto-revoke

---

## 03 / 11 — Product Surfaces

### One platform. Three ways in.

#### API Friendly
- OpenAPI-first spec + generated SDKs
- TypeScript, Python, Go, cURL
- Machine-readable errors with doc_url
- Idempotency keys on all writes
- Postman collection auto-generated

#### Agent Friendly
- MCP Server — 6 IAM tools
- `iam_check_permission` before writes
- `iam_spawn_agent_token` for sub-agents
- `iam_get_context_block` for prompts
- `iam_revoke_self` on task complete

#### Automation Friendly
- 40+ typed webhook events
- Real-time SSE event stream
- Terraform provider on registry
- GitHub Actions OIDC — zero secrets
- SCIM 2.0 for enterprise sync

---

## 04 / 11 — Architecture

### Vercel Edge + Fly.io — Private keys never leave Fly.

#### Vercel Edge
**Token Verify · JWKS · Rate Limiting**

JWT verify at the edge — no Fly.io roundtrip. Redis revocation via Upstash HTTP. JWKS cached in Edge Config, global in 300ms.

`< 10ms globally`

#### Fly.io · bom / sin / iad
**Token Core · KMS Sidecar · Webhooks**

Stateful business logic. KMS Sidecar on Fly internal network — no public port. Private keys in Fly Secrets only.

`RSA-4096 · Keys never in DB`

#### Verify path (hot path)
1. Client → Vercel Edge
2. Redis revocation check (~3ms)
3. JWKS from Edge Config (~0ms)
4. Verify JWT signature locally
5. Return claims → 200
   *(No Fly.io call on verify)*

#### Issue path
1. Vercel validates + rate-limits
2. Proxy to Fly Token Core
3. Token Core calls KMS Sidecar
4. KMS signs with Fly Secret key
5. JWT returned to client

#### Key rotation (monthly cron)
1. Fly cron generates RSA-4096
2. Private key → Fly Secrets
3. Public key → Vercel Edge Config
4. Global propagation ~300ms

---

## 05 / 11 — Market Size

### A clear path to $1 billion.

| $28B | 10K+ | $400M | ∞ |
|------|------|-------|---|
| Global IAM market | Indian B2B SaaS | Perplexity India | Agent tokens |
| 14% CAGR | All rebuilding IAM | 2026 investment | New metered surface |

#### Expansion path to $1B ARR

**India SaaS** (10K companies, ₹4,999/mo)
→ **SEA + Global** (Agent-native SaaS, $99/mo)
→ **Agent Era** (Per-token metered, ₹0.10/token)
→ **Enterprise** (Fortune 500, $500K+ ACV)

---

## 06 / 11 — Competition

### Everyone solves half. We solve all of it.

Clerk handles login. Permit.io handles permissions. WorkOS handles SSO. Nobody handles agents. ForgeID is the only product that ships all five.

| Product | AuthN | Fine-grained AuthZ | Agent Identity | MCP Server | India pricing |
|---------|:-----:|:-------------------:|:--------------:|:----------:|:-------------:|
| **ForgeID ✦** | ✓ | ✓ | ✓ | ✓ | ✓ |
| Clerk / Auth0 | ✓ | ✕ | ✕ | ✕ | ✕ |
| Okta / Azure AD | ✓ | ⚠ | ✕ | ✕ | ✕ $$$ |
| WorkOS | ✓ | ✕ | ✕ | ✕ | ✕ |
| Permit.io | ✕ | ✓ | ✕ | ✕ | ✕ |

---

## 07 / 11 — Business Model

### Usage-based + seats. Stripe-style billing.

#### Starter — Free forever
- 10K MAUs
- 1 org
- Basic RBAC
- 50 agent tokens/mo

#### Growth — ₹4,999/month ⭐ Most popular
- 100K MAUs
- Custom roles + AuthZ
- Audit logs 90 days
- 5,000 agent tokens/mo
- Webhooks + stream

#### Scale — ₹19,999/month
- Unlimited MAUs
- SSO + SAML + SCIM
- SIEM export + SLA
- 50K agent tokens/mo
- Terraform provider

#### Add-ons
| Add-on | Price |
|--------|-------|
| Agent token overage | ₹0.10 / token |
| SSO connection | ₹999 |
| Audit export | ₹499 |
| Enterprise ACV | ₹25L – ₹1Cr+ |

---

## 08 / 11 — Your Squad

### Pick your squad. Own it end-to-end.

15 people. 5 squads. Every squad ships something real to production. No busy work — you build, you own, you demo.

---

### 🔐 Token Core
**You own the security backbone**

**Roles:** Backend Engineer ×2
**Stack:** `Hono` · `Fly.io` · `Upstash Redis` · `Node.js`

What you ship:
- JWT issue / refresh / revoke pipeline
- KMS sidecar on Fly.io private network
- RSA-4096 key rotation cron
- Redis revocation layer via Upstash

---

### 🤖 Agent & MCP
**You define how AI agents get identity**

**Roles:** MCP Engineer ×1 · SDK/CLI Lead ×1
**Stack:** `MCP Protocol` · `TypeScript` · `npm` · `OpenAPI`

What you ship:
- MCP Server with 6 IAM tools
- Agent delegation chain in JWT
- TypeScript SDK published to npm
- CLI with interactive auth flows

---

### 🖥️ Product & Dashboard
**You build what customers see every day**

**Roles:** Full-stack ×2 · UI/UX Lead ×1
**Stack:** `Next.js` · `Prisma` · `Tailwind` · `Vercel`

What you ship:
- Multi-tenant dashboard from scratch
- Design system + component library
- Real-time audit log explorer
- API key management console

---

### ⚙️ Infra & DevOps
**You keep it fast, secure, and global**

**Roles:** DevOps Engineer ×2
**Stack:** `Fly.io` · `Vercel` · `Terraform` · `GitHub Actions`

What you ship:
- Vercel Edge + Fly.io deployment
- KMS secrets management pipeline
- CI/CD with GitHub Actions OIDC
- Terraform provider on registry

---

### 📈 GTM & Content
**You take ForgeID to 10,000 SaaS teams**

**Roles:** Growth ×2 · Content ×1 · Pitch & Demo ×2
**Stack:** `Marketing` · `Docs` · `Outreach` · `Demo`

What you ship:
- Landing page + SEO pipeline
- Developer docs + blog
- 50 Indian SaaS pilot outreach
- June 9 demo day presentation

---

## 09 / 11 — Why Join

### This isn't a job. It's a founding story.

You'll tell people you were here when identity for AI agents was built from scratch. Here's what makes this different.

#### 🏗️ Build from zero
No legacy code. No tech debt. You're not maintaining — you're creating. Every line of code, every design decision, every architecture choice is yours.

#### 📦 Ship to real users in 8 weeks
This isn't a side project. We have a roadmap, a demo day (June 9), and real SaaS companies waiting to pilot. You'll see your work used in production.

#### 🧠 Work on cutting-edge infra
MCP protocol, Zanzibar-inspired AuthZ, Vercel Edge Functions, Fly.io KMS, agent delegation chains — this is the frontier of identity engineering.

#### 📝 Resume-defining work
"I built the identity layer for AI agents" is a career-defining line. This is the kind of project top engineers wish they'd joined early.

### How we work together

| # | Principle | What it means |
|---|-----------|---------------|
| 01 | **Ownership over tickets** | You don't get assigned tasks. You own outcomes. |
| 02 | **Ship > plan** | Working code beats slide decks. Demo day is real. |
| 03 | **Transparent by default** | Everyone sees the roadmap, the metrics, and the decisions. |
| 04 | **Disagree, then commit** | Debate the approach. Once decided, execute together. |

---

## 10 / 11 — 8-Week Roadmap

### Working business by June 9.

| Week | Milestone | Details |
|------|-----------|---------|
| **Wk 1–2** 🟢 | Token Core live | Issue · Refresh · Revoke · Verify · KMS on Fly.io bom |
| **Wk 3–4** 🟢 | Agent + MCP layer | Agent delegation · MCP 6 tools · Context block · Webhook worker |
| **Wk 5–6** | GTM + first customers | Landing page live · Docs · 50 Indian SaaS outreach · 3+ pilots |
| **Wk 7** | Perplexity Computer sprint | Security audit · Auto-docs · SDK generation · SCIM · Terraform stub |
| **Wk 8** | June 9 demo day | Human → agent → MCP → audit → webhook → revoke live on stage |

### June 9 — Live Demo Script

1. Girish logs in via passkey — dashboard live
2. Creates API key for CRM app
3. CRM spawns agent token — JWT decoded on screen
4. Agent calls `iam_check_permission` via MCP
5. Denied action logged → audit event appears
6. Webhook fires to terminal → shown live
7. One click from dashboard kills agent
8. Token verify returns 401 immediately

---

## 11 / 11 — Join the Build

### The agentic era needs an identity layer. Let's build it.

This is 8 weeks to build something real, ship it to production, and put it on your portfolio forever. No filler roles — everyone builds.

| ⏰ 8-week sprint | 🎯 Clear deliverables | 🎤 Demo day is real | 🤝 Girish has your back |
|---|---|---|---|
| April 14 → June 9. Intense, focused, meaningful. | Every squad has a ship list. No ambiguity on what 'done' looks like. | June 9 — live demo in front of judges. Your code runs on stage. | 14 years of experience. Architecture decisions, code reviews, and pair programming. |

### What I need from you

- Show up ready to build — not just attend
- Own your squad's deliverables fully
- Communicate blockers early, not late
- Push code that you're proud of
- Help your teammates when they're stuck
- Be at demo day — your work deserves the stage

---

## Are you in?

Talk to Girish. Pick your squad. Start building.

`forgeid.ai` · `contact@intelliforge.tech` · `intelliforge.tech`
