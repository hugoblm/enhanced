# Manual Tests -- Public Sharing

> Human-run test cases for QA and pre-release verification. Each case traces to a Gherkin
> scenario and user story. Designed to be run by a non-developer with access to the
> staging environment.

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27

---

## Test environment

- **URL:** staging.enhanced.pm (or localhost:3000 for local testing)
- **Browser:** Chrome latest (primary), Firefox latest (secondary), Safari (for OG meta testing)
- **Pre-condition for all tests (except MT-PS-6):** A completed wizard session with all 4 steps done and a full PRD generated
- **Second browser / incognito window:** Required for testing the Stakeholder experience (unauthenticated view)

---

## Test cases

### MT-PS-1 -- Toggle PRD to public

- **Traces to:** SC-PS-1, SC-PS-2, US-PS-1
- **Priority:** MUST
- **Pre-conditions:** Completed PRD, currently private
- **Steps:**
  1. Open the wizard session with the completed PRD
  2. Locate the "Make public" toggle in the PRD panel header
  3. Verify the toggle is in the OFF position
  4. Click the toggle to turn it ON
  5. Verify a URL appears: `enhanced.pm/p/[10-character-slug]`
  6. Verify a "Copy link" button is visible next to the URL
  7. Click "Copy link"
  8. Paste into a text editor -- verify the full URL was copied: `https://enhanced.pm/p/[slug]`
  9. Verify visual confirmation appears ("Link copied!" or equivalent)
  10. Verify the confirmation disappears after a few seconds
- **Expected result:** Toggle works. Slug is generated. URL is displayed. Copy-to-clipboard works with confirmation.
- **Result:** ________

---

### MT-PS-2 -- View public PRD as a Stakeholder (unauthenticated)

- **Traces to:** SC-PS-6, SC-PS-7, SC-PS-8, US-PS-3
- **Priority:** MUST
- **Pre-conditions:** PRD is toggled public (from MT-PS-1). Have the public URL.
- **Steps:**
  1. Open an incognito/private browser window (no Enhanced account)
  2. Navigate to the public URL: `https://enhanced.pm/p/[slug]`
  3. Verify NO login prompt or signup modal appears
  4. Verify the page loads and displays the PRD:
     - PRD title as the page heading
     - Confidence score and recommendation visible near the top
     - All 12 blocks displayed in correct sort order
  5. Scroll through the entire PRD:
     - Verify all block content is readable and properly formatted (markdown rendered)
     - Verify evidence tags are visible as colored badges ([Evidence] green, [Assumption] amber, [To verify] red)
  6. Verify NO wizard elements are present:
     - No "Refine" buttons on blocks
     - No conversation panel or chat input
     - No step indicator
     - No ask_user cards
  7. Verify a "Made with Enhanced" footer badge is visible at the bottom
  8. Click the footer badge -- verify it links to Enhanced's homepage
- **Expected result:** Full PRD readable without account. Evidence tags visible. No wizard elements. Clean read-only view.
- **Result:** ________

---

### MT-PS-3 -- OG meta tags and Slack preview

- **Traces to:** SC-PS-4, SC-PS-5, US-PS-2
- **Priority:** MUST
- **Pre-conditions:** PRD is toggled public. Have the public URL.
- **Steps:**
  1. Open browser DevTools on the public page
  2. Inspect the HTML `<head>` section
  3. Verify the following meta tags exist:
     - `<meta property="og:title" content="[PRD title]">`
     - `<meta property="og:description" content="[executive summary excerpt, max 200 chars]">`
     - `<meta property="og:site_name" content="Enhanced">`
     - `<meta property="og:type" content="article">`
  4. Verify the og:description does NOT contain badge markup or evidence tag brackets from rendering
  5. Paste the URL into a Slack channel (or use a link preview testing tool like opengraph.xyz)
  6. Verify a rich preview appears with the title and description
  7. Paste the URL into a Twitter/X post compose box (or use cards-dev.twitter.com/validator)
  8. Verify the card preview renders with the title
- **Expected result:** OG meta tags present and correct. Slack preview renders. Social card preview works.
- **Result:** ________

---

### MT-PS-4 -- 404 for invalid slug

- **Traces to:** SC-PS-9, US-PS-4
- **Priority:** MUST
- **Pre-conditions:** None (testing non-existent URLs)
- **Steps:**
  1. Navigate to `https://enhanced.pm/p/this-slug-does-not-exist`
  2. Verify the HTTP status code is 404 (check in DevTools Network tab)
  3. Verify a branded 404 page is displayed (not a browser default error or blank page)
  4. Verify the message reads: "This PRD doesn't exist or is no longer public" (or similar)
  5. Verify a link to Enhanced's homepage is present
  6. Verify no sensitive data is visible (no PRD content, no user info, no stack traces)
  7. Navigate to `https://enhanced.pm/p/` (no slug at all)
  8. Verify the response is a 404 (not a server error)
