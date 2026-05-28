# Architecture — Enhanced Wizard V1

> 🚧 **V1 demo deviates** — pas de Supabase/Postgres/RLS en V1, persistance Dexie côté client.
> Le schéma DB et la matrice RLS décrits ici sont la **cible long terme** (réintroduits avec
> `deferred-auth`). Voir [`decisions.md`](./decisions.md) pour le journal des écarts.

> **CANONICAL REFERENCE.** This document consolidates all technical architecture decisions
> from the 9 feature specs. Where feature specs conflict, this document is the **source of
> truth** and the feature specs must be updated to match. All conflicts are logged in
> section 12.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## 1. Overview

Enhanced V1 is a 4-step conversational wizard that guides product managers through structured
hypothesis validation — problem framing, data validation, risk challenge, and draft PRD —
producing a transparent, export-ready PRD that separates evidence from assumptions. The wizard
uses a split-view interface (AI conversation on the left, live PRD on the right) with
structured interaction cards and block-level refinement.

**Architecture philosophy:**

- **Server-first.** Server Components for data loading, Server Actions for mutations, Route
  Handlers for streaming AI and PDF export. Client Components are isolated islands.
- **Supabase as source of truth.** All state that must survive a page refresh lives in
  Postgres. Zustand is a reactive mirror, not an owner.
- **Streaming AI.** The conversation uses Vercel AI SDK `streamText` + OpenRouter to stream
  responses token by token, including tool calls that update the PRD in real time.

---

## 2. System Architecture Diagram

```
                             ┌─────────────────────────────────┐
                             │           BROWSER               │
                             │                                 │
                             │  useChat (AI SDK)  ←→  Zustand  │
                             │  Card components      PRD store │
                             └──────────┬──────────────────────┘
                                        │ HTTPS
                                        ▼
               ┌────────────────────────────────────────────────┐
               │              NEXT.JS (Vercel)                  │
               │                                                │
               │  Server Components     Route Handlers          │
               │  ┌──────────────┐    ┌──────────────────────┐  │
               │  │ /            │    │ POST /api/chat       │  │
               │  │ /session/[id]│    │ POST /api/refine     │  │
               │  │ /p/[slug]    │    │ GET /api/export/pdf  │  │
               │  └──────────────┘    └──────────┬───────────┘  │
               │                                 │              │
               │  Server Actions                 │              │
               │  ┌──────────────────┐           │              │
               │  │ createSession    │           │              │
               │  │ advanceStep      │           │              │
               │  │ claimSession     │           │              │
               │  │ togglePublic     │           │              │
               │  └──────────────────┘           │              │
               └──────────┬──────────────────────┼──────────────┘
                          │                      │
                          ▼                      ▼
              ┌────────────────────┐   ┌─────────────────────┐
              │  SUPABASE          │   │  OPENROUTER         │
              │                    │   │                     │
              │  Postgres (6 tbls) │   │  Claude Sonnet 4    │
              │  Auth (Magic Link) │   │  (streaming)        │
              │  RLS enforced      │   │                     │
              └────────────────────┘   └─────────────────────┘
```

**Boundary rules:**
- OpenRouter is called ONLY from Route Handlers (never from Server Actions or components).
- Supabase is accessed via `createClient()` from `@/lib/supabase/server` (server) or
  `@/lib/supabase/client` (browser). Anonymous operations use the Supabase **anon key** (not service role), so RLS policies apply. App-layer cookie verification provides additional identity-level filtering.
- Zustand runs in the browser only. It mirrors DB state; it does not originate it.

---

## 3. Database Schema (COMPLETE)

### 3.1 Entity Relationships

```
profiles (1) ────────────────── auth.users (1)     [id = id]
sessions (1) ────── (N) messages                   [sessions.id = messages.session_id]
sessions (1) ────── (1) prds                       [sessions.id = prds.session_id]
prds     (1) ────── (N) prd_blocks                 [prds.id = prd_blocks.prd_id]
prds     (1) ────── (N) prd_versions               [prds.id = prd_versions.prd_id]
prd_blocks (1) ──── (N) prd_versions               [prd_blocks.id = prd_versions.block_id, nullable]
```

### 3.2 Migration Ordering

| # | Migration file | Tables / objects |
|---|----------------|------------------|
| 1 | `create_profiles` | `profiles` + RLS + `handle_new_user` trigger + `update_updated_at` function |
| 2 | `create_sessions_and_prds` | `sessions` + `prds` + indexes + RLS + `updated_at` triggers |
| 3 | `create_messages` | `messages` + index + RLS |
| 4 | `create_prd_blocks` | `prd_blocks` + unique constraint + index + RLS + `updated_at` trigger |
| 5 | `create_prd_versions` | `prd_versions` + indexes + RLS |

### 3.3 Table: `profiles`

```sql
CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  display_name TEXT,
  avatar_url   TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

**Trigger: auto-create profile on signup:**

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

**Shared utility trigger:**

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### 3.4 Table: `sessions`

```sql
CREATE TABLE public.sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  anonymous_id  TEXT,
  title         TEXT,
  status        TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'completed', 'abandoned')),
  current_step  SMALLINT NOT NULL DEFAULT 1
                  CHECK (current_step BETWEEN 1 AND 4),
  raw_idea      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT sessions_identity_check
    CHECK (user_id IS NOT NULL OR anonymous_id IS NOT NULL)
);

CREATE INDEX idx_sessions_anonymous_id ON public.sessions(anonymous_id)
  WHERE anonymous_id IS NOT NULL;
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sessions_select_own"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "sessions_update_own"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "sessions_delete_own"
  ON public.sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "sessions_insert_authenticated"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Anonymous access (defense in depth, app-layer verifies cookie)
CREATE POLICY "sessions_select_anonymous"
  ON public.sessions FOR SELECT
  USING (user_id IS NULL);

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

**State machines:**

- `status`: `active` -> `completed` (wizard finishes step 4) | `active` -> `abandoned` (future cleanup)
- `current_step`: `1` -> `2` -> `3` -> `4` (monotonically increasing, never decreases)

### 3.5 Table: `prds`

**CANONICAL:** Includes CHECK constraint on `recommendation` (Resolution 2).

