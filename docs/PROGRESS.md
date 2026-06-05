# Progress & Resume Notes

> **Last session:** 2026-06-05 · **Next:** apply the auth DB migration + wire Resend, then verify login end-to-end. See "Finish auth" below.
> Single place to pick up where we left off. (For the locked design, see the SDLC docs + ADRs.)

## Where we are
Planning is **complete and locked**; **development is underway** — scaffold done, **auth scaffold built** (uncommitted, pending end-to-end verification).

| Area | State |
|---|---|
| Brainstorm / PRD / Design / Architecture / Database | 🔒 Locked v1.1 (`docs/00`–`04`) |
| LLM governance | ✅ drafted (`docs/llm-governance.md`) |
| ADRs | 0001 (arch), 0002 (3 tiers/6 depts), 0003 (real-doc corpus), 0004 (Groq+Gemini, no Anthropic), 0005 (Next 16) |
| App scaffold | ✅ Next 16.2.7, `npm run build` passes |
| Auth scaffold | ⏳ built + builds clean; gate verified live; **DB migration not yet applied**, email not wired (uncommitted) |

## Key decisions (so they're not re-litigated)
- **Stack:** Next.js 16 (App Router, TS; bumped from 15 per ADR-0005) + Node worker · Vercel AI SDK · Supabase (Postgres/Auth/Storage) · Elasticsearch (hybrid BM25+vector) · Redis (cache/queue) · Docker · Cloudflare Tunnel.
- **LLMs (fully free, ADR-0004):** **Groq** `llama-3.3-70b-versatile` (primary chat) + **Gemini** (chat alt + `text-embedding-004` embeddings + OCR). **No local LLM, no Anthropic** (Claude Pro ≠ API access).
- **RBAC:** 3 tiers (Admin/Manager/End User) × 6 departments (process_engineering, maintenance_reliability, hse, operations, lab_quality, hr).
- **Corpus (ADR-0003):** real-document-first from `docs/policies/` (git-ignored, local-only): **HCU_Unit_Demo_Manual.pdf** (hydrocracker, demo-safe) + **NRL HR Policy Manual v1 & v2** (INTERNAL/confidential; v1→v2 = the version-control demo). Public artifacts use the generic name **"Northgate Refining"**; real NRL content stays local.

## What was built this session (committed)
- `package.json`, `package-lock.json`, `next.config.mjs`, `tsconfig.json`, `.dockerignore`
- `app/globals.css` — design system ported from `UI/` (tokens, glimmer animations, glass)
- `app/layout.tsx` — Geist fonts + metadata
- `app/page.tsx` — dev-scaffold landing (renders the design system)
- `infra/Dockerfile` (web standalone) + `infra/docker-compose.yml` (web + Elasticsearch + Redis; **worker added later**)
- `.env.example` updated to Groq + Gemini (Anthropic optional/commented)
- `npm install` done (116 pkgs).

## What was built THIS session — Auth scaffold (⏳ uncommitted)
Security checkpoint **committed** as `33e58db` (Next 16 bump + ADR-0005). The auth scaffold below is written, typechecks, builds, and the gate is verified live — **not yet committed** (waiting on end-to-end login).
- **Login flow:** `app/(auth)/login/page.tsx` + `actions.ts` (passwordless `signInWithOtp`, `shouldCreateUser:false`), `app/auth/confirm/route.ts` (token_hash + PKCE), `app/auth/signout/route.ts`, `components/sign-out-button.tsx`.
- **Auth gate:** `proxy.ts` (Next 16 renamed `middleware`→`proxy`) + `lib/supabase/middleware.ts` — refreshes session, redirects unauthenticated → `/login?next=…`; **degrades gracefully when keys are absent** (so dev runs pre-keys).
- **Supabase clients:** `lib/supabase/{server,client}.ts` via `@supabase/ssr` (cookie sessions).
- **RBAC:** `lib/auth/rbac.ts` (3 tiers × 6 depts, labels, `permittedDepartments`) + `lib/auth/user.ts` (`getAppUser`, `requireUser`).
- **DB migration:** `infra/supabase/migrations/0001_auth_init.sql` — enums (`role_t`, `department_t`), `departments` (seeded ×6), `app_users` (1:1 with `auth.users`), `user_department_access`, RLS + `is_admin()` SECURITY DEFINER (avoids RLS recursion), `updated_at` trigger.
- **Env:** `lib/env.ts` (zod, request-time validation), `.env.example` updated to `NEXT_PUBLIC_SUPABASE_*`.
- **Deps added:** `@supabase/ssr@0.10.3`. **Home/pending:** `app/page.tsx` now gates + greets; `app/pending/page.tsx` for authed-but-unprovisioned.
- **Pages verified live (real publishable key):** `/` → 307 `/login?next=/`, `/login` → 200, `/pending` → 307 `/login`.

