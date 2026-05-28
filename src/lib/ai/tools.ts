import { tool } from "ai";
import { z } from "zod";

const OptionSchema = z.object({
  id: z.string().describe("Unique option identifier"),
  label: z.string().describe("Display label for the option"),
  description: z.string().optional().describe("Optional helper text below the label"),
});

const ScaleConfigSchema = z.object({
  min: z.number().int().describe("Scale minimum (inclusive)"),
  max: z.number().int().describe("Scale maximum (inclusive)"),
  min_label: z.string().describe("Label for the minimum end of the scale"),
  max_label: z.string().describe("Label for the maximum end of the scale"),
});

export const CARD_TYPES = [
  "single_choice",
  "multi_choice",
  "scale",
  "confirmation",
  "free_text",
] as const;

export type CardType = (typeof CARD_TYPES)[number];

const AskUserOutputSchema = z.discriminatedUnion("card_type", [
  z.object({
    card_type: z.literal("single_choice"),
    selected: z.string(),
    custom_text: z.string().optional(),
  }),
  z.object({
    card_type: z.literal("multi_choice"),
    selected: z.array(z.string()),
    custom_text: z.string().optional(),
  }),
  z.object({
    card_type: z.literal("scale"),
    value: z.number(),
  }),
  z.object({
    card_type: z.literal("confirmation"),
    action: z.enum(["confirmed", "reformulate", "clarify"]),
    text: z.string().optional(),
  }),
  z.object({
    card_type: z.literal("free_text"),
    text: z.string(),
  }),
]);

export type AskUserOutput = z.infer<typeof AskUserOutputSchema>;

export const askUserTool = tool({
  description:
    'Ask the user a structured question via an interactive card. PREFER a card whenever the answer is bounded (frequency, severity, persona, channel, yes/no, metric type, validation stage, role, budget bracket) - structured input is more reliable than parsing free text and gives the PM faster feedback. ALWAYS explain WHY you are asking before calling this tool - send a text message with your reasoning first. Include an "Autre (préciser)" option in every choice card. After a few cards in a row, give the PM a free-text breather so they can elaborate in their own words.',
  inputSchema: z.object({
    card_type: z.enum(CARD_TYPES).describe("The type of interaction card to display"),
    question: z.string().describe("The question displayed above the card"),
    options: z
      .array(OptionSchema)
      .optional()
      .describe(
        'Options list. Required for single_choice and multi_choice. Include an "Autre (préciser)" option.',
      ),
    scale_config: ScaleConfigSchema.optional().describe(
      "Scale configuration. Required for scale type.",
    ),
    placeholder: z.string().optional().describe("Placeholder text for free_text type input"),
    confirmation_text: z
      .string()
      .optional()
      .describe("The text to confirm. Required for confirmation type."),
  }),
  outputSchema: AskUserOutputSchema,
});

const EvidenceTagSchema = z.object({
  text: z.string().describe("The claim or statement being tagged"),
  tag: z
    .enum(["evidence", "assumption", "to_verify"])
    .describe("The evidence classification"),
});

export const BLOCK_TYPES = [
  "first_use_case",
  "problem_context",
  "data_signals",
  "risk_value",
  "risk_usability",
  "risk_feasibility",
  "risk_viability",
  "confidence_score",
  "success_criteria",
  "kill_criteria",
  "next_steps",
  "executive_summary",
] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];

export const BLOCK_SORT_ORDER: Record<BlockType, number> = {
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
};

export const STEP_REQUIREMENTS: Record<number, readonly BlockType[]> = {
  1: ["first_use_case", "problem_context"],
  2: ["data_signals"],
  3: [
    "risk_value",
    "risk_usability",
    "risk_feasibility",
    "risk_viability",
    "confidence_score",
  ],
  4: ["success_criteria", "kill_criteria", "next_steps", "executive_summary"],
};

const UpdatePrdOutputSchema = z.object({
  written: z.enum(BLOCK_TYPES),
});

const ConfidenceSchema = z.object({
  score: z.number().int().min(0).max(100),
  recommendation: z.enum(["build", "test_first", "abandon"]),
});

export type ConfidenceInput = z.infer<typeof ConfidenceSchema>;

export const updatePrdTool = tool({
  description:
    "Update a section of the PRD. Call this EARLY and OFTEN: write a draft block from the FIRST substantive answer (even partial), then refine across multiple calls as the conversation progresses. The PRD panel must visibly fill up throughout each step - empty blocks during an active step is a bug. Each block_type corresponds to a specific section of the PRD. When block_type is 'confidence_score', you MUST also fill the 'confidence' argument so the PRD header can display the score badge.",
  inputSchema: z.object({
    block_type: z.enum(BLOCK_TYPES).describe("The PRD section to update"),
    content: z.string().describe("Markdown content for this PRD section"),
    evidence_tags: z
      .array(EvidenceTagSchema)
      .optional()
      .describe("Evidence classification tags for claims in this section"),
    confidence: ConfidenceSchema.optional().describe(
      "Structured score and recommendation read directly by the PRD header. MUST be provided when block_type is 'confidence_score'. Ignored for all other block types - do not send it.",
    ),
  }),
  outputSchema: UpdatePrdOutputSchema,
});

export const conversationTools = {
  ask_user: askUserTool,
  update_prd: updatePrdTool,
};
