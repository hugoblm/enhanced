# AI Integration — Conversation Engine

> OpenRouter provider setup, tool definitions (`ask_user` + `update_prd`), system prompts
> (base + 4 step-specific), step validation logic, and the client-side card rendering flow.

**Status:** `Draft` · **Author:** Hugo · **Date:** 2026-05-27

---

## OpenRouter setup

**File:** `src/lib/ai/openrouter.ts`

```typescript
import { createOpenRouter } from '@openrouter/ai-sdk-provider'

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
})

// Model is configured via env var — see src/lib/ai/model.ts
export function getOpenRouterModel() {
  const modelId = process.env.OPENROUTER_MODEL || 'anthropic/claude-sonnet-4-20250514'
  return openrouter(modelId)
}

// Re-export for backward compatibility
export const model = getOpenRouterModel()
```

**Environment variables:**
- `OPENROUTER_API_KEY` — stored in `.env.local` and Vercel env vars. Not `NEXT_PUBLIC_` prefixed (server-only).
- `OPENROUTER_MODEL` — optional override for the model ID. Defaults to `anthropic/claude-sonnet-4-20250514`.

### streamText parameters

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| `temperature` | `1.2` | Higher creativity for conversational exploration and varied question framing |
| `maxTokens` | `16384` | With maxSteps=5, each step can generate up to 16384 tokens. This accommodates long PRD blocks and multi-tool responses. |
| `maxSteps` | `5` | Allows the AI to make multiple tool calls per turn |

---

## Tool definitions

**File:** `src/lib/ai/tools.ts`

### ask_user — client-resolved tool (NO execute function)

The `ask_user` tool allows the AI to present structured interaction cards to the user. It has
**no `execute` function** because the response requires user interaction on the client. When
the AI calls this tool:

1. The tool call is streamed to the client
2. The client's `card-renderer.tsx` detects the tool call and renders the appropriate card
3. The user interacts with the card
4. The client sends the result back via `addToolResult()` (AI SDK method)
5. The AI receives the tool result and continues

```typescript
import { tool } from 'ai'
import { z } from 'zod'

const OptionSchema = z.object({
  id: z.string().describe('Unique option identifier'),
  label: z.string().describe('Display label for the option'),
  description: z.string().optional().describe('Optional helper text below the label'),
})

const ScaleConfigSchema = z.object({
  min: z.number().default(1).describe('Scale minimum (inclusive)'),
  max: z.number().default(5).describe('Scale maximum (inclusive)'),
  min_label: z.string().describe('Label for the minimum end of the scale'),
  max_label: z.string().describe('Label for the maximum end of the scale'),
})

export const askUserTool = tool({
  description: `Ask the user a structured question. ALWAYS explain WHY you are asking before calling this tool — send a text message with your reasoning first. Use the appropriate card_type based on the question nature. Include an "Autre — preciser" option in every choice card. Do not use more than 3 consecutive structured cards before returning to free text.`,
  parameters: z.object({
    card_type: z.enum([
      'single_choice',
      'multi_choice',
      'scale',
      'confirmation',
      'free_text',
    ]).describe('The type of interaction card to display'),

    question: z.string().describe('The question displayed above the card'),

    options: z.array(OptionSchema)
      .optional()
      .describe('Options list. Required for single_choice and multi_choice. Include an "Autre — preciser" option.'),

    scale_config: ScaleConfigSchema
      .optional()
      .describe('Scale configuration. Required for scale type.'),

    placeholder: z.string()
      .optional()
      .describe('Placeholder text for free_text type input'),

    confirmation_text: z.string()
      .optional()
      .describe('The text to confirm. Required for confirmation type.'),
  }),
  // NO execute function — this is a client-resolved tool
})
```

### update_prd — server-resolved tool (HAS execute function)

The `update_prd` tool writes PRD blocks to the database during the stream. It has an `execute`
function that runs server-side. The tool is created via a factory function that receives the
PRD ID and Supabase client.

