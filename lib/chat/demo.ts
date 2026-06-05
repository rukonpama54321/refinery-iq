// Demo content for the chat screen — believable refinery operations Q&A for
// "Northgate Refining" (public-safe name). Used to seed the opening thread and
// to power the canned streaming fallback when GROQ_API_KEY is absent (pre-RAG).
import type { Department } from "@/lib/auth/rbac";
import type { CitationData } from "@/components/ui";

export interface DeptMeta {
  key: Department;
  name: string;
  short: string;
  icon: string;
  tint: string;
}

/** Display metadata for the department selector (mirrors rbac departments). */
export const CHAT_DEPARTMENTS: DeptMeta[] = [
  { key: "process_engineering", name: "Process Engineering", short: "Process Eng", icon: "Gauge", tint: "#8B5CF6" },
  { key: "maintenance_reliability", name: "Maintenance & Reliability", short: "Maintenance", icon: "Wrench", tint: "#6366F1" },
  { key: "hse", name: "Health, Safety & Environment", short: "HSE", icon: "Shield", tint: "#34D399" },
  { key: "operations", name: "Operations", short: "Operations", icon: "Grid", tint: "#3B82F6" },
  { key: "lab_quality", name: "Lab & Quality", short: "Lab/Quality", icon: "Flask", tint: "#A78BFA" },
  { key: "hr", name: "Human Resources", short: "HR", icon: "Users", tint: "#FBBF24" },
];

export const SUGGESTIONS = [
  "Overdue PSV inspections in Unit 200",
  "Bakken crude recommended cut points",
  "P-1201 pump vibration alarm limits",
];

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: CitationData[];
  model?: string;
}

export interface DemoAnswer {
  model: string;
  text: string;
  citations: CitationData[];
}

const MODEL = "Llama 3.3 70B";

/** The opening "CDU heater coil" conversation shown when the screen loads. */
export const SAMPLE_THREAD: ChatMessage[] = [
  {
    role: "user",
    content:
      "What is the maximum skin temperature for the CDU charge heater coils, and what action is required if it's exceeded?",
  },
  {
    role: "assistant",
    model: MODEL,
    content:
      "For the Crude Distillation Unit charge heater (H-101), the maximum allowable tube skin temperature is **620 °C (1,148 °F)** for the radiant section coils, per the design data sheet. A high-skin-temp alarm is set at **595 °C** with the controller trimming firing accordingly.\n\nIf the **620 °C limit is exceeded**, the SOP requires the operator to:\n\n1. Reduce burner firing to bring skin temp below 595 °C within 5 minutes.\n2. Verify charge flow is at or above the 78% minimum-flow interlock — low flow is the most common cause of localized overheating.\n3. If skin temp does not respond, initiate a controlled heater trip per the emergency shutdown procedure and notify the shift supervisor.\n\nSustained operation above 620 °C accelerates coil coking and creep damage, which feeds directly into the API 530 remaining-life calculation.",
    citations: [
      { doc: "Crude Distillation Unit — SOP v3.2", page: "p.41", restricted: false },
      { doc: "H-101 Heater Design Data Sheet", page: "p.6", restricted: false },
      { doc: "API 530 Remaining Life Assessment", page: "p.12", restricted: false },
    ],
  },
];

interface CannedAnswer extends DemoAnswer {
  keys: string[];
}

