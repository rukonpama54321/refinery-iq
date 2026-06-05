// Protected home.
// - Before Supabase keys exist: renders the dev scaffold (so `npm run dev` works).
// - Once configured: requireUser() gates access and greets the signed-in user.
//   Replaced by the real dashboard/chat as those land.
import Link from "next/link";
import { hasSupabaseEnv } from "@/lib/env";
import { requireUser } from "@/lib/auth/user";
import { DEPARTMENT_LABELS, ROLE_LABELS } from "@/lib/auth/rbac";
import { SignOutButton } from "@/components/sign-out-button";

const READY = [
  "Next.js 16 App Router + TypeScript",
  "Design system ported to typed components (icons + primitives)",
  "Auth: Supabase magic-link + RBAC (3 tiers × 6 departments)",
  "Chat UI + live streaming (Groq, with canned fallback)",
  "Docker stack: Elasticsearch + Redis (infra/docker-compose.yml)",
];
const NEXT = [
  "Wire GROQ_API_KEY for real chat answers",
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

export default async function Home() {
  // Pre-keys: show the scaffold without gating.
  const appUser = hasSupabaseEnv() ? await requireUser() : null;

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="glass fade-rise" style={{ width: "100%", maxWidth: 620, padding: "30px 32px", borderRadius: "var(--r-xl)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 6 }}>
          <Logo />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>RefineryIQ</div>
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Northgate Refining · Operations Intelligence</div>
          </div>
          {appUser && <SignOutButton />}
        </div>

        {appUser ? (
          <div className="fade-rise" style={{ margin: "16px 0 18px" }}>
            <div style={{ fontSize: 14, color: "var(--text-dim)" }}>
              Signed in as <span style={{ color: "var(--text)" }}>{appUser.fullName ?? appUser.email}</span>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <Chip label={ROLE_LABELS[appUser.role]} tint="var(--a3)" />
              <Chip label={DEPARTMENT_LABELS[appUser.homeDept]} tint="var(--blue)" />
            </div>
          </div>
        ) : (
          <div className="shimmer-text" style={{ fontSize: 13.5, fontWeight: 600, margin: "16px 0 18px" }}>
            Development scaffold — foundation is live. (Add Supabase keys to .env to enable sign-in.)
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 22 }}>
          <Section title="Ready" items={READY} tint="var(--green)" />
          <Section title="Next" items={NEXT} tint="var(--a3)" />
        </div>

        <div style={{ marginTop: 22 }}>
          <Link
            href="/chat"
            style={{
              display: "inline-flex", alignItems: "center", gap: 9, padding: "11px 20px", borderRadius: 11,
              fontSize: 13.5, fontWeight: 600, color: "#fff", textDecoration: "none",
              background: "var(--accent-grad)", boxShadow: "0 4px 16px rgba(99,102,241,0.28)",
            }}
          >
            Open chat →
          </Link>
        </div>

        <div style={{ marginTop: 22, paddingTop: 16, borderTop: "1px solid var(--border)", fontSize: 11.5, color: "var(--text-faint)" }}>
          Fully free stack · Groq (Llama 3.3 70B) + Gemini · no paid LLM. See <span className="mono">docs/</span> for the locked architecture.
        </div>
      </div>
    </main>
  );
}

function Chip({ label, tint }: { label: string; tint: string }) {
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600,
        color: "var(--text-dim)", background: "var(--glass-2)", border: "1px solid var(--border)",
        borderRadius: 99, padding: "4px 11px",
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 99, background: tint }} />
      {label}
    </span>
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