```sql
CREATE TABLE public.prds (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id        UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id           UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title             TEXT NOT NULL DEFAULT 'Draft PRD',
  share_slug        TEXT UNIQUE,
  is_public         BOOLEAN NOT NULL DEFAULT false,
  confidence_score  SMALLINT CHECK (confidence_score BETWEEN 0 AND 100),
  recommendation    TEXT CHECK (recommendation IN ('build', 'test_first', 'abandon')),
  metadata          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prds_session_id ON public.prds(session_id);
CREATE INDEX idx_prds_user_id ON public.prds(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX idx_prds_share_slug ON public.prds(share_slug)
  WHERE share_slug IS NOT NULL;

ALTER TABLE public.prds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "prds_select_own"
  ON public.prds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "prds_select_public"
  ON public.prds FOR SELECT
  USING (is_public = true);

CREATE POLICY "prds_update_own"
  ON public.prds FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "prds_insert"
  ON public.prds FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Anonymous access (defense in depth, app-layer verifies cookie)
CREATE POLICY "prds_select_anonymous"
  ON public.prds FOR SELECT
  USING (user_id IS NULL);

CREATE TRIGGER prds_updated_at
  BEFORE UPDATE ON public.prds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### 3.6 Table: `messages`

**CANONICAL (Resolution 11 updated):** Keep RLS policies as defense in depth. Anonymous
message operations use the anon key (not service role), so RLS always applies. The
`messages_insert_anonymous` policy allows anonymous INSERT for sessions with `user_id IS NULL`.

```sql
CREATE TABLE public.messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  step          SMALLINT NOT NULL CHECK (step BETWEEN 1 AND 4),
  role          TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content       TEXT,
  tool_calls    JSONB,
  tool_results  JSONB,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_session_step
  ON public.messages(session_id, step, created_at);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_own"
  ON public.messages FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.sessions WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "messages_insert_own"
  ON public.messages FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.sessions WHERE user_id = auth.uid()
    )
  );

-- Defense in depth: allow anonymous message insertion (pre-auth)
CREATE POLICY "messages_insert_anonymous"
  ON public.messages FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.sessions
      WHERE anonymous_id IS NOT NULL AND user_id IS NULL
    )
  );

-- Anonymous access (defense in depth, app-layer verifies cookie)
CREATE POLICY "messages_select_anonymous"
  ON public.messages FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.sessions WHERE user_id IS NULL
    )
  );
```

### 3.7 Table: `prd_blocks`

```sql
CREATE TABLE public.prd_blocks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id          UUID NOT NULL REFERENCES public.prds(id) ON DELETE CASCADE,
  block_type      TEXT NOT NULL CHECK (block_type IN (
    'first_use_case', 'problem_context', 'data_signals',
    'risk_value', 'risk_usability', 'risk_feasibility', 'risk_viability',
    'confidence_score', 'success_criteria', 'kill_criteria',
    'next_steps', 'executive_summary'
  )),
  content         TEXT NOT NULL DEFAULT '',
  sort_order      SMALLINT NOT NULL,
  evidence_tags   JSONB DEFAULT '[]',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT prd_blocks_unique_type UNIQUE(prd_id, block_type)
);

CREATE INDEX idx_prd_blocks_prd ON public.prd_blocks(prd_id, sort_order);

ALTER TABLE public.prd_blocks ENABLE ROW LEVEL SECURITY;

-- Anonymous access (defense in depth, app-layer verifies cookie)
CREATE POLICY "prd_blocks_select_via_prd"
  ON public.prd_blocks FOR SELECT
  USING (
    prd_id IN (
      SELECT id FROM public.prds
      WHERE auth.uid() = user_id OR is_public = true OR user_id IS NULL
    )
  );

CREATE POLICY "prd_blocks_insert_via_prd"
  ON public.prd_blocks FOR INSERT
  WITH CHECK (
    prd_id IN (
      SELECT id FROM public.prds WHERE auth.uid() = user_id OR user_id IS NULL
    )
  );

CREATE POLICY "prd_blocks_update_via_prd"
  ON public.prd_blocks FOR UPDATE
  USING (
    prd_id IN (
      SELECT id FROM public.prds WHERE auth.uid() = user_id
    )
  );

CREATE TRIGGER prd_blocks_updated_at
  BEFORE UPDATE ON public.prd_blocks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

### 3.8 Table: `prd_versions`

**CANONICAL:** Single definition. Uses prd-versioning indexes (Resolution 3). INSERT allows
`user_id IS NULL` for anonymous sessions (Resolution 4). Separate SELECT policies for owned
and public PRDs.

```sql
CREATE TABLE public.prd_versions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prd_id           UUID NOT NULL REFERENCES public.prds(id) ON DELETE CASCADE,
  block_id         UUID REFERENCES public.prd_blocks(id) ON DELETE SET NULL,
  version_number   INTEGER NOT NULL,
  content_snapshot TEXT NOT NULL,
  trigger          TEXT NOT NULL CHECK (trigger IN ('generation', 'refinement')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CANONICAL indexes (Resolution 3)
CREATE INDEX idx_prd_versions_prd_desc
  ON public.prd_versions(prd_id, version_number DESC);
CREATE INDEX idx_prd_versions_block_id
  ON public.prd_versions(block_id)
  WHERE block_id IS NOT NULL;

ALTER TABLE public.prd_versions ENABLE ROW LEVEL SECURITY;

-- CANONICAL: Separate SELECT policies (Resolution 4)
-- Anonymous access (defense in depth, app-layer verifies cookie)
CREATE POLICY "prd_versions_select_own"
  ON public.prd_versions FOR SELECT
  USING (prd_id IN (SELECT id FROM public.prds WHERE user_id = auth.uid() OR user_id IS NULL));

CREATE POLICY "prd_versions_select_public"
  ON public.prd_versions FOR SELECT
  USING (prd_id IN (SELECT id FROM public.prds WHERE is_public = true));

-- CANONICAL: INSERT allows user_id IS NULL (Resolution 4)
CREATE POLICY "prd_versions_insert"
  ON public.prd_versions FOR INSERT
  WITH CHECK (
    prd_id IN (
      SELECT id FROM public.prds WHERE user_id = auth.uid() OR user_id IS NULL
    )
  );
```

### 3.9 Block Type Enum and Sort Order

| sort_order | block_type | Step |
|-----------|------------|------|
| 1 | `first_use_case` | 1 |
| 2 | `problem_context` | 1 |
| 3 | `data_signals` | 2 |
| 4 | `risk_value` | 3 |
| 5 | `risk_usability` | 3 |
| 6 | `risk_feasibility` | 3 |
| 7 | `risk_viability` | 3 |
| 8 | `confidence_score` | 3 |
| 9 | `success_criteria` | 4 |
| 10 | `kill_criteria` | 4 |
| 11 | `next_steps` | 4 |
| 12 | `executive_summary` | 4 |

### 3.10 Evidence Tags JSONB Format

```typescript
interface EvidenceTag {
  text: string                                  // The claim being tagged
  tag: 'evidence' | 'assumption' | 'to_verify'  // Classification
}
// Stored as: JSONB DEFAULT '[]' — always a valid array
```

---

## 4. API Surface (COMPLETE)

### 4.1 Route Handlers

