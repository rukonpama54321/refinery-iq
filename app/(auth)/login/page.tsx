"use client";

import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

const initial: LoginState = { ok: false };

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

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(sendMagicLink, initial);

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="glass fade-rise" style={{ width: "100%", maxWidth: 420, padding: "30px 32px", borderRadius: "var(--r-xl)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 22 }}>
          <Logo />
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>NumaligarhRefineryIQ</div>
            <div style={{ fontSize: 13, color: "var(--text-dim)" }}>Numaligarh Refinery Ltd. · Operations Intelligence</div>
          </div>
        </div>

        {state.ok ? (
          <div className="fade-rise" style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.55 }}>
            <div className="shimmer-text" style={{ fontWeight: 600, fontSize: 15, marginBottom: 8 }}>
              Check your inbox
            </div>
            We sent a sign-in link to <span style={{ color: "var(--text)" }}>{state.email}</span>.
            Open it on this device to continue. The link expires shortly.
          </div>
        ) : (
          <form action={formAction}>
            <label htmlFor="email" style={{ display: "block", fontSize: 12.5, fontWeight: 600, color: "var(--text-dim)", marginBottom: 8 }}>
              Work email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@nrl.co.in"
              className="input-glow"
              style={{
                width: "100%", padding: "12px 14px", fontSize: 14, color: "var(--text)",
                background: "var(--glass-2)", border: "1px solid var(--border-2)",
                borderRadius: "var(--r-md)", outline: "none",
              }}
            />

            {state.error && (
              <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--red)" }}>{state.error}</div>
            )}

            <button
              type="submit"
              disabled={pending}
              style={{
                width: "100%", marginTop: 16, padding: "12px 14px", fontSize: 14, fontWeight: 600,
                color: "#fff", background: "var(--accent-grad)", border: "none",
                borderRadius: "var(--r-md)", cursor: pending ? "default" : "pointer",
                opacity: pending ? 0.7 : 1, boxShadow: "0 8px 30px rgba(99,102,241,0.35)",
              }}
            >
              {pending ? "Sending…" : "Send sign-in link"}
            </button>

            <div style={{ marginTop: 16, fontSize: 11.5, color: "var(--text-faint)", lineHeight: 1.5 }}>
              Passwordless sign-in. Access is provisioned by your administrator —
              if your email isn’t recognised, contact them.
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
