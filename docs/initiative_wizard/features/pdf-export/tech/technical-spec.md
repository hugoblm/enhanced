# Technical Spec — PDF Export

> Overview and index of the technical documentation for the PDF Export feature.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27
**Feature:** [`../README.md`](../README.md) · **PRD:** [`../../../prd.md`](../../../prd.md)

---

## Summary

PDF Export generates a branded, downloadable PDF from a completed PRD using
`@react-pdf/renderer`. The PDF renders all PRD blocks with evidence tags visually
distinguished, the confidence score, and the recommendation. It uses Obra design tokens:
Kedebideri for headings, Cantarell for body text, Enhanced branding in header/footer.

The PDF is a **communication artifact** — not editable, not a living document. Its purpose
is to let the PM hand a credible, branded output to stakeholders without requiring anyone
to create an Enhanced account.

---

## Architecture Overview

```
PRD panel header
  └── "Export PDF" button (Client Component)
        └── Fetch GET /api/export/[prdId]/pdf
              │
              ▼
        Route Handler (server-side)
              ├── Auth check (user must own the PRD)
              ├── Load PRD + prd_blocks from DB
              ├── Build React PDF document
              │     ├── PrdDocument (Document + Page wrapper)
              │     ├── PrdHeader (logo + title + date + confidence)
              │     ├── PrdSection (per block: heading + markdown + evidence tags)
              │     ├── EvidenceBadge (colored inline tag)
              │     └── PrdFooter (branding + page numbers)
              ├── renderToBuffer() → PDF binary
              └── Return with Content-Type: application/pdf
                   Content-Disposition: attachment; filename="enhanced-prd-{slug}.pdf"
```

---

## Sub-specifications

| Document | Scope |
|----------|-------|
| [`api.md`](api.md) | Route Handler, PDF components, font registration, response contract |
| [`release-plan.md`](release-plan.md) | Branch strategy, commit sequence, dependencies |
| [`test-plan.md`](test-plan.md) | Unit / integration / E2E test mapping to Gherkin scenarios |

---

## Key Design Decisions

1. **Server-side rendering via `@react-pdf/renderer`.** The PDF is generated entirely on the
   server. No client-side PDF generation (which would expose the rendering logic and increase
   bundle size). The `renderToBuffer()` API produces a Buffer that is streamed as the response.

2. **Obra fonts embedded as base64.** Kedebideri and Cantarell font files are registered via
   `Font.register()` with base64-encoded source data. This ensures the fonts are available
   in the serverless function environment (no filesystem access to font files on Vercel).

3. **Markdown to PDF primitives.** PRD block content is stored as markdown. The PDF renderer
   does not support raw markdown — content must be parsed and converted to React PDF
   primitives (`<Text>`, `<View>`, `<Link>`). A lightweight markdown-to-pdf-primitives
   parser handles bold, italic, lists, and links.

4. **Evidence tags as inline badges.** `[Evidence]`, `[Assumption]`, and `[To verify]` tags
   are detected via regex in the content and rendered as colored inline badges (not plain
   text). This matches the on-screen rendering in the PRD panel.

5. **A4 format with fixed layout.** The PDF uses A4 page size (595.28 x 841.89 pt) with
   20mm margins. This is the standard for European/French business documents.

6. **No data model changes.** PDF export operates on existing `prds` and `prd_blocks` tables.
   No new tables or columns required.

---

## Dependencies

- **`prd-live-builder`** — PRD blocks must exist in the database. The `prds` and `prd_blocks`
  tables must be populated.
- **`deferred-auth`** — the user must be authenticated to export (auth check in the route).
- **`@react-pdf/renderer`** — already listed in `package.json` dependencies.
- **Obra font files** — Kedebideri (headings) and Cantarell (body) must be available as
  base64 strings for `Font.register()`.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Obra font format incompatible with @react-pdf/renderer | Medium | Medium | Fallback to system fonts (Helvetica for headings, sans-serif for body). Test font embedding early. |
| PDF generation timeout on Vercel (>10s) | Low | Medium | PRDs have max 12 blocks — rendering should be fast. If slow, optimize by pre-computing markdown parse results. |
| Complex markdown (tables, code blocks) breaks PDF rendering | Low | Low | PRD content is primarily prose with lists and bold/italic. Unsupported markdown elements fall back to plain text. |
| Large content in a single block causes page overflow | Low | Low | @react-pdf/renderer handles automatic page breaks. Long text wraps naturally. |

---

## File Map

| File | Purpose |
|------|---------|
| `src/app/api/export/[prdId]/pdf/route.ts` | Route Handler — auth, data load, render, response |
| `src/lib/pdf/generate.ts` | Main export function — orchestrates PDF generation |
| `src/lib/pdf/prd-document.tsx` | Document + Page structure (React PDF components) |
| `src/lib/pdf/prd-header.tsx` | Header: logo, title, date, confidence score |
| `src/lib/pdf/prd-section.tsx` | Block rendering: heading + content + evidence tags |
| `src/lib/pdf/evidence-badge.tsx` | Colored inline badge for evidence tags |
| `src/lib/pdf/prd-footer.tsx` | Footer: branding, page numbers |
| `src/lib/pdf/styles.ts` | StyleSheet with Obra tokens |
| `src/lib/pdf/fonts.ts` | Font registration (Kedebideri, Cantarell as base64) |
| `src/lib/pdf/markdown.ts` | Markdown-to-PDF-primitives parser |
