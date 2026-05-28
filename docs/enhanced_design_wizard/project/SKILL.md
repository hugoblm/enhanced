---
name: enhanced-design
description: Use this skill to generate well-branded interfaces and assets for Enhanced, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

# Enhanced — Design System Skill

Enhanced is an AI product-management copilot that turns a spoken idea into a structured PRD draft, then challenges every assumption against the team's existing data. The visual system is **shadcn-flavoured editorial restraint**: Kedebideri for UI labels & headings, Cantarell for body (with italics as the signature "voice quote" treatment), JetBrains Mono for data citations — hairline borders, generous whitespace, a single blue-600 accent.

## How to use

1. **Read `README.md`** first — it covers content voice (calm, direct, lowercase tutoiement in French; second-person you in English; no marketing fluff), visual foundations (paper-white surfaces, no gradients, 10px radius default), and iconography (Lucide, 1.5px stroke).
2. **Source the tokens** from `colors_and_type.css`. Every color, radius, shadow, spacing step and type ramp is a CSS custom property. Do not invent new values.
3. **Lift components** from `ui_kits/enhanced-app/` — the JSX files there are reference implementations of the Enhanced app surface (sidebar, draft editor, voice-note composer, evidence callouts, PRD section blocks).
4. **Copy assets** out of `assets/` (logo, illustrations) rather than re-drawing them.

## When invoked without other guidance

Ask the user what they want to build (a mock screen, a marketing page, a deck slide, a feature concept) and a few clarifying questions about audience, surface, and fidelity. Then output:

- **Static HTML files** for mocks, slides, throwaway prototypes (link `colors_and_type.css`, use the JSX in `ui_kits/` as cosmetic reference).
- **Production-ready JSX/CSS** when working inside an Enhanced codebase — match the token names exactly.

## Non-negotiables

- **Three fonts, three jobs.** Kedebideri for headings + UI labels (buttons, captions, status pills). Cantarell for body. **Cantarell italic for anything quoted from a user's voice** — this is the brand's signature typographic move. JetBrains Mono for any measurable value.
- **Kedebideri headings at 600 (Semibold)**, never 700. Negative letter-spacing on headings.
- **One blue.** `--brand-600 #2563EB`. No gradients ever.
- **Hairline borders** at `--border #E5E5E5`. Shadows are reserved for floating surfaces.
- **No emoji in UI.** Use Lucide icons at 1.5px stroke.
- **Sentence case** for all UI text.
- **No "AI sparkle" decoration.** If something is AI-generated, label it textually.
