# 02 — UX/UI & Design System

> **Status:** Draft for review · **Phase:** Design (SDLC step 3) · **Last updated:** 2026-06-04
> **Builds on:** [00 — Brainstorm](00-brainstorm.md) · [01 — PRD](01-prd.md) · reflects [ADR-0002](adr/0002-design-driven-roles-departments.md)
> **Source of truth:** the vendored prototype in [`/UI`](../UI) (RefineIQ), built with Claude's design feature.

This doc captures the design language, the component system, and the screen designs from the prototype, maps them to PRD requirements, and defines the plan to port them into the Next.js app.

---

## 1. Design philosophy
- **AI-first, minimal.** Conversation is the spine; dashboards/admin support it. Chrome is quiet so content and answers lead.
- **Dark, focused, "control-room" feel.** Deep navy surfaces, a single indigo→violet accent, restrained color used only for status/roles.
- **AI glimmer where it clarifies.** Subtle shimmer/glow signals when AI is *working* (searching, streaming) — never decorative. Intensity is tunable.
- **Trust signals are first-class UI.** Citations, the answering model, restricted-access state, and a "verify against source" disclaimer are built into the chat surface, not afterthoughts.

## 2. Source prototype
- Single-page **React (CDN) + inline styles**, fonts **Geist / Geist Mono**, file `UI/RefineIQ.html` mounting `UI/refineiq/*.jsx`.
- Files: `app.jsx` (shell/rail/sidebars), `ui.jsx` (primitives), `data.jsx` (synthetic content), `icons.jsx`, `screen_login|chat|dashboard|admin.jsx`, `tweaks-panel.jsx` (live design tuner).
- This is a **design reference**, not production code — §11 covers the port.

## 3. Design tokens

**Surfaces** `--bg #070B16` · `--bg-1 #0A0F1E` · `--bg-2 #0E1426` · `--bg-3 #121A30` · glass `rgba(255,255,255,.025)`
**Borders** `--border rgba(255,255,255,.075)` · `--border-2 .13` · `--border-glow rgba(139,92,246,.35)`
**Text** `--text #EAEEF9` · `--text-dim #98A3BE` · `--text-faint #586079`
**AI accent** `--a1 #6366F1` · `--a2 #8B5CF6` · `--a3 #A78BFA` · gradient `120deg a1→a2→a3`
**Status/role** violet `#8B5CF6` · blue `#3B82F6` · gray `#6B7280` · green `#34D399` · amber `#FBBF24` · red `#F87171`
**Radii** sm 8 · md 12 · lg 18 · xl 24
**Motion** `--ease cubic-bezier(.4,0,.2,1)` · `--dur 200ms`
**Layout** `--rail-w 60px` · `--sidebar-w 280px` · auto-collapse sidebar `< 880px`
**Glimmer** `--glimmer 0..1` (default 0.6) — global shimmer intensity, live-tunable.

Doc-status tints: Indexed `green` · Processing `amber` · Restricted `red` · Archived `gray`.

## 4. The "AI glimmer" system
A small family of effects that all read as "the AI is doing something," scaled by `--glimmer`:
- **`shimmer-text`** — animated gradient on "Searching controlled documents…" while retrieving.
- **Thinking skeleton** — spark icon + shimmer line placeholders before the answer streams.
- **`ai-streaming`** — soft animated border/glow on the answer card while tokens arrive.
- **Streaming cursor** — blinking caret at the end of streaming text.
- **`input-glow`** — composer border lights to `--border-glow` on focus/active.
- **`lift`** hover, **`glass`** cards, **`fade-rise`** message entrance, **`pop-in`** menus/toasts.
- **Tweaks panel** — live sliders for glimmer intensity and accent gradient (a design aid; ships hidden).

## 5. Component library (from `ui.jsx` + screens)
| Component | Purpose | Maps to |
|---|---|---|
| `RoleBadge` | Tier chip (Admin/Manager/End User), color-coded | RBAC |
| `StatusChip` + `DOC_STATUS_TINT` | Document status pill | FR-DOC-6 |
| `Avatar` | Initials avatar with role tint, optional ring | — |
| `Citation` | Source chip; **restricted → "request access"** flow | FR-RAG-3, FR-RBAC-5 |
| `ModelBadge` | Which model answered | FR-CHAT-3 |
| `renderRich` | Lightweight markdown (bold/italic/ordered lists) for answers | FR-CHAT-1 |
| `GlowButton` | Primary gradient action | — |
| `Switch` | Toggle (user enable, settings/policy) | FR-ADMIN, FR-LLM-4 |
| `PanelHead`, `IconBtn`, `MenuItem`, `Toast` | Structure & feedback | — |
| `Rail`, `ChatSidebar`, `AdminNav` | Navigation surfaces | §6 |

## 6. Information architecture
- **Left icon rail (60px):** Chat · Dashboard · **Admin (Admin tier only)** · notifications · account menu (switch account, preferences, sign out, role badge).
- **Chat contextual sidebar (280px):** New chat, **department selector** (All + 6 departments), conversation history grouped Today/Earlier. Collapsible.
- **Admin sub-nav (212px):** Users · Documents · Departments · Logs · Settings · index-health widget.

