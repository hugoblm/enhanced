# AI Context — Conversation Engine

> The conversation engine drives the wizard through its 4 steps (Cadrage → Données → Risques → PRD)
> via an AI-led chat. It is wired into the wizard shell's `ConversationPanel` slot and produces the
> PRD blocks that the PRD live builder (feature 5) will render.

> _Last verified: 2026-05-28 against branch `fix/step-prompts-tool-usage`._

---

## Architecture at a glance

```
ConversationPanel (wizard slot)
  └── Conversation (outer)
        ├── hydrates initialMessages from Dexie (where sessionId+step == viewingStep)
        └── ConversationInner (keyed by `${sessionId}-${viewingStep}`)
              ├── useChat with DefaultChatTransport → POST /api/chat
              ├── onToolCall: writes update_prd to Dexie, calls addToolOutput
              ├── onFinish: bulkPuts new messages to Dexie
              ├── auto-kickoff effect: sends raw idea (step 1) or "Continuons." (steps 2-4)
              ├── presentBlockTypes effect: fetches blocks when status==="ready"
              ├── canAdvance useMemo: derived from required types vs present types
              └── handleAdvance: calls useWizardStore.getState().advanceStep()
```

`/api/chat` is **completely stateless** (no DB, no cookie, no auth). It takes the full payload
from the client, assembles the system prompt, streams the LLM response, and returns SSE.

---

## Tools (`src/lib/ai/tools.ts`)

Both tools are **client-resolved** — neither defines an `execute` function. The server streams the
tool call as-is; the client handles it and calls `chat.addToolOutput(...)` to feed the result back
to the model. `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls` re-fires the
request once every pending tool call has a result.

| Tool | Input | Output | Resolution |
|------|-------|--------|------------|
| `ask_user` | `card_type` + question + options/scale_config/placeholder/confirmation_text | `AskUserOutput` (discriminated union by `card_type`) | UI card → `handleAskUserSubmit` |
| `update_prd` | `block_type` + `content` + `evidence_tags?` + `confidence?` (required when block_type is `confidence_score`) | `{ written: BlockType }` | `onToolCall` writes Dexie, calls `addToolOutput` |

Both have explicit `outputSchema`s — without them, the AI SDK v6 infers the `output` type as
`never` and `addToolOutput` becomes uncallable.

---

## Request/response contract — `POST /api/chat`

**Request body** (Zod-validated in `src/app/api/chat/route.ts`):

```ts
{
  sessionId: string (uuid),
  currentStep: 1..4,
  rawIdea: string (min 1),
  prdBlocks: Array<{
    blockType: BlockType,
    content: string,
    evidenceTagCounts?: { evidence: number, assumption: number, to_verify: number },
  }>,
  messages: UIMessage[] (max 100),
}
```

**System prompt** is assembled per-request by `buildSystemPrompt`
(`src/lib/ai/prompts/index.ts`): base prompt + step-specific prompt + raw idea + current PRD
block summary.

**Response**: SSE via `result.toUIMessageStreamResponse()`. `maxDuration = 60` (Vercel function
budget).

**Failure modes**: 400 on invalid body, 500 on `streamText` throw. Errors after the stream
starts surface via `useChat.error` on the client.

---

## Dexie schema relevant to this feature (`src/lib/db/dexie.ts`, v2)

| Table | Indexes | Used by |
|-------|---------|---------|
| `messages` | `id, sessionId, [sessionId+step]` | Hydration of `initialMessages`, `onFinish` persistence |
| `prdBlocks` | `id, sessionId, [sessionId+blockType]` | `update_prd` upsert via `[sessionId+blockType]` lookup, `canAdvance` check |
| `sessions` (from feature 3) | `id, updatedAt` | `advanceStep` writes `currentStep`/`updatedAt` |

---

## Step advancement (`src/stores/wizard-store.ts` + `Conversation`)

`STEP_REQUIREMENTS` (`src/lib/ai/tools.ts`) lists the block types each step must produce before
the user can move on:

| Step | Required block types |
|------|----------------------|
| 1 | `first_use_case`, `problem_context` |
| 2 | `data_signals` |
| 3 | `risk_value`, `risk_usability`, `risk_feasibility`, `risk_viability`, `confidence_score` |
| 4 | `success_criteria`, `kill_criteria`, `next_steps`, `executive_summary` |

`canAdvance` is `true` when every required block for `currentStep` exists in Dexie for the session.
The "Continuer" banner appears, `handleAdvance` calls `useWizardStore.getState().advanceStep()`,
which:

1. Bails if already at step 4.
2. Persists `db.sessions.update(sessionId, { currentStep: next, updatedAt })` (best-effort —
   logs and continues on failure).
3. Sets `currentStep` and `viewingStep` to `next`.

The store change re-renders `Conversation`, the inner remounts via `key="${sessionId}-${viewingStep}"`,
hydration runs again (empty for the new step), and the auto-kickoff effect sends `"Continuons."` to
open the next step.

---

## Cross-cutting invariants

> **Invariant — `/api/chat` is stateless DB**
> - **What:** The route handler reads nothing and writes nothing in any DB. All state needed for
>   the LLM call (session id, current step, raw idea, PRD blocks, messages) travels in the request
>   body. Persistence is fully client-side in Dexie.
> - **Where:** `src/app/api/chat/route.ts`.
> - **Breaks if:** server-side DB reads/writes are added → the demo's "no auth, no Supabase"
>   contract is broken and the trust model (server trusts client) becomes incoherent.

