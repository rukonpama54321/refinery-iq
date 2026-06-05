# Progress & Resume Notes

> **Last session:** 2026-06-05 · **Next:** add `GEMINI_API_KEY` to `.env`, re-run `npm run ingest` for full hybrid vector search, then verify end-to-end RAG chat. BM25 text search is **live now** (59 chunks indexed).
> Single place to pick up where we left off. (For the locked design, see the SDLC docs + ADRs.)

## Where we are
Planning is **complete and locked**; **development is underway** — scaffold done, **auth scaffold built + committed + pushed**, **chat screen + streaming API built** (design system ported to typed components).

| Area | State |
|---|---|
| Brainstorm / PRD / Design / Architecture / Database | 🔒 Locked v1.1 (`docs/00`–`04`) |
| LLM governance | ✅ drafted (`docs/llm-governance.md`) |
| ADRs | 0001 (arch), 0002 (3 tiers/6 depts), 0003 (real-doc corpus), 0004 (Groq+Gemini, no Anthropic), 0005 (Next 16) |
| App scaffold | ✅ Next 16.2.7, `npm run build` passes |
| Auth scaffold | ✅ built + committed + pushed (`28d7c1d`); gate verified live; **DB migration not yet applied**, email not wired |
| Design system port | ✅ icons + primitives ported to typed `components/` (`icons.tsx`, `ui.tsx`) |
| Chat screen | ✅ streaming live with real Groq (`GROQ_API_KEY` set + verified); RAG-augmented when ES is up |
| RAG pipeline | ✅ **59 chunks live in ES** (11 HCU + 48 HR v1/v2); BM25 search active; add `GEMINI_API_KEY` for full hybrid kNN |

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

## What was built THIS session — Chat screen + streaming (committed/pushed)
Auth scaffold committed (`28d7c1d`) and pushed to `origin/main`. Then built the chat phase (Resume plan steps 3–4):
- **Design system port (step 3):** `components/icons.tsx` (typed icon set + `NamedIcon`/`ICONMAP`) and `components/ui.tsx` (typed primitives: `RoleBadge`, `StatusChip`, `Avatar`, `Citation`, `ModelBadge`, `PanelHead`, `GlowButton`, `renderRich`) — ported from `UI/refineiq/{icons,ui}.jsx`.
- **Chat demo data:** `lib/chat/demo.ts` — `CHAT_DEPARTMENTS` (mirrors rbac), `SUGGESTIONS`, `SAMPLE_THREAD`, keyword-matched canned answers + `matchAnswer()` (public-safe "Northgate Refining" content).
- **Streaming API:** `app/api/chat/route.ts` — POST streams plain UTF-8 text. **With `GROQ_API_KEY`:** real `streamText` via `@ai-sdk/groq` (Llama 3.3 70B). **Without keys:** streams a keyword-matched canned answer. Answer metadata (model + citations) is sent up-front in a base64 `x-chat-meta` header the client reads before consuming the body.
- **Chat UI:** `components/chat/chat-screen.tsx` (client) — ported `screen_chat.jsx`, reads the fetch stream live (thinking skeleton → glimmer/cursor → sources + model footer), AbortController stop button, department selector limited to the user's `permittedDepartments`.
- **Page + nav:** `app/chat/page.tsx` (gated server page; demo Admin account pre-keys, real `requireUser()` once keyed) with a slim app rail; `app/page.tsx` now has an "Open chat" link.
- **Verified:** `tsc --noEmit` clean, `next build` passes (`/chat` + `/api/chat` registered), dev server: `/login` 200, `/chat` + `/api/chat` correctly gated → `/login` when unauthenticated. End-to-end chat streaming still needs an authenticated session (blocked on the same migration step below).

## ⚠️ Open items
1. ✅ **Next.js bumped** 15.1.6 → **16.2.7** (clears critical CVE-2025-66478); `npm run build` passes. ADR-0005.
2. ⏳ **`npm audit`:** critical resolved; **9 moderate/low remain**, all transitive via the Vercel AI SDK (`@ai-sdk/*` → `ai`) + one `postcss` advisory inside Next. Fixing the AI-SDK ones needs `ai` v4 → v6 (breaking) — **decision: stay on v4 for now** (ADR-0004 unchanged), revisit before shipping. Don't run `npm audit fix --force` (it would downgrade Next / jump the AI SDK).
3. ✅ Local **`.env`** created (git-ignored). Supabase URL + **publishable** key wired and verified (auth endpoint 200). Secret key present locally.

## Finish auth — ✅ DONE (provisioned via Management API, 2026-06-05)
Provisioned programmatically with a Supabase **personal access token** (`sbp_…`) + the secret key (admin API). The earlier legacy-JWT 403 is **resolved** — admin + REST + Management APIs all return 200 now.
1. ✅ **Migration applied** — `0001_auth_init.sql` run via Management API `database/query` (enums, departments ×6, app_users, RLS, is_admin()).
2. ✅ **First admin provisioned** — `auth.users` created (auto-confirmed) for `rupamborah54321@gmail.com`; `app_users` row upserted (`role=admin`, `home_dept=operations`, active).
3. ✅ **Auth URLs configured** — `site_url=http://localhost:3000`, redirect allowlist includes `/auth/confirm`.
4. ✅ **End-to-end login verified** — magic link (token_hash flow) → `/auth/confirm` 307 → `/chat` 200 as authenticated admin. (Used `verifyOtp`; PKCE `?code=` path needs a browser code-verifier, so token_hash is the right flow for admin-generated links.)
5. ⏳ **Email delivery (Resend)** — still optional: add `RESEND_API_KEY` + `EMAIL_FROM` + Resend SMTP if you want the in-app "Send sign-in link" form to actually email links. Until then, generate links via admin API / dashboard.
6. ⚠️ **ROTATE NOW** — the `sb_secret_` key **and** the `sbp_` personal access token were both shared in chat; rotate both (Supabase → Settings → API keys, and account → Access Tokens) before anything goes public.