| Method | Path | Auth | Rate limit | Purpose |
|--------|------|------|-----------|---------|
| `POST` | `/api/chat` | User OR `enhanced_anon_id` cookie | 20 msg/min/session | Streaming AI conversation |
| `POST` | `/api/refine` | User OR `enhanced_anon_id` cookie | 10 refine/min/user-or-anon | Single block refinement (streaming) |
| `GET` | `/api/export/[prdId]/pdf` | Authenticated user (owner) | None (V1) | Generate and return branded PDF |
| `GET` | `/api/prd/[prdId]/versions` | Authenticated user (owner) | None (V1) | List version history (COULD) |

### 4.2 Server Actions

| Action | File | Signature | Auth | Purpose |
|--------|------|-----------|------|---------|
| `createSession` | `src/app/actions/session.ts` | `(formData: FormData) => Promise<{error?}>` | None (creates anonymous) | Create session + PRD, set cookie, redirect |
| `advanceStep` | `src/app/actions/session.ts` | `(sessionId: string) => Promise<{success, newStep?, error?, missingBlocks?}>` | User OR `enhanced_anon_id` cookie | Validate step completion, advance |
| `claimSession` | `src/app/actions/session.ts` | `() => Promise<{success, error?}>` | Authenticated user + cookie | Atomic anonymous-to-authenticated transition |
| `togglePublic` | `src/app/actions/sharing.ts` | `(prdId: string) => Promise<{success, isPublic?, shareUrl?, error?}>` | Authenticated user (owner) | Toggle public sharing, generate slug |
| `getShareUrl` | `src/app/actions/sharing.ts` | `(prdId: string) => Promise<string \| null>` | Authenticated user (owner) | Get current share URL |

**CANONICAL (Resolution 5):** `advanceStep` supports both authenticated users AND anonymous
sessions via the `enhanced_anon_id` cookie, matching the `/api/chat` dual-auth pattern.

**CANONICAL (Resolution 6):** `createSession` takes `FormData`, not a raw string.

### 4.3 Streaming Strategy

Both `/api/chat` and `/api/refine` use the Vercel AI SDK streaming pattern:

```typescript
// /api/chat
const result = streamText({ model, system, messages, tools, maxSteps: 5, temperature: 1.2, maxTokens: 16384 })
return createUIMessageStreamResponse(result)

// /api/refine
const result = streamText({ model, system, messages, maxTokens: 8192, temperature: 0.7 })
return result.toTextStreamResponse()
```

- `/api/chat` uses `createUIMessageStreamResponse` — delivers text, tool calls, and tool
  results via SSE in the AI SDK wire format (consumed by `useChat`).
- `/api/refine` uses `toTextStreamResponse` — delivers raw text chunks (consumed by a custom
  fetch + ReadableStream reader).

### 4.4 Error Response Convention

All error responses use JSON with French messages for user-facing errors:

| Status | Meaning | Example body |
|--------|---------|-------------|
| `400` | Validation failure | `{ "error": "prd_id invalide", "details": [...] }` |
| `401` | Not authenticated / not authorized | `{ "error": "Non autorise" }` |
| `404` | Resource not found or not owned | `{ "error": "Session introuvable" }` |
| `429` | Rate limit exceeded | `{ "error": "Trop de requetes. Attendez une minute.", "retryAfter": 42 }` |
| `500` | Server / AI provider error | `{ "error": "Erreur du service IA. Veuillez reessayer.", "retryable": true }` |

### 4.5 Rate Limiting

**CANONICAL (Resolution 12):** Rate limiting is keyed by user ID (authenticated) or anonymous
ID (pre-auth). Consistent across all endpoints.

```typescript
// src/lib/rate-limit.ts
export async function checkRateLimit(
  key: string,                              // user.id or anonymousId
  options?: { maxRequests?: number; windowMs?: number }
): Promise<{ allowed: boolean; remaining: number; retryAfter?: number }>
```

| Endpoint | Max requests | Window | Key |
|----------|-------------|--------|-----|
| `/api/chat` | 20 | 60s | user ID or anon ID |
| `/api/refine` | 10 | 60s | user ID or anon ID |

In-memory `Map` implementation (acceptable for V1 single-instance deployment).

---

## 5. Component Architecture

### 5.1 Complete File Tree

