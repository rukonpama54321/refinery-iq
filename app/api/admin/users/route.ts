// GET  /api/admin/users         — list all app_users
// POST /api/admin/users         — provision a new user { email, role, department, display_name }
// PATCH /api/admin/users        — update role/departments { id, role?, departments? }
// Admin only.
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as sbAdmin } from "@supabase/supabase-js";

function admin() {
  return sbAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized", status: 401, supabase };
  const { data: appUser } = await supabase.from("app_users").select("role").eq("id", user.id).single();
  if (appUser?.role !== "admin") return { error: "Forbidden", status: 403, supabase };
  return { user, supabase, ok: true };
}

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const { data, error } = await auth.supabase
    .from("app_users")
    .select(`
      id, email, full_name, role, home_dept, is_active, created_at,
      user_department_access(department)
    `)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const { email, role = "end_user", department = "operations", display_name } = body as {
    email?: string; role?: string; department?: string; display_name?: string;
  };
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const sb = admin();

  // Create auth user (auto-confirmed).
  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { display_name: display_name ?? email.split("@")[0] },
  });
  if (createErr) return NextResponse.json({ error: createErr.message }, { status: 400 });

  const uid = created.user.id;

  // Insert app_users row.
  await sb.from("app_users").upsert({
    id: uid, email, full_name: display_name ?? email.split("@")[0],
    role, home_dept: department, is_active: true,
  });

  // Insert department access.
  await sb.from("user_department_access").insert({ user_id: uid, department });

  return NextResponse.json({ id: uid, email }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const body = await req.json();
  const { id, role, departments, is_active } = body as {
    id?: string; role?: string; departments?: string[]; is_active?: boolean;
  };
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const sb = admin();

  // Update app_users.
  const updates: Record<string, unknown> = {};
  if (role       !== undefined) updates.role      = role;
  if (is_active  !== undefined) updates.is_active = is_active;
  if (Object.keys(updates).length) {
    await sb.from("app_users").update(updates).eq("id", id);
  }

  // Replace department access if provided.
  if (departments !== undefined) {
    await sb.from("user_department_access").delete().eq("user_id", id);
    if (departments.length) {
      await sb.from("user_department_access").insert(
        departments.map((d) => ({ user_id: id, department: d }))
      );
    }
  }

  return NextResponse.json({ ok: true });
}
