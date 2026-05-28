# User Stories & JTBD — Deferred Auth

> Captures **who** needs **what** and **why**. Pairs with the PRD. Stories drive the Gherkin
> acceptance tests (`gherkin-tests.md`) -- each story maps to at least one scenario.

**Evidence discipline:** tag the rationale of a story `[Evidence]` / `[Assumption]` / `[To verify]`.
A story with no evidence and no link to a verified problem is a candidate for cutting.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Jobs To Be Done (JTBD)

The underlying jobs users are "hiring" this feature to do. Job statements are solution-agnostic.

- **Main job:** When I have a feature idea and want to validate it quickly, I want to start working immediately without creating an account, so I can judge the tool's value before committing my identity.

- **Related jobs:**
  - When I've invested effort in a validation session, I want my work to be saved permanently, so I can return to it later and share it with my team.
  - When I'm prompted to sign up mid-flow, I want the process to be instant and non-disruptive, so I don't lose my train of thought or my progress.

---

## Personas (quick reference)

- **Builder PM** -- PM at startup/scale-up, ships fast, tech-savvy, time-constrained. Uses the wizard directly. PRODUCER.
- **Stakeholder** -- CPO/CEO/lead who reviews PRDs. Does not interact with auth directly, but benefits from session persistence enabling sharing. CONSUMER.

---

## User stories

### US-DA-1 -- Start wizard without signup

- **Story:** As a **Builder PM**, I want to start the wizard and begin my validation conversation without creating an account, so that I can experience the product's value before deciding to invest my email.
- **Priority:** `MUST`
- **Why (rationale):** Discovery frameworks fail because of upfront friction. Forcing signup before demonstrating value replicates the exact adoption barrier Enhanced exists to eliminate. `[Evidence]` -- validated in Discovery (Problem 3: "overhead kills adoption"). The 80% feature non-adoption rate (Pendo 2019) means PMs are already skeptical of new tools; any signup wall increases bounce risk.
- **Acceptance criteria:**
  - [ ] PM can navigate to the landing page, enter an idea, and reach the wizard without providing an email or any credentials
  - [ ] An `anonymous_id` (UUID v4) is generated and stored in an httpOnly, secure, SameSite=Lax cookie
  - [ ] A `sessions` row is created with `anonymous_id` set and `user_id` null
  - [ ] The PM can send messages and receive AI responses in the wizard during the anonymous session
  - [ ] No authentication UI (login, signup) is visible before the auth trigger point
- **Maps to Gherkin:** `gherkin-tests.md` --> SC-DA-01, SC-DA-02

### US-DA-2 -- Receive auth prompt at the right moment

- **Story:** As a **Builder PM**, I want to be prompted to save my work only after I've received the first AI reformulation, so that the prompt feels earned -- I've seen value and have something worth saving.
- **Priority:** `MUST`
- **Why (rationale):** The "wow moment" (first AI reformulation, after the first PRD block is rendered mid-step 1) is when the PM has invested 2-3 minutes and seen a tangible output. Prompting before this point interrupts exploration; prompting after risks the PM leaving without saving. `[Assumption]` -- the exact timing (after the first `update_prd` tool call, typically the `first_use_case` block) is a design hypothesis. Whether this is the optimal moment needs validation via deferred auth conversion rate measurement.
- **Acceptance criteria:**
  - [ ] The AuthGate modal appears only after the conversation engine has delivered the first reformulation (First Use Case block generated via `update_prd` tool)
  - [ ] The trigger is the presence of the first generated PRD block, not a timer or message count
  - [ ] The modal does not appear if the user is already authenticated (returning user)
  - [ ] The modal headline communicates value preservation: "Sauvegardez votre travail"
  - [ ] The modal includes a brief explanation of why signup is needed (session persistence, sharing)
- **Maps to Gherkin:** `gherkin-tests.md` --> SC-DA-03, SC-DA-04

### US-DA-3 -- Complete magic link flow

- **Story:** As a **Builder PM**, I want to enter my email and receive a magic link that signs me in with one click, so that I can authenticate without remembering or creating a password.
- **Priority:** `MUST`
- **Why (rationale):** Magic link reduces signup friction to the absolute minimum: type an email, click a link. No password creation, no OAuth provider selection. This aligns with the zero-friction design philosophy. `[Evidence]` -- Supabase Auth natively supports magic link, and the stack is already configured for it.
- **Acceptance criteria:**
  - [ ] The auth modal contains a single email input field and a submit button
  - [ ] On submit, Supabase `signInWithOtp` is called with the provided email
  - [ ] A "Check your inbox" confirmation message appears in the modal
  - [ ] The magic link email arrives within 30 seconds under normal conditions `[To verify]`
  - [ ] Clicking the magic link redirects to `/auth/confirm`, which verifies the token
  - [ ] After verification, the user is redirected back to their wizard session (not to a generic homepage)
  - [ ] If the email belongs to an existing account, the flow works identically (login, not just signup)
