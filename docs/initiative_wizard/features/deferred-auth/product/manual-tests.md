# Manual Tests — Deferred Auth

> Human-run test cases for the Deferred Auth feature. Each test case is designed to be
> executed by a QA tester or developer before release. These complement the automated
> Gherkin scenarios and focus on aspects that require human judgment (UX feel, timing,
> visual polish).

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Test cases

### MT-DA-1 -- Anonymous session creation and wizard entry

- **Traces to:** US-DA-1, SC-DA-01
- **Priority:** `MUST` (blocking)
- **Pre-conditions:**
  - Clean browser (no cookies for enhanced.pm)
  - Dev server running or staging environment accessible
- **Steps:**
  1. Open the landing page in the browser
  2. Enter a product idea in the textarea (e.g., "Un outil de suivi des OKR pour les equipes produit")
  3. Click the CTA button
  4. Open browser DevTools > Application > Cookies
  5. Verify the anonymous_id cookie is present, httpOnly, Secure, SameSite=Lax
  6. Verify the wizard page loads with a conversation panel and an empty PRD panel
  7. Send a message to the AI and confirm a response streams back
- **Expected result:**
  - Wizard loads without any signup/login prompt
  - Cookie is set correctly with proper flags
  - AI conversation works in anonymous mode
  - No errors in browser console
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

### MT-DA-2 -- Auth modal trigger timing

- **Traces to:** US-DA-2, SC-DA-03, SC-DA-04b
- **Priority:** `MUST` (blocking)
- **Pre-conditions:**
  - Anonymous session active in the wizard
  - At step 1 of the conversation
