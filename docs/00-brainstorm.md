# 00 — Brainstorm & Vision

> **Status:** 🔒 Approved — Locked v1.0 (2026-06-04) · **Phase:** Brainstorm (SDLC step 1)

This is the founding document. It frames *why* the project exists, *who* it serves, *what* it is, and *how* each required tech capability lands as a real feature. Later docs (PRD, design, architecture, database) refine the decisions made here.

---

## 1. Vision

**RefineryIQ** is an AI-first, role-aware enterprise assistant for an oil refinery. It is a single, chat-led front door to the things a refinery's people deal with every day: operating procedures, engineering documents, maintenance and safety records, HR policies, and operational data — answered in natural language, **with citations back to the source**, and **scoped to what each person is allowed to see**.

It is built as a **tech-capability demo**: a believable product whose surface is simple (a chat box and a few dashboards) but whose internals deliberately exercise a broad, modern AI-platform stack — multi-agent orchestration, RAG, hybrid search, OCR, a multi-LLM harness across hosted APIs (Claude, Groq), token accounting, caching, RBAC, file versioning, PII handling, sentiment analysis, audit logging, and full CI/CD across environments.

### The problem it dramatizes
Refinery knowledge is scattered across PDFs, scanned forms, spreadsheets, intranet pages, and people's heads. Finding "the current revision of the SOP for restarting Unit 200" or "who approved last month's hot-work permit" means hunting through shared drives. Answers must be **trustworthy** (cited, current), **safe** (sensitive data is redacted and tightly routed before any API call), and **need-to-know** (an operator and an HR manager see different things). RefineryIQ shows how an AI platform can deliver that responsibly.

### Guiding principles
- **AI-first, minimal UX.** The primary interface is conversation; dashboards and admin are supporting surfaces. Subtle "glimmer" affordances signal where AI is working — used only where they add clarity, never decoration.
- **Trust by construction.** Every substantive answer carries citations. No-source means no confident claim.
- **Right data, right place.** Sensitive/confidential content is redacted before egress and restricted to the **primary trusted provider** (Anthropic), never the secondary (Groq). Policy decides routing.
- **Free / open-source first.** The demo runs on free tiers and OSS. Hosted LLM usage is limited to provided Anthropic credits and Groq's free tier; Gemini's free tier handles OCR **and embeddings**.
- **Single-tenant, multi-department.** One organization; access is partitioned by department and role.

---

## 2. Users & departments

Single fictional organization: **"Meridian Refinery."** Departments and the personas we'll design for:

| Department | Persona | What they ask RefineryIQ |
|---|---|---|
| **Operations** | Control-room Operator | "Show the current startup SOP for Unit 200." "What were yesterday's flare events?" |
| **Maintenance / Engineering** | Reliability Engineer | "Find the last 3 maintenance reports for pump P-101 and summarize recurring faults." |
| **Safety / HSE** | Safety Officer | "Summarize open hot-work permits." "What does the H2S exposure procedure say?" (cited) |
| **Human Resources** | HR Manager | "What's the leave policy for shift workers?" "Draft a response to this grievance." |
| **Management** | Plant Manager | "Give me this week's operational + safety summary across departments." |
| **Platform** | Admin | Manages users, roles, departments, documents, models, and reviews audit/usage. |

Roles map to a **RBAC** matrix (defined fully in the PRD/DB docs). Department scoping means the Operations corpus is invisible to HR queries unless a role explicitly grants cross-department access (e.g., Plant Manager, Admin).

---

## 3. The product, in three surfaces

1. **Chat (primary).** Streaming, citation-backed conversation. Users upload files mid-chat, ask across the corpus, and get answers routed to the right agent and the right model. Sensitive queries are redacted and routed to the primary trusted provider, with the model shown.
2. **Dashboard.** Department-scoped overview: recent documents, token/cost usage, ingestion status, safety/ops highlights, sentiment trends on reports.
3. **Admin Panel.** Users, roles & permissions, departments, document library (with **version history**), model/routing configuration, LLM-policy rules, audit log, and the **bug-reporting** backlog.

---

## 4. Multi-agent design (overview)

