"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  type InferUITools,
  lastAssistantMessageIsCompleteWithToolCalls,
  type UIMessage,
} from "ai";
import { useWizardStore } from "@/stores/wizard-store";
import {
  db,
  type EvidenceTag,
  type MessageRow,
  type PrdBlockRow,
} from "@/lib/db/dexie";
import {
  BLOCK_SORT_ORDER,
  type BlockType,
  conversationTools,
} from "@/lib/ai/tools";
import { MessageList } from "./message-list";
import { ChatInput } from "./chat-input";

type AppUIMessage = UIMessage<unknown, never, InferUITools<typeof conversationTools>>;

interface UpdatePrdInput {
  block_type: BlockType;
  content: string;
  evidence_tags?: EvidenceTag[];
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

  const addToolOutputRef = useRef<
    ((args: {
      tool: "update_prd";
      toolCallId: string;
      output?: { written: BlockType };
      state?: "output-error";
      errorText?: string;
    }) => void) | null
  >(null);

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
        await upsertPrdBlock(sessionId, currentStep, input);
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
    addToolOutputRef.current = chat.addToolOutput as unknown as (args: {
      tool: "update_prd";
      toolCallId: string;
      output?: { written: BlockType };
      state?: "output-error";
      errorText?: string;
    }) => void;
  }, [chat.addToolOutput]);

  const hasKickedOff = useRef(false);
  useEffect(() => {
    if (hasKickedOff.current) return;
    if (isReadOnly) return;
    if (currentStep !== 1) return;
    if (chat.messages.length > 0) return;
    if (chat.status !== "ready") return;
    hasKickedOff.current = true;
    chat.sendMessage({ text: rawIdea });
  }, [chat, chat.status, chat.messages.length, currentStep, rawIdea, isReadOnly]);

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
      <MessageList messages={chat.messages} isStreaming={isStreaming} />
      {chat.error && (
        <p className="border-t border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive">
          Une erreur est survenue. Réessaie ton dernier message.
        </p>
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

async function upsertPrdBlock(
  sessionId: string,
  step: number,
  input: UpdatePrdInput,
): Promise<void> {
  const existing = await db.prdBlocks
    .where("[sessionId+blockType]")
    .equals([sessionId, input.block_type])
    .first();

  const now = Date.now();
  if (existing) {
    await db.prdBlocks.update(existing.id, {
      content: input.content,
      evidenceTags: input.evidence_tags ?? [],
      step,
      updatedAt: now,
    });
  } else {
    await db.prdBlocks.put({
      id: crypto.randomUUID(),
      sessionId,
      blockType: input.block_type,
      content: input.content,
      evidenceTags: input.evidence_tags ?? [],
      step,
      sortOrder: BLOCK_SORT_ORDER[input.block_type],
      updatedAt: now,
    });
  }
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
