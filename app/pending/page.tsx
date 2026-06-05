// Authenticated, but no active app_users profile yet — awaiting admin assignment
// of a role + home department. requireUser() redirects here from protected pages.
import { redirect } from "next/navigation";
import { hasSupabaseEnv } from "@/lib/env";
import { getAuthUser, getAppUser } from "@/lib/auth/user";
import { SignOutButton } from "@/components/sign-out-button";

// Auth-dependent — never prerender (reads cookies + Supabase env at request time).
export const dynamic = "force-dynamic";

export default async function PendingPage() {
  if (!hasSupabaseEnv()) redirect("/");

  const authUser = await getAuthUser();
  if (!authUser) redirect("/login");

  // Already provisioned? Go home.
  const appUser = await getAppUser();
  if (appUser) redirect("/");

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div className="glass fade-rise" style={{ width: "100%", maxWidth: 460, padding: "30px 32px", borderRadius: "var(--r-xl)" }}>
        <div className="shimmer-text" style={{ fontSize: 16, fontWeight: 700, marginBottom: 10 }}>
          Access pending
        </div>
        <p style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 }}>
          You’re signed in as <span style={{ color: "var(--text)" }}>{authUser.email}</span>, but your
          account hasn’t been assigned a role and department yet. An administrator
          needs to grant access before you can use NumaligarhRefineryIQ.
        </p>
        <div style={{ marginTop: 22 }}>
          <SignOutButton />
        </div>
      </div>
    </main>
  );
}