> **Invariant — Both tools are client-resolved**
> - **What:** Neither `ask_user` nor `update_prd` has an `execute` function. The client must call
>   `chat.addToolOutput` for every tool call (via `handleAskUserSubmit` for cards, via
>   `onToolCall` for update_prd). `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls`
>   is required for the loop to continue.
> - **Where:** `src/lib/ai/tools.ts`, `src/components/chat/conversation.tsx`.
> - **Breaks if:** an `execute` is added → the SDK starts auto-resolving the tool server-side and
>   the client side resolution path becomes unreachable, breaking the Dexie write path for
>   `update_prd` and the card UX for `ask_user`.

> **Invariant — Tool output types require explicit outputSchema**
> - **What:** AI SDK v6 infers `output: never` on a tool without `outputSchema`, which makes
>   `addToolOutput({ tool, ..., output })` a type error. Both tools must keep their
>   `outputSchema`.
> - **Where:** `src/lib/ai/tools.ts`.
> - **Breaks if:** an `outputSchema` is removed → `tsc` fails on every `addToolOutput` call.

> **Invariant — Messages and blocks live in Dexie, keyed by sessionId**
> - **What:** All conversation persistence is in the browser. The server never writes to Dexie
>   (it can't) and the route handler never reads from it. A session opened in another browser
>   sees an empty Dexie and renders the "session introuvable" state from `wizard-client`.
> - **Where:** `src/lib/db/dexie.ts`, `src/components/chat/conversation.tsx`.
> - **Breaks if:** session sharing across devices is needed → requires Supabase re-introduction.

> **Invariant — ConversationInner remount on `${sessionId}-${viewingStep}` is the only reset path**
> - **What:** `useChat` state (messages, status, ref to addToolOutput) is reset by remounting the
>   inner component. Any code that wants a fresh conversation (advance step, switch session) must
>   change `viewingStep` (via `advanceStep` or `goToStep`); there is no manual `useChat` reset.
> - **Where:** `src/components/chat/conversation.tsx`.
> - **Breaks if:** the key is removed or `viewingStep` stops mirroring step transitions → step
>   transitions reuse the previous step's `useChat` state and the auto-kickoff guard
>   (`hasKickedOff`) prevents the new step from opening.

> **Invariant — `addToolOutputRef` covers TDZ for `onToolCall`**
> - **What:** `onToolCall` is captured at `useChat` init, before the `chat` object exists, so it
>   cannot reference `chat.addToolOutput` directly. The ref (`addToolOutputRef`) is updated in a
>   post-render effect and read inside `onToolCall`. `handleAskUserSubmit` does not need the ref
>   because it is defined after `chat`.
> - **Where:** `src/components/chat/conversation.tsx`.
> - **Breaks if:** `chat.addToolOutput` is called directly from `onToolCall` → temporal dead zone
>   reference at runtime.

> **Invariant — Em-dash is forbidden in every LLM output**
> - **What:** The BASE_PROMPT General rules forbid the em-dash character (`—`, U+2014) in any LLM
>   output: text replies, card questions, card option labels, and PRD block content. The LLM is
>   instructed to use a regular hyphen, comma, colon, semicolon, period, or parentheses instead.
>   The prompts and tool descriptions themselves are also free of em-dashes so the LLM does not
>   mimic the style it sees. Exactly one em-dash remains in `system.ts` inside the rule itself,
>   used as the literal example of the forbidden character.
> - **Where:** `src/lib/ai/prompts/system.ts` (General rules), all `src/lib/ai/prompts/step-*.ts`,
>   `src/lib/ai/tools.ts` tool descriptions, `src/components/cards/card-renderer.tsx`
>   (`OTHER_OPTION_LABEL = "Autre (préciser)"`).
> - **Breaks if:** new em-dashes leak into prompts or tool descriptions → the LLM starts producing
>   them too, breaking the visual consistency rule.

---

## System prompt behavior (LLM contract)

The BASE_PROMPT + step prompts now drive two behaviors that are NOT enforced by code but are
critical to the wizard UX:

- **Incremental PRD writes.** Each step prompt has an `### Incremental writing (CRITICAL)` section
  telling the LLM to call `update_prd` from the first substantive answer and refine the block
  across multiple calls. The PRD panel must visibly fill up throughout each step; empty blocks
  during an active step indicate the LLM is ignoring this rule. Step 1 specifically gates the
  reformulation confirmation card as the LAST `update_prd` call per block, not the first.
- **PREFER-card-for-bounded-answers.** The BASE_PROMPT `ask_user` rules list bounded-answer
  patterns (frequency, severity, persona, channel, yes/no, metric type, validation stage, role,
  budget bracket, team size) and instruct the LLM to PREFER a card over free text in those cases.
  Step prompts encode the specific card type per question (e.g. step-2 data sources →
  `multi_choice`, step-3 risk confidence → `scale`, step-4 metric categories → `multi_choice`).

Code does not validate either behavior. They are observable in `db.messages` (`toolCalls` count
per session) and in the PRD panel filling pattern.

---

## Known V1 demo trade-offs (documented, not bugs)

- **Trust boundary**: `/api/chat` trusts the client payload (no `sessionId` signature, no rate
  limit). Acceptable for the demo; would require signing or a JWT for prod.
- **Stale `presentBlockTypes` during streaming**: `canAdvance` only refreshes when
  `chat.status === "ready"`, so the "Continuer" button can appear ~1s after the last block lands.
- **Dexie persistence is best-effort**: `advanceStep` updates the in-memory store even if
  `db.sessions.update` throws (logged). On refresh, Dexie wins.
- **`messages: parts` is stored twice**: when a row has tool parts, `content` and `toolCalls`
  both contain the text part. Hydration reads `toolCalls` and ignores `content` in that case.
- **No truncation of message history**: requests cap at 100 messages (Zod); long step 4 sessions
  could hit this. Acceptable for demo session lengths.
