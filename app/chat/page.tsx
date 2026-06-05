// Chat — the primary authed screen.
// - With Supabase keys: requireUser() gates access; account + permitted
//   departments come from the signed-in profile.
// - Pre-keys (dev): renders with a demo Admin account so the screen is usable
//   before auth is fully wired.
import Link from "next/link";
import { hasSupabaseEnv } from "@/lib/env";
import { requireUser } from "@/lib/auth/user";
import { ROLE_LABELS, type Department } from "@/lib/auth/rbac";
import { ROLE_TINT_BY_KEY } from "@/components/ui";
import { CHAT_DEPARTMENTS } from "@/lib/chat/demo";
import { ChatScreen, type ChatAccount } from "@/components/chat/chat-screen";
import { IconChat, IconSpark } from "@/components/icons";

function initialsOf(name: string): string {
  const base = name.replace(/@.*/, "");
  const parts = base.split(/[ ._-]+/).filter(Boolean);
  const a = parts[0]?.[0] ?? "U";
  const b = parts[1]?.[0] ?? "";
  return (a + b).toUpperCase();
}

export default async function ChatPage() {
  const live = hasSupabaseEnv();
  const appUser = live ? await requireUser() : null;

  let account: ChatAccount;
  let permitted: Department[];

  if (appUser) {
    const name = appUser.fullName ?? appUser.email;
    account = {
      name,
      initials: initialsOf(name),
      tint: ROLE_TINT_BY_KEY[appUser.role],
      role: ROLE_LABELS[appUser.role],
    };
    permitted = appUser.permittedDepartments;
  } else {
    account = { name: "Dana Okonkwo", initials: "DO", tint: ROLE_TINT_BY_KEY.admin, role: "Admin" };
    permitted = CHAT_DEPARTMENTS.map((d) => d.key);
  }

  const departments = CHAT_DEPARTMENTS.filter((d) => permitted.includes(d.key));

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%", overflow: "hidden" }}>
      {/* slim app rail */}
      <nav style={{
        width: "var(--rail-w)", flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center",
        padding: "14px 0", gap: 14, borderRight: "1px solid var(--border)", background: "var(--bg)",
      }}>
        <Link href="/" title="Home" style={{
          width: 38, height: 38, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
          background: "var(--accent-grad)", color: "#fff", boxShadow: "0 6px 20px rgba(99,102,241,0.4)", fontWeight: 700,
        }}>R</Link>

        <div style={{
          width: 38, height: 38, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--a3)", background: "rgba(139,92,246,0.14)", border: "1px solid rgba(139,92,246,0.28)",
        }} title="Chat">
          <IconChat size={18} />
        </div>

        <div style={{ flex: 1 }} />

        <Link href="/" title={`${account.name} · ${account.role} — account & sign out on Home`} style={{
          width: 34, height: 34, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 600, color: "#fff", textDecoration: "none",
          background: `linear-gradient(140deg, ${account.tint}, ${account.tint}aa)`,
        }}>{account.initials}</Link>

        {!appUser && (
          <div title="Demo mode (no Supabase keys)" style={{ color: "var(--text-faint)" }}><IconSpark size={16} /></div>
        )}
      </nav>

      <ChatScreen account={account} departments={departments} />
    </div>
  );
}
