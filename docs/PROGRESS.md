# Progress & Resume Notes

> **Last session:** 2026-06-04 · **Next:** resume development of the Next.js app.
> Single place to pick up where we left off. (For the locked design, see the SDLC docs + ADRs.)

## Where we are
Planning is **complete and locked**; **development has just started** (Next.js scaffold).

| Area | State |
|---|---|
| Brainstorm / PRD / Design / Architecture / Database | 🔒 Locked v1.1 (`docs/00`–`04`) |
| LLM governance | ✅ drafted (`docs/llm-governance.md`) |
| ADRs | 0001 (arch), 0002 (3 tiers/6 depts), 0003 (real-doc corpus), 0004 (Groq+Gemini, no Anthropic) |
| App scaffold | ⏳ in progress (this session) |

## Key decisions (so they're not re-litigated)
- **Stack:** Next.js 15 (App Router, TS) + Node worker · Vercel AI SDK · Supabase (Postgres/Auth/Storage) · Elasticsearch (hybrid BM25+vector) · Redis (cache/queue) · Docker · Cloudflare Tunnel.
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

## ⚠️ Open items to do FIRST next session
1. **Bump Next.js** — `15.1.6` has a security CVE (CVE-2025-66478). Run `npm install next@latest`, then **verify the build**: `npm run build`. (Build was not yet verified this session.)
2. Address `npm audit` (9 vulns, 1 critical — likely resolved by the Next bump).
3. Create a local **`.env`** (copy `.env.example`) with real keys before any live wiring.

## Resume plan (build order)
1. ✅ Foundation (done) → verify `npm run dev` renders the landing at http://localhost:3000.
2. **Auth:** Supabase client + Resend magic-link/OTP; `app_users` + tiers/departments.
3. **Design system port:** `UI/refineiq/ui.jsx` primitives → `components/` (typed React); icons.
4. **Chat screen:** port `screen_chat.jsx`; streaming via Vercel AI SDK (Groq); thinking-skeleton glimmer.
5. **RAG:** ingest HCU manual (Gemini embeddings → Elasticsearch); hybrid retrieval + citations.
6. **Worker:** BullMQ ingestion pipeline (parse → OCR(Gemini) → PII → embed → index); add `worker` service to compose.
7. **Versioning demo:** ingest HR v1 then v2; "current" answers reflect v2.
8. Dashboard, Admin (users/docs/depts/logs/settings), **bug-reporting** (FR-BUG), governance enforcement (routing/PII/audit), CI/CD.

## API keys still needed (put in local `.env`, never commit)
`GROQ_API_KEY` (free) · `GEMINI_API_KEY` (free) · `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` (free) · `RESEND_API_KEY` + `EMAIL_FROM` (free). Elasticsearch + Redis need none (Docker).

## How to run (current state)
```powershell
npm install            # if node_modules missing
npm run dev            # http://localhost:3000  (landing renders)
docker compose -f infra/docker-compose.yml up -d   # Elasticsearch + Redis
```

## Repo
Public: https://github.com/rukonpama54321/refinery-iq · tags `architecture-v1`, `architecture-v1.1`.
**Never commit** `docs/policies/*` raw docs or `.env` (both git-ignored).
