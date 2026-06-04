# ADR-0002 — Design-driven roles, departments, naming & model labels

- **Status:** Accepted · **Date:** 2026-06-04
- **Supersedes parts of:** [ADR-0001](0001-locked-architecture-v1.md) (RBAC role model)
- **Trigger:** The owner built the UI with Claude's design feature (vendored under `UI/`). It diverged from the locked v1.0 spec on roles, departments, naming, and model labels. Owner reviewed and chose to let the design drive, syncing the docs.

## Context
The RefineIQ prototype implements a clean **3-tier** access model and a refinery-engineering department set, names the org **"Northgate Refining,"** and references models including GPT-4o and a local Llama. v1.0 specified 6 named roles, 6 different departments (incl. HR/Management/Platform), "Meridian Refinery," and no OpenAI/local model. We reconcile in favor of the design, with two adjustments.

## Decision

1. **Roles → 3 access tiers** (was: 6 named roles).
   - `admin` — full platform control; all departments.
   - `manager` — manages own department's documents/versions; department dashboard + logs; optional cross-department read grants.
   - `end_user` — read-only within home department; chat + cited answers; can **request access** to restricted documents.
   - Job titles (e.g., "Senior Process Operator") are **display labels**, not permissions. Effective access = **tier × department**.

2. **Departments → 6** (kept the design's 5 engineering departments **and added HR back**, since HR functionality was an original requirement):
   `process_engineering`, `maintenance_reliability`, `hse`, `operations`, `lab_quality`, `hr`.

3. **Naming → "Northgate Refining"** (was "Meridian Refinery"). Product name remains **RefineryIQ / RefineIQ**.

4. **Model labels → match the locked free stack** (ADR-0001 still governs the actual providers):
   - Chat: **Claude** (Anthropic) + **Llama 3.3 70B via Groq** (free). **GPT-4o removed** (no OpenAI in scope).
   - Gemini remains embeddings + OCR (backend; not user-facing in the model picker).
   - The UI's "multi-model routing" setting stays, now listing Claude + Llama-70B(Groq).

5. **Auth display:** keep email sign-in (magic-link/OTP via Resend per ADR-0001). The prototype's password field / "SSO·Okta" log line are demo placeholders to be aligned during the build.

6. **The `UI/` prototype is the design reference** for the Next.js port (see `docs/02-design.md`).

## Consequences
- Updated: PRD §2/§3 (RBAC matrix → 3 tiers, 6 departments, FR-RBAC-5 added for request-access), Database enums (`role_t`, `department_t`) + RLS, Brainstorm §2 personas/capability map, naming throughout.
- Simpler, demonstrable RBAC (3 tiers × 6 departments) that matches the built UI.
- Docs move to **v1.1**; ADR-0001's stack/architecture decisions remain in force — only the role model changed.

## Not changed
- The locked stack (Next.js, Claude+Groq, Gemini embeddings/OCR, Supabase, Elasticsearch, Redis, Docker, Cloudflare), the RAG/LLM/storage model, sensitivity/PII routing, and "no local LLM" all stand from ADR-0001.
