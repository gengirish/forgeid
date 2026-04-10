import { useState, useEffect, useCallback } from "react";

const G = "#00FFB2";
const G2 = "#00CCFF";
const AMBER = "#FFBB44";
const BG = "#05080E";
const BG2 = "#0D1220";
const MUTED = "#6B7A96";
const TEXT = "#DDE4EF";
const BORDER = "rgba(255,255,255,0.07)";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Berkeley+Mono&family=Figtree:wght@400;500;600&display=swap');
  *{box-sizing:border-box;margin:0;padding:0}
  body{background:${BG};font-family:'Figtree',sans-serif}
  .slide{min-height:100vh;display:flex;flex-direction:column;justify-content:center;padding:72px 80px;position:relative;overflow:hidden;background:${BG}}
  .inner{max-width:1080px;width:100%;margin:0 auto;position:relative;z-index:2}
  .grid{position:absolute;inset:0;background-image:linear-gradient(rgba(0,255,178,.015) 1px,transparent 1px),linear-gradient(90deg,rgba(0,255,178,.015) 1px,transparent 1px);background-size:72px 72px;z-index:0}
  .glow{position:absolute;border-radius:50%;filter:blur(100px);z-index:0;pointer-events:none}
  .label{font-family:'Berkeley Mono',monospace;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${G};margin-bottom:24px;display:block;opacity:.8}
  .label::before{content:'[ ';opacity:.4}
  .label::after{content:' ]';opacity:.4}
  h1{font-family:'Syne',sans-serif;font-size:clamp(44px,6vw,80px);font-weight:800;letter-spacing:-2.5px;line-height:.95;color:${TEXT}}
  h2{font-family:'Syne',sans-serif;font-size:clamp(32px,4vw,56px);font-weight:800;letter-spacing:-1.5px;line-height:1;color:${TEXT}}
  .g{color:${G}} .g2{color:${G2}} .am{color:${AMBER}} .mu{color:${MUTED}}
  .body{font-size:16px;color:${MUTED};line-height:1.7}
  .mono{font-family:'Berkeley Mono',monospace}
  .card{background:rgba(255,255,255,.025);border:1px solid ${BORDER};border-radius:10px;padding:28px}
  .card-g{border-left:2px solid ${G}}
  .card-g2{border-left:2px solid ${G2}}
  .g2c{display:grid;grid-template-columns:1fr 1fr;gap:24px}
  .g3c{display:grid;grid-template-columns:1fr 1fr 1fr;gap:20px}
  .g4c{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:${BORDER};border-radius:10px;overflow:hidden}
  .stat-cell{background:${BG2};padding:32px 24px}
  .stat-n{font-family:'Syne',sans-serif;font-size:48px;font-weight:800;color:${G};line-height:1}
  .stat-l{font-family:'Berkeley Mono',monospace;font-size:11px;color:${MUTED};margin-top:8px;line-height:1.5}
  .li{display:flex;gap:10px;margin-bottom:12px;align-items:flex-start}
  .li-dot{width:5px;height:5px;border-radius:50%;background:${G};margin-top:8px;flex-shrink:0}
  .t{font-size:14px;color:${MUTED};line-height:1.6}
  .badge{display:inline-block;font-family:'Berkeley Mono',monospace;font-size:10px;padding:3px 9px;border-radius:3px}
  .badge-g{background:rgba(0,255,178,.1);color:${G}}
  .badge-r{background:rgba(255,70,70,.1);color:#FF7070}
  .badge-a{background:rgba(255,187,68,.1);color:${AMBER}}
  .slide-num{font-family:'Berkeley Mono',monospace;font-size:10px;color:rgba(255,255,255,.2);letter-spacing:2px;margin-bottom:40px}
  table{width:100%;border-collapse:collapse}
  th{font-family:'Berkeley Mono',monospace;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:${MUTED};padding:10px 14px;text-align:left;border-bottom:1px solid ${BORDER}}
  td{padding:12px 14px;font-size:13.5px;border-bottom:1px solid rgba(255,255,255,.04);color:${MUTED}}
  .ours td{color:${G};font-weight:700}
  .code{background:rgba(0,0,0,.4);border:1px solid rgba(0,255,178,.12);border-radius:8px;padding:18px 22px;font-family:'Berkeley Mono',monospace;font-size:12px;line-height:1.9;color:${MUTED}}
  .nav{position:fixed;bottom:28px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:8px;z-index:100;background:rgba(5,8,14,.92);padding:10px 18px;border-radius:40px;border:1px solid ${BORDER};backdrop-filter:blur(16px)}
  .dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.18);cursor:pointer;transition:all .2s}
  .dot.on{background:${G};width:20px;border-radius:4px}
  .arr{color:${MUTED};cursor:pointer;font-size:16px;padding:0 6px;user-select:none;transition:color .15s}
  .arr:hover{color:${G}}
  .tier{background:rgba(255,255,255,.02);border:1px solid ${BORDER};border-radius:10px;padding:24px}
  .tier.f{border-color:${G};background:rgba(0,255,178,.03)}
  .price-n{font-family:'Syne',sans-serif;font-size:38px;font-weight:800;line-height:1}
  .week{background:rgba(255,255,255,.03);border-left:2px solid rgba(0,255,178,.2);border-radius:0 8px 8px 0;padding:12px 18px;margin-bottom:8px}
  .week.on{border-left-color:${G};background:rgba(0,255,178,.04)}
  .person{display:flex;align-items:center;gap:12px;background:rgba(255,255,255,.02);border:1px solid ${BORDER};border-radius:8px;padding:12px 16px}
  .av{width:34px;height:34px;border-radius:8px;background:linear-gradient(135deg,${G},${G2});display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-weight:800;font-size:11px;color:#000;flex-shrink:0}
`;

const SLIDES = ["cover","problem","solution","product","architecture","market","competition","biz","team","whyjoin","roadmap","ask"];

// ── SLIDES ────────────────────────────────────────────

function Cover() {
  return (
    <div className="slide" style={{background:`radial-gradient(ellipse 70% 60% at 55% 40%,rgba(0,255,178,.07) 0%,transparent 70%), radial-gradient(ellipse 50% 70% at 10% 80%,rgba(0,204,255,.04) 0%,transparent 60%), ${BG}`}}>
      <div className="grid"/>
      <div className="inner" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:80,alignItems:"center"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:32}}>
            <div style={{width:32,height:32,background:G,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Syne",fontWeight:800,fontSize:11,color:"#000"}}>FID</div>
            <span style={{fontFamily:"Berkeley Mono",fontSize:11,color:"rgba(255,255,255,.35)",letterSpacing:2}}>INTELLIFORGE AI</span>
          </div>
          <div className="label">Billion Dollar Build · 2026</div>
          <h1 style={{marginBottom:20}}>Forge<span className="g">ID</span></h1>
          <p style={{fontFamily:"Syne",fontSize:22,fontWeight:700,color:MUTED,marginBottom:12,lineHeight:1.3}}>Identity infrastructure<br/>built for AI agents.</p>
          <p style={{fontFamily:"Berkeley Mono",fontSize:12,color:"rgba(255,255,255,.25)",marginBottom:32,lineHeight:1.7}}>
            8 weeks. 15 builders. One product.<br/>
            Let's build the identity layer for the agentic internet.
          </p>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {["AuthN + AuthZ + Agent Identity","MCP Native","Vercel Edge + Fly.io","India-first pricing"].map(t=>(
              <span key={t} className="badge badge-g" style={{fontSize:11,padding:"4px 10px"}}>{t}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="code" style={{marginBottom:16}}>
            <span style={{color:"rgba(255,255,255,.25)"}}>{`// Spawn an AI agent — 4 lines`}</span><br/>
            <span style={{color:G2}}>const</span> agent = <span style={{color:"rgba(255,255,255,.5)"}}>await</span> iam.tokens.<span style={{color:G}}>issueAgent</span>({`{`}<br/>
            {"  "}<span style={{color:G}}>capabilities</span>: [<span style={{color:AMBER}}>'crm:write'</span>],<br/>
            {"  "}<span style={{color:G}}>maxLifetime</span>: <span style={{color:AMBER}}>'2h'</span>,<br/>
            {"  "}<span style={{color:G}}>purpose</span>: <span style={{color:AMBER}}>'nightly sync'</span><br/>
            {`})`}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12}}>
            {[["8 wk","Sprint"],["5","Squads"],["15","Builders"]].map(([n,l])=>(
              <div key={l} style={{background:"rgba(255,255,255,.03)",border:`1px solid ${BORDER}`,borderRadius:8,padding:"16px 14px"}}>
                <div style={{fontFamily:"Syne",fontSize:28,fontWeight:800,color:G,lineHeight:1}}>{n}</div>
                <div style={{fontFamily:"Berkeley Mono",fontSize:10,color:MUTED,marginTop:6,letterSpacing:.5}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Problem() {
  return (
    <div className="slide">
      <div className="grid"/>
      <div className="glow" style={{width:500,height:500,background:"rgba(255,60,60,.05)",top:"-100px",right:"-100px"}}/>
      <div className="inner">
        <div className="slide-num">01 / 11</div>
        <div className="label">The problem</div>
        <h2 style={{marginBottom:16}}>Every SaaS rebuilds IAM.<br/><span style={{color:"#FF7070"}}>Badly. Every time.</span></h2>
        <p className="body" style={{marginBottom:40,maxWidth:580}}>In 2026, every SaaS also deploys AI agents. Those agents need identity, scoped access, and audit trails. No existing product handles this end-to-end.</p>
        <div className="g3c" style={{marginBottom:32}}>
          {[
            {t:"Auth0 / Clerk",b:"Handles login only. No fine-grained permissions. No agent identity. No delegation chain.",tag:"AuthN gap"},
            {t:"Okta / Azure AD",b:"Enterprise-only. Terrible DX. ₹50L+ deals. Rebuilt from scratch for every new product.",tag:"Cost + DX gap"},
            {t:"Custom RBAC",b:"3–6 months to build per product. No agent model. Security vulnerabilities. Always abandoned.",tag:"Time + risk"},
          ].map(c=>(
            <div key={c.t} className="card" style={{borderTop:`2px solid rgba(255,70,70,.4)`}}>
              <div style={{fontFamily:"Syne",fontSize:18,fontWeight:700,marginBottom:10,color:TEXT}}>{c.t}</div>
              <p className="t" style={{marginBottom:14}}>{c.b}</p>
              <span className="badge badge-r">{c.tag}</span>
            </div>
          ))}
        </div>
        <div className="card card-g" style={{maxWidth:680}}>
          <p style={{fontSize:17,lineHeight:1.7,color:TEXT}}>
            The agentic era has no identity layer. <span className="g">ForgeID is that layer.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function Solution() {
  return (
    <div className="slide">
      <div className="grid"/>
      <div className="glow" style={{width:600,height:400,background:`rgba(0,255,178,.05)`,bottom:"-100px",left:"-100px"}}/>
      <div className="inner">
        <div className="slide-num">02 / 11</div>
        <div className="label">The solution</div>
        <div style={{maxWidth:680,marginBottom:48}}>
          <p style={{fontFamily:"Syne",fontSize:26,fontWeight:800,letterSpacing:-1,lineHeight:1.2,marginBottom:8,color:MUTED,textDecoration:"line-through",opacity:.5}}>
            Not IAM with agent support bolted on.
          </p>
          <p style={{fontFamily:"Syne",fontSize:26,fontWeight:800,letterSpacing:-1,lineHeight:1.2,color:G}}>
            Identity infrastructure built from day one for agents.
          </p>
        </div>
        <div className="g3c">
          {[
            {icon:"🔐",title:"Authentication",items:["Passkeys, magic link, OTP","Enterprise SSO via SAML/OIDC","MFA enforcement per org","Custom JWT with any claims"]},
            {icon:"⚡",title:"AuthZ Engine",items:["Fine-grained: user:can:action:resource","RBAC + ABAC unified model","Zanzibar-inspired, real-time","<10ms verify at Vercel Edge"]},
            {icon:"🤖",title:"Agent Identity",items:["Agents are first-class principals","Delegation chain in every JWT","MCP server — 6 IAM tools","Capability limits + auto-revoke"]},
          ].map(c=>(
            <div key={c.title} className="card card-g">
              <div style={{fontSize:28,marginBottom:14}}>{c.icon}</div>
              <div style={{fontFamily:"Syne",fontSize:20,fontWeight:700,marginBottom:14,color:TEXT}}>{c.title}</div>
              {c.items.map(i=><div key={i} className="li"><div className="li-dot"/><span className="t">{i}</span></div>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Product() {
  return (
    <div className="slide">
      <div className="grid"/>
      <div className="inner">
        <div className="slide-num">03 / 11</div>
        <div className="label">Product surfaces</div>
        <h2 style={{marginBottom:40}}>One platform.<br/><span className="g">Three ways in.</span></h2>
        <div className="g3c">
          {[
            {lbl:"API Friendly",color:G,items:["OpenAPI-first spec + generated SDKs","TypeScript, Python, Go, cURL","Machine-readable errors with doc_url","Idempotency keys on all writes","Postman collection auto-generated"]},
            {lbl:"Agent Friendly",color:G2,items:["MCP Server — 6 IAM tools","iam_check_permission before writes","iam_spawn_agent_token for sub-agents","iam_get_context_block for prompts","iam_revoke_self on task complete"]},
            {lbl:"Automation Friendly",color:AMBER,items:["40+ typed webhook events","Real-time SSE event stream","Terraform provider on registry","GitHub Actions OIDC — zero secrets","SCIM 2.0 for enterprise sync"]},
          ].map(c=>(
            <div key={c.lbl} className="card" style={{borderTop:`2px solid ${c.color}`}}>
              <div style={{fontFamily:"Berkeley Mono",fontSize:10,letterSpacing:2,color:c.color,textTransform:"uppercase",marginBottom:16}}>{c.lbl}</div>
              {c.items.map(i=><div key={i} className="li"><div className="li-dot" style={{background:c.color}}/><span className="t">{i}</span></div>)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Architecture() {
  return (
    <div className="slide">
      <div className="grid"/>
      <div className="inner">
        <div className="slide-num">04 / 11</div>
        <div className="label">Architecture</div>
        <h2 style={{marginBottom:40}}>Vercel Edge + Fly.io<br/><span className="g">Private keys never leave Fly.</span></h2>
        <div className="g2c">
          <div>
            <div className="card card-g2" style={{marginBottom:16}}>
              <div style={{fontFamily:"Berkeley Mono",fontSize:10,color:G2,letterSpacing:2,marginBottom:10,textTransform:"uppercase"}}>Vercel Edge</div>
              <div style={{fontFamily:"Syne",fontSize:17,fontWeight:700,marginBottom:8,color:TEXT}}>Token Verify · JWKS · Rate Limiting</div>
              <p className="t">JWT verify at the edge — no Fly.io roundtrip. Redis revocation via Upstash HTTP. JWKS cached in Edge Config, global in 300ms.</p>
              <div style={{marginTop:12}}><span className="badge badge-g">{"< 10ms globally"}</span></div>
            </div>
            <div className="card card-g">
              <div style={{fontFamily:"Berkeley Mono",fontSize:10,color:G,letterSpacing:2,marginBottom:10,textTransform:"uppercase"}}>Fly.io · bom / sin / iad</div>
              <div style={{fontFamily:"Syne",fontSize:17,fontWeight:700,marginBottom:8,color:TEXT}}>Token Core · KMS Sidecar · Webhooks</div>
              <p className="t">Stateful business logic. KMS Sidecar on Fly internal network — no public port. Private keys in Fly Secrets only.</p>
              <div style={{marginTop:12}}><span className="badge badge-g">RSA-4096 · Keys never in DB</span></div>
            </div>
          </div>
          <div className="code" style={{fontSize:12,lineHeight:2.1}}>
            <span style={{color:G,opacity:.6}}>{`// Verify path (hot path)`}</span><br/>
            <span style={{color:MUTED}}>1.</span> Client → Vercel Edge<br/>
            <span style={{color:MUTED}}>2.</span> <span style={{color:G2}}>Redis revocation check</span> (~3ms)<br/>
            <span style={{color:MUTED}}>3.</span> <span style={{color:G}}>JWKS from Edge Config</span> (~0ms)<br/>
            <span style={{color:MUTED}}>4.</span> Verify JWT signature locally<br/>
            <span style={{color:MUTED}}>5.</span> Return claims → 200<br/>
            <span style={{color:"rgba(255,255,255,.15)"}}>{"// No Fly.io call on verify"}</span>
            <br/><br/>
            <span style={{color:G,opacity:.6}}>{`// Issue path`}</span><br/>
            <span style={{color:MUTED}}>1.</span> Vercel validates + rate-limits<br/>
            <span style={{color:MUTED}}>2.</span> Proxy to Fly Token Core<br/>
            <span style={{color:MUTED}}>3.</span> Token Core calls KMS Sidecar<br/>
            <span style={{color:MUTED}}>4.</span> <span style={{color:G}}>KMS signs with Fly Secret key</span><br/>
            <span style={{color:MUTED}}>5.</span> JWT returned to client<br/>
            <br/>
            <span style={{color:G,opacity:.6}}>{`// Key rotation (monthly cron)`}</span><br/>
            <span style={{color:MUTED}}>1.</span> Fly cron generates RSA-4096<br/>
            <span style={{color:MUTED}}>2.</span> Private key → Fly Secrets<br/>
            <span style={{color:MUTED}}>3.</span> <span style={{color:G2}}>Public key → Vercel Edge Config</span><br/>
            <span style={{color:MUTED}}>4.</span> Global propagation ~300ms
          </div>
        </div>
      </div>
    </div>
  );
}

function Market() {
  return (
    <div className="slide">
      <div className="grid"/>
      <div className="glow" style={{width:500,height:500,background:`rgba(0,255,178,.05)`,top:"40%",right:"-150px"}}/>
      <div className="inner">
        <div className="slide-num">05 / 11</div>
        <div className="label">Market size</div>
        <h2 style={{marginBottom:48}}>A clear path to<br/><span className="g">$1 billion.</span></h2>
        <div className="g4c" style={{marginBottom:32}}>
          {[["$28B","Global IAM market","14% CAGR"],["10K+","Indian B2B SaaS","All rebuilding IAM"],["$400M","Perplexity India","2026 investment"],["∞","Agent tokens","New metered surface"]].map(([n,l,s])=>(
            <div key={l} className="stat-cell">
              <div className="stat-n">{n}</div>
              <div className="stat-l">{l}<br/><span style={{opacity:.5,fontSize:10}}>{s}</span></div>
            </div>
          ))}
        </div>
        <div className="card card-g">
          <div style={{fontFamily:"Syne",fontSize:17,fontWeight:700,marginBottom:16,color:TEXT}}>Expansion path to $1B ARR</div>
          <div style={{display:"flex",gap:0,alignItems:"center",flexWrap:"wrap"}}>
            {[
              {s:"India SaaS",d:"10K companies\n₹4,999/mo",c:"rgba(0,255,178,.1)"},
              {s:"→",d:""},
              {s:"SEA + Global",d:"Agent-native SaaS\n$99/mo",c:"rgba(0,204,255,.1)"},
              {s:"→",d:""},
              {s:"Agent Era",d:"Per-token metered\n₹0.10/token",c:"rgba(255,187,68,.1)"},
              {s:"→",d:""},
              {s:"Enterprise",d:"Fortune 500\n$500K+ ACV",c:"rgba(255,255,255,.04)"},
            ].map((item,i)=>item.s==="→"?(
              <div key={i} style={{fontSize:22,color:"rgba(255,255,255,.2)",padding:"0 8px"}}>→</div>
            ):(
              <div key={i} style={{flex:1,background:item.c,borderRadius:8,padding:"16px 18px",minWidth:120}}>
                <div style={{fontFamily:"Syne",fontWeight:700,fontSize:14,marginBottom:6,color:TEXT}}>{item.s}</div>
                <div style={{fontSize:12,color:MUTED,whiteSpace:"pre-line"}}>{item.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Competition() {
  return (
    <div className="slide">
      <div className="grid"/>
      <div className="inner">
        <div className="slide-num">06 / 11</div>
        <div className="label">Competition</div>
        <h2 style={{marginBottom:12}}>Everyone solves <span style={{color:"#FF7070"}}>half</span>.<br/><span className="g">We solve all of it.</span></h2>
        <p className="body" style={{marginBottom:32,maxWidth:540}}>Clerk handles login. Permit.io handles permissions. WorkOS handles SSO. Nobody handles agents. ForgeID is the only product that ships all five.</p>
        <table>
          <thead>
            <tr><th>Product</th><th>AuthN</th><th>Fine-grained AuthZ</th><th>Agent Identity</th><th>MCP Server</th><th>India pricing</th></tr>
          </thead>
          <tbody>
            <tr className="ours"><td>ForgeID ✦</td>{["✓","✓","✓","✓","✓"].map((v,i)=><td key={i} style={{color:G}}>{v}</td>)}</tr>
            {[
              ["Clerk / Auth0","✓","✕","✕","✕","✕"],
              ["Okta / Azure AD","✓","⚠","✕","✕","✕ $$$"],
              ["WorkOS","✓","✕","✕","✕","✕"],
              ["Permit.io","✕","✓","✕","✕","✕"],
            ].map(([name,...cols])=>(
              <tr key={name}><td style={{color:TEXT,fontWeight:500}}>{name}</td>{cols.map((v,i)=><td key={i} style={{color:v==="✓"?G:v==="⚠"?AMBER:"rgba(255,255,255,.2)"}}>{v}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function BizModel() {
  return (
    <div className="slide">
      <div className="grid"/>
      <div className="inner">
        <div className="slide-num">07 / 11</div>
        <div className="label">Business model</div>
        <h2 style={{marginBottom:40}}>Usage-based + seats.<br/><span className="g">Stripe-style billing.</span></h2>
        <div className="g3c" style={{marginBottom:24}}>
          {[
            {name:"Starter",price:"Free",period:"forever",cls:"",items:["10K MAUs","1 org","Basic RBAC","50 agent tokens/mo"]},
            {name:"Growth",price:"₹4,999",period:"/month",cls:"f",items:["100K MAUs","Custom roles + AuthZ","Audit logs 90 days","5,000 agent tokens/mo","Webhooks + stream"]},
            {name:"Scale",price:"₹19,999",period:"/month",cls:"",items:["Unlimited MAUs","SSO + SAML + SCIM","SIEM export + SLA","50K agent tokens/mo","Terraform provider"]},
          ].map(t=>(
            <div key={t.name} className={`tier ${t.cls}`}>
              {t.cls==="f"&&<div style={{fontFamily:"Berkeley Mono",fontSize:10,color:G,letterSpacing:2,marginBottom:8,textTransform:"uppercase"}}>Most popular</div>}
              <div style={{fontFamily:"Syne",fontSize:18,fontWeight:700,marginBottom:8,color:TEXT}}>{t.name}</div>
              <div className="price-n" style={{color:t.cls==="f"?G:TEXT,marginBottom:4}}>{t.price}</div>
              <div style={{fontFamily:"Berkeley Mono",fontSize:11,color:MUTED,marginBottom:20}}>{t.period}</div>
              {t.items.map(i=><div key={i} className="li"><div className="li-dot"/><span className="t" style={{fontSize:13}}>{i}</span></div>)}
            </div>
          ))}
        </div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
          {[["Agent token overage","₹0.10 / token"],["SSO connection","₹999"],["Audit export","₹499"],["Enterprise ACV","₹25L – ₹1Cr+"]].map(([l,v])=>(
            <div key={l} style={{background:"rgba(255,255,255,.03)",border:`1px solid ${BORDER}`,borderRadius:8,padding:"14px 18px",flex:1,minWidth:160}}>
              <div style={{fontFamily:"Berkeley Mono",fontSize:10,color:MUTED,letterSpacing:1,marginBottom:6}}>{l}</div>
              <div style={{fontFamily:"Syne",fontSize:20,fontWeight:700,color:G}}>{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Team() {
  const squads = [
    {icon:"🔐",squad:"Token Core",own:"You own the security backbone",roles:["Backend Engineer ×2"],ships:["JWT issue / refresh / revoke pipeline","KMS sidecar on Fly.io private network","RSA-4096 key rotation cron","Redis revocation layer via Upstash"],stack:["Hono","Fly.io","Upstash Redis","Node.js"]},
    {icon:"🤖",squad:"Agent & MCP",own:"You define how AI agents get identity",roles:["MCP Engineer ×1","SDK/CLI Lead ×1"],ships:["MCP Server with 6 IAM tools","Agent delegation chain in JWT","TypeScript SDK published to npm","CLI with interactive auth flows"],stack:["MCP Protocol","TypeScript","npm","OpenAPI"]},
    {icon:"🖥️",squad:"Product & Dashboard",own:"You build what customers see every day",roles:["Full-stack ×2","UI/UX Lead ×1"],ships:["Multi-tenant dashboard from scratch","Design system + component library","Real-time audit log explorer","API key management console"],stack:["Next.js","Prisma","Tailwind","Vercel"]},
    {icon:"⚙️",squad:"Infra & DevOps",own:"You keep it fast, secure, and global",roles:["DevOps Engineer ×2"],ships:["Vercel Edge + Fly.io deployment","KMS secrets management pipeline","CI/CD with GitHub Actions OIDC","Terraform provider on registry"],stack:["Fly.io","Vercel","Terraform","GitHub Actions"]},
    {icon:"📈",squad:"GTM & Content",own:"You take ForgeID to 10,000 SaaS teams",roles:["Growth ×2","Content ×1","Pitch & Demo ×2"],ships:["Landing page + SEO pipeline","Developer docs + blog","50 Indian SaaS pilot outreach","June 9 demo day presentation"],stack:["Marketing","Docs","Outreach","Demo"]},
  ];
  return (
    <div className="slide">
      <div className="grid"/>
      <div className="glow" style={{width:600,height:400,background:`rgba(0,255,178,.05)`,top:"-50px",left:"-100px"}}/>
      <div className="inner">
        <div className="slide-num">08 / 11</div>
        <div className="label">Your squad</div>
        <h2 style={{marginBottom:12}}>Pick your squad.<br/><span className="g">Own it end-to-end.</span></h2>
        <p className="body" style={{marginBottom:32,maxWidth:600}}>15 people. 5 squads. Every squad ships something real to production. No busy work — you build, you own, you demo.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {squads.map(s=>(
            <div key={s.squad} className="card card-g" style={{...(s.squad==="Agent & MCP"?{gridColumn:"span 2",display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}:{})}}>
              <div>
                <div style={{fontSize:24,marginBottom:10}}>{s.icon}</div>
                <div style={{fontFamily:"Syne",fontSize:18,fontWeight:700,color:TEXT,marginBottom:4}}>{s.squad}</div>
                <div style={{fontSize:13,color:G,marginBottom:12,fontWeight:600}}>{s.own}</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:14}}>
                  {s.roles.map(r=><span key={r} className="badge badge-a" style={{fontSize:10}}>{r}</span>)}
                </div>
                <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                  {s.stack.map(t=><span key={t} style={{fontFamily:"Berkeley Mono",fontSize:9,color:MUTED,background:"rgba(255,255,255,.04)",padding:"2px 7px",borderRadius:3}}>{t}</span>)}
                </div>
              </div>
              {s.squad==="Agent & MCP"?(
                <div>
                  {s.ships.map(i=><div key={i} className="li"><div className="li-dot"/><span className="t" style={{fontSize:13}}>{i}</span></div>)}
                </div>
              ):(
                <div style={{marginTop:12}}>
                  {s.ships.map(i=><div key={i} className="li"><div className="li-dot"/><span className="t" style={{fontSize:12}}>{i}</span></div>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WhyJoin() {
  const reasons = [
    {icon:"🏗️",title:"Build from zero",desc:"No legacy code. No tech debt. You're not maintaining — you're creating. Every line of code, every design decision, every architecture choice is yours."},
    {icon:"📦",title:"Ship to real users in 8 weeks",desc:"This isn't a side project. We have a roadmap, a demo day (June 9), and real SaaS companies waiting to pilot. You'll see your work used in production."},
    {icon:"🧠",title:"Work on cutting-edge infra",desc:"MCP protocol, Zanzibar-inspired AuthZ, Vercel Edge Functions, Fly.io KMS, agent delegation chains — this is the frontier of identity engineering."},
    {icon:"📝",title:"Resume-defining work",desc:"\"I built the identity layer for AI agents\" is a career-defining line. This is the kind of project top engineers wish they'd joined early."},
  ];
  const principles = [
    {n:"01",t:"Ownership over tickets",d:"You don't get assigned tasks. You own outcomes."},
    {n:"02",t:"Ship > plan",d:"Working code beats slide decks. Demo day is real."},
    {n:"03",t:"Transparent by default",d:"Everyone sees the roadmap, the metrics, and the decisions."},
    {n:"04",t:"Disagree, then commit",d:"Debate the approach. Once decided, execute together."},
  ];
  return (
    <div className="slide">
      <div className="grid"/>
      <div className="glow" style={{width:600,height:500,background:`rgba(0,204,255,.05)`,bottom:"-100px",right:"-100px"}}/>
      <div className="inner">
        <div className="slide-num">09 / 11</div>
        <div className="label">Why join</div>
        <h2 style={{marginBottom:12}}>This isn't a job.<br/><span className="g">It's a founding story.</span></h2>
        <p className="body" style={{marginBottom:36,maxWidth:600}}>You'll tell people you were here when identity for AI agents was built from scratch. Here's what makes this different.</p>
        <div className="g2c" style={{marginBottom:28}}>
          {reasons.map(r=>(
            <div key={r.title} className="card card-g2">
              <div style={{fontSize:22,marginBottom:10}}>{r.icon}</div>
              <div style={{fontFamily:"Syne",fontSize:16,fontWeight:700,color:TEXT,marginBottom:8}}>{r.title}</div>
              <p className="t">{r.desc}</p>
            </div>
          ))}
        </div>
        <div className="card" style={{borderTop:`2px solid ${G}`}}>
          <div style={{fontFamily:"Syne",fontSize:17,fontWeight:700,marginBottom:16,color:TEXT}}>How we work together</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:16}}>
            {principles.map(p=>(
              <div key={p.n}>
                <div style={{fontFamily:"Berkeley Mono",fontSize:22,fontWeight:800,color:G,marginBottom:6,opacity:.5}}>{p.n}</div>
                <div style={{fontWeight:600,fontSize:14,color:TEXT,marginBottom:4}}>{p.t}</div>
                <div className="t" style={{fontSize:12}}>{p.d}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Roadmap() {
  return (
    <div className="slide">
      <div className="grid"/>
      <div className="inner">
        <div className="slide-num">10 / 11</div>
        <div className="label">8-week roadmap</div>
        <h2 style={{marginBottom:40}}>Working business<br/><span className="g">by June 9.</span></h2>
        <div className="g2c">
          <div>
            {[
              {w:"Wk 1–2",t:"Token Core live",d:"Issue · Refresh · Revoke · Verify · KMS on Fly.io bom",on:true},
              {w:"Wk 3–4",t:"Agent + MCP layer",d:"Agent delegation · MCP 6 tools · Context block · Webhook worker",on:true},
              {w:"Wk 5–6",t:"GTM + first customers",d:"Landing page live · Docs · 50 Indian SaaS outreach · 3+ pilots",on:false},
              {w:"Wk 7",t:"Perplexity Computer sprint",d:"Security audit · Auto-docs · SDK generation · SCIM · Terraform stub",on:false},
              {w:"Wk 8",t:"June 9 demo day",d:"Human → agent → MCP → audit → webhook → revoke live on stage",on:false},
            ].map(w=>(
              <div key={w.w} className={`week ${w.on?"on":""}`}>
                <div style={{display:"flex",gap:12,alignItems:"center"}}>
                  <span className="badge badge-g" style={{fontSize:10,whiteSpace:"nowrap"}}>{w.w}</span>
                  <div>
                    <div style={{fontWeight:600,fontSize:14,color:TEXT,marginBottom:2}}>{w.t}</div>
                    <div style={{fontSize:12,color:MUTED}}>{w.d}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card card-g">
            <div style={{fontFamily:"Syne",fontSize:17,fontWeight:700,marginBottom:16,color:TEXT}}>June 9 — Live Demo Script</div>
            <div className="code" style={{fontSize:12,lineHeight:2}}>
              {["1. Girish logs in via passkey — dashboard live","2. Creates API key for CRM app","3. CRM spawns agent token — JWT decoded on screen","4. Agent calls iam_check_permission via MCP","5. Denied action logged → audit event appears","6. Webhook fires to terminal → shown live","7. One click from dashboard kills agent","8. Token verify returns 401 immediately"].map((s,i)=>(
                <div key={i}><span style={{color:G}}>{s.slice(0,2)}</span>{s.slice(2)}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Ask() {
  const expectations = [
    {icon:"⏰",t:"8-week sprint",d:"April 14 → June 9. Intense, focused, meaningful."},
    {icon:"🎯",t:"Clear deliverables",d:"Every squad has a ship list. No ambiguity on what 'done' looks like."},
    {icon:"🎤",t:"Demo day is real",d:"June 9 — live demo in front of judges. Your code runs on stage."},
    {icon:"🤝",t:"Girish has your back",d:"14 years of experience. Architecture decisions, code reviews, and pair programming."},
  ];
  return (
    <div className="slide" style={{background:`radial-gradient(ellipse 70% 60% at 50% 50%,rgba(0,255,178,.06) 0%,transparent 70%), ${BG}`}}>
      <div className="grid"/>
      <div className="inner" style={{textAlign:"center",maxWidth:900,margin:"0 auto"}}>
        <div className="slide-num" style={{textAlign:"center"}}>11 / 11</div>
        <div className="label" style={{textAlign:"center"}}>Join the build</div>
        <h2 style={{maxWidth:720,margin:"0 auto 12px"}}>The agentic era needs an<br/><span className="g">identity layer</span>. Let's build it.</h2>
        <p className="body" style={{maxWidth:560,margin:"0 auto 40px"}}>This is 8 weeks to build something real, ship it to production, and put it on your portfolio forever. No filler roles — everyone builds.</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:14,marginBottom:36,textAlign:"left"}}>
          {expectations.map(e=>(
            <div key={e.t} className="card" style={{borderTop:`2px solid ${G}`}}>
              <div style={{fontSize:22,marginBottom:10}}>{e.icon}</div>
              <div style={{fontFamily:"Syne",fontSize:15,fontWeight:700,color:TEXT,marginBottom:6}}>{e.t}</div>
              <p className="t" style={{fontSize:12}}>{e.d}</p>
            </div>
          ))}
        </div>
        <div className="card card-g" style={{maxWidth:680,margin:"0 auto 36px",textAlign:"left"}}>
          <div style={{fontFamily:"Syne",fontSize:17,fontWeight:700,marginBottom:14,color:TEXT}}>What I need from you</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            {[
              "Show up ready to build — not just attend",
              "Own your squad's deliverables fully",
              "Communicate blockers early, not late",
              "Push code that you're proud of",
              "Help your teammates when they're stuck",
              "Be at demo day — your work deserves the stage",
            ].map(i=>(
              <div key={i} className="li"><div className="li-dot"/><span className="t" style={{fontSize:13}}>{i}</span></div>
            ))}
          </div>
        </div>
        <div style={{marginBottom:32}}>
          <div style={{fontFamily:"Syne",fontSize:28,fontWeight:800,color:G,marginBottom:8}}>Are you in?</div>
          <p style={{fontFamily:"Berkeley Mono",fontSize:12,color:MUTED,lineHeight:1.7}}>Talk to Girish. Pick your squad. Start building.</p>
        </div>
        <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}>
          {["forgeid.ai","contact@intelliforge.tech","intelliforge.tech"].map(c=>(
            <span key={c} className="badge badge-g" style={{fontSize:12,padding:"7px 18px"}}>{c}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

const COMPONENTS = [Cover,Problem,Solution,Product,Architecture,Market,Competition,BizModel,Team,WhyJoin,Roadmap,Ask];

export default function Deck() {
  const [cur,setCur] = useState(0);
  const [fade,setFade] = useState(true);

  const go = useCallback((idx)=>{
    if(idx===cur||idx<0||idx>=SLIDES.length) return;
    setFade(false);
    setTimeout(()=>{setCur(idx);setFade(true);},160);
  },[cur]);

  useEffect(()=>{
    const h=(e)=>{
      if(e.key==="ArrowRight"||e.key==="ArrowDown") go(cur+1);
      if(e.key==="ArrowLeft"||e.key==="ArrowUp") go(cur-1);
    };
    window.addEventListener("keydown",h);
    return()=>window.removeEventListener("keydown",h);
  },[cur,go]);

  const Slide = COMPONENTS[cur];
  return (
    <>
      <style>{css}</style>
      <div style={{opacity:fade?1:0,transition:"opacity .16s ease"}}>
        <Slide/>
      </div>
      <nav className="nav">
        <span className="arr" onClick={()=>go(cur-1)}>‹</span>
        {SLIDES.map((_,i)=>(
          <div key={i} className={`dot ${i===cur?"on":""}`} onClick={()=>go(i)}/>
        ))}
        <span className="arr" onClick={()=>go(cur+1)}>›</span>
      </nav>
    </>
  );
}
