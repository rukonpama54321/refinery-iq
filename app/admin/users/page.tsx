"use client";

import { useEffect, useState } from "react";

const ROLES = ["admin", "manager", "end_user"];
const DEPARTMENTS = [
  { value: "process_engineering",     label: "Process Engineering" },
  { value: "maintenance_reliability", label: "Maintenance & Reliability" },
  { value: "hse",                     label: "HSE" },
  { value: "operations",              label: "Operations" },
  { value: "lab_quality",             label: "Lab & Quality" },
  { value: "hr",                      label: "HR" },
];

interface AppUser {
  id: string; email: string; full_name: string | null;
  role: string; home_dept: string; is_active: boolean; created_at: string;
  user_department_access: { department: string }[];
}

function roleBadgeColor(r: string) {
  if (r === "admin")   return { bg: "rgba(99,102,241,0.15)",   color: "var(--accent)" };
  if (r === "manager") return { bg: "rgba(234,179,8,0.15)",    color: "#ca8a04" };
  return                      { bg: "rgba(100,116,139,0.15)", color: "var(--text-dim)" };
}

export default function UsersPage() {
  const [users,     setUsers]     = useState<AppUser[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [success,   setSuccess]   = useState<string | null>(null);
  const [submitting,setSubmitting]= useState(false);

  // Provision form
  const [email,       setEmail]       = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role,        setRole]        = useState("end_user");
  const [dept,        setDept]        = useState("operations");

  async function loadUsers() {
    setLoading(true);
    const r = await fetch("/api/admin/users");
    if (r.ok) setUsers(await r.json());
    setLoading(false);
  }

  useEffect(() => { loadUsers(); }, []);

  async function provision(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setSuccess(null); setSubmitting(true);
    const r = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role, department: dept, display_name: displayName || undefined }),
    });
    const data = await r.json();
    setSubmitting(false);
    if (!r.ok) { setError(data.error ?? "Failed to provision user"); return; }
    setSuccess(`${email} provisioned. They can now sign in with a magic link.`);
    setEmail(""); setDisplayName(""); setRole("end_user"); setDept("operations");
    loadUsers();
  }

  async function toggleActive(user: AppUser) {
    await fetch("/api/admin/users", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: user.id, is_active: !user.is_active }),
    });
    loadUsers();
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>Users</h1>
      <p style={{ fontSize: 14, color: "var(--text-dim)", marginBottom: 28 }}>
        Provision new users and manage access.
      </p>

      {/* Provision form */}
      <div className="glass" style={{ padding: 24, borderRadius: "var(--r-xl)", marginBottom: 32 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Provision new user</h2>
        <form onSubmit={provision}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", display: "block", marginBottom: 5 }}>Work email *</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="user@nrl.co.in"
                style={{ width: "100%", padding: "9px 12px", fontSize: 13, background: "var(--glass-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-md)", color: "var(--text)", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", display: "block", marginBottom: 5 }}>Display name</label>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Firstname Lastname"
                style={{ width: "100%", padding: "9px 12px", fontSize: 13, background: "var(--glass-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-md)", color: "var(--text)", outline: "none" }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", display: "block", marginBottom: 5 }}>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", fontSize: 13, background: "var(--glass-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-md)", color: "var(--text)", outline: "none" }}>
                {ROLES.map((r) => <option key={r} value={r}>{r.replace("_", " ")}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-dim)", display: "block", marginBottom: 5 }}>Home department</label>
              <select value={dept} onChange={(e) => setDept(e.target.value)}
                style={{ width: "100%", padding: "9px 12px", fontSize: 13, background: "var(--glass-2)", border: "1px solid var(--border-2)", borderRadius: "var(--r-md)", color: "var(--text)", outline: "none" }}>
                {DEPARTMENTS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
          </div>

          {error   && <div style={{ fontSize: 13, color: "var(--red,#ef4444)", marginBottom: 10 }}>{error}</div>}
          {success && <div style={{ fontSize: 13, color: "var(--green,#22c55e)", marginBottom: 10 }}>{success}</div>}

          <button type="submit" disabled={submitting}
            style={{ padding: "10px 20px", fontSize: 13, fontWeight: 600, color: "#fff", background: "var(--accent-grad)", border: "none", borderRadius: "var(--r-md)", cursor: submitting ? "default" : "pointer", opacity: submitting ? 0.6 : 1 }}>
            {submitting ? "Provisioning…" : "Provision user"}
          </button>
        </form>
      </div>

      {/* Users table */}
      <div className="glass" style={{ borderRadius: "var(--r-xl)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600 }}>All users ({users.length})</h2>
          <button onClick={loadUsers} style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>↻ Refresh</button>
        </div>

        {loading ? (
          <div style={{ padding: 32, textAlign: "center", color: "var(--text-dim)", fontSize: 14 }}>Loading…</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--glass-2)" }}>
                {["User", "Role", "Departments", "Active", "Joined"].map((h) => (
                  <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: "var(--text-dim)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const { bg, color } = roleBadgeColor(u.role);
                const depts = u.user_department_access?.map((d) => d.department) ?? [];
                return (
                  <tr key={u.id} style={{ borderTop: "1px solid var(--border)", opacity: u.is_active ? 1 : 0.5 }}>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{u.full_name ?? u.email}</div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{u.email}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, padding: "3px 8px", borderRadius: 999, background: bg, color }}>
                        {u.role.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-dim)" }}>
                      {depts.length === 0 ? "—" : depts.join(", ")}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <button onClick={() => toggleActive(u)}
                        style={{ fontSize: 12, padding: "3px 10px", borderRadius: 999, border: "1px solid var(--border-2)", background: "none", cursor: "pointer", color: u.is_active ? "var(--green,#22c55e)" : "var(--text-dim)" }}>
                        {u.is_active ? "Active" : "Inactive"}
                      </button>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: 12, color: "var(--text-dim)", whiteSpace: "nowrap" }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
