# Enhanced — App UI Kit

A high-fidelity reconstruction of the Enhanced app surface, built from the Figma tokens.

> **⚠ Reconstruction, not a 1:1 recreation.** No Enhanced codebase or screenshots were provided. The screens here are designed against the product description (voice idea → structured PRD challenged by data) and the visual foundations in `../../README.md`. If you have real product surfaces, drop them in and we'll align.

## Layout

A three-zone document app:

1. **Left sidebar** (240px) — workspace, draft list, new-draft button
2. **Main canvas** (max 720px content) — the PRD draft document
3. **Right inspector** (320px, collapsible) — evidence sources, team activity

A 56px top toolbar spans across, with the doc title, status, share, and ⌘K.

## Screens demonstrated in `index.html`

- **Empty state** — voice-note composer, "drop or speak your idea"
- **Generating** — streaming PRD draft with progress
- **Draft view** — completed PRD with section blocks, evidence callouts, inspector
- **Voice replay** — transcript with timecodes

Click the tabs at the top of `index.html` to step through.

## Components (`components.jsx`)

| Component | Purpose |
| --- | --- |
| `Sidebar` | Left rail with draft list, sections, footer user pill |
| `Toolbar` | Top 56px bar — title, status, share, ⌘K |
| `Composer` | Voice-note input — record button, paste fallback, recent transcripts |
| `PRDSection` | The signature labelled doc block ("What you said you want") |
| `EvidenceCallout` | Blue wash "evidence found" or red wash "no evidence" block |
| `SourceChip` | Compact data-source citation (mono font, mini icon) |
| `Inspector` | Right rail — evidence list, team activity |
| `Button` / `IconButton` | Primary, secondary, outline, ghost, destructive, brand |
| `Badge` / `StatusPill` | Tags, status pills with dot indicator |
| `Avatar` / `AvatarStack` | Single + grouped |
| `Menu` | Dropdown surface |
| `Input` / `Textarea` | Form fields |

All components consume tokens from `../../colors_and_type.css`. There is no separate CSS file — components use inline styles for cosmetic clarity.
