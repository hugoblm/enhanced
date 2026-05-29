"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import {
  type ChatAddToolOutputFunction,
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from "ai";
import { useWizardStore } from "@/stores/wizard-store";
import {
  db,
  type EvidenceTag,
  type MessageRow,
  type PrdBlockRow,
} from "@/lib/db/dexie";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  type AskUserOutput,
  type BlockType,
  type ConfidenceInput,
  STEP_REQUIREMENTS,
} from "@/lib/ai/tools";
import { upsertPrdBlock } from "@/lib/db/prd-blocks";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";
import type { AppUIMessage } from "./types";

const MAX_STEP = 4;

// Delay before acting on a detected dead-end. NOT a wait for the model (that is
// gated by chat.status); it only absorbs the async Dexie refresh of canAdvance
// when the turn settles, so a completing step is not mistaken for a dead-end.
const STUCK_DEBOUNCE_MS = 300;

// An ask_user card still awaiting the user (no output yet).
function hasPendingAskUser(m: AppUIMessage): boolean {
  return m.parts.some(
    (p) =>
      p.type === "tool-ask_user" &&
      p.state !== "output-available" &&
      p.state !== "output-error",
  );
}

interface UpdatePrdInput {
  block_type: BlockType;
  content: string;
  evidence_tags?: EvidenceTag[];
  confidence?: ConfidenceInput;
}

interface PrdBlockSummary {
  blockType: BlockType;
  content: string;
  evidenceTagCounts: {
    evidence: number;
    assumption: number;
    to_verify: number;
  };
}

export function Conversation() {
  const sessionId = useWizardStore((s) => s.sessionId);
  const rawIdea = useWizardStore((s) => s.rawIdea);
  const currentStep = useWizardStore((s) => s.currentStep);
  const viewingStep = useWizardStore((s) => s.viewingStep);

  const [initialMessages, setInitialMessages] = useState<AppUIMessage[] | null>(null);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      const rows = await db.messages
        .where("[sessionId+step]")
        .equals([sessionId, viewingStep])
        .sortBy("createdAt");
      if (cancelled) return;
      setInitialMessages(rows.map(rowToUIMessage));
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId, viewingStep]);

  if (!sessionId || !rawIdea || initialMessages === null) {
    return (
      <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
        Chargement…
      </div>
    );
  }

  const isReadOnly = viewingStep !== currentStep;

  return (
    <ConversationInner
      key={`${sessionId}-${viewingStep}`}
      sessionId={sessionId}
      currentStep={currentStep}
      rawIdea={rawIdea}
      initialMessages={initialMessages}
      isReadOnly={isReadOnly}
    />
  );
}

interface InnerProps {
  sessionId: string;
  currentStep: number;
  rawIdea: string;
  initialMessages: AppUIMessage[];
  isReadOnly: boolean;
}

