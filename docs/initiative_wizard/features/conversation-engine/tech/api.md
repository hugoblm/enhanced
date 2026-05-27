# API — Conversation Engine

> The `POST /api/chat` streaming endpoint: the single route that powers all 4 wizard steps.
> This is the most complex route in the system.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## Endpoint: POST /api/chat

**File:** `src/app/api/chat/route.ts`

### Request

**Content-Type:** `application/json`

**Body (Zod schema):**

```typescript
// src/lib/ai/schemas.ts

import { z } from 'zod'

const MessagePartSchema = z.object({
  type: z.enum(['text', 'tool-call', 'tool-result']),
  text: z.string().optional(),
  toolCallId: z.string().optional(),
  toolName: z.string().optional(),
  args: z.unknown().optional(),
  result: z.unknown().optional(),
})

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'tool']),
  content: z.string().optional(),
  parts: z.array(MessagePartSchema).optional(),
  toolCallId: z.string().optional(),
  toolName: z.string().optional(),
  result: z.unknown().optional(),
})

export const ChatRequestSchema = z.object({
  sessionId: z.string().uuid(),
  messages: z.array(ChatMessageSchema).min(1),
})

export type ChatRequest = z.infer<typeof ChatRequestSchema>
```

**Note:** The `messages` array is managed by the AI SDK's `useChat` hook on the client. The
client sends the full message history on every request (standard AI SDK pattern). The server
uses this array as the `messages` parameter for `streamText()`.

### Response

**Content-Type:** `text/event-stream` (SSE)

The response is a streaming SSE response created by `createUIMessageStreamResponse()` from the
`ai` package. It streams:

1. Text tokens as they are generated
2. Tool call objects when the AI invokes `ask_user` or `update_prd`
3. Tool results when server-resolved tools complete (`update_prd`)
4. Finish signals when the turn is complete

The client's `useChat` hook consumes this stream automatically.

### Error responses

| Status | Condition | Body |
|--------|-----------|------|
| `400` | Request body fails Zod validation | `{ error: "Invalid request", details: ZodError.issues }` |
| `401` | No valid Supabase user AND no valid `enhanced_anon_id` cookie | `{ error: "Unauthorized" }` |
| `404` | Session not found or does not belong to the user/anonymous_id | `{ error: "Session not found" }` |
| `429` | Rate limit exceeded (>20 messages/minute/user) | `{ error: "Too many requests", retryAfter: seconds }` |
| `500` | OpenRouter API failure or unexpected server error | `{ error: "AI service unavailable", retryable: true }` |

---

## Route handler implementation

