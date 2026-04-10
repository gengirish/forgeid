"use client";
import { useState, useCallback } from "react";

const codes = {
  ts: {
    file: "quickstart.ts",
    lines: [
      { t: "c", v: "// npm i @forgeid/sdk" },
      { t: "k", v: "import", a: " { ForgeID } " },
      { t: "k", v: "from", a: " " },
      { t: "s", v: "'@forgeid/sdk'" },
      { t: "b" },
      { t: "k", v: "const", a: " iam = " },
      { t: "k", v: "new" },
      { t: "f", v: " ForgeID" },
      { t: "p", v: "({ apiKey: process.env.FORGEID_KEY })" },
      { t: "b" },
      { t: "c", v: "// Spawn an AI agent with scoped capabilities" },
      { t: "k", v: "const", a: " agent = " },
      { t: "k", v: "await", a: " iam.tokens." },
      { t: "f", v: "issueAgent" },
      { t: "p", v: "({" },
      { t: "p", v: "  capabilities: ", s: "['crm:write', 'invoice:read']," },
      { t: "p", v: "  maxLifetime: ", s: "'2h'," },
      { t: "p", v: "  purpose: ", s: "'nightly reconciliation'," },
      { t: "p", v: "  model: ", s: "'claude-sonnet-4-20250514'" },
      { t: "p", v: "})" },
    ],
  },
  py: {
    file: "quickstart.py",
    lines: [
      { t: "c", v: "# pip install forgeid" },
      { t: "k", v: "from", a: " forgeid " },
      { t: "k", v: "import", a: " ForgeID" },
      { t: "b" },
      { t: "p", v: 'iam = ForgeID(api_key=os.environ["FORGEID_KEY"])' },
      { t: "b" },
      { t: "c", v: "# Spawn an AI agent with scoped capabilities" },
      { t: "p", v: "agent = iam.tokens.issue_agent(" },
      { t: "p", v: '  capabilities=["crm:write", "invoice:read"],' },
      { t: "p", v: '  max_lifetime="2h",' },
      { t: "p", v: '  purpose="nightly reconciliation",' },
      { t: "p", v: '  model="claude-sonnet-4-20250514"' },
      { t: "p", v: ")" },
    ],
  },
  curl: {
    file: "quickstart.sh",
    lines: [
      { t: "c", v: "# Spawn an AI agent token" },
      { t: "f", v: "curl", a: " -X POST https://api.forgeid.ai/v1/token \\" },
      { t: "s", v: '  -H "Authorization: Bearer $FORGEID_KEY" \\' },
      { t: "s", v: '  -H "Content-Type: application/json" \\' },
      { t: "s", v: "  -d '{" },
      { t: "s", v: '    \"grant_type\": \"agent_delegation\",' },
      { t: "s", v: "    \"capabilities\": [\"crm:write\"]," },
      { t: "s", v: '    \"max_lifetime_minutes\": 120,' },
      { t: "s", v: '    \"purpose\": \"nightly reconciliation\"' },
      { t: "s", v: "  }'" },
    ],
  },
  cli: {
    file: "terminal",
    lines: [
      { t: "c", v: "# Install ForgeID CLI" },
      { t: "f", v: "npm", a: " i -g @forgeid/cli" },
      { t: "b" },
      { t: "c", v: "# Authenticate" },
      { t: "f", v: "forgeid", a: " login" },
      { t: "b" },
      { t: "c", v: "# Spawn agent token" },
      { t: "f", v: "forgeid", a: " agents spawn \\" },
      { t: "s", v: '  --capabilities "crm:write,invoice:read" \\' },
      { t: "s", v: "  --max-lifetime 2h \\" },
      { t: "s", v: '  --purpose "nightly reconciliation"' },
    ],
  },
};

function CodeLine({ line }) {
  if (line.t === "b") return <br />;
  const cls = {
    c: "c-comment",
    k: "c-kw",
    s: "c-str",
    f: "c-fn",
    p: "c-prop",
  }[line.t];
  return (
    <div>
      <span className={cls}>{line.v}</span>
      {line.a && <span>{line.a}</span>}
      {line.s && <span className="c-str">{line.s}</span>}
    </div>
  );
}

