// Dev scaffold landing — proves the ported design system renders.
// Replaced by the real login/chat once auth + RAG are wired.

const READY = [
  "Next.js 15 App Router + TypeScript",
  "Design system ported from UI/ prototype (tokens, glimmer, glass)",
  "Geist / Geist Mono fonts",
  "Docker stack: Elasticsearch + Redis (infra/docker-compose.yml)",
];
const NEXT = [
  "Auth (Supabase + Resend magic-link)",
  "Chat UI + streaming (port from prototype)",
  "RAG over the HCU manual (Groq + Gemini, Elasticsearch)",
  "Admin / dashboard / versioning",
];

function Logo() {
  return (
    <div
      style={{
        width: 46, height: 46, borderRadius: 13, display: "flex", alignItems: "center",
        justifyContent: "center", background: "var(--accent-grad)",
        boxShadow: "0 8px 30px rgba(99,102,241,0.45)", color: "#fff", fontWeight: 700, fontSize: 20,
      }}
    >
      R
    </div>
  );
}

export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="glass fade-rise" style={{ width: "100%", maxWidth: 620, padding: "30px 32px", borderRadius: "var(--r-xl)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
          <Logo />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>RefineryIQ</div>
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Northgate Refining · Operations Intelligence</div>
          </div>
        </div>

        <div className="shimmer-text" style={{ fontSize: 13.5, fontWeight: 600, margin: "16px 0 18px" }}>
          Development scaffold — foundation is live.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
          <Section title="Ready" items={READY} tint="var(--green)" />
          <Section title="Next" items={NEXT} tint="var(--a3)" />
        </div>

        <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid var(--border)", fontSize: 11.5, color: "var(--text-faint)" }}>
          Fully free stack · Groq (Llama 3.3 70B) + Gemini · no paid LLM. See <span className="mono">docs/</span> for the locked architecture.
        </div>
      </div>
    </main>
  );
}

function Section({ title, items, tint }: { title: string; items: string[]; tint: string }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-faint)", marginBottom: 10 }}>
        {title}
      </div>
      <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 9 }}>
        {items.map((it) => (
          <li key={it} style={{ display: "flex", gap: 9, alignItems: "flex-start", fontSize: 13, color: "var(--text-dim)", lineHeight: 1.4 }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: tint, marginTop: 6, flexShrink: 0 }} />
            {it}
          </li>
        ))}
      </ul>
    </div>
  );
}
