"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { WizardShell } from "@/components/wizard/wizard-shell";
import { useWizardStore } from "@/stores/wizard-store";
import { db } from "@/lib/db/dexie";
import { buttonVariants } from "@/components/ui/button";

interface Props {
  sessionId: string;
}

type HydrationState = "loading" | "ready" | "missing";

export function WizardClient({ sessionId }: Props) {
  const initialize = useWizardStore((s) => s.initialize);
  const [state, setState] = useState<HydrationState>("loading");

  useEffect(() => {
    let cancelled = false;
    db.sessions
      .get(sessionId)
      .then((row) => {
        if (cancelled) return;
        if (!row) {
          setState("missing");
          return;
        }
        initialize({
          sessionId: row.id,
          rawIdea: row.rawIdea,
          currentStep: row.currentStep,
          status: row.status,
        });
        setState("ready");
      })
      .catch((err) => {
        console.error("[wizard-client] Dexie read failed:", err);
        if (!cancelled) setState("missing");
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, initialize]);

  if (state === "loading") {
    return (
      <div
        aria-busy="true"
        aria-live="polite"
        className="flex h-full items-center justify-center text-sm text-muted-foreground"
      >
        Chargement de la session…
      </div>
    );
  }

  if (state === "missing") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl font-medium">Session introuvable</h1>
        <p className="max-w-md text-muted-foreground">
          Cette session n&apos;existe pas dans ce navigateur. Elle a peut-être
          été créée sur un autre appareil, ou les données locales ont été
          effacées.
        </p>
        <Link href="/" className={buttonVariants({ variant: "default" })}>
          Démarrer une nouvelle session
        </Link>
      </div>
    );
  }

  return <WizardShell />;
}
