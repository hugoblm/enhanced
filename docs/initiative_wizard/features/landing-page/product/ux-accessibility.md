# UX & Accessibility -- Landing Page

**Status:** Draft · **Author:** Hugo · **Date:** 2026-05-27
**Design link:** TBD (Figma)

---

## User flows

### Primary flow -- Pitch an idea and enter the wizard

1. **PM arrives on `/`** -- sees a clean, minimal page with value proposition, textarea, and CTA.
2. **PM reads value proposition** -- understands in one sentence what Enhanced does.
3. **PM clicks into textarea** -- placeholder text guides what to write (e.g., "Decrivez votre idee produit, le probleme que vous voulez resoudre...").
4. **PM types their idea** -- textarea is large, comfortable. While trimmed length < 20 chars, a small "X / 20 caractères" counter sits in the composer footer (replaces what used to be a static hint) and the CTA renders with reduced opacity. Both vanish at 20+ chars.
5. **PM clicks "Lancer le cadrage"** -- button enters loading state (spinner + disabled).
6. **Server Action executes** -- `createSession(rawIdea, anonymousId)` creates anonymous session, generates PRD skeleton, sets cookie.
7. **Redirect to `/session/[id]`** -- PM lands in the wizard with their idea visible in the conversation panel. Total time: < 3 seconds.

### Alternative flow -- Invalid input

1. **PM clicks CTA with empty/short textarea** -- inline error appears below the textarea.
2. **Error message** -- clear, specific: "Votre idee doit contenir au moins 20 caracteres pour lancer le cadrage."
3. **Focus returns to textarea** -- PM corrects and resubmits.
4. **Error clears on valid input** -- PM types enough characters, error disappears.

### Alternative flow -- Server error

1. **PM clicks CTA, server fails** -- loading state resolves, error message appears.
2. **Error message** -- user-friendly: "Une erreur est survenue. Veuillez reessayer." with a retry affordance.
3. **Idea text preserved** -- PM does not have to retype.
4. **CTA re-enabled** -- PM can click again to retry.

---

## UX requirements

### Layout

- **Centered single-column layout** -- content max-width ~640px, horizontally centered. No sidebar, no navigation, no distractions. `[Evidence]` -- minimal design principle from PRD.
- **Visual hierarchy (top to bottom):**
  1. Enhanced logo or wordmark (small, subtle -- the product is not established enough for a prominent brand bar).
  2. Value proposition -- 1-2 sentences, large text (heading level), high contrast.
  3. Textarea -- large, prominent, minimum 4-5 visible rows. Border or background that makes it the clear focal point.
  4. CTA button -- full-width or near-full-width within the content column. High contrast, unmissable.
  5. Optional: a very short secondary line below the CTA ("Pas de compte requis. 30 minutes.") `[Assumption]` -- secondary copy TBD.
- **No scroll required on desktop** -- all interactive elements above the fold on a 1080p viewport.
- **Breathing room** -- generous vertical spacing between elements. Obra spacing tokens.

### Textarea

- **Size:** Fixed at `rows={6}` (~6 visible lines). No auto-resize in V1 — overflow scrolls inside the textarea. `[Evidence]` — chosen for layout stability; auto-grow can be revisited if users report friction.
- **Placeholder text:** "Décris l'idée en quelques phrases. Aussi vague soit-elle. On la remettra en forme." — from the Obra design bundle.
- **Live character counter:** A small `font-mono` "X / 20 caractères" appears in the composer footer **while the trimmed value is below 20 chars** and disappears at 20+. Rendered with `aria-live="polite"` so screen readers announce progress without interrupting. (Original V1 plan said "no counter"; this was changed during build because the counter anticipates the user's next move better than the post-submit error did.)
- **Font:** Cantarell, 18px in the textarea (>= 16px so iOS doesn't zoom on focus).

### CTA button

- **Label:** "Lancer le cadrage" with a right-arrow icon.
- **Style:** shadcn `<Button size="lg">` — Obra primary color, comfortable padding, touch target ≥ 44×44px.
- **Visually disabled below the 20-char threshold:** the CTA renders with `opacity-50` + `cursor-not-allowed` while `value.trim().length < 20`. Implemented via `aria-disabled` (not the HTML `disabled` attribute) so clicks still fire — Zod runs, the inline error surfaces, focus returns to the textarea. (Original V1 plan said "not disabled, validation on submit"; the visual disabled state was added during build to give users a clearer hint of what's missing.)
- **Loading state:** During the in-flight server action the HTML `disabled` attribute *is* set (alongside a spinner + "Lancement…" label) to actually block double-submits.
- **Re-enabled on error:** If the server action returns an error, the button returns to its normal state and focus moves back to the textarea.

### Loading state

- **Duration:** Target < 3 seconds for session creation + redirect. `[To verify]` -- depends on Supabase and network latency.
- **Feedback:** Button loading state is the primary indicator. No full-page overlay or blocking modal.

### Error states

- **Inline placement:** Error messages appear directly below the textarea, not as alerts, toasts, or popups.
- **Color:** Obra error color (destructive red from tokens).
- **Icon:** Optional warning icon alongside text.
- **Dismissal:** Error clears when the user starts typing valid content.

---

## Accessibility requirements (WCAG 2.1 AA)

### Perceivable

- **Color contrast:** All text meets WCAG AA contrast ratio (>= 4.5:1 for normal text, >= 3:1 for large text). Error messages and value proposition text included.
- **Non-color cues:** Error states communicate via text AND icon, not just red color (for color-blind users).
- **Text resizing:** Page remains usable at 200% browser zoom without content clipping or overlap.

### Operable

- **Keyboard navigation:** The entire flow is completable via keyboard only (Tab to textarea, type, Tab to CTA, Enter to submit).
- **Focus management:** After an error, focus moves to the textarea. After successful submission, focus management is handled by the redirect.
- **No keyboard traps:** Tab order is linear (value prop -> textarea -> CTA). No hidden focusable elements.
- **Touch targets:** CTA button >= 44x44px on all viewports.

### Understandable

- **Labels:** The textarea has a visible label (the value proposition sentence acts as the label) or an explicit `<label>` element. If no visible label, use `aria-label` on the textarea.
- **Error identification:** Error messages identify the specific issue (not just "Error") and suggest correction.
- **Language:** The page `lang` attribute is set to `fr` (French content).

### Robust

- **Semantic HTML:** Use `<main>`, `<form>`, `<textarea>`, `<button type="submit">`. No `<div>` buttons.
- **ARIA roles:** Error messages use `role="alert"` or `aria-live="polite"` to announce to screen readers.
- **Form association:** Textarea is associated with its error message via `aria-describedby`.

### A11y acceptance checklist

- [ ] Textarea has a visible label or `aria-label`
- [ ] CTA button is `<button type="submit">` within a `<form>`
- [ ] Error messages use `role="alert"` or `aria-live="polite"`
- [ ] Error messages are linked to the textarea via `aria-describedby`
- [ ] Color contrast >= 4.5:1 on all text (verify with axe or Lighthouse)
- [ ] Full flow completable via keyboard only (Tab + Enter)
- [ ] Page is usable at 200% browser zoom
- [ ] Touch targets >= 44x44px on tablet
- [ ] Page `lang` attribute is set to `fr`
- [ ] No autoplaying media, animations respect `prefers-reduced-motion`
