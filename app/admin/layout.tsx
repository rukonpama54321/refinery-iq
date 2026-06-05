// Admin panel layout — server component, gated to admin role.
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireUser } from "@/lib/auth/user";
import { createClient } from "@/lib/supabase/server";

const NAV = [
  { href: "/admin/documents", label: "Documents",  icon: "📄" },
  { href: "/admin/users",     label: "Users",       icon: "👥" },
  { href: "/admin/audit",     label: "Audit log",   icon: "📋" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: appUser } = await supabase
    .from("app_users")
    .select("role, display_name, email")
    .eq("id", user.id)
    .single();

  if (!appUser || appUser.role !== "admin") redirect("/chat");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0, borderRight: "1px solid var(--border)",
        display: "flex", flexDirection: "column", padding: "24px 0",
        background: "var(--glass)", backdropFilter: "blur(16px)",
      }}>
        {/* Logo */}
        <div style={{ padding: "0 20px 24px", borderBottom: "1px solid var(--border)" }}>
          <Link href="/chat" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9, background: "var(--accent-grad)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: 14,
              }}>R</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>Admin</div>
                <div style={{ fontSize: 11, color: "var(--text-dim)" }}>NumaligarhRefineryIQ</div>
              </div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 12px", borderRadius: "var(--r-md)",
                fontSize: 13.5, fontWeight: 500, color: "var(--text-dim)",
                textDecoration: "none", transition: "background 0.15s",
              }}
              className="admin-nav-link"
            >
              <span style={{ fontSize: 16 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User info */}
        <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.5 }}>
            <div style={{ fontWeight: 600, color: "var(--text)" }}>
              {appUser.display_name ?? appUser.email}
            </div>
            <div style={{ fontSize: 11, marginTop: 2 }}>Administrator</div>
          </div>
          <Link
            href="/chat"
            style={{ display: "block", marginTop: 10, fontSize: 12, color: "var(--accent)", textDecoration: "none" }}
          >
            ← Back to chat
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: "auto", padding: "32px 36px" }}>
        {children}
      </main>

      <style>{`
        .admin-nav-link:hover { background: var(--glass-2); color: var(--text) !important; }
      `}</style>
    </div>
  );
}
