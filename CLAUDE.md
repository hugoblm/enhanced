# CLAUDE.md

This file provides guidance to Claude (and any AI coding agent) when working in this
repository. It is the **first thing an agent should read**. Keep it accurate — a stale
CLAUDE.md is worse than none, because agents trust it.

> **Status:** Scaffolded. Stack is installed and configured. No features implemented yet.
> The product-documentation workflow (Discovery → PRD → Feature) is **already in force**.

---

## Project Overview

**Enhanced** is a structured wizard that guides product teams through hypothesis validation
before building — so they know exactly what they know, what they don't, and what they need
to prove before writing the first line of code.

Its guiding principles are **rigor over speed**, **evidence over opinion**, and **simplicity**.

---

## How We Build Product (read this first)

This repo is **documentation-first**. Nothing gets built before its need is qualified and written
down. The flow is a funnel, and each stage gates the next. It has **three levels** because a PRD
scopes an *initiative* and breaks it into *features* — it's almost never about a single feature:

```
1. DISCOVERY        2. GATE        3. INITIATIVE                4. FEATURES               5. DELIVERY
   discovery.md ─►  Go/No-Go  ─►   docs/initiative/<name>/  ─►  features/<feature>/   ─►  specs + tests
   "should we?"     decision       PRD: need → features         one per capability        "what & how"
```

1. **Discovery** — Start from `docs/template/discovery.md` (the FOCUSED framework). Its job is to
   **challenge and verify the need**: is the problem real, evidenced, worth solving? It ends with
   an explicit **Go / No-Go / Pivot** decision. Discoveries live in `docs/discovery/`.
2. **Gate** — Only a **Go** unlocks the next stage. A No-Go is a *successful* discovery: it saved
   us from building the wrong thing (and stays in `docs/discovery/` as memory).
3. **Initiative** — On Go, create `docs/initiative/<name>/` by copying `docs/template/_initiative/`.
   The **PRD lives here**, and its *Feature breakdown* section translates the need into named,
   prioritized features. See `docs/initiative/README.md` for the mandatory structure.
4. **Features** — Each feature from that breakdown gets a folder under `features/<feature-name>/`
   with its own delivery docs (stories, Gherkin, manual tests, UX/a11y, tech spec, release/test
   plan). Stories are a **list inside** `user-stories-and-jtbd.md`, not folders.
5. **Delivery** — The technical specs detail *how*; the PRD gate **requires the validated discovery
   to be linked** — no orphan specs.

**The golden rule for agents:** never jump to a solution before the need is verified. If you
cannot point to evidence for the problem, say so and ask — do not invent it.

---

## Repository Structure

```
enhanced/
├── CLAUDE.md                 # This file — agent entry point
├── .ai-context/              # Concise docs of the CURRENT code state, for AI agents
│   └── README.md             # Navigation map + cross-cutting invariants + maintenance rules
├── src/
│   ├── app/                  # Next.js App Router pages and layouts
│   │   ├── layout.tsx        # Root layout (Geist font, metadata)
│   │   ├── page.tsx          # Landing page
│   │   └── globals.css       # Tailwind v4 imports + shadcn/ui theme
│   ├── components/
│   │   └── ui/               # shadcn/ui components (added via `npx shadcn@latest add`)
│   ├── lib/
│   │   ├── supabase/         # Supabase client (browser, server, middleware)
│   │   └── utils.ts          # cn() helper
│   ├── stores/               # Zustand stores
│   └── middleware.ts          # Next.js middleware (Supabase session refresh)
├── supabase/                  # Supabase local config + migrations
├── public/                    # Static assets
└── docs/
    ├── discovery/            # Qualification stage — one file per need (incl. No-Go memory)
    │   └── README.md
    ├── initiative/           # One folder per initiative; each holds a PRD + its features
    │   └── README.md
    └── template/             # Reusable, copy-ready templates
        ├── discovery.md      # FOCUSED discovery
        ├── prd.md            # PRD template
        ├── user-stories.md   # User stories + JTBD
        └── _initiative/      # Copy this to start a new initiative
```

---

## Technology Stack

| Area | Stack | Runtime | Notes |
|------|-------|---------|-------|
| Framework | Next.js 16 (App Router) | Node 22 | TypeScript strict |
| UI | shadcn/ui + Tailwind CSS v4 | — | Geist font (local via `geist` package) |
| Database + Auth | Supabase (Postgres + Magic Link) | — | RLS enforced, `@supabase/ssr` |
| AI | Vercel AI SDK + OpenRouter | — | `ai`, `@ai-sdk/mcp`, `@openrouter/ai-sdk-provider` |
| Validation | Zod + React Hook Form | — | Shared schemas client/server |
| State | Zustand | — | Wizard in-session state |
| Analytics | PostHog | — | `posthog-js` + `posthog-node` |
| Deploy | Vercel | — | Preview deploys enabled |
| CI/CD | GitHub Actions | — | |

