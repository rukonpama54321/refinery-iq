// ui.jsx — shared primitives
const { useState, useEffect, useRef, useCallback } = React;

// role badge chip
function RoleBadge({ role, size = "md" }) {
  const tint = ROLE_TINT[role] || "#6B7280";
  const pad = size === "sm" ? "2px 7px" : "3px 9px";
  const fs = size === "sm" ? 10.5 : 11.5;
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5, padding:pad,
      borderRadius:99, fontSize:fs, fontWeight:600, letterSpacing:"0.02em",
      color:tint, background:`${tint}1f`, border:`1px solid ${tint}3a`,
      whiteSpace:"nowrap",
    }}>
      <IconDot size={size==="sm"?5:6} color={tint} />{role}
    </span>
  );
}

// generic status chip
function StatusChip({ label, tint, soft = true }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:5, padding:"3px 9px",
      borderRadius:99, fontSize:11.5, fontWeight:550,
      color:tint, background:soft?`${tint}1c`:tint, border:`1px solid ${tint}38`,
      whiteSpace:"nowrap",
    }}>
      <IconDot size={6} color={tint} />{label}
    </span>
  );
}

const DOC_STATUS_TINT = { "Indexed":"#34D399", "Processing":"#FBBF24", "Restricted":"#F87171", "Archived":"#6B7280" };

// avatar
function Avatar({ initials, tint = "#6366F1", size = 32, ring = false }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:"50%", flexShrink:0,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontSize:size*0.38, fontWeight:600, color:"#fff",
      background:`linear-gradient(140deg, ${tint}, ${tint}aa)`,
      boxShadow: ring ? `0 0 0 2px var(--bg-1), 0 0 0 3px ${tint}55` : "none",
      letterSpacing:"0.02em",
    }}>{initials}</div>
  );
}

// icon resolver (string -> component)
const ICONMAP = {
  Gauge:IconGauge, Wrench:IconWrench, Shield:IconShield, Grid:IconGrid, Flask:IconFlask,
  File:IconFile, Users:IconUsers, Chat:IconChat, Clock:IconClock, Check:IconCheck,
};
function NamedIcon({ name, ...p }) { const C = ICONMAP[name] || IconFile; return <C {...p} />; }

// tiny inline markdown -> bold + paragraphs + ordered lists
function renderRich(text) {
  const lines = text.split("\n");
  const blocks = [];
  let list = null;
  const flush = () => { if (list) { blocks.push({ type:"ol", items:list }); list = null; } };
  lines.forEach((ln) => {
    const m = ln.match(/^\s*(\d+)\.\s+(.*)$/);
    if (m) { (list = list || []).push(m[2]); return; }
    flush();
    if (ln.trim() === "") { blocks.push({ type:"sp" }); return; }
    blocks.push({ type:"p", text:ln });
  });
  flush();
  const fmt = (s, kp) => {
    const parts = s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).filter(Boolean);
    return parts.map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) return <strong key={kp+"-"+i} style={{ fontWeight:650, color:"var(--text)" }}>{p.slice(2,-2)}</strong>;
      if (p.startsWith("*") && p.endsWith("*")) return <em key={kp+"-"+i} style={{ color:"var(--a3)" }}>{p.slice(1,-1)}</em>;
      return <span key={kp+"-"+i}>{p}</span>;
    });
  };
  return blocks.map((b, i) => {
    if (b.type === "sp") return <div key={i} style={{ height:10 }} />;
    if (b.type === "ol") return (
      <ol key={i} style={{ margin:"4px 0 4px", paddingLeft:0, listStyle:"none", display:"flex", flexDirection:"column", gap:8 }}>
        {b.items.map((it, j) => (
          <li key={j} style={{ display:"flex", gap:11, alignItems:"flex-start" }}>
            <span style={{ flexShrink:0, width:21, height:21, borderRadius:6, fontSize:11, fontWeight:600,
              display:"flex", alignItems:"center", justifyContent:"center", marginTop:1,
              color:"var(--a3)", background:"rgba(139,92,246,0.14)", border:"1px solid rgba(139,92,246,0.28)" }}>{j+1}</span>
            <span style={{ flex:1, lineHeight:1.6 }}>{fmt(it, "li"+i+j)}</span>
          </li>
        ))}
      </ol>
    );
    return <p key={i} style={{ lineHeight:1.68, margin:0 }}>{fmt(b.text, "p"+i)}</p>;
  });
}

