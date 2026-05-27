# API Specification -- Block Refinement

**Status:** Draft -- **Author:** Hugo -- **Date:** 2026-05-27
**Parent spec:** [`technical-spec.md`](technical-spec.md)

---

## POST /api/refine

**File:** `src/app/api/refine/route.ts`

Refines a single PRD block based on a natural language instruction. Returns a streaming response with the regenerated block content. On completion, persists the new content to the database and creates a version snapshot.

---

### Authentication

Requires an authenticated Supabase session (via `createClient()` server helper which reads the auth cookie). Returns `401` if no valid session.

For anonymous users who have not yet authenticated (pre-deferred-auth), access is controlled via the `enhanced_anon_id` cookie matching the session's `anonymous_id`.

---

### Request

**Method:** `POST`
**URL:** `/api/refine`
**Content-Type:** `application/json`

**Body schema (Zod):**

```tsx
// src/lib/schemas/refine.ts
import { z } from "zod";

export const refineRequestSchema = z.object({
  prd_id: z.string().uuid("prd_id invalide"),
  block_id: z.string().uuid("block_id invalide"),
  instruction: z
    .string()
    .trim()
    .min(1, "L'instruction ne peut pas etre vide")
    .max(1000, "L'instruction ne doit pas depasser 1000 caracteres"),
});

export type RefineRequest = z.infer<typeof refineRequestSchema>;
```

**Example request body:**

```json
{
  "prd_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "block_id": "f9e8d7c6-b5a4-3210-fedc-ba0987654321",
  "instruction": "ajoute le contexte B2C et les equipes de 10-50 personnes"
}
```

---

### Response

**Success (200):** Streaming response. Content-Type depends on implementation:
- If using Vercel AI SDK `createUIMessageStreamResponse()`: `text/event-stream`
- If using raw streaming: `text/plain; charset=utf-8` with `Transfer-Encoding: chunked`

The stream delivers the new block content progressively (token by token). The client accumulates the chunks and updates the UI.

**Error responses:**

| Status | Condition | Body |
|--------|-----------|------|
| 400 | Zod validation failure | `{ "error": "prd_id invalide" }` or `{ "error": "L'instruction ne peut pas etre vide" }` |
| 401 | No valid auth session or anonymous cookie | `{ "error": "Non autorise" }` |
| 404 | Block or PRD not found, or not owned by caller | `{ "error": "Bloc introuvable" }` |
| 429 | Rate limit exceeded (> 10 refines/min) | `{ "error": "Trop de raffinements. Attendez une minute." }` |
| 500 | AI provider error or unexpected failure | `{ "error": "Erreur lors du raffinement. Veuillez reessayer." }` |

---

### Route handler implementation