```typescript
import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'

const BLOCK_TYPES = [
  'first_use_case',
  'problem_context',
  'data_signals',
  'risk_value',
  'risk_usability',
  'risk_feasibility',
  'risk_viability',
  'confidence_score',
  'success_criteria',
  'kill_criteria',
  'next_steps',
  'executive_summary',
] as const

export type BlockType = (typeof BLOCK_TYPES)[number]

const BLOCK_SORT_ORDER: Record<BlockType, number> = {
  first_use_case: 1,
  problem_context: 2,
  data_signals: 3,
  risk_value: 4,
  risk_usability: 5,
  risk_feasibility: 6,
  risk_viability: 7,
  confidence_score: 8,
  success_criteria: 9,
  kill_criteria: 10,
  next_steps: 11,
  executive_summary: 12,
}

const EvidenceTagSchema = z.object({
  text: z.string().describe('The claim or statement being tagged'),
  tag: z.enum(['evidence', 'assumption', 'to_verify']).describe('The evidence classification'),
})

export function createUpdatePrdTool(prdId: string, supabase: SupabaseClient) {
  return tool({
    description:
      'Update a section of the PRD. Call this whenever the conversation produces information that should appear in the PRD document. Each block_type corresponds to a specific section of the PRD.',
    parameters: z.object({
      block_type: z.enum(BLOCK_TYPES).describe('The PRD section to update'),

      content: z.string().describe('Markdown content for this PRD section'),

      evidence_tags: z.array(EvidenceTagSchema)
        .optional()
        .describe('Evidence classification tags for claims in this section'),
    }),

    execute: async ({ block_type, content, evidence_tags }) => {
      const sortOrder = BLOCK_SORT_ORDER[block_type]

      // Upsert the block
      const { error: blockError } = await supabase
        .from('prd_blocks')
        .upsert(
          {
            prd_id: prdId,
            block_type,
            content,
            sort_order: sortOrder,
            evidence_tags: evidence_tags ?? [],
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'prd_id,block_type' },
        )

      if (blockError) {
        throw new Error(`Failed to update PRD block: ${blockError.message}`)
      }

      // If confidence_score, also update the prds table
      // **Validation:** When `block_type === 'confidence_score'`, the execute function
      // extracts the numeric score from the content (regex for first integer), clamps it
      // to 0-100 (`Math.min(100, Math.max(0, score))`), and stores the clamped value in
      // `prds.confidence_score`. If no numeric value is found, `confidence_score` remains
      // unchanged.
      if (block_type === 'confidence_score') {
        const scoreMatch = content.match(/(\d+)/)?.[1]
        if (scoreMatch) {
          const score = Math.min(100, Math.max(0, parseInt(scoreMatch, 10)))
          await supabase
            .from('prds')
            .update({ confidence_score: score })
            .eq('id', prdId)
        }
      }

      // Create a version snapshot
      const { data: block } = await supabase
        .from('prd_blocks')
        .select('id')
        .eq('prd_id', prdId)
        .eq('block_type', block_type)
        .single()

      if (block) {
        await supabase.from('prd_versions').insert({
          prd_id: prdId,
          block_id: block.id,
          version_number: 1, // Incremented by a trigger or application logic
          content_snapshot: content,
          trigger: 'generation',
        })
      }

      return {
        updated: block_type,
        content_length: content.length,
        evidence_tag_count: evidence_tags?.length ?? 0,
      }
    },
  })
}
```

---

## System prompts

**Directory:** `src/lib/ai/prompts/`

### Prompt assembly

**File:** `src/lib/ai/prompts/system.ts`

The system prompt is assembled per-request by concatenating the base prompt with the
step-specific prompt and the current PRD state.

