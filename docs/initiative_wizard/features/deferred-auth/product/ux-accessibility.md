# UX & Accessibility — Deferred Auth

> UX flows, interaction patterns, and WCAG 2.1 AA requirements for the Deferred Auth feature.
> This document ensures the auth experience is both smooth for the Builder PM persona and
> accessible to users with disabilities.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## User flows

### Primary flow -- Happy path (first-time anonymous to authenticated)

```
Landing page
  |
  v
[PM enters idea + clicks CTA]
  |
  v
Wizard loads (anonymous session, cookie set)
  |
  v
Step 1 conversation (2-3 min, AI asks questions)
  |
  v
AI generates first PRD block (First Use Case)
  |
  v
AuthGate modal slides up: "Sauvegardez votre travail"
  |
  +--- [PM enters email, clicks submit]
  |       |
  |       v
  |    "Vérifiez votre boîte mail" confirmation
  |       |
  |       +--- [PM minimizes modal, continues wizard] (optional)
  |       |
  |       v
  |    [PM clicks magic link in email]
  |       |
  |       v
  |    /auth/confirm → token verified → claimSession()
  |       |
  |       v
  |    Redirect back to wizard (authenticated)
  |       |
  |       v
  |    Wizard continues with all data preserved
  |
  +--- [PM minimizes modal without entering email]
          |
          v
       Wizard continues (anonymous), auth-pending indicator visible
          |
          v
       PM can reopen modal later from the indicator
```

### Error flow -- Expired magic link

```
[PM clicks expired magic link]
  |
  v
/auth/confirm → token verification fails
  |
  v
Error page: "Ce lien a expiré"
  + "Renvoyer le lien" button
  |
  v
[PM clicks resend]
  |
  v
New magic link sent → PM clicks it → success flow resumes
```

### Error flow -- Session already claimed

```
[PM completes magic link flow]
  |
  v
claimSession() → session already has a different user_id
  |
  v
Error message: "Cette session a déjà été associée à un autre compte"
  + Option to start a new session
```

### Edge flow -- Returning authenticated user

```
[Authenticated PM opens Enhanced]
  |
  v
Wizard loads with existing session (user_id set)
  |
  v
No AuthGate modal appears at any point
  |
  v
Wizard proceeds normally
```

---

## UX requirements

### AuthGate modal

- **Trigger:** Appears after the first PRD block is generated via `update_prd` tool call, only for anonymous users
- **Position:** Bottom of the viewport, slides up with a smooth animation (300ms ease-out)
- **Size:** Partial overlay -- does not cover the full screen. PM should be able to see the PRD block behind it
- **Content hierarchy:**
  1. Headline: "Sauvegardez votre travail" (large, Kedebideri font)
  2. Subtext: Brief explanation -- e.g., "Entrez votre email pour sauvegarder votre PRD et y revenir plus tard"
  3. Email input (full-width, large touch target)
  4. Submit button ("Continuer")
  5. Dismiss/minimize link: "Plus tard" (secondary, below the button)
- **States:**
  - **Default:** Email input + submit button
  - **Loading:** Submit button shows spinner, input disabled
  - **Sent:** "Verifiez votre boite mail" message replaces the form, minimize button prominent
  - **Error (validation):** Inline error under email input
  - **Error (server):** Toast or inline error with retry option

### Auth-pending indicator

- **Appears after:** Modal is minimized while magic link is pending
- **Position:** Top of the wizard, non-intrusive banner or small badge near the header
- **Content:** "Email en attente de verification" or similar
- **Interaction:** Clicking the indicator reopens the auth modal
- **Disappears:** After successful auth completion

### Transition feedback

- **On auth completion:** Brief success indicator (e.g., green checkmark animation or toast: "Connecte !") before the wizard refreshes
- **Duration:** 1-2 seconds max, then wizard continues normally
- **No full page reload** if possible -- use client-side state update

### Visual design

- Modal uses Obra design tokens: Kedebideri for headline, Cantarell for body text
- Color palette follows the existing wizard theme (neutral background, accent for CTA)
- Email input follows shadcn/ui Input component styling
- Submit button follows shadcn/ui Button component (primary variant)
- Minimize link uses secondary/ghost styling