> Login error UX: `app/(auth)/login/actions.ts` now maps raw Supabase errors (e.g. "Signups not allowed for otp") to friendly copy via `friendlyAuthError()`.

## Resume plan (build order)
1. ✅ Foundation (done) → verify `npm run dev` renders the landing at http://localhost:3000.
2. ✅ **Auth:** Supabase client + magic-link/OTP; `app_users` + tiers/departments. Scaffold built, **migration applied, admin provisioned, e2e login verified** (see "Finish auth"). Optional Resend email pending.
3. ✅ **Design system port:** `UI/refineiq/{ui,icons}.jsx` → typed `components/ui.tsx` + `components/icons.tsx`. (More screens reuse these next.)
4. ✅ **Chat screen:** streaming with real Groq (GROQ_API_KEY verified). RAG retrieval wired — degrades gracefully when ES is offline.
5. ✅ **RAG:** Docker + ES running; all 3 documents ingested (59 chunks); BM25 retrieval live. Add `GEMINI_API_KEY` + `npm run ingest` for full hybrid kNN.
6. **Worker:** BullMQ ingestion pipeline (parse → OCR(Gemini) → PII → embed → index); add `worker` service to compose.
7. **Versioning demo:** ingest HR v1 then v2; "current" answers reflect v2.
8. Dashboard, Admin (users/docs/depts/logs/settings), **bug-reporting** (FR-BUG), governance enforcement (routing/PII/audit), CI/CD.

## RAG phase — ✅ COMPLETE (all documents ingested, BM25 live)
- **`infra/supabase/migrations/0002_rag_schema.sql`** — new enums (`sensitivity_t`, `doc_status_t`, `msg_role_t`, `model_t`), `documents`, `document_versions`, `conversations`, `messages`, `citations`, `token_usage`, `audit_events` + RLS. **Applied to Supabase.**
- **`lib/elasticsearch/client.ts`** — singleton ES client; `INDEX_NAME = chunks_local`.
- **`lib/elasticsearch/index.ts`** — `ensureIndex()` (BM25 + 768-dim `dense_vector` kNN mapping), `indexChunks()`, `markSuperseded()`.
- **`lib/rag/chunk.ts`** — structure-aware chunker (~600 tokens, ~100-token overlap, location labels from page / headings).
- **`lib/rag/embed.ts`** — `embedTexts()` + `embedQuery()` via `@ai-sdk/google` `embedMany`; batched (20/req) with rate-limit delay.
- **`lib/rag/retrieve.ts`** — hybrid RRF retrieval (BM25 + kNN), RBAC filter before ranking, BM25-only fallback when `GEMINI_API_KEY` absent, `isEsAvailable()` ping.
- **`scripts/corpus-config.mjs`** — NEW: maps each document filename → doc_id, title, department, sensitivity, version_no, is_latest.
- **`scripts/ingest-all.mjs`** — NEW: general multi-document ingest (PDF + DOCX). Handles HR v1→v2 versioning. `--file <name>` for single-doc, `--dry-run` for chunk preview. Omits `embedding` field when no Gemini key (avoids ES zero-vector rejection). Idempotent.
- **`scripts/ingest-hcu.mjs`** — now a shim to `ingest-all.mjs --file HCU_Unit_Demo_Manual.pdf`.
- **`app/api/chat/route.ts`** — now RAG-augmented: resolves session → permitted depts → retrieves top-5 chunks → injects as context into Groq system prompt → streams answer with real citations in `x-chat-meta`.
- **Indexed (2026-06-05):** 59 chunks total — HCU (11, process_engineering, is_current), HR v1 (23, hr, NOT is_current), HR v2 (25, hr, is_current). BM25 text search active. kNN vector search activates after adding `GEMINI_API_KEY` + re-running `npm run ingest`.

## API keys (local `.env`, never commit)
- ✅ **Supabase:** wired + verified + migration applied.
- ✅ **Groq:** `GROQ_API_KEY` set + verified (Llama 3.3 70B streaming live).
- ⏳ **Gemini:** `GEMINI_API_KEY` needed for vector embeddings (free at aistudio.google.com/apikey). Without it: BM25 text search still works.
- ⏳ **Resend:** `RESEND_API_KEY` + `EMAIL_FROM` — optional, for emailed magic links.
- ✅ **Elasticsearch + Redis** — Docker Compose. Need Docker Desktop running.

## How to run (current state)
```powershell
npm install            # if node_modules missing
npm run dev            # http://localhost:3000  (landing renders)
docker compose -f infra/docker-compose.yml up -d   # Elasticsearch + Redis
```

## Repo
Public: https://github.com/rukonpama54321/refinery-iq · tags `architecture-v1`, `architecture-v1.1`.
**Never commit** `docs/policies/*` raw docs or `.env` (both git-ignored).
