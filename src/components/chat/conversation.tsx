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

  const persistedIds = useRef(new Set(initialMessages.map((m) => m.id)));

  const chat = useChat<AppUIMessage>({
    transport,
    messages: initialMessages,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall: async ({ toolCall }) => {
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

  const handleAskUserSubmit = useCallback(
    (toolCallId: string, output: AskUserOutput) => {
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
      chat.clearError();
      chat.sendMessage({ text });
    },
    [chat],
  );

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
      <ChatInput
        onSubmit={handleSubmit}
        disabled={isReadOnly}
        isStreaming={isStreaming}
        placeholder={
          isReadOnly ? "Étape passée — relecture seule." : "Écris ta réponse…"
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
