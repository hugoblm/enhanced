# Data Model — Conversation Engine

> The `messages` table: schema, constraints, indexes, RLS policies, and the persistence
> strategy that connects the AI SDK stream to the database.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Table: messages

### Schema

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
```

### Indexes

```sql
-- Primary query pattern: load all messages for a session step, ordered chronologically
CREATE INDEX idx_messages_session_step
  ON public.messages(session_id, step, created_at);
```

### Row Level Security

```sql
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read messages from their own sessions
CREATE POLICY "messages_select_own"
  ON public.messages FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.sessions WHERE user_id = auth.uid()
    )
  );

-- Authenticated users can insert messages into their own sessions
CREATE POLICY "messages_insert_own"
  ON public.messages FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.sessions WHERE user_id = auth.uid()
    )
  );

-- Anonymous message insertion: structural safety for anonymous sessions.
-- This policy provides structural safety (only anonymous sessions can receive messages
-- from unauthenticated users). The app layer adds identity verification via the
-- `enhanced_anon_id` cookie.
CREATE POLICY "messages_insert_anonymous"
  ON public.messages FOR INSERT
  WITH CHECK (
    session_id IN (
      SELECT id FROM public.sessions WHERE anonymous_id IS NOT NULL AND user_id IS NULL
    )
  );

-- Anonymous access: defense in depth. App-layer verifies enhanced_anon_id cookie.
CREATE POLICY "messages_select_anonymous"
  ON public.messages FOR SELECT
  USING (
    session_id IN (
      SELECT id FROM public.sessions WHERE user_id IS NULL
    )
  );
```

**Anonymous access pattern:** Same as `sessions` (see deferred-auth data-model.md). During the
anonymous phase, message INSERTs go through Server Actions that verify the `enhanced_anon_id`
cookie against `sessions.anonymous_id`. After session claiming, standard RLS via `auth.uid()`
takes over.

---

## Column details

### role

| Value | When used | Content column | tool_calls | tool_results |
|-------|-----------|---------------|------------|-------------|
| `user` | PM sends a free-text message | The message text | `NULL` | `NULL` |
| `user` | PM responds to an `ask_user` card | `NULL` or descriptive text | `NULL` | The structured response (see below) |
| `assistant` | AI sends a text response | The streamed text | `NULL` if no tools called | `NULL` |
| `assistant` | AI calls a tool | Text before the tool call (if any) | Array of tool call objects | `NULL` |
| `tool` | Tool result (from client or server) | `NULL` | `NULL` | The tool result object |
| `system` | System prompt (not persisted in `messages`; assembled per-request) | N/A | N/A | N/A |

System messages are **not** stored in the `messages` table. They are assembled server-side on
every request from the prompt files. This avoids prompt duplication and ensures the AI always
gets the latest prompt version.

### tool_calls JSONB

Stored when an assistant message includes tool invocations. Format follows the AI SDK's tool
call structure:

```json
[
  {
    "toolCallId": "tc_abc123",
    "toolName": "ask_user",
    "args": {
      "card_type": "single_choice",
      "question": "What type of product are you building?",
      "options": [
        { "id": "b2b_saas", "label": "B2B SaaS", "description": "Software for other businesses" },
        { "id": "b2c_app", "label": "B2C Consumer App" }
      ]
    }
  }
]
```

### tool_results JSONB

Stored when a user message carries a tool result (card response) or when a server-resolved tool
returns a result. Format:

**Client-resolved (ask_user card response):**

```json
{
  "toolCallId": "tc_abc123",
  "toolName": "ask_user",
  "result": {
    "card_type": "single_choice",
    "selected": "b2b_saas",
    "custom_text": null
  }
}
```

**Server-resolved (update_prd confirmation):**

```json
{
  "toolCallId": "tc_def456",
  "toolName": "update_prd",
  "result": {
    "updated": "first_use_case",
    "content_length": 342
  }
}
```

### metadata JSONB

Flexible column for per-message context. Known fields:

| Field | Type | When present |
|-------|------|-------------|
| `card_type` | `string` | On user messages that respond to `ask_user` cards |
| `structured_response` | `object` | The user's card selection in structured form |
| `token_usage` | `{ promptTokens: number, completionTokens: number }` | On the final assistant message of a turn (populated by `onFinish`) |
| `model` | `string` | The model ID used for this response |
| `duration_ms` | `number` | Server-side response generation time |

---

## Why individual rows (not a JSONB array on sessions)

The conversation could be stored as a single JSONB array column on the `sessions` table.
Individual rows were chosen because:

1. **Efficient append during streaming.** An `INSERT` is cheaper than `UPDATE sessions SET
   messages = messages || new_message` on every turn, especially during multi-step tool call
   sequences.
2. **Cursor-based loading.** Long conversations can be paginated by `created_at`. A JSONB
   array requires loading the entire history on every page load.
3. **Step-based filtering.** Loading only step 3 messages is a simple `WHERE step = 3` clause.
   With a JSONB array, this requires `jsonb_array_elements` filtering.
4. **Simpler conflict resolution.** Concurrent writes (unlikely in V1 but possible) are natural
   INSERTs, not JSONB merge conflicts.
5. **Indexing.** The `(session_id, step, created_at)` index enables efficient queries that a
   GIN index on a JSONB array cannot match for ordered retrieval.

---

## Message persistence strategy

Messages are persisted via callbacks in the `streamText()` call within `POST /api/chat`.

### Write path

```
streamText() begins
  │
  ├── onStepFinish(step) callback fires after each "step" in the AI SDK sense
  │   (a step = one LLM call, which may include tool calls + results)
  │   │
  │   └── For each message in the step:
  │       INSERT INTO messages (session_id, step, role, content, tool_calls, tool_results, metadata)
  │
  └── onFinish(result) callback fires when the full turn is complete
      │
      ├── Update metadata on the final assistant message (token_usage, model, duration_ms)
      └── Fire PostHog events (chat_message_sent, wizard_step_completed if applicable)
