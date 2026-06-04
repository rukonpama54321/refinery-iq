// screen_chat.jsx
const { useState: useS, useEffect: useE, useRef: useR } = React;

const DEPTS_CHAT = ["All departments", ...DEPARTMENTS.map(d => d.name)];

function ThinkingSkeleton() {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:9, paddingTop:2 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8, fontSize:12.5, color:"var(--a3)", fontWeight:500 }}>
        <span style={{ width:14, height:14, display:"inline-flex" }}><IconSpark size={14} /></span>
        <span className="shimmer-text">Searching controlled documents…</span>
      </div>
      <div className="skel" style={{ height:11, width:"92%" }} />
      <div className="skel" style={{ height:11, width:"78%" }} />
      <div className="skel" style={{ height:11, width:"85%" }} />
    </div>
  );
}

function AIMessage({ msg, onCite }) {
  const streaming = msg.streaming;
  return (
    <div className="fade-rise" style={{ display:"flex", gap:13, maxWidth:760 }}>
      <div style={{ flexShrink:0, width:32, height:32, borderRadius:9, display:"flex", alignItems:"center", justifyContent:"center",
        background:"var(--accent-grad)", boxShadow:"0 4px 14px rgba(99,102,241,0.4)" }}>
        <IconSpark size={18} style={{ color:"#fff" }} />
      </div>
      <div className={"glass" + (streaming ? " ai-streaming" : "")} style={{ flex:1, padding:"16px 18px", borderRadius:16,
        background:"linear-gradient(180deg, rgba(124,92,246,0.06), rgba(255,255,255,0.012))" }}>
        {msg.thinking
          ? <ThinkingSkeleton />
          : <>
              <div style={{ fontSize:14, color:"var(--text)" }}>
                {renderRich(msg.text)}
                {streaming && <span style={{ display:"inline-block", width:8, height:15, marginLeft:2, marginBottom:-2,
                  background:"var(--a3)", borderRadius:2, animation:"blink 1s steps(2) infinite", verticalAlign:"middle" }} />}
              </div>
              {!streaming && msg.citations && (
                <div style={{ marginTop:14 }}>
                  <div style={{ fontSize:11, color:"var(--text-faint)", fontWeight:550, letterSpacing:"0.04em", textTransform:"uppercase", marginBottom:8 }}>Sources</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                    {msg.citations.map((c, i) => <Citation key={i} {...c} onRequest={onCite} />)}
                  </div>
                </div>
              )}
              {!streaming && (
                <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:14, paddingTop:13, borderTop:"1px solid var(--border)" }}>
                  <ModelBadge model={msg.model} />
                  <div style={{ flex:1 }} />
                  <IconBtn title="Good response"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3Zm0 0 4-7a2 2 0 0 1 2 2v3h5a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 17 20H7"/></svg></IconBtn>
                  <IconBtn title="Bad response"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" style={{ transform:"rotate(180deg)" }}><path d="M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3Zm0 0 4-7a2 2 0 0 1 2 2v3h5a2 2 0 0 1 2 2.3l-1.2 6A2 2 0 0 1 17 20H7"/></svg></IconBtn>
                  <IconBtn title="Copy"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></IconBtn>
                </div>
              )}
            </>}
      </div>
    </div>
  );
}

