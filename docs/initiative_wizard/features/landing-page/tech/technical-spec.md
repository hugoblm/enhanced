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
(marketing) layout.tsx          <-- No app chrome, marketing-only layout
  |
  v
page.tsx (Server Component)     <-- SSR: value prop + pitch-form island
  |
  v
pitch-form.tsx ("use client")   <-- Textarea + CTA button + form state
  |
  v (form submit)
createSession() Server Action   <-- src/app/actions/session.ts
  |
  +-- Validate input (Zod)
  +-- Generate anonymousId (crypto.randomUUID())
  +-- INSERT sessions (anonymous_id, raw_idea, current_step=1, status='active')
  +-- INSERT prds (session_id, title='', share_slug=null)
  +-- Set httpOnly cookie "enhanced_anon_id" = anonymousId
  +-- redirect(`/session/${sessionId}`)
```

### Route group

The `(marketing)` route group provides a layout without the app shell (no sidebar, no wizard chrome). This layout is separate from the `(app)` route group that holds `/session/[id]`.

```
src/app/
  (marketing)/
    layout.tsx          <-- Marketing layout (header? footer? minimal)
    page.tsx            <-- Landing page
  (app)/
    session/[id]/       <-- Wizard (separate feature)
```

---

## 3. Detailed specs

### 3.1 Route: `src/app/(marketing)/layout.tsx`

A minimal layout that wraps only the landing page. No app-level navigation. Inherits the root layout (fonts, metadata, globals.css).

```tsx
// src/app/(marketing)/layout.tsx
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      {children}
    </main>
  );
}
```

### 3.2 Page: `src/app/(marketing)/page.tsx`

Server Component. Renders:
1. Value proposition text (above the fold, max 2 sentences)
2. `<PitchForm />` client island

```tsx
// src/app/(marketing)/page.tsx
import { PitchForm } from "@/components/landing/pitch-form";

export default function LandingPage() {
  return (
    <section className="w-full max-w-2xl mx-auto px-4 py-16 text-center">
      <h1 className="font-heading text-4xl md:text-5xl tracking-tight mb-4">
        {/* Value proposition headline */}
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
        {/* Supporting sentence: what you do, what you get */}
      </p>
      <PitchForm />
    </section>
  );
}
```

**SEO metadata** is set via `export const metadata` in this file (title, description, OG tags).

### 3.3 Component: `src/components/landing/pitch-form.tsx`

Client Component (`"use client"`). Contains:

| Element | Details |
|---------|---------|
| `<textarea>` | Auto-resizing, placeholder text, `min-h-[120px]`, `max-h-[300px]` |
| CTA button | shadcn `<Button>`, label "Lancer le cadrage", `size="lg"` |
| Error display | `<p>` below textarea, conditional render, `text-destructive` |
| Loading state | `useTransition()` for pending state, button shows spinner + disabled |

**Auto-resize behavior:** The textarea uses a `useEffect` + `onInput` handler that sets `style.height` to `scrollHeight`. Capped at `max-h-[300px]` with `overflow-y: auto` beyond that.

**Form state:**

```tsx
"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { createSession } from "@/app/actions/session";

export function PitchForm() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createSession(formData);
      if (result.error) {
        setError(result.error);
      }
      // redirect happens inside the server action on success
    });
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-4 w-full">
      <textarea
        name="rawIdea"
        placeholder="Decrivez votre idee produit..."
        className="..."
        onChange={() => error && setError(null)}
        required
      />
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={isPending}>
        {isPending ? "Lancement..." : "Lancer le cadrage"}
      </Button>
    </form>
  );
}
```

**Error clearing:** The error message disappears on any `onChange` event in the textarea (maps to SC-LP-5).

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

  // 2. Generate anonymous identity
  const anonymousId = crypto.randomUUID();

  // 3. Create session + PRD in a transaction-like sequence
  const supabase = await createClient();

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      anonymous_id: anonymousId,
      user_id: null,
      raw_idea: parsed.data.rawIdea,
      current_step: 1,
      status: "active",
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    return {
      error: "Impossible de creer la session. Veuillez reessayer.",
    };
  }

  const { error: prdError } = await supabase.from("prds").insert({
    session_id: session.id,
    user_id: null,
    title: "",
    is_public: false,
  });

  if (prdError) {
    // Best effort: session exists but PRD failed. Still redirect.
    // The wizard can create the PRD later if missing.
    console.error("PRD creation failed:", prdError);
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
  redirect(`/session/${session.id}`);
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

## 6. Open questions [To verify]

| # | Question | Impact | Resolved? |
|---|----------|--------|-----------|
| 1 | Final copy for value proposition headline and supporting text | UX / messaging | No |
| 2 | Placeholder text for the textarea | UX | No |
| 3 | Should the existing `src/app/page.tsx` be moved or replaced? | File organization | No -- recommended: delete `src/app/page.tsx` and use `src/app/(marketing)/page.tsx` |
| 4 | PostHog provider setup -- is it already configured in root layout? | Analytics instrumentation | No -- needs to be added as a dependency task |
| 5 | Does the Supabase schema (sessions, prds tables) exist yet? | DB dependency | No -- migration must run before this feature works end-to-end |
