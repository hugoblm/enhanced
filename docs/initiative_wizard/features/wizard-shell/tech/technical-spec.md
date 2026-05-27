# Technical Specification -- Wizard Shell

**Status:** Draft -- **Author:** Hugo -- **Date:** 2026-05-27
**PRD:** [`../../prd.md`](../../prd.md) -- **Relevant .ai-context:** [`.ai-context/README.md`](../../../../../.ai-context/README.md)

---

## Spec files (index)

| File | Concern |
|------|---------|
| `technical-spec.md` | Architecture, components, state management, responsive behavior |
| `release-plan.md` | Branching, atomic commits, rollback, DoD |
| `test-plan.md` | Vitest + Playwright test plan, Gherkin traceability |

---

## 1. Summary & approach

The wizard shell is the structural container for the entire Enhanced experience. It is a Client Component (`wizard-shell.tsx`) that renders a split-view layout: conversation panel left (~45%), PRD panel right (~55%), with a 4-step progress indicator at top. It is backed by a Zustand store (`wizard-store.ts`) that tracks step progression, panel visibility, and responsive breakpoints.

This feature is the **shell only** -- it provides the layout container and step navigation. The actual content of both panels (messages, cards, PRD blocks) is handled by `conversation-engine` and `prd-live-builder`, which render inside the shell's slots.

---

## 2. Architecture at a glance

```
/session/[id]
  |
  v
(app) layout.tsx                    <-- App layout (session chrome)
  |
  v
page.tsx (Server Component)         <-- Loads session from DB, passes to client
  |
  v
wizard-client.tsx ("use client")    <-- Client boundary, initializes store
  |
  v
wizard-shell.tsx ("use client")     <-- Split-view layout orchestrator
  |
  +-- StepIndicator                 <-- 4-step progress bar
  +-- ConversationPanel             <-- Left panel container (slot for conversation-engine)
  +-- PrdPanel                      <-- Right panel container (slot for prd-live-builder)
  +-- MobileTabSwitcher             <-- Tabs on viewport < 1024px
```

### Route structure

```
src/app/
  (app)/
    layout.tsx                      <-- App-level layout (auth guard, app chrome)
    session/
      [id]/
        page.tsx                    <-- Server Component: load session, validate
        wizard-client.tsx           <-- Client Component: hydrate store + render shell
```

---

## 3. Detailed specs

### 3.1 Route: `src/app/(app)/layout.tsx`

App-level layout. In V1, this is minimal -- it wraps children without heavy chrome. It may include a thin header with the Enhanced logo and session title in later iterations.

```tsx
// src/app/(app)/layout.tsx
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-screen flex flex-col">{children}</div>;
}
```

### 3.2 Page: `src/app/(app)/session/[id]/page.tsx`

Server Component. Responsibilities:
1. Read session ID from params
2. Load session from Supabase (via server client)
3. Validate session exists (404 if not)
4. Validate access: check `anonymous_id` cookie or `user_id` match
5. Pass session data to `<WizardClient />`

```tsx
// src/app/(app)/session/[id]/page.tsx
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { WizardClient } from "./wizard-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function SessionPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Load session with its PRD
  const { data: session, error } = await supabase
    .from("sessions")
    .select("*, prds(*)")
    .eq("id", id)
    .single();

  if (error || !session) {
    notFound();
  }

  // Access control: match anonymous cookie or authenticated user
  const cookieStore = await cookies();
  const anonId = cookieStore.get("enhanced_anon_id")?.value;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isOwner =
    (session.anonymous_id && session.anonymous_id === anonId) ||
    (session.user_id && session.user_id === user?.id);

  if (!isOwner) {
    notFound(); // or redirect to landing
  }

  return <WizardClient session={session} />;
}
```

### 3.3 Client wrapper: `src/app/(app)/session/[id]/wizard-client.tsx`

Client Component boundary. Initializes Zustand store with session data and renders the shell.