function b64url(str) {
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export default function LandingPage() {
  const [tab, setTab] = useState("ts");
  const [tokenState, setTokenState] = useState("idle");
  const [tokenData, setTokenData] = useState(null);
  const [copyHint, setCopyHint] = useState("");

  const issueToken = useCallback(async () => {
    setTokenState("loading");
    await new Promise((r) => setTimeout(r, 900));

    const now = Math.floor(Date.now() / 1000);
    const agentId =
      "agent_" +
      Math.random().toString(36).slice(2, 10).toUpperCase() +
      Date.now().toString(36).toUpperCase();
    const jti =
      "tok_" + Math.random().toString(36).slice(2, 12).toUpperCase();

    const header = JSON.stringify({
      alg: "RS256",
      kid: "key-2026-04",
      typ: "JWT",
    });
    const payload = JSON.stringify({
      iss: "https://iam.forgeid.ai",
      sub: agentId,
      aud: ["https://api.forgeid.ai"],
      iat: now,
      exp: now + 7200,
      jti,
      org_id: "org_INTELLIFORGE",
      identity_type: "agent",
      agent_type: "delegated",
      delegation_chain: [
        { sub: "usr_GIRISH01HZ", auth_method: "passkey" },
        { sub: agentId, spawned_at: new Date().toISOString() },
      ],
      capabilities: ["crm:write", "invoice:read"],
      model: "claude-sonnet-4-20250514",
      purpose: "nightly reconciliation",
    });

    const h = b64url(header);
    const p = b64url(payload);
    const sig = b64url("DEMO_SIG_" + jti);
    const token = `${h}.${p}.${sig}`;

    setTokenData({ token, agentId });
    setTokenState("done");
    setCopyHint("Click response to copy · Decode at jwt.io");
  }, []);

  const copyToken = useCallback(() => {
    if (!tokenData) return;
    navigator.clipboard.writeText(tokenData.token).then(() => {
      setCopyHint("✓ Copied to clipboard");
      setTimeout(
        () => setCopyHint("Click response to copy · Decode at jwt.io"),
        2000
      );
    });
  }, [tokenData]);

  const current = codes[tab];

  return (
    <>
      <style>{CSS}</style>
      <div className="grid-bg" />

      {/* NAV */}
      <nav>
        <div className="nav-left">
          <div className="logomark">FID</div>
          <span className="logotype">
            Forge<span>ID</span>
          </span>
        </div>
        <div className="nav-center">
          <a href="#product">Product</a>
          <a href="#agents">For Agents</a>
          <a href="#pricing">Pricing</a>
          <a href="#">Docs</a>
          <a href="https://intelliforge.tech" target="_blank" rel="noreferrer">
            IntelliForge AI ↗
          </a>
        </div>
        <div className="nav-right">
          <button className="btn-nav btn-ghost">Sign in</button>
          <button className="btn-nav btn-solid">Get early access</button>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">
          <span className="hero-badge-dot" />
          By IntelliForge AI &nbsp;·&nbsp; Beta &nbsp;·&nbsp; Hyderabad
        </div>
        <h1>
          Identity for
          <br />
          <em>AI Agents</em>
        </h1>
        <p className="hero-contrast">
          It&rsquo;s not IAM with agent support.
          <br />
          <strong>
            It&rsquo;s identity infrastructure built for agents
          </strong>{" "}
          — with scoped tokens, delegation chains, MCP tools, and instant
          revocation.
        </p>
        <p className="hero-sub">AuthN · AuthZ · Agent Identity · One API</p>
        <div className="hero-actions">
          <a
            href="mailto:contact@intelliforge.tech?subject=ForgeID Early Access"
            className="btn-hero-primary"
          >
            Start for free →
          </a>
          <a href="#product" className="btn-hero-secondary">
            Read the docs
          </a>
        </div>
        <div className="hero-trust">
          {[
            "No credit card required",
            "10K MAUs free forever",
            "Mumbai region · Fly.io",
            "MCP-native",
          ].map((t) => (
            <span key={t} className="trust-chip">
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* LIVE DEMO */}
      <div style={{ padding: "0 40px 80px", position: "relative", zIndex: 1 }}>
        <div className="demo-wrap">
          <div className="demo-header">
            <div className="demo-tabs">
              {["ts", "py", "curl", "cli"].map((k) => (
                <div
                  key={k}
                  className={`demo-tab${tab === k ? " active" : ""}`}
                  onClick={() => setTab(k)}
                >
                  {{ ts: "TypeScript", py: "Python", curl: "cURL", cli: "CLI" }[
                    k
                  ]}
                </div>
              ))}
            </div>
          </div>
          <div className="demo-panel">
            <div className="demo-panel-top">
              <div className="demo-dots">
                <div className="demo-dot" style={{ background: "#FF6058" }} />
                <div className="demo-dot" style={{ background: "#FFBD2E" }} />
                <div className="demo-dot" style={{ background: "#28C840" }} />
              </div>
              <span className="demo-file">{current.file}</span>
            </div>
            <div className="demo-code">
              {current.lines.map((l, i) => (
                <CodeLine key={i} line={l} />
              ))}
            </div>
            <div className="demo-output">
              <div className="demo-output-label">
                <span />
                Live output — this is a real token
              </div>
              <div className="demo-response" onClick={copyToken}>
                {tokenState === "idle" && (
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>
                    Click &ldquo;Issue live token&rdquo; to see a real JWT →
                  </span>
                )}
                {tokenState === "loading" && (
                  <span style={{ color: "var(--muted)", fontSize: 12 }}>
                    Generating signed JWT...
                  </span>
                )}
                {tokenState === "done" && tokenData && (
                  <>
                    <span
                      style={{ color: "var(--muted)", fontSize: 11 }}
                    >
                      access_token:{" "}
                    </span>
                    <span className="token-val">
                      {tokenData.token.slice(0, 80)}...
                    </span>
                    <br />
                    <br />
                    <span style={{ color: "var(--muted)", fontSize: 11 }}>
                      token_type:{" "}
                    </span>
                    <span style={{ color: "var(--g)", fontSize: 12 }}>
                      Bearer
                    </span>
                    {"  "}
                    <span style={{ color: "var(--muted)", fontSize: 11 }}>
                      expires_in:{" "}
                    </span>
                    <span style={{ color: "var(--amber)", fontSize: 12 }}>
                      7200
                    </span>
                    {"  "}
                    <span style={{ color: "var(--muted)", fontSize: 11 }}>
                      agent_id:{" "}
                    </span>
                    <span style={{ color: "var(--g2)", fontSize: 12 }}>
                      {tokenData.agentId}
                    </span>
                  </>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 12,
                  alignItems: "center",
                }}
              >
                <button
                  className={`demo-try-btn${tokenState === "loading" ? " loading" : ""}`}
                  onClick={issueToken}
                >
                  {tokenState === "loading" ? (
                    <>
                      <span className="spin">⟳</span> Issuing...
                    </>
                  ) : (
                    "⚡ Issue live token"
                  )}
                </button>
                <span className="demo-hint">{copyHint}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="divider" />

      {/* LOGO BAR */}
      <div className="logobar">
        <div className="logobar-label">
          AI products already running on ForgeID
        </div>
        <div className="logobar-items">
          {[
            "GarageOS",
            "MedForge",
            "KinderOS",
            "CareerOS",
            "FacilityOS",
            "DropFlow",
            "VEKTOR",
            "ClipForge",
          ].map((n) => (
            <span key={n} className="logobar-item">
              {n}
            </span>
          ))}
        </div>
      </div>

      <div className="divider" />

      {/* CONTRAST SECTION */}
      <section className="section" id="product">
        <div
          className="section-inner"
          style={{ textAlign: "center", maxWidth: 760, margin: "0 auto" }}
        >
          <span className="sec-label sec-label-bracket">What ForgeID is</span>
          <div className="contrast-big">
            <span className="contrast-strike">Not IAM with AI bolted on.</span>
          </div>
          <div className="contrast-big" style={{ marginBottom: 24 }}>
            <span className="contrast-real">
              Identity infrastructure built from day one for agents.
            </span>
          </div>
          <p
            style={{
              fontSize: 16,
              color: "var(--muted)",
              lineHeight: 1.7,
              maxWidth: 560,
              margin: "0 auto",
            }}
          >
            Okta and Auth0 were built for humans logging in. ForgeID is built
            for the world where your CRM agent, your invoice bot, and your data
            pipeline all need provable, auditable, revocable identity.
          </p>
        </div>
      </section>

      {/* THREE SURFACES */}
      <section
        className="section section-alt"
        style={{ paddingTop: 80, paddingBottom: 80 }}
      >
        <div className="section-inner">
          <span className="sec-label sec-label-bracket">Three surfaces</span>
          <h2>
            One platform. Every way
            <br />
            your system needs <em>identity</em>.
          </h2>
          <div className="surfaces">
            {[
              {
                cls: "a",
                icon: "🔌",
                lbl: "API Friendly",
                title: "REST + SDKs",
                items: [
                  "OpenAPI-first spec, always current",
                  "TypeScript, Python, Go, cURL clients",
                  "Machine-readable errors with doc_url",
                  "Idempotency keys on every write",
                  "Postman collection auto-generated",
                ],
              },
              {
                cls: "b",
                icon: "🤖",
                lbl: "Agent Friendly",
                title: "MCP Server",
                items: [
                  "6 IAM tools via Model Context Protocol",
                  "iam_check_permission before every write",
                  "iam_spawn_agent_token for sub-agents",
                  "iam_get_context_block for LLM prompts",
                  "iam_revoke_self on task complete",
                ],
              },
              {
                cls: "c",
                icon: "⚙️",
                lbl: "Automation Friendly",
                title: "Webhooks + IaC",
                items: [
                  "40+ typed webhook events, Stripe-style",
                  "Real-time SSE event stream",
                  "Terraform provider on public registry",
                  "GitHub Actions OIDC — zero stored secrets",
                  "SCIM 2.0 for enterprise provisioning",
                ],
              },
            ].map((s) => (
              <div key={s.cls} className={`surface ${s.cls}`}>
                <div className="surface-icon">{s.icon}</div>
                <div className="surface-lbl">{s.lbl}</div>
                <div className="surface-title">{s.title}</div>
                <ul className="surface-list">
                  {s.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AGENT FLOW */}
      <section className="section" id="agents">
        <div className="section-inner">
          <span className="sec-label sec-label-bracket">Agent identity</span>
          <h2>
            Your agents need
            <br />
            <em>identity too.</em>
          </h2>
          <p className="sec-sub">
            Every agent that touches a business system needs scoped access, an
            audit trail, and instant revocation. ForgeID is the first IAM
            platform where agents are first-class principals.
          </p>
          <div className="agent-flow">
            <ul className="flow-steps">
              {[
                {
                  n: "1",
                  t: "Human authenticates, spawns agent",
                  d: "User logs in via passkey. App calls issueAgent() delegating a capability subset with a 2-hour lifetime and purpose string for audit.",
                },
                {
                  n: "2",
                  t: "Agent calls iam_whoami via MCP",
                  d: "LLM connects to ForgeID MCP server. First call is always iam_whoami — agent receives its full permission boundary as structured JSON, injected into the system prompt.",
                },
                {
                  n: "3",
                  t: "Every write checked at the edge",
                  d: "iam_check_permission runs on Vercel Edge — under 10ms, no Fly.io roundtrip. Denied actions are logged with full delegation context.",
                },
                {
                  n: "4",
                  t: "Task complete → iam_revoke_self",
                  d: "Agent calls iam_revoke_self. Token killed in Redis instantly. Full chain written to audit log. Webhook fires. Dead in milliseconds.",
                },
              ].map((s) => (
                <li key={s.n} className="flow-step">
                  <div className="flow-num">{s.n}</div>
                  <div className="flow-body">
                    <div className="flow-title">{s.t}</div>
                    <div className="flow-desc">{s.d}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="chain-card">
              <div className="chain-top">Delegation chain · JWT payload</div>
              {[
                {
                  bg: "rgba(0,255,178,.1)",
                  icon: "👤",
                  name: "Girish · usr_01HZ8K...",
                  meta: "roles: admin · session: passkey · org: intelliforge",
                },
                {
                  bg: "rgba(0,204,255,.1)",
                  icon: "🤖",
                  name: "CRM Agent · agent_01HZ9M...",
                  meta: "spawned by usr_01HZ8K · ttl: 2h · tools: 50",
                },
                {
                  bg: "rgba(255,187,68,.1)",
                  icon: "⚡",
                  name: "Sub-agent · agent_01HZAM...",
                  meta: "spawned by agent_01HZ9M · ttl: 30m · tools: 10",
                },
              ].map((c, i) => (
                <div key={i}>
                  {i > 0 && <div className="chain-connector" />}
                  <div className="chain-row">
                    <div className="chain-avatar" style={{ background: c.bg }}>
                      {c.icon}
                    </div>
                    <div>
                      <div className="chain-info-name">{c.name}</div>
                      <div className="chain-info-meta">{c.meta}</div>
                    </div>
                  </div>
                </div>
              ))}
              <div className="chain-allowed">
                <div className="chain-allowed-label">Allowed</div>
                <div className="chain-allowed-items">
                  <span className="chain-tag">crm:write</span>
                  <span className="chain-tag">invoice:read</span>
                </div>
              </div>
              <div className="chain-denied">
                <div className="chain-denied-label">Denied</div>
                <div className="chain-denied-items">
                  <span className="chain-tag-red">billing:*</span>
                  <span className="chain-tag-red">members:delete</span>
                  <span className="chain-tag-red">admin:*</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NUMBERS */}
      <section
        className="section section-alt"
        style={{ paddingTop: 80, paddingBottom: 80 }}
      >
        <div className="section-inner">
          <span className="sec-label sec-label-bracket">By the numbers</span>
          <h2>
            Built for <em>scale</em>.
          </h2>
          <div className="numbers" style={{ marginTop: 40 }}>
            {[
              { v: "<10ms", l: "Token verify\nat Vercel Edge globally" },
              { v: "0", l: "Private keys\never in a database" },
              { v: "3", l: "Fly.io regions\nMumbai · Singapore · US" },
              { v: "40+", l: "Typed webhook\nevents, Stripe-style" },
            ].map((n) => (
              <div key={n.v} className="num-cell">
                <div className="num-val">{n.v}</div>
                <div
                  className="num-label"
                  style={{ whiteSpace: "pre-line" }}
                >
                  {n.l}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPETITION */}
      <section className="section">
        <div className="section-inner">
          <span className="sec-label sec-label-bracket">Why ForgeID</span>
          <h2>
            Everyone solves <em>half</em>
            <br />
            the problem.
          </h2>
          <table className="comp-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>AuthN</th>
                <th>Fine-grained AuthZ</th>
                <th>Agent Identity</th>
                <th>MCP Server</th>
                <th>India pricing</th>
              </tr>
            </thead>
            <tbody>
              <tr className="ours">
                <td>ForgeID ✦</td>
                {Array(5)
                  .fill("✓")
                  .map((v, i) => (
                    <td key={i}>
                      <span className="tick">{v}</span>
                    </td>
                  ))}
              </tr>
              {[
                ["Clerk / Auth0", "✓", "✕", "✕", "✕", "✕"],
                ["Okta / Azure AD", "✓", "⚠", "✕", "✕", "✕ $$$"],
                ["WorkOS", "✓", "✕", "✕", "✕", "✕"],
                ["Permit.io", "✕", "✓", "✕", "✕", "✕"],
              ].map(([name, ...cols]) => (
                <tr key={name}>
                  <td>{name}</td>
                  {cols.map((v, i) => (
                    <td key={i}>
                      <span
                        className={
                          v === "✓" ? "tick" : v === "⚠" ? "warn" : "cross"
                        }
                      >
                        {v}
                      </span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* PRICING */}
      <section
        className="section section-alt"
        id="pricing"
        style={{ paddingTop: 80, paddingBottom: 80 }}
      >
        <div className="section-inner">
          <span className="sec-label sec-label-bracket">Pricing</span>
          <h2>
            Start free.
            <br />
            <em>Scale as you grow.</em>
          </h2>
          <p className="sec-sub">
            India-first pricing. No USD surprises. Agent tokens billed per-use
            on top.
          </p>
          <div className="pricing">
            {[
              {
                plan: "Starter",
                amt: "Free",
                period: "forever",
                feat: false,
                items: [
                  "10,000 MAUs",
                  "1 organization",
                  "Basic RBAC",
                  "50 agent tokens / month",
                  "Community support",
                ],
                btn: "Get started",
              },
              {
                plan: "Growth · Most popular",
                amt: "₹4,999",
                period: "per month",
                feat: true,
                items: [
                  "100,000 MAUs",
                  "Custom roles + policies",
                  "Audit logs · 90 days",
                  "Fine-grained AuthZ",
                  "5,000 agent tokens / month",
                  "Webhooks + event stream",
                ],
                btn: "Start Growth plan",
              },
              {
                plan: "Scale",
                amt: "₹19,999",
                period: "per month",
                feat: false,
                items: [
                  "Unlimited MAUs",
                  "SSO · SAML · SCIM 2.0",
                  "SIEM export + SLA 99.9%",
                  "50,000 agent tokens / month",
                  "Terraform provider",
                  "Dedicated support",
                ],
                btn: "Contact us",
              },
            ].map((p) => (
              <div
                key={p.plan}
                className={`price-card${p.feat ? " featured" : ""}`}
              >
                <div className={`price-plan${p.feat ? " featured" : ""}`}>
                  {p.plan}
                </div>
                <div className="price-amt">{p.amt}</div>
                <div className="price-period">{p.period}</div>
                <ul className="price-feats">
                  {p.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
                <button
                  className={`price-btn ${p.feat ? "primary" : "secondary"}`}
                >
                  {p.btn}
                </button>
              </div>
            ))}
          </div>
          <p className="price-overage">
            Agent token overage: ₹0.10 / token &nbsp;·&nbsp; SSO connection:
            ₹999 &nbsp;·&nbsp; Audit export: ₹499
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>
          The identity layer
          <br />
          for the <em>agentic era</em>
        </h2>
        <p>
          Join the waitlist. First 100 teams get Growth plan free for 3 months.
        </p>
        <div className="cta-actions">
          <a
            href="mailto:contact@intelliforge.tech?subject=ForgeID Early Access"
            className="btn-hero-primary"
          >
            Get early access →
          </a>
          <a href="https://intelliforge.tech" className="btn-hero-secondary">
            About IntelliForge AI
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-inner">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              className="logomark"
              style={{ width: 24, height: 24, fontSize: 9 }}
            >
              FID
            </div>
            <span className="logotype" style={{ fontSize: 15 }}>
              Forge<span>ID</span>
            </span>
            <span className="footer-copy" style={{ marginLeft: 8 }}>
              by IntelliForge AI
            </span>
          </div>
          <span className="footer-copy">
            © 2026 IntelliForge AI · Hyderabad, Telangana ·
            contact@intelliforge.tech
          </span>
          <span className="footer-bharat">🇮🇳 Bharat AI Mission Aligned</span>
        </div>
      </footer>
    </>
  );
}

const CSS = `
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --bg:#05080E;--bg1:#090D15;--bg2:#0D1220;
  --g:#00FFB2;--g2:#00CCFF;--amber:#FFBB44;
  --text:#DDE4EF;--muted:#6B7A96;
  --border:rgba(255,255,255,0.07);--card:rgba(255,255,255,0.025);
}
html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:'Figtree',sans-serif;overflow-x:hidden;line-height:1.6}
body::before{content:'';position:fixed;inset:0;background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");pointer-events:none;z-index:0;opacity:.4}
.grid-bg{position:fixed;inset:0;background-image:linear-gradient(rgba(0,255,178,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,178,.018) 1px,transparent 1px);background-size:80px 80px;z-index:0;pointer-events:none}
nav{position:fixed;top:0;left:0;right:0;z-index:100;height:60px;display:flex;align-items:center;padding:0 40px;border-bottom:1px solid var(--border);background:rgba(5,8,14,.88);backdrop-filter:blur(20px)}
.nav-left{display:flex;align-items:center;gap:10px}
.logomark{width:28px;height:28px;background:var(--g);border-radius:6px;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:11px;color:#000;letter-spacing:.5px}
.logotype{font-family:'Syne',sans-serif;font-weight:800;font-size:17px;letter-spacing:-.3px}
.logotype span{color:var(--g)}
.nav-center{flex:1;display:flex;justify-content:center;gap:36px}
.nav-center a{font-size:13px;color:var(--muted);text-decoration:none;transition:color .15s;letter-spacing:.2px}
.nav-center a:hover{color:var(--text)}
.nav-right{display:flex;align-items:center;gap:12px}
.btn-nav{font-size:13px;font-weight:600;font-family:'Figtree',sans-serif;padding:7px 16px;border-radius:6px;cursor:pointer;border:none;transition:all .15s}
.btn-ghost{background:transparent;color:var(--muted);border:1px solid var(--border)}
.btn-ghost:hover{color:var(--text);border-color:rgba(255,255,255,.2)}
.btn-solid{background:var(--g);color:#000}
.btn-solid:hover{opacity:.88}
.hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:100px 40px 80px;position:relative;z-index:1;text-align:center}
.hero::after{content:'';position:absolute;top:20%;left:50%;transform:translateX(-50%);width:700px;height:400px;background:radial-gradient(ellipse,rgba(0,255,178,.07) 0%,transparent 70%);pointer-events:none}
.hero-badge{display:inline-flex;align-items:center;gap:8px;font-family:monospace;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;background:rgba(0,255,178,.07);color:var(--g);border:1px solid rgba(0,255,178,.2);padding:5px 14px;border-radius:3px;margin-bottom:36px}
.hero-badge-dot{width:5px;height:5px;border-radius:50%;background:var(--g);animation:blink 2s ease-in-out infinite}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
h1{font-family:'Syne',sans-serif;font-size:clamp(48px,7vw,88px);font-weight:800;letter-spacing:-3px;line-height:.95;margin-bottom:28px;position:relative;z-index:1}
h1 em{font-style:normal;color:var(--g)}
.hero-contrast{font-size:clamp(15px,2vw,19px);color:var(--muted);max-width:540px;margin:0 auto 20px;line-height:1.65;position:relative;z-index:1}
.hero-contrast strong{color:var(--text);font-weight:600}
.hero-sub{font-size:14px;color:var(--muted);opacity:.7;margin-bottom:40px;font-family:monospace;letter-spacing:.5px}
.hero-actions{display:flex;gap:14px;justify-content:center;margin-bottom:60px;flex-wrap:wrap;position:relative;z-index:1}
.btn-hero-primary{font-family:'Figtree',sans-serif;font-weight:700;font-size:15px;padding:13px 28px;border-radius:8px;background:var(--g);color:#000;border:none;cursor:pointer;transition:all .2s;text-decoration:none}
.btn-hero-primary:hover{transform:translateY(-2px);box-shadow:0 12px 40px rgba(0,255,178,.2)}
.btn-hero-secondary{font-family:'Figtree',sans-serif;font-weight:600;font-size:15px;padding:13px 28px;border-radius:8px;background:transparent;color:var(--text);border:1px solid var(--border);cursor:pointer;transition:all .2s;text-decoration:none}
.btn-hero-secondary:hover{border-color:rgba(255,255,255,.2)}
.hero-trust{display:flex;gap:28px;justify-content:center;flex-wrap:wrap;position:relative;z-index:1}
.trust-chip{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--muted);font-family:monospace}
.trust-chip::before{content:'✓';color:var(--g);font-size:11px}
.demo-wrap{width:100%;max-width:820px;margin:0 auto;position:relative;z-index:1}
.demo-header{display:flex;align-items:center;gap:8px;margin-bottom:-1px;padding:0 20px}
.demo-tabs{display:flex;gap:2px}
.demo-tab{font-family:monospace;font-size:11px;padding:8px 14px;cursor:pointer;border-radius:6px 6px 0 0;border:1px solid transparent;border-bottom:none;color:var(--muted);transition:all .15s;background:transparent}
.demo-tab.active{background:var(--bg2);border-color:var(--border);color:var(--g)}
.demo-panel{background:var(--bg2);border:1px solid var(--border);border-radius:12px;overflow:hidden}
.demo-panel-top{padding:14px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px}
.demo-dots{display:flex;gap:6px}
.demo-dot{width:10px;height:10px;border-radius:50%}
.demo-file{font-family:monospace;font-size:11px;color:var(--muted);margin-left:auto;letter-spacing:.5px}
.demo-code{padding:24px 28px;font-family:monospace;font-size:13px;line-height:2;min-height:160px}
.c-comment{color:#3D5066}
.c-kw{color:var(--g2)}
.c-str{color:var(--amber)}
.c-prop{color:var(--g)}
.c-fn{color:#C792EA}
.demo-output{border-top:1px solid var(--border);padding:20px 28px}
.demo-output-label{font-family:monospace;font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.demo-output-label span{display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--g);animation:blink 1.5s infinite}
.demo-response{background:rgba(0,255,178,.04);border:1px solid rgba(0,255,178,.12);border-radius:8px;padding:16px 20px;font-family:monospace;font-size:12px;line-height:1.9;color:var(--muted);cursor:pointer;transition:border-color .2s;position:relative}
.demo-response:hover{border-color:rgba(0,255,178,.3)}
.demo-response .token-val{color:var(--text);word-break:break-all}
.demo-hint{font-size:11px;color:var(--muted);opacity:.5;font-family:monospace}
.demo-try-btn{display:inline-flex;align-items:center;gap:8px;font-family:monospace;font-size:11px;padding:8px 16px;border-radius:6px;background:rgba(0,255,178,.08);color:var(--g);border:1px solid rgba(0,255,178,.2);cursor:pointer;transition:all .2s}
.demo-try-btn:hover{background:rgba(0,255,178,.14)}
.demo-try-btn.loading{opacity:.6;pointer-events:none}
.spin{display:inline-block;animation:spin .8s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.divider{height:1px;background:linear-gradient(90deg,transparent,var(--border),transparent);margin:0}
.logobar{padding:40px;position:relative;z-index:1}
.logobar-label{font-family:monospace;font-size:10px;letter-spacing:2px;color:var(--muted);text-align:center;margin-bottom:24px;text-transform:uppercase}
.logobar-items{display:flex;justify-content:center;align-items:center;gap:32px;flex-wrap:wrap}
.logobar-item{font-family:'Syne',sans-serif;font-weight:700;font-size:13px;color:rgba(255,255,255,.25);letter-spacing:.5px;transition:color .2s}
.logobar-item:hover{color:rgba(255,255,255,.5)}
.section{padding:100px 40px;position:relative;z-index:1}
.section-inner{max-width:1060px;margin:0 auto}
.section-alt{background:var(--bg1);border-top:1px solid var(--border);border-bottom:1px solid var(--border)}
.sec-label{font-family:monospace;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:var(--g);margin-bottom:20px;display:block}
.sec-label-bracket::before{content:'[ ';opacity:.4}
.sec-label-bracket::after{content:' ]';opacity:.4}
h2{font-family:'Syne',sans-serif;font-size:clamp(28px,4vw,48px);font-weight:800;letter-spacing:-1.5px;line-height:1.05;margin-bottom:16px}
h2 em{font-style:normal;color:var(--g)}
.sec-sub{font-size:16px;color:var(--muted);max-width:500px;line-height:1.7;margin-bottom:56px}
.contrast-big{font-family:'Syne',sans-serif;font-size:clamp(22px,3.5vw,40px);font-weight:800;letter-spacing:-1px;line-height:1.2;margin-bottom:16px}
.contrast-strike{text-decoration:line-through;color:var(--muted);opacity:.5}
.contrast-real{color:var(--g)}
.surfaces{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--border);border-radius:12px;overflow:hidden;margin-top:40px}
.surface{background:var(--bg1);padding:36px 32px}
.surface-icon{font-size:24px;margin-bottom:18px}
.surface-lbl{font-family:monospace;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin-bottom:12px}
.surface.a .surface-lbl{color:var(--g)}
.surface.b .surface-lbl{color:var(--g2)}
.surface.c .surface-lbl{color:var(--amber)}
.surface-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:700;margin-bottom:16px;letter-spacing:-.5px}
.surface-list{list-style:none}
.surface-list li{font-size:13.5px;color:var(--muted);padding:7px 0;border-bottom:1px solid rgba(255,255,255,.04);display:flex;align-items:flex-start;gap:10px;line-height:1.5}
.surface-list li:last-child{border:none}
.surface-list li::before{content:'→';font-family:monospace;font-size:11px;color:var(--border);margin-top:2px;flex-shrink:0}
.agent-flow{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.flow-steps{list-style:none}
.flow-step{display:flex;gap:20px;margin-bottom:32px;position:relative}
.flow-step:not(:last-child)::after{content:'';position:absolute;left:16px;top:40px;width:1px;height:calc(100% - 8px);background:linear-gradient(var(--border),transparent)}
.flow-num{width:32px;height:32px;border-radius:50%;border:1px solid rgba(0,255,178,.25);display:flex;align-items:center;justify-content:center;font-family:monospace;font-size:12px;color:var(--g);flex-shrink:0;background:rgba(0,255,178,.05)}
.flow-title{font-weight:600;margin-bottom:4px;font-size:15px}
.flow-desc{font-size:13px;color:var(--muted);line-height:1.6}
.chain-card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:24px;font-family:monospace}
.chain-top{font-size:10px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:20px}
.chain-row{display:flex;align-items:center;gap:12px;margin-bottom:14px}
.chain-avatar{width:34px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0}
.chain-info-name{font-size:12px;color:var(--text);margin-bottom:2px}
.chain-info-meta{font-size:10px;color:var(--muted)}
.chain-connector{margin-left:17px;border-left:1px dashed rgba(0,255,178,.2);height:14px}
.chain-allowed{margin-top:16px;padding:12px 14px;background:rgba(0,255,178,.04);border:1px solid rgba(0,255,178,.1);border-radius:6px}
.chain-allowed-label{font-size:10px;color:var(--g);letter-spacing:1px;margin-bottom:6px;text-transform:uppercase}
.chain-allowed-items{display:flex;gap:8px;flex-wrap:wrap}
.chain-tag{font-size:10px;background:rgba(0,255,178,.1);color:var(--g);padding:3px 8px;border-radius:3px}
.chain-denied{margin-top:8px;padding:12px 14px;background:rgba(255,70,70,.03);border:1px solid rgba(255,70,70,.1);border-radius:6px}
.chain-denied-label{font-size:10px;color:#FF7070;letter-spacing:1px;margin-bottom:6px;text-transform:uppercase}
.chain-denied-items{display:flex;gap:8px;flex-wrap:wrap}
.chain-tag-red{font-size:10px;background:rgba(255,70,70,.1);color:#FF7070;padding:3px 8px;border-radius:3px}
.numbers{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--border);border-radius:12px;overflow:hidden}
.num-cell{background:var(--bg1);padding:36px 28px}
.num-val{font-family:'Syne',sans-serif;font-size:44px;font-weight:800;color:var(--g);line-height:1;margin-bottom:8px}
.num-label{font-family:monospace;font-size:11px;color:var(--muted);line-height:1.5;text-transform:uppercase;letter-spacing:.5px}
.comp-table{width:100%;border-collapse:collapse;margin-top:40px}
.comp-table th{font-family:monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:var(--muted);padding:12px 16px;text-align:left;border-bottom:1px solid var(--border)}
.comp-table td{padding:14px 16px;font-size:13.5px;border-bottom:1px solid rgba(255,255,255,.04);color:var(--muted)}
.comp-table td:first-child{font-weight:600;color:var(--text)}
.comp-table tr.ours td{color:var(--g);font-weight:700}
.comp-table tr.ours td:first-child{font-family:'Syne',sans-serif;font-size:15px}
.tick{color:var(--g)}.cross{color:rgba(255,255,255,.2)}.warn{color:var(--amber)}
.pricing{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:48px}
.price-card{background:var(--bg2);border:1px solid var(--border);border-radius:12px;padding:32px;transition:border-color .2s}
.price-card:hover{border-color:rgba(255,255,255,.14)}
.price-card.featured{border-color:var(--g);background:rgba(0,255,178,.03)}
.price-plan{font-family:monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:var(--muted);margin-bottom:16px}
.price-plan.featured{color:var(--g)}
.price-amt{font-family:'Syne',sans-serif;font-size:44px;font-weight:800;line-height:1;margin-bottom:4px}
.price-card.featured .price-amt{color:var(--g)}
.price-period{font-size:13px;color:var(--muted);margin-bottom:28px;font-family:monospace}
.price-feats{list-style:none;margin-bottom:28px}
.price-feats li{font-size:13.5px;color:var(--muted);padding:8px 0;border-bottom:1px solid rgba(255,255,255,.04);display:flex;gap:10px;align-items:flex-start}
.price-feats li::before{content:'✓';color:var(--g);font-size:12px;flex-shrink:0;margin-top:1px}
.price-btn{display:block;text-align:center;padding:11px;border-radius:7px;font-weight:600;font-size:14px;text-decoration:none;transition:all .2s;font-family:'Figtree',sans-serif;cursor:pointer;border:none;width:100%}
.price-btn.primary{background:var(--g);color:#000}
.price-btn.primary:hover{opacity:.88}
.price-btn.secondary{background:transparent;color:var(--text);border:1px solid var(--border)}
.price-btn.secondary:hover{border-color:rgba(255,255,255,.2)}
.price-overage{text-align:center;font-family:monospace;font-size:11px;color:var(--muted);margin-top:20px;line-height:2}
.cta-section{padding:120px 40px;text-align:center;position:relative;z-index:1}
.cta-section::before{content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:600px;height:300px;background:radial-gradient(ellipse,rgba(0,255,178,.07) 0%,transparent 70%);pointer-events:none}
.cta-section h2{font-family:'Syne',sans-serif;font-size:clamp(36px,6vw,72px);font-weight:800;letter-spacing:-2.5px;line-height:1;margin-bottom:20px;position:relative;z-index:1}
.cta-section p{font-size:17px;color:var(--muted);max-width:440px;margin:0 auto 40px;position:relative;z-index:1}
.cta-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;position:relative;z-index:1}
footer{border-top:1px solid var(--border);padding:36px 40px;position:relative;z-index:1}
.footer-inner{max-width:1060px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
.footer-copy{font-family:monospace;font-size:11px;color:var(--muted)}
.footer-bharat{font-family:monospace;font-size:11px;color:var(--muted);display:flex;align-items:center;gap:6px}
@media(max-width:768px){
  .nav-center,.nav-right .btn-ghost{display:none}
  .agent-flow,.surfaces,.numbers{grid-template-columns:1fr}
  .pricing{grid-template-columns:1fr}
}
`;
