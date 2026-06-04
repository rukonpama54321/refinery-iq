// data.jsx — believable refinery operations content for "Northgate Refining"

// ---- demo login accounts (one per role) ----
const ACCOUNTS = [
  { id:"u-admin", name:"Dana Okonkwo", email:"dana.okonkwo@northgate-refining.com",
    password:"refineiq", role:"Admin", title:"Plant Manager", dept:"Operations",
    initials:"DO", tint:"#8B5CF6" },
  { id:"u-mgr", name:"Marcus Reyes", email:"marcus.reyes@northgate-refining.com",
    password:"refineiq", role:"Manager", title:"Maintenance & Reliability Mgr", dept:"Maintenance & Reliability",
    initials:"MR", tint:"#3B82F6" },
  { id:"u-end", name:"Lena Schmidt", email:"lena.schmidt@northgate-refining.com",
    password:"refineiq", role:"End User", title:"Senior Process Operator", dept:"Process Engineering",
    initials:"LS", tint:"#6B7280" },
];

const ROLE_TINT = { "Admin":"#8B5CF6", "Manager":"#3B82F6", "End User":"#6B7280" };

const DEPARTMENTS = [
  { id:"proc",  name:"Process Engineering",        short:"Process Eng",  icon:"Gauge",    docs:412, coverage:92, tint:"#8B5CF6" },
  { id:"maint", name:"Maintenance & Reliability",  short:"Maintenance",  icon:"Wrench",   docs:368, coverage:88, tint:"#6366F1" },
  { id:"hse",   name:"HSE",                         short:"HSE",          icon:"Shield",   docs:294, coverage:96, tint:"#34D399" },
  { id:"ops",   name:"Operations",                  short:"Operations",   icon:"Grid",     docs:507, coverage:81, tint:"#3B82F6" },
  { id:"lab",   name:"Lab & Quality",               short:"Lab/Quality",  icon:"Flask",    docs:176, coverage:74, tint:"#A78BFA" },
];

// ---- document library ----
const DOCUMENTS = [
  { id:"d1",  name:"Crude Distillation Unit — SOP",            ver:"v3.2", dept:"Process Engineering",       date:"2026-05-22", status:"Indexed",    size:"4.2 MB", owner:"L. Schmidt", restricted:false },
  { id:"d2",  name:"API 510 Pressure Vessel Inspection Plan",  ver:"v2.0", dept:"Maintenance & Reliability", date:"2026-05-18", status:"Indexed",    size:"8.9 MB", owner:"M. Reyes",   restricted:false },
  { id:"d3",  name:"HF Alkylation Unit — Safety Interlocks",   ver:"v1.4", dept:"HSE",                       date:"2026-05-11", status:"Restricted", size:"2.1 MB", owner:"HSE Office", restricted:true  },
  { id:"d4",  name:"Hydrocracker Startup Procedure",           ver:"v5.1", dept:"Process Engineering",       date:"2026-04-29", status:"Indexed",    size:"6.7 MB", owner:"L. Schmidt", restricted:false },
  { id:"d5",  name:"PSV Relief Valve Test Log — Unit 200",     ver:"v12",  dept:"Maintenance & Reliability", date:"2026-05-26", status:"Processing", size:"1.3 MB", owner:"M. Reyes",   restricted:false },
  { id:"d6",  name:"Flare & Relief System — P&ID Set",         ver:"Rev G",dept:"Operations",                date:"2026-03-14", status:"Indexed",    size:"22 MB",  owner:"Ops Eng",    restricted:false },
  { id:"d7",  name:"Incident Report — 2026-04 NER Flare Trip", ver:"v1.0", dept:"HSE",                       date:"2026-04-09", status:"Restricted", size:"980 KB", owner:"HSE Office", restricted:true  },
  { id:"d8",  name:"Crude Assay — Bakken Light Sweet",         ver:"v2.3", dept:"Lab & Quality",             date:"2026-05-02", status:"Indexed",    size:"3.4 MB", owner:"Lab Group",  restricted:false },
  { id:"d9",  name:"Turnaround 2026 — Scope & Schedule",       ver:"v0.9", dept:"Operations",                date:"2026-05-30", status:"Processing", size:"15 MB",  owner:"Ops Eng",    restricted:false },
  { id:"d10", name:"FCC Catalyst Handling — MSDS",             ver:"v4.0", dept:"HSE",                       date:"2026-02-21", status:"Indexed",    size:"1.1 MB", owner:"HSE Office", restricted:false },
  { id:"d11", name:"Cooling Water Treatment — Operating Guide",ver:"v1.8", dept:"Process Engineering",       date:"2026-01-17", status:"Archived",   size:"2.8 MB", owner:"L. Schmidt", restricted:false },
  { id:"d12", name:"Rotating Equipment Vibration Limits",      ver:"v3.0", dept:"Maintenance & Reliability", date:"2026-05-08", status:"Indexed",    size:"760 KB", owner:"M. Reyes",   restricted:false },
];

