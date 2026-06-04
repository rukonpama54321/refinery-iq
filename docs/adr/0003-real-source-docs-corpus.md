# ADR-0003 — Real source documents as corpus + confidentiality handling

- **Status:** Accepted · **Date:** 2026-06-04
- **Relates to:** PRD §8 (corpus), [`docs/llm-governance.md`](../llm-governance.md), [ADR-0001](0001-locked-architecture-v1.md)/[0002](0002-design-driven-roles-departments.md)

## Context
The owner supplied real documents in `docs/policies/`: a **Hydrocracker Unit (HCU) training manual** (PDF, self-declared demo/generic data) and the **NRL HR Policy Manual in two versions** (v1.0, v2.0; classified "INTERNAL — for official use"). These replace most of the planned synthetic corpus and ground the governance rules.

## Decision
1. **Corpus is real-document-first:**
   - HCU manual → Process Engineering / Operations / HSE / Maintenance content (process, equipment, procedures, safety limits, troubleshooting).
   - HR manual v1 & v2 → HR content **and** the primary **version-control demo** (v2 supersedes v1; "current version" answers reflect v2).
   - A *slim* synthetic supplement may be added only to fill gaps (e.g., a couple of Maintenance/Lab docs, a scanned form for OCR).
2. **Confidentiality handling:**
   - Raw sources are **git-ignored** (`docs/policies/*`, `data/source-docs/*`); never pushed to the public repo.
   - **HCU manual** is demo-safe (could be published) but kept local for simplicity.
   - **HR manual** is treated as **confidential** — local-only; no verbatim text, real names, or figures in public artifacts.
   - `docs/llm-governance.md` is **abstracted** (rule structure + enforcement, not confidential content).
   - Public docs/UI use the generic brand **"Northgate Refining"**; the live local demo shows the real NRL content from the index.
3. **Sensitivity taxonomy** stays `public/internal/confidential` (ADR-0001); **"restricted"** = `confidential` + access-gated (request-access). Restricted categories (per governance): disciplinary, suspension, grievance, harassment, vigilance/whistle-blower, and personal/pay data.
4. **Governance source:** rules in `docs/llm-governance.md` are derived from the HR manual's conduct/data-privacy/disciplinary provisions and the HCU safety limits.

## Consequences
- PRD §8 corpus plan updated to real-document-first.
- Resolves the pending "company LLM policy rules" open item.
- Demo gains authentic, citable Q&A (HCU limits; HR leave/allowance with versioning) without exposing confidential data publicly.
- No architecture change; `architecture-v1.1` stands. Governance doc + this ADR are additive.

## Risks / mitigations
- *Confidential leak into public repo* → git-ignore + abstraction + generic public naming (this ADR).
- *PDF/scan ingestion* → HCU PDF text extracts cleanly; a scanned page can be added to exercise Gemini OCR.
