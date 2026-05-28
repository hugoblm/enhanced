# \<Initiative name\>

> One-screen overview of this initiative. A reader should grasp what it is, where it stands, and
> which features it contains — without opening anything else.

**Status:** `Discovery` · `Specced` · `In progress` · `Shipped` · `On hold`
**Owner:** \<name\> · **Last updated:** \<date\>
**Discovery:** \<link to the validated discovery that justified this initiative — `../discovery_{name}/<need>.md`\>

## In one paragraph

\<What is this initiative, who is it for, and what need does it address? 3–4 sentences max.\>

## Documents

| Doc | What's inside |
|-----|---------------|
| [`executive-summary.md`](executive-summary.md) | The 2-minute TL;DR for stakeholders |
| [`prd.md`](prd.md) | Full product spec + the need → features breakdown |
| [`architecture.md`](architecture.md) | Cross-cutting technical architecture (DB, API, components, AI, state, auth, deployment) |
| [`security-overview.md`](security-overview.md) | Consolidated security model (auth, RLS, threats, GDPR, secrets) |

## Feature index

The features this initiative breaks down into (mirror the PRD's Feature breakdown). Keep statuses
honest.

| Feature | Priority | Status | Folder |
|---------|----------|--------|--------|
| \<feature name\> | `MUST` / `COULD` | `Planned` / `In progress` / `Shipped` | [`features/<feature-name>/`](features/) |

## Current state / next step

\<What's done, what's blocking, what happens next.\>