// ---- users (admin table) ----
const USERS = [
  { id:"u-admin", name:"Dana Okonkwo",  email:"dana.okonkwo@northgate-refining.com",  role:"Admin",    dept:"Operations",                status:true,  last:"Active now",   initials:"DO" },
  { id:"u-mgr",   name:"Marcus Reyes",  email:"marcus.reyes@northgate-refining.com",  role:"Manager",  dept:"Maintenance & Reliability", status:true,  last:"4m ago",       initials:"MR" },
  { id:"u-end",   name:"Lena Schmidt",  email:"lena.schmidt@northgate-refining.com",  role:"End User", dept:"Process Engineering",       status:true,  last:"12m ago",      initials:"LS" },
  { id:"u4",      name:"Priya Nair",    email:"priya.nair@northgate-refining.com",    role:"Manager",  dept:"HSE",                       status:true,  last:"1h ago",       initials:"PN" },
  { id:"u5",      name:"Tomás Herrera", email:"tomas.herrera@northgate-refining.com", role:"End User", dept:"Operations",                status:true,  last:"3h ago",       initials:"TH" },
  { id:"u6",      name:"Aisha Bello",   email:"aisha.bello@northgate-refining.com",   role:"Manager",  dept:"Process Engineering",       status:true,  last:"Yesterday",    initials:"AB" },
  { id:"u7",      name:"Greg Vance",    email:"greg.vance@northgate-refining.com",    role:"End User", dept:"Lab & Quality",             status:false, last:"5 days ago",   initials:"GV" },
  { id:"u8",      name:"Wei Chen",      email:"wei.chen@northgate-refining.com",      role:"End User", dept:"Maintenance & Reliability", status:true,  last:"2h ago",       initials:"WC" },
  { id:"u9",      name:"Sofia Ricci",   email:"sofia.ricci@northgate-refining.com",   role:"Admin",    dept:"Operations",                status:false, last:"2 weeks ago",  initials:"SR" },
];

// ---- chat conversation history ----
const CONVERSATIONS = [
  { id:"c1", title:"CDU heater coil max skin temp", dept:"Process Engineering",       time:"Now",        active:true },
  { id:"c2", title:"Overdue PSV inspections — Unit 200", dept:"Maintenance & Reliability", time:"26m" },
  { id:"c3", title:"HF alkylation interlock logic", dept:"HSE",                       time:"2h" },
  { id:"c4", title:"Turnaround 2026 critical path", dept:"Operations",                time:"Yesterday" },
  { id:"c5", title:"Bakken crude TBP cut points",   dept:"Lab & Quality",             time:"Tue" },
  { id:"c6", title:"Cooling tower blowdown setpoint", dept:"Process Engineering",     time:"Mon" },
];

// ---- recent queries (dashboard) ----
const RECENT_QUERIES = [
  { q:"What is the max skin temperature for the CDU charge heater coils?", user:"L. Schmidt", dept:"Process Engineering",       time:"2m",  sentiment:"green" },
  { q:"List overdue PSV inspections in Unit 200 with due dates",          user:"M. Reyes",   dept:"Maintenance & Reliability", time:"14m", sentiment:"green" },
  { q:"Summarize the HF alkylation safety interlocks and trip setpoints", user:"P. Nair",    dept:"HSE",                       time:"38m", sentiment:"amber" },
  { q:"Why did the flare trip on 2026-04-09 and what was the root cause?", user:"T. Herrera", dept:"Operations",                time:"1h",  sentiment:"red"   },
  { q:"Recommended cut points for Bakken light sweet on the CDU",         user:"G. Vance",   dept:"Lab & Quality",             time:"2h",  sentiment:"green" },
  { q:"Vibration alarm limits for P-1201 boiler feedwater pump",          user:"W. Chen",    dept:"Maintenance & Reliability", time:"3h",  sentiment:"amber" },
];

