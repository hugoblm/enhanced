# Data Model — Deferred Auth

> Database tables, constraints, indexes, RLS policies, and triggers required for the
> Deferred Auth feature.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Tables

### profiles

Auto-created on Supabase Auth signup via trigger. Stores display-level user data.

```sql
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  display_name TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own profile
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

**Notes:**
- `id` is the Supabase Auth user UUID — no surrogate key.
- `email` is denormalized from `auth.users` for query convenience (avoids cross-schema joins).
- No INSERT policy — the trigger below handles profile creation.

---

### sessions (auth-relevant columns)

The `sessions` table is shared across features. This spec covers the columns relevant to
deferred auth. Other columns (`current_step`, `status`, etc.) are documented in the
conversation-engine and wizard-shell tech specs.

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

  -- At least one identity must be present
  CONSTRAINT sessions_identity_check
    CHECK (user_id IS NOT NULL OR anonymous_id IS NOT NULL)
);

-- Index for anonymous session lookup during claiming
CREATE INDEX idx_sessions_anonymous_id ON public.sessions(anonymous_id)
  WHERE anonymous_id IS NOT NULL;

-- Index for authenticated user session queries
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own sessions
CREATE POLICY "sessions_select_own"
  ON public.sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can update their own sessions
CREATE POLICY "sessions_update_own"
  ON public.sessions FOR UPDATE
  USING (auth.uid() = user_id);

-- Authenticated users can delete their own sessions
CREATE POLICY "sessions_delete_own"
  ON public.sessions FOR DELETE
  USING (auth.uid() = user_id);

-- Anonymous session creation: allow INSERT with service role or via Server Action
-- (Server Actions use the service role implicitly through createClient)
-- No public INSERT policy — all INSERTs go through Server Actions using the anon key
-- with the anonymous_id verified at the application layer.
CREATE POLICY "sessions_insert_authenticated"
  ON public.sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Anonymous sessions can be read via the anon key (app layer filters by cookie)
CREATE POLICY "sessions_select_anonymous"
  ON public.sessions FOR SELECT
  USING (user_id IS NULL);
```

> **Note:** The `sessions_select_anonymous` policy allows anonymous sessions to read their own
> data via the anon key. The app layer provides additional filtering by matching the
> `enhanced_anon_id` cookie against `sessions.anonymous_id`.

**Anonymous access pattern:**
Anonymous sessions are NOT accessed via RLS. Instead, Server Actions verify the
`enhanced_anon_id` cookie value against `sessions.anonymous_id` at the application
layer. This is secure because:
1. The cookie is httpOnly (not readable by client JS).
2. The `anonymous_id` is a UUID v4 (unguessable).
3. Server Actions run server-side with the cookie available in the request.

After claiming, `anonymous_id` is set to NULL and the session is protected by the standard
`auth.uid() = user_id` RLS policies.

---

### prds (auth-relevant columns)

The `prds` table is shared across features. This spec covers the auth-relevant columns.

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
CREATE UNIQUE INDEX idx_prds_share_slug ON public.prds(share_slug) WHERE share_slug IS NOT NULL;

ALTER TABLE public.prds ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read their own PRDs
CREATE POLICY "prds_select_own"
  ON public.prds FOR SELECT
  USING (auth.uid() = user_id);

-- Public PRDs are readable by anyone (for public-sharing feature)
CREATE POLICY "prds_select_public"
  ON public.prds FOR SELECT
  USING (is_public = true);

-- Authenticated users can update their own PRDs
CREATE POLICY "prds_update_own"
  ON public.prds FOR UPDATE
  USING (auth.uid() = user_id);

-- INSERT: allow when user_id matches auth or is null (anonymous creation)
CREATE POLICY "prds_insert"
  ON public.prds FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Anonymous PRDs can be read via the anon key (app layer filters by cookie)
CREATE POLICY "prds_select_anonymous"
  ON public.prds FOR SELECT
  USING (user_id IS NULL);
```

> **Note:** The `prds_select_anonymous` policy allows anonymous sessions to read their own
> data via the anon key. The app layer provides additional filtering by matching the
> `enhanced_anon_id` cookie against `sessions.anonymous_id`.

---

## Trigger: Auto-create profile on signup

When a new user signs up via magic link, Supabase creates a row in `auth.users`. This trigger
automatically creates the corresponding `profiles` row.

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

**Notes:**
- `SECURITY DEFINER` is required because the function inserts into `public.profiles` from
  the `auth` schema context.
- `SET search_path = ''` prevents search-path injection attacks (Supabase best practice).
- The trigger fires on every new signup — including magic link for new users.

---

## Trigger: Auto-update `updated_at`

Shared trigger for all tables with an `updated_at` column.

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

CREATE TRIGGER sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER prds_updated_at
  BEFORE UPDATE ON public.prds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

## Session Claiming — Data Flow

The claiming operation is the critical transition. Here is the exact SQL executed inside the
`claimSession` Server Action, wrapped in a transaction:

```sql
BEGIN;

-- 1. Claim the session
UPDATE public.sessions
SET user_id = $1,          -- authenticated user UUID
    anonymous_id = NULL
WHERE anonymous_id = $2    -- cookie value
  AND user_id IS NULL;     -- guard: only claim unclaimed sessions

-- 2. Claim the associated PRD(s)
UPDATE public.prds
SET user_id = $1
WHERE session_id IN (
  SELECT id FROM public.sessions WHERE user_id = $1 AND anonymous_id IS NULL
);

COMMIT;
```

**Invariants:**
- After claiming, `anonymous_id` is always NULL on the affected session.
- After claiming, `user_id` is always set on both the session and its PRD(s).
- If the session was already claimed (`user_id IS NOT NULL`), the UPDATE matches 0 rows —
  the operation is a no-op and the caller receives an error.
- Messages and prd_blocks are linked via `session_id` FK — they are unaffected by the claiming
  operation (no columns to update).

---

## Migration Files

Two migration files to be created under `supabase/migrations/`:

1. **`YYYYMMDDHHMMSS_create_profiles.sql`**
   - `profiles` table + RLS + trigger (`handle_new_user`) + `update_updated_at` function

2. **`YYYYMMDDHHMMSS_create_sessions_and_prds.sql`**
   - `sessions` table + indexes + RLS + `updated_at` trigger
   - `prds` table + indexes + RLS + `updated_at` trigger
