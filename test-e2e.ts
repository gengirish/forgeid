/**
 * ForgeID E2E Test — Full Demo Flow
 * 
 * 1. Health + JWKS
 * 2. Issue human token (password grant)
 * 3. Verify token
 * 4. Create API key
 * 5. Spawn AI agent with scoped capabilities
 * 6. Verify agent token (delegation chain)
 * 7. Permission check (allowed + denied)
 * 8. Query audit log
 * 9. Terminate agent (instant revocation)
 * 10. Verify revoked token is rejected
 */

const API = process.env.API_URL ?? "http://localhost:4000";

const ORG_ID = "org_intelliforge";
const USER_EMAIL = "girish@intelliforge.tech";
const DEV_PASSWORD = "forgeid-demo-2026";

async function api(method: string, path: string, body?: unknown, token?: string) {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers: h,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string, detail?: string) {
  if (condition) {
    console.log(`  \u2705 ${label}`);
    passed++;
  } else {
    console.log(`  \u274C ${label}${detail ? ` \u2014 ${detail}` : ""}`);
    failed++;
  }
}

async function run() {
  console.log("\n\u2554\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2557");
  console.log("\u2551       ForgeID E2E Test \u2014 Full Demo Flow            \u2551");
  console.log("\u255A\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u255D\n");

  // ---- Step 1: Health ----
  console.log("[1/12] Health Check");
  const health = await api("GET", "/health");
  assert(health.status === 200, "API is healthy");
  assert(health.json?.data?.status === "ok", "Status is ok");

  // ---- Step 2: JWKS ----
  console.log("\n[2/12] JWKS Endpoint");
  const jwks = await api("GET", "/v1/token/jwks");
  assert(jwks.status === 200, "JWKS returns 200");
  assert(jwks.json?.data?.keys?.length > 0, "Has at least one key");
  assert(jwks.json?.data?.keys?.[0]?.alg === "RS256", "Algorithm is RS256");

  // ---- Step 3: Issue Human Token ----
  console.log("\n[3/12] Issue Human Token (password grant)");
  const tokenRes = await api("POST", "/v1/token", {
    grant_type: "password",
    username: USER_EMAIL,
    password: DEV_PASSWORD,
    org_id: ORG_ID,
  });
  assert(tokenRes.status === 200, "Token issued", `status=${tokenRes.status} ${JSON.stringify(tokenRes.json?.error)}`);
  
  const humanToken = tokenRes.json?.data?.access_token;
  const refreshTok = tokenRes.json?.data?.refresh_token;
  
  if (!humanToken) {
    console.log("\n  FATAL: No human token. Cannot proceed.\n");
    process.exit(1);
  }
  assert(!!humanToken, "Access token received");
  assert(!!refreshTok, "Refresh token received");
  assert(tokenRes.json?.data?.token_type === "Bearer", "Token type is Bearer");
  assert(tokenRes.json?.data?.expires_in > 0, `Expires in ${tokenRes.json?.data?.expires_in}s`);
  console.log(`    Token: ${humanToken.slice(0, 40)}...`);

  // ---- Step 4: Verify Token ----
  console.log("\n[4/12] Verify Human Token");
  const verify = await api("POST", "/v1/token/verify", { token: humanToken });
  assert(verify.status === 200, "Token verified");
  assert(verify.json?.data?.claims?.identity_type === "user", "Identity type is user");
  assert(verify.json?.data?.claims?.org_id === ORG_ID, `Org ID matches: ${verify.json?.data?.claims?.org_id}`);
  assert(verify.json?.data?.claims?.email === USER_EMAIL, "Email matches");

  // ---- Step 5: Create API Key ----
  console.log("\n[5/12] Create API Key");
  const apiKeyRes = await api("POST", "/v1/api-keys", {
    name: "CRM Production",
    scopes: ["crm:write", "invoice:read"],
  }, humanToken);
  assert(apiKeyRes.status === 200, "API key created", `status=${apiKeyRes.status} ${JSON.stringify(apiKeyRes.json?.error)}`);
  const rawKey = apiKeyRes.json?.data?.raw_key;
  assert(rawKey?.startsWith("sk_live_"), `Key starts with sk_live_: ${rawKey?.slice(0, 16)}...`);
  const apiKeyId = apiKeyRes.json?.data?.id;
  assert(!!apiKeyId, `Key ID: ${apiKeyId}`);
  console.log(`    Raw key: ${rawKey?.slice(0, 24)}...`);

  // ---- Step 6: Spawn AI Agent ----
  console.log("\n[6/12] Spawn AI Agent (Delegation)");
  const agentRes = await api("POST", "/v1/agents", {
    capabilities: ["crm:write", "invoice:read"],
    max_lifetime_minutes: 120,
    max_tool_calls: 50,
    purpose: "nightly CRM reconciliation",
    model: "claude-sonnet-4-20250514",
  }, humanToken);
  assert(agentRes.status === 200, "Agent spawned", `status=${agentRes.status} ${JSON.stringify(agentRes.json?.error)}`);

  const agentToken = agentRes.json?.data?.access_token;
  const agentId = agentRes.json?.data?.agent_id;
  assert(!!agentToken, "Agent token received");
  assert(agentId?.startsWith("agent_"), `Agent ID: ${agentId}`);
  console.log(`    Agent: ${agentId}`);
  console.log(`    Delegation chain depth: ${agentRes.json?.data?.delegation_chain?.length}`);

  // ---- Step 7: Verify Agent Token ----
  if (agentToken) {
    console.log("\n[7/12] Verify Agent Token (Delegation Chain)");
    const agentVerify = await api("POST", "/v1/token/verify", { token: agentToken });
    assert(agentVerify.status === 200, "Agent token verified");
    const c = agentVerify.json?.data?.claims;
    assert(c?.identity_type === "agent", "Identity type is agent");
    assert(c?.agent_type === "delegated", "Agent type is delegated");
    assert(Array.isArray(c?.delegation_chain), "Has delegation chain");
    assert(c?.capabilities?.includes("crm:write"), "Has crm:write capability");
    assert(c?.capabilities?.includes("invoice:read"), "Has invoice:read capability");
    assert(c?.max_tool_calls === 50, `Max tool calls: ${c?.max_tool_calls}`);
    assert(c?.purpose === "nightly CRM reconciliation", "Purpose matches");
    console.log(`    Chain: ${JSON.stringify(c?.delegation_chain)}`);
  }

  // ---- Step 8: Permission Check (Allowed) ----
  if (agentToken) {
    console.log("\n[8/12] Permission Check \u2014 ALLOWED");
    const allowed = await api("POST", "/v1/permissions/check", {
      action: "crm:write",
      resource: "contact:123",
    }, agentToken);
    assert(allowed.status === 200, "Permission check returned 200");
    assert(allowed.json?.data?.allowed === true, "crm:write is ALLOWED");
    console.log(`    Result: allowed=${allowed.json?.data?.allowed}, reason="${allowed.json?.data?.reason}"`);
  }

  // ---- Step 9: Permission Check (Denied) ----
  if (agentToken) {
    console.log("\n[9/12] Permission Check \u2014 DENIED");
    const denied = await api("POST", "/v1/permissions/check", {
      action: "billing:read",
    }, agentToken);
    assert(denied.status === 200, "Permission check returned 200");
    assert(denied.json?.data?.allowed === false, "billing:read is DENIED");
    console.log(`    Result: allowed=${denied.json?.data?.allowed}, reason="${denied.json?.data?.reason}"`);
  }

  // ---- Step 10: Query Audit Log ----
  console.log("\n[10/12] Query Audit Log");
  const audit = await api("GET", "/v1/audit?limit=10", undefined, humanToken);
  assert(audit.status === 200, "Audit log query returned 200", `status=${audit.status}`);
  const events = Array.isArray(audit.json?.data) ? audit.json.data : audit.json?.data?.events;
  if (Array.isArray(events)) {
    assert(events.length > 0, `Got ${events.length} audit events`);
    const types = events.map((e: any) => e.event_type).slice(0, 5);
    console.log(`    Recent: ${types.join(", ")}`);
  }

  // ---- Step 11: Terminate Agent ----
  if (agentId) {
    console.log("\n[11/12] Terminate Agent (Instant Revocation)");
    const term = await api("DELETE", `/v1/agents/${agentId}`, undefined, humanToken);
    assert(term.status === 200, "Agent terminated", `status=${term.status}`);
    assert(term.json?.data?.terminated === true, "terminated=true");
    console.log(`    Agent ${agentId} terminated`);
  }

  // ---- Step 12: Verify Revoked Token Rejected ----
  if (agentToken) {
    console.log("\n[12/12] Verify Revoked Token is Rejected");
    const rejected = await api("POST", "/v1/token/verify", { token: agentToken });
    const isRejected =
      rejected.status === 401 ||
      rejected.json?.error?.code === "token_revoked" ||
      rejected.json?.error?.code === "authentication_required";
    assert(isRejected, "Revoked token is rejected", `status=${rejected.status} ${JSON.stringify(rejected.json?.error?.code)}`);
    console.log(`    Status: ${rejected.status}, code: ${rejected.json?.error?.code}`);
  }

  // ---- Summary ----
  console.log("\n" + "=".repeat(55));
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log("=".repeat(55) + "\n");

  if (failed > 0) process.exit(1);
}

run().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
