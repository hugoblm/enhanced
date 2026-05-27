# Executive Summary — Enhanced Wizard V1

> The TL;DR for stakeholders. Non-technical, **2-minute read**. If someone only reads this page,
> they should understand the need, what we're doing, the value, and the status. No jargon.

**Status:** Specced · **Owner:** Hugo · **Date:** 2026-05-27

## The need

AI lets product teams build 10x faster — but not 10x better. The decision to build a feature remains the least rigorous step in the product process: it's born from conversations, gut feelings, and sales requests, never formally challenged before code is written. The real cost isn't just the sprint — it's permanent maintenance, UX confusion, missed opportunities, and the political impossibility of ever reverting a shipped feature. `[Evidence]`

## What we're doing

Enhanced is a conversational wizard that walks PMs through structured hypothesis validation in four steps: problem framing, data validation, risk challenge, and draft PRD. A split-view interface shows the AI conversation on the left and the PRD assembling in real time on the right — so the thinking and the artifact stay connected. The result is an export-ready PRD that was stress-tested before a single line of code is written.

## Why it matters (value)

- **For users:** PMs get a repeatable, evidence-based process that turns "I think we should build this" into a validated decision — in minutes, not days. They ship fewer bad features and can defend every build decision with a structured artifact.
- **For the business:** Enhanced positions itself as the pre-build quality gate for AI-accelerated teams. V1 targets a webinar demo in front of PMs — converting attendees into early adopters through signups and publicly shared PRDs. `[Assumption]`

## What success looks like

- **North Star:** number of bad features NOT built (features that would have been built without the validation step but were stopped or pivoted after going through Enhanced). `[Assumption]`
- **Webinar metric (launch guardrail):** signup count + number of public PRDs shared within 48 hours of the demo. `[Assumption]`

## Scope at a glance

- **In:** 4-step wizard flow, split-view (conversation + live PRD), AI conversation with structured cards, block-level refinement, PDF export, public sharing via link, deferred magic-link authentication, basic versioning (COULD — included if timeline permits)
- **Out:** MCP analytics connections, living-document mode, Linear/Jira push, WYSIWYG editing

## Status & next step

The initiative is **specced** — discovery is validated, the PRD and feature breakdown are defined. Next step: begin implementation of the core wizard flow on a feature branch from `staging`.

---

*Full detail and the feature breakdown: see [`prd.md`](prd.md). Decision trail: see the linked Discovery in the [initiative README](README.md).*
