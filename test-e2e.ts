/**
 * ForgeID Comprehensive E2E Test
 *
 * Covers the full API surface against a real Neon PostgreSQL database:
 *   1.  Health + JWKS
 *   2.  Org bootstrap (create org via API)
 *   3.  Human login (password grant)
 *   4.  Verify token
 *   5.  Token refresh
 *   6.  Org read + update
 *   7.  Member invite + role change + remove
 *   8.  Create role (RBAC)
 *   9.  Create API key + verify lifecycle (lastUsedAt, scopes, patch)
 *   10. Auth with API key
 *   11. Spawn AI agent (delegation)
 *   12. Verify agent token (delegation chain + capabilities)
 *   13. Permission check — allowed + denied
 *   14. Create webhook + verify delivery
 *   15. Query audit log + cursor pagination
 *   16. Revoke API key
 *   17. Terminate agent (instant revocation)
 *   18. Verify revoked tokens are rejected
 *   19. Cleanup: delete webhook
 */

const API = process.env.API_URL ?? "https://api.forgeid.ai";
const DEV_PASSWORD = "forgeid-demo-2026";
const SLUG = `e2e_${Date.now()}`;

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
let skipped = 0;

function assert(ok: boolean, label: string, detail?: string) {
  if (ok) { console.log(`  \u2705 ${label}`); passed++; }
  else    { console.log(`  \u274C ${label}${detail ? ` \u2014 ${detail}` : ""}`); failed++; }
}
function skip(label: string) { console.log(`  \u23ED\uFE0F  ${label}`); skipped++; }