```typescript
import { getStepPrompt } from './steps'
import type { BlockType } from '../tools'

interface PrdBlock {
  block_type: BlockType
  content: string
  evidence_tags: { text: string; tag: string }[]
}

interface PromptContext {
  step: number
  prdBlocks: PrdBlock[]
  prdTitle: string
}

export function buildSystemPrompt(context: PromptContext): string {
  const parts: string[] = [
    BASE_PROMPT,
    getStepPrompt(context.step),
    buildPrdContextSection(context.prdBlocks, context.prdTitle),
  ]
  return parts.join('\n\n---\n\n')
}

function buildPrdContextSection(blocks: PrdBlock[], title: string): string {
  if (blocks.length === 0) {
    return `## Current PRD state\n\nTitle: "${title}"\nNo blocks written yet.`
  }

  const blockSummaries = blocks
    .map((b) => {
      const tagCounts = {
        evidence: b.evidence_tags.filter((t) => t.tag === 'evidence').length,
        assumption: b.evidence_tags.filter((t) => t.tag === 'assumption').length,
        to_verify: b.evidence_tags.filter((t) => t.tag === 'to_verify').length,
      }
      return `- **${b.block_type}** (${b.content.length} chars, ${tagCounts.evidence}E/${tagCounts.assumption}A/${tagCounts.to_verify}V)`
    })
    .join('\n')

  return `## Current PRD state\n\nTitle: "${title}"\nBlocks written:\n${blockSummaries}\n\nRefer to these blocks when continuing the conversation. Do not repeat content already captured — build on it.`
}
```

### Base system prompt

**File:** `src/lib/ai/prompts/base.ts`

```typescript
export const BASE_PROMPT = `You are Enhanced, a rigorous product validation assistant. Your job is to challenge the PM's assumptions, not agree with them. You use the FOCUSED framework to extract, structure, and validate product ideas.

## Your personality
- You are direct, honest, and constructively critical.
- You push back when claims are unsubstantiated. You do not accept "I think" or "I believe" without asking "what evidence do you have?"
- You are not hostile — you are the PM's intellectual sparring partner. Your pushback makes their PRD stronger.
- You speak in French by default (the UI is in French). Switch to English if the user writes in English.

## Evidence tagging rules
Every factual claim in the conversation must be tagged:
- **[Evidence]** — backed by data, research, direct observation, or verifiable facts. The source must be cited or citeable.
- **[Assumption]** — a belief, hypothesis, or hunch. Not yet validated. May or may not be true.
- **[To verify]** — a gap in knowledge. Something that needs to be checked, measured, or tested before the claim can be promoted to evidence.

When the user makes a claim, decide which tag applies. If you are unsure, default to [Assumption] and explain what would make it [Evidence].

## ask_user tool rules
1. **Always explain WHY before showing a card.** Send a text message explaining why this question matters BEFORE calling ask_user. Never show a card without context.
2. **Include "Autre — preciser" in every choice card.** Single choice and multi choice cards must always have an open-ended escape hatch.
3. **Maximum 3 consecutive cards.** After 3 ask_user calls without a free text exchange, you MUST return to conversational free text. Invite the user to elaborate in their own words.
4. **Choose the right card type.** Use single_choice when exactly one answer applies. Use multi_choice when the user might have multiple answers. Use scale for confidence ratings. Use confirmation for reformulations. Use free_text for open-ended exploration.

## update_prd tool rules
1. **Call update_prd on every substantive answer.** When the conversation produces information that belongs in the PRD, write it immediately. Do not wait until the end of a step.
2. **Include evidence tags.** Every claim in the PRD block content should have a corresponding entry in evidence_tags.
3. **Use markdown formatting.** Block content should use headers, lists, bold, and blockquotes for readability.
4. **Build incrementally.** Update blocks as you learn more. It is better to call update_prd 3 times for the same block (refining it) than to wait and write one perfect version.

## General rules
- Never invent evidence. If you do not have data, say so.
- Never skip to conclusions. Follow the step sequence.
- Keep responses concise. Aim for 2-4 sentences of explanation before a card, or 3-6 sentences of analysis between cards.
- When the user provides evidence, acknowledge it explicitly and update the relevant PRD block.`
```

### Step 1 — Problem Framing

**File:** `src/lib/ai/prompts/step-1.ts`

```typescript
export const STEP_1_PROMPT = `## Step 1: Problem Framing

### Your goal
Extract the real problem behind the user's idea, reformulate it as a First Use Case, and capture the problem context. Challenge solution-thinking and force the user to articulate the underlying pain.

### How to start
1. Acknowledge the user's raw idea (it was submitted on the landing page).
2. Read it carefully. Is it a problem or a solution? If it is a solution ("We need to build X"), challenge it: "That sounds like a solution. What problem are your users experiencing?"
3. Ask clarifying questions to understand WHO has the problem, WHAT the problem is, and what the current WORKAROUND is.

### Question sequence (adapt as needed)
- Who is the target user? (single_choice card with common personas + "Autre")
- What problem do they have? (free_text if not clear from the idea)
- What do they do today to work around it? (free_text)
- How often do they encounter this problem? (scale: Rarely → Daily)
- How painful is this problem? (scale: Minor inconvenience → Blocks their work)

### Reformulation
After gathering enough context, synthesize a First Use Case reformulation in this format:
"I am a [target user], and when I [situation/trigger], what matters most is [desired outcome], but it turns out [obstacle/current reality], and I have to [workaround/consequence]."

Present the reformulation via a confirmation card. The user can:
- Confirm → write first_use_case and problem_context blocks
- Reformulate → the user provides their version, you iterate
- Clarify → the user adds context, you refine

### Minimum output before step completion
- first_use_case block (the confirmed reformulation)
- problem_context block (who, what problem, current workaround, frequency, severity)

### Step completion signal
When both blocks are written and the user has confirmed the reformulation, signal that step 1 is complete. Say: "Step 1 complete. Here is what we established: [brief summary]. Now let's look at the evidence behind these claims."`
```

### Step 2 — Data Validation

**File:** `src/lib/ai/prompts/step-2.ts`

```typescript
export const STEP_2_PROMPT = `## Step 2: Data Validation

### Your goal
Identify what evidence the PM has, what is assumed, and what gaps need verification. Tag every claim from step 1 and any new claims. Guide the PM to distinguish between "I know" and "I believe."

### How to start
1. Summarize the claims from step 1 (reference the first_use_case and problem_context blocks).
2. For each major claim, ask: "What evidence do you have for this?"

### Question sequence
- What data sources do you currently use? (multi_choice: user interviews, product analytics, support tickets, sales feedback, surveys, competitor analysis + "Autre")
- For each claim from step 1, probe the evidence basis (free_text or scale for confidence)
- For claims tagged [Assumption]: "How could you verify this? What data would you need?"
- For claims tagged [To verify]: "What would it take to get this data? Who has it?"

### Evidence vs. assumption examples (use in your responses)
- "We ran 15 user interviews and 12 mentioned this pain" → [Evidence]
- "I think most users would prefer X" → [Assumption]
- "We haven't measured churn for this segment" → [To verify]
- "Our NPS dropped from 45 to 32 last quarter" → [Evidence]
- "Competitors probably have this feature" → [Assumption]

### V1 constraint
No MCP analytics connections in V1. All data is entered manually by the PM. Guide them to check their analytics tools (PostHog, Mixpanel, Amplitude) and report back, but do not query data directly.

### Minimum output before step completion
- data_signals block (structured summary of evidence, assumptions, and gaps)

### Step completion signal
When the data_signals block is written and the PM has reviewed the evidence landscape, signal that step 2 is complete. Say: "Step 2 complete. Here is the evidence picture: [summary of evidence vs. assumptions vs. to-verify]. Now let's stress-test this idea across 4 risk dimensions."`
```

### Step 3 — Risk Challenge

**File:** `src/lib/ai/prompts/step-3.ts`

```typescript
export const STEP_3_PROMPT = `## Step 3: Risk Challenge

### Your goal
Evaluate 4 fundamental risks (Value, Usability, Feasibility, Viability), produce scores, and formulate a recommendation: build / test first / abandon.

### How to start
1. Explain: "Time to stress-test this idea. I will evaluate 4 fundamental risks. For each, I will share my analysis and ask you to rate your confidence."
2. Work through each risk sequentially.

### Risk evaluation sequence

#### 1. Value Risk (risk_value)
"Is the problem real and worth solving? Will users actually want this?"
- Analyze the evidence from step 2
- Play devil's advocate: suggest why users might NOT want this
- Ask confidence via scale card: "How confident are you that users actually want this?" (1 = Not confident → 5 = Very confident)
- Write risk_value block with analysis, evidence tags, and the PM's rating

#### 2. Usability Risk (risk_usability)
"Can users figure out how to use this? Is the solution intuitive?"
- Analyze the proposed solution's UX complexity
- Challenge: "What is the learning curve? What could confuse users?"
- Ask confidence via scale card: "How confident are you users can figure out how to use this?" (1 = Not at all → 5 = Very confident)
- Write risk_usability block

#### 3. Feasibility Risk (risk_feasibility)
"Can the team actually build this well? Are there technical unknowns?"
- Probe technical complexity, dependencies, team skills
- Challenge: "What is the hardest technical problem? What could go wrong?"
- Ask confidence via scale card: "How confident are you the team can build this well?" (1 = Not at all → 5 = Very confident)
- Write risk_feasibility block

#### 4. Viability Risk (risk_viability)
"Does this make business sense? Can the business sustain this?"
- Probe business model impact, cost, timeline, competitive position
- Challenge: "Even if users love it and you can build it, does it make business sense?"
- Ask confidence via scale card: "How confident are you this is viable for the business?" (1 = Not at all → 5 = Very confident)
- Write risk_viability block

### Confidence score calculation
After all 4 risks are rated:
1. Compute the global confidence score (average of 4 ratings, mapped to 0-100 scale: rating * 20)
2. Formulate a recommendation:
   - Score >= 80 → "Build" — strong evidence, low risk
   - Score 50-79 → "Test first" — some assumptions need validation before committing
   - Score < 50 → "Abandon" — too many unknowns, evidence does not support building
3. Write the confidence_score block with the score, individual ratings, and recommendation

### Minimum output before step completion
- risk_value block
- risk_usability block
- risk_feasibility block
- risk_viability block
- confidence_score block

### Step completion signal
When all 5 blocks are written, present the summary: "Step 3 complete. Global confidence score: [X]/100. Recommendation: [build/test first/abandon]. [1-2 sentence justification]. Let's finalize your PRD."`
```

### Step 4 — Final PRD

**File:** `src/lib/ai/prompts/step-4.ts`

```typescript
export const STEP_4_PROMPT = `## Step 4: Final PRD

### Your goal
Complete the PRD with success criteria, kill criteria, next steps, and executive summary. Review existing blocks for consistency. Tighten language. Ensure all evidence tags are accurate.

### How to start
1. Explain: "Let's finalize your PRD. I will help you define what success looks like, when to kill the feature, and what to do next."
2. Review existing blocks briefly — note any inconsistencies.

### Finalization sequence

#### 1. Success Criteria (success_criteria)
- Ask: "How will you know this feature is successful after launch? What metrics would you track?" (free_text)
- Probe for specific, measurable criteria (not vague "users like it")
- Challenge: "Is this metric actually causally linked to the problem we identified?"
- Write success_criteria block with concrete metrics and targets

#### 2. Kill Criteria (kill_criteria)
- Ask: "Under what conditions should you abandon this feature after launch? What would tell you it failed?" (free_text)
- Probe for concrete kill signals (metric thresholds, timeframes)
- Challenge: "Would you actually kill this if this threshold is hit? Be honest."
- Write kill_criteria block

#### 3. Next Steps (next_steps)
- Ask: "What needs to happen before you start building? What should the team do first?" (free_text)
- Suggest verification steps for [To verify] items
- Structure as an ordered list of actions
- Write next_steps block

#### 4. Executive Summary (executive_summary)
- Synthesize ALL blocks into a concise executive summary
- Include: the problem, who has it, the proposed solution, evidence strength, risk assessment, recommendation, key next steps
- This summary must be readable standalone — a stakeholder who reads nothing else should understand the situation
- Write executive_summary block

### Final review
- Review all 12 blocks for internal consistency
- Check that evidence tags are accurate across blocks
- Tighten language (remove hedging where evidence is strong, add hedging where it is weak)
- Present the final PRD summary with confidence score and recommendation

### Minimum output before step completion
- success_criteria block
- kill_criteria block
- next_steps block
- executive_summary block

### Step completion signal
When all 4 blocks are written and reviewed: "Your PRD is complete. Here is a summary of what we built together: [executive summary excerpt]. Confidence score: [X]/100. Recommendation: [build/test first/abandon]. You can now export it as PDF or share it via a public link."`
```

### Step prompt dispatcher

**File:** `src/lib/ai/prompts/steps.ts`

```typescript
import { STEP_1_PROMPT } from './step-1'
import { STEP_2_PROMPT } from './step-2'
import { STEP_3_PROMPT } from './step-3'
import { STEP_4_PROMPT } from './step-4'

