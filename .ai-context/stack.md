# Stack & Dependencies

> _Last verified: 2026-05-28 against branch `feat/conversation-engine`._

> 🚧 **V1 demo** : no Supabase, no auth — see
> [`../docs/initiative_wizard/decisions.md`](../docs/initiative_wizard/decisions.md).

---

## Runtime

- **Node**: 22 (nvm)
- **Package manager**: npm
- **Framework**: Next.js 16.2.6 (App Router, Turbopack)
- **Language**: TypeScript (strict mode)

---

## Dependencies (production)

| Package | Version | Purpose | Used? |
|---------|---------|---------|-------|
| `next` | 16.2.6 | Framework | Yes |
| `react` / `react-dom` | 19.2.4 | UI | Yes |
| `geist` | ^1.7.1 | Geist font (local, not Google Fonts) | Yes |
| `dexie` | ^4.4.3 | IndexedDB client (sessions, messages, prdBlocks) | Yes (`src/lib/db/dexie.ts`, v2) |
| `tailwindcss` | ^4 | Styling | Yes |
| `@tailwindcss/typography` | ^0.5.19 | Prose styling for markdown | Installed, not used |
| `shadcn` | ^4.8.1 | Component CLI | Yes (initialized) |
| `@base-ui/react` | ^1.5.0 | shadcn/ui primitives | Yes (Button, Tabs) |
| `class-variance-authority` | ^0.7.1 | Component variants | Yes (via shadcn) |
| `clsx` / `tailwind-merge` | latest | Class merging (`cn()`) | Yes |
| `lucide-react` | ^1.16.0 | Icons | Yes (step indicator, pitch-form, chat, cards) |
| `tw-animate-css` | ^1.4.0 | Animations | Installed, not used |
| `zod` | ^4.4.3 | Schema validation | Yes (`rawIdeaSchema` in pitch-form) |
| `react-hook-form` | ^7.76.1 | Form management | Installed, not used (pitch-form uses native form) |
| `@hookform/resolvers` | ^5.4.0 | Zod resolver for RHF | Installed, not used |
| `zustand` | ^5.0.13 | Client state management | Yes (`wizard-store`) |
| `ai` | ^6.0.191 | Vercel AI SDK (`streamText`, `convertToModelMessages`, tools, transport) | Yes (`/api/chat`, `src/lib/ai/*`) |
| `@ai-sdk/react` | ^3.0.193 | `useChat` hook + chat helpers | Yes (`src/components/chat/conversation.tsx`) |
| `@ai-sdk/mcp` | ^1.0.43 | MCP client for AI SDK | Installed, not used (post-démo) |
| `@openrouter/ai-sdk-provider` | ^2.9.0 | OpenRouter provider | Yes (`src/lib/ai/openrouter.ts`) |
| `react-markdown` | ^10.1.0 | Markdown rendering | Installed, not used (Feature 5) |
| `remark-gfm` | ^4.0.1 | GitHub-flavored markdown | Installed, not used (Feature 5) |
| `rehype-sanitize` | ^6.0.0 | HTML sanitization | Installed, not used (Feature 5) |
| `nanoid` | ^5.1.11 | Short unique IDs | Installed, not used (Feature 9 share slugs) |
| `posthog-js` | ^1.376.2 | PostHog browser analytics | Installed, not used |
| `posthog-node` | ^5.21.2 | PostHog server analytics | Installed, not used |

**Removed in V1 demo:** `@supabase/supabase-js`, `@supabase/ssr` (see `decisions.md` 2026-05-28 entry).
They will return when `deferred-auth` is re-enabled.

---

## Key files

