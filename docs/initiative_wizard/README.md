# Enhanced Wizard V1

> One-screen overview of this initiative. A reader should grasp what it is, where it stands, and
> which features it contains — without opening anything else.

**Status:** `Specced`
**Owner:** Hugo · **Last updated:** 2026-05-27
**Discovery:** [`../discovery_wizard/enhanced-wizard-v1.md`](../discovery_wizard/enhanced-wizard-v1.md)

## In one paragraph

Enhanced V1 is a conversational wizard that guides product teams through structured hypothesis validation before building. It addresses the gap between AI-accelerated development speed and the lack of rigorous product decision-making. Targeting PMs at startups and scale-ups, it produces a transparent draft PRD that separates evidence from assumptions — so teams know exactly what they know, what they don't, and what they need to prove before writing the first line of code. V1 is scoped for a webinar demo in front of PMs.

## Documents

| Doc | What's inside |
|-----|---------------|
| [`executive-summary.md`](executive-summary.md) | The 2-minute TL;DR for stakeholders |
| [`prd.md`](prd.md) | Full product spec + the need → features breakdown |
| [`architecture.md`](architecture.md) | Cross-cutting technical architecture — source of truth (DB, API, components, AI, state, auth, deployment) |
| [`security-overview.md`](security-overview.md) | Consolidated security model (auth, RLS matrix, threats, GDPR, secrets) |

## Feature index

| Feature | Priority | Status | Folder |
|---------|----------|--------|--------|
| Landing Page | `MUST` | `Planned` | [`features/landing-page/`](features/landing-page/) |
| Deferred Auth | `MUST` | `Planned` | [`features/deferred-auth/`](features/deferred-auth/) |
| Wizard Shell | `MUST` | `Planned` | [`features/wizard-shell/`](features/wizard-shell/) |
| Conversation Engine | `MUST` | `Planned` | [`features/conversation-engine/`](features/conversation-engine/) |
| PRD Live Builder | `MUST` | `Planned` | [`features/prd-live-builder/`](features/prd-live-builder/) |
| Block Refinement | `MUST` | `Planned` | [`features/block-refinement/`](features/block-refinement/) |
| PRD Versioning | `COULD` | `Planned` | [`features/prd-versioning/`](features/prd-versioning/) |
| PDF Export | `MUST` | `Planned` | [`features/pdf-export/`](features/pdf-export/) |
| Public Sharing | `MUST` | `Planned` | [`features/public-sharing/`](features/public-sharing/) |

## Current state / next step

Discovery validated (Go). PRD and feature breakdown specced. All 9 feature folders created. Next step: begin implementation starting with database migrations and auth flow.
