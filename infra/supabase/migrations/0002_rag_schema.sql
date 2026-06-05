-- 0002_rag_schema.sql — RAG phase schema (Architecture §7, Database §3/4/5)
-- Adds: new enums, documents + document_versions tables, conversations +
-- messages + citations, token_usage, audit_events.
-- Prereq: 0001_auth_init.sql (auth enums + app_users).

-- ---------- New enums ----------
create type sensitivity_t as enum ('public','internal','confidential');
create type doc_status_t  as enum ('queued','processing','indexed','failed');
create type msg_role_t    as enum ('user','assistant','system','tool');
create type model_t       as enum ('groq','gemini');

-- ---------- Documents (logical) ----------
create table documents (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  department          department_t not null,
  sensitivity         sensitivity_t not null default 'internal',
  uploaded_by         uuid references app_users(id),
  current_version_id  uuid,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  deleted_at          timestamptz
);
create index documents_dept_sens_idx on documents (department, sensitivity) where deleted_at is null;

create trigger documents_set_updated_at
  before update on documents
  for each row execute function set_updated_at();

-- ---------- Document versions (physical files) ----------
create table document_versions (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references documents(id) on delete cascade,
  version_no    integer not null,
  storage_path  text not null,
  mime_type     text not null default 'application/pdf',
  byte_size     bigint,
  ocr_used      boolean not null default false,
  pii_flags     jsonb not null default '[]',
  status        doc_status_t not null default 'queued',
  notes         text,
  created_by    uuid references app_users(id),
  created_at    timestamptz not null default now(),
  unique (document_id, version_no)
);
create index doc_versions_status_idx on document_versions (document_id, status);

-- Wire circular FK now that both tables exist.
alter table documents
  add constraint fk_current_version
  foreign key (current_version_id) references document_versions(id);

-- ---------- Conversations ----------
create table conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references app_users(id) on delete cascade,
  title       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index convos_user_idx on conversations (user_id, created_at);

create trigger conversations_set_updated_at
  before update on conversations
  for each row execute function set_updated_at();

-- ---------- Messages ----------
create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role            msg_role_t not null,
  content         text not null,
  agent           text,
  model           model_t,
  routing_reason  text,
  cache_hit       boolean,
  sentiment       numeric(4,3),
  created_at      timestamptz not null default now()
);
create index messages_convo_idx on messages (conversation_id, created_at);

-- ---------- Citations ----------
create table citations (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references messages(id) on delete cascade,
  version_id  uuid not null references document_versions(id),
  chunk_id    text not null,
  location    text,
  snippet     text,
  rank        integer,
  created_at  timestamptz not null default now()
);

-- ---------- Token usage ----------
create table token_usage (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references app_users(id),
  message_id     uuid references messages(id),
  department     department_t,
  model          model_t not null,
  input_tokens   integer not null default 0,
  output_tokens  integer not null default 0,
  latency_ms     integer,
  cache_hit      boolean not null default false,
  est_cost_usd   numeric(12,6) not null default 0,
  created_at     timestamptz not null default now()
);
create index token_usage_dept_idx on token_usage (department, created_at);
create index token_usage_user_idx on token_usage (user_id, created_at);

-- ---------- Audit events ----------
create table audit_events (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references app_users(id),
  action      text not null,
  target_type text,
  target_id   text,
  metadata    jsonb not null default '{}',
  created_at  timestamptz not null default now()
);
create index audit_actor_idx on audit_events (actor_id, created_at);

-- ---------- RLS ----------
alter table documents enable row level security;
alter table document_versions enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table citations enable row level security;
alter table token_usage enable row level security;
alter table audit_events enable row level security;

-- Documents: readable by permitted departments; admins see all.
create policy doc_read on documents for select to authenticated using (
  deleted_at is null and (
    is_admin()
    or department = (select home_dept from app_users where id = auth.uid())
    or department in (select department from user_department_access where user_id = auth.uid())
    or exists (select 1 from app_users where id = auth.uid() and role = 'manager')
  )
);
create policy doc_write on documents for all to authenticated
  using (is_admin()) with check (is_admin());

create policy doc_ver_read on document_versions for select to authenticated using (
  exists (
    select 1 from documents d
    where d.id = document_id and d.deleted_at is null and (
      is_admin()
      or d.department = (select home_dept from app_users where id = auth.uid())
      or d.department in (select department from user_department_access where user_id = auth.uid())
      or exists (select 1 from app_users where id = auth.uid() and role = 'manager')
    )
  )
);
create policy doc_ver_write on document_versions for all to authenticated
  using (is_admin()) with check (is_admin());

-- Conversations: owner or admin.
create policy convo_read on conversations for select to authenticated
  using (user_id = auth.uid() or is_admin());
create policy convo_write on conversations for all to authenticated
  using (user_id = auth.uid() or is_admin()) with check (user_id = auth.uid() or is_admin());

-- Messages: via conversation ownership.
create policy msg_read on messages for select to authenticated using (
  exists (select 1 from conversations c where c.id = conversation_id and (c.user_id = auth.uid() or is_admin()))
);
create policy msg_write on messages for insert to authenticated with check (
  exists (select 1 from conversations c where c.id = conversation_id and c.user_id = auth.uid())
);

-- Citations: same as messages.
create policy cit_read on citations for select to authenticated using (
  exists (
    select 1 from messages m
    join conversations c on c.id = m.conversation_id
    where m.id = message_id and (c.user_id = auth.uid() or is_admin())
  )
);

-- Token usage + audit: admins only.
create policy tu_read on token_usage for select to authenticated using (is_admin());
create policy audit_read on audit_events for select to authenticated using (is_admin());

-- ---------- Seed: HCU document record (status=queued; ingest script updates it) ----------
-- Inserted here so the FK exists when the ingest script creates the first version.
-- The ingest script sets current_version_id once it creates the version row.
insert into documents (id, title, department, sensitivity, uploaded_by)
values (
  'a1b2c3d4-0001-0001-0001-000000000001',
  'Hydrocracker Unit (HCU) — Unit Demo Manual',
  'process_engineering',
  'internal',
  null  -- seed document; not user-uploaded
) on conflict do nothing;
