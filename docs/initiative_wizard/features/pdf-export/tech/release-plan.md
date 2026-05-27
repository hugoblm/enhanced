# Release Plan — PDF Export

> Branch strategy, commit sequence, and deployment checklist for the PDF Export feature.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Branch

- **Branch name:** `feat/pdf-export`
- **Base:** `staging`
- **Merge target:** `staging` (via PR)
- **Dependencies:**
  - `prd-live-builder` must be merged (provides `prds` and `prd_blocks` tables with data).
  - `deferred-auth` must be merged (provides authentication for the export route).
  - `@react-pdf/renderer` is already in `package.json` — verify it is installed.

This feature is sequenced at position 8 in the feature breakdown.

---

## Pre-work: Font Preparation

Before starting implementation, prepare the Obra font files for embedding:

1. **Obtain font files:** Kedebideri (.ttf or .otf) and Cantarell (.ttf, regular + bold +
   italic).
2. **Convert to base64:** `base64 -i kedebideri-regular.ttf -o kedebideri-regular.b64`
3. **Create font data files:**
   - `src/lib/pdf/font-data/kedebideri.ts` — exports `KEDEBIDERI_REGULAR_BASE64`
   - `src/lib/pdf/font-data/cantarell.ts` — exports `CANTARELL_REGULAR_BASE64`,
     `CANTARELL_BOLD_BASE64`, `CANTARELL_ITALIC_BASE64`
4. **Test font registration:** Write a minimal script that calls `Font.register()` and
   `renderToBuffer()` with each font to verify compatibility.

**If fonts are incompatible with @react-pdf/renderer:** Use Helvetica (built-in) as fallback.
Document the limitation and add a backlog item for font investigation.

---

## Commit Sequence

### Commit 1: Verify @react-pdf/renderer installation

**Files:**
- `package.json` (verify, no changes expected)
- `package-lock.json` (verify)

**Contains:**
- Verify `@react-pdf/renderer` is installed and importable.
- If not installed: `npm install @react-pdf/renderer`.

**Verify:** `import { renderToBuffer } from '@react-pdf/renderer'` compiles without error.

---

### Commit 2: PDF font registration and constants

**Files:**
- `src/lib/pdf/fonts.ts` (new)
- `src/lib/pdf/font-data/kedebideri.ts` (new)
- `src/lib/pdf/font-data/cantarell.ts` (new)
- `src/lib/pdf/constants.ts` (new)

**Contains:**
- `registerFonts()` function with Font.register calls.
- Base64 font data exports.
- `BLOCK_TYPE_LABELS` and `BLOCK_TYPE_ORDER` constants.

**Verify:** `registerFonts()` executes without error. Fonts are available for rendering.

---

### Commit 3: PDF styles and markdown parser

**Files:**
- `src/lib/pdf/styles.ts` (new)
- `src/lib/pdf/markdown.ts` (new)

**Contains:**
- StyleSheet with Obra tokens (page, header, section, footer, badge styles).
- `parseMarkdownToPdf()` function — converts markdown to React PDF primitives.
- Bold, italic, list, and evidence tag support.

**Verify:** Unit test for `parseMarkdownToPdf`:
- Bold text produces `<Text style={bold}>` wrapper.
- List items produce `<View style={listItem}>` wrappers.
- Evidence tags produce `<EvidenceBadge>` components.

---

### Commit 4: PDF components (document, header, section, badge, footer)

**Files:**
- `src/lib/pdf/prd-document.tsx` (new)
- `src/lib/pdf/prd-header.tsx` (new)
- `src/lib/pdf/prd-section.tsx` (new)
- `src/lib/pdf/evidence-badge.tsx` (new)
- `src/lib/pdf/prd-footer.tsx` (new)

**Contains:**
- `PrdDocument` — top-level Document + Page wrapper.
- `PrdHeader` — Enhanced logo, title, date, confidence score, recommendation.
- `PrdSection` — block heading + markdown content rendering.
- `EvidenceBadge` — colored inline badge (green/amber/blue).
- `PrdFooter` — branding text + page numbers.

**Verify:** Render a test document with `renderToBuffer()`. Output is a valid PDF buffer
(starts with `%PDF`). Open in a PDF viewer — layout is correct.

---

### Commit 5: generatePrdPdf function

**Files:**
- `src/lib/pdf/generate.ts` (new)

**Contains:**
- `generatePrdPdf({ prd, blocks })` function.
- Calls `registerFonts()`, builds `<PrdDocument>`, calls `renderToBuffer()`.
- Returns `Buffer`.

**Verify:** Unit test — call with mock PRD data and 3 blocks. Returns a non-empty Buffer.
Buffer starts with `%PDF`.

---

### Commit 6: GET /api/export/[prdId]/pdf route handler

**Files:**
- `src/app/api/export/[prdId]/pdf/route.ts` (new)

**Contains:**
- Auth check.
- PRD + blocks load from Supabase.
- Call `generatePrdPdf`.
- Return PDF with correct headers (Content-Type, Content-Disposition).
- Error handling (401, 404, 500).

**Verify:** Call via curl with auth cookie. Response is a valid PDF. Check Content-Type and
Content-Disposition headers. 401 without auth. 404 for non-existent PRD.

---

### Commit 7: Export button in PRD panel header

**Files:**
- `src/components/export-pdf-button.tsx` (new)
- PRD panel header component (modified — add ExportPdfButton)

**Contains:**
- `ExportPdfButton` client component with loading state, error handling, download trigger.
- Integration into PRD panel header.
- Disabled state when no blocks exist.

**Verify:** Button visible in PRD panel. Click triggers download. Loading spinner during
generation. Error toast on failure. Button disabled when 0 blocks exist.

---

## Pre-merge Checklist

- [ ] @react-pdf/renderer installed and importable
- [ ] Obra fonts registered without error (or fallback fonts applied)
- [ ] PDF generates successfully for a PRD with all 12 block types
- [ ] PDF generates successfully for a partial PRD (4 blocks)
- [ ] All 12 block types have correct French section headings
- [ ] Evidence tags rendered with correct colors (green, amber, blue)
- [ ] Confidence score and recommendation displayed in header
- [ ] Enhanced logo visible in header (or placeholder if logo not yet available)
- [ ] Footer shows "Generated with Enhanced" + page numbers on every page
- [ ] Content-Type is `application/pdf`
- [ ] Content-Disposition triggers browser download (not inline display)
- [ ] 401 returned for unauthenticated requests
- [ ] 404 returned for PRDs owned by other users
- [ ] Export button shows loading spinner during generation
- [ ] Export button disabled when PRD has 0 blocks
- [ ] Double-click on export button does not trigger multiple requests
- [ ] Bold, italic, and list markdown renders correctly in PDF
- [ ] PDF opens correctly in Preview (macOS), Chrome PDF viewer, and Acrobat
- [ ] TypeScript compilation passes
- [ ] `.ai-context/` updated to reflect new routes and pdf/ module

---

## Post-merge Tasks

- Update `.ai-context/README.md`: add export route, add `src/lib/pdf/` to module list.
- Update feature README status from `Planned` to `Done`.
- Add PostHog event: `prd_exported_pdf` (with prdId, block count, confidence score).
- If font fallback was used: add backlog item for Obra font investigation.
