# AI Context — Navigation & Cross-Cutting Invariants

> **Read this file first, then only the domain file relevant to your task.**
> This directory documents the **current code state** for AI agents — what the code actually
> does today and which invariants break if you touch the wrong thing. It is not a planning doc
> (that's `docs/`). When the code and this directory disagree, the code is right — fix the doc.

> _Last verified: 2026-05-28 against branch `feat/wizard-shell` (Dexie refactor)._

> 🚧 **V1 demo deviates from `docs/initiative_wizard/prd.md`.** No Supabase, no auth, all persistence
> in client-side Dexie (IndexedDB). See [`docs/initiative_wizard/decisions.md`](../docs/initiative_wizard/decisions.md)
> for the rationale.

---

## File Map

| File | Scope | Keywords |
|------|-------|----------|
| `README.md` | Navigation + cross-cutting invariants | **always read first** |
| `stack.md` | Tech stack, dependencies, env vars, deploy | Next.js, Dexie, Vercel, OpenRouter, Tailwind |
| `design-system.md` | Obra design tokens, colors, typography, radius | Figma, shadcn, tokens, light, dark, globals.css |

---

## Current Architecture

```
Browser → Next.js (Vercel)
   │            │
   │            ↓
   │      OpenRouter (AI, future)
   │
   ↓
Dexie (IndexedDB, local browser only)
```

**No server-side persistence in V1.** No Supabase, no auth, no cookies for session identity.
Sessions live in `Dexie` in the user's browser; an in-progress session is gone if the browser
storage is cleared.

**Status: Landing page (`/`) + wizard shell (`/session/[id]`) shipped on Dexie persistence.**
Conversation engine, PRD live builder, AI integration, PostHog still pending.

### What exists
- Next.js 16 App Router with TypeScript strict
- **Dexie 4 client-side DB** (`src/lib/db/dexie.ts`) — single `sessions` table, schema v1
- shadcn/ui: Button, Tabs (Base UI–backed)
- Zustand, Zod, React Hook Form, Vercel AI SDK, react-markdown installed
- Landing page at `/` via `(marketing)` route group — PitchForm client island that **writes to Dexie**
  and client-navigates to `/session/[id]`
- Wizard at `/session/[id]` via `(app)` route group — server validates UUID format, client hydrates
  the Zustand store from Dexie, renders split-view (40/60 desktop, tabs < 1024px) with empty
  conversation + PRD panels (slots for features 4/5)

### What does NOT exist (and won't, for the demo)
- No authentication flow (deferred-auth feature is shelved — see decisions.md)
- No Supabase: `@supabase/*` deps removed, `src/lib/supabase/*` deleted, `supabase/migrations/*` deleted
- No middleware (`src/middleware.ts` deleted with the Supabase removal)
- No conversation engine (panels render placeholders)
- No PRD live builder
- No AI integration (prompts, tool calling)
- No MCP connections
- No PostHog tracking

---

## Routes

| Route | Type | Auth | Description |
|-------|------|------|-------------|
| `/` | Page (SSR) | None | Landing page — PitchForm writes Dexie session + client-navigates `/session/[id]` |
| `/session/[id]` | Page (SSR shell, client hydration) | None | Wizard shell — server validates UUID format only; client hydrates store from Dexie, renders split-view (or tabs) |

### Data flow: Landing → Session

```
Browser GET /
  → (marketing)/page.tsx (Server Component: header, headline, PitchForm island)
  → pitch-form.tsx (Client: textarea + CTA, client-side Zod validation)
      On submit:
      1. Validate via rawIdeaSchema (Zod, min 20 / max 5000 chars)
      2. const id = crypto.randomUUID()
      3. db.sessions.put({ id, rawIdea, currentStep:1, status:"active", createdAt:Date.now(), updatedAt:Date.now() })
      4. router.push(`/session/${id}`)   // client-side nav, no server round-trip
```

### Data flow: Session page → Wizard shell

```
Browser GET /session/{id}
  → (app)/layout.tsx (Server: h-screen flex flex-col wrapper)
  → (app)/session/[id]/page.tsx (Server Component, minimal)
      1. Validate id format as UUID
      2. notFound() if malformed
      3. Render <WizardClient sessionId={id} />   // no DB read
  → wizard-client.tsx (Client boundary)
      → useEffect: const session = await db.sessions.get(sessionId)
        - if undefined  → render "Session introuvable" client-side (link to /)
        - else          → useWizardStore.initialize(session); render <WizardShell />
  → wizard-shell.tsx (Client)
      → useMediaQuery("(min-width: 1024px)") picks layout
      → Desktop: StepIndicator + grid-cols-[40fr_60fr] (ConversationPanel | PrdPanel)
      → Mobile/tablet: StepIndicator + Tabs (keepMounted on both panels)
```

**Step model (`wizard-store`):** `currentStep` is actual progress (1-4). `viewingStep` is what's
displayed — diverges only when a user clicks a completed step to review it; `currentStep` is never
rolled back. `advanceStep` will be called by the conversation-engine via
`useWizardStore.getState().advanceStep()` when a step is completed (consumer contract for feature 4).

**Persistence contract:** the source of truth for a session's `rawIdea`/`currentStep`/`status` is
the Dexie row. The Zustand store is hydrated on mount and updated optimistically. Any write that
needs to survive a refresh must also `db.sessions.update(id, { ... })` — V1 only does that at
session-creation time (in pitch-form), so the store and the row diverge after `advanceStep`. The
conversation-engine feature will be responsible for the write-through.

---

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| _(none required at runtime in V1 demo)_ | — | All persistence is local Dexie; no AI key yet |

`OPENROUTER_API_KEY` will be added when the conversation-engine feature ships.

---

## Cross-Cutting Invariants

> **Invariant — Dexie writes are client-only**
> - **What:** `import { db } from "@/lib/db/dexie"` must only be used in Client Components or in
>   code that runs only in the browser (event handlers, `useEffect`). Server Components and route
>   handlers cannot access IndexedDB.
> - **Where:** `src/lib/db/dexie.ts`, anywhere that imports it.
> - **Breaks if:** Dexie is imported into a Server Component or middleware → runtime crash on the
>   server ("indexedDB is not defined").

> **Invariant — Session source of truth is the Dexie row**
> - **What:** The Zustand `wizard-store` is hydration state for the current render. Any state that
>   must survive a refresh (currentStep, status) has to be written back to `db.sessions`.
> - **Where:** `src/stores/wizard-store.ts`, future write-through in the conversation-engine feature.
> - **Breaks if:** a feature mutates the store but forgets to `db.sessions.update(...)` → refresh
>   silently resets that state.

> **Invariant — .ai-context must be updated in every commit that changes code**
> - **What:** Any commit that modifies routes, data flows, modules, services, or invariants must
>   include matching `.ai-context/` updates.
> - **Where:** This directory.
> - **Breaks if:** skipped → next agent works from stale context → regressions.

---

## Deploy

| Environment | Branch | Domain | Trigger |
|-------------|--------|--------|---------|
| Production | `main` | `enhanced.pm` | Push to `main` |
| Staging | `staging` | `staging.enhanced.pm` (pending DNS) | Push to `staging` |

Deploys are automatic via Vercel GitHub integration. No GitHub Actions workflow.

---

## Maintenance Rules

- **After changing a data flow** → update the matching domain file.
- **After adding/removing a module, route, service, or tool** → update the relevant domain file
  and, if it's a new domain, add a row to the File Map above.
- **After changing a cross-cutting invariant** → update the Invariants section here.
- **Verify, don't assume** — when you touch a domain, re-read its file and correct anything that
  no longer matches the code. Update the `Last verified` date at the top.
