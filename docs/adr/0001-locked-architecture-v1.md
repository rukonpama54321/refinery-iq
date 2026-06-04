# ADR-0001 — Locked Architecture v1.0

- **Status:** Accepted (locked) · **Date:** 2026-06-04
- **Supersedes:** —
- **Scope:** Freezes the technical architecture for the RefineryIQ capability demo before development begins.

## Context
RefineryIQ is a single-tenant, AI-first enterprise assistant for an oil refinery, built as a tech-capability demo on free/open-source tooling and a single CPU-only machine. After brainstorming, PRD, architecture, and database design (docs 00/01/03/04), the owner reviewed a plain-language walkthrough of how RAG, the LLMs, and file storage work together and approved freezing these decisions.

## Decision (locked choices)

### Stack
- **App:** Next.js (App Router) + Node.js. **LLM harness:** Vercel AI SDK.
- **Chat LLMs:** Anthropic (Claude) primary + Groq (fast/cheap + fallback). **No local LLM.**
- **Embeddings + OCR:** Gemini — `text-embedding-004` (768-dim) for embeddings, vision for OCR.
- **System-of-record:** Supabase (Postgres + Auth + Storage). **Auth email:** Resend (magic-link/OTP).
- **Search/vectors:** Elasticsearch (hybrid BM25 + dense-vector kNN).
- **Cache/queue:** Redis (LLM response cache + BullMQ worker queue).
- **Containers:** Docker Compose on the demo machine. **Public URL:** Cloudflare Tunnel.
- **Environments:** local · test · prod. **CI/CD:** GitHub Actions.

### How it works (the model)
- **File storage:** original blobs in Supabase Storage; metadata/versions in Postgres.
- **RAG ingest:** upload → (Gemini OCR if scanned) → chunk → (Gemini embeddings) → index chunks in Elasticsearch.
- **RAG query:** question → embed → hybrid retrieve (RBAC-filtered) from Elasticsearch → pass chunks + question to Claude/Groq → cited answer.
- **LLM roles:** Claude/Groq write answers; Gemini only does OCR + embeddings (never chat).

### Key cross-cutting decisions
- **RBAC:** six org roles; retrieval filtered by department/sensitivity **before** any LLM call.
- **Sensitivity routing:** drives PII-redaction strictness + provider trust — confidential → Anthropic only, never Groq (no local-vs-cloud routing since there is no local model).
- **PII:** detected on ingest; redacted before **every** API egress.
- **Caching:** Redis response cache scoped per access-level.
- **Citations:** every substantive answer cites document + version + location.
- **Versioning:** re-upload → new version; retrieval defaults to current; auto re-index.

## Consciously descoped
- **Local LLM (Ollama):** dropped to avoid slow CPU-only inference and ~2 GB RAM overhead. The "Local LLM" capability is intentionally not in v1.0.
- Multi-tenancy, real SCADA/historian integration, SSO/LDAP, mobile apps, model fine-tuning (per PRD non-goals).

## Documented fallbacks (do not require a new ADR to evaluate, but do to adopt)
- **Vector store:** if Elasticsearch JVM RAM is too heavy, fall back to Supabase `pgvector` + Postgres full-text.
- **PII engine:** start LLM-based; add a Presidio sidecar if precision demands it.

## Consequences
- All chat data leaves to 3rd-party APIs; mitigated by PII redaction + provider-trust routing.
- Free-tier/credit limits (Groq/Gemini/Supabase/Anthropic) bound throughput; mitigated by caching, token budgets, and modest synthetic data.
- Architecture frozen at **git tag `architecture-v1`**; any change from here is recorded as a new ADR.

## Open (tracked, not blocking the lock)
- Company **LLM policy rules** → `llm-governance.md` (will refine routing/refusal/PII specifics).
- Hybrid fusion method (RRF vs weighted), sensitivity taxonomy finalization, sentiment model choice — to be settled during build as ADRs.
