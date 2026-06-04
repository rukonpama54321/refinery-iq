# ADR-0004 — Drop Anthropic; chat on Groq + Gemini (fully free)

- **Status:** Accepted · **Date:** 2026-06-04
- **Supersedes parts of:** [ADR-0001](0001-locked-architecture-v1.md) & [ADR-0002](0002-design-driven-roles-departments.md) (chat-provider choice)

## Context
The plan assumed **Anthropic API credits**. At development kickoff the owner clarified they have a **Claude Pro subscription**, not API access. Claude Pro powers claude.ai for personal use only; it **cannot** authenticate a deployed app's API calls. To keep the demo **free**, we drop the paid Anthropic API.

## Decision
1. **Chat LLMs → Groq (primary) + Gemini (alternate).** No Anthropic/Claude.
   - **Groq** — `llama-3.3-70b-versatile` (free, fast) — primary chat.
   - **Gemini** — free tier — alternate chat **and** embeddings (`text-embedding-004`) **and** OCR (vision).
2. **Sensitivity routing reframed** (no "primary trusted provider = Anthropic"):
   - `confidential` → a **single designated provider, no cross-provider fallback** + **maximum PII redaction** (designated provider configurable; default **Groq**).
   - `internal`/`public` → cost/latency routing across Groq (primary) and Gemini (alternate).
3. **Anthropic remains a documented, unconfigured optional provider** — if the owner ever obtains an API key, it can be re-enabled in the harness without architecture change.
4. **Multi-LLM harness** (Vercel AI SDK) is unchanged in shape — just the configured providers differ.

## Consequences
- **$0 LLM cost** for the demo (Groq + Gemini free tiers); no API key purchase needed.
- API keys required: **Groq**, **Gemini**, Supabase, Resend. (Anthropic no longer required.)
- Docs synced: brainstorm, PRD, architecture, database (`model_t`), design (model picker), governance (`GOV-PII-2`, seed rules), READMEs.
- Governance "trusted provider" language generalised to "single designated provider + max redaction".
- `.env.example` drops the active `ANTHROPIC_*` (kept as an optional comment).

## Not changed
- Everything else from ADR-0001/0002/0003: Next.js, Gemini embeddings/OCR, Supabase, Elasticsearch, Redis, Docker, Cloudflare, RAG/storage model, 3 tiers × 6 departments, real-document-first corpus.
