# Security Overview — \<Initiative name\>

> **Consolidated security model.** This document merges all security concerns that span multiple
> features into a single reference. Feature-level `security.md` files handle feature-specific
> details; this document covers the **system-wide** security posture: authentication architecture,
> the complete RLS matrix, the threat model, data privacy, and secrets management.
>
> Write this alongside or after `architecture.md`. Security decisions here take precedence over
> feature-level security docs when they conflict.

**Status:** `Draft` · `In review` · `Approved` · **Author:** \<name\> · **Date:** \<date\>
**Architecture:** [`architecture.md`](architecture.md)  ·  **PRD:** [`prd.md`](prd.md)

---

## 1. Security Model Overview

\<One paragraph: the initiative's security posture and design principles (e.g., defense in depth,
minimal data collection, server-first).\>

## 2. Authentication Architecture

### Auth State Machine

\<Diagram or table of auth states, transitions, and what each state allows.\>

### Session / Token Management

\<Cookie configuration (name, flags, TTL), JWT handling, session lifecycle.\>

### Third-Party Auth

\<OAuth providers, magic link, SSO — whatever the initiative uses.\>

> 🔍 **Challenge:** Is there a state where a user has partial access that could be exploited?
> Are all transitions atomic and non-reversible?

## 3. Row Level Security — Complete Matrix

| Table | Policy | Operation | Condition | Notes |
|-------|--------|-----------|-----------|-------|
| \<…\> | \<…\> | \<…\> | \<…\> | \<…\> |

\<List every RLS policy on every table. This is the definitive reference — feature-level docs
should not redefine these.\>

> 🔍 **Challenge:** Does every table have RLS enabled? Is there any table where a missing policy
> could leak data? Are anonymous access patterns explicitly documented?

## 4. Threat Model

| ID | Threat | Likelihood | Impact | Mitigation | Status |
|----|--------|-----------|--------|------------|--------|
| \<…\> | \<…\> | \<…\> | \<…\> | \<…\> | Mitigated / Accepted / Open |

> 🔍 **Challenge:** What is the worst-case scenario if the most likely threat succeeds? Is there
> a mitigation for it, or is it an accepted risk?

## 5. API Security

\<Rate limiting strategy, input validation, CORS, content-type enforcement. Per-endpoint auth
requirements table.\>

## 6. Data Privacy & GDPR

\<PII inventory, data residency, retention policy, right to deletion, cookie consent, data
processing basis.\>

## 7. Environment Variables & Secrets

| Variable | Sensitivity | Runtime | Description |
|----------|------------|---------|-------------|
| \<…\> | Public / Secret | Server / Client | \<…\> |

> 🔍 **Challenge:** Is any secret exposed to the client (via `NEXT_PUBLIC_` or bundled JS)?
> Is the service role key used only where absolutely necessary?

## 8. Security Checklist (Pre-Launch)

\<Checkable items to verify before shipping. Cover: RLS, cookies, secrets, rate limiting, content
sanitization, auth flows, data exposure.\>

- [ ] \<…\>