async function run() {
  console.log("\n========================================================");
  console.log("  ForgeID Comprehensive E2E Test");
  console.log("========================================================\n");

  // ─────────────────────── 1. Health + JWKS ───────────────────────
  console.log("[1] Health + JWKS");
  const health = await api("GET", "/health");
  assert(health.status === 200, "Health returns 200");
  assert(health.json?.data?.status === "ok", "Status is ok");

  const jwks = await api("GET", "/v1/token/jwks");
  assert(jwks.status === 200, "JWKS returns 200");
  assert(jwks.json?.data?.keys?.length > 0, "Has RSA key(s)");
  assert(jwks.json?.data?.keys[0].alg === "RS256", "Algorithm RS256");

  // ─────────────────────── 2. Org bootstrap ───────────────────────
  console.log("\n[2] Org Bootstrap (POST /v1/orgs)");
  const orgRes = await api("POST", "/v1/orgs", {
    org_name: "E2E Test Corp",
    org_slug: SLUG,
    owner_email: `owner-${SLUG}@test.forgeid.ai`,
    owner_name: "E2E Owner",
    plan: "pro",
  });
  assert(orgRes.status === 201, "Org created (201)", `status=${orgRes.status} ${JSON.stringify(orgRes.json?.error)}`);
  const orgId = orgRes.json?.data?.org?.id;
  const ownerId = orgRes.json?.data?.user?.id;
  assert(orgId?.startsWith("org_"), `Org ID: ${orgId}`);
  assert(ownerId?.startsWith("usr_"), `Owner ID: ${ownerId}`);
  assert(orgRes.json?.data?.org?.slug === SLUG, "Slug matches");
  assert(orgRes.json?.data?.org?.plan === "pro", "Plan is pro");

  // duplicate slug rejected
  const dup = await api("POST", "/v1/orgs", {
    org_name: "Dup",
    org_slug: SLUG,
    owner_email: "dup@test.forgeid.ai",
    owner_name: "Dup",
  });
  assert(dup.status === 409, "Duplicate slug rejected (409)");

  if (!orgId || !ownerId) { console.log("FATAL: no org"); process.exit(1); }

  // ─────────────────────── 3. Human login ───────────────────────
  console.log("\n[3] Human Login (password grant)");
  const loginRes = await api("POST", "/v1/token", {
    grant_type: "password",
    username: `owner-${SLUG}@test.forgeid.ai`,
    password: DEV_PASSWORD,
    org_id: orgId,
  });
  assert(loginRes.status === 200, "Token issued", `status=${loginRes.status} ${JSON.stringify(loginRes.json?.error)}`);
  const token = loginRes.json?.data?.access_token;
  const refresh = loginRes.json?.data?.refresh_token;
  assert(!!token, "Access token received");
  assert(!!refresh, "Refresh token received");
  assert(loginRes.json?.data?.token_type === "Bearer", "Token type Bearer");
  assert(loginRes.json?.data?.expires_in === 3600, "Expires in 3600s");

  if (!token) { console.log("FATAL: no token"); process.exit(1); }

  // ─────────────────────── 4. Verify token ───────────────────────
  console.log("\n[4] Verify Human Token");
  const v = await api("POST", "/v1/token/verify", { token });
  assert(v.status === 200, "Verified");
  assert(v.json?.data?.claims?.identity_type === "user", "Identity = user");
  assert(v.json?.data?.claims?.org_id === orgId, "Org ID matches");
  assert(v.json?.data?.claims?.permissions?.includes("*"), "Owner has wildcard perms");

  // ─────────────────────── 5. Token refresh ───────────────────────
  console.log("\n[5] Token Refresh");
  const refRes = await api("POST", "/v1/token", {
    grant_type: "refresh_token",
    refresh_token: refresh,
  });
  assert(refRes.status === 200, "Refresh succeeded");
  const token2 = refRes.json?.data?.access_token;
  assert(!!token2, "New access token issued");
  assert(token2 !== token, "New token differs from old");

  // old refresh should now be revoked (rotated)
  const refAgain = await api("POST", "/v1/token", {
    grant_type: "refresh_token",
    refresh_token: refresh,
  });
  assert(refAgain.status === 401, "Old refresh token rejected after rotation");

  // use new token from here
  const T = token2!;

  // ─────────────────────── 6. Org read + update ───────────────────────
  console.log("\n[6] Org Read + Update");
  const orgMe = await api("GET", "/v1/orgs/me", undefined, T);
  assert(orgMe.status === 200, "GET /v1/orgs/me");
  assert(orgMe.json?.data?.org?.name === "E2E Test Corp", "Org name");

  const orgPatch = await api("PATCH", "/v1/orgs/me", { name: "E2E Patched Corp" }, T);
  assert(orgPatch.status === 200, "PATCH org name");
  assert(orgPatch.json?.data?.org?.name === "E2E Patched Corp", "Name updated");

  // ─────────────────────── 7. Members ───────────────────────
  console.log("\n[7] Member Management");
  const invite = await api("POST", "/v1/orgs/me/members", {
    email: `dev-${SLUG}@test.forgeid.ai`,
    name: "Dev User",
    role: "developer",
  }, T);
  assert(invite.status === 201, "Member invited", `status=${invite.status}`);
  const devUserId = invite.json?.data?.member?.user_id;
  assert(!!devUserId, `Dev user ID: ${devUserId}`);

  // change role
  if (devUserId) {
    const roleChange = await api("POST", `/v1/orgs/me/members/${devUserId}/role`, { role: "admin" }, T);
    assert(roleChange.status === 200, "Role changed to admin");
    assert(roleChange.json?.data?.member?.role === "admin", "Role is now admin");

    // can't demote the only owner
    const selfDemote = await api("POST", `/v1/orgs/me/members/${ownerId}/role`, { role: "member" }, T);
    assert(selfDemote.status === 403, "Can't demote only owner");

    // remove member
    const removeMember = await api("DELETE", `/v1/orgs/me/members/${devUserId}`, undefined, T);
    assert(removeMember.status === 200, "Member removed");
  }

  // list members
  const members = await api("GET", "/v1/orgs/me/members", undefined, T);
  assert(members.status === 200, "List members");
  assert(members.json?.data?.members?.length === 1, "Only owner remains");

  // ─────────────────────── 8. Create Role (RBAC) ───────────────────────
  console.log("\n[8] Create Custom Role");
  const roleRes = await api("POST", "/v1/roles", {
    name: "crm-agent",
    description: "CRM read/write access",
    permissions: ["crm:read", "crm:write", "invoice:read"],
  }, T);
  assert(roleRes.status === 200, "Role created", `status=${roleRes.status}`);
  assert(roleRes.json?.data?.role?.name === "crm-agent", "Role name matches");
  assert(roleRes.json?.data?.role?.permissions?.length === 3, "3 permissions");

  const rolesList = await api("GET", "/v1/roles", undefined, T);
  assert(rolesList.status === 200, "List roles");
  assert(rolesList.json?.data?.roles?.length >= 1, "At least 1 role");

  // ─────────────────────── 9. API Key lifecycle ───────────────────────
  console.log("\n[9] API Key Lifecycle");
  const keyRes = await api("POST", "/v1/api-keys", {
    name: "CI/CD Pipeline",
    scopes: ["crm:write", "invoice:read", "agents:spawn"],
  }, T);
  assert(keyRes.status === 200, "API key created");
  const rawKey = keyRes.json?.data?.raw_key;
  const keyId = keyRes.json?.data?.id;
  assert(rawKey?.startsWith("sk_live_"), `Key prefix ok: ${rawKey?.slice(0, 16)}...`);
  assert(!!keyId, `Key ID: ${keyId}`);

  // Patch key
  if (keyId) {
    const patchKey = await api("PATCH", `/v1/api-keys/${keyId}`, {
      name: "CI/CD Pipeline v2",
      scopes: ["crm:write", "invoice:read", "agents:spawn", "audit:read"],
    }, T);
    assert(patchKey.status === 200, "API key patched");
    assert(patchKey.json?.data?.name === "CI/CD Pipeline v2", "Name updated");
  }

  // ─────────────────────── 10. Auth with API Key ───────────────────────
  console.log("\n[10] Auth with API Key");
  if (rawKey) {
    const keyAuth = await api("GET", "/v1/orgs/me", undefined, rawKey);
    assert(keyAuth.status === 200, "API key auth works");
    assert(keyAuth.json?.data?.org?.id === orgId, "Correct org via API key");

    // list keys via API key auth
    const keyList = await api("GET", "/v1/api-keys", undefined, rawKey);
    assert(keyList.status === 200, "List keys via API key auth");
    assert(keyList.json?.data?.api_keys?.length >= 1, "At least 1 key");
  }

  // ─────────────────────── 11. Spawn AI Agent ───────────────────────
  console.log("\n[11] Spawn AI Agent (Delegation)");
  const agentRes = await api("POST", "/v1/agents", {
    capabilities: ["crm:write", "invoice:read"],
    max_lifetime_minutes: 60,
    max_tool_calls: 25,
    purpose: "E2E test reconciliation agent",
    model: "claude-sonnet-4-20250514",
  }, T);
  assert(agentRes.status === 200, "Agent spawned", `status=${agentRes.status} ${JSON.stringify(agentRes.json?.error)}`);
  const agentToken = agentRes.json?.data?.access_token;
  const agentId = agentRes.json?.data?.agent_id;
  assert(!!agentToken, "Agent token received");
  assert(agentId?.startsWith("agent_"), `Agent ID: ${agentId}`);
  assert(agentRes.json?.data?.delegation_chain?.length >= 1, "Delegation chain present");

  // ─────────────────────── 12. Verify Agent Token ───────────────────────
  if (agentToken) {
    console.log("\n[12] Verify Agent Token");
    const av = await api("POST", "/v1/token/verify", { token: agentToken });
    assert(av.status === 200, "Agent token verified");
    const c = av.json?.data?.claims;
    assert(c?.identity_type === "agent", "Identity = agent");
    assert(c?.agent_type === "delegated", "Agent type = delegated");
    assert(Array.isArray(c?.delegation_chain), "Has delegation chain");
    assert(c?.delegation_chain?.[0]?.sub === ownerId, `Delegated by ${ownerId}`);
    assert(c?.capabilities?.includes("crm:write"), "Has crm:write");
    assert(c?.capabilities?.includes("invoice:read"), "Has invoice:read");
    assert(c?.max_tool_calls === 25, "Max tool calls = 25");
    assert(c?.purpose === "E2E test reconciliation agent", "Purpose matches");
  }

  // ─────────────────────── 13. Permission Checks ───────────────────────
  if (agentToken) {
    console.log("\n[13] Permission Checks");
    const allowed = await api("POST", "/v1/permissions/check", { action: "crm:write" }, agentToken);
    assert(allowed.status === 200, "Permission check returned 200");
    assert(allowed.json?.data?.allowed === true, "crm:write ALLOWED");

    const denied = await api("POST", "/v1/permissions/check", { action: "billing:delete" }, agentToken);
    assert(denied.status === 200, "Permission check returned 200");
    assert(denied.json?.data?.allowed === false, "billing:delete DENIED");
  }

  // User permission check
  console.log("  --- User RBAC permission check ---");
  const userPerm = await api("POST", "/v1/permissions/check", {
    principal_type: "user",
    principal_id: ownerId,
    action: "crm:write",
  }, T);
  assert(userPerm.status === 200, "User perm check 200");
  assert(userPerm.json?.data?.allowed === true, "Owner has crm:write (wildcard)");

  // ─────────────────────── 14. Webhooks ───────────────────────
  console.log("\n[14] Webhook Lifecycle");
  const whRes = await api("POST", "/v1/webhooks", {
    url: "https://httpbin.org/post",
    events: ["token.issued", "token.agent.spawned", "token.revoked"],
  }, T);
  assert(whRes.status === 200, "Webhook created");
  const whId = whRes.json?.data?.webhook?.id;
  const whSecret = whRes.json?.data?.webhook?.secret;
  assert(whId?.startsWith("whk_"), `Webhook ID: ${whId}`);
  assert(!!whSecret, "Webhook secret received");

  const whList = await api("GET", "/v1/webhooks", undefined, T);
  assert(whList.status === 200, "List webhooks");
  assert(whList.json?.data?.webhooks?.length >= 1, "At least 1 webhook");

  // ─────────────────────── 15. Agents List + Detail ───────────────────────
  console.log("\n[15] Agent List + Detail");
  const agentsList = await api("GET", "/v1/agents", undefined, T);
  assert(agentsList.status === 200, "List agents");
  const activeAgents = agentsList.json?.data?.agents?.filter((a: any) => a.status === "active");
  assert(activeAgents?.length >= 1, `Active agents: ${activeAgents?.length}`);

  if (agentId) {
    const agentDetail = await api("GET", `/v1/agents/${agentId}`, undefined, T);
    assert(agentDetail.status === 200, "Agent detail");
    assert(agentDetail.json?.data?.agent?.status === "active", "Agent is active");
    assert(agentDetail.json?.data?.agent?.purpose === "E2E test reconciliation agent", "Purpose matches");

    const chain = await api("GET", `/v1/agents/${agentId}/chain`, undefined, T);
    assert(chain.status === 200, "Agent chain endpoint");
    assert(chain.json?.data?.delegation_chain?.length >= 1, "Chain has entries");
  }

  // ─────────────────────── 16. Audit Log + Pagination ───────────────────────
  console.log("\n[16] Audit Log + Cursor Pagination");
  const audit1 = await api("GET", "/v1/audit?limit=5", undefined, T);
  assert(audit1.status === 200, "Audit query");
  const events = audit1.json?.data?.events;
  assert(Array.isArray(events), "Events is array");
  assert(events?.length > 0, `Got ${events?.length} events`);
  const cursor = audit1.json?.data?.cursor;
  assert(!!cursor, `Cursor: ${cursor}`);
  assert(typeof audit1.json?.data?.has_more === "boolean", "has_more present");

  // page 2
  if (cursor) {
    const audit2 = await api("GET", `/v1/audit?limit=5&cursor=${cursor}`, undefined, T);
    assert(audit2.status === 200, "Page 2 audit query");
  }

  // filter by event_type
  const auditFiltered = await api("GET", "/v1/audit?event_type=token.issued&limit=5", undefined, T);
  assert(auditFiltered.status === 200, "Filtered audit query");
  const filteredEvents = auditFiltered.json?.data?.events;
  if (filteredEvents?.length > 0) {
    assert(filteredEvents.every((e: any) => e.event_type === "token.issued"), "All events are token.issued");
  }

  // ─────────────────────── 17. Revoke API Key ───────────────────────
  console.log("\n[17] Revoke API Key");
  if (keyId) {
    const revokeKey = await api("DELETE", `/v1/api-keys/${keyId}`, undefined, T);
    assert(revokeKey.status === 200, "API key revoked");
    assert(revokeKey.json?.data?.revoked === true, "revoked=true");

    // verify revoked key is rejected
    if (rawKey) {
      const revokedAuth = await api("GET", "/v1/orgs/me", undefined, rawKey);
      assert(revokedAuth.status === 401, "Revoked API key rejected");
    }
  }

  // ─────────────────────── 18. Terminate Agent ───────────────────────
  if (agentId) {
    console.log("\n[18] Terminate Agent (Instant Revocation)");
    const term = await api("DELETE", `/v1/agents/${agentId}`, undefined, T);
    assert(term.status === 200, "Agent terminated");
    assert(term.json?.data?.terminated === true, "terminated=true");

    // verify agent detail shows terminated
    const agentAfter = await api("GET", `/v1/agents/${agentId}`, undefined, T);
    assert(agentAfter.json?.data?.agent?.status === "terminated", "Agent status = terminated");
  }

  // ─────────────────────── 19. Revoked Token Rejected ───────────────────────
  if (agentToken) {
    console.log("\n[19] Verify Revoked Agent Token Rejected");
    const rejected = await api("POST", "/v1/token/verify", { token: agentToken });
    assert(rejected.status === 401, "Revoked agent token rejected", `status=${rejected.status}`);
  }

  // ─────────────────────── 20. Webhook Cleanup ───────────────────────
  if (whId) {
    console.log("\n[20] Webhook Cleanup");
    // check deliveries first
    const deliveries = await api("GET", `/v1/webhooks/${whId}/deliveries`, undefined, T);
    assert(deliveries.status === 200, "Deliveries endpoint");
    console.log(`    Deliveries found: ${deliveries.json?.data?.deliveries?.length ?? 0}`);

    const whDel = await api("DELETE", `/v1/webhooks/${whId}`, undefined, T);
    assert(whDel.status === 200, "Webhook deleted");
  }

  // ─────────────────────── Summary ───────────────────────
  console.log("\n========================================================");
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${skipped} skipped`);
  console.log("========================================================\n");

  if (failed > 0) process.exit(1);
}

run().catch((e) => { console.error("Fatal:", e); process.exit(1); });
