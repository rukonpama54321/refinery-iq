# ADR-0005 — Upgrade Next.js 15 → 16 (security CVE)

- **Status:** Accepted · **Date:** 2026-06-05
- **Amends:** [ADR-0001](0001-locked-architecture-v1.md) (stack: app framework version)

## Context
The scaffold shipped on **Next.js 15.1.6**, which carries **CVE-2025-66478** (critical). The planned remediation was `npm install next@latest`. At the time of remediation, `next@latest` resolved to **16.2.7** — a major-version jump. A patched 15.x line also exists (`15.5.19`), so staying on the documented Next 15 was a viable alternative.

## Decision
1. **Adopt Next.js 16.2.7** as the locked app-framework version (was "Next.js 15.x" in ADR-0001 / architecture §framework-versions).
   - Rationale: the critical CVE is resolved; the project is at the very start of development (no app code beyond the scaffold), so absorbing the major bump now is cheap and buys the longest support runway. `npm run build` passes clean on 16.2.7 (Turbopack).
2. **Pin exactly** (`"next": "16.2.7"`) to match the scaffold's exact-pin style for `next`/`react` and keep builds reproducible.
3. **`tsconfig.json`** changes auto-applied by the Next 16 build are accepted (`jsx: "react-jsx"`, `.next/dev/types/**/*.ts` added to `include`, reformatting). `next-env.d.ts` is generated and git-ignored as usual.

## Consequences
- Critical CVE-2025-66478 cleared. Remaining `npm audit` findings are **9 moderate/low**, all transitive via the Vercel AI SDK (`@ai-sdk/*` → `ai`) plus one transitive `postcss` advisory inside Next; **none critical**.
- The AI-SDK advisories require `ai` v4 → v6 (breaking). Per this session's decision we **stay on `ai` v4** for now (ADR-0004 unchanged) and revisit before shipping; no chat code exists yet, so the exposure is build-time only.
- Docs synced: architecture §framework-versions (15.x → 16.x), `PROGRESS.md`.

## Not changed
- Everything else from ADR-0001/0002/0003/0004: App Router architecture, Groq + Gemini LLMs, Gemini embeddings/OCR, Supabase, Elasticsearch, Redis, Docker, Cloudflare, RAG/storage model, 3 tiers × 6 departments, real-document-first corpus. The Vercel AI SDK stays on **v4** (`ai@^4.1.0`).