> ⚠️ **DB doc bug:** `docs/04-database.md:85` sets `app_users.role` default to `'operator'`, which is **not** a `role_t` value — that DDL won't run. Migration uses `default 'end_user'`. Needs a doc fix (typo, no ADR).

## ⚠️ Open items
1. ✅ **Next.js bumped** 15.1.6 → **16.2.7** (clears critical CVE-2025-66478); `npm run build` passes. ADR-0005.
2. ⏳ **`npm audit`:** critical resolved; **9 moderate/low remain**, all transitive via the Vercel AI SDK (`@ai-sdk/*` → `ai`) + one `postcss` advisory inside Next. Fixing the AI-SDK ones needs `ai` v4 → v6 (breaking) — **decision: stay on v4 for now** (ADR-0004 unchanged), revisit before shipping. Don't run `npm audit fix --force` (it would downgrade Next / jump the AI SDK).
3. ✅ Local **`.env`** created (git-ignored). Supabase URL + **publishable** key wired and verified (auth endpoint 200). Secret key present locally.

## Finish auth (do these next)
1. **Apply the migration** — open Supabase → **SQL Editor**, paste `infra/supabase/migrations/0001_auth_init.sql`, Run. (DDL can't go through the API keys.)
2. **Create the first user + bootstrap admin** — Supabase → Auth → Users → *Add user* (auto-confirm), then run the bootstrap `insert` at the bottom of the migration (set role `admin`).
3. **Email delivery** — add `RESEND_API_KEY` + `EMAIL_FROM`, and set Resend as SMTP in Supabase → Auth → SMTP (the default sender only mails project members and is rate-limited).
4. **End-to-end login test**, then **commit** the auth scaffold.
5. ⚠️ **Rotate the Supabase secret key** — it was pasted in chat; treat as compromised before anything goes public.
   - **Heads-up:** the project's Data API currently rejects the new `sb_secret_` key (`PGRST301: Expected 3 parts in JWT`) and admin API returns 403 — legacy-JWT mode. Doesn't block app login (PostgREST uses the user's session JWT at runtime), but server-side admin-via-REST won't work until the new key system is enabled.

## Resume plan (build order)
1. ✅ Foundation (done) → verify `npm run dev` renders the landing at http://localhost:3000.
2. ⏳ **Auth:** Supabase client + magic-link/OTP; `app_users` + tiers/departments. **Scaffold built + gate verified live**; remaining = apply migration, wire Resend, e2e test (see "Finish auth").
3. **Design system port:** `UI/refineiq/ui.jsx` primitives → `components/` (typed React); icons.
4. **Chat screen:** port `screen_chat.jsx`; streaming via Vercel AI SDK (Groq); thinking-skeleton glimmer.
5. **RAG:** ingest HCU manual (Gemini embeddings → Elasticsearch); hybrid retrieval + citations.
6. **Worker:** BullMQ ingestion pipeline (parse → OCR(Gemini) → PII → embed → index); add `worker` service to compose.
7. **Versioning demo:** ingest HR v1 then v2; "current" answers reflect v2.
8. Dashboard, Admin (users/docs/depts/logs/settings), **bug-reporting** (FR-BUG), governance enforcement (routing/PII/audit), CI/CD.

## API keys (local `.env`, never commit)
- ✅ **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable), `SUPABASE_SERVICE_ROLE_KEY` (secret — **rotate**). Wired + verified.
- ⏳ **Still needed:** `RESEND_API_KEY` + `EMAIL_FROM` (for magic-link email), `GROQ_API_KEY`, `GEMINI_API_KEY` (chat/RAG phases). All free tiers. Elasticsearch + Redis need none (Docker).

## How to run (current state)
```powershell
npm install            # if node_modules missing
npm run dev            # http://localhost:3000  (landing renders)
docker compose -f infra/docker-compose.yml up -d   # Elasticsearch + Redis
```

## Repo
Public: https://github.com/rukonpama54321/refinery-iq · tags `architecture-v1`, `architecture-v1.1`.
**Never commit** `docs/policies/*` raw docs or `.env` (both git-ignored).