```typescript
// src/app/api/chat/route.ts

import { streamText, createUIMessageStreamResponse } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { model } from '@/lib/ai/openrouter'
import { askUserTool, createUpdatePrdTool } from '@/lib/ai/tools'
import { buildSystemPrompt } from '@/lib/ai/prompts/system'
import { ChatRequestSchema } from '@/lib/ai/schemas'
import { persistMessages } from '@/lib/ai/message-persistence'
import { trackChatEvent } from '@/lib/analytics/posthog-server'
import { checkRateLimit } from '@/lib/rate-limit'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  // 1. Parse and validate request body
  const body = await req.json()
  const parsed = ChatRequestSchema.safeParse(body)
  if (!parsed.success) {
    return Response.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 },
    )
  }
  const { sessionId, messages } = parsed.data

  // 2. Authenticate: Supabase user OR anonymous_id cookie
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const cookieStore = await cookies()
  const anonymousId = cookieStore.get('enhanced_anon_id')?.value

  if (!user && !anonymousId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 3. Load session from DB (verify ownership)
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('id, current_step, status, user_id, anonymous_id')
    .eq('id', sessionId)
    .single()

  if (sessionError || !session) {
    return Response.json({ error: 'Session not found' }, { status: 404 })
  }

  // Verify ownership
  const isOwner = user
    ? session.user_id === user.id
    : session.anonymous_id === anonymousId
  if (!isOwner) {
    return Response.json({ error: 'Session not found' }, { status: 404 })
  }

  // 4. Rate limiting (key: user ID or anonymous ID, not session ID)
  const rateLimitKey = user?.id ?? anonymousId!
  const rateLimitResult = await checkRateLimit(rateLimitKey)
  if (!rateLimitResult.allowed) {
    return Response.json(
      { error: 'Too many requests', retryAfter: rateLimitResult.retryAfter },
      { status: 429 },
    )
  }

  // 5. Load existing PRD blocks (for context in system prompt)
  const { data: prd } = await supabase
    .from('prds')
    .select('id, title, confidence_score, recommendation')
    .eq('session_id', sessionId)
    .single()

  const { data: prdBlocks } = await supabase
    .from('prd_blocks')
    .select('block_type, content, evidence_tags, sort_order')
    .eq('prd_id', prd?.id ?? '')
    .order('sort_order')

  // 6. Build system prompt
  const systemPrompt = buildSystemPrompt({
    step: session.current_step,
    prdBlocks: prdBlocks ?? [],
    prdTitle: prd?.title ?? 'Draft PRD',
  })

  // 7. Stream AI response
  const result = streamText({
    model,
    system: systemPrompt,
    messages,
    temperature: 1.2,
    maxTokens: 16384, // With maxSteps=5, each step can generate up to 16384 tokens. This accommodates long PRD blocks and multi-tool responses.
    tools: {
      ask_user: askUserTool,
      update_prd: createUpdatePrdTool(prd?.id ?? '', supabase),
    },
    maxSteps: 5,

    onStepFinish: async (step) => {
      await persistMessages({
        stepMessages: step.messages,
        sessionId,
        currentStep: session.current_step,
        supabase,
      })
    },

    onFinish: async (result) => {
      // Log token usage
      await trackChatEvent('chat_turn_completed', {
        session_id: sessionId,
        step: session.current_step,
        prompt_tokens: result.usage.promptTokens,
        completion_tokens: result.usage.completionTokens,
        model: result.model,
      })
    },
  })

  // 8. Return streaming response
  return createUIMessageStreamResponse(result)
}
```

---

## Authentication flow (dual auth)

The route supports two authentication modes to handle the deferred-auth pattern:

```
Request arrives
  │
  ├── Check supabase.auth.getUser()
  │     ├── User exists → authenticated mode
  │     │     └── Verify session.user_id === user.id
  │     │
  │     └── No user → check anonymous_id cookie
  │           ├── Cookie exists → anonymous mode
  │           │     └── Verify session.anonymous_id === cookie value
  │           │
  │           └── No cookie → 401 Unauthorized
  │
  └── Ownership verified → proceed with request
```

After session claiming (deferred-auth), the anonymous_id cookie is cleared and all subsequent
requests use Supabase auth. The route handler does not need to know whether a claiming transition
happened -- it simply checks both auth modes on every request.

---

## Rate limiting

**Strategy:** In-memory rate limiter using a simple Map. V1 does not require a distributed
rate limiter (single Vercel serverless function).

**Rate limiting: 20 messages/minute per user. Key: authenticated user ID or `enhanced_anon_id`
cookie value.** This is consistent with the block-refinement endpoint which also keys on
user/anon ID rather than session ID.

```typescript
// src/lib/rate-limit.ts

const WINDOW_MS = 60_000  // 1 minute
const MAX_REQUESTS = 20   // per user per window

interface RateLimitEntry {
  count: number
  resetAt: number
}

const limits = new Map<string, RateLimitEntry>()

export async function checkRateLimit(
  key: string,
  options?: { maxRequests?: number; windowMs?: number }
): Promise<{
  allowed: boolean
  remaining: number
  retryAfter?: number
}> {
  const now = Date.now()
  const maxReq = options?.maxRequests ?? MAX_REQUESTS
  const windowMs = options?.windowMs ?? WINDOW_MS
  const entry = limits.get(key)

  if (!entry || now > entry.resetAt) {
    limits.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxReq - 1 }
  }

  if (entry.count >= maxReq) {
    return {
      allowed: false,
      remaining: 0,
      retryAfter: Math.ceil((entry.resetAt - now) / 1000),
    }
  }

  entry.count++
  return { allowed: true, remaining: maxReq - entry.count }
}
```

