# Enhanced — Design System

> Enhanced transforme une idée orale en draft PRD structuré et challengé par la data, pour que ton équipe sache exactement ce qu'elle sait, ce qu'elle ne sait pas encore, et ce qu'il faudra prouver avant de builder.

Enhanced is an AI product-management copilot. A PM speaks their idea out loud; Enhanced returns a structured PRD draft, then challenges every assumption against the data the team already has. The output makes the boundary explicit between **what is known**, **what is hypothesis**, and **what must be proven before build**.

This design system is the shared visual + interaction grammar for that product. It is a **shadcn-flavoured system** (Kedebideri for UI + headings, Cantarell for body with signature italics, JetBrains Mono for data, neutral grayscale, blue-600 brand accent), adapted to feel calm, editorial, and document-like — closer to a writing tool than a SaaS dashboard.

---

## Sources

Only Figma design tokens were provided — no codebase, screenshots, or product copy beyond the one-line description. The UI kit in `ui_kits/` is therefore an **informed reconstruction** built from the tokens and product description, not a 1:1 recreation. Flag any divergence and we'll correct it.

- **Figma tokens**: `DesignSystem/*.tokens.json` (shadcn mode export — colors, typography, spacing, borders, shadows, semantic colors)
- **Codebase**: none provided
- **Product description**: provided as a one-line French brief (above)

---

## Index

| File | Purpose |
| --- | --- |
| `README.md` | This document — context, content & visual foundations, iconography |
| `SKILL.md` | Agent Skill manifest — invoke this system as a portable skill |
| `colors_and_type.css` | Single source of truth for colors, type, spacing, radius, shadow tokens |
| `assets/` | Logos, brand marks, illustrations, sample imagery |
| `fonts/` | Font reference (Kedebideri + Cantarell + JetBrains Mono are loaded from Google Fonts — see Visual Foundations) |
| `preview/` | Static cards rendered in the Design System tab |
| `ui_kits/enhanced-app/` | High-fidelity component recreation of the Enhanced app surface. Open `ui_kits/enhanced-app/index.html` to step through Compose → Generating → Draft → Transcript screens. Component source lives in `components.jsx` (Button, Sidebar, Toolbar, Composer, PRDSection, EvidenceCallout, SourceChip, Inspector, …) |

---

## CONTENT FUNDAMENTALS

Enhanced is a **bilingual French/English product** (the brief itself is in French). Copy is calm, direct, and slightly editorial — it sounds like a thoughtful PM writing notes to themselves, not a marketing page.

### Voice
- **Direct, second person, lowercase tutoiement in French** ("tu", "ton équipe", "ce que tu sais"). In English, second-person ("you", "your team") and friendly.
- **No marketing fluff**, no exclamation marks, no "Unleash" / "Supercharge" / "Revolutionize". If a sentence could be in a SaaS landing page from 2021, rewrite it.
- **Names the work, not the magic.** Prefer "draft your PRD" over "generate a PRD with AI". The AI is a tool, not the subject.

### Tone
- **Editorial calm.** Sentences are short and definite. Headings state facts: "What you know", "What's still a hypothesis", "What we'll need to prove".
- **Honest about uncertainty.** The product's whole point is to surface what is *not* known — copy should reflect that. Use words like "hypothèse", "à vérifier", "preuve manquante", "assumption", "needs evidence".
- **Numbers are concrete.** When showing data, never round to "lots" or "many". Show the actual count, the actual confidence.

### Casing
- **Sentence case everywhere**, including buttons, navigation, and headings. "Create new draft", not "Create New Draft".
- **Title case is reserved for proper nouns** (product names, framework names like "RICE", "MoSCoW").

### Pronouns
- **"You" / "tu"** for the user.
- **"We"** is used sparingly when Enhanced refers to its own analysis ("we found 3 prior conversations on this topic"). Avoid "I" — Enhanced is not personified as a single agent.

### Emoji & decoration
- **No emoji in product UI.** Use the Lucide icon set instead (see Iconography).
- **No exclamation points, no "✨" markers**, no rainbow gradients to denote "AI". If something is AI-generated, label it textually ("Generated from your voice note · 2 min ago") or with a small `sparkle` Lucide icon at 14–16px, neutral-500.

### Sample copy

> **Voice note → draft**  
> "I want to add a saved-searches feature so power users stop losing their filters."  
> 
> **Enhanced returns:**  
> **What you said you want** — A way for power users to persist filter combinations across sessions.  
> **What you implicitly assumed** — That power users currently lose their filters. (We found 0 support tickets matching this in the last 90 days.)  
> **What we'd need to prove before build** — That this is a top-3 friction point for the ICP, not a vocal-minority ask.  
> **One question first** — How many users hit the filter view more than once per session? (Mixpanel knows.)

