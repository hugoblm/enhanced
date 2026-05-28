# AI Integration Specification -- Block Refinement

**Status:** Draft -- **Author:** Hugo -- **Date:** 2026-05-27
**Parent spec:** [`technical-spec.md`](technical-spec.md)

---

## Overview

The refinement prompt is a focused, single-purpose prompt that regenerates one PRD block based on a natural language instruction. It receives the full PRD context (all blocks) to maintain coherence, but outputs only the targeted block's new content.

---

## Model configuration

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| Provider | OpenRouter via `@openrouter/ai-sdk-provider` | Same provider as main conversation engine |
| Model | Same model as main conversation (configurable via env var `OPENROUTER_MODEL`) | Consistency in output quality and style |
| Temperature | `0.7` | Lower than conversation (1.2) for more focused, predictable refinement output |
| Max tokens | `8192` | Sufficient for any single PRD block with room for detailed evidence tagging and structured content |
| Streaming | `true` | Progressive UI update |

### Model helper: `src/lib/ai/model.ts`

```tsx
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY!,
});

export function getOpenRouterModel() {
  const modelId = process.env.OPENROUTER_MODEL || "anthropic/claude-sonnet-4-20250514";
  return openrouter(modelId);
}
```

---

## Prompt architecture

The refinement prompt has two parts: a **system prompt** (static, defines the role and rules) and a **user message** (dynamic, includes the block content, instruction, and PRD context).

**Language handling:** The refinement prompt inherits the language from the target block's content. If the block is written in English, the refinement output should be in English. The prompt builder detects the language by checking the first 200 characters of the target block content. This avoids forcing French on blocks that were written during an English-language conversation.

### Prompt builder: `src/lib/ai/prompts/refine.ts`

```tsx
interface RefinePromptInput {
  targetBlock: {
    block_type: string;
    content: string;
    evidence_tags: Record<string, string>[] | null;
  };
  allBlocks: {
    block_type: string;
    content: string;
    sort_order: number;
  }[];
  instruction: string;
}

interface RefinePromptOutput {
  systemPrompt: string;
  userMessage: string;
}

export function buildRefinePrompt(input: RefinePromptInput): RefinePromptOutput {
  const systemPrompt = REFINE_SYSTEM_PROMPT;
  const userMessage = buildUserMessage(input);
  return { systemPrompt, userMessage };
}
```

---

## System prompt

```
const REFINE_SYSTEM_PROMPT = `Tu es un assistant specialise dans le raffinement de PRD (Product Requirements Documents).

## Ton role
Tu raffines UNE SEULE section d'un PRD en appliquant l'instruction de l'utilisateur. Tu as acces au PRD complet pour garder la coherence, mais tu ne regeneres que la section ciblee.

## Regles strictes

1. **Une seule section.** Tu ne produis que le contenu de la section ciblee. Pas d'introduction, pas de commentaire, pas de recap. Juste le nouveau contenu de la section.

2. **Evidence tags.** Chaque affirmation dans la section doit porter un tag :
   - [Evidence] — fait verifie, donne observable
   - [Assumption] — croyance non testee
   - [To verify] — necessite une validation avant de s'engager
   Si la section originale contient des tags, preserve-les ou mets-les a jour selon le nouveau contenu. Si l'instruction de l'utilisateur ajoute de nouvelles affirmations, tague-les de maniere appropriee (generalement [Assumption] ou [To verify]).

3. **Structure.** Respecte la structure de la section originale (titres, listes, paragraphes) sauf si l'instruction demande explicitement un changement structurel.

4. **Coherence PRD.** Le contenu raffine doit rester coherent avec les autres sections du PRD. Ne contredis pas les faits etablis dans d'autres sections.

5. **Langue.** Ecris dans la meme langue que la section originale.

6. **Concision.** Si l'instruction demande de raccourcir, raccourcis vraiment. Si elle demande d'ajouter, ajoute sans diluer le propos existant.

7. **Pas de meta-commentaire.** Ne dis pas "voici la version mise a jour" ou "j'ai modifie...". Produis directement le contenu.`;
```

---

## User message template