// citation chip
function Citation({ doc, page, restricted, onRequest }) {
  const [requested, setRequested] = useState(false);
  return (
    <button
      onClick={() => { if (restricted && !requested) { setRequested(true); onRequest && onRequest(doc); } }}
      className="lift"
      style={{
        display:"inline-flex", alignItems:"center", gap:7, padding:"5px 10px",
        borderRadius:8, fontSize:12, maxWidth:"100%",
        color: restricted ? "var(--amber)" : "var(--text-dim)",
        background: restricted ? "rgba(251,191,36,0.08)" : "rgba(255,255,255,0.04)",
        border:`1px solid ${restricted ? "rgba(251,191,36,0.3)" : "var(--border)"}`,
        cursor: restricted ? "pointer" : "default",
      }}
      onMouseEnter={(e)=>{ if(!restricted) e.currentTarget.style.background="rgba(255,255,255,0.07)"; }}
      onMouseLeave={(e)=>{ if(!restricted) e.currentTarget.style.background="rgba(255,255,255,0.04)"; }}
      title={restricted ? "Restricted document" : doc}>
      {restricted
        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
        : <IconFile size={12} sw={1.7} />}
      <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", fontWeight:500 }}>{doc}</span>
      {page && <span className="mono" style={{ opacity:0.7, fontSize:11 }}>{page}</span>}
      {restricted && <span style={{ fontSize:11, fontWeight:600, marginLeft:1 }}>{requested ? "· requested ✓" : "· request access"}</span>}
    </button>
  );
}

// model indicator badge
function ModelBadge({ model }) {
  return (
    <span style={{
      display:"inline-flex", alignItems:"center", gap:6, padding:"3px 8px 3px 7px",
      borderRadius:7, fontSize:11, fontWeight:550, color:"var(--a3)",
      background:"rgba(99,102,241,0.1)", border:"1px solid rgba(99,102,241,0.24)",
    }}>
      <span style={{ width:13, height:13, display:"inline-flex" }}><IconSpark size={13} sw={1.6} /></span>
      {model}
    </span>
  );
}

// section / panel title
function PanelHead({ title, sub, right }) {
  return (
    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16, gap:12 }}>
      <div>
        <div style={{ fontSize:14.5, fontWeight:600, letterSpacing:"-0.01em" }}>{title}</div>
        {sub && <div style={{ fontSize:12.5, color:"var(--text-faint)", marginTop:3 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}

// glow primary button
function GlowButton({ children, onClick, full, disabled, type, size="md" }) {
  const [hover, setHover] = useState(false);
  const pad = size === "lg" ? "13px 22px" : "10px 18px";
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      onMouseEnter={()=>setHover(true)} onMouseLeave={()=>setHover(false)}
      style={{
        width: full ? "100%" : "auto", padding:pad, borderRadius:11,
        fontSize: size==="lg"?15:13.5, fontWeight:600, color:"#fff",
        display:"inline-flex", alignItems:"center", justifyContent:"center", gap:9,
        background:"var(--accent-grad)", position:"relative",
        opacity: disabled ? 0.5 : 1, cursor: disabled ? "not-allowed" : "pointer",
        transition:"transform var(--dur) var(--ease), box-shadow var(--dur) var(--ease)",
        transform: hover && !disabled ? "translateY(-1px)" : "none",
        boxShadow: hover && !disabled
          ? "0 8px 30px rgba(99,102,241,0.45), 0 0 0 1px rgba(167,139,250,0.4)"
          : "0 4px 16px rgba(99,102,241,0.28)",
      }}>
      {children}
    </button>
  );
}

Object.assign(window, {
  RoleBadge, StatusChip, DOC_STATUS_TINT, Avatar, NamedIcon, renderRich,
  Citation, ModelBadge, PanelHead, GlowButton,
});