Note the structure: *labelled sections, bold leading clause, plain body, parenthetical citations of internal data sources.* That cadence is the brand's content fingerprint.

---

## VISUAL FOUNDATIONS

### The system in one sentence
**Document-grade restraint.** White paper, neutral ink, one blue accent, hairline borders, generous whitespace. Like writing in a clean text editor that happens to have a brain.

### Colors
- **Base palette: shadcn neutrals.** `#FAFAFA → #0A0A0A` in 11 stops. This is the entire chromatic body of the UI — backgrounds, surfaces, text, borders.
- **Brand accent: blue-600 (`#2563EB`).** Used only for primary CTAs, focus rings, active selection, inline links, and the "evidence found" affirmative state. **Never a gradient.** A wash of `--brand-50` is acceptable behind quotes or AI-output blocks.
- **Destructive: red-600 (`#DC2626`).** Used for "no evidence found", contradictions, and destructive buttons.
- **No purples, teals, pinks.** No "AI gradient". The product's signal is precision, not magic.

### Typography
- **Three families, three jobs.**
  - **Kedebideri** (Google Fonts, 6 weights 400–900) — display, headings, all UI labels (buttons, status pills, captions, nav items). The product's "spoken voice" of UI. Contemporary sans by SIL International.
  - **Cantarell** (Google Fonts, 400/700 + matching italics) — body copy, paragraphs, and **especially italics for the signature "voice / quoted user speech" treatment**. Italic = something a human said.
  - **JetBrains Mono** (Google Fonts, 400/500) — anything measurable: Mixpanel queries, cohort names, exact counts, timestamps, keyboard shortcuts. Mono = this came from somewhere countable.
- **Headings sit at Kedebideri 600 (Semibold)**, never 700 — the calmest end of "bold". Negative tracking (`-0.7px` to `-1.5px`) to hold tight.
- **UI labels** (buttons, status pills, captions) are **Kedebideri 500 (Medium)** — the system's "speaking" weight.
- **Body** is Cantarell 400. Bold body is Cantarell 700.
- **Italics** are Cantarell italic at 400 — used **only** for voice transcripts, quoted user speech, and AI paraphrases of what was said. This is the brand's single distinctive typographic move: anything in italics is something a human said out loud.
- **The "Voice + Data + UI" rhythm**: a typical Enhanced screen mixes all three families in close proximity — *italic Cantarell* for the voice quote, **Kedebideri Medium** for the section label, regular Cantarell for the body, `JetBrains Mono` for the data citation. This polyphony IS the brand voice.

### Spacing
- **4px base unit.** T-shirt scale (`xs 8px · sm 12px · md 16px · lg 20px · xl 24px · 2xl 32px · 3xl 40px · 4xl 48px · 5xl 64px`) — same metric as Tailwind.
- **Document-density gaps.** Section gaps in app surfaces hover at `xl 24px` to `2xl 32px`. Inter-paragraph spacing in PRD output uses `md 16px`. Cards are spacious — never crowded.

### Backgrounds
- **Solid white (`#FFFFFF`) is the default.** No gradients, no textures, no image backgrounds inside the app.
- **`--neutral-50`** is the only acceptable alternate page-bg, used to separate a "frame" (toolbar, sidebar) from a "canvas" (draft document).
- **Brand wash (`--brand-50 #EFF6FF`)** behind generated content blocks or evidence callouts — only as a flat tint, never gradient.
- **No hero imagery, no abstract shapes.** The marketing page (if any) would lean on **type as imagery**: oversized headlines, real screenshots of the product.

### Animation
- **Subtle, fast, deliberate.** Most transitions are `120–180ms` with `ease-out`. Modal/sheet entrances use `200–240ms` with `cubic-bezier(0.16, 1, 0.3, 1)` (calm spring-out).
- **No bouncing.** No elastic overshoot. No springs that wobble.
- **Streaming text** (the AI typing out a draft) is the one animated affordance that earns its keep — and it should look like text being *written*, not like a typewriter loader.

### Hover states
- **Buttons**: primary darkens to `--neutral-700` (from `--neutral-900`); ghost gets `rgba(0,0,0,0.05)` overlay; outline gets a `rgba(0,0,0,0.033)` background.
- **Links**: underline appears on hover (no color shift).
- **Cards**: border darkens one step (`--neutral-200 → --neutral-300`), no scale, no shadow change. Hover is *acknowledged*, not *celebrated*.

### Press / active states
- **No shrink, no scale.** Press states use slight color deepening: primary `--neutral-900 → --neutral-950`, ghost `rgba(0,0,0,0.05) → rgba(0,0,0,0.08)`. The active border for outline buttons darkens to `--neutral-300`.

