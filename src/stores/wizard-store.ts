import { create } from "zustand";
import {
  db,
  type EvidenceTag,
  type PrdBlockRow,
  type Recommendation,
} from "@/lib/db/dexie";
import type { ConfidenceInput } from "@/lib/ai/tools";
import {
  BLOCK_SORT_ORDER,
  BLOCK_TYPES,
  type BlockType,
} from "@/lib/prd/constants";
import type { SessionStatus } from "@/lib/types/session";

export type PanelName = "conversation" | "prd";

// The store mirrors PRD blocks for rendering — id/sessionId are Dexie concerns
// the UI never reads, so we omit them. db.prdBlocks remains the source of truth.
export type PrdBlockMirror = Omit<PrdBlockRow, "id" | "sessionId">;

export type BlocksMap = Record<BlockType, PrdBlockMirror | null>;

function emptyBlocksMap(): BlocksMap {
  return Object.fromEntries(BLOCK_TYPES.map((t) => [t, null])) as BlocksMap;
}

interface WizardState {
  sessionId: string | null;
  rawIdea: string | null;
  status: SessionStatus;

  // `currentStep` = actual progress (1-4). `viewingStep` = which step's
  // conversation is shown; can differ when reviewing a completed step.
  currentStep: number;
  viewingStep: number;

  activePanel: PanelName;

  blocks: BlocksMap;
  confidenceScore: number | null;
  recommendation: Recommendation | null;
  lastUpdatedBlockType: BlockType | null;

  initialize: (data: {
    sessionId: string;
    currentStep: number;
    rawIdea: string;
    status: string;
  }) => void;
  advanceStep: () => Promise<void>;
  goToStep: (step: number) => void;
  setActivePanel: (panel: PanelName) => void;

  hydrateBlocks: (
    rows: PrdBlockRow[],
    score: number | null,
    recommendation: Recommendation | null,
  ) => void;
  updateBlock: (
    blockType: BlockType,
    content: string,
    evidenceTags: EvidenceTag[],
    step: number,
    confidence?: ConfidenceInput,
  ) => void;
  clearLastUpdated: () => void;
}

const MAX_STEP = 4;

function clampStatus(value: string): SessionStatus {
  return value === "completed" || value === "abandoned" ? value : "active";
}

export const useWizardStore = create<WizardState>((set, get) => ({
  sessionId: null,
  rawIdea: null,
  status: "active",
  currentStep: 1,
  viewingStep: 1,
  activePanel: "conversation",

  blocks: emptyBlocksMap(),
  confidenceScore: null,
  recommendation: null,
  lastUpdatedBlockType: null,

  initialize: (data) => {
    const safeStep = Math.min(Math.max(data.currentStep, 1), MAX_STEP);
    set({
      sessionId: data.sessionId,
      currentStep: safeStep,
      viewingStep: safeStep,
      rawIdea: data.rawIdea,
      status: clampStatus(data.status),
      blocks: emptyBlocksMap(),
      confidenceScore: null,
      recommendation: null,
      lastUpdatedBlockType: null,
    });
  },

  advanceStep: async () => {
    const { currentStep, sessionId } = get();
    if (currentStep >= MAX_STEP) return;
    const next = currentStep + 1;
    if (sessionId) {
      try {
        await db.sessions.update(sessionId, {
          currentStep: next,
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.error("[wizard-store] advanceStep persistence failed:", err);
      }
    }
    set({ currentStep: next, viewingStep: next });
  },

  goToStep: (step) => {
    const { currentStep } = get();
    if (step >= 1 && step <= currentStep) {
      set({ viewingStep: step });
    }
  },

  setActivePanel: (panel) => set({ activePanel: panel }),

  hydrateBlocks: (rows, score, recommendation) => {
    const blocks = emptyBlocksMap();
    for (const row of rows) {
      blocks[row.blockType] = {
        blockType: row.blockType,
        content: row.content,
        evidenceTags: row.evidenceTags,
        step: row.step,
        sortOrder: row.sortOrder,
        updatedAt: row.updatedAt,
      };
    }
    set({
      blocks,
      confidenceScore: score,
      recommendation,
      lastUpdatedBlockType: null,
    });
  },

  updateBlock: (blockType, content, evidenceTags, step, confidence) => {
    const state = get();
    const now = Date.now();
    const mirror: PrdBlockMirror = {
      blockType,
      content,
      evidenceTags,
      step,
      sortOrder: BLOCK_SORT_ORDER[blockType],
      updatedAt: now,
    };

    const patch: Partial<WizardState> = {
      blocks: { ...state.blocks, [blockType]: mirror },
      lastUpdatedBlockType: blockType,
    };

    // confidence is only meaningful for the confidence_score block. Tool
    // description says so but we gate here defensively to ignore stray values.
    const acceptConfidence = confidence && blockType === "confidence_score";
    if (acceptConfidence) {
      patch.confidenceScore = confidence.score;
      patch.recommendation = confidence.recommendation;
    }

    set(patch);

    if (acceptConfidence && state.sessionId) {
      db.sessions
        .update(state.sessionId, {
          confidenceScore: confidence.score,
          recommendation: confidence.recommendation,
          updatedAt: now,
        })
        .catch((err) => {
          console.error("[wizard-store] confidence persist failed:", err);
        });
    }
  },

  clearLastUpdated: () => set({ lastUpdatedBlockType: null }),
}));
