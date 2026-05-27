# Security Overview -- Enhanced V1

> Canonical security document for Enhanced V1. Single source of truth for the security model,
> authentication architecture, RLS policies, threat analysis, and data privacy posture.
>
> This document consolidates security decisions from `deferred-auth/tech/security.md` and
> `public-sharing/tech/security.md`, plus security concerns spread across other feature specs
> (conversation-engine, block-refinement, prd-live-builder, prd-versioning).

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27
**Canonical:** Yes -- when this document and a feature-level security doc conflict, this
document wins.

---

## 1. Security Model Overview

Enhanced V1 is a server-first application where all sensitive operations (AI calls, database
writes, session management) execute on the server. The client is a thin rendering layer with
no direct database access. Security rests on three principles:

- **Defense in depth.** Every access-control boundary is enforced at two layers: RLS at the
  database level AND ownership verification at the application level. A bug in one layer does
  not expose data.
- **Minimal data collection.** The only PII stored is the user's email address (via Supabase
  Auth). No passwords, no names, no profile photos in V1. Anonymous sessions collect zero PII.
- **Server-first.** Secrets (service role key, OpenRouter API key) never reach the client.
  System prompts are assembled server-side. All mutations go through Server Actions or Route
  Handlers with authentication checks.

---

## 2. Authentication Architecture

### 2.1 Auth State Machine

```
┌─────────────┐    createSession()    ┌─────────────────┐
│  Visitor     │ ──────────────────►  │  Anonymous       │
│  (no state)  │                      │  (cookie set)    │
└─────────────┘                      └────────┬────────┘
                                              │
                                     signInWithOtp()
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │  Pending Auth    │
                                     │  (cookie + OTP)  │
                                     └────────┬────────┘
                                              │
                                     verifyOtp() + claimSession()
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │  Authenticated   │
                                     │  (Supabase JWT)  │
                                     │  (cookie cleared)│
                                     └─────────────────┘
```

| State | What the user can do | What is stored | Transition trigger |
|-------|---------------------|---------------|-------------------|
| **Visitor** | View landing page only | Nothing | Submits raw idea |
| **Anonymous** | Full wizard interaction: chat, receive PRD blocks, view PRD panel | `enhanced_anon_id` cookie (httpOnly) + `sessions.anonymous_id` in DB | Enters email in AuthGate modal |
| **Pending Auth** | Everything from Anonymous + waiting for email | Same as Anonymous + OTP token pending in Supabase Auth | Clicks magic link in email |
| **Authenticated** | Everything + public sharing toggle, session history, full RLS access | Supabase JWT (managed by `@supabase/ssr`) + `sessions.user_id` in DB | N/A (terminal state) |

**Critical invariant:** `user_id` and `anonymous_id` are NEVER both set simultaneously on a
session row. The claiming transition is atomic: `anonymous_id` is nullified in the same
operation that sets `user_id`. This invariant is enforced by the `WHERE user_id IS NULL`
guard on the claiming UPDATE and validated by the `sessions_identity_check` constraint
(`user_id IS NOT NULL OR anonymous_id IS NOT NULL`).

### 2.2 Cookie Configuration

**Cookie name:** `enhanced_anon_id`

This is the canonical cookie name. Both deferred-auth and block-refinement features reference
this cookie for anonymous session verification.

| Attribute | Value | Rationale |
|-----------|-------|-----------|
| `httpOnly` | `true` | Prevents client-side JavaScript from reading the anonymous ID. Blocks XSS-based session theft. The cookie is only accessible in Server Actions and Route Handlers. |
| `secure` | `true` (production) / `false` (development) | Cookie is only transmitted over HTTPS in production, preventing MITM interception. Set to `false` in development for `localhost` without TLS. |
| `sameSite` | `lax` | Prevents CSRF: the cookie is not sent on cross-origin POST requests. `lax` (not `strict`) is required because the magic link redirect from the email client must carry the cookie back to the application. |
| `path` | `/` | Available on all routes. Required because Server Actions and the `/api/chat` route handler both need access. |
| `maxAge` | `2592000` (30 days) | Generous TTL for the anonymous phase. The wizard typically completes in under 30 minutes, but the cookie persists to handle interruptions (browser closed, email delivery delay). After claiming, the cookie is explicitly deleted. |

