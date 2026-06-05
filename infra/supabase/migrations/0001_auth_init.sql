-- 0001_auth_init.sql — Auth phase schema (ADR-0002 roles/departments, ADR-0005 stack).
-- Scope: enums + departments + app_users (1:1 with auth.users) + cross-dept grants
--        + RLS + seed. Documents/conversations/etc. arrive in later migrations.
--
-- NOTE vs docs/04-database.md: the doc's `app_users.role ... default 'operator'`
-- is a defect — 'operator' is not a value of role_t ('end_user','manager','admin').
-- We default to 'end_user' (least privilege). Flagged for a doc fix.

-- ---------- Enums (auth-relevant subset of §"Enum types") ----------
create type role_t       as enum ('end_user','manager','admin');           -- 3 access tiers (ADR-0002)
create type department_t as enum ('process_engineering','maintenance_reliability','hse','operations','lab_quality','hr');

-- ---------- Departments ----------
create table departments (
  id          uuid primary key default gen_random_uuid(),
  key         department_t unique not null,
  name        text not null,
  created_at  timestamptz not null default now()
);

-- ---------- App users (profile + role), 1:1 with auth.users ----------
create table app_users (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  role          role_t not null default 'end_user',
  home_dept     department_t not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  deleted_at    timestamptz
);
create index app_users_home_dept_idx on app_users (home_dept);
create index app_users_role_idx on app_users (role);

-- ---------- Extra cross-department read grants (end users) ----------
create table user_department_access (
  user_id     uuid references app_users(id) on delete cascade,
  department  department_t not null,
  primary key (user_id, department)
);

-- ---------- updated_at maintenance ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger app_users_set_updated_at
  before update on app_users
  for each row execute function set_updated_at();

-- ---------- Admin check (SECURITY DEFINER avoids RLS recursion) ----------
-- Querying app_users inside app_users' own RLS policy would recurse; this
-- function runs with definer rights and bypasses RLS to resolve the role.
create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from app_users
    where id = auth.uid() and role = 'admin' and is_active and deleted_at is null
  );
$$;

-- ---------- Row-Level Security ----------
alter table departments enable row level security;
alter table app_users enable row level security;
alter table user_department_access enable row level security;

-- Departments: readable by any authenticated user; writable by admins only.
create policy departments_read on departments
  for select to authenticated using (true);
create policy departments_admin_write on departments
  for all to authenticated using (is_admin()) with check (is_admin());

-- app_users: a user reads their own row; admins read/manage all.
create policy app_users_self_read on app_users
  for select to authenticated using (id = auth.uid() or is_admin());
create policy app_users_admin_write on app_users
  for all to authenticated using (is_admin()) with check (is_admin());

-- grants: a user reads their own; admins manage all.
create policy uda_self_read on user_department_access
  for select to authenticated using (user_id = auth.uid() or is_admin());
create policy uda_admin_write on user_department_access
  for all to authenticated using (is_admin()) with check (is_admin());

-- ---------- Seed: the 6 departments (ADR-0002) ----------
insert into departments (key, name) values
  ('process_engineering',      'Process Engineering'),
  ('maintenance_reliability',  'Maintenance & Reliability'),
  ('hse',                      'Health, Safety & Environment'),
  ('operations',              'Operations'),
  ('lab_quality',             'Lab & Quality'),
  ('hr',                      'Human Resources')
on conflict (key) do nothing;

-- ---------- Bootstrap (run manually after the first user signs in) ----------
-- Provision the first admin. Replace the email, then run once:
--   insert into app_users (id, email, full_name, role, home_dept)
--   select id, email, 'Owner', 'admin', 'operations'
--   from auth.users where email = 'you@example.com'
--   on conflict (id) do update set role = 'admin', is_active = true;
