# 01 — Product Requirements Document (PRD)

> **Status:** 🔒 Approved — Locked v1.0 (2026-06-04) · **Phase:** Requirements (SDLC step 2)
> **Builds on:** [00 — Brainstorm & Vision](00-brainstorm.md)

Requirements are given stable IDs (`FR-*` functional, `NFR-*` non-functional) so design, tasks, and test cases can trace back to them.

---

## 1. Purpose & goals

RefineryIQ is a single-tenant, AI-first enterprise assistant for a refinery. This PRD defines *what* the MVP must do and the criteria by which we judge it done.

**Product goals**
- G1 — Let any authorized user get **accurate, cited** answers from the refinery's documents and records in natural language.
- G2 — Enforce **role- and department-scoped** access on every answer.
- G3 — Demonstrate **responsible AI routing**: sensitivity drives PII redaction and provider choice (confidential → primary trusted provider only, never the secondary); the rest is routed by cost/latency.
- G4 — Keep the corpus **continuously current** as documents are uploaded/revised.
- G5 — Be **observable and governable**: token/cost metering, audit trail, in-app bug reporting.

**Non-goals (MVP)** — real SCADA/historian integration, multi-tenancy, mobile apps, SSO/LDAP, model fine-tuning. (See Brainstorm §6.)

---

## 2. Personas

Per Brainstorm §2: **Operator** (Operations), **Reliability Engineer** (Maintenance/Eng), **Safety Officer** (HSE), **HR Manager** (HR), **Plant Manager** (Management), **Admin** (Platform). Each belongs to one home department; some roles grant cross-department read.

---

## 3. Roles, permissions & RBAC

### 3.1 Departments
`operations`, `maintenance`, `safety`, `hr`, `management`, `platform`.

### 3.2 Roles → capabilities (RBAC matrix)

| Capability | Operator | Engineer | Safety | HR | Manager | Admin |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Chat / ask | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Read **own-dept** documents | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Read **cross-dept** documents | — | — | — | — | ✅ (all) | ✅ (all) |
| Upload documents | ✅ (own) | ✅ (own) | ✅ (own) | ✅ (own) | ✅ | ✅ |
| Manage document versions / set "current" | — | ✅ (own) | ✅ (own) | ✅ (own) | ✅ | ✅ |
| View dashboard (own-dept) | ✅ | ✅ | ✅ | ✅ | ✅ (all) | ✅ (all) |
| Manage users / roles / departments | — | — | — | — | — | ✅ |
| Configure models / routing / LLM-policy | — | — | — | — | — | ✅ |
| View audit log | — | — | — | — | view (own-dept) | ✅ (all) |
| File a bug report | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Triage bug reports | — | — | — | — | — | ✅ |

- **FR-RBAC-1** Every retrieval and answer MUST be filtered by the requester's permitted departments.
- **FR-RBAC-2** Documents carry a `department` and `sensitivity` label; access is denied if the role lacks scope.
- **FR-RBAC-3** Admin-only screens/actions MUST be inaccessible (UI + API) to other roles.
- **FR-RBAC-4** A cross-department query by an unscoped user returns only the permitted subset, and the UI states the scope applied.

---

## 4. Functional requirements

### 4.1 Authentication & accounts
- **FR-AUTH-1** Email-based sign-in via Supabase Auth using **Resend** for magic-link/OTP delivery.
- **FR-AUTH-2** A user has exactly one role and one home department (assigned by Admin).
- **FR-AUTH-3** Sessions expire; sign-out invalidates the session.
- **FR-AUTH-4** First Admin is seeded; subsequent users are invited/created by an Admin.

### 4.2 Chat (primary surface)
- **FR-CHAT-1** Streaming responses (token-by-token) in a conversational thread.
- **FR-CHAT-2** Every substantive answer includes **inline citations** linking to source passages/documents (see 4.4).
- **FR-CHAT-3** The UI shows **which model answered** (e.g., "Claude" vs "Groq") and a subtle "AI working" glimmer during retrieval/generation.
- **FR-CHAT-4** Users can **upload a file mid-chat**; it is ingested and immediately queryable in that thread.
- **FR-CHAT-5** Conversation history is persisted per user and scoped to their access.
- **FR-CHAT-6** If retrieval returns no permitted sources, the assistant says so and does **not** fabricate an answer.

### 4.3 Document ingestion pipeline
- **FR-DOC-1** Accept PDF, DOCX, XLSX, CSV, TXT, and image files (PNG/JPG/TIFF).
- **FR-DOC-2** Pipeline (async worker): **parse → OCR (if image/scanned) → PII scan → chunk → embed → index**.
- **FR-DOC-3** **OCR** of scanned/image content via **Gemini** vision.
- **FR-DOC-4** Embeddings via **Gemini `text-embedding-004`** (768-dim); chunks indexed in Elasticsearch.
- **FR-DOC-5** Each document is tagged with `department`, `sensitivity`, uploader, and timestamps.
- **FR-DOC-6** Ingestion status (queued/processing/indexed/failed) is visible to the uploader and on the dashboard.

