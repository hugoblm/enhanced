# Manual Test Cases -- Landing Page

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27
**Environment:** localhost:3000 / staging.enhanced.pm

---

## Test cases

### MT-LP-1 -- Happy path: pitch an idea and enter the wizard

- **Traces to:** Gherkin SC-LP-1 · US-LP-1
- **Priority:** MUST
- **Pre-conditions:** No active session. No cookies from Enhanced. Landing page at `/`.
- **Steps:**
  1. Open the landing page at `/`.
  2. Read the page -- confirm the value proposition is visible above the textarea.
  3. Click into the textarea.
  4. Type: "A tool that helps PMs validate feature hypotheses before committing engineering resources by guiding them through structured challenge questions."
  5. Click the "Lancer le cadrage" button.
  6. Start a timer when clicking.
- **Expected result:**
  - A loading indicator appears on the button (spinner or disabled state).
  - The browser redirects to `/session/{some_id}` within 3 seconds.
  - The wizard shell loads with the typed idea visible in the conversation panel.
  - Inspecting browser cookies shows an anonymous session cookie.
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

### MT-LP-2 -- Empty textarea submission

- **Traces to:** Gherkin SC-LP-3 · US-LP-2
- **Priority:** MUST
- **Pre-conditions:** Landing page at `/`. Textarea is empty.
- **Steps:**
  1. Open the landing page.
  2. Without typing anything, click the "Lancer le cadrage" button.
- **Expected result:**
  - The page does NOT navigate away.
  - An inline error message appears near the textarea (not a browser alert or popup).
  - The error message clearly communicates that an idea is required.
  - Focus moves to the textarea.
  - No network request is sent to create a session (verify via browser DevTools > Network tab).
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

### MT-LP-3 -- Too-short input submission

- **Traces to:** Gherkin SC-LP-4 · US-LP-2
- **Priority:** MUST
- **Pre-conditions:** Landing page at `/`.
- **Steps:**
  1. Open the landing page.
  2. Type "Fix onboarding" (15 characters) into the textarea.
  3. Click the "Lancer le cadrage" button.
- **Expected result:**
  - The page does NOT navigate away.
  - An inline error message appears indicating the minimum length (20 characters).
  - The typed text remains in the textarea (not cleared).
  - No session is created (verify via DevTools).
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

### MT-LP-4 -- Error message clears on valid typing

- **Traces to:** Gherkin SC-LP-5 · US-LP-2
- **Priority:** MUST
- **Pre-conditions:** An error message is visible after a failed submission (MT-LP-2 or MT-LP-3).
- **Steps:**
  1. With the error message visible, start typing a valid idea (>= 20 characters).
  2. Observe the error message.
- **Expected result:**
  - The error message disappears as soon as the user starts typing (or when input reaches valid length).
  - The CTA button remains clickable and visually active.
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

### MT-LP-5 -- Server error handling

- **Traces to:** Gherkin SC-LP-6 · US-LP-1
- **Priority:** MUST
- **Pre-conditions:** Simulate server failure (e.g., stop Supabase local, or use DevTools to block the session creation endpoint).
- **Steps:**
  1. Open the landing page.
  2. Type a valid idea (>= 20 characters).
  3. Block the `/api/` or Server Action endpoint in DevTools > Network > Block request URL.
  4. Click the "Lancer le cadrage" button.
- **Expected result:**
  - The loading indicator appears, then resolves.
  - A user-friendly error message is displayed (not a raw error, stack trace, or blank screen).
  - The typed idea text is preserved in the textarea.
  - The CTA button is clickable again (not stuck in loading state).
  - The user can retry by clicking the button again.
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

### MT-LP-6 -- Tablet responsiveness

- **Traces to:** Gherkin SC-LP-7 · US-LP-3
- **Priority:** MUST
- **Pre-conditions:** Browser DevTools device emulation or a real tablet device.
- **Steps:**
  1. Open the landing page with viewport set to 768px width (iPad portrait).
  2. Observe the layout.
  3. Tap into the textarea and type an idea using the on-screen keyboard.
  4. Tap the CTA button.
  5. Resize to 1024px (iPad landscape). Observe layout.
  6. Resize to 1440px (desktop). Observe layout.
- **Expected result:**
  - At 768px: textarea and CTA are fully visible, no horizontal scroll. Text is readable. CTA button is large enough to tap easily (>= 44x44px).
  - At 1024px: layout is comfortable, no cramping.
  - At 1440px: layout uses available space well, content is centered or has reasonable max-width.
  - At all sizes: the value proposition is visible above the fold.
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

### MT-LP-7 -- Long idea submission

- **Traces to:** Gherkin SC-LP-2 · US-LP-1
- **Priority:** COULD
- **Pre-conditions:** Landing page at `/`.
- **Steps:**
  1. Open the landing page.
  2. Paste a very long idea (1000+ characters) into the textarea.
  3. Observe: does the textarea resize, scroll, or clip the text?
  4. Click the "Lancer le cadrage" button.
- **Expected result:**
  - The textarea accommodates long text (scrolls internally or expands).
  - The full text is submitted without truncation.
  - The wizard loads with the complete idea text visible.
- **Result:** Pass/Fail/Blocked -- **Tester:** -- **Date:**

---

## Pre-release smoke checklist

- [ ] MT-LP-1 (happy path) passes -- idea submitted, wizard loads
- [ ] MT-LP-2 (empty submission) shows error, no navigation
- [ ] MT-LP-3 (short input) shows length error, no navigation
- [ ] MT-LP-5 (server error) shows friendly error, preserves input
- [ ] MT-LP-6 (tablet) layout is usable at 768px, 1024px, 1440px
- [ ] No console errors on page load (DevTools > Console)
- [ ] Page loads in under 2 seconds on throttled "Fast 3G" (DevTools > Network)
- [ ] Value proposition text is visible above the fold on desktop
- [ ] CTA button text reads "Lancer le cadrage"
- [ ] Accessibility: textarea has a visible label or `aria-label`, CTA button is keyboard-focusable
