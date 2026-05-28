# Architecture — \<Initiative name\>

> **Cross-cutting technical architecture.** This document is the **single source of truth** for all
> technical decisions that span multiple features. When a feature-level spec conflicts with this
> document, **this document wins** — update the feature spec to match.
>
> Write this after the PRD's feature breakdown is done. It consolidates: database schema, API surface,
> component architecture, AI/integration strategy, state management, authentication flows, deployment,
> and cross-cutting concerns (observability, performance, accessibility).

**Status:** `Draft` · `In review` · `Approved` · **Author:** \<name\> · **Date:** \<date\>
**PRD:** [`prd.md`](prd.md)  ·  **Security:** [`security-overview.md`](security-overview.md)

---

## How to use this template

- **Write it once the feature breakdown exists.** The architecture consolidates decisions that
  feature specs will reference — write it before or alongside the feature tech specs.
- **Resolve conflicts here.** If two features define the same table/route/component differently,
  pick one canonical version and document the resolution.
- **Keep a conflict resolution log.** Section 12 tracks every conflict found and resolved. This
  is institutional memory — future readers need to know what was decided and why.
- **Update it when architecture changes.** If a feature implementation deviates from this document,
  update both the feature spec and this document. A stale architecture doc is worse than none.

---

## 1. Overview

\<One paragraph: what the system is and what the architecture optimizes for.\>

## 2. System Architecture Diagram

\<ASCII or Mermaid diagram showing the main components and their relationships.\>

## 3. Database Schema

### Tables

\<For each table: exact CREATE TABLE SQL, indexes, RLS policies, triggers. Include all tables in
the system, not just the ones "owned" by a specific feature.\>

### Entity Relationships

\<FK chains, cardinality, cascade rules.\>

### Migration Ordering

\<Numbered list of migrations in execution order. Each migration states what it creates and what
it depends on.\>

### Enums, State Machines & Constants

\<Status enums, step progressions, block types, evidence tags — anything that multiple features
reference.\>

> 🔍 **Challenge:** Is every table's schema defined in exactly one place (this document)? Do
> feature-level data-model.md files reference this doc rather than redefining the schema?

## 4. API Surface

### Route Map

| Method | Path | Auth | Rate Limit | Purpose |
|--------|------|------|------------|---------|
| \<…\> | \<…\> | \<…\> | \<…\> | \<…\> |

### Server Actions

| Action | Signature | Auth | Purpose |
|--------|-----------|------|---------|
| \<…\> | \<…\> | \<…\> | \<…\> |

### Conventions

\<Streaming strategy, error response format, status codes, validation approach.\>

> 🔍 **Challenge:** Are there any routes with overlapping paths or conflicting auth models?

## 5. Component Architecture

### File Tree

\<Complete planned `src/` structure with every file.\>

### Server / Client Boundaries

| Component | Type | Rationale |
|-----------|------|-----------|
| \<…\> | Server / Client | \<…\> |

### Component Hierarchy

\<ASCII tree of the main interactive page (e.g., the wizard).\>

> 🔍 **Challenge:** Is every component defined in exactly one feature? Are shared components
> (used by multiple features) identified and placed in a shared location?

## 6. AI Integration Architecture

\<Provider setup, tool definitions (canonical schemas), prompt architecture, model configuration
(model, temperature, max_tokens), streaming approach, cost estimation.\>

> 🔍 **Challenge:** Are tool schemas identical everywhere they appear? Is the model config
> consistent (or intentionally different with documented rationale)?

## 7. State Management

\<Where each type of state lives (DB, Zustand, AI SDK, URL). Store interface. Sync strategy.\>

## 8. Authentication & Session Flow

\<Complete auth lifecycle. Cookie config. Session claiming. Auth state machine.\>

## 9. Data Flows

\<End-to-end flows for the main user journeys. Each flow: trigger → steps → data touched → result.\>

## 10. Deployment Architecture

\<Hosting, CI/CD, environment variables (complete list with sensitivity), domain config.\>

## 11. Cross-Cutting Concerns

\<Observability (events/metrics inventory), error handling, performance targets, accessibility.\>

## 12. Conflict Resolution Log

\<Table of conflicts found between feature specs, the canonical decision, and which specs need
updating. This section is institutional memory.\>

| # | Conflict | Features | Resolution | Specs to update |
|---|----------|----------|------------|-----------------|
| \<…\> | \<…\> | \<…\> | \<…\> | \<…\> |

> 🔍 **Challenge:** Are all conflicts resolved? Is every feature spec consistent with this
> document? Run a cross-reference check before marking this as Approved.