### 4.4 Search, RAG & citations
- **FR-RAG-1** Hybrid retrieval in Elasticsearch: BM25 keyword **+** dense-vector kNN, fused into one ranked set.
- **FR-RAG-2** Retrieval is RBAC-filtered (4.1/§3) before passages reach any LLM.
- **FR-RAG-3** Answers cite the specific passages used; citations resolve to the document + version + location.
- **FR-RAG-4** A keyword/search view lets users browse/search documents directly (not only via chat).

### 4.5 File version control
- **FR-VER-1** Re-uploading a document creates a **new version**, preserving prior versions.
- **FR-VER-2** Exactly one version is marked **current**; RAG answers default to the current version.
- **FR-VER-3** Version history (who/when/notes) is viewable; authorized roles can change which version is current.
- **FR-VER-4** Re-indexing on a new/changed version is **automatic** (the "continuously-current RAG index", Brainstorm §5 #17).

### 4.6 Multi-agent orchestration
- **FR-AGENT-1** An orchestrator classifies intent and routes to specialist agents (Document/RAG, Operations, HR, Safety, Analytics).
- **FR-AGENT-2** The orchestrator enforces RBAC and LLM-policy **before** model calls.
- **FR-AGENT-3** Agents share common tools: retrieval, PII scan, sentiment, token-metered LLM calls.

### 4.7 Multi-LLM harness & routing
- **FR-LLM-1** A single harness (Vercel AI SDK) calls Anthropic and Groq through one interface for chat; Gemini provides embeddings + OCR.
- **FR-LLM-2** Routing chooses a provider by **sensitivity** (confidential → primary trusted provider only, never the secondary), then cost/latency.
- **FR-LLM-3** Provider **fallback**: if a provider errors/limits, fall back to the next provider **allowed by policy** (never one disallowed by sensitivity).
- **FR-LLM-4** Admin can view/edit routing rules and default models.

### 4.8 Token utilization, optimization & caching
- **FR-TOK-1** Every LLM call records input/output tokens, model, latency, and estimated cost.
- **FR-TOK-2** Usage is aggregable per user, department, and time window.
- **FR-CACHE-1** A Redis cache returns prior results for equivalent prompt+context+model, avoiding repeat spend.
- **FR-OPT-1** Context is trimmed/compacted before hosted calls (token optimization), and caching/routing reduce cost.

### 4.9 PII handling
- **FR-PII-1** Detect PII (names, contact info, IDs) during ingestion and tag affected chunks.
- **FR-PII-2** Before sending content to a **3rd-party** API, redact/ mask PII per policy.
- **FR-PII-3** Policy may restrict high-sensitivity content to the primary trusted provider and require maximum redaction before egress.

### 4.10 Sentiment analysis
- **FR-SENT-1** Score sentiment on safety reports, HR feedback, and bug reports.
- **FR-SENT-2** Surface sentiment trends on the dashboard.

### 4.11 Dashboard
- **FR-DASH-1** Department-scoped overview: recent documents, ingestion status, token/cost usage, sentiment trend.
- **FR-DASH-2** Managers/Admin see cross-department aggregates.

### 4.12 Admin panel
- **FR-ADMIN-1** Manage users, roles, departments.
- **FR-ADMIN-2** Document library with version history and "set current".
- **FR-ADMIN-3** View/edit LLM-policy rules and model routing.
- **FR-ADMIN-4** View the audit log (all actions: auth, doc changes, admin changes, policy-driven refusals/redactions).
- **FR-ADMIN-5** Triage the bug-reporting backlog.

### 4.13 Bug reporting
- **FR-BUG-1** Any user can file a bug from within the app (description, optional screenshot, auto-attached context: route, role, recent action).
- **FR-BUG-2** Reports persist to a backlog with status (new/triaged/in-progress/closed) and sentiment score.
- **FR-BUG-3** Admin can view, filter, and update report status.

### 4.14 Logging & audit
- **FR-LOG-1** Structured application logs across web + worker.
- **FR-LOG-2** Agent/LLM traces (which agent, model, tokens, cache hit/miss, citations used).
- **FR-LOG-3** Immutable-style audit log for security-relevant events (§4.12 FR-ADMIN-4).

---

## 5. Non-functional requirements

- **NFR-SEC-1** Auth on every route; RBAC enforced server-side (never trust the client).
- **NFR-SEC-2** Secrets via env/secret store; never committed. Distinct config per environment.
- **NFR-SEC-3** Environment isolation: local · test · prod with separate data and keys.
- **NFR-PRIV-1** PII never leaves to 3rd-party APIs except as permitted by policy (ties to FR-PII-*).
- **NFR-PERF-1** First streamed token within a few seconds; the answering model is clearly indicated in the UI.
- **NFR-SCALE-1** Stateless web tier + async worker off a Redis queue; services containerized and independently scalable.
- **NFR-OBS-1** Logs, LLM traces, and token/cost metrics are queryable for the demo.
- **NFR-COST-1** Operate within free tiers / provided credits; caching + routing keep hosted spend low.
- **NFR-REL-1** Whole stack starts with one `docker compose up`; failed ingestions are retryable and visible.
- **NFR-PORT-1** Runs on a single CPU-only machine (Brainstorm §7).

---

## 6. Key user stories & acceptance criteria

- **US-1 (Operator, RAG+citation):** *As an Operator, I ask for the current Unit 200 startup SOP and get a cited summary.*
  **AC:** streamed answer; citations resolve to the **current** version; no Maintenance/HR docs leak in; model shown.
- **US-2 (Safety, sensitivity routing):** *As a Safety Officer, I ask about a sensitive (confidential) incident.*
  **AC:** PII redacted before egress; routed to the primary trusted provider (Anthropic), never the secondary; UI shows the model; audit log records the routing reason.
- **US-3 (Engineer, OCR + versions):** *As an Engineer, I upload a scanned maintenance form; it becomes searchable; a re-upload supersedes it.*
  **AC:** OCR text indexed; ingestion status visible; new version becomes current; answers shift to the new version automatically.
- **US-4 (HR, PII):** *As an HR Manager, I ask about a policy referencing employees.*
  **AC:** PII is redacted before any API call; citations still resolve.
- **US-5 (Manager, dashboard):** *As a Plant Manager, I view cross-department token/cost usage and sentiment trend.*
  **AC:** aggregates across departments; numbers reconcile with logged LLM calls.
- **US-6 (Admin, governance):** *As an Admin, I create a user, set a routing rule, and review the audit log + a filed bug.*
  **AC:** new user can sign in with correct scope; routing change takes effect; audit + bug visible.
- **US-7 (any user, bug):** *As a user, I file a bug from the app.*
  **AC:** report saved with auto-context + sentiment; appears in Admin backlog.

---

## 7. RBAC × data model (requirements view)

Entities the system must represent (formalized in `04-database.md`): **User, Role, Department, Document, DocumentVersion, Chunk(index), Conversation, Message, Citation, TokenUsage, AuditEvent, BugReport, PolicyRule**. Documents and their chunks carry `department` + `sensitivity`; all retrieval joins these against the requester's scope.

---

## 8. Demo data (synthetic corpus)

Generated content for "Meridian Refinery" (confirmed: synthetic):
- **Operations** — startup/shutdown SOPs, daily logs, flare-event records.
- **Maintenance/Eng** — equipment maintenance reports (incl. a few **scanned** forms for OCR), reliability summaries.
- **Safety/HSE** — procedures (e.g., H2S, hot-work permits), incident reports, **scanned** permit forms.
- **HR** — leave/shift policies, code of conduct, sample (synthetic) grievance text.
- **Management** — weekly summaries.
- Volume kept modest (tens of docs) to respect free-tier limits while exercising every file type + OCR + versions.
- Synthetic PII is fabricated and clearly fictional.

---

## 9. Success metrics (demo)

| Metric | Target |
|---|---|
| Cited answers | 100% of substantive answers carry resolvable citations |
| RBAC correctness | 0 cross-scope leaks across the US-1..US-7 walkthrough |
| Sensitivity routing | confidential queries redacted + routed to primary provider only, verifiable in audit |
| Index currency | new/updated doc reflected in answers without manual re-index |
| One-command bring-up | `docker compose up` → all services healthy |
| CI | green on `main` (lint + tests + build) |

---

## 10. Dependencies & assumptions

- Provided **Anthropic credits**; **Groq** + **Gemini** free tiers; **Supabase**, **Resend**, **Cloudflare** free tiers.
- Single CPU-only demo machine; Docker Desktop available.
- **Company LLM policy rules pending** → will refine FR-LLM-*, FR-PII-*, and `llm-governance.md`.
- Timeline paced by SDLC phases (no fixed date assumed).

---

## 11. Open items

1. Company LLM policy rules (→ governance doc; may add/extend FR-LLM-*, FR-PII-*).
2. ~~Confirm Groq as the second provider~~ — ✅ resolved: Claude + Groq for chat; Gemini for embeddings/OCR; no local LLM.
3. Exact sensitivity taxonomy (e.g., `public/internal/confidential`) — to finalize with policy rules.

---

## 12. Traceability

Each `FR-*`/`NFR-*` will map to: an architecture component (`03`), a schema element (`04`), and one or more test cases (testing phase). The bug-reporting system (`FR-BUG-*`) is the in-app channel for defects found against these requirements.