---

## Common Commands

```bash
npm install            # install dependencies
npm run dev            # start dev server (localhost:3000)
npm run build          # production build
npm run lint           # ESLint check
npx shadcn@latest add  # add a shadcn/ui component (e.g. `npx shadcn@latest add card`)
npx supabase gen types typescript --local > src/lib/supabase/types.ts  # regenerate DB types
```

---

## Code Conventions

### General Principles
- **Simplicity** — Prefer simple, maintainable, robust code over clever code.
- **Follow existing patterns** — Match the surrounding code; check a similar file before writing a new one.
- **No over-engineering** — Make only the changes requested or clearly necessary. If something
  out of scope surfaces, note it (see *Backlog* below) rather than doing it now.
- **Security by default** — No command injection, XSS, or SQL injection. Validate inputs.
- **Comment the _why_, not the _what_** — A comment should carry information a future reader
  can't get from the code: a non-obvious constraint, a subtle invariant, a link to a fix.
  Skip restating the code, version bumps, and before/after recaps — that belongs in the commit.

### TypeScript
- **Strict mode** — `strict: true` in tsconfig. No `any` unless absolutely necessary.
- **Imports** — Use `@/` path alias (maps to `src/`).
- **Components** — React function components, no class components.
- **shadcn/ui** — Add components via CLI (`npx shadcn@latest add`), don't copy-paste manually.
- **Supabase** — Use `createClient()` from `@/lib/supabase/client` (browser) or `@/lib/supabase/server` (server).

---

## Git Workflow

### Never push without an explicit request
- **Never push to a remote** unless the user explicitly asks.
- Always ask before pushing.

### Branches
- `main` — production.
- `staging` — development/integration.
- **Feature branches** — Branch from `staging` (e.g. `feat/<name>`, `fix/<name>`). Never commit
  new features directly to `staging`. Merge back after review/testing.

### Commits
- Descriptive messages, focused on **why** rather than what.
- One logical change per commit where practical.

---

## Documentation Architecture

Two doc systems live side by side and must not be confused:

| System | Question it answers | Lives in | Audience |
|--------|---------------------|----------|----------|
| **`docs/`** | *Why* are we building this? What is the spec? | `docs/discovery/`, `docs/initiative/`, `docs/template/` | Product + engineering + agents |
| **`.ai-context/`** | What is the **current code state** an agent must respect? | `.ai-context/` | AI agents (and engineers) |

- `docs/discovery/` holds the **need qualification** (FOCUSED) — including the No-Go decisions.
- `docs/initiative/<name>/` is the **planning + spec** record: a PRD that breaks the need into
  features, and a folder per feature (stories, tests, UX, tech spec). It describes intent.
- `.ai-context/` describes **reality** — how the code actually works right now and which
  invariants break if you touch the wrong thing. When code and `.ai-context` disagree, the code
  is right and `.ai-context` must be fixed.

See `docs/initiative/README.md` for the exact structure every initiative/feature must follow,
`docs/discovery/README.md` for the discovery stage, and `docs/template/README.md` for how to start.

---

## AI Context Documentation

> **MANDATORY:** Before starting ANY plan, implementation, or non-trivial change, read
> `.ai-context/README.md` first, then the relevant domain file(s). Do this automatically,
> without waiting to be asked. Skipping it leads to regressions and broken invariants.

The `.ai-context/` directory holds concise documentation of the **current code state**, written
for AI agents. `README.md` is the navigation map plus the cross-cutting invariants (coupling
points that, if broken on one side without the other, cause bugs). Each additional file (added
as the codebase grows) covers one domain.

### Maintenance Rules
- **After changing a data flow** → update the matching `.ai-context/*.md`.
- **After adding/removing a module, route, service, or tool** → update the relevant domain file.
- **After changing a cross-service invariant** → update `.ai-context/README.md`.
- **Relation to `docs/`** — `docs/` = intent & history (specs, planning). `.ai-context/` =
  current reality. For *implementation* context, prefer `.ai-context/`.

---

## Backlog

Out-of-scope findings go in the PR description, not in code changes.

---

**Last updated:** 2026-05-27  ·  **Maintained by:** Hugo
