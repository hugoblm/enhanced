# Technical Specification -- Landing Page

**Status:** Draft -- **Author:** Hugo -- **Date:** 2026-05-27
**PRD:** [`../../prd.md`](../../prd.md) -- **Relevant .ai-context:** [`.ai-context/README.md`](../../../../../.ai-context/README.md)

---

## Spec files (index)

| File | Concern |
|------|---------|
| `technical-spec.md` | Architecture, components, data flow, server action |
| `release-plan.md` | Branching, atomic commits, rollback, DoD |
| `test-plan.md` | Vitest + Playwright test plan, Gherkin traceability |

---

## 1. Summary & approach

The landing page is a Server Component at `src/app/(marketing)/page.tsx` with a single Client Component island `src/components/landing/pitch-form.tsx`. The page renders server-side for fast LCP and SEO. On form submission, a Server Action `createSession()` creates a `sessions` row and a `prds` skeleton row in Supabase, sets an anonymous identity cookie, and redirects to `/session/[id]`.

The approach is intentionally minimal: no client-side routing, no global state, no fetching. The form is the only interactive element on the page.

---

## 2. Architecture at a glance

```
Browser (GET /)
  |
  v
root layout.tsx                 <-- Fonts, metadata, <body min-h-full flex-col>
  |
  v
(marketing)/page.tsx            <-- SSR: header, eyebrow, h1, PitchForm, WhatSection, footer
  |
  v
pitch-form.tsx ("use client")   <-- Composer + counter + CTA + form state
  |
  v (form submit)
createSession() Server Action   <-- src/app/actions/session.ts
  |
  +-- Validate input (Zod) — also runs client-side first
  +-- Pre-generate sessionId + anonymousId (crypto.randomUUID())
  +-- INSERT sessions (id, anonymous_id, raw_idea, current_step=1, status='active')
  +-- INSERT prds (session_id, title='', is_public=false)  // best-effort
  +-- Set httpOnly cookie "enhanced_anon_id" = anonymousId  (30-day TTL)
  +-- redirect(`/session/${sessionId}`)
```

### Route group

The `(marketing)` route group exists for URL grouping. V1 has no `(marketing)/layout.tsx` — the root layout's flex-column body is sufficient. The future `(app)` route group will host `/session/[id]` (wizard-shell feature).

```
src/app/
  layout.tsx               <-- Root layout (only one for V1)
  (marketing)/
    page.tsx               <-- Landing page (this feature)
  (app)/
    session/[id]/          <-- Wizard (separate feature, not yet shipped)
```

---

## 3. Detailed specs

### 3.1 Route group: `src/app/(marketing)/`

The `(marketing)` route group exists for URL grouping (so future marketing routes — `/manifesto`, `/changelog`, etc. — can share a layout independently from the wizard). For V1 the group **has no `layout.tsx`** — the root layout's `<body className="min-h-full flex flex-col">` already provides the flex-column container, and adding a marketing-specific layout would have been an identical no-op wrapper. The landing page sits directly at `src/app/(marketing)/page.tsx`.

A `(marketing)/layout.tsx` will be re-introduced if/when marketing pages need a shared header/footer that the landing page doesn't render itself.

### 3.2 Page: `src/app/(marketing)/page.tsx`

Server Component. Renders the full Obra-style landing in a centered single-column layout (max-width ~740px) inside the root layout's flex-column `<body>`. From top to bottom:

1. **Header** — logo + wordmark, nav links ("Drafts publics", "Manifeste" — `href="#"` in V1), FR/EN language toggle (display-only, not wired), and a "Se connecter" outline button (also display-only).
2. **Eyebrow pill** — black "V1" badge + tagline ("Pour les équipes qui buildent 10x plus vite…").
3. **H1** — Kedebideri 600, 56px desktop (36px below `md`), tracking `-2px`, two lines.
4. **`<PitchForm />` client island** — the composer card.
5. **WhatSection** — two-column grid (`Ce qu'Enhanced fait` / `Ce que ce n'est pas`), check / X icons, body text.
6. **Footer** — mono caption with the project tagline.

The page is fully static-prerendered (`○` in `next build`), no client JS beyond the PitchForm island.

> **V1 trims (deviation from the original prototype):** the voice-note mic button and the "Quelques drafts récents" public-drafts strip are removed. V1 has no voice input and no real public PRDs to show; fake examples would mislead the first visitors.

