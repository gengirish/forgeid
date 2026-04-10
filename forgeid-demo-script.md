# ForgeID — June 9 Live Demo Script
# Billion Dollar Build · IntelliForge AI
# Presenter: Girish Bhiremath · Runtime: 8 minutes

---

## SETUP CHECKLIST (10 min before)

### Screens
- [ ] **Left monitor**: forgeid.ai dashboard (logged in as girish@intelliforge.tech)
- [ ] **Right monitor**: Split — terminal top, MCP client bottom
- [ ] **Browser tab 2**: jwt.io ready to paste
- [ ] **Browser tab 3**: forgeid.ai/docs open
- [ ] **Font size**: 18px terminal, 16px browser — judges are watching a stream

### Terminal windows
- [ ] T1: `forgeid audit tail --org intelliforge` (live audit stream)
- [ ] T2: curl commands pre-typed, not yet run
- [ ] T3: ngrok / webhook inspector showing `Waiting for events...`

### Pre-issued tokens
- [ ] `$HUMAN_TOKEN` already set in env (from passkey login)
- [ ] Backup: static response JSON files ready as `cat demo-*.json`

---

## OPENING (0:00 – 0:40)

> *Stand, face camera. No slides yet.*

**SPOKEN:**
"Every company in 2026 is deploying AI agents.
Those agents touch your CRM, your invoices, your customer data.

Here's the problem nobody's solved:
when your AI agent acts — how does the system know
what it's allowed to do,
who authorized it,
and how do you kill it instantly if something goes wrong?

We're ForgeID. Identity infrastructure built for AI agents.
Not IAM with agent support bolted on.
Identity your agents can actually use.

This is what we built in 8 weeks with Perplexity Computer."

---

## ACT 1 · HUMAN LOGS IN (0:40 – 1:30)

> *Switch to dashboard*

**SPOKEN:**
"First — a human. Me. Logging into the ForgeID dashboard."

**ACTION:** Tap passkey authenticator → dashboard loads

**SHOW:** Dashboard home — org: intelliforge, active sessions panel, live token inspector

**SPOKEN:**
"The dashboard shows every active session, every API key,
and a live feed of all IAM events.

Let me create an API key for our CRM application."

**ACTION:** API Keys → Create New → name "CRM Production" → scopes: `crm:write, invoice:read` → Create

**SHOW:** API key displayed: `sk_live_4xKj...` — shown once

**SPOKEN:**
"Shown once — Stripe-style.
Only a SHA-256 hash of this key ever touches our database.
The signing key for every JWT lives in Fly Secrets —
it has never been in a database. Ever."

---

## ACT 2 · SPAWN AN AGENT (1:30 – 3:00)

> *Switch to terminal T2*

**SPOKEN:**
"Now the interesting part.
Our CRM app needs to run a nightly reconciliation.
It needs to spawn an AI agent with scoped capabilities.
Watch."

**ACTION:** Run in T2:
```bash
curl -X POST https://api.forgeid.ai/v1/token \
  -H "Authorization: Bearer sk_live_4xKj..." \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type": "agent_delegation",
    "parent_token": "'$HUMAN_TOKEN'",
    "capabilities": ["crm:write", "invoice:read"],
    "max_lifetime_minutes": 120,
    "purpose": "nightly CRM reconciliation",
    "model": "claude-sonnet-4-20250514",
    "max_tool_calls": 50
  }'
```

**SHOW:** Response:
```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6ImtleS0yMDI2LTA0In0...",
  "token_type": "Bearer",
  "expires_in": 7200
}
```

**SPOKEN:**
"We get back an agent token — valid for 2 hours.
Let me decode it."

**ACTION:** Paste token at jwt.io — **highlight the payload**

**SHOW on jwt.io:**
```json
{
  "sub": "agent_01HZ9M...",
  "identity_type": "agent",
  "agent_type": "delegated",
  "delegation_chain": [
    { "sub": "usr_GIRISH...", "sess": "sess_01HZ...", "auth_method": "passkey" },
    { "sub": "agent_01HZ9M...", "spawned_at": "2026-06-09T..." }
  ],
  "capabilities": ["crm:write", "invoice:read"],
  "max_tool_calls": 50,
  "purpose": "nightly CRM reconciliation",
  "model": "claude-sonnet-4-20250514"
}
```

**SPOKEN:**
"This JWT contains the full delegation chain.
We know exactly who spawned this agent,
from which human session,
with which capabilities,
and how many tool calls it has left.
All cryptographically signed with RS256."

> *Cut to T1 — audit log*

**SHOW:** `token.agent.spawned` event scrolls in live:
```
[10:42:33] token.agent.spawned  actor=usr_GIRISH  agent=agent_01HZ9M
           capabilities=crm:write,invoice:read  ttl=7200s
```

---

## ACT 3 · AGENT USES MCP TOOLS (3:00 – 5:00)

> *Switch to MCP client / Claude demo*

**SPOKEN:**
"The agent is now running. It connects to ForgeID's MCP server.
Watch what it does first."

**ACTION:** Agent calls `iam_whoami`

**SHOW response:**
```json
{
  "agent_id": "agent_01HZ9M...",
  "acting_for": "Girish (usr_GIRISH...)",
  "org": "intelliforge",
  "capabilities": ["crm:write", "invoice:read"],
  "cannot_do": ["billing:*", "members:delete", "admin:*"],
  "token_expires_in": "1h 58m",
  "tool_calls_remaining": 49
}
```

**SPOKEN:**
"The agent knows exactly who it is,
what it can do — and critically — what it cannot do.
This gets injected into the system prompt automatically.
No hallucination about its own permissions.

Now watch what happens when it tries to write a CRM record."