**Limitation:** This in-memory approach resets on cold starts and does not work across multiple
serverless instances. Acceptable for V1 demo scale. For production scale, migrate to Vercel
KV or Upstash Redis.

---

## advanceStep Server Action

**File:** `src/app/actions/session.ts`

This Server Action is called by the client when the AI signals that a step is complete. It
validates the minimum block requirements, updates the session, and returns the new step.

```typescript
// src/app/actions/session.ts

'use server'

import { createClient } from '@/lib/supabase/server'
import { validateStepCompletion } from '@/lib/ai/step-validation'
import { revalidatePath } from 'next/cache'

export async function advanceStep(sessionId: string): Promise<{
  success: boolean
  newStep?: number
  error?: string
  missingBlocks?: string[]
}> {
  const supabase = await createClient()

  // 1. Authenticate (dual-auth: Supabase user OR anonymous_id cookie)
  const { data: { user } } = await supabase.auth.getUser()

  let anonymousId: string | undefined
  if (!user) {
    const cookieStore = await (await import('next/headers')).cookies()
    anonymousId = cookieStore.get('enhanced_anon_id')?.value
  }

  if (!user && !anonymousId) {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Load session (match by user_id or anonymous_id)
  const sessionQuery = supabase
    .from('sessions')
    .select('id, current_step, user_id, anonymous_id')
    .eq('id', sessionId)

  if (user) {
    sessionQuery.eq('user_id', user.id)
  } else {
    sessionQuery.eq('anonymous_id', anonymousId!)
  }

  const { data: session } = await sessionQuery.single()

  if (!session) {
    return { success: false, error: 'Session not found' }
  }

  if (session.current_step >= 4) {
    return { success: false, error: 'Already at final step' }
  }

  // 3. Load PRD + blocks
  const { data: prd } = await supabase
    .from('prds')
    .select('id')
    .eq('session_id', sessionId)
    .single()

  const { data: blocks } = await supabase
    .from('prd_blocks')
    .select('block_type, content')
    .eq('prd_id', prd?.id ?? '')

  // 4. Validate step completion
  const validation = validateStepCompletion(session.current_step, blocks ?? [])
  if (!validation.valid) {
    return {
      success: false,
      error: 'Step requirements not met',
      missingBlocks: validation.missingBlocks,
    }
  }

  // 5. Advance step
  const newStep = session.current_step + 1
  const { error: updateError } = await supabase
    .from('sessions')
    .update({ current_step: newStep })
    .eq('id', sessionId)

  if (updateError) {
    return { success: false, error: 'Failed to update session' }
  }

  revalidatePath(`/session/${sessionId}`)

  return { success: true, newStep }
}
```

---

## Error handling strategy

### OpenRouter errors

| Error type | Detection | User-facing behavior |
|-----------|-----------|---------------------|
| API 500 | `streamText` throws or stream errors | "The AI service is temporarily unavailable. Please try again." + Retry button |
| Timeout (30s) | `AbortController` with 30s timeout on `streamText` | "The response is taking longer than expected. Please try again." + Retry button |
| Rate limit (429 from OpenRouter) | OpenRouter returns 429 | "The AI service is busy. Please wait a moment." + auto-retry after delay |
| Invalid tool call | AI generates malformed tool args | Gracefully skip the tool call, log the error, let the AI continue |

### Network errors

| Error type | Detection | User-facing behavior |
|-----------|-----------|---------------------|
| Connection drop during stream | `useChat` `onError` callback | Partial response preserved + "Connection lost. The response may be incomplete." + Retry button |
| Request timeout | Fetch timeout | "Unable to reach the server. Check your connection." + Retry button |

Error messages are displayed inline in the conversation panel (not toast notifications) to
maintain conversational context.