```tsx
// src/app/api/refine/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { refineRequestSchema } from "@/lib/schemas/refine";
import { streamText } from "ai";
import { buildRefinePrompt } from "@/lib/ai/prompts/refine";
import { getOpenRouterModel } from "@/lib/ai/model";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  // 1. Parse and validate body
  const body = await request.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Corps de requete invalide" }, { status: 400 });
  }

  const parsed = refineRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const { prd_id, block_id, instruction } = parsed.data;

  // 2. Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const cookieStore = await cookies();
  const anonId = cookieStore.get("enhanced_anon_id")?.value;

  if (!user && !anonId) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  // 3. Rate limiting
  const rateLimitKey = user?.id || anonId || "unknown";
  const { allowed } = await checkRateLimit(rateLimitKey, {
    maxRequests: 10,
    windowMs: 60_000,
  });

  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de raffinements. Attendez une minute." },
      { status: 429 }
    );
  }

  // 4. Load the target block
  const { data: block, error: blockError } = await supabase
    .from("prd_blocks")
    .select("id, block_type, content, sort_order, evidence_tags, prd_id")
    .eq("id", block_id)
    .eq("prd_id", prd_id)
    .single();

  if (blockError || !block) {
    return NextResponse.json({ error: "Bloc introuvable" }, { status: 404 });
  }

  // 5. Verify ownership via the PRD's session
  const { data: prd } = await supabase
    .from("prds")
    .select("id, session_id, sessions!inner(user_id, anonymous_id)")
    .eq("id", prd_id)
    .single();

  if (!prd) {
    return NextResponse.json({ error: "Bloc introuvable" }, { status: 404 });
  }

  const session = (prd as any).sessions;
  const isOwner =
    (user && session.user_id === user.id) ||
    (anonId && session.anonymous_id === anonId);

  if (!isOwner) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  // 6. Load full PRD context (all blocks for this PRD)
  const { data: allBlocks } = await supabase
    .from("prd_blocks")
    .select("block_type, content, sort_order")
    .eq("prd_id", prd_id)
    .order("sort_order", { ascending: true });

  // 7. Build prompt and stream response
  const { systemPrompt, userMessage } = buildRefinePrompt({
    targetBlock: block,
    allBlocks: allBlocks || [],
    instruction,
  });

  const result = streamText({
    model: getOpenRouterModel(),
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
    maxTokens: 8192,
    temperature: 0.7,
    onFinish: async ({ text }) => {
      // 8. Validate content length (max 10,000 chars per block)
      if (text.length > 10000) {
        // Truncation should not happen at normal maxTokens, but guard against it
        console.warn(`Refinement output exceeded 10,000 chars (${text.length}), truncating`)
      }
      const safeText = text.slice(0, 10000)

      // 9. Persist the new content
      await supabase
        .from("prd_blocks")
        .update({
          content: safeText,
          updated_at: new Date().toISOString(),
        })
        .eq("id", block_id);

      // 10. Create version snapshot
      await supabase.from("prd_versions").insert({
        prd_id,
        block_id,
        version_number: 1, // Increment logic handled by DB trigger or app code
        content_snapshot: safeText,
        trigger: "refinement",
      });
    },
  });

  return result.toTextStreamResponse();
}
```

---

### Rate limiting: `src/lib/rate-limit.ts`

Simple in-memory rate limiter using a Map. Suitable for V1 single-instance deployment. For multi-instance, replace with Redis.

```tsx
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export async function checkRateLimit(
  key: string,
  options: RateLimitOptions
): Promise<{ allowed: boolean; remaining: number }> {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + options.windowMs });
    return { allowed: true, remaining: options.maxRequests - 1 };
  }

  if (entry.count >= options.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count++;
  return { allowed: true, remaining: options.maxRequests - entry.count };
}
```

---

### Data flow summary

```
Client                          Server (/api/refine)                  Database
  |                                     |                                |
  |-- POST { prd_id, block_id, instr }->|                                |
  |                                     |-- Validate (Zod) ------------>|
  |                                     |-- Auth check ----------------->|
  |                                     |-- Rate limit check             |
  |                                     |-- SELECT prd_blocks (target) ->|
  |                                     |-- SELECT prd_blocks (all) ---->|
  |                                     |-- streamText() (OpenRouter) -->|
  |<---- stream chunk 1 ---------------|<---- AI token 1 ---------------|
  |<---- stream chunk 2 ---------------|<---- AI token 2 ---------------|
  |<---- stream chunk N ---------------|<---- AI token N ---------------|
  |<---- stream end --------------------|                                |
  |                                     |-- UPDATE prd_blocks ---------->|
  |                                     |-- INSERT prd_versions -------->|
  |                                     |                                |
```

---

### Version numbering

The `version_number` field in `prd_versions` should auto-increment per PRD. Two implementation options:

1. **App-level:** Query the max `version_number` for the PRD before inserting. Simple but has a tiny race window.
2. **DB trigger:** A Postgres trigger on `prd_versions` that auto-increments per `prd_id`. Preferred for correctness.

For V1, option 1 (app-level) is acceptable given the low concurrency. The race window is negligible for single-user PRDs.