**ACTION:** Agent calls `iam_check_permission` — action: `crm:write`, resource: `contact:123`

**SHOW:** `{ "allowed": true, "reason": "capability:crm:write", "evaluated_at": "..." }`

**SPOKEN:** "Allowed. Under 10 milliseconds. Vercel Edge — no Fly.io roundtrip."

**ACTION:** Agent calls `iam_check_permission` — action: `billing:read`

**SHOW:** `{ "allowed": false, "reason": "capability not granted" }`

**SPOKEN:** "Denied. Billing is outside this agent's scope."

> *Cut to T1 audit log*

**SHOW:** `authz.check.denied` fires with full context:
```
[10:42:51] authz.check.denied  actor=agent_01HZ9M  action=billing:read
           reason=capability_not_granted  resource=null
```

---

## ACT 4 · WEBHOOK FIRES (5:00 – 6:00)

> *Switch to T3 — webhook inspector*

**SPOKEN:**
"Every IAM event emits a Stripe-style webhook.
Watch our customer's endpoint receive this in real time."

**SHOW:** Webhook terminal receives:
```json
{
  "id": "evt_01HZ...",
  "type": "authz.check.denied",
  "org_id": "org_INTELLIFORGE",
  "created_at": "2026-06-09T10:42:51Z",
  "data": {
    "object": {
      "principal": "agent_01HZ9M...",
      "action": "billing:read",
      "reason": "capability not granted",
      "delegation_chain_depth": 2
    }
  }
}
```

**SPOKEN:**
"Your SIEM, your Slack bot, your on-call system —
all notified within 500 milliseconds.
40 event types. All typed. All signed with HMAC-SHA256."

---

## ACT 5 · INSTANT REVOCATION (6:00 – 7:00)

> *Switch to dashboard*

**SPOKEN:**
"The task is complete. Or maybe the agent is misbehaving.
Dashboard → Agents → Terminate."

**ACTION:** Click "Terminate" on `agent_01HZ9M`

**SHOW:** Dashboard confirms. Cut to T2.

**ACTION:** Try to verify the agent token:
```bash
curl -X POST https://api.forgeid.ai/v1/token/verify \
  -d '{ "token": "'$AGENT_TOKEN'" }'
```

**SHOW:** `{ "valid": false, "error": "token.revoked" }`

**SPOKEN:**
"Dead. Instantly.
Not eventual consistency — immediate.
Redis blocklist hit at the Vercel Edge.
Sub-millisecond kill from anywhere in the world."

> *T1 audit log*

**SHOW:** `token.agent.terminated` + webhook fires

---

## CLOSING (7:00 – 8:00)

> *Face camera. No screen.*

**SPOKEN:**
"What you just saw:
A human logging in with a passkey.
An AI agent spawned with scoped capabilities and a delegation chain.
Permissions checked at the edge in under 10 milliseconds.
Every action audited and webhooked.
Instant revocation from a dashboard.

Three lines of SDK. Production-grade IAM stack. Agent-native.

We built this in 8 weeks with our 15-person IntelliForge team,
using Perplexity Computer for security audits, competitive research, SDK generation, and 500 pages of docs.

The IAM market is $28 billion.
10,000 Indian SaaS companies are rebuilding this from scratch today.
Every AI agent deployment in 2026 needs this.

We are ForgeID by IntelliForge AI.
forgeid.ai

We are asking for $1 million investment and $1 million in Computer credits
to become the identity layer of the agentic internet.

Thank you."

---

## Q&A CHEAT SHEET

**Q: How is this different from Clerk?**
Clerk is authentication only — login, sessions, user management. No fine-grained permissions. No agent identity. No delegation chains. No MCP server. ForgeID picks up where Clerk stops.

**Q: How is this different from WorkOS?**
WorkOS is enterprise SSO. We are AuthN + AuthZ + Agent Identity. WorkOS has no permission engine, no agent model, no Terraform provider.

**Q: Why Vercel + Fly.io and not just one?**
Vercel edge handles the hot path (token verify) at <10ms globally with no cold starts. Fly.io handles stateful writes (issue, rotate, revoke) with private key security — keys never leave Fly's internal network. The split is architectural necessity, not preference.

**Q: India focus — doesn't that limit TAM?**
India is the wedge — 10K+ SaaS companies, zero incumbent with Indian pricing or Mumbai region. Same playbook as Razorpay, Freshworks, Zoho. From India we expand to SEA, then global. The agent identity layer is a global story.

**Q: How do you monetize agents specifically?**
Per-token metered billing at ₹0.10 per agent token issued. As customers ship more AI agents, our revenue scales automatically with zero incremental sales effort. Every new AI deployment is a new revenue line.

**Q: How exactly did Perplexity Computer help you build this?**
Security audit: fed our JWT implementation against OWASP, RFC 6749, RFC 7662 — found 3 issues before launch. Competitive research: mapped every IAM player's API surface to identify our exact gap. SDK generation: generated TypeScript SDK stub from OpenAPI spec. Docs: drafted first 500 pages of API reference. All in weeks, not months.

**Q: What happens if a Fly.io region goes down?**
Fly.io anycast routes to nearest healthy region. Token Core runs minimum 2 machines in Mumbai with automatic failover to Singapore. Verify path is fully edge — Fly outage doesn't affect token verification at all.

---

## FALLBACK PLAN

If live API fails:
1. Switch to pre-recorded 90-second screen recording (saved as `demo-backup.mp4`)
2. Use `cat demo-response-*.json | jq` to show static outputs
3. jwt.io decode still works offline with pre-saved token string

Key insight: jwt.io decode works entirely offline. The delegation chain slide is always deliverable.