function ConversationInner({
  sessionId,
  currentStep,
  rawIdea,
  initialMessages,
  isReadOnly,
}: InnerProps) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport<AppUIMessage>({
        api: "/api/chat",
        body: async () => {
          const blocks = await db.prdBlocks
            .where("sessionId")
            .equals(sessionId)
            .toArray();
          return {
            sessionId,
            currentStep,
            rawIdea,
            prdBlocks: blocks.map(toPrdBlockSummary),
          };
        },
      }),
    [sessionId, currentStep, rawIdea],
  );

  const addToolOutputRef = useRef<ChatAddToolOutputFunction<AppUIMessage> | null>(null);
  // Current canAdvance, read inside onToolCall (captured before canAdvance exists,
  // same TDZ pattern as addToolOutputRef). Kept in sync by the effect below.
  const canAdvanceRef = useRef(false);

  const persistedIds = useRef(new Set(initialMessages.map((m) => m.id)));

  const chat = useChat<AppUIMessage>({
    transport,
    messages: initialMessages,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: async ({ toolCall }) => {
      if (toolCall.toolName === "advance_step") {
        // Advancing remounts ConversationInner (new viewingStep key) and tears
        // down this chat, so on the advance path we deliberately do NOT
        // addToolOutput: the unresolved call is discarded with the chat and no
        // auto-resend fires (lastAssistantMessageIsCompleteWithToolCalls stays
        // false). Too early → resolve advanced:false so the model keeps going.
        if (canAdvanceRef.current) {
          await useWizardStore.getState().advanceStep();
        } else {
          addToolOutputRef.current?.({
            tool: "advance_step",
            toolCallId: toolCall.toolCallId,
            output: { advanced: false },
          });
        }
        return;
      }
      if (toolCall.toolName !== "update_prd") return;
      const input = toolCall.input as UpdatePrdInput;
      const submit = addToolOutputRef.current;
      if (!submit) return;
      try {
        await upsertPrdBlock({
          sessionId,
          blockType: input.block_type,
          content: input.content,
          evidenceTags: input.evidence_tags ?? [],
          step: currentStep,
        });
        useWizardStore.getState().updateBlock(
          input.block_type,
          input.content,
          input.evidence_tags ?? [],
          currentStep,
          input.confidence,
        );
        submit({
          tool: "update_prd",
          toolCallId: toolCall.toolCallId,
          output: { written: input.block_type },
        });
      } catch (err) {
        console.error("[conversation] update_prd failed:", err);
        submit({
          tool: "update_prd",
          toolCallId: toolCall.toolCallId,
          state: "output-error",
          errorText: (err as Error).message,
        });
      }
    },
    onFinish: async ({ messages }) => {
      const newRows: MessageRow[] = [];
      for (const m of messages) {
        if (persistedIds.current.has(m.id)) continue;
        const row = uiMessageToRow(m, sessionId, currentStep);
        if (row) newRows.push(row);
      }
      if (newRows.length > 0) {
        await db.messages.bulkPut(newRows);
        for (const r of newRows) persistedIds.current.add(r.id);
      }
    },
  });

  useEffect(() => {
    addToolOutputRef.current = chat.addToolOutput;
  }, [chat.addToolOutput]);

  // Dead-end recovery: at most one automatic, invisible nudge per user
  // interaction; the visible "Continuer" banner is the fallback beyond that.
  const autoNudgesRef = useRef(0);
  const [showContinue, setShowContinue] = useState(false);

  const sendNudge = useCallback(() => {
    setShowContinue(false);
    chat.sendMessage({
      text: "Continue. Call the ask_user tool now to ask the next question, or send the step-completion signal if all required blocks for this step are written. Do not answer with text alone.",
      metadata: { kind: "nudge" },
    });
  }, [chat]);

  // Held in a ref so the dead-end effect can depend only on `isStuck` (a boolean)
  // and never have its debounce timer reset by unrelated re-renders that change
  // the `sendNudge`/`chat` identity (e.g. during streaming of other state).
  const sendNudgeRef = useRef(sendNudge);
  useEffect(() => {
    sendNudgeRef.current = sendNudge;
  }, [sendNudge]);

  const handleAskUserSubmit = useCallback(
    (toolCallId: string, output: AskUserOutput) => {
      autoNudgesRef.current = 0;
      setShowContinue(false);
      chat.addToolOutput({
        tool: "ask_user",
        toolCallId,
        output,
      });
    },
    [chat],
  );

  const hasKickedOff = useRef(false);
  useEffect(() => {
    if (hasKickedOff.current) return;
    if (isReadOnly) return;
    if (chat.messages.length > 0) return;
    if (chat.status !== "ready") return;
    hasKickedOff.current = true;
    const kickoffText = currentStep === 1 ? rawIdea : "Continuons.";
    chat.sendMessage({ text: kickoffText });
  }, [chat, chat.status, chat.messages.length, currentStep, rawIdea, isReadOnly]);

  const [presentBlockTypes, setPresentBlockTypes] = useState<Set<BlockType>>(
    () => new Set(),
  );
  useEffect(() => {
    if (chat.status !== "ready") return;
    let cancelled = false;
    (async () => {
      const blocks = await db.prdBlocks
        .where("sessionId")
        .equals(sessionId)
        .toArray();
      if (cancelled) return;
      setPresentBlockTypes(new Set(blocks.map((b) => b.blockType)));
    })();
    return () => {
      cancelled = true;
    };
  }, [chat.status, sessionId]);

  const canAdvance = useMemo(() => {
    if (isReadOnly) return false;
    if (currentStep >= MAX_STEP) return false;
    const required = STEP_REQUIREMENTS[currentStep] ?? [];
    return required.every((t) => presentBlockTypes.has(t));
  }, [isReadOnly, currentStep, presentBlockTypes]);

  // Whether the current step's required blocks are all written — independent of
  // canAdvance, which is always false on the final step (nowhere to advance).
  // The dead-end detector uses this so a *completed* step 4 (legitimate final
  // turn without ask_user) is not mistaken for a dead-end and nudged.
  const stepRequirementsMet = useMemo(() => {
    const required = STEP_REQUIREMENTS[currentStep] ?? [];
    return required.every((t) => presentBlockTypes.has(t));
  }, [currentStep, presentBlockTypes]);

  useEffect(() => {
    canAdvanceRef.current = canAdvance;
  }, [canAdvance]);

  const [isAdvancing, setIsAdvancing] = useState(false);
  const handleAdvance = useCallback(async () => {
    if (isAdvancing) return;
    setIsAdvancing(true);
    try {
      await useWizardStore.getState().advanceStep();
    } finally {
      setIsAdvancing(false);
    }
  }, [isAdvancing]);

  const handleSubmit = useCallback(
    (text: string) => {
      autoNudgesRef.current = 0;
      setShowContinue(false);
      chat.clearError();
      chat.sendMessage({ text });
    },
    [chat],
  );

  // True dead-end: the SDK is idle (status ready, nothing streaming), the last
  // turn is the assistant's, no card awaits the user, no auto-resend is queued
  // (the sendAutomaticallyWhen predicate), and the step's required blocks are
  // not all written (so a completed step — incl. the terminal step 4 — is not
  // treated as a dead-end).
  const lastMsg = chat.messages.at(-1);
  // A card awaits an answer: the free-text bar must be disabled, otherwise a
  // typed message lands before the ask_user tool_result and the request becomes
  // an invalid tool_use-without-tool_result sequence (server 500). The user
  // answers via the card (free text included through its "Autre"/free_text path).
  const pendingCard = lastMsg?.role === "assistant" && hasPendingAskUser(lastMsg);
  const isStuck =
    chat.status === "ready" &&
    !isReadOnly &&
    lastMsg?.role === "assistant" &&
    !hasPendingAskUser(lastMsg) &&
    !lastAssistantMessageIsCompleteWithToolCalls({ messages: chat.messages }) &&
    !stepRequirementsMet;

  useEffect(() => {
    if (!isStuck) return;
    const timer = setTimeout(() => {
      if (autoNudgesRef.current < 1) {
        autoNudgesRef.current += 1;
        sendNudgeRef.current();
      } else {
        setShowContinue(true);
      }
    }, STUCK_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [isStuck]);

  const isStreaming = chat.status === "streaming" || chat.status === "submitted";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MessageList
        messages={chat.messages}
        isStreaming={isStreaming}
        onAskUserSubmit={handleAskUserSubmit}
      />
      {chat.error && (
        <p className="border-t border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          Une erreur est survenue. Réessaie ton dernier message.
        </p>
      )}
      {canAdvance && (
        <div className="border-t border-border bg-accent/30 px-4 py-3">
          <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              Cette étape est complète. Tu peux passer à la suivante.
            </p>
            <Button onClick={handleAdvance} size="sm" disabled={isAdvancing}>
              {isAdvancing ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Patiente…
                </>
              ) : (
                <>
                  Continuer <ArrowRight size={14} />
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      {isStuck && showContinue && (
        <div className="border-t border-border bg-accent/30 px-4 py-3">
          <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              L&apos;assistant n&apos;a pas posé de question. Relance-le ou écris
              directement ci-dessous.
            </p>
            <Button onClick={sendNudge} size="sm" variant="outline">
              Continuer <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      )}
      <ChatInput
        onSubmit={handleSubmit}
        disabled={isReadOnly || pendingCard}
        isStreaming={isStreaming}
        placeholder={
          isReadOnly
            ? "Étape passée — relecture seule."
            : pendingCard
              ? "Réponds à la question ci-dessus."
              : "Écris ta réponse…"
        }
      />
    </div>
  );
}

function rowToUIMessage(row: MessageRow): AppUIMessage {
  if (row.toolCalls && Array.isArray(row.toolCalls)) {
    return {
      id: row.id,
      role: row.role === "tool" ? "assistant" : row.role,
      parts: row.toolCalls as AppUIMessage["parts"],
    };
  }
  return {
    id: row.id,
    role: row.role === "tool" ? "assistant" : row.role,
    parts: row.content
      ? [{ type: "text", text: row.content } as AppUIMessage["parts"][number]]
      : [],
  };
}

function uiMessageToRow(
  message: AppUIMessage,
  sessionId: string,
  step: number,
): MessageRow | null {
  if (message.role === "system") return null;
  // Invisible recovery nudge — never persisted (would otherwise reload on hydration).
  if (message.metadata?.kind === "nudge") return null;

  const textParts = message.parts.filter(
    (p): p is { type: "text"; text: string } & AppUIMessage["parts"][number] =>
      p.type === "text",
  );
  const content =
    textParts.map((p) => p.text).join("\n") || null;
  const hasNonText = message.parts.some((p) => p.type !== "text");

  return {
    id: message.id,
    sessionId,
    step,
    role: message.role,
    content,
    toolCalls: hasNonText ? message.parts : undefined,
    createdAt: Date.now(),
  };
}

function toPrdBlockSummary(row: PrdBlockRow): PrdBlockSummary {
  const counts = { evidence: 0, assumption: 0, to_verify: 0 };
  for (const tag of row.evidenceTags) {
    counts[tag.tag] += 1;
  }
  return {
    blockType: row.blockType,
    content: row.content,
    evidenceTagCounts: counts,
  };
}
