import type { Metadata } from "next";
import Link from "next/link";
import { CodeDemo } from "@/components/landing/code-demo";
import "./landing.css";

export const metadata: Metadata = {
  title: "ForgeID — Identity Infrastructure for AI Agents",
  description:
    "It's not IAM with agent support. It's identity infrastructure built for agents. AuthN + AuthZ + Agent Identity. By IntelliForge AI.",
  openGraph: {
    title: "ForgeID — Identity Infrastructure for AI Agents",
    description:
      "Scoped tokens, delegation chains, MCP tools, and instant revocation. The identity layer for the agentic era.",
    url: "https://forgeid.ai",
    siteName: "ForgeID",
    type: "website",
  },
};

function Nav() {
  return (
    <nav className="fixed top-0 right-0 left-0 z-[100] flex h-[60px] items-center border-b border-white/[0.07] bg-[#05080e]/[0.88] px-10 backdrop-blur-[20px] max-md:px-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent font-heading text-[11px] font-extrabold tracking-wider text-black">
          FID
        </span>
        <span className="font-heading text-[17px] font-extrabold tracking-tight">
          Forge<span className="text-accent">ID</span>
        </span>
      </div>

      <div className="flex flex-1 justify-center gap-9 max-md:hidden">
        <a
          href="#product"
          className="text-[13px] tracking-wide text-muted transition-colors hover:text-foreground"
        >
          Product
        </a>
        <a
          href="#agents"
          className="text-[13px] tracking-wide text-muted transition-colors hover:text-foreground"
        >
          For Agents
        </a>
        <a
          href="#pricing"
          className="text-[13px] tracking-wide text-muted transition-colors hover:text-foreground"
        >
          Pricing
        </a>
        <a
          href="#"
          className="text-[13px] tracking-wide text-muted transition-colors hover:text-foreground"
        >
          Docs
        </a>
        <a
          href="https://intelliforge.tech"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] tracking-wide text-muted transition-colors hover:text-foreground"
        >
          IntelliForge AI ↗
        </a>
      </div>

      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className="rounded-md border border-white/[0.07] bg-transparent px-4 py-[7px] text-[13px] font-semibold text-muted transition-all hover:border-white/20 hover:text-foreground max-md:hidden"
        >
          Sign in
        </Link>
        <Link
          href="/login"
          className="rounded-md bg-accent px-4 py-[7px] text-[13px] font-semibold text-black transition-all hover:opacity-[0.88]"
        >
          Get early access
        </Link>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section className="landing-hero-glow relative z-[1] flex min-h-screen flex-col items-center justify-center px-10 pt-[100px] pb-20 text-center max-md:px-5">
      <div className="landing-blink mb-9 inline-flex items-center gap-2 rounded-[3px] border border-accent/20 bg-accent/[0.07] px-3.5 py-[5px] font-mono text-[11px] uppercase tracking-[1.5px] text-accent">
        <span className="landing-blink h-[5px] w-[5px] rounded-full bg-accent" />
        By IntelliForge AI &nbsp;·&nbsp; Beta &nbsp;·&nbsp; Hyderabad
      </div>

      <h1 className="relative z-[1] mb-7 font-heading text-[clamp(48px,7vw,88px)] font-extrabold leading-[0.95] tracking-[-3px]">
        Identity for
        <br />
        <em className="not-italic text-accent">AI Agents</em>
      </h1>

      <p className="relative z-[1] mx-auto mb-5 max-w-[540px] text-[clamp(15px,2vw,19px)] leading-[1.65] text-muted">
        It&rsquo;s not IAM with agent support.
        <br />
        <strong className="font-semibold text-foreground">
          It&rsquo;s identity infrastructure built for agents
        </strong>{" "}
        — with scoped tokens, delegation chains, MCP tools, and instant
        revocation.
      </p>

      <p className="mb-10 font-mono text-sm tracking-wider text-muted/70">
        AuthN · AuthZ · Agent Identity · One API
      </p>

      <div className="relative z-[1] mb-[60px] flex flex-wrap justify-center gap-3.5">
        <Link
          href="/login"
          className="rounded-lg bg-accent px-7 py-[13px] text-[15px] font-bold text-black transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,255,178,0.2)]"
        >
          Start for free →
        </Link>
        <a
          href="#product"
          className="rounded-lg border border-white/[0.07] bg-transparent px-7 py-[13px] text-[15px] font-semibold text-foreground transition-all hover:border-white/20"
        >
          Read the docs
        </a>
      </div>

      <div className="relative z-[1] flex flex-wrap justify-center gap-7">
        {[
          "No credit card required",
          "10K MAUs free forever",
          "Singapore region · Fly.io",
          "MCP-native",
        ].map((chip) => (
          <span
            key={chip}
            className="flex items-center gap-[7px] font-mono text-xs text-muted before:text-[11px] before:text-accent before:content-['✓']"
          >
            {chip}
          </span>
        ))}
      </div>
    </section>
  );
}

