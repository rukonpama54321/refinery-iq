# NumaligarhRefineryIQ

> AI-first, role-aware enterprise assistant for an oil refinery — a single chat-led front door to operations, engineering documents, HR, safety/compliance, and analytics.

**Status:** 🟡 SDLC in progress — currently in the Brainstorm / Design phase. This is a **tech-capability demo** (single-tenant), built almost entirely on free / open-source tooling.

---

## What it demonstrates

A coherent product that exercises a broad set of AI-platform capabilities: multi-agent orchestration, Retrieval-Augmented Generation with citations, hybrid search, OCR, a multi-LLM harness (local + 3rd-party), token accounting & caching, RBAC across departments, file versioning, PII handling, sentiment analysis, structured logging/audit, an in-app bug-reporting system, multi-environment deploys, and CI/CD.

## Tech stack (locked)

| Layer | Choice |
|---|---|
| App | **Next.js (App Router) + Node.js** |
| LLM harness | **Vercel AI SDK** (one interface across providers) |
| Chat LLMs | **Groq** (Llama 3.3 70B) primary + **Gemini** (alternate) — fully free, no Anthropic |
| Embeddings & OCR | **Gemini** — `text-embedding-004` embeddings (768-dim) + vision OCR |
| System-of-record | **Supabase** (Postgres) — auth, storage, app data |
| Search / vectors | **Elasticsearch** (hybrid BM25 + dense-vector kNN) |
| Cache / queue | **Redis** (LLM cache + BullMQ worker queue) |
| Auth / email | **Supabase Auth** + **Resend** (email magic-link / OTP) |
| Containers | **Docker Compose** |
| Frontend host | **Cloudflare** (Tunnel/Pages) |
| Environments | **local · test · prod** |

> Tenancy: **single-tenant**, with multi-department RBAC inside it.

## Repo structure

```
docs/        SDLC artifacts (brainstorm, PRD, design, architecture, database, governance)
infra/       Docker Compose, Dockerfiles, environment overlays
app/         Next.js application (added in build phase)
worker/      Background worker: ingest → OCR → embed → index (added in build phase)
```

## SDLC roadmap

1. Brainstorm & vision — `docs/00-brainstorm.md`
2. PRD — `docs/01-prd.md`
3. UX/UI & design system — `docs/02-design.md`
4. Software architecture — `docs/03-architecture.md`
5. Database design (multi-DB) — `docs/04-database.md`
6. LLM governance & policy rules — `docs/llm-governance.md`
7. Repo, CI/CD & environments
8. Bug-reporting system

## License

MIT — see [LICENSE](LICENSE).
