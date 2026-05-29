import { generateText, tool } from "ai";
import { conversationModel } from "@/lib/ai/openrouter";
import { buildRefineUserMessage, REFINE_SYSTEM_PROMPT } from "@/lib/ai/prompts/refine";
import {
  type RefineRequest,
  refineRequestSchema,
  refineResponseSchema,
} from "@/lib/schemas/refine";

export const maxDuration = 60;

// Structured output via a tool call — the same mechanism the chat route uses.
// We deliberately do NOT set `toolChoice` to force the tool: the configured
// model (Qwen) runs in thinking mode, which rejects `tool_choice: required`/
// `object` (Alibaba 400). `Output.object` failed for the same reason. The
// system prompt instructs the model to call this tool instead.
const submitRefinementTool = tool({
  description:
    "Submit the refined PRD section. You MUST call this tool exactly once with the rewritten content and its evidence tags. Do not answer in plain text.",
  inputSchema: refineResponseSchema,
});

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
      tools: { submit_refinement: submitRefinementTool },
    });

    const call = result.toolCalls.find((c) => c.toolName === "submit_refinement");
    if (!call) {
      console.error("/api/refine: model did not call submit_refinement", {
        finishReason: result.finishReason,
        text: result.text,
      });
      return new Response("Refinement failed", { status: 500 });
    }

    return Response.json(refineResponseSchema.parse(call.input));
  } catch (err) {
    console.error("/api/refine generation error:", err);
    return new Response("Refinement failed", { status: 500 });
  }
}
