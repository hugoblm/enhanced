import { beforeEach, describe, expect, it } from "vitest";
import { useWizardStore, type BlocksMap } from "@/stores/wizard-store";
import { BLOCK_TYPES } from "@/lib/prd/constants";
import type { PrdBlockRow } from "@/lib/db/dexie";

function emptyBlocks(): BlocksMap {
  return Object.fromEntries(BLOCK_TYPES.map((t) => [t, null])) as BlocksMap;
}

function resetStore() {
  useWizardStore.setState({
    sessionId: null,
    rawIdea: null,
    status: "active",
    currentStep: 1,
    viewingStep: 1,
    activePanel: "conversation",
    blocks: emptyBlocks(),
    confidenceScore: null,
    recommendation: null,
    lastUpdatedBlockType: null,
  });
}

describe("wizard-store", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("initialize", () => {
    it("sets session data and aligns viewingStep with currentStep", () => {
      useWizardStore.getState().initialize({
        sessionId: "abc-123",
        currentStep: 2,
        rawIdea: "Une idée valide pour le test",
        status: "active",
      });

      const state = useWizardStore.getState();
      expect(state.sessionId).toBe("abc-123");
      expect(state.currentStep).toBe(2);
      expect(state.viewingStep).toBe(2);
      expect(state.rawIdea).toBe("Une idée valide pour le test");
      expect(state.status).toBe("active");
    });

    it("clamps currentStep to the valid range [1, 4]", () => {
      useWizardStore.getState().initialize({
        sessionId: "s1",
        currentStep: 99,
        rawIdea: "x",
        status: "active",
      });
      expect(useWizardStore.getState().currentStep).toBe(4);

      useWizardStore.getState().initialize({
        sessionId: "s2",
        currentStep: 0,
        rawIdea: "x",
        status: "active",
      });
      expect(useWizardStore.getState().currentStep).toBe(1);
    });

    it("falls back to 'active' when status is unknown", () => {
      useWizardStore.getState().initialize({
        sessionId: "s",
        currentStep: 1,
        rawIdea: "x",
        status: "garbage-value",
      });
      expect(useWizardStore.getState().status).toBe("active");
    });

    it("preserves completed and abandoned statuses", () => {
      useWizardStore.getState().initialize({
        sessionId: "s",
        currentStep: 4,
        rawIdea: "x",
        status: "completed",
      });
      expect(useWizardStore.getState().status).toBe("completed");
    });

    it("resets PRD state on re-initialize", () => {
      useWizardStore.setState({
        confidenceScore: 75,
        recommendation: "test_first",
        lastUpdatedBlockType: "risk_value",
      });

      useWizardStore.getState().initialize({
        sessionId: "s",
        currentStep: 1,
        rawIdea: "x",
        status: "active",
      });

      const state = useWizardStore.getState();
      expect(state.confidenceScore).toBeNull();
      expect(state.recommendation).toBeNull();
      expect(state.lastUpdatedBlockType).toBeNull();
      for (const blockType of BLOCK_TYPES) {
        expect(state.blocks[blockType]).toBeNull();
      }
    });
  });

  describe("advanceStep", () => {
    it("increments currentStep and syncs viewingStep", () => {
      useWizardStore.setState({ currentStep: 2, viewingStep: 1 });
      useWizardStore.getState().advanceStep();

      const state = useWizardStore.getState();
      expect(state.currentStep).toBe(3);
      expect(state.viewingStep).toBe(3);
    });

    it("caps currentStep at 4", () => {
      useWizardStore.setState({ currentStep: 4, viewingStep: 4 });
      useWizardStore.getState().advanceStep();
      expect(useWizardStore.getState().currentStep).toBe(4);
    });
  });

  describe("goToStep", () => {
    it("allows navigating back to a completed step without losing progress", () => {
      useWizardStore.setState({ currentStep: 3, viewingStep: 3 });
      useWizardStore.getState().goToStep(1);

      const state = useWizardStore.getState();
      expect(state.viewingStep).toBe(1);
      expect(state.currentStep).toBe(3);
    });

    it("allows clicking the current step (no-op effect on viewingStep when already there)", () => {
      useWizardStore.setState({ currentStep: 2, viewingStep: 1 });
      useWizardStore.getState().goToStep(2);
      expect(useWizardStore.getState().viewingStep).toBe(2);
    });

    it("refuses to jump to a locked future step", () => {
      useWizardStore.setState({ currentStep: 2, viewingStep: 2 });
      useWizardStore.getState().goToStep(4);
      expect(useWizardStore.getState().viewingStep).toBe(2);
    });

    it("refuses out-of-range steps", () => {
      useWizardStore.setState({ currentStep: 3, viewingStep: 3 });
      useWizardStore.getState().goToStep(0);
      useWizardStore.getState().goToStep(5);
      expect(useWizardStore.getState().viewingStep).toBe(3);
    });
  });

  describe("setActivePanel", () => {
    it("switches between conversation and prd", () => {
      useWizardStore.getState().setActivePanel("prd");
      expect(useWizardStore.getState().activePanel).toBe("prd");

      useWizardStore.getState().setActivePanel("conversation");
      expect(useWizardStore.getState().activePanel).toBe("conversation");
    });
  });

  describe("hydrateBlocks", () => {
    it("rebuilds the blocks map from Dexie rows, leaves missing types null", () => {
      const rows: PrdBlockRow[] = [
        {
          id: "id-1",
          sessionId: "s",
          blockType: "first_use_case",
          content: "PM persona content",
          evidenceTags: [{ text: "data point", tag: "evidence" }],
          step: 1,
          sortOrder: 1,
          updatedAt: 1000,
        },
      ];
      useWizardStore.getState().hydrateBlocks(rows, null, null);

      const state = useWizardStore.getState();
      expect(state.blocks.first_use_case).toMatchObject({
        blockType: "first_use_case",
        content: "PM persona content",
        sortOrder: 1,
      });
      expect(state.blocks.problem_context).toBeNull();
      expect(state.blocks.confidence_score).toBeNull();
    });

    it("applies score and recommendation passed in", () => {
      useWizardStore.getState().hydrateBlocks([], 78, "test_first");

      const state = useWizardStore.getState();
      expect(state.confidenceScore).toBe(78);
      expect(state.recommendation).toBe("test_first");
    });

    it("clears lastUpdatedBlockType so the highlight ring does not re-play on remount", () => {
      useWizardStore.setState({ lastUpdatedBlockType: "risk_value" });
      useWizardStore.getState().hydrateBlocks([], null, null);
      expect(useWizardStore.getState().lastUpdatedBlockType).toBeNull();
    });
  });

  describe("updateBlock", () => {
    it("stores a block mirror and marks it as lastUpdated", () => {
      useWizardStore.getState().updateBlock(
        "problem_context",
        "Pain point markdown",
        [{ text: "from PM", tag: "assumption" }],
        1,
      );

      const state = useWizardStore.getState();
      expect(state.blocks.problem_context).toMatchObject({
        blockType: "problem_context",
        content: "Pain point markdown",
        step: 1,
        sortOrder: 2,
      });
      expect(state.lastUpdatedBlockType).toBe("problem_context");
    });

    it("applies confidence only when blockType is confidence_score", () => {
      useWizardStore.setState({ sessionId: null });

      useWizardStore.getState().updateBlock(
        "risk_value",
        "Risk content",
        [],
        3,
        { score: 60, recommendation: "test_first" },
      );

      let state = useWizardStore.getState();
      expect(state.confidenceScore).toBeNull();
      expect(state.recommendation).toBeNull();

      useWizardStore.getState().updateBlock(
        "confidence_score",
        "Score summary",
        [],
        3,
        { score: 60, recommendation: "test_first" },
      );

      state = useWizardStore.getState();
      expect(state.confidenceScore).toBe(60);
      expect(state.recommendation).toBe("test_first");
    });

    it("leaves confidence state untouched when no confidence arg is passed", () => {
      useWizardStore.setState({ confidenceScore: 85, recommendation: "build" });

      useWizardStore.getState().updateBlock(
        "confidence_score",
        "Updated summary, score stays",
        [],
        3,
      );

      const state = useWizardStore.getState();
      expect(state.confidenceScore).toBe(85);
      expect(state.recommendation).toBe("build");
    });
  });

  describe("clearLastUpdated", () => {
    it("resets lastUpdatedBlockType to null", () => {
      useWizardStore.setState({ lastUpdatedBlockType: "data_signals" });
      useWizardStore.getState().clearLastUpdated();
      expect(useWizardStore.getState().lastUpdatedBlockType).toBeNull();
    });
  });
});