**Cookie lifecycle:**

1. **Created** by `createSession()` Server Action when the PM submits the landing page form.
   Value is a `crypto.randomUUID()` (UUID v4, 122 bits of entropy).
2. **Read** on every subsequent request by `POST /api/chat`, `POST /api/refine`, and other
   Server Actions that verify anonymous session ownership.
3. **Deleted** by `claimSession()` Server Action after successful OTP verification and session
   claiming. From this point, the Supabase JWT (managed by `@supabase/ssr` middleware) is the
   sole authentication credential.

### 2.3 Magic Link Security

Authentication uses Supabase Auth's OTP mechanism (magic link variant). No passwords are
stored anywhere in the system.

| Property | Value | Notes |
|----------|-------|-------|
| Token type | `magiclink` (Supabase OTP) | Single-use URL token sent via email |
| Token TTL | 1 hour | Supabase default. After expiry, the link returns an error and the PM must request a new one. |
| One-time use | Yes | The token is consumed on first `verifyOtp()` call. Replaying the same link fails. |
| Rate limiting | 60-second cooldown per email | Supabase built-in. Attempting to send a second magic link within 60 seconds returns an error. No application-level rate limiting needed. |
| Redirect URL | `${origin}/auth/confirm` | Set via `emailRedirectTo` in `signInWithOtp()`. The `/auth/confirm` route handler verifies the token and triggers session claiming. |
| Error handling | Invalid/expired token -> redirect to `/auth/login?error=expired_link` | The UI displays a clear error message and a resend option. |

### 2.4 Session Claiming (Anonymous -> Authenticated)

The claiming transition is the most security-critical operation in the system. It converts an
anonymous session (identified by cookie) into an authenticated session (identified by JWT).

**Transaction flow:**

1. `UPDATE sessions SET user_id = $auth_uid, anonymous_id = NULL WHERE anonymous_id = $cookie AND user_id IS NULL`
2. `UPDATE prds SET user_id = $auth_uid WHERE session_id IN (claimed session IDs)`
3. Delete the `enhanced_anon_id` cookie (application layer)

**Guards and invariants:**

- `WHERE user_id IS NULL` prevents double-claiming. If a session is already claimed, the
  UPDATE matches 0 rows and the caller receives an error.
- The cookie value (`anonymous_id`) ties the claim to the browser that created the session.
  A different browser cannot claim the session even if the user authenticates from it.
- Messages and `prd_blocks` are linked via `session_id` FK and require no column updates
  during claiming.

**Race condition analysis:** If two tabs simultaneously attempt to claim the same session
(e.g., the PM clicks the magic link in two browser tabs), the first UPDATE acquires a row-level
lock and sets `user_id`. The second UPDATE finds `user_id IS NOT NULL` and matches 0 rows.
The second caller receives a "Session already claimed" error. No data corruption is possible.

**Atomicity note:** The Supabase JS client does not support explicit `BEGIN/COMMIT`. The two
UPDATEs (sessions, then prds) are sequential. If the PRD update fails after the session update
succeeds, this is a partial state. Mitigated by the fact that PRD ownership is non-critical
until the PM accesses the PRD via an authenticated route (at which point it can be re-claimed
via a background fix). Accepted as low-risk for V1.

---

## 3. Row Level Security (RLS) -- Complete Policy Matrix

All tables have RLS enabled. This is enforced regardless of whether a table is currently
accessed by authenticated users only.

### 3.1 profiles

| Policy Name | Operation | Condition | Notes |
|------------|-----------|-----------|-------|
| `profiles_select_own` | SELECT | `auth.uid() = id` | Users can only read their own profile. |
| `profiles_update_own` | UPDATE | `auth.uid() = id` | Users can only update their own profile. |

