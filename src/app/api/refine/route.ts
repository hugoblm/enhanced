import { generateText, Output } from "ai";
import { conversationModel } from "@/lib/ai/openrouter";
import { buildRefineUserMessage, REFINE_SYSTEM_PROMPT } from "@/lib/ai/prompts/refine";
import {
  type RefineRequest,
  refineRequestSchema,
  refineResponseSchema,
} from "@/lib/schemas/refine";

export const maxDuration = 60;

export async function POST(req: Request) {
  let body: RefineRequest;
  try {
    body = refineRequestSchema.parse(await req.json());
  } catch (err) {
    console.error("/api/refine invalid body:", err);
    return new Response("Invalid request body", { status: 400 });
  }

  try {
    const result = await generateText({
      model: conversationModel(),
      system: REFINE_SYSTEM_PROMPT,
      prompt: buildRefineUserMessage({
        blockType: body.blockType,
        currentContent: body.currentContent,
        instruction: body.instruction,
        allBlocks: body.allBlocks,
      }),
      output: Output.object({ schema: refineResponseSchema }),
    });

    return Response.json(result.output);
  } catch (err) {
    console.error("/api/refine generation error:", err);
    return new Response("Refinement failed", { status: 500 });
  }
}