```
src/
├── app/
│   ├── layout.tsx                          # Root layout (Geist font, PostHogProvider)
│   ├── globals.css                         # Tailwind v4 + Obra design tokens
│   ├── (marketing)/
│   │   ├── layout.tsx                      # Marketing layout (centered, no app chrome)
│   │   └── page.tsx                        # Landing page (Server Component)
│   ├── (app)/
│   │   ├── layout.tsx                      # App layout (full height shell)
│   │   └── session/
│   │       └── [id]/
│   │           ├── page.tsx                # Session page (Server Component, data loading)
│   │           ├── wizard-client.tsx        # Client boundary, store hydration
│   │           └── not-found.tsx           # Custom 404 for invalid sessions
│   ├── p/
│   │   └── [slug]/
│   │       ├── page.tsx                    # Public PRD page (Server Component, force-dynamic)
│   │       └── not-found.tsx               # Custom 404 for public sharing
│   ├── auth/
│   │   ├── confirm/route.ts                # Magic link verification callback
│   │   └── login/page.tsx                  # Login page (error display)
│   ├── api/
│   │   ├── chat/route.ts                   # POST: streaming AI conversation
│   │   ├── refine/route.ts                 # POST: block refinement (streaming)
│   │   ├── export/[prdId]/pdf/route.ts     # GET: PDF generation
│   │   └── prd/[prdId]/versions/route.ts   # GET: version history (COULD)
│   └── actions/
│       ├── session.ts                      # createSession, advanceStep, claimSession
│       └── sharing.ts                      # togglePublic, getShareUrl
├── components/
│   ├── ui/                                 # shadcn/ui components (via CLI)
│   ├── landing/
│   │   └── pitch-form.tsx                  # Textarea + CTA (Client Component)
│   ├── wizard/
│   │   ├── wizard-shell.tsx                # Split-view layout orchestrator
│   │   ├── step-indicator.tsx              # 4-step progress bar
│   │   ├── conversation-panel.tsx          # Left panel container
│   │   └── prd-panel.tsx                   # Right panel container
│   ├── chat/
│   │   ├── message-list.tsx                # Scrollable conversation messages
│   │   ├── message-bubble.tsx              # Single message (user/assistant)
│   │   └── chat-input.tsx                  # Text input + send button
│   ├── cards/
│   │   ├── card-renderer.tsx               # Tool call -> card dispatcher
│   │   ├── single-choice-card.tsx          # Radio-style option picker
│   │   ├── multi-choice-card.tsx           # Checkbox-style multi picker
│   │   ├── scale-card.tsx                  # 1-N numeric scale
│   │   ├── confirmation-card.tsx           # Confirm / Reformulate / Clarify
│   │   └── free-text-card.tsx              # Open-ended textarea
│   ├── prd/
│   │   ├── prd-viewer.tsx                  # PRD panel (Client, Zustand-backed)
│   │   ├── prd-viewer-server.tsx           # PRD panel (Server, props-only, for /p/[slug])
│   │   ├── prd-block.tsx                   # Single block (markdown + tags + refine)
│   │   ├── prd-block-placeholder.tsx       # Empty state for unfilled blocks
│   │   ├── prd-header.tsx                  # Title, score, export/share buttons
│   │   ├── evidence-tag.tsx                # Colored badge component
│   │   ├── refine-popover.tsx              # Refinement instruction popover
│   │   ├── share-toggle.tsx                # Public toggle + copy URL
│   │   ├── export-pdf-button.tsx           # PDF download button
│   │   └── public-footer.tsx               # "Made with Enhanced" badge
│   └── auth/
│       └── auth-gate.tsx                   # Magic link modal (minimizable)
├── hooks/
│   ├── use-media-query.ts                  # Responsive breakpoint detection
│   ├── use-refine-block.ts                 # Refinement API call + store sync
│   └── use-update-prd-sync.ts              # Intercept update_prd tool results -> store
├── stores/
│   └── wizard-store.ts                     # Zustand: session, steps, blocks, PRD metadata
├── lib/
│   ├── supabase/
│   │   ├── client.ts                       # Browser Supabase client
│   │   ├── server.ts                       # Server Supabase client
│   │   └── middleware.ts                   # Session refresh middleware helper
│   ├── ai/
│   │   ├── model.ts                        # getOpenRouterModel() (env var driven)
│   │   ├── tools.ts                        # ask_user + update_prd tool definitions
│   │   ├── schemas.ts                      # ChatRequestSchema (Zod)
│   │   ├── step-validation.ts              # Minimum block requirements per step
│   │   ├── message-mapper.ts               # DB <-> AI SDK message format conversion
│   │   ├── message-persistence.ts          # Persist messages from stream callbacks
│   │   └── prompts/
│   │       ├── system.ts                   # buildSystemPrompt() + base prompt
│   │       ├── step-1.ts                   # Problem Framing
│   │       ├── step-2.ts                   # Data Validation
│   │       ├── step-3.ts                   # Risk Challenge
│   │       ├── step-4.ts                   # Final PRD
│   │       ├── steps.ts                    # getStepPrompt() dispatcher
│   │       └── refine.ts                   # buildRefinePrompt() for block refinement
│   ├── prd/
│   │   ├── constants.ts                    # CANONICAL block labels, sort order, step map
│   │   ├── types.ts                        # Shared PRD TypeScript types
│   │   └── sharing.ts                      # getPrdBySlug query
│   ├── pdf/
│   │   ├── generate.ts                     # generatePrdPdf orchestrator
│   │   ├── prd-document.tsx                # Document + Page wrapper
│   │   ├── prd-header.tsx                  # PDF header
│   │   ├── prd-section.tsx                 # PDF block section
│   │   ├── evidence-badge.tsx              # PDF evidence tag badge
│   │   ├── prd-footer.tsx                  # PDF footer
│   │   ├── styles.ts                       # PDF StyleSheet (Obra tokens)
│   │   ├── fonts.ts                        # Font registration
│   │   └── markdown.ts                     # Markdown-to-PDF-primitives parser
│   ├── schemas/
│   │   ├── session.ts                      # rawIdeaSchema (Zod)
│   │   └── refine.ts                       # refineRequestSchema (Zod)
│   ├── analytics/
│   │   └── posthog-server.ts               # Server-side PostHog tracking
│   ├── rate-limit.ts                       # In-memory rate limiter
│   ├── types/
│   │   └── session.ts                      # Session + Prd TypeScript interfaces
│   └── utils.ts                            # cn() helper
├── middleware.ts                            # Supabase session refresh
└── public/
    └── enhanced-logo.png                   # Logo for PDF export
```

### 5.2 Server vs Client Component Boundaries

| Component | Type | Rationale |
|-----------|------|-----------|
| `(marketing)/page.tsx` | Server | SSR for LCP + SEO, no client state needed |
| `pitch-form.tsx` | Client | Form state, useTransition, auto-resize textarea |
| `session/[id]/page.tsx` | Server | Data loading from Supabase |
| `wizard-client.tsx` | Client | Store hydration, boundary for all wizard interactivity |
| `wizard-shell.tsx` | Client | Layout depends on useMediaQuery, Zustand for tabs |
| `step-indicator.tsx` | Client | Reads currentStep from Zustand, handles click |
| `conversation-panel.tsx` | Client | useChat, message rendering, card interaction |
| `prd-viewer.tsx` | Client | Zustand store for reactive block rendering |
| `prd-viewer-server.tsx` | Server | Props-only rendering for /p/[slug] |
| `card-renderer.tsx` | Client | Renders interactive cards, calls addToolResult |
| `prd-block.tsx` | Client | Hover interaction, refine popover, animations |
| `refine-popover.tsx` | Client | Form state, API call, streaming |
| `auth-gate.tsx` | Client | signInWithOtp, modal state |
| `share-toggle.tsx` | Client | useTransition, clipboard API |
| `export-pdf-button.tsx` | Client | Fetch + blob download |
| `/p/[slug]/page.tsx` | Server | OG meta tags require server-rendered HTML |

### 5.3 Wizard Page Component Hierarchy

```
SessionPage (Server Component)
  └── WizardClient (Client boundary)
        ├── store hydration (useEffect)
        └── WizardShell
              ├── StepIndicator
              │     └── 4x step buttons
              ├── ConversationPanel
              │     ├── MessageList
              │     │     ├── MessageBubble (user)
              │     │     ├── MessageBubble (assistant)
              │     │     └── CardRenderer
              │     │           ├── SingleChoiceCard
              │     │           ├── MultiChoiceCard
              │     │           ├── ScaleCard
              │     │           ├── ConfirmationCard
              │     │           └── FreeTextCard
              │     └── ChatInput
              ├── PrdPanel (desktop: side-by-side, mobile: tab)
              │     └── PrdViewer
              │           ├── PrdHeader
              │           │     ├── ExportPdfButton
              │           │     └── ShareToggle
              │           └── 12x PrdBlock / PrdBlockPlaceholder
              │                 ├── ReactMarkdown content
              │                 ├── EvidenceTag badges
              │                 ├── RefineButton (hover)
              │                 └── RefinePopover
              └── AuthGate (modal, minimizable)
```

### 5.4 Shared Constants

**CANONICAL (Resolution 7):** A single file at `src/lib/prd/constants.ts` with
`BLOCK_TYPE_LABELS` used by ALL consumers (PRD viewer, PDF export, block refinement,
versioning). No other file may define its own label mapping.

