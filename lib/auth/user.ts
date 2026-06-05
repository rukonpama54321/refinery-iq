// Resolve the authenticated user + their app profile (role/department).
// A logged-in auth.users row without a matching app_users row is "pending"
// (awaiting admin assignment of role + home department).
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import {
  type Department,
  type Role,
  permittedDepartments,
} from "@/lib/auth/rbac";

export interface AppUser {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  homeDept: Department;
  isActive: boolean;
  /** Departments this user may read from (role + grants resolved). */
  permittedDepartments: Department[];
}

/** The verified auth user, or null. Uses getUser() (revalidates the token). */
export async function getAuthUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** The app profile for the current user, or null if none/pending/inactive. */
export async function getAppUser(): Promise<AppUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("app_users")
    .select("id, email, full_name, role, home_dept, is_active")
    .eq("id", user.id)
    .is("deleted_at", null)
    .single();

  if (!profile || !profile.is_active) return null;

  const { data: grants } = await supabase
    .from("user_department_access")
    .select("department")
    .eq("user_id", user.id);

  const extra = (grants ?? []).map((g) => g.department as Department);

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.full_name,
    role: profile.role as Role,
    homeDept: profile.home_dept as Department,
    isActive: profile.is_active,
    permittedDepartments: permittedDepartments(
      profile.role as Role,
      profile.home_dept as Department,
      extra,
    ),
  };
}

/**
 * Guard for protected pages: returns the AppUser or redirects.
 * - not authenticated → /login
 * - authenticated but no active profile → /pending
 */
export async function requireUser(): Promise<AppUser> {
  const authUser = await getAuthUser();
  if (!authUser) redirect("/login");

  const appUser = await getAppUser();
  if (!appUser) redirect("/pending");

  return appUser;
}