A lightweight **orchestrator** routes each request to specialist agents, composed via the **Vercel AI SDK**. Architecture doc will formalize this; the concept:

- **Router/Orchestrator** — classifies intent, enforces RBAC + LLM-policy, selects provider (by sensitivity, then cost/latency) and agent(s), assembles the final cited answer.
- **Document/RAG agent** — hybrid retrieval over the corpus, returns passages + citations.
- **Operations agent** — operational data/records lookups and summaries.
- **HR agent** — HR policy Q&A and drafting, with stricter PII handling.
- **Safety/Compliance agent** — permits, procedures, incident summaries; citation-strict.
- **Analytics agent** — aggregates, trends, token/cost and sentiment summaries for dashboards.

Agents share common tools: retrieval, OCR-ingest, PII scan/redaction, sentiment scoring, and the LLM harness (with caching + token metering wrapped around every model call).

---

## 5. Capability → feature mapping

How each required capability shows up as something demonstrable.

| # | Required capability | Where it lives in RefineryIQ |
|---|---|---|
| 1 | **Multiple databases** | Supabase Postgres (system-of-record) + Elasticsearch (search/vectors) + Redis (cache/queue) |
| 2 | **Multi-agent architecture** | Orchestrator + 5 specialist agents (§4) |
| 3 | **Indexing & search** | Elasticsearch hybrid: BM25 keyword + dense-vector kNN |
| 4 | **OCR** | Gemini vision over scanned forms/permits/P&IDs during ingestion |
| 5 | ~~**Local LLM**~~ | **Descoped** — dropped to avoid slow CPU-only inference; replaced by hosted Claude + Groq (see Decision log) |
| 6 | **3rd-party LLM APIs** | Anthropic (Claude) + Groq (chat); Gemini (embeddings + OCR) |
| 7 | **Multi-LLM harness** | Vercel AI SDK — one interface, provider routing & fallback |
| 8 | **Token utilization** | Per-request/user/department token & cost metering, shown on dashboard |
| 9 | **RAG** | Core answer path; retrieval feeds every substantive response |
| 10 | **Understand different file types** | PDF, DOCX, XLSX, CSV, images via ingestion loaders (+ OCR) |
| 11 | **Different roles (RBAC)** | Operator, Engineer, Safety, HR, Manager, Admin × department scope |
| 12 | **File upload** | In-chat and Admin library upload → ingestion pipeline |
| 13 | **File version control** | Document versions tracked in Postgres + Supabase Storage; "current revision" semantics |
| 14 | **LLM caching** | Redis semantic/response cache keyed by prompt+context+model |
| 15 | **Sentiment analysis** | On safety reports, HR feedback, and bug reports; trends on dashboard |
| 16 | **Logging** | Structured app logs + agent/LLM traces + audit log |
| 17 | **"Active CI/CD RAG"** | Re-index pipeline triggered on document change / via CI; index always current |
| 18 | **Multiple environments** | local · test · prod (config-driven) |
| 19 | **CI/CD** | GitHub Actions: lint, test, build, deploy |
| 20 | **Scalable** | Containerized services; async worker off a Redis queue |
| 21 | **Token optimization** | Caching, context trimming, model routing by cost/sensitivity |
| 22 | **Security** | Auth, RBAC, secrets management, env isolation, audit |
| 23 | **Citation-based responses** | Every substantive answer cites retrieved source passages |
| 24 | **PII** | Detection + redaction on ingest and on egress to 3rd-party APIs |

> Interpretation note on #17 ("Active CI/CD RAG"): read as a **continuously-current RAG index** — document changes trigger re-ingestion/re-indexing automatically (and a CI job can rebuild/validate the index). To be confirmed in the architecture doc.

---

## 6. Scope (MVP)