```

### Read path

```
Page load / navigation to /session/[id]
  │
  ▼
Server Component loads session + messages from DB
  │
  ├── SELECT * FROM messages WHERE session_id = $1 ORDER BY step, created_at
  │
  └── Pass messages as initialMessages prop to the Client Component
      │
      └── useChat({ initialMessages }) hydrates the conversation state
```

### Important: AI SDK message format vs. DB format

The AI SDK's `Message` type and the DB `messages` row are not identical. A mapping layer is
required:

```typescript
// src/lib/ai/message-mapper.ts

import type { Message as AIMessage } from 'ai'

interface DbMessage {
  id: string
  session_id: string
  step: number
  role: 'user' | 'assistant' | 'system' | 'tool'
  content: string | null
  tool_calls: ToolCall[] | null
  tool_results: ToolResult | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export function dbToAiMessages(dbMessages: DbMessage[]): AIMessage[] {
  // Map DB rows to AI SDK Message format
  // Handle tool_calls → parts conversion
  // Handle tool_results → tool message format
}

export function aiToDbMessage(
  aiMessage: AIMessage,
  sessionId: string,
  step: number,
): Omit<DbMessage, 'id' | 'created_at'> {
  // Map AI SDK Message to DB insert format
  // Extract tool_calls and tool_results from parts
}
```

---

## Migration file

One migration file under `supabase/migrations/`:

**`YYYYMMDDHHMMSS_create_messages.sql`**

Contents:
- `messages` table definition
- Index `idx_messages_session_step`
- RLS enable + policies (`messages_select_own`, `messages_insert_own`, `messages_insert_anonymous`, `messages_select_anonymous`)

Dependencies: `sessions` table must exist (created by deferred-auth migration).

---

## Invariants

> **Invariant — Messages are append-only**
> - **What:** Messages are never updated or deleted during normal operation. The `messages` table
>   has no UPDATE policy. Content corrections happen by appending new messages, not editing old ones.
> - **Where:** `messages` table, RLS policies.
> - **Breaks if:** An UPDATE policy is added or messages are mutated → conversation history
>   becomes unreliable, AI context may be inconsistent with what the user saw.

> **Invariant — Every message has a valid step**
> - **What:** The `step` column always matches `sessions.current_step` at the time the message
>   was created. Messages cannot be created for a step the session has not yet reached.
> - **Where:** Application layer (route handler validates step before persisting).
> - **Breaks if:** Messages are persisted with a mismatched step → step-based message loading
>   returns wrong conversations.

> **Invariant — Tool calls and results are paired**
> - **What:** Every `tool_calls` entry on an assistant message has a corresponding `tool_results`
>   entry on a subsequent tool message (for server-resolved tools) or user message (for
>   client-resolved tools).
> - **Where:** AI SDK manages this pairing automatically; persistence mirrors it.
> - **Breaks if:** A tool call is persisted without its result → conversation replay on page
>   reload shows a dangling card or missing PRD update.