// ---- activity feed (dashboard) ----
const ACTIVITY = [
  { kind:"doc",   text:"Turnaround 2026 — Scope & Schedule uploaded",        who:"Ops Eng",    time:"8m",  tint:"#6366F1" },
  { kind:"user",  text:"Marcus Reyes role changed to Manager",              who:"Dana O.",    time:"22m", tint:"#3B82F6" },
  { kind:"index", text:"PSV Relief Valve Test Log — Unit 200 re-indexed",   who:"System",     time:"34m", tint:"#A78BFA" },
  { kind:"access",text:"Lena Schmidt requested access to Incident Report",  who:"Lena S.",    time:"1h",  tint:"#FBBF24" },
  { kind:"doc",   text:"Rotating Equipment Vibration Limits v3.0 published",who:"M. Reyes",   time:"2h",  tint:"#6366F1" },
  { kind:"index", text:"Crude Assay — Bakken Light Sweet embeddings updated",who:"System",    time:"3h",  tint:"#A78BFA" },
];

// ---- admin stat cards ----
const STATS = [
  { label:"Total Documents", value:"1,757", delta:"+34 this week",  trend:"up",   icon:"File" },
  { label:"Active Users",    value:"148",   delta:"+6 this week",   trend:"up",   icon:"Users" },
  { label:"Queries Today",   value:"2,391", delta:"+12% vs avg",    trend:"up",   icon:"Chat" },
  { label:"Avg Response",    value:"1.8s",  delta:"−0.3s vs avg",   trend:"down", icon:"Clock" },
];

const MODELS = ["Claude Opus 4.6", "Llama 3.1 70B", "GPT-4o"];

// ---- open chat thread (the "CDU heater coil" conversation) ----
const SAMPLE_THREAD = [
  { role:"user", text:"What is the maximum skin temperature for the CDU charge heater coils, and what action is required if it's exceeded?" },
  { role:"ai", model:"Claude Opus 4.6",
    text:"For the Crude Distillation Unit charge heater (H-101), the maximum allowable tube skin temperature is **620 °C (1,148 °F)** for the radiant section coils, per the design data sheet. A high-skin-temp alarm is set at **595 °C** with the controller trimming firing accordingly.\n\nIf the **620 °C limit is exceeded**, the SOP requires the operator to:\n\n1. Reduce burner firing to bring skin temp below 595 °C within 5 minutes.\n2. Verify charge flow is at or above the 78% minimum-flow interlock — low flow is the most common cause of localized overheating.\n3. If skin temp does not respond, initiate a controlled heater trip per the emergency shutdown procedure and notify the shift supervisor.\n\nSustained operation above 620 °C accelerates coil coking and creep damage, which feeds directly into the API 530 remaining-life calculation.",
    citations:[
      { doc:"Crude Distillation Unit — SOP v3.2", page:"p.41", restricted:false },
      { doc:"H-101 Heater Design Data Sheet", page:"p.6", restricted:false },
      { doc:"API 530 Remaining Life Assessment", page:"p.12", restricted:false },
    ] },
];

