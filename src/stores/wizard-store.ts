import { create } from "zustand";
import { db } from "@/lib/db/dexie";
import type { SessionStatus } from "@/lib/types/session";

export type PanelName = "conversation" | "prd";

interface WizardState {
  sessionId: string | null;
  rawIdea: string | null;
  status: SessionStatus;

  // `currentStep` = actual progress (1-4). `viewingStep` = which step's
  // conversation is shown; can differ when reviewing a completed step.
  currentStep: number;
  viewingStep: number;

  activePanel: PanelName;

  initialize: (data: {
    sessionId: string;
    currentStep: number;
    rawIdea: string;
    status: string;
  }) => void;
  advanceStep: () => Promise<void>;
  goToStep: (step: number) => void;
  setActivePanel: (panel: PanelName) => void;
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

  initialize: (data) => {
    const safeStep = Math.min(Math.max(data.currentStep, 1), MAX_STEP);
    set({
      sessionId: data.sessionId,
      currentStep: safeStep,
      viewingStep: safeStep,
      rawIdea: data.rawIdea,
      status: clampStatus(data.status),
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
}));