function IconBtn({ children, title, onClick }) {
  return (
    <button title={title} onClick={onClick} className="lift"
      style={{ width:28, height:28, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--text-faint)" }}
      onMouseEnter={(e)=>{e.currentTarget.style.background="rgba(255,255,255,0.07)"; e.currentTarget.style.color="var(--text-dim)";}}
      onMouseLeave={(e)=>{e.currentTarget.style.background="transparent"; e.currentTarget.style.color="var(--text-faint)";}}>
      {children}
    </button>
  );
}

function UserMessage({ text, initials, tint }) {
  return (
    <div className="fade-rise" style={{ display:"flex", gap:13, maxWidth:760, marginLeft:"auto", flexDirection:"row-reverse" }}>
      <Avatar initials={initials} tint={tint} size={32} />
      <div style={{ padding:"12px 16px", borderRadius:16, borderTopRightRadius:5, fontSize:14, lineHeight:1.6,
        background:"linear-gradient(135deg, rgba(99,102,241,0.9), rgba(139,92,246,0.85))", color:"#fff",
        boxShadow:"0 6px 20px rgba(99,102,241,0.25)" }}>{text}</div>
    </div>
  );
}

const SUGGESTIONS = [
  "Overdue PSV inspections in Unit 200",
  "Bakken crude recommended cut points",
  "P-1201 pump vibration alarm limits",
];

function ChatScreen({ account, dept, setDept, onCite, convo }) {
  const [messages, setMessages] = useS(SAMPLE_THREAD);
  const [input, setInput] = useS("");
  const [active, setActive] = useS(false);
  const [streaming, setStreaming] = useS(false);
  const [deptOpen, setDeptOpen] = useS(false);
  const scrollRef = useR(null);
  const timer = useR(null);

  useE(() => { setMessages(SAMPLE_THREAD); }, [convo]);
  useE(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = () => {
    const q = input.trim();
    if (!q || streaming) return;
    setInput("");
    const answer = matchAnswer(q);
    setMessages(m => [...m, { role:"user", text:q }, { role:"ai", thinking:true }]);
    setStreaming(true);
    setTimeout(() => {
      const words = answer.text.split(" ");
      let i = 0;
      setMessages(m => { const c=[...m]; c[c.length-1]={ role:"ai", text:"", streaming:true }; return c; });
      timer.current = setInterval(() => {
        i += Math.random() > 0.5 ? 2 : 3;
        const partial = words.slice(0, i).join(" ");
        const done = i >= words.length;
        setMessages(m => { const c=[...m]; c[c.length-1]={ role:"ai", text: done?answer.text:partial, streaming:!done,
          citations: done?answer.citations:null, model:answer.model }; return c; });
        if (done) { clearInterval(timer.current); setStreaming(false); }
      }, 45);
    }, 750);
  };

  const stop = () => { clearInterval(timer.current); setStreaming(false);
    setMessages(m => { const c=[...m]; const last=c[c.length-1]; if(last.streaming){ last.streaming=false; last.citations=last.citations||[]; last.model=last.model||"Claude Opus 4.6"; } return c; }); };

  const onKey = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } };
  const curDept = DEPARTMENTS.find(d => d.name === dept);

  return (
    <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, background:"var(--bg-1)" }}>
      {/* top bar */}
      <div style={{ height:58, flexShrink:0, display:"flex", alignItems:"center", gap:14, padding:"0 22px", borderBottom:"1px solid var(--border)", background:"rgba(10,15,30,0.6)", backdropFilter:"blur(10px)" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          {curDept ? <NamedIcon name={curDept.icon} size={17} style={{ color:curDept.tint }} /> : <IconGrid size={17} style={{ color:"var(--a3)" }} />}
          <span style={{ fontSize:14, fontWeight:600 }}>{dept}</span>
          <span style={{ fontSize:12.5, color:"var(--text-faint)" }}>· Knowledge</span>
        </div>
        <div style={{ flex:1 }} />
        <div style={{ display:"flex", alignItems:"center", gap:8, padding:"0 12px", height:34, borderRadius:9, background:"rgba(255,255,255,0.03)", border:"1px solid var(--border)", width:230, color:"var(--text-faint)" }}>
          <IconSearch size={15} /><span style={{ fontSize:12.5 }}>Search this conversation</span>
        </div>
      </div>

      {/* thread */}
      <div ref={scrollRef} style={{ flex:1, overflowY:"auto", padding:"28px 0" }}>
        <div style={{ maxWidth:820, margin:"0 auto", padding:"0 24px", display:"flex", flexDirection:"column", gap:24 }}>
          {messages.map((m, i) => m.role === "user"
            ? <UserMessage key={i} text={m.text} initials={account.initials} tint={account.tint} />
            : <AIMessage key={i} msg={m} onCite={onCite} />)}
        </div>
      </div>

      {/* composer */}
      <div style={{ flexShrink:0, padding:"0 24px 22px" }}>
        <div style={{ maxWidth:820, margin:"0 auto" }}>
          {messages.length <= 2 && (
            <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={()=>setInput(s)} className="lift"
                  style={{ fontSize:12.5, padding:"7px 12px", borderRadius:99, color:"var(--text-dim)", background:"rgba(255,255,255,0.03)", border:"1px solid var(--border)" }}
                  onMouseEnter={(e)=>{e.currentTarget.style.borderColor="var(--border-glow)"; e.currentTarget.style.color="var(--text)";}}
                  onMouseLeave={(e)=>{e.currentTarget.style.borderColor="var(--border)"; e.currentTarget.style.color="var(--text-dim)";}}>{s}</button>
              ))}
            </div>
          )}
          <div className={"input-glow" + (active ? " active" : "")} style={{ borderRadius:16, background:"rgba(255,255,255,0.035)", border:"1px solid var(--border-2)", padding:"12px 12px 10px 16px" }}>
            <textarea value={input} onChange={(e)=>setInput(e.target.value)} onKeyDown={onKey}
              onFocus={()=>setActive(true)} onBlur={()=>setActive(false)} rows={1}
              placeholder={`Ask about ${dept === "All departments" ? "any unit, procedure, or tag…" : dept + "…"}`}
              style={{ width:"100%", background:"none", border:"none", color:"var(--text)", fontSize:14.5, lineHeight:1.5, resize:"none", maxHeight:140, fontFamily:"inherit" }} />
            <div style={{ display:"flex", alignItems:"center", gap:10, marginTop:8 }}>
              <IconBtn title="Attach document"><IconPaperclip size={18} /></IconBtn>
              <button onClick={()=>setDeptOpen(o=>!o)} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--text-dim)", padding:"5px 9px", borderRadius:8, background:"rgba(255,255,255,0.03)", border:"1px solid var(--border)", position:"relative" }}>
                {curDept ? <NamedIcon name={curDept.icon} size={13} style={{ color:curDept.tint }} /> : <IconGrid size={13} />}
                {dept === "All departments" ? "All depts" : curDept?.short}
                <IconChevDown size={13} />
                {deptOpen && (
                  <div style={{ position:"absolute", bottom:"calc(100% + 8px)", left:0, width:230, zIndex:20 }} className="glass pop-in" onClick={(e)=>e.stopPropagation()}>
                    <div style={{ padding:6 }}>
                      {DEPTS_CHAT.map(d => {
                        const dd = DEPARTMENTS.find(x=>x.name===d);
                        return (
                          <div key={d} onClick={()=>{setDept(d); setDeptOpen(false);}}
                            style={{ display:"flex", alignItems:"center", gap:9, padding:"8px 10px", borderRadius:8, fontSize:13, cursor:"pointer", color: d===dept?"var(--text)":"var(--text-dim)", background: d===dept?"rgba(139,92,246,0.12)":"transparent" }}
                            onMouseEnter={(e)=>{ if(d!==dept) e.currentTarget.style.background="rgba(255,255,255,0.05)"; }}
                            onMouseLeave={(e)=>{ if(d!==dept) e.currentTarget.style.background="transparent"; }}>
                            {dd ? <NamedIcon name={dd.icon} size={14} style={{ color:dd.tint }} /> : <IconGrid size={14} />}
                            <span style={{ flex:1 }}>{d}</span>
                            {d===dept && <IconCheck size={14} style={{ color:"var(--a3)" }} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </button>
              <div style={{ flex:1 }} />
              <span style={{ fontSize:11, color:"var(--text-faint)" }} className="mono">{account.role === "End User" ? "read-only · " : ""}Opus 4.6</span>
              {streaming
                ? <button onClick={stop} className="lift" style={{ width:38, height:38, borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center", background:"rgba(255,255,255,0.08)", color:"var(--text)" }} title="Stop"><IconStop size={15} /></button>
                : <button onClick={send} disabled={!input.trim()} className="lift" title="Send"
                    style={{ width:38, height:38, borderRadius:11, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff",
                      background: input.trim()?"var(--accent-grad)":"rgba(255,255,255,0.06)", opacity: input.trim()?1:0.6,
                      boxShadow: input.trim()?"0 4px 16px rgba(99,102,241,0.4)":"none", transition:"all var(--dur) var(--ease)" }}
                    onMouseEnter={(e)=>{ if(input.trim()){ e.currentTarget.style.transform="translateY(-1px)"; e.currentTarget.style.boxShadow="0 8px 26px rgba(99,102,241,0.55)"; }}}
                    onMouseLeave={(e)=>{ e.currentTarget.style.transform="none"; e.currentTarget.style.boxShadow=input.trim()?"0 4px 16px rgba(99,102,241,0.4)":"none"; }}>
                    <IconSend size={17} /></button>}
            </div>
          </div>
          <div style={{ textAlign:"center", fontSize:11, color:"var(--text-faint)", marginTop:10 }}>
            NRL AI Workshop grounds every answer in controlled documents. Verify against the source before field execution.
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ChatScreen });
