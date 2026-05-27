# AI Context — Navigation & Cross-Cutting Invariants

> **Read this file first, then only the domain file relevant to your task.**
> This directory documents the **current code state** for AI agents — what the code actually
> does today and which invariants break if you touch the wrong thing. It is not a planning doc
> (that's `docs/`). When the code and this directory disagree, the code is right — fix the doc.

> _Last verified: \<date\> against branch `\<branch\>`._

---

## File Map

As the codebase grows, add one file per domain and register it here. Keep each file concise and
keyword-rich so an agent can find the right one fast.

| File | Scope | Keywords |
|------|-------|----------|
| `README.md` | Navigation + cross-cutting invariants | **always read first** |
| _`<domain>.md`_ | _TO BE FILLED — e.g. `auth.md`, `data-model.md`, `api.md`_ | _searchable terms_ |

<!-- Example rows, for reference (delete once real domains exist):
| `auth.md`       | Login, sessions, tokens, permissions | OAuth, JWT, session, RBAC, guards |
| `data-model.md` | Schema, migrations, entities         | tables, migrations, relations, indexes |
| `api.md`        | Endpoints, contracts, validation     | routes, DTOs, Zod, errors, pagination |
-->

---

## Cross-Cutting Invariants

These are **coupling points**: places where two parts of the system must agree. Breaking one
side without updating the other causes bugs that are hard to trace. Document each one as it
appears, in this exact shape:

> **Invariant — \<short name\>**
> - **What:** the rule that must hold.
> - **Where:** every file/place that participates.
> - **Breaks if:** what goes wrong when the sides drift apart.

<!-- TO BE FILLED. Real examples to model yours on:

> **Invariant — Shared secret between services**
> - **What:** `INTERNAL_API_SECRET` is identical in service A and service B.
> - **Where:** `service-a/.env`, `service-b/.env`.
> - **Breaks if:** they differ → service-to-service calls 401.

> **Invariant — Schema version**
> - **What:** bump the local DB schema version on every table/index change; never reuse a number.
> - **Where:** `lib/db.ts` (version constant) + migration files.
> - **Breaks if:** version not bumped → clients keep a stale schema, writes fail silently.

> **Invariant — Plan/limits defined in one place**
> - **What:** plan limits are authored once and consumed everywhere.
> - **Where:** `config/plans.ts` (source of truth) + any UI/feature gate that reads them.
> - **Breaks if:** a limit is hard-coded elsewhere → UI and backend disagree on entitlements.
-->

---

## Maintenance Rules

Keeping this directory true is part of the work, not an afterthought:

- **After changing a data flow** → update the matching domain file.
- **After adding/removing a module, route, service, or tool** → update the relevant domain file
  and, if it's a new domain, add a row to the File Map above.
- **After changing a cross-cutting invariant** → update the Invariants section here.
- **Verify, don't assume** — when you touch a domain, re-read its file and correct anything that
  no longer matches the code. Update the `Last verified` date at the top.

---

## Why this exists (for newcomers)

An agent (or a new engineer) that reads `CLAUDE.md` then this file should be able to make a safe
change without re-deriving the whole system. The goal is **fewer regressions**: most bugs from
AI-assisted changes come from breaking an invariant nobody wrote down. Writing them down here is
the fix.