```typescript
// src/lib/prd/constants.ts

export const BLOCK_TYPE_LABELS: Record<string, string> = {
  first_use_case:    "Cas d'usage principal",
  problem_context:   "Contexte du probleme",
  data_signals:      "Signaux data",
  risk_value:        "Risque — Valeur",
  risk_usability:    "Risque — Utilisabilite",
  risk_feasibility:  "Risque — Faisabilite",
  risk_viability:    "Risque — Viabilite business",
  confidence_score:  "Score de confiance",
  success_criteria:  "Criteres de succes",
  kill_criteria:     "Kill criteria",
  next_steps:        "Prochaines etapes",
  executive_summary: "Resume executif",
}
```

---

## 6. AI Integration Architecture

### 6.1 OpenRouter Provider

**CANONICAL (Resolution 8):** All AI calls use `getOpenRouterModel()` from
`src/lib/ai/model.ts`, reading the `OPENROUTER_MODEL` env var.

```typescript
// src/lib/ai/model.ts
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
})

export function getOpenRouterModel() {
  const modelId = process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4-20250514'
  return openrouter(modelId)
}
```

### 6.2 Model Configuration

**CANONICAL (Resolutions 8, 9, 10):**

| Context | Model source | Temperature | Max tokens |
|---------|-------------|-------------|-----------|
| Conversation (`/api/chat`) | `getOpenRouterModel()` | `1.2` | `16384` |
| Block refinement (`/api/refine`) | `getOpenRouterModel()` | `0.7` | `8192` |

### 6.3 Tool System Design

Two tools, split by execution model:

| Tool | Resolution | Has `execute`? | Who resolves? |
|------|-----------|----------------|---------------|
| `ask_user` | Client-resolved | No | Browser (card -> user interaction -> `addToolResult()`) |
| `update_prd` | Server-resolved | Yes | Server (DB upsert during stream, result streamed back) |

### 6.4 `ask_user` Tool Schema (CANONICAL)

```typescript
export const askUserTool = tool({
  description: 'Ask the user a structured question. ALWAYS explain WHY before calling.',
  parameters: z.object({
    card_type: z.enum([
      'single_choice', 'multi_choice', 'scale', 'confirmation', 'free_text'
    ]),
    question: z.string(),
    options: z.array(z.object({
      id: z.string(),
      label: z.string(),
      description: z.string().optional(),
    })).optional(),
    scale_config: z.object({
      min: z.number().default(1),
      max: z.number().default(5),
      min_label: z.string(),
      max_label: z.string(),
    }).optional(),
    placeholder: z.string().optional(),
    confirmation_text: z.string().optional(),
  }),
  // NO execute function
})
```

**CANONICAL (Resolution 13):** The card renderer auto-injects an "Autre — preciser" option
if the AI omits it from single_choice or multi_choice cards. The prompt still instructs the
AI to include it, but the client is the safety net.

### 6.5 `update_prd` Tool Schema (CANONICAL)

```typescript
export function createUpdatePrdTool(prdId: string, supabase: SupabaseClient) {
  return tool({
    description: 'Update a section of the PRD.',
    parameters: z.object({
      block_type: z.enum(BLOCK_TYPES),
      content: z.string(),
      evidence_tags: z.array(z.object({
        text: z.string(),
        tag: z.enum(['evidence', 'assumption', 'to_verify']),
      })).optional(),
    }),
    execute: async ({ block_type, content, evidence_tags }) => {
      // 1. Upsert prd_blocks (ON CONFLICT prd_id,block_type DO UPDATE)
      // 2. If confidence_score: also UPDATE prds.confidence_score
      //    When `block_type === 'confidence_score'`, the execute function extracts
      //    the numeric score from the content via regex (`/\d+/`), clamps it to
      //    0–100, and writes the result to `prds.confidence_score`. This keeps the
      //    PRD-level score in sync with the block content.
      // 3. INSERT prd_versions (trigger = 'generation')
      // 4. Return { updated, content_length, evidence_tag_count }
    },
  })
}
```

### 6.6 System Prompt Architecture

```
buildSystemPrompt(context)
  = BASE_PROMPT                    // Persona, evidence tagging rules, tool rules
  + "---"
  + getStepPrompt(context.step)    // Step-specific goal, question sequence, min blocks
  + "---"
  + buildPrdContextSection(...)    // Current PRD block summary (what's written so far)
```

| Prompt file | Step | Goal |
|-------------|------|------|
| `step-1.ts` | Problem Framing | Extract problem, reformulate as First Use Case |
| `step-2.ts` | Data Validation | Identify evidence, tag claims, guide data awareness |
| `step-3.ts` | Risk Challenge | Evaluate 4 risks, compute confidence score |
| `step-4.ts` | Final PRD | Complete remaining blocks, review, executive summary |

### 6.7 Client-Side Card Rendering Flow

```
1. AI calls ask_user tool (streamed via SSE)
2. useChat receives tool invocation in message parts
3. MessageList maps over messages, finds tool invocation
4. CardRenderer dispatches to the correct card component
5. CANONICAL: If single_choice or multi_choice and no "Autre" option,
   CardRenderer auto-injects { id: "other", label: "Autre — preciser" }
6. User interacts with the card (selects, types, confirms)
7. Card calls onSubmit(result) -> addToolResult({ toolCallId, result })
8. AI SDK sends the tool result back to the server
9. AI receives the tool result and continues streaming
10. Card re-renders in submitted (read-only) state
```

### 6.8 Cost Estimation Per Session

| Component | Input tokens | Output tokens | Cost |
|-----------|-------------|---------------|------|
| Step 1 (2-3 turns) | ~3000 | ~2000 | ~$0.04 |
| Step 2 (2-3 turns) | ~5000 | ~2000 | ~$0.05 |
| Step 3 (4 risks) | ~7000 | ~3000 | ~$0.07 |
| Step 4 (finalization) | ~8000 | ~3000 | ~$0.07 |
| **Total per session** | **~23,000** | **~10,000** | **~$0.22** |
| Per refinement | ~3000 | ~1000 | ~$0.04 |

Target: under $0.50 per complete session including 3-5 refinements.

---

## 7. State Management

### 7.1 State Location

| State type | Where it lives | Why |
|-----------|---------------|-----|
| Session data (step, status, raw_idea) | Supabase `sessions` | Must survive refresh, multiple devices |
| PRD blocks and metadata | Supabase `prd_blocks` + `prds` | Source of truth for the artifact |
| Conversation messages | Supabase `messages` + AI SDK `useChat` | DB for persistence, AI SDK for streaming |
| Reactive PRD rendering | Zustand `wizard-store` | Client-side mirror for instant UI updates |
| Card interaction state | React local state | Ephemeral, per-card lifecycle |
| Auth state | Supabase Auth cookies | Managed by `@supabase/ssr` |
| Anonymous identity | `enhanced_anon_id` httpOnly cookie | Must be readable by Server Actions |

