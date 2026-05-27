# Test Plan — PDF Export

> Test strategy and scenario mapping for the PDF Export feature. Maps to Gherkin scenarios
> in `../product/gherkin-tests.md`.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Test Strategy

| Level | Tool | Scope |
|-------|------|-------|
| Unit | Vitest | PDF components, markdown parser, generatePrdPdf function |
| Integration | Vitest + Supabase local | Route handler, auth check, DB load, PDF response |
| E2E | Playwright | Full export flow — button click to valid PDF download |

---

## Unit Tests

### UT-PE-01: generatePrdPdf renders without errors
**Maps to:** SC-PE-02
**File:** `src/lib/pdf/__tests__/generate.test.ts`

```
- GIVEN a PRD with title "Test PRD", confidence 72, recommendation "Go with caution"
  AND 3 blocks: jtbd, first_use_case, objectives (with markdown content)
  WHEN generatePrdPdf is called
  THEN it returns a Buffer
  AND the Buffer length is > 0
  AND the Buffer starts with %PDF (bytes 0x25504446)
```

### UT-PE-02: All 12 block types have correct section headings
**Maps to:** SC-PE-03
**File:** `src/lib/pdf/__tests__/constants.test.ts`

```
- GIVEN the BLOCK_TYPE_LABELS constant
  THEN it contains entries for all 12 block types:
    jtbd, first_use_case, objectives, context, vision, target_audience,
    problems, solution, benchmark, features, risks, success_criteria
  AND each entry has a non-empty French label:
    - jtbd → "Jobs To Be Done"
    - first_use_case → "Cas d'usage principal"
    - objectives → "Objectifs"
    - context → "Contexte"
    - vision → "Vision"
    - target_audience → "Audience cible"
    - problems → "Problemes identifies"
    - solution → "Solution proposee"
    - benchmark → "Benchmark"
    - features → "Features"
    - risks → "Risques & hypotheses"
    - success_criteria → "Criteres de succes"
```

### UT-PE-03: Evidence tags render with correct colors
**Maps to:** SC-PE-04
**File:** `src/lib/pdf/__tests__/evidence-badge.test.ts`

```
- GIVEN EvidenceBadge with type "Evidence"
  WHEN rendered
  THEN background color is #dcfce7 (green)
  AND text color is #166534

- GIVEN EvidenceBadge with type "Assumption"
  WHEN rendered
  THEN background color is #fef3c7 (amber)
  AND text color is #92400e

- GIVEN EvidenceBadge with type "To verify"
  WHEN rendered
  THEN background color is #dbeafe (blue)
  AND text color is #1e40af
```

### UT-PE-04: Markdown parser handles bold text
**Maps to:** SC-PE-E4
**File:** `src/lib/pdf/__tests__/markdown.test.ts`

```
- GIVEN markdown "**Probleme principal**: les PM _skipent_ la validation"
  WHEN parseMarkdownToPdf is called
  THEN the output contains a Text element with style bold wrapping "Probleme principal"
  AND the output contains a Text element with style italic wrapping "skipent"
```

### UT-PE-05: Markdown parser handles list items
**Maps to:** SC-PE-E4
**File:** `src/lib/pdf/__tests__/markdown.test.ts`

```
- GIVEN markdown "- Point 1\n- Point 2\n- Point 3"
  WHEN parseMarkdownToPdf is called
  THEN the output contains 3 View elements with listItem style
  AND each contains a bullet character and the list text
```

### UT-PE-06: Markdown parser extracts evidence tags
**Maps to:** SC-PE-04
**File:** `src/lib/pdf/__tests__/markdown.test.ts`

```
- GIVEN markdown "Les outils AI accelerent le build [Evidence]"
  WHEN parseMarkdownToPdf is called
  THEN the output contains an EvidenceBadge component with type "Evidence"
  AND the badge is positioned inline after the preceding text

- GIVEN markdown "Taux de conversion [To verify]"
  WHEN parseMarkdownToPdf is called
  THEN the output contains an EvidenceBadge with type "To verify"
```

### UT-PE-07: generatePrdPdf handles partial PRD (few blocks)
**Maps to:** SC-PE-E1
**File:** `src/lib/pdf/__tests__/generate.test.ts`

```
- GIVEN a PRD with only 4 blocks (jtbd, first_use_case, objectives, context)
  WHEN generatePrdPdf is called
  THEN it returns a valid PDF Buffer
  AND the PDF contains 4 sections (not 12)
  AND no error is thrown for missing blocks
```

### UT-PE-08: generatePrdPdf handles null confidence score
**Maps to:** SC-PE-05 (edge)
**File:** `src/lib/pdf/__tests__/generate.test.ts`

