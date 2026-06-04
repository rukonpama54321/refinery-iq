// screen_admin.jsx — Admin only
const { useState: useSA } = React;

const ADMIN_SECTIONS = [
  { id:"users",  label:"Users",       icon:IconUsers },
  { id:"docs",   label:"Documents",   icon:IconFile },
  { id:"depts",  label:"Departments", icon:IconBuilding },
  { id:"logs",   label:"Logs",        icon:IconList },
  { id:"settings", label:"Settings",  icon:IconSettings },
];

function AdminNav({ section, setSection }) {
  return (
    <div style={{ width:212, flexShrink:0, borderRight:"1px solid var(--border)", background:"var(--bg-1)", display:"flex", flexDirection:"column", padding:"18px 12px" }}>
      <div style={{ fontSize:11, fontWeight:600, color:"var(--text-faint)", letterSpacing:"0.06em", textTransform:"uppercase", padding:"0 10px 12px" }}>Administration</div>
      <div style={{ display:"flex", flexDirection:"column", gap:2 }}>
        {ADMIN_SECTIONS.map(s => {
          const on = section === s.id;
          return (
            <button key={s.id} onClick={()=>setSection(s.id)} className="lift"
              style={{ display:"flex", alignItems:"center", gap:11, padding:"9px 11px", borderRadius:9, fontSize:13.5, fontWeight: on?550:450,
                color: on?"var(--text)":"var(--text-dim)", background: on?"rgba(139,92,246,0.13)":"transparent",
                border:`1px solid ${on?"rgba(139,92,246,0.25)":"transparent"}`, textAlign:"left" }}
              onMouseEnter={(e)=>{ if(!on) e.currentTarget.style.background="rgba(255,255,255,0.04)"; }}
              onMouseLeave={(e)=>{ if(!on) e.currentTarget.style.background="transparent"; }}>
              <s.icon size={17} style={{ color: on?"var(--a3)":"var(--text-faint)" }} /> {s.label}
            </button>
          );
        })}
      </div>
      <div style={{ flex:1 }} />
      <div className="glass" style={{ padding:"12px 13px", borderRadius:12 }}>
        <div style={{ fontSize:12, fontWeight:550, marginBottom:3 }}>Index health</div>
        <div style={{ fontSize:11.5, color:"var(--text-faint)", marginBottom:9 }}>1,712 of 1,757 docs current</div>
        <div style={{ height:6, borderRadius:99, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
          <div style={{ height:"100%", width:"97%", background:"var(--accent-grad)", borderRadius:99 }} />
        </div>
      </div>
    </div>
  );
}

function Toolbar({ placeholder, action }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
      <div style={{ display:"flex", alignItems:"center", gap:9, flex:1, maxWidth:340, padding:"0 12px", height:38, borderRadius:10, background:"rgba(255,255,255,0.03)", border:"1px solid var(--border)", color:"var(--text-faint)" }}>
        <IconSearch size={15} /><input placeholder={placeholder} style={{ flex:1, background:"none", border:"none", color:"var(--text)", fontSize:13 }} />
      </div>
      <button className="lift" style={{ display:"flex", alignItems:"center", gap:7, height:38, padding:"0 13px", borderRadius:10, fontSize:13, color:"var(--text-dim)", background:"rgba(255,255,255,0.03)", border:"1px solid var(--border)" }}>
        <IconFilter size={15} /> Filter
      </button>
      <div style={{ flex:1 }} />
      {action}
    </div>
  );
}

function Switch({ on, onToggle }) {
  return (
    <button onClick={onToggle} style={{ width:38, height:22, borderRadius:99, padding:2, transition:"background var(--dur)",
      background: on ? "var(--accent-grad)" : "rgba(255,255,255,0.12)", display:"flex", alignItems:"center" }}>
      <span style={{ width:18, height:18, borderRadius:99, background:"#fff", transition:"transform var(--dur) var(--ease)",
        transform: on ? "translateX(16px)" : "translateX(0)", boxShadow:"0 1px 3px rgba(0,0,0,0.4)" }} />
    </button>
  );
}

function UsersSection() {
  const [users, setUsers] = useSA(USERS);
  const toggle = (id) => setUsers(us => us.map(u => u.id===id ? { ...u, status:!u.status } : u));
  return (
    <>
      <Toolbar placeholder="Search users by name or email…"
        action={<GlowButton size="md"><IconPlus size={16} /> Invite user</GlowButton>} />
      <div className="glass" style={{ borderRadius:16, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"2.4fr 1fr 1.4fr 0.9fr 1fr 40px", gap:12, padding:"13px 20px", fontSize:11, fontWeight:600,
          color:"var(--text-faint)", letterSpacing:"0.04em", textTransform:"uppercase", borderBottom:"1px solid var(--border)" }}>
          <div>User</div><div>Role</div><div>Department</div><div>Status</div><div>Last active</div><div></div>
        </div>
        {users.map((u, i) => (
          <div key={u.id} className="lift" style={{ display:"grid", gridTemplateColumns:"2.4fr 1fr 1.4fr 0.9fr 1fr 40px", gap:12, padding:"13px 20px", alignItems:"center",
            borderBottom: i<users.length-1 ? "1px solid var(--border)" : "none", fontSize:13.5 }}
            onMouseEnter={(e)=>e.currentTarget.style.background="rgba(255,255,255,0.022)"}
            onMouseLeave={(e)=>e.currentTarget.style.background="transparent"}>
            <div style={{ display:"flex", alignItems:"center", gap:11, minWidth:0 }}>
              <Avatar initials={u.initials} tint={ROLE_TINT[u.role]} size={34} />
              <div style={{ minWidth:0 }}>
                <div style={{ fontWeight:550 }}>{u.name}</div>
                <div className="mono" style={{ fontSize:11, color:"var(--text-faint)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{u.email}</div>
              </div>
            </div>
            <div><RoleBadge role={u.role} size="sm" /></div>
            <div style={{ color:"var(--text-dim)", fontSize:13 }}>{u.dept}</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Switch on={u.status} onToggle={()=>toggle(u.id)} />
              <span style={{ fontSize:12, color: u.status?"var(--green)":"var(--text-faint)" }}>{u.status?"Active":"Disabled"}</span>
            </div>
            <div style={{ color:"var(--text-faint)", fontSize:12.5 }}>{u.last}</div>
            <div><IconBtn title="More"><IconMore size={17} /></IconBtn></div>
          </div>
        ))}
      </div>
    </>
  );
}

function DocsSection() {
  return (
    <>
      <Toolbar placeholder="Search documents…"
        action={<GlowButton size="md"><IconUpload size={16} /> Upload document</GlowButton>} />
      <div className="glass" style={{ borderRadius:16, overflow:"hidden" }}>
        <div style={{ display:"grid", gridTemplateColumns:"2.7fr 1.3fr 0.7fr 1fr 1fr 40px", gap:12, padding:"13px 20px", fontSize:11, fontWeight:600,
          color:"var(--text-faint)", letterSpacing:"0.04em", textTransform:"uppercase", borderBottom:"1px solid var(--border)" }}>
          <div>Document</div><div>Department</div><div>Version</div><div>Uploaded</div><div>Status</div><div></div>
        </div>
        {DOCUMENTS.map((d, i) => {
          const dd = DEPARTMENTS.find(x=>x.name===d.dept);
          return (
            <div key={d.id} className="lift" style={{ display:"grid", gridTemplateColumns:"2.7fr 1.3fr 0.7fr 1fr 1fr 40px", gap:12, padding:"13px 20px", alignItems:"center",
              borderBottom: i<DOCUMENTS.length-1 ? "1px solid var(--border)" : "none", fontSize:13.5 }}
              onMouseEnter={(e)=>e.currentTarget.style.background="rgba(255,255,255,0.022)"}
              onMouseLeave={(e)=>e.currentTarget.style.background="transparent"}>
              <div style={{ display:"flex", alignItems:"center", gap:11, minWidth:0 }}>
                <div style={{ width:32, height:32, borderRadius:8, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                  background: d.restricted?"rgba(248,113,113,0.1)":"rgba(99,102,241,0.1)", color: d.restricted?"var(--red)":"var(--a3)" }}>
                  {d.restricted
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
                    : <IconFile size={16} />}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontWeight:500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{d.name}</div>
                  <div style={{ fontSize:11, color:"var(--text-faint)" }}>{d.size} · {d.owner}</div>
                </div>
              </div>
              <div><span style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:12, color:"var(--text-dim)" }}>
                <IconDot size={6} color={dd?.tint || "#6B7280"} />{dd?.short || d.dept}</span></div>
              <div className="mono" style={{ fontSize:12.5, color:"var(--text-dim)" }}>{d.ver}</div>
              <div style={{ fontSize:12.5, color:"var(--text-faint)" }}>{d.date}</div>
              <div><StatusChip label={d.status} tint={DOC_STATUS_TINT[d.status]} /></div>
              <div><IconBtn title="More"><IconMore size={17} /></IconBtn></div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function DeptsSection() {
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:14 }}>
      {DEPARTMENTS.map(d => (
        <div key={d.id} className="glass lift" style={{ padding:"18px 20px", borderRadius:16 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14 }}>
            <div style={{ width:40, height:40, borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center",
              background:`${d.tint}1c`, border:`1px solid ${d.tint}38`, color:d.tint }}>
              <NamedIcon name={d.icon} size={20} />
            </div>
            <IconBtn title="Edit"><IconMore size={17} /></IconBtn>
          </div>
          <div style={{ fontSize:15, fontWeight:600 }}>{d.name}</div>
          <div style={{ fontSize:12.5, color:"var(--text-faint)", marginTop:2 }}>{d.docs} documents indexed</div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", margin:"14px 0 7px" }}>
            <span style={{ fontSize:11.5, color:"var(--text-faint)" }}>Coverage</span>
            <span style={{ fontSize:12.5, fontWeight:600 }}>{d.coverage}%</span>
          </div>
          <div style={{ height:7, borderRadius:99, background:"rgba(255,255,255,0.05)", overflow:"hidden" }}>
            <div style={{ height:"100%", width:d.coverage+"%", background:`linear-gradient(90deg, ${d.tint}, ${d.tint}bb)`, borderRadius:99 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const LOGS = [
  { t:"14:22:08", a:"document.upload", who:"Ops Eng", det:"Turnaround 2026 — Scope & Schedule (v0.9)", tint:"#6366F1" },
  { t:"14:08:51", a:"user.role.update", who:"dana.okonkwo", det:"marcus.reyes → Manager", tint:"#3B82F6" },
  { t:"13:47:30", a:"access.request", who:"lena.schmidt", det:"Incident Report — 2026-04 NER Flare Trip", tint:"#FBBF24" },
  { t:"13:31:12", a:"index.rebuild", who:"system", det:"PSV Relief Valve Test Log — Unit 200", tint:"#A78BFA" },
  { t:"12:59:44", a:"query.flagged", who:"t.herrera", det:"Low-confidence answer flagged for review", tint:"#F87171" },
  { t:"12:40:19", a:"document.publish", who:"m.reyes", det:"Rotating Equipment Vibration Limits (v3.0)", tint:"#6366F1" },
  { t:"11:52:03", a:"user.login", who:"priya.nair", det:"SSO · Okta", tint:"#34D399" },
];
function LogsSection() {
  return (
    <div className="glass" style={{ borderRadius:16, overflow:"hidden" }}>
      {LOGS.map((l, i) => (
        <div key={i} style={{ display:"flex", alignItems:"center", gap:16, padding:"13px 20px", borderBottom: i<LOGS.length-1?"1px solid var(--border)":"none", fontSize:13 }}>
          <span className="mono" style={{ fontSize:12, color:"var(--text-faint)", width:64 }}>{l.t}</span>
          <span className="mono" style={{ fontSize:12, color:l.tint, width:150, fontWeight:500 }}>{l.a}</span>
          <span style={{ color:"var(--text-dim)", width:120 }}>{l.who}</span>
          <span style={{ flex:1, color:"var(--text)" }}>{l.det}</span>
        </div>
      ))}
    </div>
  );
}

function SettingsSection() {
  const [s, setS] = useSA({ multi:true, stream:true, redact:true, retain:false });
  const t = (k)=>setS(p=>({ ...p, [k]:!p[k] }));
  const rows = [
    { k:"multi", label:"Multi-model routing", desc:"Route each query to the best-fit model (Opus, Llama, GPT-4o)." },
    { k:"stream", label:"Streamed responses", desc:"Stream answers token-by-token with the live glimmer indicator." },
    { k:"redact", label:"PII & restricted redaction", desc:"Mask restricted content unless the user has clearance." },
    { k:"retain", label:"90-day query retention", desc:"Retain query transcripts for audit beyond the default 30 days." },
  ];
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:14, maxWidth:720 }}>
      <div className="glass" style={{ padding:"6px 22px", borderRadius:16 }}>
        {rows.map((r, i) => (
          <div key={r.k} style={{ display:"flex", alignItems:"center", gap:16, padding:"16px 0", borderBottom: i<rows.length-1?"1px solid var(--border)":"none" }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13.5, fontWeight:550 }}>{r.label}</div>
              <div style={{ fontSize:12.5, color:"var(--text-faint)", marginTop:2 }}>{r.desc}</div>
            </div>
            <Switch on={s[r.k]} onToggle={()=>t(r.k)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AdminScreen({ section }) {
  const titles = {
    users:["User management","Invite, assign roles, and enable or disable access"],
    docs:["Document library","Manage controlled documents, versions, and indexing status"],
    depts:["Departments","Knowledge domains and their document coverage"],
    logs:["Audit logs","Immutable record of platform activity"],
    settings:["Platform settings","Model routing, retention, and access policy"],
  };
  const [tt, sub] = titles[section] || titles.users;
  return (
    <div style={{ flex:1, overflowY:"auto", background:"var(--bg-1)" }}>
      <div style={{ maxWidth:1180, margin:"0 auto", padding:"28px 34px 48px" }}>
        <div style={{ marginBottom:22 }}>
          <h1 style={{ fontSize:22, fontWeight:650, letterSpacing:"-0.02em" }}>{tt}</h1>
          <div style={{ fontSize:13, color:"var(--text-dim)", marginTop:4 }}>{sub}</div>
        </div>
        {section==="users" && <UsersSection />}
        {section==="docs" && <DocsSection />}
        {section==="depts" && <DeptsSection />}
        {section==="logs" && <LogsSection />}
        {section==="settings" && <SettingsSection />}
      </div>
    </div>
  );
}

Object.assign(window, { AdminNav, AdminScreen });