No INSERT policy. Profile creation is handled by a `SECURITY DEFINER` trigger
(`handle_new_user`) that fires on `auth.users` INSERT. The trigger uses
`SET search_path = ''` to prevent search-path injection.

### 3.2 sessions

| Policy Name | Operation | Condition | Notes |
|------------|-----------|-----------|-------|
| `sessions_select_own` | SELECT | `auth.uid() = user_id` | Authenticated users read their own sessions. |
| `sessions_update_own` | UPDATE | `auth.uid() = user_id` | Authenticated users update their own sessions. |
| `sessions_delete_own` | DELETE | `auth.uid() = user_id` | Authenticated users delete their own sessions. |
| `sessions_insert_authenticated` | INSERT | `auth.uid() = user_id OR user_id IS NULL` | Allows both authenticated creation and anonymous creation (via service role). |
| `sessions_select_anonymous` | SELECT | `user_id IS NULL` | Anonymous sessions visible to anon key. |

**Anonymous access pattern (defense in depth):** Anonymous sessions use the Supabase anon key
(not the service role key), so RLS policies always apply. RLS policies on `sessions`, `prds`,
`prd_blocks`, and `prd_versions` include `user_id IS NULL` conditions that allow anonymous
INSERT operations. Server Actions additionally verify the `enhanced_anon_id` cookie against
`sessions.anonymous_id` at the application layer. This provides two layers of protection:
RLS provides structural safety at the database level, and the app layer provides identity
verification via cookie.

### 3.3 prds

| Policy Name | Operation | Condition | Notes |
|------------|-----------|-----------|-------|
| `prds_select_own` | SELECT | `auth.uid() = user_id` | Owner reads their own PRDs. |
| `prds_select_public` | SELECT | `is_public = true` | Anyone (including unauthenticated) can read public PRDs. No `share_slug` check in RLS -- the application layer filters by slug. |
| `prds_update_own` | UPDATE | `auth.uid() = user_id` | Only the owner can update (toggle public, edit title, etc.). |
| `prds_insert` | INSERT | `auth.uid() = user_id OR user_id IS NULL` | Allows authenticated and anonymous creation. |
| `prds_select_anonymous` | SELECT | `user_id IS NULL` | Anonymous PRDs visible to anon key. |

### 3.4 prd_blocks

| Policy Name | Operation | Condition | Notes |
|------------|-----------|-----------|-------|
| `prd_blocks_select_via_prd` | SELECT | `prd_id IN (SELECT id FROM prds WHERE auth.uid() = user_id OR is_public = true OR user_id IS NULL)` | Inherits parent PRD visibility. Public and anonymous PRD blocks are readable. |
| `prd_blocks_insert_via_prd` | INSERT | `prd_id IN (SELECT id FROM prds WHERE auth.uid() = user_id OR user_id IS NULL)` | Allows insertion for owned and anonymous PRDs. |
| `prd_blocks_update_via_prd` | UPDATE | `prd_id IN (SELECT id FROM prds WHERE auth.uid() = user_id)` | Only the authenticated owner can update blocks. No anonymous update. |

### 3.5 prd_versions

| Policy Name | Operation | Condition | Notes |
|------------|-----------|-----------|-------|
| `prd_versions_select_own` | SELECT | `prd_id IN (SELECT id FROM prds WHERE user_id = auth.uid() OR user_id IS NULL)` | Owner and anonymous version history visible. |
| `prd_versions_select_public` | SELECT | `prd_id IN (SELECT id FROM prds WHERE is_public = true)` | Public PRD versions are readable. |
| `prd_versions_insert` | INSERT | `prd_id IN (SELECT id FROM prds WHERE user_id = auth.uid() OR user_id IS NULL)` | Version creation for owned or anonymous PRDs. |

No UPDATE or DELETE policies. Version rows are **immutable** -- once created, they are never
modified or removed.

### 3.6 messages