### 7.2 Zustand Store Interface (CANONICAL)

```typescript
interface WizardState {
  // Session
  sessionId: string | null
  currentStep: 1 | 2 | 3 | 4
  viewingStep: 1 | 2 | 3 | 4
  rawIdea: string | null
  status: 'active' | 'completed' | 'abandoned'

  // PRD metadata
  prdId: string | null
  prdTitle: string
  confidenceScore: number | null
  recommendation: 'build' | 'test_first' | 'abandon' | null

  // Blocks — keyed by block_type for O(1) access
  blocks: Record<string, PrdBlock>

  // UI state
  isPrdPanelCollapsed: boolean
  activeRefineBlockId: string | null
  lastUpdatedBlockType: string | null
  activePanel: 'conversation' | 'prd'

  // Actions
  initialize: (data: InitData) => void
  setSession: (id: string, step: number) => void
  setPrd: (prdId: string, title: string, score: number | null, rec: string | null) => void
  updateBlock: (blockType: string, content: string, tags?: EvidenceTag[]) => void
  updateBlockContent: (blockId: string, content: string) => void
  setBlockRefining: (blockId: string, isRefining: boolean) => void
  setConfidenceScore: (score: number, recommendation: string) => void
  advanceStep: () => void
  goToStep: (step: number) => void
  setRefineBlock: (blockId: string | null) => void
  togglePrdPanel: () => void
  setActivePanel: (panel: 'conversation' | 'prd') => void
  hydrateBlocks: (blocks: PrdBlock[]) => void
  clearLastUpdated: () => void
}
```

### 7.3 State Sync Strategy

```
1. INITIAL LOAD (Server Component -> Client)
   page.tsx loads session + prd + blocks + messages from DB
   -> passes as props to WizardClient
   -> WizardClient hydrates Zustand store via initialize() + hydrateBlocks()
   -> useChat receives initialMessages

2. DURING CONVERSATION
   update_prd tool result streamed to client
   -> useUpdatePrdSync hook intercepts result
   -> calls wizardStore.updateBlock() with new content + tags
   -> Zustand reactivity re-renders affected PrdBlock

3. DURING REFINEMENT
   /api/refine streams new content
   -> useRefineBlock progressively calls updateBlockContent()
   -> Zustand re-renders block with streaming content

4. PAGE RELOAD
   Full cycle repeats from step 1 (DB is source of truth)
```

### 7.4 PRD Block Update Flow

```
AI calls update_prd({ block_type: 'risk_value', content: '...', evidence_tags: [...] })
  |
  v (server-side execute)
UPSERT prd_blocks (ON CONFLICT prd_id,block_type)
INSERT prd_versions (trigger = 'generation')
Return { updated: 'risk_value', content_length: 450 }
  |
  v (streamed to client via SSE)
useChat receives tool invocation with result
  |
  v
useUpdatePrdSync detects update_prd result (deduplicates via processedCallIds ref)
  |
  v
wizardStore.updateBlock('risk_value', content, tags)
  |
  v (Zustand reactivity)
PrdViewer re-renders: PrdBlock for risk_value shows new content
  |
  v
Animation: ring-2 highlight for 2 seconds, then clearLastUpdated()
```

---

## 8. Authentication & Session Flow

### 8.1 Complete Lifecycle

```
Visitor (no cookie, no auth)
  |
  | Submit idea on landing page
  v
createSession(formData)
  | -> INSERT sessions (anonymous_id = UUID v4)
  | -> INSERT prds (session_id FK)
  | -> Set cookie: enhanced_anon_id = anonymous_id
  | -> redirect to /session/[id]
  v
Anonymous phase (cookie-only identity)
  | -> /api/chat reads enhanced_anon_id cookie
  | -> Server Actions verify cookie against sessions.anonymous_id
  | -> Wizard is fully functional
  |
  | First update_prd tool call renders a PRD block
  v
AuthGate modal appears (non-blocking, minimizable)
  | -> PM enters email
  | -> signInWithOtp({ email })
  | -> Supabase sends magic link
  | -> PM continues using wizard while waiting
  |
  | PM clicks magic link in email
  v
/auth/confirm
  | -> verifyOtp({ token_hash, type: 'magiclink' })
  | -> claimSession() Server Action:
  |      BEGIN
  |        UPDATE sessions SET user_id = auth.uid, anonymous_id = NULL
  |        UPDATE prds SET user_id = auth.uid
  |      COMMIT
  | -> Clear enhanced_anon_id cookie
  | -> redirect to /session/[id]
  v
Authenticated phase (Supabase JWT)
  | -> RLS policies protect all data via auth.uid() = user_id
  | -> Cookie no longer exists
  | -> Full feature access (PDF export, sharing, etc.)
```

### 8.2 Cookie Configuration

**CANONICAL (Resolution 1):** Cookie name is `enhanced_anon_id`.

| Attribute | Value | Rationale |
|-----------|-------|-----------|
| Name | `enhanced_anon_id` | Shorter, majority usage across features |
| `httpOnly` | `true` | Prevents XSS-based session theft |
| `secure` | `true` (production) | Cookie only sent over HTTPS |
| `sameSite` | `lax` | Allows magic link redirect from email to carry cookie |
| `path` | `/` | Available on all routes |
| `maxAge` | `2592000` (30 days) | Generous TTL for anonymous phase |

### 8.3 Auth State Machine

```
               createSession()
 [Visitor] ─────────────────────► [Anonymous]
                                      │
                              signInWithOtp()
                                      │
                                      ▼
                                [Pending Auth]
                                      │
                         verifyOtp() + claimSession()
                                      │
                                      ▼
                               [Authenticated]
```

**Invariant:** At no point are both `user_id` and `anonymous_id` simultaneously set on a
session row. The claiming transaction is atomic.

---

## 9. Data Flows

### 9.1 Flow 1: Landing -> Session Creation -> Wizard Entry

```
Browser: PM fills textarea, clicks "Lancer le cadrage"
  -> form action={handleSubmit}
  -> useTransition wraps createSession(formData)

Server: createSession(formData: FormData)
  -> Zod validate rawIdea (min 20 chars, max 5000)
  -> crypto.randomUUID() -> anonymousId
  -> Supabase INSERT sessions (anonymous_id, raw_idea, step=1, status='active')
  -> Supabase INSERT prds (session_id, title='', is_public=false)
  -> cookies().set('enhanced_anon_id', anonymousId, { httpOnly, lax, 30d })
  -> redirect('/session/${sessionId}')

Browser: navigates to /session/[id]
  -> Server Component loads session + PRD + messages from DB
  -> Passes to WizardClient -> store hydration -> shell renders
```

### 9.2 Flow 2: Conversation Turn

