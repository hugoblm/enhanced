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
1. DISCOVERY        2. GATE        3. INITIATIVE                  4. FEATURES               5. DELIVERY
   discovery.md ─►  Go/No-Go  ─►   docs/initiative_{name}/    ─►  features/<feature>/   ─►  specs + tests
   "should we?"     decision       PRD: need → features           one per capability        "what & how"
```

1. **Discovery** — Start from `docs/template/discovery.md` (the FOCUSED framework). Its job is to
   **challenge and verify the need**: is the problem real, evidenced, worth solving? It ends with
   an explicit **Go / No-Go / Pivot** decision. Discoveries live in `docs/discovery_{name}/`.
2. **Gate** — Only a **Go** unlocks the next stage. A No-Go is a *successful* discovery: it saved
   us from building the wrong thing (and stays in `docs/discovery_{name}/` as memory).
3. **Initiative** — On Go, create `docs/initiative_{name}/` by copying `docs/template/_initiative/`.
   The **PRD lives here**, and its *Feature breakdown* section translates the need into named,
   prioritized features. See `docs/template/initiative-rules.md` for the mandatory structure.
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
    ├── discovery_{name}/     # One folder per initiative's discovery (incl. No-Go memory)
    │   └── <need>.md
    ├── initiative_{name}/    # One folder per initiative; each holds a PRD + its features
    └── template/             # Reusable, copy-ready templates
        ├── discovery.md      # FOCUSED discovery
        ├── discovery-rules.md    # Discovery stage rules
        ├── initiative-rules.md   # Initiative & feature rules
        ├── prd.md            # PRD template
        ├── user-stories.md   # User stories + JTBD
        └── _initiative/      # Copy this to start a new initiative
```

---

## Technology Stack

> 🚧 **V1 demo deviates from this table on persistence and auth.**
> No Supabase, no auth: persistence is client-only Dexie. See
> [`docs/initiative_wizard/decisions.md`](docs/initiative_wizard/decisions.md).

| Area | Stack | Runtime | Notes |
|------|-------|---------|-------|
| Framework | Next.js 16 (App Router) | Node 22 | TypeScript strict |
| UI | shadcn/ui + Tailwind CSS v4 | — | Geist font (local via `geist` package) |
| Persistence (V1 demo) | Dexie (IndexedDB) | Browser | `src/lib/db/dexie.ts`, single `sessions` table |
| Auth (V1 demo) | None | — | `deferred-auth` feature shelved post-démo |
| Database + Auth (long-term target) | Supabase (Postgres + Magic Link) | — | RLS enforced, `@supabase/ssr` — re-introduced post-démo |
| AI | Vercel AI SDK + OpenRouter | — | `ai`, `@ai-sdk/mcp`, `@openrouter/ai-sdk-provider` |
| Validation | Zod + React Hook Form | — | Shared schemas client/server |
| State | Zustand | — | Wizard in-session state, hydrated from Dexie |
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

### Never commit or push without explicit approval
- **Never commit** without showing the diff and getting user approval first.
- **Never push** without showing the branch log/diff and getting user approval first.
- Each is a separate approval — approving a commit does not approve a push.

### Branches
- `main` — production.
- `staging` — development/integration.
- **Feature branches** — Branch from `staging` (e.g. `feat/<name>`, `fix/<name>`). Never commit
  new features directly to `staging`. Merge back after review/testing.

### Commits
- Descriptive messages, focused on **why** rather than what.
- One logical change per commit where practical.
- Always show `git diff --staged` and ask for approval before committing.

---

## Documentation Architecture

Two doc systems live side by side and must not be confused:

| System | Question it answers | Lives in | Audience |
|--------|---------------------|----------|----------|
| **`docs/`** | *Why* are we building this? What is the spec? | `docs/discovery_{name}/`, `docs/initiative_{name}/`, `docs/template/` | Product + engineering + agents |
| **`.ai-context/`** | What is the **current code state** an agent must respect? | `.ai-context/` | AI agents (and engineers) |

