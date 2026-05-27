# UX & Accessibility — \<Feature name\>

> The user flows and the **accessibility (a11y)** bar this feature must clear. Accessibility is a
> requirement, not a nice-to-have: it widens the audience and is often a legal obligation.

**Status:** `Draft` · `In review` · `Approved` · **Author:** \<name\> · **Date:** \<date\>
**Design link:** \<Figma / mockups\>

---

## User flows

The main paths a user takes through this feature. Describe each step and the expected result.

### Primary flow — \<name\>
1. \<step\> → \<what the user sees / what happens\>
2. \<step\> → \<…\>
3. \<…\>

### Alternative / error flows
- **\<situation\>** → \<how the UI responds (empty state, error, loading, offline)\>

> 🔍 **Challenge:** Have you designed the empty, loading, error, and "no permission" states — not
> just the happy path? Most UX gaps live there.

---

## UX requirements
- **Clarity:** \<the feature must be understandable to its least-technical persona\>
- **Effort:** \<key actions should take N steps / under X seconds\>
- **Feedback:** \<every action gives visible feedback; destructive actions are confirmed\>
- **Consistency:** \<reuses existing components/patterns — list them\>

---

## Accessibility requirements (target: WCAG 2.1 AA)

- **Keyboard:** every interactive element reachable and operable by keyboard; visible focus state.
- **Screen readers:** meaningful labels/roles (ARIA where needed); images have alt text; form
  fields have associated labels.
- **Contrast:** text meets AA contrast (4.5:1 normal, 3:1 large); don't rely on color alone to
  convey meaning.
- **Targets & motion:** adequate touch-target size; respect `prefers-reduced-motion`.
- **Structure:** logical heading order; landmarks; correct reading/tab order.
- **Errors:** errors are announced and described in text, not just color.

### A11y acceptance checklist
- [ ] Full keyboard-only walkthrough of the primary flow passes
- [ ] Screen-reader pass (VoiceOver / NVDA) on the primary flow
- [ ] Automated check (e.g. axe) run with no critical violations
- [ ] Contrast verified on all new UI
- [ ] Reduced-motion and zoom (200%) verified

> 🔍 **Challenge:** Could someone using only a keyboard and a screen reader complete the primary
> flow start to finish? If you don't know, that's a `[To verify]` — test it before shipping.
