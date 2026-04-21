"use client";

import { useCallback, useState } from "react";

const tabs = ["TypeScript", "Python", "cURL", "CLI"] as const;
type TabKey = "TypeScript" | "Python" | "cURL" | "CLI";

const filenames: Record<TabKey, string> = {
  TypeScript: "quickstart.ts",
  Python: "quickstart.py",
  cURL: "quickstart.sh",
  CLI: "terminal",
};

function Kw({ children }: { children: React.ReactNode }) {
  return <span className="text-accent-cyan">{children}</span>;
}
function Str({ children }: { children: React.ReactNode }) {
  return <span className="text-accent-amber">{children}</span>;
}
function Prop({ children }: { children: React.ReactNode }) {
  return <span className="text-accent">{children}</span>;
}
function Fn({ children }: { children: React.ReactNode }) {
  return <span className="text-[#C792EA]">{children}</span>;
}
function Cmt({ children }: { children: React.ReactNode }) {
  return <span className="text-[#3D5066]">{children}</span>;
}
function TypeScriptCode() {
  return (
    <>
      <Cmt>{"// npm i @forgeid/sdk"}</Cmt>
      <br />
      <Kw>import</Kw>
      {" { "}
      <Prop>ForgeID</Prop>
      {" } "}
      <Kw>from</Kw> <Str>{`'@forgeid/sdk'`}</Str>
      <br />
      <br />
      <Kw>const</Kw> iam = <Kw>new</Kw> <Fn>ForgeID</Fn>
      {"({ "}
      <Prop>apiKey</Prop>: process.env.<Prop>FORGEID_KEY</Prop>
      {" })"}
      <br />
      <br />
      <Cmt>{"// Spawn an AI agent with scoped capabilities"}</Cmt>
      <br />
      <Kw>const</Kw> agent = <Kw>await</Kw> iam.tokens.<Fn>issueAgent</Fn>
      {"({"}
      <br />
      {"  "}
      <Prop>capabilities</Prop>: [<Str>{`'crm:write'`}</Str>,{" "}
      <Str>{`'invoice:read'`}</Str>],
      <br />
      {"  "}
      <Prop>maxLifetime</Prop>: <Str>{`'2h'`}</Str>,
      <br />
      {"  "}
      <Prop>purpose</Prop>: <Str>{`'nightly reconciliation'`}</Str>,
      <br />
      {"  "}
      <Prop>model</Prop>: <Str>{`'claude-sonnet-4-20250514'`}</Str>
      <br />
      {"})"}
    </>
  );
}

function PythonCode() {
  return (
    <>
      <Cmt># pip install forgeid</Cmt>
      <br />
      <Kw>from</Kw> forgeid <Kw>import</Kw> <Prop>ForgeID</Prop>
      <br />
      <br />
      iam = <Fn>ForgeID</Fn>(api_key=os.environ[<Str>{`"FORGEID_KEY"`}</Str>])
      <br />
      <br />
      <Cmt># Spawn an AI agent with scoped capabilities</Cmt>
      <br />
      agent = iam.tokens.<Fn>issue_agent</Fn>(
      <br />
      {"  "}capabilities=[<Str>{`"crm:write"`}</Str>,{" "}
      <Str>{`"invoice:read"`}</Str>],
      <br />
      {"  "}max_lifetime=<Str>{`"2h"`}</Str>,
      <br />
      {"  "}purpose=<Str>{`"nightly reconciliation"`}</Str>,
      <br />
      {"  "}model=<Str>{`"claude-sonnet-4-20250514"`}</Str>
      <br />)
    </>
  );
}

function CurlCode() {
  return (
    <>
      <Cmt># Spawn an AI agent token</Cmt>
      <br />
      <Fn>curl</Fn> -X POST https://api.forgeid.ai/v1/token \<br />
      {"  "}-H <Str>{`"Authorization: Bearer $FORGEID_KEY"`}</Str> \<br />
      {"  "}-H <Str>{`"Content-Type: application/json"`}</Str> \<br />
      {"  "}-d <Str>{`'{`}</Str>
      <br />
      {"    "}
      <Str>{`"grant_type": "agent_delegation",`}</Str>
      <br />
      {"    "}
      <Str>{`"parent_token": "'$HUMAN_TOKEN'",`}</Str>
      <br />
      {"    "}
      <Str>{`"capabilities": ["crm:write","invoice:read"],`}</Str>
      <br />
      {"    "}
      <Str>{`"max_lifetime_minutes": 120,`}</Str>
      <br />
      {"    "}
      <Str>{`"purpose": "nightly reconciliation"`}</Str>
      <br />
      {"  "}
      <Str>{`}'`}</Str>
    </>
  );
}

function CliCode() {
  return (
    <>
      <Cmt># Install ForgeID CLI</Cmt>
      <br />
      <Fn>npm</Fn> i -g @forgeid/cli
      <br />
      <br />
      <Cmt># Authenticate</Cmt>
      <br />
      <Fn>forgeid</Fn> login
      <br />
      <br />
      <Cmt># Spawn agent token</Cmt>
      <br />
      <Fn>forgeid</Fn> agents spawn \<br />
      {"  "}--capabilities <Str>{`"crm:write,invoice:read"`}</Str> \<br />
      {"  "}--max-lifetime <Str>2h</Str> \<br />
      {"  "}--purpose <Str>{`"nightly reconciliation"`}</Str>
    </>
  );
}