// ---- canned AI answers (keyword-matched) for live streaming ----
const AI_ANSWERS = [
  { keys:["psv","relief","valve","inspection","overdue"], model:"Claude Opus 4.6",
    text:"There are **3 overdue PSV inspections** in Unit 200 as of today:\n\n1. **PSV-2014** (Crude column overhead) — due 2026-04-30, **35 days overdue**. Last test interval 5 yr.\n2. **PSV-2031** (Reflux drum) — due 2026-05-15, **20 days overdue**.\n3. **PSV-2048** (Naphtha stabilizer) — due 2026-05-22, **13 days overdue**.\n\nAll three fall under the API 510 / API 576 inspection program. PSV-2014 is the highest priority — it protects the main column and its overdue status should be escalated to the reliability lead before the next run.",
    citations:[
      { doc:"PSV Relief Valve Test Log — Unit 200 v12", page:"p.3", restricted:false },
      { doc:"API 510 Pressure Vessel Inspection Plan v2.0", page:"p.18", restricted:false },
    ] },
  { keys:["hf","alkylation","interlock","safety","trip"], model:"Claude Opus 4.6",
    text:"The HF Alkylation unit safety interlocks are documented in a **restricted HSE procedure**. I can share the high-level structure, but the specific trip setpoints require document access.\n\nThe interlock hierarchy covers: acid inventory isolation on detection of an HF leak, rapid de-inventory to the acid relief system, water-spray mitigation activation, and unit-wide ESD. Access to the full setpoint table is gated — request access to the source document to see exact values.",
    citations:[
      { doc:"HF Alkylation Unit — Safety Interlocks v1.4", page:"p.7", restricted:true },
    ] },
  { keys:["flare","trip","root cause","incident","2026-04"], model:"Claude Opus 4.6",
    text:"The flare trip on **2026-04-09** is covered by a restricted HSE incident report. Summary metadata is available, but the root-cause analysis and corrective actions are access-controlled.\n\nWhat I can confirm from indexed operating logs: the event was a momentary loss of the flare pilot on the high-pressure flare, lasting ~90 seconds, with no release. The detailed sequence of events and RCA findings are in the restricted report.",
    citations:[
      { doc:"Incident Report — 2026-04 NER Flare Trip v1.0", page:"p.2", restricted:true },
      { doc:"Flare & Relief System — P&ID Set Rev G", page:"sheet 4", restricted:false },
    ] },
  { keys:["bakken","crude","assay","cut","tbp","cut point"], model:"Claude Opus 4.6",
    text:"For **Bakken Light Sweet** on the CDU, the recommended TBP cut points from the latest assay are:\n\n- **Light naphtha:** IBP – 85 °C\n- **Heavy naphtha:** 85 – 165 °C\n- **Kerosene/jet:** 165 – 235 °C\n- **Diesel:** 235 – 360 °C\n- **Atmospheric residue:** 360 °C+\n\nBakken is a light, low-sulfur crude (API ~42, ~0.2 wt% S), so it yields a high light-ends fraction. Watch the naphtha stabilizer loading — light crudes like this tend to push it toward its hydraulic limit.",
    citations:[
      { doc:"Crude Assay — Bakken Light Sweet v2.3", page:"p.9", restricted:false },
      { doc:"Crude Distillation Unit — SOP v3.2", page:"p.22", restricted:false },
    ] },
  { keys:["vibration","pump","p-1201","rotating","alarm","limit"], model:"Claude Opus 4.6",
    text:"For pump **P-1201** (boiler feedwater), the vibration limits per the rotating-equipment standard are:\n\n- **Alert (alarm):** 4.5 mm/s RMS overall velocity\n- **Danger (trip):** 7.1 mm/s RMS\n\nThese follow ISO 10816-3 Zone B/C boundaries for a rigidly-mounted machine in this power class. At 4.5 mm/s, schedule a bearing inspection at the next opportunity; at 7.1 mm/s the machine should be removed from service. Current trend data isn't in my index — pull it from the condition-monitoring system.",
    citations:[
      { doc:"Rotating Equipment Vibration Limits v3.0", page:"p.4", restricted:false },
    ] },
];

const DEFAULT_ANSWER = { model:"Claude Opus 4.6",
  text:"Based on the indexed refinery documentation, here's what I found. I've grounded this answer in the most relevant controlled documents and cited the exact pages below.\n\nFor a more specific answer, try referencing a unit, tag number, or procedure — for example *\"max skin temp for the CDU charge heater\"* or *\"overdue PSV inspections in Unit 200\"*. I'll pull the governing SOP, data sheet, or inspection record and summarize the operative limits and required actions.",
  citations:[
    { doc:"Crude Distillation Unit — SOP v3.2", page:"p.41", restricted:false },
    { doc:"Operations Knowledge Base — Index", page:"—", restricted:false },
  ] };

function matchAnswer(q) {
  const s = (q || "").toLowerCase();
  let best = null, bestScore = 0;
  for (const a of AI_ANSWERS) {
    const score = a.keys.reduce((n,k)=> n + (s.includes(k) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = a; }
  }
  return bestScore > 0 ? best : DEFAULT_ANSWER;
}

Object.assign(window, {
  ACCOUNTS, ROLE_TINT, DEPARTMENTS, DOCUMENTS, USERS, CONVERSATIONS,
  RECENT_QUERIES, ACTIVITY, STATS, MODELS, SAMPLE_THREAD, AI_ANSWERS,
  DEFAULT_ANSWER, matchAnswer,
});
