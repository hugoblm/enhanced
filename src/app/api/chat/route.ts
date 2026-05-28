import { convertToModelMessages, streamText, type UIMessage } from "ai";
import { z } from "zod";
import { conversationModel } from "@/lib/ai/openrouter";
import { buildSystemPrompt } from "@/lib/ai/prompts";
import { BLOCK_TYPES, conversationTools } from "@/lib/ai/tools";

export const maxDuration = 60;

const PrdBlockSummarySchema = z.object({
  blockType: z.enum(BLOCK_TYPES),
  content: z.string(),
  evidenceTagCounts: z
    .object({
      evidence: z.number().int().nonnegative(),
      assumption: z.number().int().nonnegative(),
      to_verify: z.number().int().nonnegative(),
    })
    .optional(),
});

const UIMessageShape = z.looseObject({
  id: z.string(),
  role: z.enum(["system", "user", "assistant"]),
  parts: z.array(z.unknown()),
  metadata: z.unknown().optional(),
});

const RequestBodySchema = z.object({
  sessionId: z.uuid(),
  currentStep: z.number().int().min(1).max(4),
  rawIdea: z.string().min(1),
  prdBlocks: z.array(PrdBlockSummarySchema),
  messages: z.array(UIMessageShape).max(100),
});

export async function POST(req: Request) {
  let body: z.infer<typeof RequestBodySchema>;
  try {
    body = RequestBodySchema.parse(await req.json());
  } catch (err) {
    console.error("/api/chat invalid body:", err);
    return new Response("Invalid request body", { status: 400 });
  }

  const system = buildSystemPrompt({
    step: body.currentStep,
    rawIdea: body.rawIdea,
    prdBlocks: body.prdBlocks,
  });

  try {
    const result = streamText({
      model: conversationModel(),
      system,
      messages: await convertToModelMessages(body.messages as UIMessage[]),
      tools: conversationTools,
    });

    return result.toUIMessageStreamResponse();
  } catch (err) {
    console.error("/api/chat streamText error:", err);
    return new Response("AI generation failed", { status: 500 });
  }
}