**SEO metadata** is set via `export const metadata` (title, description). OpenGraph / Twitter card / JSON-LD are intentionally deferred to a later commit before merging to `main` (see release-plan §"Manques additionnels pour main").

**SEO metadata** is set via `export const metadata` in this file (title, description, OG tags).

### 3.3 Component: `src/components/landing/pitch-form.tsx`

Client Component (`"use client"`). Composer-style card matching the Obra prototype.

| Element | Details |
|---------|---------|
| Composer card | `rounded-2xl` container, focus state thickens the border and adds a soft shadow |
| `<textarea>` | Controlled (`value` state), `rows={6}`, Cantarell 18px, transparent background inside the card |
| Footer bar | Flex row separated by a top border; holds the live counter (left) and the CTA (right) |
| Live counter | Renders `{value.trim().length} / 20 caractères` while below threshold; **disappears at 20+** |
| CTA button | shadcn `<Button size="lg">`, label "Lancer le cadrage", arrow-right icon. **Visually disabled** (opacity 50% + `cursor-not-allowed`) while below 20 chars or in-flight |
| Error display | `<p role="alert">` below the card, linked to the textarea via `aria-describedby` |

**Disabled-CTA strategy.** The CTA uses `aria-disabled={isCtaInactive}` (not the HTML `disabled` attribute) when the user is below 20 chars — clicks still fire so the form submits, Zod fails, and the inline error appears. The HTML `disabled` attribute is only set during `isPending` to actually block double-submits in-flight. This gives the user a clear visual hint without trapping screen-reader users.

**Error clearing.** The error message clears as soon as the user starts typing again — the `onChange` handler resets both `value` and (if set) `error`.

**Form state (shape):**

```tsx
"use client";

import { type SyntheticEvent, useRef, useState, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSession } from "@/app/actions/session";
import { rawIdeaSchema } from "@/lib/schemas/session";
import { cn } from "@/lib/utils";

const MIN_CHARS = 20;

export function PitchForm() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isBelowMin = value.trim().length < MIN_CHARS;
  const isCtaInactive = isBelowMin || isPending;

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const parsed = rawIdeaSchema.safeParse({ rawIdea: formData.get("rawIdea") });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      textareaRef.current?.focus();
      return;
    }

    startTransition(async () => {
      const result = await createSession(formData);
      if (result?.error) {
        setError(result.error);
        textareaRef.current?.focus();
      }
      // redirect happens inside the server action on success
    });
  }
  // ...JSX renders the composer card, counter, CTA, and error <p>
}
```

Maps to Gherkin SC-LP-3 (empty), SC-LP-4 (too-short), SC-LP-5 (clear on type), SC-LP-6 (server error preserves input + re-enables CTA).

### 3.4 Server Action: `src/app/actions/session.ts`

```tsx
"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { rawIdeaSchema } from "@/lib/schemas/session";

export async function createSession(formData: FormData) {
  const rawIdea = formData.get("rawIdea");

  // 1. Validate
  const parsed = rawIdeaSchema.safeParse({ rawIdea });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // 2. Pre-generate both UUIDs server-side. We *cannot* use
  //    .insert().select() because supabase-js then asks PostgREST for a
  //    RETURNING clause, which is filtered through the SELECT RLS policy.
  //    Our select_own_sessions policy can't match anon rows (no JWT claim
  //    to compare against), so the call would 42501 even though the
  //    INSERT itself is valid. Generating the IDs locally lets us skip
  //    .select() entirely and still know the redirect target.
  const sessionId = crypto.randomUUID();
  const anonymousId = crypto.randomUUID();

  // 3. Create session + PRD in a transaction-like sequence
  const supabase = await createClient();

  const { error: sessionError } = await supabase.from("sessions").insert({
    id: sessionId,
    anonymous_id: anonymousId,
    user_id: null,
    raw_idea: parsed.data.rawIdea,
    current_step: 1,
    status: "active",
  });

  if (sessionError) {
    console.error("[createSession] sessions.insert failed:", sessionError);
    return {
      error: "Impossible de créer la session. Veuillez réessayer.",
    };
  }

  const { error: prdError } = await supabase.from("prds").insert({
    session_id: sessionId,
    user_id: null,
    title: "",
    is_public: false,
  });

  if (prdError) {
    // Best effort: session exists but PRD failed. Still redirect.
    // The wizard can create the PRD later if missing.
    console.error("[createSession] prds.insert failed:", prdError);
  }

  // 4. Set anonymous cookie
  const cookieStore = await cookies();
  cookieStore.set("enhanced_anon_id", anonymousId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  // 5. Redirect to wizard
  redirect(`/session/${sessionId}`);
}
```

