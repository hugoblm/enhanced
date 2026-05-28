import Dexie, { type Table } from "dexie";
import type { BlockType } from "../ai/tools";

export type SessionStatus = "active" | "completed" | "abandoned";

export type Recommendation = "build" | "test_first" | "abandon";

export interface SessionRow {
  id: string;
  rawIdea: string;
  currentStep: number; // 1..4
  status: SessionStatus;
  confidenceScore?: number; // 0..100, derived from confidence_score block
  recommendation?: Recommendation;
  createdAt: number;
  updatedAt: number;
}

export type MessageRole = "user" | "assistant" | "tool";

export interface MessageMetadata {
  cardType?: string;
  structuredResponse?: unknown;
  tokenUsage?: { promptTokens: number; completionTokens: number };
  model?: string;
  durationMs?: number;
}

export interface MessageRow {
  id: string;
  sessionId: string;
  step: number; // 1..4
  role: MessageRole;
  content: string | null;
  toolCalls?: unknown;
  toolResults?: unknown;
  metadata?: MessageMetadata;
  createdAt: number;
}

export type EvidenceTagKind = "evidence" | "assumption" | "to_verify";

export interface EvidenceTag {
  text: string;
  tag: EvidenceTagKind;
}

export interface PrdBlockRow {
  id: string;
  sessionId: string;
  blockType: BlockType;
  content: string;
  evidenceTags: EvidenceTag[];
  step: number; // 1..4
  sortOrder: number;
  updatedAt: number;
}

class EnhancedDB extends Dexie {
  sessions!: Table<SessionRow, string>;
  messages!: Table<MessageRow, string>;
  prdBlocks!: Table<PrdBlockRow, string>;

  constructor() {
    super("enhanced");
    this.version(1).stores({
      sessions: "id, updatedAt",
    });
    this.version(2).stores({
      messages: "id, sessionId, [sessionId+step]",
      prdBlocks: "id, sessionId, [sessionId+blockType]",
    });
    // confidenceScore + recommendation are non-indexed fields on SessionRow.
    // Dexie stores them as plain object properties — no schema bump required.
  }
}

export const db = new EnhancedDB();
