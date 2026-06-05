// RBAC primitives — mirror the locked DB enums (docs/04-database.md, ADR-0002).
// 3 access tiers × 6 departments. Server-side RBAC (Architecture §4 Guard) is
// the source of truth; these types/helpers keep app + DB in lockstep.

export const ROLES = ["end_user", "manager", "admin"] as const;
export type Role = (typeof ROLES)[number];

export const DEPARTMENTS = [
  "process_engineering",
  "maintenance_reliability",
  "hse",
  "operations",
  "lab_quality",
  "hr",
] as const;
export type Department = (typeof DEPARTMENTS)[number];

/** Human labels for the 6 departments (titles are labels, ADR-0002). */
export const DEPARTMENT_LABELS: Record<Department, string> = {
  process_engineering: "Process Engineering",
  maintenance_reliability: "Maintenance & Reliability",
  hse: "Health, Safety & Environment",
  operations: "Operations",
  lab_quality: "Lab & Quality",
  hr: "Human Resources",
};

export const ROLE_LABELS: Record<Role, string> = {
  end_user: "End User",
  manager: "Manager",
  admin: "Admin",
};

export function isRole(v: unknown): v is Role {
  return typeof v === "string" && (ROLES as readonly string[]).includes(v);
}

export function isDepartment(v: unknown): v is Department {
  return typeof v === "string" && (DEPARTMENTS as readonly string[]).includes(v);
}

/**
 * Departments a user may read from.
 * - admin / manager → all departments (cross-department by role; Architecture §4).
 * - end_user → home department + any explicit cross-department grants.
 */
export function permittedDepartments(
  role: Role,
  homeDept: Department,
  extraGrants: Department[] = [],
): Department[] {
  if (role === "admin" || role === "manager") return [...DEPARTMENTS];
  return Array.from(new Set<Department>([homeDept, ...extraGrants]));
}

export function isAdmin(role: Role): boolean {
  return role === "admin";
}