const STEP_PROMPTS: Record<number, string> = {
  1: STEP_1_PROMPT,
  2: STEP_2_PROMPT,
  3: STEP_3_PROMPT,
  4: STEP_4_PROMPT,
}

export function getStepPrompt(step: number): string {
  const prompt = STEP_PROMPTS[step]
  if (!prompt) {
    throw new Error(`No prompt defined for step ${step}`)
  }
  return prompt
}
```

---

## Step validation

**File:** `src/lib/ai/step-validation.ts`

Server function that checks minimum PRD blocks exist before allowing step advancement.

```typescript
import type { BlockType } from './tools'

interface Block {
  block_type: string
  content: string | null
}

const STEP_REQUIREMENTS: Record<number, BlockType[]> = {
  1: ['first_use_case', 'problem_context'],
  2: ['data_signals'],
  3: ['risk_value', 'risk_usability', 'risk_feasibility', 'risk_viability', 'confidence_score'],
  4: ['success_criteria', 'kill_criteria', 'next_steps', 'executive_summary'],
}

export function validateStepCompletion(
  currentStep: number,
  blocks: Block[],
): { valid: boolean; missingBlocks: string[] } {
  const requirements = STEP_REQUIREMENTS[currentStep]
  if (!requirements) {
    return { valid: false, missingBlocks: ['unknown_step'] }
  }

  const filledBlockTypes = new Set(
    blocks
      .filter((b) => b.content && b.content.trim().length > 0)
      .map((b) => b.block_type),
  )

  const missingBlocks = requirements.filter((req) => !filledBlockTypes.has(req))

  return {
    valid: missingBlocks.length === 0,
    missingBlocks,
  }
}
```

---

## Client-side card rendering

### Card renderer dispatcher

**File:** `src/components/cards/card-renderer.tsx`

```typescript
'use client'