**In scope**
- Email auth (Supabase + Resend magic-link/OTP), single-tenant.
- RBAC across the 6 roles and the departments in §2.
- Chat with streaming, citations, and visible model routing (Claude vs Groq, by sensitivity/cost).
- Document upload (chat + admin), ingestion (parse → OCR → PII scan → embed → index), and **version history**.
- Hybrid search (Elasticsearch) powering the RAG/Document agent + at least one other specialist agent end-to-end (Safety or Operations).
- Dashboard: token/cost usage + ingestion status + sentiment trend.
- Admin: users/roles/departments, document library with versions, LLM-policy rules view, audit log.
- In-app bug reporting with sentiment.
- Token metering + Redis caching + LLM-policy-driven routing.
- Docker Compose stack; local + test + prod configs; GitHub Actions CI/CD.

**Out of scope (demo)**
- Real SCADA/historian/sensor integration (we use synthetic operational records).
- Multi-tenancy.
- Mobile apps.
- Production-grade SSO/LDAP (email auth only).
- Fine-tuning models.

**Success criteria (demo-level)**
- A user logs in, asks a question, and gets a **streamed, cited** answer scoped to their role.
- A sensitive query is **visibly** answered by the **local** model with no 3rd-party egress.
- Uploading a new revision of a document updates the "current" answer and the index automatically.
- Dashboard shows real token/cost numbers; admin can see the audit trail and a filed bug report.
- The whole stack comes up with one `docker compose up`, and CI is green on `main`.

---

## 7. Decision log (locked unless noted)

| Area | Decision |
|---|---|
| App stack | Next.js (App Router) + Node.js |
| LLM harness | Vercel AI SDK |
| Chat LLMs | Anthropic (Claude) primary + Groq (fast/cheap + fallback) — **no local LLM** |
| Embeddings / OCR | Gemini `text-embedding-004` (768-dim) / Gemini vision |
| System-of-record | Supabase (Postgres + Auth + Storage) |
| Search / vectors | Elasticsearch (hybrid BM25 + kNN) — *fallback noted below* |
| Cache / queue | Redis (+ BullMQ worker) |
| Auth / email | Supabase Auth + Resend |
| Tenancy | Single-tenant, multi-department RBAC |
| Infra | All services in Docker Compose on the demo box; Supabase managed (cloud); Cloudflare Tunnel for public URL |
| Environments | local · test · prod |
| Hardware | Single CPU-only machine (~16 GB); no local LLM, so RAM is dominated by Elasticsearch |
| Demo data | **Confirmed:** synthetic refinery corpus (generated) |

**Noted fallback:** if Elasticsearch's JVM overhead proves heavy for the demo box, swap to Supabase `pgvector` + Postgres full-text for hybrid RAG and drop the ES container. ES remains the plan per requirement.

---

## 8. Open questions

1. ~~**Demo data**~~ — ✅ resolved: synthetic corpus (see PRD §8).
2. **Company LLM policy rules** — to be supplied; they drive routing, refusals, PII rules, and audit (→ `docs/llm-governance.md`).
3. **Timeline** — no fixed date assumed; pacing by SDLC phases.
4. ~~**4th LLM slot**~~ — ✅ resolved: Claude + Groq (chat), Gemini (embeddings/OCR); **local LLM dropped**.
5. **"Active CI/CD RAG"** — confirm the interpretation in §5.

---

## 9. Key risks & mitigations

| Risk | Mitigation |
|---|---|
| No local LLM → all data goes to 3rd-party APIs | PII redacted before every egress; confidential content restricted to the primary trusted provider; "Local LLM" capability consciously descoped |
| Elasticsearch RAM on the demo box | Cap JVM heap (512 MB–1 GB); pgvector fallback ready |
| PII leaking to 3rd-party APIs | PII scan + redaction on egress; policy restricts high-sensitivity content to the trusted provider |
| Free-tier limits (Groq/Gemini/Supabase) | Caching + token budgets; synthetic-data sizes kept modest |
| Scope creep across 24 capabilities | Balanced MVP: every capability demonstrably present, depth kept pragmatic |

---

## 10. Next steps

1. Confirm the open questions in §8.
2. Write the **PRD** (`01-prd.md`) — formal functional/non-functional requirements, RBAC matrix, user stories.
3. Capture **LLM governance** rules (`llm-governance.md`) once provided.
4. Proceed to **design** (`02`) and **architecture/database** (`03`/`04`).