```
PM types message (or answers card via addToolResult)
  -> useChat sends POST /api/chat { sessionId, messages }

Server: POST /api/chat
  -> Zod validate request body
  -> Dual auth: Supabase user OR enhanced_anon_id cookie
  -> Load session (verify ownership, get current_step)
  -> Load PRD + existing blocks
  -> buildSystemPrompt(step, blocks, title)
  -> streamText({ model, system, messages, tools, maxSteps: 5 })
       |
       |-- AI generates text -> streamed to client
       |-- AI calls ask_user -> tool call streamed, client renders card
       |-- AI calls update_prd -> execute runs:
       |     UPSERT prd_blocks
       |     INSERT prd_versions
       |     Result streamed to client
       |
       onStepFinish -> persist messages to DB
       onFinish -> log token usage, PostHog events

Client: createUIMessageStreamResponse consumed by useChat
  -> Messages render in conversation panel
  -> update_prd results intercepted by useUpdatePrdSync -> Zustand -> PRD panel
  -> ask_user cards rendered by CardRenderer
```

### 9.3 Flow 3: Block Refinement

```
PM hovers PRD block -> "Refine" button appears
  -> PM clicks -> RefinePopover opens
  -> PM types instruction, clicks "Refiner"
  -> useRefineBlock hook:
       save originalContent for rollback
       setBlockRefining(blockId, true)
       POST /api/refine { prd_id, block_id, instruction }

Server: POST /api/refine
  -> Zod validate, dual auth, rate limit (10/min/user-or-anon)
  -> Load target block + all blocks (full PRD context)
  -> Verify ownership via PRD -> session
  -> buildRefinePrompt(targetBlock, allBlocks, instruction)
  -> streamText({ model, system, userMessage, temperature: 0.7, maxTokens: 8192 })
       onFinish -> UPDATE prd_blocks, INSERT prd_versions (trigger='refinement')
  -> toTextStreamResponse()

Client: reads stream via ReadableStream
  -> progressively calls updateBlockContent(blockId, accumulated)
  -> block re-renders with streaming content
  -> on complete: setBlockRefining(false), close popover
  -> on error: rollback to originalContent, show error in popover
```

### 9.4 Flow 4: PDF Export

```
PM clicks "Export PDF" button in PRD header
  -> ExportPdfButton fetches GET /api/export/[prdId]/pdf

Server: GET /api/export/[prdId]/pdf
  -> Auth check (must own PRD)
  -> Load PRD + all blocks (ordered by sort_order)
  -> registerFonts() (Kedebideri + Cantarell, base64)
  -> renderToBuffer(<PrdDocument prd={data} blocks={blocks} />)
  -> Return Buffer with Content-Type: application/pdf

Client: receives blob
  -> URL.createObjectURL -> invisible <a> link -> click -> download
  -> URL.revokeObjectURL cleanup
```

### 9.5 Flow 5: Public Sharing

```
PM toggles "Public" switch in PRD header
  -> ShareToggle calls togglePublic(prdId) Server Action

Server: togglePublic(prdId)
  -> Auth check, load PRD (verify ownership)
  -> If making public and no slug: slug = nanoid(10)
  -> UPDATE prds SET is_public = !current, share_slug = slug
  -> revalidatePath('/p/${slug}')
  -> PostHog: prd_shared_publicly or prd_unshared
  -> Return { isPublic, shareUrl }

Stakeholder visits enhanced.pm/p/[slug]
  -> Server Component (force-dynamic)
  -> generateMetadata: builds OG tags from executive_summary
  -> getPrdBySlug(slug): SELECT prds WHERE share_slug = slug AND is_public = true
       Found -> load blocks, render PrdViewerServer(readOnly)
       Not found -> notFound() (same 404 for missing or private)
```

### 9.6 Flow 6: Version Creation

```
Version creation is automatic, triggered by two paths:

Path A: Generation (during conversation)
  -> update_prd tool execute function
  -> After UPSERT prd_blocks:
     INSERT prd_versions (prd_id, block_id, version_number, content_snapshot, trigger='generation')

Path B: Refinement (during block refine)
  -> /api/refine onFinish callback
  -> After UPDATE prd_blocks:
     INSERT prd_versions (prd_id, block_id, version_number, content_snapshot, trigger='refinement')

Version numbering: SELECT COALESCE(MAX(version_number), 0) + 1 FROM prd_versions WHERE prd_id = $1
```

---

## 10. Deployment Architecture

### 10.1 Vercel Deployment

| Environment | Branch | Domain | Trigger |
|-------------|--------|--------|---------|
| Production | `main` | `enhanced.pm` | Push to `main` |
| Staging | `staging` | `staging.enhanced.pm` | Push to `staging` |

Deploys are automatic via Vercel GitHub integration. No GitHub Actions CI/CD.

### 10.2 Environment Variables (Complete List)

| Variable | Scope | Required | Description |
|----------|-------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Yes | Supabase project endpoint |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Yes | Supabase anonymous JWT (RLS-protected) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server | Yes | Service role key for anonymous writes |
| `OPENROUTER_API_KEY` | Server | Yes | OpenRouter API key |
| `OPENROUTER_MODEL` | Server | No | Model ID (default: `anthropic/claude-sonnet-4-20250514`) |
| `NEXT_PUBLIC_APP_URL` | Public | Yes | Base URL for share links (`https://enhanced.pm`) |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public | Yes | PostHog project API key |
| `NEXT_PUBLIC_POSTHOG_HOST` | Public | No | PostHog host (default: `https://us.i.posthog.com`) |

### 10.3 Supabase Configuration

- **Auth:** Magic link enabled, email provider configured.
- **RLS:** Enabled on ALL 6 tables, no exceptions.
- **Region:** EU preferred for GDPR considerations.

### 10.4 force-dynamic

**CANONICAL (Resolution 14):** The public sharing page requires force-dynamic for immediate
revocation:

```typescript
// src/app/p/[slug]/page.tsx
export const dynamic = 'force-dynamic'
```

---

## 11. Cross-Cutting Concerns

### 11.1 PostHog Event Inventory