import type { ToolInvocation } from 'ai'
import { SingleChoiceCard } from './single-choice-card'
import { MultiChoiceCard } from './multi-choice-card'
import { ScaleCard } from './scale-card'
import { ConfirmationCard } from './confirmation-card'
import { FreeTextCard } from './free-text-card'

interface CardRendererProps {
  toolInvocation: ToolInvocation
  addToolResult: (result: { toolCallId: string; result: unknown }) => void
}

export function CardRenderer({ toolInvocation, addToolResult }: CardRendererProps) {
  // Only render ask_user tool calls
  if (toolInvocation.toolName !== 'ask_user') return null

  // If the tool call already has a result, render in submitted (read-only) state
  const isSubmitted = 'result' in toolInvocation

  const args = toolInvocation.args as {
    card_type: string
    question: string
    options?: { id: string; label: string; description?: string }[]
    scale_config?: { min: number; max: number; min_label: string; max_label: string }
    placeholder?: string
    confirmation_text?: string
  }

  const handleSubmit = (result: unknown) => {
    addToolResult({
      toolCallId: toolInvocation.toolCallId,
      result,
    })
  }

  const commonProps = {
    question: args.question,
    isSubmitted,
    onSubmit: handleSubmit,
  }

  switch (args.card_type) {
    case 'single_choice':
      return (
        <SingleChoiceCard
          {...commonProps}
          options={args.options ?? []}
        />
      )
    case 'multi_choice':
      return (
        <MultiChoiceCard
          {...commonProps}
          options={args.options ?? []}
        />
      )
    case 'scale':
      return (
        <ScaleCard
          {...commonProps}
          config={args.scale_config!}
        />
      )
    case 'confirmation':
      return (
        <ConfirmationCard
          {...commonProps}
          confirmationText={args.confirmation_text ?? ''}
        />
      )
    case 'free_text':
      return (
        <FreeTextCard
          {...commonProps}
          placeholder={args.placeholder}
        />
      )
    default:
      return null
  }
}
```

**Client-side safety net:** The `CardRenderer` component auto-injects an "Autre -- preciser" option into `single_choice` and `multi_choice` cards if the AI omits it. This ensures the user always has an escape hatch, regardless of prompt compliance. The system prompt still instructs the AI to include this option, but the client enforces it.

### Card component contracts

Each card component follows the same interface pattern:

```typescript
interface BaseCardProps {
  question: string
  isSubmitted: boolean
  onSubmit: (result: unknown) => void
}
```

**SingleChoiceCard:**
- Renders radio-style options + "Autre — preciser" with conditional textarea
- Submits: `{ card_type: 'single_choice', selected: string, custom_text?: string }`
- Validation: one option must be selected; if "Other", custom text required

**MultiChoiceCard:**
- Renders checkbox-style options + "Autre — preciser" with conditional textarea
- Submits: `{ card_type: 'multi_choice', selected: string[], custom_text?: string }`
- Validation: at least one option selected; if "Other" checked, custom text required

**ScaleCard:**
- Renders numbered points with min/max labels
- Submits: `{ card_type: 'scale', value: number }`
- Validation: one point must be selected

**ConfirmationCard:**
- Renders the confirmation text + 3 buttons: "Oui, c'est correct" / "Reformuler" / "Preciser"
- "Reformuler" and "Preciser" reveal a textarea for the user's input
- Submits: `{ card_type: 'confirmation', action: 'confirmed' | 'reformulate' | 'clarify', text?: string }`
- Validation: if "reformulate" or "clarify", text required

**FreeTextCard:**
- Renders a textarea with optional placeholder
- Submits: `{ card_type: 'free_text', text: string }`
- Validation: text must not be empty

### Submitted state

All cards share a read-only submitted state:
- The card is no longer interactive (inputs disabled, buttons hidden)
- The user's response is displayed as a summary (e.g., "You selected: B2B SaaS")
- The card has reduced visual prominence (muted styling)
- This state is rendered when `toolInvocation` already has a `result`

---

## useChat integration

**Client-side hook usage in the wizard conversation panel:**

```typescript
'use client'