| Policy Name | Operation | Condition | Notes |
|------------|-----------|-----------|-------|
| `messages_select_own` | SELECT | `session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())` | Owner can read their conversation history. |
| `messages_insert_own` | INSERT | `session_id IN (SELECT id FROM sessions WHERE user_id = auth.uid())` | Authenticated message insertion. |
| `messages_insert_anonymous` | INSERT | `session_id IN (SELECT id FROM sessions WHERE anonymous_id IS NOT NULL AND user_id IS NULL)` | Anonymous message insertion (pre-auth). |
| `messages_select_anonymous` | SELECT | `session_id IN (SELECT id FROM sessions WHERE user_id IS NULL)` | Anonymous messages visible to anon key. |

No UPDATE or DELETE policies. Messages are **append-only** by design. Content corrections
happen by appending new messages, not editing old ones.

**Anonymous operations note:** During the anonymous wizard phase (before the PM authenticates),
message and block operations use the Supabase anon key client (not service role). RLS policies
provide structural safety -- the `user_id IS NULL` conditions on INSERT policies allow
anonymous creation, while the app layer verifies the `enhanced_anon_id` cookie against
`sessions.anonymous_id` before executing any operation. This defense-in-depth approach means
RLS always applies, and the app layer adds identity verification on top.

---

## 4. Anonymous Access Control

### 4.1 Anonymous-capable operations

| Operation | Route / Action | Verification method |
|-----------|---------------|-------------------|
| Create session | `createSession()` Server Action | Generates new `anonymous_id`, sets cookie. No prior verification needed. |
| Chat (send message) | `POST /api/chat` | Reads `enhanced_anon_id` cookie, loads session by `sessionId` param, verifies `session.anonymous_id === cookie`. |
| Advance step | `advanceStep()` Server Action | Same cookie verification pattern. (Note: `advanceStep` in conversation-engine spec requires auth; during anonymous phase, step advancement is handled differently.) |
| Receive PRD blocks | `update_prd` tool execute | Runs server-side within the streaming response. The parent `/api/chat` route already verified ownership. |
| Refine block | `POST /api/refine` | Reads `enhanced_anon_id` cookie, loads PRD -> session chain, verifies `session.anonymous_id === cookie`. |

### 4.2 Verification flow (every anonymous request)

1. Read `enhanced_anon_id` cookie from request. No cookie -> 401 Unauthorized.
2. Load session by `sessionId` from request body. No session -> 404 Not Found.
3. Compare `session.anonymous_id === cookie value`. Mismatch -> 404 Not Found (do not reveal
   that the session exists).
4. Ownership verified -> proceed with anon key client (RLS still applies).

### 4.3 Defense-in-depth approach

Anonymous operations use the Supabase anon key client, so **RLS always applies**. The
defense-in-depth layers are:

1. **RLS policies (database layer):** Provide structural safety on all tables. INSERT policies
   with `user_id IS NULL` conditions allow anonymous creation. SELECT/UPDATE policies prevent
   cross-user data access even if the app layer has a bug.
2. **App layer (cookie verification):** Every anonymous operation verifies the
   `enhanced_anon_id` cookie against `sessions.anonymous_id`. This prevents one anonymous
   user from accessing another's session even though both have `user_id IS NULL`.
