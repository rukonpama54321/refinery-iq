// screen_login.jsx
const { useState: useStateL } = React;

// brand mark — abstract refinery/distillation glyph in violet gradient
function Logo({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0" stopColor="#6366F1" /><stop offset="0.6" stopColor="#8B5CF6" /><stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="10" fill="url(#lg)" opacity="0.16" />
      <rect x="2.5" y="2.5" width="35" height="35" rx="9.5" stroke="url(#lg)" strokeOpacity="0.5" />
      <path d="M13 28V16l7-5 7 5v12" stroke="url(#lg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 22h14M20 11v17" stroke="url(#lg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />
      <circle cx="20" cy="16.5" r="1.8" fill="#A78BFA" />
    </svg>
  );
}

function Wordmark({ size = 19 }) {
  return (
    <span style={{ fontSize:size, fontWeight:600, letterSpacing:"-0.02em", display:"inline-flex", alignItems:"baseline", gap:"0.28em" }}>
      NRL<span style={{ background:"var(--accent-grad)", WebkitBackgroundClip:"text", backgroundClip:"text", color:"transparent", fontWeight:700 }}>AI</span><span style={{ fontWeight:500 }}>Workshop</span>
    </span>
  );
}

function Aurora() {
  return (
    <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
      <div style={{ position:"absolute", top:"-30%", left:"-10%", width:"60vw", height:"60vw",
        background:"radial-gradient(circle, rgba(99,102,241,0.5), transparent 60%)", filter:"blur(70px)",
        animation:"aurora-drift 26s var(--ease) infinite", opacity:0.55 }} />
      <div style={{ position:"absolute", bottom:"-35%", right:"-15%", width:"65vw", height:"65vw",
        background:"radial-gradient(circle, rgba(139,92,246,0.45), transparent 60%)", filter:"blur(80px)",
        animation:"aurora-drift 32s var(--ease) infinite reverse", opacity:0.5 }} />
      <div style={{ position:"absolute", top:"30%", right:"18%", width:"34vw", height:"34vw",
        background:"radial-gradient(circle, rgba(167,139,250,0.35), transparent 60%)", filter:"blur(70px)",
        animation:"aurora-drift 38s var(--ease) infinite", opacity:0.45 }} />
      <div style={{ position:"absolute", inset:0,
        backgroundImage:"radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize:"38px 38px",
        maskImage:"radial-gradient(circle at 50% 40%, #000, transparent 75%)",
        WebkitMaskImage:"radial-gradient(circle at 50% 40%, #000, transparent 75%)" }} />
    </div>
  );
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useStateL("");
  const [password, setPassword] = useStateL("");
  const [focus, setFocus] = useStateL(false);
  const [err, setErr] = useStateL("");
  const [sending, setSending] = useStateL(false);

  const pick = (acc) => { setEmail(acc.email); setPassword(acc.password); setErr(""); };

  const submit = (e) => {
    e && e.preventDefault();
    const acc = ACCOUNTS.find(a => a.email.toLowerCase() === email.trim().toLowerCase());
    if (!acc) { setErr("No account found for that email. Try a demo account below."); return; }
    if (password !== acc.password) { setErr("Incorrect password. Demo password is shown below."); return; }
    setSending(true);
    setTimeout(() => { setSending(false); onLogin(acc); }, 760);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"var(--bg)", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px", overflowY:"auto" }}>
      <Aurora />
      <div className="fade-rise" style={{ position:"relative", width:"100%", maxWidth:412, margin:"auto" }}>
        {/* brand */}
        <div style={{ display:"flex", alignItems:"center", gap:11, justifyContent:"center", marginBottom:26 }}>
          <Logo size={34} /><Wordmark size={21} />
        </div>

        <form onSubmit={submit} className="glass" style={{ padding:"30px 30px 26px", borderRadius:"var(--r-xl)",
          boxShadow:"0 30px 80px rgba(0,0,0,0.5)" }}>
          <div style={{ fontSize:19, fontWeight:600, letterSpacing:"-0.02em", marginBottom:5 }}>Sign in to NRL AI Workshop</div>
          <div style={{ fontSize:13, color:"var(--text-dim)", marginBottom:24 }}>Refinery operations intelligence — Northgate Refining</div>

          <label style={{ fontSize:12, fontWeight:550, color:"var(--text-dim)", display:"block", marginBottom:7 }}>Work email</label>
          <div className="input-glow" style={{ display:"flex", alignItems:"center", gap:10, padding:"0 13px", height:46,
            borderRadius:11, background:"rgba(255,255,255,0.03)", border:"1px solid var(--border-2)", marginBottom:14 }}>
            <IconMail size={17} style={{ color:"var(--text-faint)" }} />
            <input value={email} onChange={(e)=>{setEmail(e.target.value); setErr("");}}
              placeholder="you@northgate-refining.com" autoComplete="username"
              style={{ flex:1, background:"none", border:"none", color:"var(--text)", fontSize:14 }} />
          </div>

          <label style={{ fontSize:12, fontWeight:550, color:"var(--text-dim)", display:"block", marginBottom:7 }}>Password</label>
          <div className={"input-glow" + (focus ? " active" : "")} style={{ display:"flex", alignItems:"center", gap:10, padding:"0 13px", height:46,
            borderRadius:11, background:"rgba(255,255,255,0.03)", border:"1px solid var(--border-2)", marginBottom: err?10:18 }}>
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="var(--text-faint)" strokeWidth="1.8"><rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
            <input value={password} type="password" onFocusCapture={()=>setFocus(true)} onBlur={()=>setFocus(false)}
              onChange={(e)=>{setPassword(e.target.value); setErr("");}} placeholder="••••••••" autoComplete="current-password"
              style={{ flex:1, background:"none", border:"none", color:"var(--text)", fontSize:14 }} />
          </div>

          {err && <div style={{ fontSize:12.5, color:"var(--red)", marginBottom:14, display:"flex", gap:7, alignItems:"center" }}>
            <IconWarn size={14} /> {err}</div>}

          <GlowButton type="submit" full size="lg" disabled={sending}>
            {sending
              ? <><span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.4)", borderTopColor:"#fff", borderRadius:"50%", animation:"spin 0.7s linear infinite", display:"inline-block" }} /> Sending magic link…</>
              : <><IconSpark size={17} /> Continue with magic link</>}
          </GlowButton>

          <div style={{ display:"flex", alignItems:"center", gap:12, margin:"20px 0 16px" }}>
            <div style={{ flex:1, height:1, background:"var(--border)" }} />
            <span style={{ fontSize:11, color:"var(--text-faint)", fontWeight:550, letterSpacing:"0.04em", textTransform:"uppercase" }}>Demo accounts</span>
            <div style={{ flex:1, height:1, background:"var(--border)" }} />
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
            {ACCOUNTS.map(a => (
              <button type="button" key={a.id} onClick={()=>pick(a)} className="lift"
                style={{ display:"flex", alignItems:"center", gap:11, padding:"9px 11px", borderRadius:11, textAlign:"left",
                  background:"rgba(255,255,255,0.025)", border:"1px solid var(--border)", width:"100%" }}
                onMouseEnter={(e)=>{e.currentTarget.style.background="rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor="var(--border-2)";}}
                onMouseLeave={(e)=>{e.currentTarget.style.background="rgba(255,255,255,0.025)"; e.currentTarget.style.borderColor="var(--border)";}}>
                <Avatar initials={a.initials} tint={a.tint} size={34} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:550, display:"flex", alignItems:"center", gap:8 }}>{a.name} <RoleBadge role={a.role} size="sm" /></div>
                  <div className="mono" style={{ fontSize:11, color:"var(--text-faint)", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{a.email}</div>
                </div>
                <span style={{ fontSize:11, color:"var(--text-faint)", display:"flex", alignItems:"center", gap:3 }}>use <IconChevRight size={13} /></span>
              </button>
            ))}
          </div>
          <div style={{ fontSize:11, color:"var(--text-faint)", marginTop:13, textAlign:"center" }}>
            Password for all demo accounts: <span className="mono" style={{ color:"var(--text-dim)" }}>refineiq</span>
          </div>
        </form>

        <div style={{ textAlign:"center", marginTop:20, fontSize:11.5, color:"var(--text-faint)", display:"flex", alignItems:"center", justifyContent:"center", gap:7 }}>
          <IconSpark size={13} style={{ color:"var(--a3)" }} /> Powered by AI · grounded in your controlled documents
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { LoginScreen, Logo, Wordmark, Aurora });