- `docs/discovery_{name}/` holds the **need qualification** (FOCUSED) — including the No-Go decisions.
- `docs/initiative_{name}/` is the **planning + spec** record: a PRD that breaks the need into
  features, and a folder per feature (stories, tests, UX, tech spec). It describes intent.
- `.ai-context/` describes **reality** — how the code actually works right now and which
  invariants break if you touch the wrong thing. When code and `.ai-context` disagree, the code
  is right and `.ai-context` must be fixed.

See `docs/template/initiative-rules.md` for the exact structure every initiative/feature must follow,
`docs/template/discovery-rules.md` for the discovery stage, and `docs/template/README.md` for how to start.

---

## AI Context Documentation

> **NON-NEGOTIABLE.** `.ai-context/` is the primary context for all AI development agents.
> Violations of these rules produce regressions, stale docs, and broken invariants.

The `.ai-context/` directory documents the **current code state** — what the code actually does
today and which invariants break if you touch the wrong thing. `README.md` is the navigation
map + cross-cutting invariants. Each additional file covers one domain.

### Before ANY development
- **READ** `.ai-context/README.md` first, then the relevant domain file(s).
- Do this automatically, without waiting to be asked. No exceptions.

### Before ANY commit
- **VERIFY** that `.ai-context/` still matches the code you changed.
- If your changes affect a data flow, module, route, service, tool, or invariant → **update
  the matching `.ai-context/*.md` in the same commit**. Not after. Not later. Same commit.

### Before ANY push
- **RE-READ** every `.ai-context/` file you touched and confirm it reflects the actual code.
- `.ai-context/` must **always** be up to date on every pushed commit. A stale `.ai-context/`
  on a pushed branch is a bug.

### General rules
- When code and `.ai-context/` disagree → the code is right. Fix the doc immediately.
- **Relation to `docs/`** — `docs/` = intent & history (specs, planning). `.ai-context/` =
  current reality. For *implementation* context, always prefer `.ai-context/`.
- Adding a new domain? Create `<domain>.md` and add a row to the File Map in `README.md`.

---

## Backlog (Notion)

The product backlog is the **single source of truth** for all planned work — features, bugs, and improvements. It lives in Notion at:

- **Page**: `Enhanced Backlog`
- **Page ID**: `36d12d2f-a613-803f-8be9-d480004e579f`
- **Data source**: `collection://36d12d2f-a613-80ff-9bcc-000bc9f23f7c`

### Rules

1. **When to add items**: Add backlog entries when discovering bugs, identifying improvements, or when the user explicitly asks. If a task surfaces during implementation that is out of scope, add it to the backlog rather than doing it immediately.
2. **Always specify the Type**: Every item must be tagged as `Bug` or `Feature` — no exceptions.
3. **Deduplicate before creating**: Before adding a new item, search the backlog (via `notion-search` with `data_source_url`) to check if a similar item already exists in `Not started` or `In progress` status. If a match exists, update it instead of creating a duplicate.
4. **Always update Status after fixing**: When a backlog item is implemented and merged, immediately update its `Status` to `Done` (or `Staging` if merged on `staging` but not yet on `main`). When picking a ticket up, flip it to `In progress`. The Notion status must reflect reality — a stale `Not started` on a fixed ticket leads to duplicate work and incorrect quick-win audits.

### Schema

| Property | Type | Values |
|----------|------|--------|
| Name | title | Free text |
| Type | select | `Feature`, `Bug` |
| Priority | select | `High 🔥`, `Medium ✨`, `Low 🤞` |
| Status | status | `Not started`, `In progress`, `Staging`, `Done`, `Archive` |
| Assign | person | User IDs |
| Effort | number | Fibonacci (1, 2, 3, 5, 8, 13, 21) |
| TAG | multi_select | Free tags |

---

**Last updated:** 2026-05-27  ·  **Maintained by:** Hugo