| File | Purpose |
|------|---------|
| `src/lib/db/dexie.ts` | Dexie DB definition — `sessions`, `messages`, `prdBlocks` tables (v2) |
| `src/lib/schemas/session.ts` | Zod `rawIdeaSchema` (validation, shared landing + future API) |
| `src/lib/types/session.ts` | Re-exports `Session` / `SessionStatus` from Dexie |
| `src/stores/wizard-store.ts` | Zustand wizard state (currentStep, viewingStep, activePanel); `advanceStep` persists to Dexie |
| `src/hooks/use-media-query.ts` | SSR-safe responsive breakpoint hook |
| `src/lib/utils.ts` | `cn()` helper (clsx + tailwind-merge) |
| `src/lib/ai/openrouter.ts` | `conversationModel()` — wraps the OpenRouter default provider |
| `src/lib/ai/tools.ts` | `ask_user` + `update_prd` tools, `BLOCK_TYPES`, `BLOCK_SORT_ORDER`, `STEP_REQUIREMENTS`, `AskUserOutput` |
| `src/lib/ai/prompts/` | `system.ts` (base) + `step-1..4.ts` + `index.ts` (`buildSystemPrompt`, `getStepPrompt`) |
| `src/components/ui/button.tsx` | shadcn/ui Button |
| `src/components/ui/tabs.tsx` | shadcn/ui Tabs |
| `src/components/ui/textarea.tsx` | shadcn/ui Textarea (cards + chat input) |
| `src/components/ui/radio-group.tsx` | shadcn/ui RadioGroup (single-choice card) |
| `src/components/ui/checkbox.tsx` | shadcn/ui Checkbox (multi-choice card) |
| `src/components/ui/slider.tsx` | shadcn/ui Slider (installed, scale card uses buttons instead) |
| `src/components/landing/pitch-form.tsx` | Landing CTA — writes Dexie + client navigates |
| `src/components/wizard/wizard-shell.tsx` | Split-view orchestrator (40/60 desktop, tabs mobile) |
| `src/components/wizard/step-indicator.tsx` | 4-step navigation bar |
| `src/components/wizard/conversation-panel.tsx` | Wraps `<Conversation />` |
| `src/components/wizard/prd-panel.tsx` | Empty slot for Feature 5 |
| `src/components/chat/types.ts` | `AppUIMessage` shared type (UIMessage typed by `conversationTools`) |
| `src/components/chat/conversation.tsx` | Conversation root + ConversationInner (useChat + transport + onToolCall + onFinish + auto-kickoff + canAdvance + Continuer banner) |
| `src/components/chat/message-list.tsx`, `message-bubble.tsx`, `chat-input.tsx` | Conversation UI (scroll, role-aware bubbles, send) |
| `src/components/cards/card-renderer.tsx` | Dispatches `card_type` to the right card; auto-injects "Autre — préciser" |
| `src/components/cards/card-shell.tsx` | Shared visual shell (question header + submitted state) |
| `src/components/cards/{single,multi}-choice-card.tsx`, `scale-card.tsx`, `confirmation-card.tsx`, `free-text-card.tsx` | 5 card components |
| `src/app/api/chat/route.ts` | POST `/api/chat` — Zod-validated body, `streamText`, SSE response (`maxDuration = 60`) |
| `src/app/layout.tsx` | Root layout (Geist font) |
| `src/app/(marketing)/page.tsx` | Landing page |
| `src/app/(app)/layout.tsx` | App route group layout (h-screen) |
| `src/app/(app)/session/[id]/page.tsx` | Server Component — validates UUID format only |
| `src/app/(app)/session/[id]/wizard-client.tsx` | Client boundary — hydrates from Dexie |
| `src/app/(app)/session/[id]/not-found.tsx` | 404 page for malformed UUID |

---

## CLIs

| Tool | Version | Source | Purpose |
|------|---------|--------|---------|
| Vercel CLI | 54.4.1 | Homebrew (`vercel-cli`) | Deploy, env management |

The Supabase CLI is no longer required for V1. It can be reinstalled when `deferred-auth` returns.

---

## Supabase project (parked)

- **Project ref**: `gzuhqxzvapnalztkoaca`
- **URL**: `https://gzuhqxzvapnalztkoaca.supabase.co`
- **Status**: unused in V1 demo. Project is intact remotely; no migrations applied at the moment
  (all locally-tracked migrations were removed when Supabase was dropped — see `decisions.md`).
- **Re-introduction plan**: see the "Plan de retour" section of the 2026-05-28 Supabase decision.