### 3.5 Zod schema: `src/lib/schemas/session.ts`

```tsx
import { z } from "zod";

export const rawIdeaSchema = z.object({
  rawIdea: z
    .string()
    .trim()
    .min(20, {
      message:
        "Votre idee doit contenir au moins 20 caracteres pour que l'IA puisse travailler dessus.",
    })
    .max(5000, {
      message: "L'idee ne doit pas depasser 5000 caracteres.",
    }),
});

export type RawIdeaInput = z.infer<typeof rawIdeaSchema>;
```

**Validation rules:**
- Min 20 characters (after trim) -- prevents trivially short input (SC-LP-4)
- Max 5000 characters -- prevents abuse, fits DB `text` column
- `.trim()` -- whitespace-only strings fail the min check (SC-LP-3)
- French error messages to match the UI language

### 3.6 Cookie: `enhanced_anon_id`

| Property | Value |
|----------|-------|
| Name | `enhanced_anon_id` |
| Value | UUID v4 |
| httpOnly | `true` |
| Secure | `true` in production |
| SameSite | `lax` |
| Path | `/` |
| MaxAge | 30 days |

This cookie links the browser to the anonymous session. The `deferred-auth` feature (separate spec) later reads this cookie to claim the session when the user authenticates.

### 3.7 PostHog tracking

Track one event on successful session creation:

```tsx
// Inside pitch-form.tsx, after successful createSession
posthog.capture("landing_pitch_submitted", {
  raw_idea_length: rawIdea.length,
});
```

This runs client-side after the redirect completes (or in a `useEffect` on the wizard page, keyed by `isNewSession`). The exact implementation depends on whether PostHog is initialized as a client-side provider (likely via a `PostHogProvider` in the root layout).

---

## 4. Non-functional requirements

| Requirement | Target | How |
|-------------|--------|-----|
| LCP | < 1.5s | Server Component, minimal client JS (only pitch-form island) |
| Client JS payload | < 50 KB gzipped | No heavy libraries on the landing page; shadcn Button is tree-shakeable |
| Accessibility | WCAG 2.1 AA | Labels on textarea, error linked via `aria-describedby`, focus management on error |
| Responsive | 768px -- 1440px+ | Single column layout, `max-w-2xl` container, `px-4` padding |
| Touch targets | >= 44x44px | CTA button `size="lg"` meets this by default |
| Error resilience | Form preserves input on failure | `textarea` value is never cleared on error; only cleared on successful redirect |
| Font size | >= 16px base | Obra tokens set 16px base; textarea inherits |

---

## 5. Delivery & testing

- **Release plan:** [`release-plan.md`](release-plan.md)
- **Test plan:** [`test-plan.md`](test-plan.md)

---

## 6. Open questions

| # | Question | Impact | Status |
|---|----------|--------|--------|
| 1 | Final copy for value proposition headline and supporting text | UX / messaging | ✅ Resolved — copy taken from `COPY.fr.landing` in the design bundle |
| 2 | Placeholder text for the textarea | UX | ✅ Resolved — "Décris l'idée en quelques phrases…" from the design bundle |
| 3 | Should the existing `src/app/page.tsx` be moved or replaced? | File organization | ✅ Resolved — deleted in the first commit, replaced by `src/app/(marketing)/page.tsx` |
| 4 | PostHog provider setup — is it already configured in root layout? | Analytics instrumentation | ❌ **Deferred** — no PostHog provider in V1. `landing_pitch_submitted` event will be added when the cross-cutting PostHog setup lands (separate commit or alongside a later feature) |
| 5 | Does the Supabase schema (`sessions`, `prds` tables) exist yet? | DB dependency | ✅ Resolved — migration `20260528000000_create_sessions_and_prds.sql` applied on Supabase Cloud |
| 6 | Were anon RLS inserts going to work as planned? | Security / function | ⚠️ **Surfaced during build** — `.insert().select()` triggered the SELECT RLS policy on the RETURNING clause, blocking the call. Workaround: pre-generate UUIDs server-side so `.select()` is no longer needed (see §3.4). Documented in migrations 010000 / 020000 / 030000 / 040000. |
