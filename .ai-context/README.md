# AI Context — Navigation & Cross-Cutting Invariants

> **Read this file first, then only the domain file relevant to your task.**
> This directory documents the **current code state** for AI agents — what the code actually
> does today and which invariants break if you touch the wrong thing. It is not a planning doc
> (that's `docs/`). When the code and this directory disagree, the code is right — fix the doc.

> _Last verified: 2026-05-28 against branch `feat/landing-page`._

---

## File Map

| File | Scope | Keywords |
|------|-------|----------|
| `README.md` | Navigation + cross-cutting invariants | **always read first** |
| `stack.md` | Tech stack, dependencies, env vars, deploy | Next.js, Supabase, Vercel, OpenRouter, Tailwind |
| `design-system.md` | Obra design tokens, colors, typography, radius | Figma, shadcn, tokens, light, dark, globals.css |

---

## Current Architecture

```
Browser → Next.js (Vercel) → Supabase (Postgres + Auth)
                ↕
          OpenRouter (AI, future)
                ↕
          MCP servers (PostHog/Mixpanel/Amplitude, future)
```

**Status: Landing page (`/`) shipped on `feat/landing-page`. Wizard, auth flow, AI integration, and PostHog instrumentation still pending.**

### What exists
- Next.js 16 App Router with TypeScript strict
- Supabase client (browser + server + middleware) — Magic Link auth configured
- Database tables: `sessions`, `prds` with RLS (migration `20260528000000`)
- shadcn/ui initialized (Button component)
- Zustand, Zod, React Hook Form, Vercel AI SDK, react-markdown installed (Zod used for form validation)
- Landing page at `/` via `(marketing)` route group — PitchForm client island + createSession server action
- Middleware: Supabase session refresh on every request
- Cookie `enhanced_anon_id` (httpOnly, 30-day TTL) links browser to anonymous session

### What does NOT exist yet
- No authentication flow (login page, auth callback, deferred-auth)
- No wizard UI (`/session/[id]` route does not exist — redirect from landing 404s)
- No AI integration (prompts, tool calling)
- No MCP connections
- No PostHog tracking setup

---

## Routes

| Route | Type | Auth | Description |
|-------|------|------|-------------|
| `/` | Page (SSR) | Public | Landing page — PitchForm → createSession → redirect `/session/[id]` |

### Data flow: Landing → Session

```
Browser GET /
  → (marketing)/page.tsx (Server Component: header, headline, PitchForm island)
  → pitch-form.tsx (Client: textarea + CTA, client-side Zod validation)
  → createSession() Server Action
      1. Validate via rawIdeaSchema (Zod, min 20 / max 5000 chars)
      2. Generate anonymousId (crypto.randomUUID())
      3. INSERT sessions (anonymous_id, raw_idea, step=1, status=active)
      4. INSERT prds (session_id, title='', is_public=false)
      5. Set cookie enhanced_anon_id (httpOnly, 30d)
      6. redirect(/session/{id})
```

---

## Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` + Vercel | Supabase project endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` + Vercel | Supabase anonymous JWT (public, RLS-protected) |

Both are `NEXT_PUBLIC_` — safe to expose. The `service_role` key is NOT stored anywhere in the codebase.

---

## Cross-Cutting Invariants

> **Invariant — Supabase env vars must match across local and Vercel**
> - **What:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be identical in `.env.local`, Vercel Production, and Vercel Preview (staging branch).
> - **Where:** `.env.local`, Vercel env vars (Production + Preview/staging).
> - **Breaks if:** they differ → auth fails silently, API calls go to wrong project or return 401.

> **Invariant — Middleware must refresh Supabase session**
> - **What:** `src/middleware.ts` calls `updateSession()` on every request to keep the auth cookie fresh.
> - **Where:** `src/middleware.ts` → `src/lib/supabase/middleware.ts`.
> - **Breaks if:** middleware is removed or bypassed → session expires mid-navigation, user gets logged out randomly.

> **Invariant — .ai-context must be updated in every commit that changes code**
> - **What:** Any commit that modifies routes, data flows, modules, services, or invariants must include matching `.ai-context/` updates.
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