```
- GIVEN a PRD with confidenceScore: null and recommendation: null
  WHEN generatePrdPdf is called
  THEN it returns a valid PDF Buffer
  AND the confidence badge section is omitted (no render error)
```

### UT-PE-09: Font registration is idempotent
**Maps to:** (infrastructure)
**File:** `src/lib/pdf/__tests__/fonts.test.ts`

```
- GIVEN registerFonts() has already been called
  WHEN registerFonts() is called again
  THEN no error is thrown
  AND fonts remain registered
```

---

## Integration Tests

### IT-PE-01: GET /api/export/[prdId]/pdf returns valid PDF
**Maps to:** SC-PE-02
**File:** `src/app/api/export/[prdId]/pdf/__tests__/route.test.ts`

```
- GIVEN user "user-1" owns PRD "prd-1" with 5 blocks
  WHEN GET /api/export/prd-1/pdf is called with user-1's auth
  THEN response status is 200
  AND Content-Type header is "application/pdf"
  AND Content-Disposition header matches 'attachment; filename="enhanced-prd-*.pdf"'
  AND response body is a valid PDF binary (starts with %PDF)
```

### IT-PE-02: Unauthorized request rejected
**Maps to:** SC-PE-02 (security)
**File:** `src/app/api/export/[prdId]/pdf/__tests__/route.test.ts`

```
- GIVEN no auth cookie in the request
  WHEN GET /api/export/prd-1/pdf is called
  THEN response status is 401
  AND response body is { error: "Unauthorized" }
```

### IT-PE-03: Non-owner request returns 404
**Maps to:** SC-PE-02 (security)
**File:** `src/app/api/export/[prdId]/pdf/__tests__/route.test.ts`

```
- GIVEN user "user-2" does NOT own PRD "prd-1"
  WHEN GET /api/export/prd-1/pdf is called with user-2's auth
  THEN response status is 404
  AND response body is { error: "PRD not found" }
```

### IT-PE-04: Non-existent PRD returns 404
**Maps to:** SC-PE-02 (error)
**File:** `src/app/api/export/[prdId]/pdf/__tests__/route.test.ts`

```
- GIVEN PRD "nonexistent-uuid" does not exist
  WHEN GET /api/export/nonexistent-uuid/pdf is called
  THEN response status is 404
```

### IT-PE-05: PDF contains all blocks in sort order
**Maps to:** SC-PE-03
**File:** `src/app/api/export/[prdId]/pdf/__tests__/route.test.ts`

```
- GIVEN PRD "prd-1" with 12 blocks in correct sort_order (1-12)
  WHEN GET /api/export/prd-1/pdf is called
  THEN the generated PDF contains 12 sections
  AND sections appear in sort_order sequence
  (Verification: parse PDF text content and check section heading order)
```

---

## E2E Tests

### E2E-PE-01: Export button visible and functional
**Maps to:** SC-PE-01, SC-PE-02
**File:** `e2e/pdf-export.spec.ts`

```
- Authenticate as test user
- Navigate to wizard with a completed PRD (at least 1 block)
- ASSERT: "Export PDF" button is visible in PRD panel header
- Click "Export PDF"
- ASSERT: loading spinner appears on the button
- ASSERT: button is disabled during loading
- Wait for download to start
- ASSERT: spinner disappears, button returns to default state
- ASSERT: downloaded file has .pdf extension
- ASSERT: downloaded file is a valid PDF (starts with %PDF)
```

### E2E-PE-02: PDF contains all PRD blocks
**Maps to:** SC-PE-03
**File:** `e2e/pdf-export.spec.ts`

```
- Export a PRD with 12 blocks
- Open the downloaded PDF (parse text content)
- ASSERT: all 12 section headings are present
- ASSERT: sections appear in correct order (JTBD first, Success Criteria last)
- ASSERT: each section contains the block content
```

### E2E-PE-03: Evidence tags visually distinguished
**Maps to:** SC-PE-04
**File:** `e2e/pdf-export.spec.ts`

```
- Export a PRD where blocks contain [Evidence], [Assumption], and [To verify] tags
- Open the downloaded PDF
- ASSERT: evidence tags are rendered as colored badges (not plain text)
  (Note: verifying exact colors in PDF requires a PDF parsing library like pdf-parse)
```

### E2E-PE-04: Confidence score and recommendation in PDF
**Maps to:** SC-PE-05
**File:** `e2e/pdf-export.spec.ts`

```
- Export a PRD with confidence_score 72 and recommendation "Go with caution"
- Parse the PDF text content
- ASSERT: "72%" appears in the document
- ASSERT: "Go with caution" appears in the document
```