- **Expected result:** Clean, branded 404 page. Correct HTTP status code. No data leakage. Handles edge cases (no slug).
- **Result:** ________

---

### MT-PS-5 -- Toggle off revokes public access

- **Traces to:** SC-PS-10, SC-PS-11, US-PS-4
- **Priority:** MUST
- **Pre-conditions:** PRD is currently public. Have the public URL. Have the incognito window from MT-PS-2 still open.
- **Steps:**
  1. In the main browser (logged in as PM), toggle "Make public" to OFF
  2. In the incognito window, refresh the public URL
  3. Verify the page now shows a 404 (not the PRD content)
  4. Verify the 404 message does NOT reveal that the PRD exists but is private
  5. Back in the main browser, toggle "Make public" back ON
  6. Verify the same slug is reused (URL is identical to the original)
  7. In the incognito window, refresh again -- verify the PRD is accessible again
- **Expected result:** Toggle off immediately revokes access (404). Toggle back on restores access with same slug. No information leakage.
- **Result:** ________

---

### MT-PS-6 -- Public page renders for incomplete PRDs

- **Traces to:** SC-PS-6, US-PS-3
- **Priority:** COULD
- **Pre-conditions:** A wizard session where only steps 1-2 are complete (not all 12 blocks filled). The PM toggles the PRD public despite it being incomplete. `[To verify]` -- should the toggle be available before step 4 completion?
- **Steps:**
  1. Toggle an incomplete PRD public
  2. Navigate to the public URL in an incognito window
  3. Verify the page renders with the filled blocks (e.g., 3-4 out of 12)
  4. Verify unfilled blocks are NOT shown as empty placeholders (the public view is clean -- only filled blocks)
  5. OR verify unfilled blocks show a note like "Section not yet completed"
  6. Verify the confidence score is absent or shows "Not yet assessed" (if step 3 is incomplete)
- **Expected result:** Partial PRD renders gracefully. No broken layout. No misleading empty states.
- **Result:** ________

---

### MT-PS-7 -- Security: no PRD leakage via direct query

- **Traces to:** SC-PS-12
- **Priority:** MUST
- **Pre-conditions:** At least one private PRD and one public PRD exist in the database
- **Steps:**
  1. Open the browser's JavaScript console on the public page
  2. Attempt to query the Supabase client for all PRDs:
     ```javascript
     const { data } = await supabase.from('prds').select('*');
     console.log(data);
     ```
  3. Verify the response only returns the public PRD (not the private one)
  4. Attempt to query prds without a slug filter:
     ```javascript
     const { data } = await supabase.from('prds').select('*').eq('is_public', false);
     console.log(data);
     ```
  5. Verify the response returns zero rows
  6. Attempt to query prd_blocks for a private PRD's ID:
     ```javascript
     const { data } = await supabase.from('prd_blocks').select('*').eq('prd_id', '<private-prd-id>');
     console.log(data);
     ```
  7. Verify the response returns zero rows
- **Expected result:** RLS blocks all unauthorized access. Only public PRDs are readable. No private data leaks.
- **Result:** ________

---

### MT-PS-8 -- Responsive public page

- **Traces to:** US-PS-3
- **Priority:** MUST
- **Pre-conditions:** PRD is public and accessible
- **Steps:**
  1. Open the public URL on desktop (1440px viewport) -- verify clean layout
  2. Resize browser to 1024px -- verify no horizontal scrolling, layout adapts
  3. Resize browser to 768px -- verify the page is readable on tablet width
  4. Resize browser to 375px (mobile) -- verify the page is at least readable (not required to be beautiful)
  5. Check that evidence tags are visible and readable at all viewport sizes
  6. Check that the confidence score badge is visible at all sizes
  7. Check that the "Made with Enhanced" footer is visible
- **Expected result:** Page is fully readable at desktop and tablet widths. Mobile is legible even if not optimized.
- **Result:** ________

---

## Pre-release smoke checklist

Before any release that touches public sharing:

- [ ] **MT-PS-1:** Toggle to public generates slug, URL is displayed, copy works
- [ ] **MT-PS-2:** Public page is accessible without login, shows full PRD, no wizard elements
- [ ] **MT-PS-3:** OG meta tags are present in HTML head
- [ ] **MT-PS-4:** Invalid slug returns a branded 404 page with correct HTTP status
- [ ] **MT-PS-5:** Toggle off immediately revokes access (page becomes 404)
- [ ] **MT-PS-7:** RLS blocks unauthorized queries (no private PRD leakage)
- [ ] **MT-PS-8:** Page is readable at 1024px and 768px viewport widths
