"use client";

import { useWizardStore } from "@/stores/wizard-store";
import { useMediaQuery } from "@/hooks/use-media-query";
import { StepIndicator } from "@/components/wizard/step-indicator";
import { ConversationPanel } from "@/components/wizard/conversation-panel";
import { PrdPanel } from "@/components/wizard/prd-panel";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export function WizardShell() {
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const activePanel = useWizardStore((s) => s.activePanel);
  const setActivePanel = useWizardStore((s) => s.setActivePanel);

  if (isDesktop) {
    return (
      <div className="flex flex-col h-full">
        <StepIndicator />
        <div className="flex-1 grid grid-cols-[40fr_60fr] min-h-0">
          <ConversationPanel className="border-r border-border overflow-y-auto" />
          <PrdPanel className="overflow-y-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <StepIndicator />
      <Tabs
        value={activePanel}
        onValueChange={(value) =>
          setActivePanel(value === "prd" ? "prd" : "conversation")
        }
        className="flex-1 flex flex-col min-h-0 gap-0"
      >
        <TabsList className="w-full grid grid-cols-2 shrink-0 rounded-none">
          <TabsTrigger value="conversation">Conversation</TabsTrigger>
          <TabsTrigger value="prd">PRD</TabsTrigger>
        </TabsList>
        <TabsContent
          value="conversation"
          className="flex-1 min-h-0 m-0"
          keepMounted
        >
          <ConversationPanel className="h-full" />
        </TabsContent>
        <TabsContent value="prd" className="flex-1 min-h-0 m-0" keepMounted>
          <PrdPanel className="h-full" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