```tsx
"use client";

import { useEffect } from "react";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { useWizardStore } from "@/stores/wizard-store";
import type { Session } from "@/lib/types/session";

interface Props {
  session: Session;
}

export function WizardClient({ session }: Props) {
  const initialize = useWizardStore((s) => s.initialize);

  useEffect(() => {
    initialize({
      sessionId: session.id,
      currentStep: session.current_step,
      rawIdea: session.raw_idea,
      status: session.status,
    });
  }, [session, initialize]);

  return <WizardShell />;
}
```

### 3.4 Component: `src/components/wizard/wizard-shell.tsx`

The layout orchestrator. Renders a CSS Grid container with the step indicator at top and two panels below.

**Desktop layout (>= 1024px):**

```
+------------------------------------------+
|           StepIndicator (4 steps)         |  max-h: 60px
+-------------------+----------------------+
|                   |                      |
| ConversationPanel |     PrdPanel         |
|   ~45% width      |     ~55% width       |
|   overflow-y:auto |     overflow-y:auto   |
|                   |                      |
+-------------------+----------------------+
```

**Mobile/tablet layout (< 1024px):**

```
+------------------------------------------+
|           StepIndicator (4 steps)         |
+------------------------------------------+
|     [Conversation]    [PRD]    <-- Tabs   |
+------------------------------------------+
|                                          |
|        Active panel (full width)          |
|                                          |
+------------------------------------------+
```

```tsx
"use client";

import { useWizardStore } from "@/stores/wizard-store";
import { StepIndicator } from "@/components/wizard/step-indicator";
import { ConversationPanel } from "@/components/wizard/conversation-panel";
import { PrdPanel } from "@/components/wizard/prd-panel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";

export function WizardShell() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const activePanel = useWizardStore((s) => s.activePanel);
  const setActivePanel = useWizardStore((s) => s.setActivePanel);

  if (isDesktop) {
    return (
      <div className="flex flex-col h-full">
        <StepIndicator />
        <div className="flex-1 grid grid-cols-[45fr_55fr] min-h-0">
          <ConversationPanel className="border-r border-border overflow-y-auto" />
          <PrdPanel className="overflow-y-auto" />
        </div>
      </div>
    );
  }

  // Mobile / tablet: tab-based layout
  return (
    <div className="flex flex-col h-full">
      <StepIndicator />
      <Tabs
        value={activePanel}
        onValueChange={(v) => setActivePanel(v as "conversation" | "prd")}
        className="flex-1 flex flex-col min-h-0"
      >
        <TabsList className="w-full grid grid-cols-2 shrink-0">
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
          <TabsTrigger value="prd">PRD</TabsTrigger>
        </TabsList>
        <TabsContent value="conversation" className="flex-1 overflow-y-auto m-0">
          <ConversationPanel />
        </TabsContent>
        <TabsContent value="prd" className="flex-1 overflow-y-auto m-0">
          <PrdPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 3.5 Component: `src/components/wizard/step-indicator.tsx`

Renders 4 steps as a horizontal bar. Each step shows its number and label.

**Step states:**
- `completed`: checkmark icon, clickable, `text-primary` color
- `current`: highlighted background (`bg-primary text-primary-foreground`), bold label
- `locked`: dimmed (`text-muted-foreground`), `cursor-not-allowed`, not clickable

**Step data (static):**

```tsx
const STEPS = [
  { number: 1, label: "Cadrage" },
  { number: 2, label: "Donnees" },
  { number: 3, label: "Risques" },
  { number: 4, label: "PRD" },
] as const;
```

**Interaction:**
- Clicking a completed step dispatches `goToStep(stepNumber)` on the Zustand store.
- Clicking the current step or a locked step does nothing.
- Transition between steps uses CSS `transition-colors duration-200`.

```tsx
"use client";

import { useWizardStore } from "@/stores/wizard-store";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  { number: 1, label: "Cadrage" },
  { number: 2, label: "Donnees" },
  { number: 3, label: "Risques" },
  { number: 4, label: "PRD" },
] as const;