const AI_ANSWERS: CannedAnswer[] = [
  {
    keys: ["psv", "relief", "valve", "inspection", "overdue"],
    model: MODEL,
    text:
      "There are **3 overdue PSV inspections** in Unit 200 as of today:\n\n1. **PSV-2014** (Crude column overhead) — due 2026-04-30, **35 days overdue**. Last test interval 5 yr.\n2. **PSV-2031** (Reflux drum) — due 2026-05-15, **20 days overdue**.\n3. **PSV-2048** (Naphtha stabilizer) — due 2026-05-22, **13 days overdue**.\n\nAll three fall under the API 510 / API 576 inspection program. PSV-2014 is the highest priority — it protects the main column and its overdue status should be escalated to the reliability lead before the next run.",
    citations: [
      { doc: "PSV Relief Valve Test Log — Unit 200 v12", page: "p.3", restricted: false },
      { doc: "API 510 Pressure Vessel Inspection Plan v2.0", page: "p.18", restricted: false },
    ],
  },
  {
    keys: ["hf", "alkylation", "interlock", "safety", "trip"],
    model: MODEL,
    text:
      "The HF Alkylation unit safety interlocks are documented in a **restricted HSE procedure**. I can share the high-level structure, but the specific trip setpoints require document access.\n\nThe interlock hierarchy covers: acid inventory isolation on detection of an HF leak, rapid de-inventory to the acid relief system, water-spray mitigation activation, and unit-wide ESD. Access to the full setpoint table is gated — request access to the source document to see exact values.",
    citations: [
      { doc: "HF Alkylation Unit — Safety Interlocks v1.4", page: "p.7", restricted: true },
    ],
  },
  {
    keys: ["flare", "trip", "root cause", "incident", "2026-04"],
    model: MODEL,
    text:
      "The flare trip on **2026-04-09** is covered by a restricted HSE incident report. Summary metadata is available, but the root-cause analysis and corrective actions are access-controlled.\n\nWhat I can confirm from indexed operating logs: the event was a momentary loss of the flare pilot on the high-pressure flare, lasting ~90 seconds, with no release. The detailed sequence of events and RCA findings are in the restricted report.",
    citations: [
      { doc: "Incident Report — 2026-04 NER Flare Trip v1.0", page: "p.2", restricted: true },
      { doc: "Flare & Relief System — P&ID Set Rev G", page: "sheet 4", restricted: false },
    ],
  },
  {
    keys: ["bakken", "crude", "assay", "cut", "tbp", "cut point"],
    model: MODEL,
    text:
      "For **Bakken Light Sweet** on the CDU, the recommended TBP cut points from the latest assay are:\n\n- **Light naphtha:** IBP – 85 °C\n- **Heavy naphtha:** 85 – 165 °C\n- **Kerosene/jet:** 165 – 235 °C\n- **Diesel:** 235 – 360 °C\n- **Atmospheric residue:** 360 °C+\n\nBakken is a light, low-sulfur crude (API ~42, ~0.2 wt% S), so it yields a high light-ends fraction. Watch the naphtha stabilizer loading — light crudes like this tend to push it toward its hydraulic limit.",
    citations: [
      { doc: "Crude Assay — Bakken Light Sweet v2.3", page: "p.9", restricted: false },
      { doc: "Crude Distillation Unit — SOP v3.2", page: "p.22", restricted: false },
    ],
  },
  {
    keys: ["vibration", "pump", "p-1201", "rotating", "alarm", "limit"],
    model: MODEL,
    text:
      "For pump **P-1201** (boiler feedwater), the vibration limits per the rotating-equipment standard are:\n\n- **Alert (alarm):** 4.5 mm/s RMS overall velocity\n- **Danger (trip):** 7.1 mm/s RMS\n\nThese follow ISO 10816-3 Zone B/C boundaries for a rigidly-mounted machine in this power class. At 4.5 mm/s, schedule a bearing inspection at the next opportunity; at 7.1 mm/s the machine should be removed from service. Current trend data isn't in my index — pull it from the condition-monitoring system.",
    citations: [
      { doc: "Rotating Equipment Vibration Limits v3.0", page: "p.4", restricted: false },
    ],
  },
];

const DEFAULT_ANSWER: DemoAnswer = {
  model: MODEL,
  text:
    "Based on the indexed refinery documentation, here's what I found. I've grounded this answer in the most relevant controlled documents and cited the exact pages below.\n\nFor a more specific answer, try referencing a unit, tag number, or procedure — for example *\"max skin temp for the CDU charge heater\"* or *\"overdue PSV inspections in Unit 200\"*. I'll pull the governing SOP, data sheet, or inspection record and summarize the operative limits and required actions.",
  citations: [
    { doc: "Crude Distillation Unit — SOP v3.2", page: "p.41", restricted: false },
    { doc: "Operations Knowledge Base — Index", page: "—", restricted: false },
  ],
};

/** Keyword-match a question to a canned answer (used by the no-key fallback). */
export function matchAnswer(q: string): DemoAnswer {
  const s = (q || "").toLowerCase();
  let best: CannedAnswer | null = null;
  let bestScore = 0;
  for (const a of AI_ANSWERS) {
    const score = a.keys.reduce((n, k) => n + (s.includes(k) ? 1 : 0), 0);
    if (score > bestScore) { bestScore = score; best = a; }
  }
  if (best && bestScore > 0) {
    return { model: best.model, text: best.text, citations: best.citations };
  }
  return DEFAULT_ANSWER;
}
