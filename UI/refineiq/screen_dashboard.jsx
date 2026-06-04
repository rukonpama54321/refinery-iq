// screen_dashboard.jsx — role-aware
const SENT_TINT = { green:"#34D399", amber:"#FBBF24", red:"#F87171" };

function StatCard({ s, delay }) {
  return (
    <div className="glass lift fade-rise" style={{ padding:"17px 18px", borderRadius:16, animationDelay:delay+"ms" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
        <div style={{ width:34, height:34, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center",
          background:"rgba(99,102,241,0.12)", border:"1px solid rgba(99,102,241,0.22)", color:"var(--a3)" }}>
          <NamedIcon name={s.icon} size={17} />
        </div>
        <span style={{ fontSize:11.5, fontWeight:550, display:"inline-flex", alignItems:"center", gap:4,
          color: s.trend==="up" ? "var(--green)" : "var(--a3)" }}>
          {s.delta}
        </span>
      </div>
      <div style={{ fontSize:28, fontWeight:650, letterSpacing:"-0.02em", marginTop:13 }}>{s.value}</div>
      <div style={{ fontSize:12.5, color:"var(--text-faint)", marginTop:2 }}>{s.label}</div>
    </div>
  );
}

function CoverageChart({ scopeDept }) {
  const rows = DEPARTMENTS;
  const max = 96;
  return (
    <div className="glass" style={{ padding:"20px 22px", borderRadius:18 }}>
      <PanelHead title="Document coverage by department" sub="Share of source documents indexed & embedding-current" />
      <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
        {rows.map((d, i) => {
          const dim = scopeDept && d.name !== scopeDept;
          return (
            <div key={d.id} style={{ opacity: dim ? 0.4 : 1, transition:"opacity var(--dur)" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:7 }}>
                <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:13 }}>
                  <NamedIcon name={d.icon} size={14} style={{ color:d.tint }} />
                  <span style={{ fontWeight:500 }}>{d.name}</span>
                  {scopeDept===d.name && <span style={{ fontSize:10.5, color:"var(--a3)", background:"rgba(139,92,246,0.14)", padding:"1px 6px", borderRadius:5 }}>your dept</span>}
                </div>
                <div style={{ display:"flex", alignItems:"baseline", gap:8 }}>
                  <span className="mono" style={{ fontSize:12, color:"var(--text-faint)" }}>{d.docs} docs</span>
                  <span style={{ fontSize:13, fontWeight:600, width:34, textAlign:"right" }}>{d.coverage}%</span>
                </div>
              </div>
              <div style={{ height:8, borderRadius:99, background:"rgba(255,255,255,0.05)", overflow:"hidden" }}>
                <div className="fade-rise" style={{ height:"100%", width:(d.coverage/max*100)+"%", borderRadius:99,
                  background:`linear-gradient(90deg, ${d.tint}, ${d.tint}bb)`, animationDelay:(i*70)+"ms",
                  boxShadow:`0 0 12px ${d.tint}66` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function QueriesList({ scopeDept }) {
  let rows = RECENT_QUERIES;
  if (scopeDept) rows = rows.filter(r => r.dept === scopeDept).concat(rows.filter(r => r.dept !== scopeDept)).slice(0,6);
  return (
    <div className="glass" style={{ padding:"20px 22px", borderRadius:18 }}>
      <PanelHead title="Recent queries" sub="Answer confidence shown by signal dot"
        right={<span style={{ fontSize:12, color:"var(--a3)", display:"flex", alignItems:"center", gap:5, cursor:"pointer" }}>View all <IconArrowUpR size={13} /></span>} />
      <div style={{ display:"flex", flexDirection:"column" }}>
        {rows.map((r, i) => (
          <div key={i} className="lift" style={{ display:"flex", gap:12, padding:"12px 10px", margin:"0 -10px", borderRadius:10, cursor:"pointer", borderTop: i?"1px solid var(--border)":"none" }}
            onMouseEnter={(e)=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}
            onMouseLeave={(e)=>e.currentTarget.style.background="transparent"}>
            <div style={{ marginTop:5, flexShrink:0 }}><IconDot size={8} color={SENT_TINT[r.sentiment]} /></div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:13.5, lineHeight:1.45, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.q}</div>
              <div style={{ fontSize:11.5, color:"var(--text-faint)", marginTop:3, display:"flex", gap:8 }}>
                <span>{r.user}</span><span>·</span><span>{r.dept}</span>
              </div>
            </div>
            <span className="mono" style={{ fontSize:11.5, color:"var(--text-faint)", flexShrink:0, marginTop:1 }}>{r.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActivityFeed() {
  return (
    <div className="glass" style={{ padding:"20px 22px", borderRadius:18, height:"100%" }}>
      <PanelHead title="Recent activity" />
      <div style={{ position:"relative" }}>
        <div style={{ position:"absolute", left:5, top:6, bottom:6, width:1, background:"var(--border)" }} />
        <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
          {ACTIVITY.map((a, i) => (
            <div key={i} style={{ display:"flex", gap:14, position:"relative" }}>
              <div style={{ width:11, height:11, borderRadius:99, background:a.tint, marginTop:3, flexShrink:0, zIndex:1,
                boxShadow:`0 0 0 3px var(--bg-1), 0 0 10px ${a.tint}88` }} />
              <div style={{ flex:1 }}>
                <div style={{ fontSize:13, lineHeight:1.45 }}>{a.text}</div>
                <div style={{ fontSize:11.5, color:"var(--text-faint)", marginTop:2 }}>{a.who} · {a.time} ago</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DashboardScreen({ account }) {
  const role = account.role;
  const isAdmin = role === "Admin";
  const isMgr = role === "Manager";
  const scopeDept = isAdmin ? null : account.dept;

  // role-aware stat set
  let stats = STATS;
  let scopeLabel = "Org-wide";
  if (isMgr) {
    scopeLabel = account.dept;
    stats = [
      { label:"Dept Documents", value:"368", delta:"+9 this week", trend:"up", icon:"File" },
      { label:"Dept Active Users", value:"24", delta:"+2 this week", trend:"up", icon:"Users" },
      { label:"Dept Queries Today", value:"312", delta:"+8% vs avg", trend:"up", icon:"Chat" },
      { label:"Avg Response", value:"1.9s", delta:"−0.2s vs avg", trend:"down", icon:"Clock" },
    ];
  } else if (!isAdmin) {
    scopeLabel = "Your activity";
    stats = [
      { label:"Your Queries (7d)", value:"47", delta:"+11 this week", trend:"up", icon:"Chat" },
      { label:"Docs Available", value:"1,463", delta:"294 restricted", trend:"up", icon:"File" },
      { label:"Saved Answers", value:"12", delta:"+3 this week", trend:"up", icon:"Check" },
      { label:"Avg Response", value:"1.8s", delta:"fast", trend:"down", icon:"Clock" },
    ];
  }

  return (
    <div style={{ flex:1, overflowY:"auto", background:"var(--bg-1)" }}>
      <div style={{ maxWidth:1240, margin:"0 auto", padding:"30px 34px 48px" }}>
        {/* header */}
        <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"space-between", marginBottom:26, flexWrap:"wrap", gap:14 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:11, marginBottom:6 }}>
              <h1 style={{ fontSize:24, fontWeight:650, letterSpacing:"-0.025em" }}>Operations Dashboard</h1>
              <RoleBadge role={role} />
            </div>
            <div style={{ fontSize:13.5, color:"var(--text-dim)" }}>
              {isAdmin && "Full platform view across all departments · Northgate Refining"}
              {isMgr && <>Scoped to <span style={{ color:"var(--text)" }}>{account.dept}</span> · you can manage documents in your department</>}
              {!isAdmin && !isMgr && <>Your personalized view · read-only access across {DEPARTMENTS.length} departments</>}
            </div>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"7px 13px", borderRadius:10, background:"rgba(255,255,255,0.03)", border:"1px solid var(--border)" }}>
            <span style={{ fontSize:11.5, color:"var(--text-faint)" }}>Scope</span>
            <span style={{ fontSize:12.5, fontWeight:550, color:"var(--a3)" }}>{scopeLabel}</span>
          </div>
        </div>

        {/* stats row */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:14, marginBottom:18 }}>
          {stats.map((s, i) => <StatCard key={i} s={s} delay={i*60} />)}
        </div>

        {/* main grid */}
        <div style={{ display:"grid", gridTemplateColumns:"1.55fr 1fr", gap:18, alignItems:"start" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:18 }}>
            <CoverageChart scopeDept={scopeDept} />
            <QueriesList scopeDept={scopeDept} />
          </div>
          <ActivityFeed />
        </div>

        {!isAdmin && (
          <div className="glass" style={{ marginTop:18, padding:"16px 20px", borderRadius:14, display:"flex", alignItems:"center", gap:13,
            background:"rgba(251,191,36,0.05)", border:"1px solid rgba(251,191,36,0.2)" }}>
            <div style={{ width:34, height:34, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(251,191,36,0.12)", color:"var(--amber)", flexShrink:0 }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13.5, fontWeight:550 }}>Some documents are restricted</div>
              <div style={{ fontSize:12.5, color:"var(--text-dim)", marginTop:2 }}>294 HSE & incident documents require elevated clearance. Request access from any citation or the document library.</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { DashboardScreen });