export function StepIndicator() {
  const currentStep = useWizardStore((s) => s.currentStep);
  const goToStep = useWizardStore((s) => s.goToStep);

  return (
    <nav
      aria-label="Progression du wizard"
      className="flex items-center justify-center gap-2 px-4 py-3 border-b border-border h-[60px] shrink-0"
    >
      {STEPS.map((step, i) => {
        const isCompleted = step.number < currentStep;
        const isCurrent = step.number === currentStep;
        const isLocked = step.number > currentStep;

        return (
          <button
            key={step.number}
            onClick={() => isCompleted && goToStep(step.number)}
            disabled={isLocked}
            aria-current={isCurrent ? "step" : undefined}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors duration-200",
              isCompleted && "text-primary cursor-pointer hover:bg-accent",
              isCurrent && "bg-primary text-primary-foreground",
              isLocked && "text-muted-foreground cursor-not-allowed opacity-50"
            )}
          >
            <span className="flex items-center justify-center w-6 h-6 rounded-full border text-xs">
              {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.number}
            </span>
            <span className="hidden sm:inline">{step.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
```

### 3.6 Container: `src/components/wizard/conversation-panel.tsx`

Empty shell container for the conversation content. The `conversation-engine` feature fills it.

```tsx
"use client";

import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function ConversationPanel({ className }: Props) {
  return (
    <div className={cn("flex flex-col", className)}>
      {/* conversation-engine renders its content here */}
      <div className="flex-1 p-4">
        <p className="text-muted-foreground text-sm">
          Chargement de la conversation...
        </p>
      </div>
    </div>
  );
}
```

### 3.7 Container: `src/components/wizard/prd-panel.tsx`

Empty shell container for the PRD viewer. The `prd-live-builder` feature fills it.

```tsx
"use client";

import { cn } from "@/lib/utils";

interface Props {
  className?: string;
}

export function PrdPanel({ className }: Props) {
  return (
    <div className={cn("flex flex-col", className)}>
      {/* prd-live-builder renders its content here */}
      <div className="flex-1 p-4">
        <p className="text-muted-foreground text-sm">
          Le PRD apparaitra ici au fil de la conversation.
        </p>
      </div>
    </div>
  );
}
```

### 3.8 Hook: `src/hooks/use-media-query.ts`

Custom hook for responsive breakpoint detection. Avoids SSR hydration mismatch by defaulting to `false` until mounted.

```tsx
"use client";

import { useState, useEffect } from "react";

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    function listener(e: MediaQueryListEvent) {
      setMatches(e.matches);
    }

    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}
```

### 3.9 Zustand store: `src/stores/wizard-store.ts`

```tsx
import { create } from "zustand";

type PanelName = "conversation" | "prd";

interface WizardState {
  // Session identity
  sessionId: string | null;
  rawIdea: string | null;
  status: "active" | "completed" | "abandoned";

  // Step navigation
  currentStep: number; // 1-4
  viewingStep: number; // Which step's conversation is visible (can differ from currentStep when reviewing a completed step)

  // Responsive panel
  activePanel: PanelName;

  // Actions
  initialize: (data: {
    sessionId: string;
    currentStep: number;
    rawIdea: string;
    status: string;
  }) => void;
  advanceStep: () => void;
  goToStep: (step: number) => void;
  setActivePanel: (panel: PanelName) => void;
}

export const useWizardStore = create<WizardState>((set, get) => ({
  // Initial state
  sessionId: null,
  rawIdea: null,
  status: "active",
  currentStep: 1,
  viewingStep: 1,
  activePanel: "conversation",

  initialize: (data) =>
    set({
      sessionId: data.sessionId,
      currentStep: data.currentStep,
      viewingStep: data.currentStep,
      rawIdea: data.rawIdea,
      status: data.status as WizardState["status"],
    }),

  advanceStep: () => {
    const { currentStep } = get();
    if (currentStep < 4) {
      set({
        currentStep: currentStep + 1,
        viewingStep: currentStep + 1,
      });
    }
  },

  goToStep: (step) => {
    const { currentStep } = get();
    // Only allow navigating to completed steps or current step
    if (step >= 1 && step <= currentStep) {
      set({ viewingStep: step });
    }
  },

  setActivePanel: (panel) => set({ activePanel: panel }),
}));
```

**Key design decisions:**
- `currentStep` vs `viewingStep`: `currentStep` is the actual progress (1-4). `viewingStep` is the step whose conversation is displayed. When a user clicks a completed step in the indicator, `viewingStep` changes but `currentStep` does not. This prevents losing progress while allowing backward review.
- The store does not persist to localStorage in V1. Session state is loaded from the DB on page load.

### 3.10 Types: `src/lib/types/session.ts`

```tsx
export interface Session {
  id: string;
  user_id: string | null;
  anonymous_id: string | null;
  title: string | null;
  status: "active" | "completed" | "abandoned";
  current_step: number;
  raw_idea: string;
  created_at: string;
  updated_at: string;
  prds: Prd[];
}

export interface Prd {
  id: string;
  session_id: string;
  user_id: string | null;
  title: string;
  share_slug: string | null;
  is_public: boolean;
  confidence_score: number | null;
  recommendation: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}
```

These types will eventually be auto-generated from Supabase (`npx supabase gen types typescript --local`). Until then, they are manually maintained.

### 3.11 PostHog tracking

| Event | Trigger | Properties |
|-------|---------|------------|
| `wizard_step_changed` | `goToStep()` or `advanceStep()` | `{ session_id, from_step, to_step, direction: "forward" | "backward" }` |

Tracking is added inside the store actions. PostHog client is accessed via the `posthog-js` singleton (must be initialized in a provider upstream).

### 3.12 Not Found page: `src/app/(app)/session/[id]/not-found.tsx`

Custom 404 for invalid session IDs (maps to SC-WS-10).

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SessionNotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4 text-center">
      <h1 className="text-2xl font-heading">Session introuvable</h1>
      <p className="text-muted-foreground">
        Cette session n'existe pas ou vous n'y avez pas acces.
      </p>
      <Button asChild>
        <Link href="/">Retour a l'accueil</Link>
      </Button>
    </div>
  );
}
```

---

## 4. Non-functional requirements

| Requirement | Target | How |
|-------------|--------|-----|
| No layout shift | 0 CLS on panel content load | Panels have fixed height (`h-[calc(100vh-60px)]`), skeletons inside |
| Smooth step transitions | Perceived as instant | CSS `transition-colors duration-200` on step indicator; no full re-render |
| Independent panel scroll | Each panel scrolls alone | `overflow-y: auto` on each panel div, `min-h-0` on flex children |
| Responsive breakpoint | 1024px | `useMediaQuery("(min-width: 1024px)")` |
| Tab switch latency | Instant (< 16ms) | Both panels are mounted; tabs toggle `display` via shadcn Tabs (no unmount) |
| Max step indicator height | 60px | `h-[60px] shrink-0` |
| Accessibility | WCAG 2.1 AA | `aria-current="step"`, `aria-label` on nav, `disabled` on locked steps |
| SSR hydration | No mismatch | `useMediaQuery` defaults to `false` on server (mobile-first render) |

---

## 5. Delivery & testing

- **Release plan:** [`release-plan.md`](release-plan.md)
- **Test plan:** [`test-plan.md`](test-plan.md)

---

## 6. Open questions [To verify]

| # | Question | Impact | Resolved? |
|---|----------|--------|-----------|
| 1 | Should the mobile default panel be "conversation" or "prd"? | UX on tablet | No -- default "conversation" assumed |
| 2 | How does the conversation-engine signal step completion to the shell? | Store integration | No -- likely via a store action called from the engine: `useWizardStore.getState().advanceStep()` |
| 3 | Should `viewingStep` be synced to the URL (e.g., `?step=2`)? | Deep linking, refresh | No -- V1 skips this for simplicity; revisit if PMs share step-specific URLs |
| 4 | Does `(app)` layout need an auth guard? | Security | No -- access control is handled per-page in `page.tsx`. The deferred-auth feature may add middleware-level guards later. |
| 5 | Panel proportions (45/55) -- should these be adjustable by the user? | UX | No -- out of scope for V1 per PRD |