3. **Anon key (not service role):** Using the anon key ensures RLS is never bypassed. The
   service role key (`SUPABASE_SERVICE_ROLE_KEY`) is reserved for operations that genuinely
   cannot work under RLS (none in V1's anonymous flow).

**Principle:** Anonymous access is ALWAYS write-scoped to the session linked by the cookie.
An anonymous user cannot read, write, or modify any session other than the one whose
`anonymous_id` matches their cookie.

---

## 5. Public Sharing Security

### 5.1 Slug generation

| Property | Value |
|----------|-------|
| Algorithm | `nanoid` with custom config |
| Length | 10 characters |
| Alphabet | URL-safe: `A-Z`, `a-z`, `0-9`, `_`, `-` (64 characters) |
| Entropy | 10 * log2(64) = 60 bits |
| Keyspace | 64^10 = 1.15 x 10^18 possible slugs |
| Collision probability at 10,000 PRDs | ~4.3 x 10^-11 (negligible) |
| Brute-force resistance | At 1,000 req/s: ~36 million years to exhaust keyspace |

Slugs are generated once on first toggle-to-public (via `nanoid(10)` in `togglePublic` Server
Action) and never regenerated. Toggling off sets `is_public = false` but preserves `share_slug`
for re-enable, preventing link rot.

### 5.2 Access model

Public PRDs are accessible via the RLS policy `prds_select_public` which allows SELECT on
rows where `is_public = true`. No authentication is required. The application layer query
(`getPrdBySlug`) adds defense-in-depth by explicitly filtering `is_public = true` AND
`share_slug = $slug`.

### 5.3 Enumeration prevention

- **No listing endpoint.** There is no API or page that lists public PRDs. Discovery is
  possible only via direct URL sharing.
- **Identical 404 response.** The `/p/[slug]` page returns the same 404 page and message
  ("Ce PRD n'existe pas ou n'est plus public.") for:
  - Slugs that do not exist in the database.
  - Slugs that exist but belong to private PRDs.
- **No timing attack.** Both cases execute the same query
  (`SELECT ... WHERE share_slug = $1 AND is_public = true LIMIT 1`), which returns 0 rows
  in both cases. Response time is indistinguishable.

### 5.4 Immediate revocation

When a PM toggles a PRD from public to private:

1. `togglePublic` sets `prds.is_public = false`.
2. `revalidatePath('/p/${slug}')` invalidates any Next.js cache.
3. The next request to `/p/[slug]` hits the database, gets 0 rows (RLS blocks
   `is_public = false`), and returns 404.

The `/p/[slug]` page uses `export const dynamic = 'force-dynamic'` (no ISR, no SSG). Every
request hits the database, guaranteeing immediate revocation with zero cache staleness.

### 5.5 Content exposure

**Intentionally exposed** on public PRD pages:

- Full PRD content (all 12 blocks with markdown)
- Evidence tags (text and classification: evidence/assumption/to_verify)
- Confidence score (0--100)
- Recommendation (build / test_first / abandon)
- PRD title

**NOT exposed** on public PRD pages:

- PM identity (name, email, user ID)
- Conversation history (messages table)
- Raw idea submitted on the landing page
- Version history (prd_versions table -- despite having a `select_public` RLS policy, version
  data is not queried on the public page in V1)
- Other PRDs by the same user
- Session metadata

---

## 6. Threat Model

| ID | Threat | Likelihood | Impact | Mitigation | Status |
|----|--------|-----------|--------|------------|--------|
| T1 | **Anonymous session hijacking** -- attacker guesses or steals `anonymous_id` to access another user's session | Low | Medium | `httpOnly` cookie (no XSS extraction) + `secure` flag (no MITM) + UUID v4 entropy (2^122 possible values, brute-force infeasible) + time-limited attack surface (anonymous phase typically <30 min) | Mitigated |
| T2 | **Session claiming by wrong user** -- User A creates session, User B authenticates and claims it | Very Low | High | Cookie-browser binding (cookie only exists in the browser that created it) + `WHERE anonymous_id = $cookie AND user_id IS NULL` guard + magic link sent to User A's email (User B must intercept it) | Mitigated |
| T3 | **Double-claiming race condition** -- two simultaneous requests attempt to claim the same session | Very Low | Medium | `WHERE user_id IS NULL` is atomic at the Postgres row-lock level. First UPDATE wins, second matches 0 rows and returns error. No data corruption possible. | Mitigated |
| T4 | **Expired magic link replay** -- attacker replays an expired or already-used magic link token | None | High | Supabase OTP tokens are one-time and time-limited (1-hour TTL). `verifyOtp` fails for expired or consumed tokens. `/auth/confirm` redirects to error page on failure. | Mitigated |
| T5 | **Session/slug enumeration** -- attacker iterates IDs to discover sessions or public PRDs | None | Low | Session IDs are UUID v4 (unguessable). Slugs are nanoid(10) with 60-bit entropy. RLS enforces `auth.uid() = user_id`. Identical 404 for private and non-existent slugs. No listing endpoints. | Mitigated |
| T6 | **XSS via PRD content** -- attacker injects scripts via PRD block content | Low | Medium | PRD content is rendered via `react-markdown` with default sanitization (no raw HTML). No use of `dangerouslySetInnerHTML`. Evidence tags are rendered as structured data, not raw user input. | Mitigated |
| T7 | **CSRF on Server Actions** -- attacker tricks the PM's browser into executing a Server Action | None | Medium | Next.js Server Actions include built-in CSRF protection via server-generated tokens. The `/auth/confirm` GET endpoint uses the one-time OTP token as its CSRF defense (no state mutation without valid token). | Mitigated |
| T8 | **API abuse / cost attack** -- attacker floods `/api/chat` or `/api/refine` to inflate AI costs | Medium | Medium | Rate limiting: 20 msg/min per user on `/api/chat`, 10 refines/min per user on `/api/refine`. Key: authenticated user ID or `enhanced_anon_id` cookie value. Session creation requires non-empty `rawIdea` (1--5000 chars). In-memory rate limiter in V1 (Vercel KV/Redis for production scale). | Partially mitigated |
| T9 | **Service role client misuse** -- a code path exposes the service role key or uses it without verification | Low | High | Service role key is server-only (`SUPABASE_SERVICE_ROLE_KEY`, no `NEXT_PUBLIC_` prefix). Anonymous operations now use the anon key with RLS (defense in depth), not the service role key. The service role key is reserved for operations that genuinely cannot work under RLS (none in V1). Code review must verify this on every new code path. | Mitigated |
| T10 | **Public PRD data leak (accidental)** -- PM accidentally toggles a PRD public, exposing draft content | Low | Medium | `is_public` defaults to `false`. Toggling requires explicit user action (switch component). The share toggle UI shows a clear visual state and the public URL. Toggling off triggers immediate revocation. | Mitigated |
| T11 | **Orphaned anonymous sessions** -- unclaimed sessions accumulate indefinitely, consuming storage | Certain | Low | Anonymous sessions with no `user_id` and stale `created_at` should be purged after 30 days. **NOT implemented in V1 -- backlog item.** Storage impact is negligible at V1 scale (<1 KB per session). | Accepted risk |

---

## 7. API Security

### 7.1 Rate limiting strategy

| Endpoint | Rate limit | Key | Implementation |
|----------|-----------|-----|---------------|
| `POST /api/chat` | 20 requests per minute | `user.id` or `enhanced_anon_id` cookie | In-memory Map (`src/lib/rate-limit.ts`) |
| `POST /api/refine` | 10 requests per minute | `user.id` or `anonymous_id` | Same in-memory Map with configurable options |
| Magic link sends | 60-second cooldown per email | Email address | Supabase Auth built-in |
| `createSession` | No explicit limit in V1 | -- | Mitigated by required `rawIdea` input (1--5000 chars) |

**V1 limitation:** The in-memory rate limiter resets on cold starts and does not work across
multiple serverless instances. Acceptable for V1 demo scale. For production: migrate to
Vercel KV or Upstash Redis.

### 7.2 Authentication checks per route

| Route / Action | Auth required | Anonymous allowed | Auth method |
|---------------|--------------|------------------|-------------|
| `GET /` (landing page) | No | N/A | None |
| `createSession()` | No | N/A (creates anonymous session) | None (generates cookie) |
| `GET /session/[id]` | Yes | Yes (cookie) | Supabase JWT or `enhanced_anon_id` cookie |
| `POST /api/chat` | Yes | Yes (cookie) | Supabase JWT or `enhanced_anon_id` cookie |
| `POST /api/refine` | Yes | Yes (cookie) | Supabase JWT or `enhanced_anon_id` cookie |
| `advanceStep()` | Yes | Yes (cookie) | Dual-auth (JWT or anonymous_id cookie) |
| `togglePublic()` | Yes | No | Supabase JWT only |
| `getShareUrl()` | Yes | No | Supabase JWT only |
| `GET /p/[slug]` | No | N/A | None (public page) |
| `GET /auth/confirm` | No | N/A | OTP token in URL params |
| `GET /auth/login` | No | N/A | None |

### 7.3 CORS and content validation

- **CORS:** Next.js defaults (same-origin). No custom CORS headers. The API is not designed
  for cross-origin consumption.
- **Content-Type validation:** All POST routes validate `Content-Type: application/json` via
  Zod schema parsing. Malformed bodies return 400.
- **Input validation:** Every route and Server Action validates inputs via Zod schemas before
  any database operation. Maximum string lengths are enforced (e.g., `rawIdea`: 5000 chars,
  `instruction`: 1000 chars).

---

## 8. Data Privacy & GDPR

### 8.1 Data inventory

| Data type | Where stored | PII? | Retention |
|-----------|-------------|------|-----------|
| Email address | `auth.users` + `profiles.email` | Yes | Until account deletion |
| Anonymous ID | `sessions.anonymous_id` | No (random UUID) | Nullified on claiming; orphaned rows purged after 30 days (backlog) |
| Session data (raw idea, messages) | `sessions`, `messages` | Potentially (user-generated content) | Indefinite in V1 |
| PRD content (blocks, evidence tags) | `prds`, `prd_blocks` | Potentially (user-generated content) | Indefinite in V1 |
| Version snapshots | `prd_versions` | No (mirrors prd_blocks content) | Indefinite in V1 |

### 8.2 Privacy principles

- **No passwords stored.** Magic link authentication means zero password hashes in the
  database. The email is the only credential, and the OTP token is ephemeral.
- **Minimal PII.** Only the email address is stored (in `profiles` and `auth.users`). No
  names, phone numbers, or billing information in V1.
- **Data residency.** Supabase project region determines data residency. EU region preferred
  for GDPR compliance.
- **Data ownership.** After claiming, all session data belongs to the authenticated user and
  is protected by RLS. No other user can access it.
- **Anonymous data isolation.** Anonymous data is not linked to any PII until the claiming
  transition. Before claiming, the only link between the data and a person is the browser
  cookie (which is not PII).

### 8.3 GDPR compliance gaps (V1)

| Requirement | Status | Notes |
|------------|--------|-------|
| Right to access (Art. 15) | Partially met | User can view their sessions and PRDs via the app UI. No formal data export feature. |
| Right to erasure (Art. 17) | **NOT implemented** | No "delete my account" feature in V1. Backlog item. |
| Right to data portability (Art. 20) | Partially met | PDF export covers PRD content. No full data export (messages, sessions). |
| Consent for processing | Met | Account creation is voluntary. Magic link flow implies consent. |
| Data minimization (Art. 5) | Met | Only email stored. No unnecessary data collection. |

### 8.4 Cookie consent

The `enhanced_anon_id` cookie is an httpOnly **functional cookie** required for the
application to work (session identity). It is not used for tracking, advertising, or
analytics. Under GDPR's ePrivacy Directive, strictly necessary cookies are likely exempt from
consent requirements. **[To verify]** -- confirm with legal counsel before launch.

### 8.5 Public PRD content responsibility

When a PM toggles a PRD public, they are responsible for the content being exposed. The PRD
may contain names, company information, or other data the PM entered during the conversation.
Enhanced does not scrub or filter public PRD content. The toggle UI should include a warning
that the content will be publicly accessible.

---

## 9. Environment Variables & Secrets

| Variable | Sensitivity | Runtime | Purpose |
|----------|------------|---------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Client + Server | Supabase project URL. Safe to expose -- it is the project's public endpoint. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Client + Server | Supabase anonymous key. Safe to expose -- it only grants access allowed by RLS policies. |
| `SUPABASE_SERVICE_ROLE_KEY` | **SECRET** | Server only | Bypasses RLS. Used exclusively for anonymous session operations (after cookie verification). Must never appear in client bundles or `NEXT_PUBLIC_` variables. |
| `OPENROUTER_API_KEY` | **SECRET** | Server only | API key for AI model access via OpenRouter. Exposure would allow unauthorized AI usage at the project's expense. |
| `OPENROUTER_MODEL` | Not secret | Server only | Model identifier (e.g., `anthropic/claude-sonnet-4-20250514`). Not sensitive but server-only to avoid leaking model choice to clients. |
| `NEXT_PUBLIC_POSTHOG_KEY` | Public | Client + Server | PostHog project API key. Safe to expose -- it is designed for client-side analytics. |
| `NEXT_PUBLIC_POSTHOG_HOST` | Public | Client + Server | PostHog ingestion endpoint. |
| `NEXT_PUBLIC_APP_URL` | Public | Client + Server | Base URL for share links (e.g., `https://enhanced.pm`). |

**Configuration locations:**
- **Development:** `.env.local` (git-ignored).
- **Staging / Production:** Vercel environment variables (encrypted at rest).

**Principle:** The `NEXT_PUBLIC_` prefix is reserved for values that are genuinely safe to
expose in client-side JavaScript bundles. Any value that grants elevated access or incurs
cost MUST NOT use this prefix.

---

## 10. Security Checklist (Pre-Launch)

### Database

- [ ] All tables have RLS enabled (`profiles`, `sessions`, `prds`, `prd_blocks`,
      `prd_versions`, `messages`)
- [ ] RLS policies tested: authenticated user can only access own data
- [ ] RLS policies tested: unauthenticated user can only SELECT public PRDs and their blocks
- [ ] RLS policies tested: anonymous INSERT policies work for `user_id IS NULL` rows
- [ ] `handle_new_user` trigger creates profiles correctly on signup
- [ ] `sessions_identity_check` constraint validated (no row with both NULL)

### Authentication

- [ ] Cookie flags verified in production: `httpOnly=true`, `secure=true`, `sameSite=lax`
- [ ] Cookie is deleted after successful claiming
- [ ] Magic link flow tested end-to-end: send, click, verify, claim, redirect
- [ ] Anonymous -> authenticated transition preserves all data (messages, blocks, PRD)
- [ ] Expired magic link shows correct error and resend option
- [ ] 60-second cooldown between magic link sends works correctly

### Secrets

- [ ] `SUPABASE_SERVICE_ROLE_KEY` is server-only (not in any `NEXT_PUBLIC_` variable)
- [ ] `OPENROUTER_API_KEY` is server-only
- [ ] `.env.local` is in `.gitignore`
- [ ] Vercel environment variables are set for staging and production

### Rate Limiting

- [ ] `/api/chat` rate limit tested: 21st request within 1 minute returns 429
- [ ] `/api/refine` rate limit tested: 11th request within 1 minute returns 429
- [ ] Rate limit keys are correct (userId/anonId for both chat and refine)

### Public Sharing

- [ ] 404 response is identical for private and non-existent slugs (same page, same message,
      same response time)
- [ ] No user identity leaked on public PRD pages (no email, no user ID, no session ID in
      HTML or network requests)
- [ ] `force-dynamic` on `/p/[slug]` verified (no cached stale content after toggle-off)
- [ ] `togglePublic` requires authenticated user (returns 401 for anonymous)
- [ ] Slug generation produces 10-character URL-safe strings

### Content Security

- [ ] `react-markdown` sanitization verified: no XSS via PRD block content
- [ ] No use of `dangerouslySetInnerHTML` anywhere in the codebase
- [ ] Input length limits enforced: `rawIdea` <= 5000 chars, `instruction` <= 1000 chars
- [ ] Zod validation on all POST route bodies

### Infrastructure

- [ ] Supabase project region is EU (if targeting EU users)
- [ ] Vercel deployment uses HTTPS (automatic)
- [ ] No secrets in git history (check with `git log --all -p | grep -i "secret\|key"`)