### Borders
- **1px solid `--border` (`#E5E5E5`)** is the standard. The system is famously hairline.
- **Focus ring**: 2px `--brand-600` outline, with a 2px offset against the background. Never a glow.
- **Dashed borders** are used only for placeholder zones ("Drop your voice note here").

### Shadows
- **Six-step elevation scale**, Tailwind-derived. Used sparingly — usually only `xs` or `sm` on hovering surfaces (dropdowns, popovers, tooltips). The document body itself never floats.
- **No inner shadows** anywhere in the system.
- **Composite shadows** (two stacked offsets) at `sm` and above for natural-looking depth.

### Transparency & blur
- **Modal backdrop**: `rgba(0,0,0,0.60)`, no blur.
- **Tooltip / popover surface**: `--popover #000000` with white text — high-contrast, inverted.
- **Backdrop blur is not used** anywhere in the system. The aesthetic is "paper", not "frosted glass".

### Corner radii
- **`--radius` = 10px** is the default for buttons, inputs, cards, and most surfaces.
- **`--radius-md` = 6px** for small chips and tags.
- **`--radius-2xl` = 16px** for modals and prominent panels.
- **`--radius-full`** only on avatars and circular icon buttons.

### Cards
- **White background, 1px `--border`, `--radius` 10px, no shadow by default.** Optional `--shadow-xs` for "lifted" cards in a sidebar. The card's job is to *contain*, not to *advertise*.
- **Card padding**: `xl 24px` for content cards, `md 16px` for compact list rows.

### Imagery
- **No stock photography in-product.** Marketing imagery (if/when needed) should be: warm-neutral, slightly desaturated, with subtle grain. No corporate office shots. No abstract 3D blobs.
- **Diagrams and charts** use the same blue + neutral palette. One accent color per chart, max.

### Layout rules
- **Max content width**: 720px for prose (the draft document), 1280px for app surfaces.
- **Sidebar widths**: 240px (collapsed: 56px). Right-side inspector: 320–360px.
- **Sticky toolbars** sit at top, 56px tall, white background, 1px bottom border. They do not blur or float.
- **No fixed FABs.** Primary actions live in the toolbar or inline with the draft.

---

## ICONOGRAPHY

The codebase did not ship a custom icon set. We use **[Lucide](https://lucide.dev)** as the system icon library — same metric and stroke style as the shadcn ecosystem, which the tokens otherwise mirror exactly.

> **⚠ Substitution flag:** Lucide is a CDN substitute. If Enhanced has its own icon library, drop it into `assets/icons/` and we'll swap.

### Rules
- **Stroke**: 1.5px (Lucide default for 16–24px size). 2px for icons ≥32px.
- **Color**: inherit `currentColor`. Default to `--muted-foreground` (`#737373`) in toolbars and `--foreground` for active states.
- **Size**: 14px in dense rows (toolbars, table cells), 16px standard, 20px in primary buttons, 24px+ in empty states or marketing.
- **Touch target**: always wrapped in a 32px (compact) or 36px (default) hit area, even when the glyph is 14–16px.

### When emoji is acceptable
- **Never in product UI.**
- Acceptable in: voice-note user-content (we don't strip them from quoted user speech), and one-off marketing collateral.

### When Unicode is used
- **Em-dash (—)** liberally in copy. It is the brand's punctuation of choice for parenthetical asides.
- **Middle-dot (·)** for metadata separators ("Draft · 2 min ago · 412 words").
- **Arrows (→ ←)** acceptable in callouts; prefer Lucide `arrow-right` in buttons.

### Logo
- The Enhanced wordmark sits in `assets/logo.svg` — set in Kedebideri Semibold, neutral-900, with the brand-600 dot following the wordmark. It is **always horizontal**, never on a colored background other than white or neutral-50.

---

## FONTS

Three Google Fonts power the system. They are loaded from the top of `colors_and_type.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Cantarell:ital,wght@0,400;0,700;1,400;1,700&family=Kedebideri:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600&display=swap');
```

| Family | Role | Weights used |
| --- | --- | --- |
| **Kedebideri** | Headings + UI labels | 400, 500 (default for labels), 600 (default for headings), 700 (heavy emphasis) |
| **Cantarell** | Body, paragraphs, italics for voice quotes | 400, 400 italic (**signature**), 700 |
| **JetBrains Mono** | Data citations, transcripts of measurable values, shortcuts | 400, 500 |

> All three are open, free Google Fonts. If the team has licensed `.woff2` files, drop them into `fonts/` and update the `@font-face` rules.