```tsx
function buildUserMessage(input: RefinePromptInput): string {
  const { targetBlock, allBlocks, instruction } = input;

  // Build PRD context from all blocks
  const prdContext = allBlocks
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((b) => `### ${formatBlockType(b.block_type)}\n${b.content}`)
    .join("\n\n---\n\n");

  return `## Contexte PRD complet

${prdContext}

---

## Section a raffiner

**Type de section :** ${formatBlockType(targetBlock.block_type)}

**Contenu actuel :**
${targetBlock.content}

---

## Instruction de raffinement

${instruction}

---

Produis uniquement le nouveau contenu de la section "${formatBlockType(targetBlock.block_type)}". Rien d'autre.`;
}
```

### Block type formatting

Block type labels are defined in the shared constants file `src/lib/prd/constants.ts` (see architecture.md section 3). All features MUST import from this file rather than defining their own mapping.

```tsx
import { BLOCK_TYPE_LABELS } from '@/lib/prd/constants'

// Canonical mapping (from src/lib/prd/constants.ts):
// first_use_case     → "Cas d'usage principal"
// problem_context    → "Contexte du probleme"
// data_signals       → "Signaux data"
// risk_value         → "Risque — Valeur"
// risk_usability     → "Risque — Utilisabilite"
// risk_feasibility   → "Risque — Faisabilite"
// risk_viability     → "Risque — Viabilite business"
// confidence_score   → "Score de confiance"
// success_criteria   → "Criteres de succes"
// kill_criteria      → "Kill criteria"
// next_steps         → "Prochaines etapes"
// executive_summary  → "Resume executif"

function formatBlockType(blockType: string): string {
  return BLOCK_TYPE_LABELS[blockType] || blockType;
}
```

---

## Token usage estimation

| Component | Estimated tokens |
|-----------|-----------------|
| System prompt | ~400 tokens |
| Full PRD context (12 blocks, average) | ~2000 tokens |
| Target block content | ~200-500 tokens |
| User instruction | ~20-50 tokens |
| **Total input** | **~2600-2950 tokens** |
| Output (max) | 8192 tokens |
| **Total per refinement** | **~10800-11150 tokens** |

At typical OpenRouter pricing (~$3/M input, ~$15/M output for Claude Sonnet):
- Input cost: ~$0.009
- Output cost: ~$0.123
- **Total per refinement: ~$0.13**

With a rate limit of 10 refines/min, maximum cost per minute per user: ~$1.30. This is within budget for V1 demo scale.

---

## Instruction handling examples

The prompt is designed to handle diverse instruction types naturally. No special parsing is needed -- the AI interprets the natural language instruction in context.

| Instruction | Expected behavior |
|-------------|-------------------|
| `"raccourcis"` | Produce a significantly shorter version, keeping key points |
| `"ajoute le contexte B2C"` | Add B2C-specific details to the existing content |
| `"plus formel"` | Shift tone to more formal language |
| `"ajoute des metriques de succes mesurables"` | Add quantitative metrics or KPIs |
| `"restructure en bullet points"` | Change from prose to bulleted list |
| `"traduis en anglais"` | Translate the section content to English |
| `"challenge cette hypothese"` | Add counter-arguments or tag as `[To verify]` |

---

## Error handling

| Error source | Handling |
|-------------|----------|
| OpenRouter API timeout | The `streamText()` call will throw; caught by the route handler's error handling. Returns 500 to client. |
| OpenRouter API rate limit | Same as timeout. The client receives a 500 and can retry. |
| Malformed AI output | No server-side validation of AI output content. The raw text is stored. If the AI produces garbage, the PM can refine again. |
| Empty AI response | If `text` in the `onFinish` callback is empty, skip the DB update to avoid blanking the block. |

---

## Future improvements (out of scope for V1)

- **Instruction classification:** Detect instruction type (shorten, expand, translate, restructure) and adjust temperature/max_tokens accordingly.
- **Streaming with tool calls:** Use `streamUI` to send structured updates (block content + metadata) instead of raw text.
- **Diff preview:** Show the PM a diff of the changes before committing.
- **Multi-block refinement:** Allow the PM to select multiple blocks and refine them together with a single instruction.