- **Maps to Gherkin:** `gherkin-tests.md` --> SC-DA-05, SC-DA-06, SC-DA-07

### US-DA-4 -- Continue working while waiting for magic link

- **Story:** As a **Builder PM**, I want to minimize the auth modal and continue the wizard conversation while waiting for the magic link email, so that the auth process does not interrupt my flow.
- **Priority:** `MUST`
- **Why (rationale):** Email delivery can take 5-30 seconds. Blocking the wizard during this time wastes the PM's attention and creates a perceived speed problem that has nothing to do with Enhanced's product. `[Assumption]` -- PMs will want to continue working rather than wait. The alternative (blocking UI) was rejected because it prioritizes process over user agency.
- **Acceptance criteria:**
  - [ ] The auth modal has a minimize/dismiss button visible after the magic link is sent
  - [ ] Minimizing the modal returns focus to the wizard conversation
  - [ ] The PM can continue sending messages, receiving AI responses, and viewing PRD blocks while unauthenticated
  - [ ] A subtle indicator (e.g., banner or badge) reminds the PM that auth is pending
  - [ ] The wizard does not re-prompt the auth modal until the PM explicitly reopens it or navigates away and back
- **Maps to Gherkin:** `gherkin-tests.md` --> SC-DA-08

### US-DA-5 -- Session data preserved through auth transition

- **Story:** As a **Builder PM**, I want all my conversation messages and generated PRD blocks to be preserved when I complete the magic link authentication, so that I don't lose the work I did while anonymous.
- **Priority:** `MUST`
- **Why (rationale):** Data loss during the auth transition would be a trust-breaking experience. The PM invested 2-3 minutes of thought and received AI-generated output. Losing that work at the exact moment they chose to trust the product with their email would be a catastrophic UX failure. `[Evidence]` -- this is a hard technical requirement, not an assumption. The session claiming mechanism (`claimSession`) must be atomic.
- **Acceptance criteria:**
  - [ ] After magic link verification, `claimSession(anonymousId)` atomically sets `sessions.user_id` to the authenticated user's ID and sets `anonymous_id` to null
  - [ ] All `messages` rows linked to the session remain intact after the transition
  - [ ] All `prd_blocks` rows linked to the session's PRD remain intact after the transition
  - [ ] The wizard UI displays the same conversation history and PRD state after auth completion -- no visible change except auth status
  - [ ] If `claimSession` fails (e.g., session already claimed by another user), the error is logged and the user sees a clear error message, not a blank screen
  - [ ] After the transition, RLS policies based on `user_id` protect all session data
  - [ ] The `anonymous_id` cookie is cleared after successful claiming
- **Maps to Gherkin:** `gherkin-tests.md` --> SC-DA-09, SC-DA-10, SC-DA-11, SC-DA-12

---

## Out of scope (non-stories)

Things users might expect that we are deliberately **not** doing in this feature, and why.

- **OAuth providers (Google, GitHub):** Adds complexity and UI decisions (which providers to show, button placement) without proven demand. Magic link is sufficient for V1. Revisit if auth conversion rate is low. `[Assumption]`
- **Account settings / profile page:** No need in V1 -- the PM interacts through the wizard, not through account management. The only stored identity data is the email.
- **"Remember me" or persistent login:** Supabase session cookies handle this automatically. No custom work needed.
- **Team invites or multi-user sessions:** Collaboration features are V2. V1 is a solo experience.
- **Email verification for existing accounts:** Supabase magic link handles this natively (login = verification). No separate verification flow needed.

> **Challenge:** Does every `MUST` story trace to a verified problem in the PRD/Discovery? Does
> every story have at least one acceptance criterion that a test could check? If not, fix it
> before it reaches engineering.
>
> Traceability check:
> - US-DA-1 (no signup to start) --> Discovery Problem 3 (heavyweight frameworks), PRD section 5 deferred-auth requirements. Verified.
> - US-DA-2 (right moment prompt) --> PRD risk "deferred auth doesn't convert" + Discovery insight that value must precede ask. The exact timing is `[Assumption]` but the principle is `[Evidence]`.
> - US-DA-3 (magic link flow) --> PRD technical constraint (Supabase magic link). Verified.
> - US-DA-4 (continue working) --> PRD requirement "wizard remains accessible while waiting." Verified.
> - US-DA-5 (data preserved) --> PRD requirement "anonymous-to-authenticated transition without data loss." Verified.
>
> Every story has multiple testable acceptance criteria. No story is orphaned.