function LogoBar() {
  const brands = [
    "GarageOS",
    "MedForge",
    "KinderOS",
    "CareerOS",
    "FacilityOS",
    "DropFlow",
    "VEKTOR",
    "ClipForge",
  ];
  return (
    <div className="relative z-[1] p-10">
      <p className="mb-6 text-center font-mono text-[10px] uppercase tracking-[2px] text-muted">
        AI products already running on ForgeID
      </p>
      <div className="flex flex-wrap items-center justify-center gap-8">
        {brands.map((b) => (
          <span
            key={b}
            className="font-heading text-[13px] font-bold tracking-wider text-white/25 transition-colors hover:text-white/50"
          >
            {b}
          </span>
        ))}
      </div>
    </div>
  );
}

function ContrastSection() {
  return (
    <section className="relative z-[1] px-10 py-[100px] max-md:px-5" id="product">
      <div className="mx-auto max-w-[760px] text-center">
        <span className="mb-5 block font-mono text-[10px] uppercase tracking-[2.5px] text-accent before:opacity-40 before:content-['[_'] after:opacity-40 after:content-['_]']">
          What ForgeID is
        </span>
        <div className="mb-4 font-heading text-[clamp(22px,3.5vw,40px)] font-extrabold leading-[1.2] tracking-tight">
          <span className="text-muted/50 line-through">
            Not IAM with AI bolted on.
          </span>
        </div>
        <div className="mb-6 font-heading text-[clamp(22px,3.5vw,40px)] font-extrabold leading-[1.2] tracking-tight">
          <span className="text-accent">
            Identity infrastructure built from day one for agents.
          </span>
        </div>
        <p className="mx-auto max-w-[560px] text-base leading-relaxed text-muted">
          Okta and Auth0 were built for humans logging in. ForgeID is built for
          the world where your CRM agent, your invoice bot, and your data
          pipeline all need provable, auditable, revocable identity.
        </p>
      </div>
    </section>
  );
}

type SurfaceData = {
  emoji: string;
  label: string;
  title: string;
  color: string;
  items: string[];
};