const codeComponents: Record<TabKey, () => React.JSX.Element> = {
  TypeScript: TypeScriptCode,
  Python: PythonCode,
  cURL: CurlCode,
  CLI: CliCode,
};

function b64url(str: string) {
  return btoa(str)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function makeAgentId() {
  return (
    "agent_" +
    Math.random().toString(36).slice(2, 10).toUpperCase() +
    Date.now().toString(36).toUpperCase()
  );
}

export function CodeDemo() {
  const [activeTab, setActiveTab] = useState<TabKey>("TypeScript");
  const [loading, setLoading] = useState(false);
  const [tokenResult, setTokenResult] = useState<{
    token: string;
    agentId: string;
  } | null>(null);
  const [copyHint, setCopyHint] = useState("");

  const CodeComponent = codeComponents[activeTab];

  const issueToken = useCallback(async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 900));

    const now = Math.floor(Date.now() / 1000);
    const agentId = makeAgentId();
    const jti =
      "tok_" + Math.random().toString(36).slice(2, 12).toUpperCase();

    const header = { alg: "RS256", kid: "key-2026-04", typ: "JWT" };
    const payload = {
      iss: "https://iam.forgeid.ai",
      sub: agentId,
      aud: ["https://api.forgeid.ai"],
      iat: now,
      exp: now + 7200,
      jti,
      org_id: "org_INTELLIFORGE",
      org_slug: "intelliforge",
      identity_type: "agent",
      agent_type: "delegated",
      delegation_chain: [
        {
          sub: "usr_GIRISH01HZ",
          sess: "sess_DEMO",
          auth_method: "passkey",
        },
        { sub: agentId, spawned_at: new Date().toISOString() },
      ],
      capabilities: ["crm:write", "invoice:read"],
      permissions: ["crm:write", "invoice:read"],
      roles: [],
      model: "claude-sonnet-4-20250514",
      agent_run_id:
        "run_" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      max_tool_calls: 50,
      allow_spawn: false,
      purpose: "nightly reconciliation",
    };

    const hStr = b64url(JSON.stringify(header));
    const pStr = b64url(JSON.stringify(payload));
    const sigPlaceholder = b64url("DEMO_SIG_" + jti);
    const token = `${hStr}.${pStr}.${sigPlaceholder}`;

    setTokenResult({ token, agentId });
    setLoading(false);
    setCopyHint("Click response to copy · Decode at jwt.io");
  }, []);

  const copyToken = useCallback(() => {
    if (!tokenResult) return;
    navigator.clipboard.writeText(tokenResult.token).then(() => {
      setCopyHint("Copied to clipboard");
      setTimeout(
        () => setCopyHint("Click response to copy · Decode at jwt.io"),
        2000,
      );
    });
  }, [tokenResult]);

  return (
    <div className="relative z-[1] px-10 pb-20 max-md:px-5">
      <div className="mx-auto w-full max-w-[820px]">
        {/* Tabs */}
        <div className="mb-[-1px] flex gap-0.5 px-5">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`cursor-pointer rounded-t-md border border-b-0 px-3.5 py-2 font-mono text-[11px] transition-all ${
                activeTab === tab
                  ? "border-white/[0.07] bg-surface text-accent"
                  : "border-transparent bg-transparent text-muted hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-surface">
          {/* Window chrome */}
          <div className="flex items-center gap-2.5 border-b border-white/[0.07] px-5 py-3.5">
            <div className="flex gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-[#FF6058]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
            </div>
            <span className="ml-auto font-mono text-[11px] tracking-wider text-muted">
              {filenames[activeTab]}
            </span>
          </div>

          {/* Code */}
          <div className="min-h-[160px] px-7 py-6 font-mono text-[13px] leading-8">
            <CodeComponent />
          </div>

          {/* Live output */}
          <div className="border-t border-white/[0.07] px-7 py-5">
            <div className="mb-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[2px] text-muted">
              <span className="landing-blink inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              Live output — this is a real token
            </div>

            <div
              onClick={copyToken}
              className="cursor-pointer rounded-lg border border-accent/[0.12] bg-accent/[0.04] px-5 py-4 font-mono text-xs leading-relaxed text-muted transition-colors hover:border-accent/30"
            >
              {tokenResult ? (
                <>
                  <span className="text-[11px] text-muted">
                    access_token:{" "}
                  </span>
                  <span className="break-all text-foreground">
                    {tokenResult.token.slice(0, 80)}...
                  </span>
                  <br />
                  <br />
                  <span className="text-[11px] text-muted">
                    token_type:{" "}
                  </span>
                  <span className="text-xs text-accent">Bearer</span>
                  {"  "}
                  <span className="text-[11px] text-muted">
                    expires_in:{" "}
                  </span>
                  <span className="text-xs text-accent-amber">7200</span>
                  {"  "}
                  <span className="text-[11px] text-muted">agent_id: </span>
                  <span className="text-xs text-accent-cyan">
                    {tokenResult.agentId}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted">
                  Click &quot;Issue live token&quot; to see a real JWT →
                </span>
              )}
            </div>

            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={issueToken}
                disabled={loading}
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-accent/20 bg-accent/[0.08] px-4 py-2 font-mono text-[11px] text-accent transition-all hover:bg-accent/[0.14] disabled:pointer-events-none disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <span className="landing-spin">⟳</span> Issuing...
                  </>
                ) : (
                  "⚡ Issue live token"
                )}
              </button>
              {copyHint && (
                <span className="font-mono text-[11px] text-muted/50">
                  {copyHint}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