import { useChat } from '@ai-sdk/react'
import type { UIMessage } from 'ai'

interface ConversationPanelProps {
  sessionId: string
  initialMessages: UIMessage[]
}

export function ConversationPanel({ sessionId, initialMessages }: ConversationPanelProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    addToolResult,
    isLoading,
    error,
    reload,
  } = useChat({
    api: '/api/chat',
    body: { sessionId },
    initialMessages,
    maxSteps: 5,
    onError: (error) => {
      // Display error inline in conversation
      console.error('Chat error:', error)
    },
  })

  // Determine if a card is awaiting response (blocks free text input)
  const pendingToolCall = messages
    .flatMap((m) => m.toolInvocations ?? [])
    .find(
      (tc) => tc.toolName === 'ask_user' && !('result' in tc),
    )

  return (
    // Render message list + cards + input
    // See message-list.tsx and chat-input.tsx
  )
}
```

**Key points:**
- `body: { sessionId }` ensures the session ID is sent with every request
- `initialMessages` are loaded by the Server Component from the DB and passed as props
- `maxSteps: 5` allows the AI to make multiple tool calls per turn on the client side
- `addToolResult` is passed to `CardRenderer` for client-resolved tool responses
- `pendingToolCall` blocks the free text input when a card is awaiting a response