| Event | Source | Properties | Linked KPI |
|-------|--------|-----------|-----------|
| `landing_pitch_submitted` | pitch-form.tsx | `raw_idea_length` | Funnel top |
| `wizard_step_started` | /api/chat onStepFinish | `session_id`, `step` | Drop-off rates |
| `wizard_step_completed` | /api/chat onStepFinish | `session_id`, `step`, `duration_seconds` | Drop-off rates |
| `wizard_completed` | /api/chat onFinish (step 4) | `session_id`, `total_duration_seconds`, `message_count` | KR2, KR4 |
| `wizard_step_changed` | wizard-store advanceStep/goToStep | `session_id`, `from_step`, `to_step`, `direction` | Navigation analytics |
| `chat_message_sent` | /api/chat | `session_id`, `step`, `role` | Time-to-PRD |
| `ask_user_card_shown` | /api/chat | `session_id`, `step`, `card_type` | Card analytics |
| `ask_user_card_answered` | /api/chat | `session_id`, `step`, `card_type`, `duration_ms` | Card analytics |
| `update_prd_block_written` | update_prd execute | `session_id`, `block_type`, `trigger` | PRD construction |
| `block_refined` | /api/refine onFinish | `session_id`, `block_type`, `instruction_length` | KPI: refinement usage |
| `pdf_exported` | /api/export onSuccess | `session_id`, `prd_id` | KPI: export rate |
| `prd_shared_publicly` | togglePublic | `session_id`, `prd_id`, `slug` | KR3 |
| `prd_unshared` | togglePublic | `session_id`, `prd_id` | Toggle-off tracking |
| `public_prd_viewed` | /p/[slug] page | `slug`, `referrer` | Distribution analytics |
| `share_link_copied` | share-toggle.tsx | `session_id`, `prd_id` | Share funnel |
| `auth_signup_prompted` | auth-gate.tsx | `session_id` | Auth conversion |
| `auth_signup_completed` | /auth/confirm | `session_id` | Auth conversion |
| `ai_error` | /api/chat, /api/refine | `session_id`, `error_type`, `status_code` | Error monitoring |

### 11.2 Error Handling Strategy

- **AI errors:** Displayed inline in the conversation panel (not toast notifications) with
  a "Retry" button. Partial streamed content is preserved.
- **Server Action errors:** Returned as `{ error: string }` objects. UI displays the error
  message in French near the triggering element.
- **Network errors:** `useChat` `onError` callback displays "Connection lost" inline.
- **Validation errors:** Zod error messages are French, displayed adjacent to the input.
- **PDF errors:** "Impossible de generer le PDF. Reessayez." below the export button.

### 11.3 Performance Targets

| Metric | Target | Measured by |
|--------|--------|------------|
| Landing page LCP | < 1.5s | Lighthouse |
| First AI token latency | < 2s | Server-side timing |
| PRD block update latency | < 500ms (tool result -> visible) | Client-side timing |
| Card render latency | < 100ms | Client-side timing |
| Public page server render | < 500ms | Vercel function duration |
| toggle latency | < 200ms | Server Action duration |

### 11.4 Accessibility

- **Target:** WCAG 2.1 AA
- **Evidence tags:** Not color-only (include text label + aria-label)
- **Step indicator:** `aria-current="step"`, `aria-label` on nav, `disabled` on locked steps
- **Cards:** All inputs have labels, error messages linked via `aria-describedby`
- **PRD blocks:** Semantic `<h3>` headings, keyboard-navigable (Tab)
- **Color contrast:** All text and badges meet AA contrast ratio

---

## 12. Conflict Resolution Log

| # | Conflict | Feature specs involved | Canonical decision | Specs to update |
|---|---------|----------------------|-------------------|-----------------|
| 1 | Cookie name: `enhanced_anonymous_id` vs `enhanced_anon_id` | deferred-auth, conversation-engine vs landing-page, wizard-shell, block-refinement | **`enhanced_anon_id`** — shorter, majority usage | deferred-auth, conversation-engine |
| 2 | `prds.recommendation` CHECK constraint: absent vs present | deferred-auth vs prd-live-builder | **Include CHECK** `('build','test_first','abandon')` from initial migration | deferred-auth |
| 3 | `prd_versions` definition: duplicate, different indexes | prd-live-builder vs prd-versioning | **Single definition**, indexes: `(prd_id, version_number DESC)` + `(block_id) WHERE block_id IS NOT NULL` | prd-live-builder (remove `created_at DESC` index) |
| 4 | `prd_versions` RLS: combined vs separate SELECT, anonymous INSERT | prd-live-builder vs prd-versioning | **Separate SELECT policies** (own + public). INSERT allows `user_id IS NULL`. | prd-live-builder |
| 5 | `advanceStep` auth: authenticated-only vs dual-auth | conversation-engine (current impl) vs /api/chat pattern | **Dual-auth** — supports both user_id and anonymous_id cookie | conversation-engine |
| 6 | `createSession` signature: `(rawIdea: string)` vs `(formData: FormData)` | deferred-auth vs landing-page | **`(formData: FormData)`** — standard Server Action convention | deferred-auth |
| 7 | Block type labels: different mappings in pdf-export and block-refinement | pdf-export, block-refinement | **Single `src/lib/prd/constants.ts`** with canonical labels | pdf-export (`src/lib/pdf/constants.ts`), block-refinement (`ai-integration.md`) |
| 8 | Model configuration: hard-coded vs env var | conversation-engine vs block-refinement | **`getOpenRouterModel()`** from `src/lib/ai/model.ts` everywhere | conversation-engine (replace `model` import) |
| 9 | Temperature: implicit vs explicit | conversation-engine vs block-refinement | **Conversation = 1.2, Refinement = 0.7**, both explicit | conversation-engine (add explicit temp) |
| 10 | Max tokens: implicit vs explicit | conversation-engine vs block-refinement | **Conversation = 16384, Refinement = 8192**, both explicit | conversation-engine (add explicit maxTokens) |
| 11 | Anonymous message INSERT: RLS policy vs app-layer | conversation-engine data-model vs deferred-auth | **Keep RLS policies as defense in depth.** App layer provides identity verification via cookie. Anon key used (not service role), so RLS always applies. RLS policies provide structural safety on all tables. | conversation-engine data-model |
| 12 | Rate limiting key: sessionId vs user/anon ID | conversation-engine vs block-refinement | **user ID or anonymous ID** consistently | conversation-engine |
| 13 | "Autre — preciser" injection: prompt-only vs client safety net | conversation-engine ai-integration | **Client-side auto-inject** if missing. Prompt still instructs, client is safety net. | conversation-engine ai-integration |
| 14 | `force-dynamic` on /p/[slug]: mentioned in security but not in page spec | public-sharing security vs public-sharing api | **Required.** `export const dynamic = 'force-dynamic'` on the page. | public-sharing api |
| 15 | Block content max length: unspecified | prd-live-builder, block-refinement, conversation-engine | **10,000 characters per block.** Enforced at application layer (Zod validation on `update_prd` tool params and `/api/refine`). Theoretical max PRD = 120,000 chars. Content rendered via `react-markdown` with sanitization. | prd-live-builder data-model, block-refinement api, conversation-engine ai-integration |

---

*This document is the canonical cross-cutting architecture reference for Enhanced V1. Feature
specs defer to it when they conflict. Updated whenever a new architectural decision is made.*

*Full decision trail: [Discovery](../discovery_wizard/enhanced-wizard-v1.md) |
[PRD](prd.md) | [Executive Summary](executive-summary.md)*
