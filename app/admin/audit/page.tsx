"use client";

import { useEffect, useState } from "react";

interface AuditEvent {
  id: string;
  created_at: string;
  event_type: string;
  actor_id: string | null;
  target_id: string | null;
  metadata: Record<string, unknown> | null;
}

const EVENT_ICONS: Record<string, string> = {
  login:          "🔐",
  logout:         "🚪",
  doc_upload:     "📤",
  doc_index:      "📥",
  doc_delete:     "🗑️",
  user_provision: "👤",
  user_update:    "✏️",
  chat_query:     "💬",
  default:        "📋",
};

export default function AuditPage() {
  const [events,  setEvents]  = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("");

  async function load() {
    setLoading(true);
    const r = await fetch("/api/admin/audit");
    if (r.ok) setEvents(await r.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = filter
    ? events.filter((e) =>
        e.event_type.includes(filter) ||
        JSON.stringify(e.metadata ?? {}).toLowerCase().includes(filter.toLowerCase())
      )
    : events;

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Audit log</h1>
      <p style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 28 }}>
        All system events — uploads, logins, queries, provisioning.
      </p>

      <div className="glass" style={{ borderRadius: "var(--r-xl)", overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)", display: "flex", gap: 12, alignItems: "center" }}>
          <input
            value={filter} onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter by event type or metadata…"
            style={{ flex: 1, padding: "7px 12px", fontSize: 13, background: "var(--glass-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-md)", color: "var(--text)", outline: "none" }}
          />
          <button onClick={load} style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>↻ Refresh</button>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-dim)", fontSize: 14 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-dim)", fontSize: 14 }}>
            {filter ? "No matching events." : "No audit events recorded yet."}
          </div>
        ) : (
          <div>
            {filtered.map((ev) => (
              <div key={ev.id} style={{ padding: "12px 20px", borderBottom: "1px solid var(--border)", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>
                  {EVENT_ICONS[ev.event_type] ?? EVENT_ICONS.default}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{ev.event_type}</span>
                    <span style={{ fontSize: 11, color: "var(--text-dim)" }}>
                      {new Date(ev.created_at).toLocaleString()}
                    </span>
                    {ev.actor_id && (
                      <span style={{ fontSize: 11, color: "var(--text-faint)", fontFamily: "monospace" }}>
                        actor: {ev.actor_id.slice(0, 8)}…
                      </span>
                    )}
                  </div>
                  {ev.metadata && Object.keys(ev.metadata).length > 0 && (
                    <div style={{ marginTop: 4, fontSize: 12, color: "var(--text-dim)", fontFamily: "monospace", wordBreak: "break-all" }}>
                      {JSON.stringify(ev.metadata)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