### E2E-PE-05: Branded layout
**Maps to:** SC-PE-07
**File:** `e2e/pdf-export.spec.ts`

```
- Export a PRD as PDF
- Open the downloaded PDF
- ASSERT: footer contains "Generated with Enhanced"
- ASSERT: page numbers are present
- ASSERT: document has consistent margins and layout
  (Visual inspection or screenshot comparison)
```

### E2E-PE-06: Loading state during generation
**Maps to:** SC-PE-06
**File:** `e2e/pdf-export.spec.ts`

```
- Click "Export PDF"
- Immediately check button state
- ASSERT: button shows loading spinner
- ASSERT: button is disabled (aria-disabled or disabled attribute)
- ASSERT: rest of the wizard UI remains interactive
- Wait for download completion
- ASSERT: button returns to default state
```

### E2E-PE-07: Error handling
**Maps to:** SC-PE-08
**File:** `e2e/pdf-export.spec.ts`

```
- Simulate a server error during PDF generation (e.g., network intercept returning 500)
- ASSERT: loading spinner disappears
- ASSERT: error message displayed: "Impossible de generer le PDF. Reessayez."
- ASSERT: button returns to default state (can retry)
```

### E2E-PE-08: Export disabled when no blocks
**Maps to:** SC-PE-E2
**File:** `e2e/pdf-export.spec.ts`

```
- Navigate to a wizard session with 0 generated blocks
- ASSERT: "Export PDF" button is visible but disabled (grayed out)
- ASSERT: hovering shows tooltip "Completez au moins une section pour exporter"
```

### E2E-PE-09: No concurrent exports
**Maps to:** SC-PE-E3
**File:** `e2e/pdf-export.spec.ts`

```
- Click "Export PDF"
- While loading spinner is visible, attempt to click the button again
- ASSERT: second click is ignored (button is disabled)
- ASSERT: only one network request is sent to /api/export/[prdId]/pdf
```

### E2E-PE-10: Partial PRD export
**Maps to:** SC-PE-E1
**File:** `e2e/pdf-export.spec.ts`

```
- With a PRD that has 4 blocks (not all 12)
- Click "Export PDF"
- ASSERT: PDF is generated and downloadable
- ASSERT: PDF contains the 4 generated blocks
- ASSERT: missing blocks are either omitted or shown as "Section non completee"
```

### E2E-PE-11: Markdown rendering in PDF
**Maps to:** SC-PE-E4
**File:** `e2e/pdf-export.spec.ts`

```
- With a PRD block containing markdown:
  "**Probleme principal**: les PM _skipent_ la validation\n- Point 1\n- Point 2"
- Export as PDF
- Parse PDF text content
- ASSERT: "Probleme principal" appears (bold formatting may not be verifiable via text
  extraction, but the text must be present)
- ASSERT: "Point 1" and "Point 2" appear as separate items
```

---

## Non-regression Tests

### NR-PE-01: PRD panel unaffected
**Maps to:** (non-regression)
**File:** `e2e/pdf-export.spec.ts`

```
- View a PRD in the wizard panel
- ASSERT: PRD blocks render correctly with evidence tags
- ASSERT: block refinement hover interaction still works
- ASSERT: version history (if implemented) still works
- Click "Export PDF" and wait for download
- ASSERT: PRD panel is unchanged after export
```

---

## Smoke Checklist (Manual)

Before merging `feat/pdf-export`:

- [ ] Export button visible in PRD panel header (when blocks exist)
- [ ] Export button disabled when 0 blocks exist
- [ ] Click export → loading spinner → download starts → spinner stops
- [ ] Downloaded file opens in Preview (macOS)
- [ ] Downloaded file opens in Chrome PDF viewer
- [ ] PDF header: Enhanced logo (or placeholder) + PRD title + date
- [ ] PDF footer: "Generated with Enhanced" + page numbers on every page
- [ ] All generated blocks present in correct order
- [ ] Section headings use Kedebideri font (or Helvetica fallback)
- [ ] Body text uses Cantarell font (or Helvetica fallback)
- [ ] Evidence tags: `[Evidence]` green, `[Assumption]` amber, `[To verify]` blue
- [ ] Confidence score displayed prominently
- [ ] Recommendation text displayed near confidence score
- [ ] Bold and italic text rendered correctly
- [ ] Bullet lists rendered correctly
- [ ] Multi-page PDF: page break does not orphan section headings
- [ ] Error state: disconnect network → click export → error message shown → reconnect → retry works
- [ ] Another user's PRD → 404 (not accessible)