## 7. Screens

### 7.1 Login
Branded sign-in (RefineIQ / Northgate Refining). *Adjustment (ADR-0002):* present **email magic-link/OTP** (Resend) as the primary method; the prototype's password field is a placeholder.

### 7.2 Chat (primary)
Top bar shows the active **department · Knowledge**. Thread of user/AI messages; AI messages show: streamed `renderRich` answer → **Sources** (citation chips, restricted ones offer request-access) → footer with **ModelBadge**, thumbs-up/down (**sentiment/feedback**), copy. Composer: textarea, **attach document**, department selector, read-only indicator for End Users, send/stop, suggestion chips, and the disclaimer *"…grounds every answer in controlled documents. Verify against the source before field execution."* Thinking skeleton + streaming cursor provide the glimmer.

### 7.3 Dashboard
Stat cards (Total Documents, Active Users, Queries Today, Avg Response), **Recent queries** with per-query **sentiment** (green/amber/red), and an **activity feed** (uploads, role changes, re-index/embedding updates, access requests). *Adjustment:* add **token/cost** metrics alongside Avg Response (FR-TOK-2).

### 7.4 Admin (Admin tier)
- **Users** — table (user, tier, department, enable/disable, last active), invite.
- **Documents** — library with version, status, owner; upload; restricted lock icon.
- **Departments** — 6 cards with doc counts + coverage bars.
- **Logs** — immutable audit feed (`document.upload`, `user.role.update`, `access.request`, `index.rebuild`, `query.flagged`, …).
- **Settings** — policy toggles: multi-model routing, streamed responses, **PII & restricted redaction**, query retention.

## 8. Design → requirement mapping
| PRD requirement | Where it shows in the UI |
|---|---|
| FR-CHAT-1/2/3 (stream, cite, model) | Chat AI message: streaming, Sources, ModelBadge |
| FR-RAG-3 (citations) | `Citation` chips resolve to doc + version + page |
| FR-RBAC-5 (request access) | Restricted citation → "request access" → toast + audit |
| FR-SENT-1/2 (sentiment) | Thumbs feedback; dashboard recent-query sentiment |
| FR-DOC-6 / FR-VER (status, versions) | Admin Documents: status chips, version column, upload |
| FR-LOG-3 (audit) | Admin Logs feed |
| FR-LLM-4 / FR-PII (policy) | Admin Settings toggles (routing, redaction, retention) |
| FR-DASH (dashboard) | Stats, recent queries, activity |
| RBAC tiers/departments | Rail (Admin-only), department selector, RoleBadge |

## 9. Reflecting ADR-0002 in the UI (data adjustments)
The prototype's `data.jsx` needs: tiers already = Admin/Manager/End User ✅; **add the HR department** (currently 5 — add HR to `DEPARTMENTS`/users/docs); org name already **Northgate Refining** ✅; model picker → **Groq (Llama 3.3 70B) + Gemini**, remove **Claude/GPT-4o** (ADR-0004).

## 10. Gaps to add for full PRD coverage
- **Bug-reporting UI** (FR-BUG-*) — a "Report a bug" entry (account menu / footer) → modal capturing description + auto-context; Admin **bug backlog** view. *Not in the prototype yet.*
- **Token/cost** widgets on the dashboard (FR-TOK-2).
- **Ingestion progress** detail (queued→processing→indexed→failed) on upload (FR-DOC-6).
- **Magic-link** login flow (FR-AUTH-1).
- **HR department** content in synthetic data.

## 11. Port plan → Next.js
- **Framework:** Next.js App Router (per ADR-0001). Server components for data; **client islands** for chat/streaming, menus, toggles.
- **Tokens:** move `:root` vars into `app/globals.css` (or a Tailwind theme); keep the exact palette/motion above.
- **Components:** port `ui.jsx` primitives into `components/` (typed React). Reuse names (RoleBadge, Citation, ModelBadge, …).
- **Fonts:** Geist + Geist Mono via `next/font`.
- **Data:** replace `data.jsx` canned content with API calls (Supabase + Elasticsearch); streaming via **Vercel AI SDK**; `matchAnswer`/`AI_ANSWERS` become the real RAG path.
- **Icons:** keep the inline SVG set (`icons.jsx`) or swap to a tree-shakeable icon lib.
- **Keep:** the glimmer effects, glass system, layout widths, and tweak-driven accent (accent can stay a CSS var, tweaks panel dev-only).

## 12. Accessibility & responsive
- Sidebar auto-collapses `< 880px`; rail persists. Dark theme only for v1 (light theme out of scope).
- Ensure focus states, keyboard send (Enter / Shift+Enter), and sufficient contrast on `--text-dim`/`--text-faint` during the port.

---
**Next:** fold the §9 data adjustments + §10 gaps into the build backlog; on the owner's go-ahead, scaffold the Next.js app and port the design system first (tokens + primitives), then the chat screen.