function SurfacesSection() {
  const surfaces: SurfaceData[] = [
    {
      emoji: "🔌",
      label: "API Friendly",
      title: "REST + SDKs",
      color: "text-accent",
      items: [
        "OpenAPI-first spec, always current",
        "TypeScript, Python, Go, cURL clients",
        "Machine-readable errors with doc_url",
        "Idempotency keys on every write",
        "Postman collection auto-generated",
      ],
    },
    {
      emoji: "🤖",
      label: "Agent Friendly",
      title: "MCP Server",
      color: "text-accent-cyan",
      items: [
        "6 IAM tools via Model Context Protocol",
        "iam_check_permission before every write",
        "iam_spawn_agent_token for sub-agents",
        "iam_get_context_block for LLM prompts",
        "iam_revoke_self on task complete",
      ],
    },
    {
      emoji: "⚙️",
      label: "Automation Friendly",
      title: "Webhooks + IaC",
      color: "text-accent-amber",
      items: [
        "40+ typed webhook events, Stripe-style",
        "Real-time SSE event stream",
        "Terraform provider on public registry",
        "GitHub Actions OIDC — zero stored secrets",
        "SCIM 2.0 for enterprise provisioning",
      ],
    },
  ];

  return (
    <section className="relative z-[1] border-y border-white/[0.07] bg-[#090D15] px-10 py-20 max-md:px-5">
      <div className="mx-auto max-w-[1060px]">
        <span className="mb-5 block font-mono text-[10px] uppercase tracking-[2.5px] text-accent before:opacity-40 before:content-['[_'] after:opacity-40 after:content-['_]']">
          Three surfaces
        </span>
        <h2 className="mb-4 font-heading text-[clamp(28px,4vw,48px)] font-extrabold leading-[1.05] tracking-tight">
          One platform. Every way
          <br />
          your system needs <em className="not-italic text-accent">identity</em>
          .
        </h2>

        <div className="mt-10 grid gap-px overflow-hidden rounded-xl bg-white/[0.07] max-md:grid-cols-1 md:grid-cols-3">
          {surfaces.map((s) => (
            <div key={s.title} className="bg-[#090D15] p-8">
              <div className="mb-[18px] text-2xl">{s.emoji}</div>
              <div
                className={`mb-3 font-mono text-[10px] uppercase tracking-[2px] ${s.color}`}
              >
                {s.label}
              </div>
              <div className="mb-4 font-heading text-xl font-bold tracking-tight">
                {s.title}
              </div>
              <ul>
                {s.items.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 border-b border-white/[0.04] py-[7px] text-[13.5px] leading-normal text-muted last:border-0"
                  >
                    <span className="mt-0.5 shrink-0 font-mono text-[11px] text-white/[0.07]">
                      →
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function AgentFlowSection() {
  const steps = [
    {
      num: 1,
      title: "Human authenticates, spawns agent",
      desc: "User logs in via passkey. App calls issueAgent() delegating a capability subset with a 2-hour lifetime and purpose string for audit.",
    },
    {
      num: 2,
      title: "Agent calls iam_whoami via MCP",
      desc: "LLM connects to ForgeID MCP server. First call is always iam_whoami — agent receives its full permission boundary as structured JSON, injected into the system prompt.",
    },
    {
      num: 3,
      title: "Every write checked at the edge",
      desc: "iam_check_permission runs on Vercel Edge — under 10ms, no Fly.io roundtrip. Denied actions are logged with full delegation context. Allowed actions proceed.",
    },
    {
      num: 4,
      title: "Task complete → iam_revoke_self",
      desc: "Agent calls iam_revoke_self. Token killed in Redis instantly. Full chain written to audit log. Webhook fires. Dead in milliseconds.",
    },
  ];

  return (
    <section className="relative z-[1] px-10 py-[100px] max-md:px-5" id="agents">
      <div className="mx-auto max-w-[1060px]">
        <span className="mb-5 block font-mono text-[10px] uppercase tracking-[2.5px] text-accent before:opacity-40 before:content-['[_'] after:opacity-40 after:content-['_]']">
          Agent identity
        </span>
        <h2 className="mb-4 font-heading text-[clamp(28px,4vw,48px)] font-extrabold leading-[1.05] tracking-tight">
          Your agents need
          <br />
          <em className="not-italic text-accent">identity too.</em>
        </h2>
        <p className="mb-14 max-w-[500px] text-base leading-relaxed text-muted">
          Every agent that touches a business system needs scoped access, an
          audit trail, and instant revocation. ForgeID is the first IAM platform
          where agents are first-class principals.
        </p>

        <div className="grid items-center gap-[60px] max-md:grid-cols-1 md:grid-cols-2">
          {/* Flow steps */}
          <ul>
            {steps.map((step) => (
              <li
                key={step.num}
                className="landing-flow-step relative mb-8 flex gap-5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-accent/25 bg-accent/[0.05] font-mono text-xs text-accent">
                  {step.num}
                </div>
                <div>
                  <div className="mb-1 text-[15px] font-semibold">
                    {step.title}
                  </div>
                  <div className="text-[13px] leading-relaxed text-muted">
                    {step.desc}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Delegation chain card */}
          <div className="rounded-xl border border-white/[0.07] bg-surface p-6 font-mono">
            <div className="mb-5 text-[10px] uppercase tracking-[2px] text-muted">
              Delegation chain · JWT payload
            </div>

            {/* Chain entries */}
            <ChainEntry
              avatar="👤"
              avatarBg="bg-accent/10"
              name="Girish · usr_01HZ8K..."
              meta="roles: admin · session: passkey · org: intelliforge"
            />
            <div className="ml-[17px] h-3.5 border-l border-dashed border-accent/20" />
            <ChainEntry
              avatar="🤖"
              avatarBg="bg-accent-cyan/10"
              name="CRM Agent · agent_01HZ9M..."
              meta="spawned by usr_01HZ8K · ttl: 2h · tools: 50"
            />
            <div className="ml-[17px] h-3.5 border-l border-dashed border-accent/20" />
            <ChainEntry
              avatar="⚡"
              avatarBg="bg-accent-amber/10"
              name="Sub-agent · agent_01HZAM..."
              meta="spawned by agent_01HZ9M · ttl: 30m · tools: 10"
            />

            {/* Allowed */}
            <div className="mt-4 rounded-md border border-accent/10 bg-accent/[0.04] p-3">
              <div className="mb-1.5 text-[10px] uppercase tracking-wider text-accent">
                Allowed
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-[3px] bg-accent/10 px-2 py-[3px] text-[10px] text-accent">
                  crm:write
                </span>
                <span className="rounded-[3px] bg-accent/10 px-2 py-[3px] text-[10px] text-accent">
                  invoice:read
                </span>
              </div>
            </div>

            {/* Denied */}
            <div className="mt-2 rounded-md border border-red-500/10 bg-red-500/[0.03] p-3">
              <div className="mb-1.5 text-[10px] uppercase tracking-wider text-[#FF7070]">
                Denied
              </div>
              <div className="flex flex-wrap gap-2">
                {["billing:*", "members:delete", "admin:*"].map((perm) => (
                  <span
                    key={perm}
                    className="rounded-[3px] bg-red-500/10 px-2 py-[3px] text-[10px] text-[#FF7070]"
                  >
                    {perm}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ChainEntry({
  avatar,
  avatarBg,
  name,
  meta,
}: {
  avatar: string;
  avatarBg: string;
  name: string;
  meta: string;
}) {
  return (
    <div className="mb-3.5 flex items-center gap-3">
      <div
        className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg text-sm ${avatarBg}`}
      >
        {avatar}
      </div>
      <div>
        <div className="text-xs text-foreground">{name}</div>
        <div className="text-[10px] text-muted">{meta}</div>
      </div>
    </div>
  );
}

function NumbersSection() {
  const numbers = [
    { val: "<10ms", label: "Token verify\nat Vercel Edge globally" },
    { val: "0", label: "Private keys\never in a database" },
    { val: "3", label: "Fly.io regions\nMumbai · Singapore · US" },
    { val: "40+", label: "Typed webhook\nevents, Stripe-style" },
  ];

  return (
    <section className="relative z-[1] border-y border-white/[0.07] bg-[#090D15] px-10 py-20 max-md:px-5">
      <div className="mx-auto max-w-[1060px]">
        <span className="mb-5 block font-mono text-[10px] uppercase tracking-[2.5px] text-accent before:opacity-40 before:content-['[_'] after:opacity-40 after:content-['_]']">
          By the numbers
        </span>
        <h2 className="mb-4 font-heading text-[clamp(28px,4vw,48px)] font-extrabold leading-[1.05] tracking-tight">
          Built for <em className="not-italic text-accent">scale</em>.
        </h2>

        <div className="mt-10 grid gap-px overflow-hidden rounded-xl bg-white/[0.07] max-md:grid-cols-1 md:grid-cols-4">
          {numbers.map((n) => (
            <div key={n.val} className="bg-[#090D15] px-7 py-9">
              <div className="mb-2 font-heading text-[44px] font-extrabold leading-none text-accent">
                {n.val}
              </div>
              <div className="whitespace-pre-line font-mono text-[11px] uppercase leading-normal tracking-wider text-muted">
                {n.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ComparisonSection() {
  type Row = {
    product: string;
    authn: "tick" | "cross";
    authz: "tick" | "cross" | "warn";
    agent: "tick" | "cross";
    mcp: "tick" | "cross";
    pricing: "tick" | "cross";
    ours?: boolean;
  };

  const rows: Row[] = [
    {
      product: "ForgeID ✦",
      authn: "tick",
      authz: "tick",
      agent: "tick",
      mcp: "tick",
      pricing: "tick",
      ours: true,
    },
    {
      product: "Clerk / Auth0",
      authn: "tick",
      authz: "cross",
      agent: "cross",
      mcp: "cross",
      pricing: "cross",
    },
    {
      product: "Okta / Azure AD",
      authn: "tick",
      authz: "warn",
      agent: "cross",
      mcp: "cross",
      pricing: "cross",
    },
    {
      product: "WorkOS",
      authn: "tick",
      authz: "cross",
      agent: "cross",
      mcp: "cross",
      pricing: "cross",
    },
    {
      product: "Permit.io",
      authn: "cross",
      authz: "tick",
      agent: "cross",
      mcp: "cross",
      pricing: "cross",
    },
  ];

  const iconMap = {
    tick: <span className="text-accent">✓</span>,
    cross: <span className="text-white/20">✕</span>,
    warn: <span className="text-accent-amber">⚠</span>,
  };

  return (
    <section className="relative z-[1] px-10 py-[100px] max-md:px-5">
      <div className="mx-auto max-w-[1060px]">
        <span className="mb-5 block font-mono text-[10px] uppercase tracking-[2.5px] text-accent before:opacity-40 before:content-['[_'] after:opacity-40 after:content-['_]']">
          Why ForgeID
        </span>
        <h2 className="mb-4 font-heading text-[clamp(28px,4vw,48px)] font-extrabold leading-[1.05] tracking-tight">
          Everyone solves <em className="not-italic text-accent">half</em>
          <br />
          the problem.
        </h2>

        <div className="mt-10 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {[
                  "Product",
                  "AuthN",
                  "Fine-grained AuthZ",
                  "Agent Identity",
                  "MCP Server",
                  "India pricing",
                ].map((h) => (
                  <th
                    key={h}
                    className="border-b border-white/[0.07] px-4 py-3 text-left font-mono text-[10px] uppercase tracking-[1.5px] font-normal text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.product}
                  className={
                    r.ours ? "text-accent font-bold" : "text-muted"
                  }
                >
                  <td
                    className={`border-b border-white/[0.04] px-4 py-3.5 text-[13.5px] font-semibold ${r.ours ? "font-heading text-[15px] text-accent" : "text-foreground"}`}
                  >
                    {r.product}
                  </td>
                  <td className="border-b border-white/[0.04] px-4 py-3.5 text-[13.5px]">
                    {iconMap[r.authn]}
                  </td>
                  <td className="border-b border-white/[0.04] px-4 py-3.5 text-[13.5px]">
                    {iconMap[r.authz]}
                  </td>
                  <td className="border-b border-white/[0.04] px-4 py-3.5 text-[13.5px]">
                    {iconMap[r.agent]}
                  </td>
                  <td className="border-b border-white/[0.04] px-4 py-3.5 text-[13.5px]">
                    {iconMap[r.mcp]}
                  </td>
                  <td className="border-b border-white/[0.04] px-4 py-3.5 text-[13.5px]">
                    {r.product === "Okta / Azure AD"
                      ? <span className="text-white/20">✕ $$$</span>
                      : iconMap[r.pricing]}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

type PlanData = {
  name: string;
  price: string;
  period: string;
  featured?: boolean;
  features: string[];
  cta: string;
};

function PricingSection() {
  const plans: PlanData[] = [
    {
      name: "Starter",
      price: "Free",
      period: "forever",
      features: [
        "10,000 MAUs",
        "1 organization",
        "Basic RBAC",
        "50 agent tokens / month",
        "Community support",
      ],
      cta: "Get started",
    },
    {
      name: "Growth · Most popular",
      price: "₹4,999",
      period: "per month",
      featured: true,
      features: [
        "100,000 MAUs",
        "Custom roles + policies",
        "Audit logs · 90 days",
        "Fine-grained AuthZ",
        "5,000 agent tokens / month",
        "Webhooks + event stream",
      ],
      cta: "Start Growth plan",
    },
    {
      name: "Scale",
      price: "₹19,999",
      period: "per month",
      features: [
        "Unlimited MAUs",
        "SSO · SAML · SCIM 2.0",
        "SIEM export + SLA 99.9%",
        "50,000 agent tokens / month",
        "Terraform provider",
        "Dedicated support",
      ],
      cta: "Contact us",
    },
  ];

  return (
    <section
      className="relative z-[1] border-y border-white/[0.07] bg-[#090D15] px-10 py-20 max-md:px-5"
      id="pricing"
    >
      <div className="mx-auto max-w-[1060px]">
        <span className="mb-5 block font-mono text-[10px] uppercase tracking-[2.5px] text-accent before:opacity-40 before:content-['[_'] after:opacity-40 after:content-['_]']">
          Pricing
        </span>
        <h2 className="mb-4 font-heading text-[clamp(28px,4vw,48px)] font-extrabold leading-[1.05] tracking-tight">
          Start free.
          <br />
          <em className="not-italic text-accent">Scale as you grow.</em>
        </h2>
        <p className="mb-14 max-w-[500px] text-base leading-relaxed text-muted">
          India-first pricing. No USD surprises. Agent tokens billed per-use on
          top.
        </p>

        <div className="grid gap-4 max-md:grid-cols-1 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl border p-8 transition-colors ${
                plan.featured
                  ? "border-accent bg-accent/[0.03] hover:border-accent"
                  : "border-white/[0.07] bg-surface hover:border-white/[0.14]"
              }`}
            >
              <div
                className={`mb-4 font-mono text-[11px] uppercase tracking-[2px] ${plan.featured ? "text-accent" : "text-muted"}`}
              >
                {plan.name}
              </div>
              <div
                className={`mb-1 font-heading text-[44px] font-extrabold leading-none ${plan.featured ? "text-accent" : ""}`}
              >
                {plan.price}
              </div>
              <div className="mb-7 font-mono text-[13px] text-muted">
                {plan.period}
              </div>
              <ul className="mb-7">
                {plan.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-start gap-2.5 border-b border-white/[0.04] py-2 text-[13.5px] text-muted"
                  >
                    <span className="mt-[1px] shrink-0 text-xs text-accent">
                      ✓
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <button
                className={`block w-full cursor-pointer rounded-[7px] border py-[11px] text-center text-sm font-semibold transition-all ${
                  plan.featured
                    ? "border-transparent bg-accent text-black hover:opacity-[0.88]"
                    : "border-white/[0.07] bg-transparent text-foreground hover:border-white/20"
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-5 text-center font-mono text-[11px] leading-loose text-muted">
          Agent token overage: ₹0.10 / token &nbsp;·&nbsp; SSO connection:
          ₹999 &nbsp;·&nbsp; Audit export: ₹499
        </p>
      </div>
    </section>
  );
}

function CtaSection() {
  return (
    <section className="landing-cta-glow relative z-[1] px-10 py-[120px] text-center">
      <h2 className="relative z-[1] mb-5 font-heading text-[clamp(36px,6vw,72px)] font-extrabold leading-none tracking-[-2.5px]">
        The identity layer
        <br />
        for the <em className="not-italic text-accent">agentic era</em>
      </h2>
      <p className="relative z-[1] mx-auto mb-10 max-w-[440px] text-[17px] text-muted">
        Join the waitlist. First 100 teams get Growth plan free for 3 months.
      </p>
      <div className="relative z-[1] flex flex-wrap justify-center gap-3.5">
        <a
          href="mailto:contact@intelliforge.tech?subject=ForgeID Early Access"
          className="rounded-lg bg-accent px-7 py-[13px] text-[15px] font-bold text-black transition-all hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,255,178,0.2)]"
        >
          Get early access →
        </a>
        <a
          href="https://intelliforge.tech"
          className="rounded-lg border border-white/[0.07] bg-transparent px-7 py-[13px] text-[15px] font-semibold text-foreground transition-all hover:border-white/20"
        >
          About IntelliForge AI
        </a>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative z-[1] border-t border-white/[0.07] px-10 py-9 max-md:px-5">
      <div className="mx-auto flex max-w-[1060px] flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent font-heading text-[9px] font-extrabold text-black">
            FID
          </span>
          <span className="font-heading text-[15px] font-extrabold tracking-tight">
            Forge<span className="text-accent">ID</span>
          </span>
          <span className="ml-2 font-mono text-[11px] text-muted">
            by IntelliForge AI
          </span>
        </div>
        <span className="font-mono text-[11px] text-muted">
          © 2026 IntelliForge AI · Hyderabad, Telangana ·
          contact@intelliforge.tech
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-muted">
          🇮🇳 Bharat AI Mission Aligned
        </span>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  return (
    <div className="landing-root min-h-screen bg-background text-foreground">
      <div className="landing-grid-bg" />
      <Nav />
      <Hero />
      <CodeDemo />
      <div className="landing-divider" />
      <LogoBar />
      <div className="landing-divider" />
      <ContrastSection />
      <SurfacesSection />
      <AgentFlowSection />
      <NumbersSection />
      <ComparisonSection />
      <PricingSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