---

## WCAG 2.1 AA requirements

### Perceivable

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| 1.1.1 Non-text content | All icons (minimize, close, loading spinner) must have accessible text alternatives | `aria-label` on icon buttons, `role="status"` on spinner |
| 1.3.1 Info and relationships | Form structure must be programmatically determinable | `<label>` associated with email `<input>` via `htmlFor`, form wrapped in `<form>` element |
| 1.3.2 Meaningful sequence | Modal content must be read in logical order by screen readers | DOM order matches visual order: headline > subtext > input > button > dismiss |
| 1.4.3 Contrast (minimum) | Text and interactive elements meet 4.5:1 contrast ratio | Verify all text colors against modal background using Obra tokens |
| 1.4.11 Non-text contrast | Input borders, button outlines meet 3:1 ratio against background | Test with the Obra color palette (both light and dark mode if applicable) |

### Operable

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| 2.1.1 Keyboard | All modal interactions must be keyboard-accessible | Tab through: email input > submit > dismiss. Enter submits. Escape minimizes |
| 2.1.2 No keyboard trap | Focus must not get trapped in the modal | Escape or dismiss link returns focus to the wizard conversation. Tab cycles through modal elements, then exits |
| 2.4.3 Focus order | Focus order within the modal must be logical | Email input > submit button > minimize link |
| 2.4.7 Focus visible | Focused elements must have a visible focus indicator | Use the default shadcn/ui focus ring (Obra-compatible) |
| 2.4.11 Focus not obscured | Focus indicator must not be hidden by other elements | Modal must not overlap its own focus indicators |

### Understandable

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| 3.1.1 Language | Modal content language must be programmatically determinable | `lang="fr"` on the modal root (or inherited from page) |
| 3.2.2 On input | No unexpected context change on input focus | Email input does not trigger any navigation or modal state change on focus |
| 3.3.1 Error identification | Validation errors must identify the field and describe the error | Inline error message below the email input: "Veuillez entrer une adresse email valide" |
| 3.3.2 Labels or instructions | Email input must have a visible label or placeholder | Visible `<label>` above input: "Votre adresse email". Placeholder as secondary hint only |
| 3.3.3 Error suggestion | When possible, suggest a correction | For email format errors, suggest the expected format (e.g., "nom@exemple.com") |

### Robust

| Criterion | Requirement | Implementation |
|-----------|-------------|----------------|
| 4.1.2 Name, role, value | Modal and its elements must have correct ARIA roles and states | Modal: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the headline. Submit button: `aria-disabled="true"` when loading |
| 4.1.3 Status messages | Status changes (sent, error) must be announced to screen readers | Success message ("Verifiez votre boite mail"): `role="status"`, `aria-live="polite"`. Error messages: `role="alert"` |

---

## A11y checklist

Pre-release accessibility checks (manual + automated):

- [ ] **Focus management:** When modal opens, focus moves to the email input. When modal closes, focus returns to the element that triggered it (or to the wizard conversation)
- [ ] **Keyboard navigation:** Complete the full auth flow using only keyboard (Tab, Enter, Escape). No focus traps
- [ ] **Screen reader test:** VoiceOver (macOS) reads the modal in logical order: headline, subtext, label, input, button, dismiss. Status messages are announced
- [ ] **Contrast check:** Run axe or Lighthouse on the modal. All text meets 4.5:1, all UI controls meet 3:1
- [ ] **Zoom test:** Modal is usable at 200% browser zoom. Content does not overflow or become hidden
- [ ] **Reduced motion:** Modal animation respects `prefers-reduced-motion: reduce`. If the user prefers reduced motion, the modal appears without slide animation
- [ ] **Error states:** Screen reader announces validation errors. Error messages are associated with the input via `aria-describedby`
- [ ] **Touch targets:** Submit button and minimize link meet 44x44px minimum touch target (for tablet users)
- [ ] **Color independence:** Validation errors are not communicated by color alone (include text message and/or icon)
