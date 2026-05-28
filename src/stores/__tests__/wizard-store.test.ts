import { beforeEach, describe, expect, it } from "vitest";
import { useWizardStore } from "@/stores/wizard-store";

function resetStore() {
  useWizardStore.setState({
    sessionId: null,
    rawIdea: null,
    status: "active",
    currentStep: 1,
    viewingStep: 1,
    activePanel: "conversation",
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
});
