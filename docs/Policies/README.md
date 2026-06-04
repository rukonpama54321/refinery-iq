# Source policy / corpus documents (LOCAL-ONLY)

**Everything in this folder except this README is git-ignored** (see `.gitignore`). These are the real source documents the demo is built around; they are **not** published to the public repo.

| File | Type | Classification | Use |
|---|---|---|---|
| `HCU_Unit_Demo_Manual.pdf` | PDF, 12 pp | **DEMO / training** (self-declared generic data) | Hydrocracker Unit corpus — Process Eng / Operations / HSE / Maintenance |
| `NRL_HR_Policy_Manual 1.docx` | DOCX | **INTERNAL — for official use** | HR corpus (v1.0) |
| `NRL_HR_Policy_Manual_v2.docx` | DOCX | **INTERNAL — for official use** | HR corpus (v2.0) — pairs with v1 for the version-control demo |

Handling (per [ADR-0003](../adr/0003-real-source-docs-corpus.md)):
- The HCU manual is demo-safe; the HR manual is treated as **confidential** and stays local.
- `docs/llm-governance.md` captures rule **structure**, not confidential verbatim text.
- Public docs/UI use the generic name **"Northgate Refining"**; the real NRL content lives only in the local corpus/index.