- **Steps:**
  1. Engage in the step 1 conversation (answer the AI's questions about your idea)
  2. Observe the PRD panel -- no auth modal should appear during the conversation
  3. Continue until the AI generates the first PRD block (First Use Case reformulation)
  4. Observe the timing: the AuthGate modal should appear after the first block renders
  5. Verify the modal headline says "Sauvegardez votre travail" (or equivalent)
  6. Verify the modal has an email input and a submit button
  7. Verify the modal does not obscure the newly generated PRD block (or allows scrolling behind it)
- **Expected result:**
  - Modal appears precisely after first PRD block generation, not before
  - Modal is visually clear: headline, explanation, email input, submit
  - The timing feels natural -- the PM has had time to see value before being asked to commit
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

### MT-DA-3 -- Magic link email delivery and flow

- **Traces to:** US-DA-3, SC-DA-05, SC-DA-06
- **Priority:** `MUST` (blocking)
- **Pre-conditions:**
  - Auth modal visible after step 1 reformulation
  - Access to the email inbox for the test email address
- **Steps:**
  1. Enter a valid email address in the auth modal input
  2. Click submit
  3. Verify the modal shows "Verifiez votre boite mail" (or equivalent confirmation)
  4. Open the email inbox -- check that the magic link email arrives within 30 seconds
  5. Note the email's sender, subject line, and content (should look professional, not spammy)
  6. Click the magic link in the email
  7. Verify the browser redirects to `/auth/confirm`, then back to the wizard
  8. Verify the wizard displays the same conversation and PRD blocks as before
  9. Verify the auth status is now authenticated (check DevTools for Supabase session cookie)
- **Expected result:**
  - Email arrives within 30 seconds
  - Magic link redirects correctly and session is claimed
  - Wizard state is identical before and after auth
  - Anonymous_id cookie is cleared after successful auth
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

### MT-DA-4 -- Minimize modal and continue working

- **Traces to:** US-DA-4, SC-DA-08
- **Priority:** `MUST`
- **Pre-conditions:**
  - Auth modal visible, magic link already sent ("Check your inbox" state)
- **Steps:**
  1. Click the minimize/dismiss button on the auth modal
  2. Verify the modal disappears (slides down or fades out)
  3. Verify a subtle auth-pending indicator is visible (e.g., small banner or badge)
  4. Send a new message to the AI in the conversation panel
  5. Verify the AI responds normally
  6. Verify PRD blocks continue to generate if the conversation progresses
  7. Verify the auth modal does NOT reappear automatically
  8. Now click the magic link from the email (in a new tab or same tab)
  9. Verify the session is claimed and the wizard updates to authenticated state
- **Expected result:**
  - Wizard is fully functional with modal minimized
  - Auth-pending indicator is visible but not intrusive
  - Magic link still works after modal is minimized
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

### MT-DA-5 -- Session data integrity after claiming

- **Traces to:** US-DA-5, SC-DA-09
- **Priority:** `MUST` (blocking)
- **Pre-conditions:**
  - Anonymous session with at least 4 conversation messages and 2 PRD blocks
- **Steps:**
  1. Note the exact number of conversation messages and their content
  2. Note the exact PRD blocks and their content
  3. Complete the magic link auth flow
  4. After redirect back to wizard: count the conversation messages
  5. Verify each message has the same content as before
  6. Verify the PRD blocks are identical (content, order, evidence tags)
  7. Open Supabase dashboard (or query the DB directly):
     - Verify `sessions.user_id` is now set
     - Verify `sessions.anonymous_id` is null
     - Verify `messages` rows are still linked to the session
     - Verify `prd_blocks` rows are still linked to the session's PRD
- **Expected result:**
  - Zero data loss -- every message and block is preserved
  - DB state is clean: user_id set, anonymous_id nullified
  - UI reflects the exact same state as pre-auth
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

### MT-DA-6 -- Expired magic link handling

- **Traces to:** US-DA-3, SC-DA-12
- **Priority:** `MUST`
- **Pre-conditions:**
  - A magic link that has expired (wait for Supabase token expiry, or use a test token)
- **Steps:**
  1. Click the expired magic link
  2. Verify the `/auth/confirm` page displays an error message (not a crash or blank page)
  3. Verify the message says the link has expired and offers to resend
  4. Click the "Resend" button
  5. Verify a new magic link email is sent
  6. Click the new magic link and verify successful auth
  7. Verify the original anonymous session data is still intact
- **Expected result:**
  - Expired link shows a clear, localized error message
  - Resend flow works and preserves the session
  - No data loss from the failed attempt
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

### MT-DA-7 -- Existing account login via auth modal

- **Traces to:** US-DA-3, SC-DA-07
- **Priority:** `MUST`
- **Pre-conditions:**
  - A Supabase Auth account already exists for the test email
  - A new anonymous wizard session is active
- **Steps:**
  1. Trigger the auth modal (complete step 1 conversation until first reformulation)
  2. Enter the existing account's email in the auth modal
  3. Click submit
  4. Verify the flow is identical to a new signup (no "account exists" error)
  5. Click the magic link from the email
  6. Verify the session is claimed by the existing account
  7. Verify the wizard continues normally with the existing user's identity
- **Expected result:**
  - Existing accounts log in seamlessly through the same flow
  - No confusing "signup vs login" distinction in the UI
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

### MT-DA-8 -- Invalid email validation

- **Traces to:** US-DA-3, SC-DA-E1
- **Priority:** `MUST`
- **Pre-conditions:**
  - Auth modal visible
- **Steps:**
  1. Enter "not-an-email" in the email input
  2. Click submit
  3. Verify a validation error appears (e.g., "Veuillez entrer une adresse email valide")
  4. Verify no request is sent to Supabase (check Network tab in DevTools)
  5. Enter a valid email and verify the form submits normally
- **Expected result:**
  - Client-side validation catches invalid emails
  - Error message is clear and localized
  - Valid emails are accepted after correction
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

### MT-DA-9 -- Browser close and reopen before auth completion

- **Traces to:** US-DA-1, SC-DA-E2
- **Priority:** `COULD`
- **Pre-conditions:**
  - Anonymous session active, magic link sent but not clicked
- **Steps:**
  1. Close the browser entirely
  2. Reopen the browser and navigate to the Enhanced wizard URL
  3. Verify the anonymous session cookie is still present
  4. Verify the wizard loads with the existing conversation and PRD blocks
  5. Go to the email inbox and click the magic link
  6. Verify auth completes successfully and the session is claimed
- **Expected result:**
  - Session persists across browser restarts (cookie survives)
  - Magic link still works even after browser restart
  - Data integrity is maintained throughout
- **Result:** `[ ] Pass` `[ ] Fail` `[ ] Blocked`

---

## Pre-release smoke checklist

Run these before every deploy that touches the auth flow:

- [ ] **SM-DA-1:** Fresh visitor can start wizard without signup (MT-DA-1, abbreviated)
- [ ] **SM-DA-2:** Auth modal appears after first PRD block, not before (MT-DA-2, abbreviated)
- [ ] **SM-DA-3:** Magic link email arrives and clicking it completes auth (MT-DA-3, abbreviated)
- [ ] **SM-DA-4:** Session data (messages + blocks) survives the auth transition (MT-DA-5, abbreviated)
- [ ] **SM-DA-5:** Already-authenticated user does not see the auth modal (MT-DA-2, variation)
- [ ] **SM-DA-6:** Invalid email shows validation error, not a crash (MT-DA-8, abbreviated)
