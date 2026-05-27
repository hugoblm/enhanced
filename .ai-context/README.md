# AI Context — Navigation & Cross-Cutting Invariants

> **Read this file first, then only the domain file relevant to your task.**
> This directory documents the **current code state** for AI agents — what the code actually
> does today and which invariants break if you touch the wrong thing. It is not a planning doc
> (that's `docs/`). When the code and this directory disagree, the code is right — fix the doc.

> _Last verified: 2026-05-27 against branch `staging`._

---

## File Map

| File | Scope | Keywords |
|------|-------|----------|
| `README.md` | Navigation + cross-cutting invariants | **always read first** |
| `stack.md` | Tech stack, dependencies, env vars, deploy | Next.js, Supabase, Vercel, OpenRouter, Tailwind |

---

## Current Architecture

```
Browser → Next.js (Vercel) → Supabase (Postgres + Auth)
                ↕
          OpenRouter (AI, future)
                ↕
          MCP servers (PostHog/Mixpanel/Amplitude, future)
```

**Status: Scaffolded, no features implemented.**

### What exists
- Next.js 16 App Router with TypeScript strict
- Supabase client (browser + server + middleware) — Magic Link auth configured, no tables yet
- shadcn/ui initialized (Button component only)
- Zustand, Zod, React Hook Form, Vercel AI SDK, react-markdown installed but not used
- Single page: `/` (landing placeholder)
- Middleware: Supabase session refresh on every request

### What does NOT exist yet
- No database tables / migrations / RLS policies
- No authentication flow (login page, auth callback)
- No wizard UI
- No AI integration (prompts, tool calling)
- No MCP connections
- No PostHog tracking setup

---

## Routes

| Route | Type | Auth | Description |
|-------|------|------|-------------|
| `/` | Page (SSG) | Public | Landing placeholder |

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
