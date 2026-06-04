// app.jsx — shell, routing, sidebars, tweaks
const { useState: useApp, useEffect: useAppE, useRef: useAppR } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "glimmer": 0.6,
  "accent": ["#6366F1", "#8B5CF6", "#A78BFA"],
  "density": "regular"
}/*EDITMODE-END*/;

// ---- global icon rail ----
function Rail({ view, setView, account, onSignout }) {
  const [menu, setMenu] = useApp(false);
  const items = [
    { id:"chat", label:"Chat", icon:IconChat },
    { id:"dashboard", label:"Dashboard", icon:IconGrid },
  ];
  if (account.role === "Admin") items.push({ id:"admin", label:"Admin", icon:IconShield });

  return (
    <div style={{ width:"var(--rail-w)", flexShrink:0, background:"var(--bg)", borderRight:"1px solid var(--border)",
      display:"flex", flexDirection:"column", alignItems:"center", padding:"14px 0 12px", gap:6, position:"relative", zIndex:30 }}>
      <div style={{ marginBottom:8 }}><Logo size={30} /></div>
      {items.map(it => {
        const on = view === it.id;
        return (
          <button key={it.id} onClick={()=>setView(it.id)} title={it.label} className="lift"
            style={{ width:42, height:42, borderRadius:12, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:3,
              color: on?"#fff":"var(--text-faint)", background: on?"rgba(139,92,246,0.16)":"transparent",
              border:`1px solid ${on?"rgba(139,92,246,0.32)":"transparent"}`, position:"relative" }}
            onMouseEnter={(e)=>{ if(!on){ e.currentTarget.style.background="rgba(255,255,255,0.05)"; e.currentTarget.style.color="var(--text-dim)"; }}}
            onMouseLeave={(e)=>{ if(!on){ e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--text-faint)"; }}}>
            {on && <span style={{ position:"absolute", left:-14, top:"50%", transform:"translateY(-50%)", width:3, height:20, borderRadius:99, background:"var(--accent-grad)" }} />}
            <it.icon size={19} />
            <span style={{ fontSize:8.5, fontWeight:550, letterSpacing:"0.02em" }}>{it.label}</span>
          </button>
        );
      })}
      <div style={{ flex:1 }} />
      <button title="Notifications" className="lift" style={{ width:42, height:42, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-faint)", position:"relative" }}
        onMouseEnter={(e)=>e.currentTarget.style.background="rgba(255,255,255,0.05)"}
        onMouseLeave={(e)=>e.currentTarget.style.background="transparent"}>
        <IconBell size={18} />
        <span style={{ position:"absolute", top:9, right:10, width:7, height:7, borderRadius:99, background:"var(--a2)", boxShadow:"0 0 8px var(--a2)" }} />
      </button>
      <div style={{ position:"relative" }}>
        <button onClick={()=>setMenu(m=>!m)} title={account.name} style={{ marginTop:2 }}>
          <Avatar initials={account.initials} tint={account.tint} size={38} ring />
        </button>
        {menu && (
          <div className="glass pop-in" style={{ position:"absolute", bottom:0, left:"calc(100% + 12px)", width:248, zIndex:50, padding:8 }}>
            <div style={{ display:"flex", alignItems:"center", gap:11, padding:"8px 9px 12px" }}>
              <Avatar initials={account.initials} tint={account.tint} size={40} />
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize:13.5, fontWeight:600 }}>{account.name}</div>
                <div style={{ fontSize:11.5, color:"var(--text-faint)" }}>{account.title}</div>
              </div>
            </div>
            <div style={{ padding:"0 9px 10px" }}><RoleBadge role={account.role} /></div>
            <div style={{ height:1, background:"var(--border)", margin:"2px 0 6px" }} />
            <MenuItem icon={IconRefresh} label="Switch account" onClick={onSignout} />
            <MenuItem icon={IconSettings} label="Preferences" />
            <MenuItem icon={IconLogout} label="Sign out" onClick={onSignout} danger />
          </div>
        )}
      </div>
    </div>
  );
}

function MenuItem({ icon:Icon, label, onClick, danger }) {
  return (
    <button onClick={onClick} className="lift" style={{ display:"flex", alignItems:"center", gap:11, width:"100%", padding:"9px 9px", borderRadius:8, fontSize:13,
      color: danger?"var(--red)":"var(--text-dim)", textAlign:"left" }}
      onMouseEnter={(e)=>e.currentTarget.style.background="rgba(255,255,255,0.05)"}
      onMouseLeave={(e)=>e.currentTarget.style.background="transparent"}>
      <Icon size={16} /> {label}
    </button>
  );
}

// ---- chat contextual sidebar ----
function ChatSidebar({ dept, setDept, convo, setConvo, onCollapse }) {
  const groups = [
    { label:"Today", items: CONVERSATIONS.filter(c=>["Now","26m","2h"].includes(c.time)) },
    { label:"Earlier", items: CONVERSATIONS.filter(c=>!["Now","26m","2h"].includes(c.time)) },
  ];
  return (
    <div style={{ width:"var(--sidebar-w)", flexShrink:0, background:"var(--bg-1)", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"16px 16px 12px", display:"flex", alignItems:"center", gap:8 }}>
        <button className="lift" style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", gap:8, height:40, borderRadius:11, fontSize:13.5, fontWeight:550, color:"#fff",
          background:"var(--accent-grad)", boxShadow:"0 4px 14px rgba(99,102,241,0.3)" }}
          onMouseEnter={(e)=>e.currentTarget.style.transform="translateY(-1px)"}
          onMouseLeave={(e)=>e.currentTarget.style.transform="none"}>
          <IconPlus size={17} /> New chat
        </button>
        <button onClick={onCollapse} title="Collapse" className="lift" style={{ width:40, height:40, borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-faint)", border:"1px solid var(--border)" }}
          onMouseEnter={(e)=>e.currentTarget.style.background="rgba(255,255,255,0.05)"}
          onMouseLeave={(e)=>e.currentTarget.style.background="transparent"}>
          <IconPanelLeft size={17} />
        </button>
      </div>

      {/* department selector */}
      <div style={{ padding:"4px 16px 14px" }}>
        <div style={{ fontSize:10.5, fontWeight:600, color:"var(--text-faint)", letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:8 }}>Department</div>
        <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
          {["All departments", ...DEPARTMENTS.map(d=>d.name)].map(d => {
            const dd = DEPARTMENTS.find(x=>x.name===d);
            const on = d===dept;
            return (
              <button key={d} onClick={()=>setDept(d)} className="lift"
                style={{ display:"flex", alignItems:"center", gap:9, padding:"7px 9px", borderRadius:8, fontSize:12.5, textAlign:"left",
                  color: on?"var(--text)":"var(--text-dim)", background: on?"rgba(139,92,246,0.12)":"transparent", fontWeight: on?550:450 }}
                onMouseEnter={(e)=>{ if(!on) e.currentTarget.style.background="rgba(255,255,255,0.04)"; }}
                onMouseLeave={(e)=>{ if(!on) e.currentTarget.style.background="transparent"; }}>
                {dd ? <NamedIcon name={dd.icon} size={14} style={{ color:dd.tint }} /> : <IconGrid size={14} style={{ color:"var(--text-faint)" }} />}
                <span style={{ flex:1 }}>{dd ? dd.short : "All departments"}</span>
                {on && <IconDot size={6} color="var(--a3)" />}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ height:1, background:"var(--border)", margin:"0 16px" }} />

      {/* conversation history */}
      <div style={{ flex:1, overflowY:"auto", padding:"14px 12px" }}>
        {groups.map(g => g.items.length > 0 && (
          <div key={g.label} style={{ marginBottom:14 }}>
            <div style={{ fontSize:10.5, fontWeight:600, color:"var(--text-faint)", letterSpacing:"0.06em", textTransform:"uppercase", padding:"0 8px 7px" }}>{g.label}</div>
            <div style={{ display:"flex", flexDirection:"column", gap:1 }}>
              {g.items.map(c => {
                const on = c.id===convo;
                const dd = DEPARTMENTS.find(x=>x.name===c.dept);
                return (
                  <button key={c.id} onClick={()=>setConvo(c.id)} className="lift"
                    style={{ display:"flex", flexDirection:"column", gap:3, padding:"9px 10px", borderRadius:9, textAlign:"left",
                      background: on?"rgba(255,255,255,0.05)":"transparent", border:`1px solid ${on?"var(--border)":"transparent"}` }}
                    onMouseEnter={(e)=>{ if(!on) e.currentTarget.style.background="rgba(255,255,255,0.03)"; }}
                    onMouseLeave={(e)=>{ if(!on) e.currentTarget.style.background="transparent"; }}>
                    <div style={{ display:"flex", alignItems:"center", gap:7, width:"100%" }}>
                      <span style={{ flex:1, fontSize:13, fontWeight: on?550:450, color: on?"var(--text)":"var(--text-dim)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{c.title}</span>
                      <span className="mono" style={{ fontSize:10.5, color:"var(--text-faint)", flexShrink:0 }}>{c.time}</span>
                    </div>
                    <span style={{ fontSize:11, color:"var(--text-faint)", display:"flex", alignItems:"center", gap:5 }}>
                      <IconDot size={5} color={dd?.tint||"#6B7280"} />{dd?.short || c.dept}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Toast({ msg }) {
  if (!msg) return null;
  return (
    <div className="pop-in glass" style={{ position:"fixed", bottom:24, left:"50%", transform:"translateX(-50%)", zIndex:200,
      padding:"12px 18px", borderRadius:12, display:"flex", alignItems:"center", gap:11, fontSize:13.5,
      boxShadow:"0 16px 50px rgba(0,0,0,0.5)", borderColor:"rgba(251,191,36,0.3)" }}>
      <span style={{ width:24, height:24, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(251,191,36,0.16)", color:"var(--amber)" }}>
        <IconCheck size={14} />
      </span>
      {msg}
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [account, setAccount] = useApp(null);
  const [view, setView] = useApp("chat");
  const [dept, setDept] = useApp("Process Engineering");
  const [convo, setConvo] = useApp("c1");
  const [adminSection, setAdminSection] = useApp("users");
  const [collapsed, setCollapsed] = useApp(false);
  const [toast, setToast] = useApp("");
  const toastTimer = useAppR(null);

  // apply tweaks to CSS vars
  useAppE(() => {
    const r = document.documentElement;
    r.style.setProperty("--glimmer", String(t.glimmer));
    const [a1, a2, a3] = t.accent;
    r.style.setProperty("--a1", a1);
    r.style.setProperty("--a2", a2);
    r.style.setProperty("--a3", a3 || a2);
    r.style.setProperty("--accent-grad", `linear-gradient(120deg, ${a1} 0%, ${a2} 60%, ${a3||a2} 100%)`);
  }, [t]);

  // auto-collapse on narrow viewports
  useAppE(() => {
    const onR = () => setCollapsed(window.innerWidth < 880);
    onR(); window.addEventListener("resize", onR);
    return () => window.removeEventListener("resize", onR);
  }, []);

  const showToast = (doc) => {
    setToast(`Access requested for “${doc}” — sent to the document owner`);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(()=>setToast(""), 3400);
  };

  const signout = () => { setAccount(null); setView("chat"); };
  const login = (acc) => { setAccount(acc); setDept(acc.role==="Admin"?"Process Engineering":acc.dept); setView(acc.role==="End User"?"chat":"chat"); };

  if (!account) return <><LoginScreen onLogin={login} /><TweaksMount t={t} setTweak={setTweak} /></>;

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden" }}>
      <Rail view={view} setView={setView} account={account} onSignout={signout} />

      {view==="chat" && !collapsed && <ChatSidebar dept={dept} setDept={setDept} convo={convo} setConvo={setConvo} onCollapse={()=>setCollapsed(true)} />}
      {view==="chat" && collapsed && (
        <button onClick={()=>setCollapsed(false)} title="Expand sidebar" className="lift"
          style={{ position:"absolute", left:"calc(var(--rail-w) + 10px)", top:14, zIndex:25, width:38, height:38, borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-faint)", background:"var(--bg-2)", border:"1px solid var(--border)" }}>
          <IconPanelLeft size={17} />
        </button>
      )}
      {view==="admin" && <AdminNav section={adminSection} setSection={setAdminSection} />}

      {view==="chat" && <ChatScreen account={account} dept={dept} setDept={setDept} onCite={showToast} convo={convo} />}
      {view==="dashboard" && <DashboardScreen account={account} />}
      {view==="admin" && <AdminScreen section={adminSection} />}

      <Toast msg={toast} />
      <TweaksMount t={t} setTweak={setTweak} />
    </div>
  );
}

const ACCENT_OPTIONS = [
  ["#6366F1", "#8B5CF6", "#A78BFA"],
  ["#3B82F6", "#06B6D4", "#22D3EE"],
  ["#8B5CF6", "#EC4899", "#F0ABFC"],
  ["#10B981", "#34D399", "#6EE7B7"],
];

function TweaksMount({ t, setTweak }) {
  return (
    <TweaksPanel>
      <TweakSection label="AI glimmer" />
      <TweakSlider label="Shimmer intensity" value={t.glimmer} min={0} max={1} step={0.1}
        onChange={(v)=>setTweak("glimmer", v)} />
      <TweakSection label="Accent" />
      <TweakColor label="AI gradient" value={t.accent} options={ACCENT_OPTIONS}
        onChange={(v)=>setTweak("accent", v)} />
    </TweaksPanel>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
