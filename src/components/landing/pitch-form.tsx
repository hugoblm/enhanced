"use client";

import { type SyntheticEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { rawIdeaSchema } from "@/lib/schemas/session";
import { db } from "@/lib/db/dexie";
import { cn } from "@/lib/utils";

const MIN_CHARS = 20;

export function PitchForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const errorId = "pitch-error";

  const isBelowMin = value.trim().length < MIN_CHARS;
  const isCtaInactive = isBelowMin || isPending;

  async function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const parsed = rawIdeaSchema.safeParse({ rawIdea: formData.get("rawIdea") });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      textareaRef.current?.focus();
      return;
    }

    setIsPending(true);
    try {
      const id = crypto.randomUUID();
      const now = Date.now();
      await db.sessions.put({
        id,
        rawIdea: parsed.data.rawIdea,
        currentStep: 1,
        status: "active",
        createdAt: now,
        updatedAt: now,
      });
      router.push(`/session/${id}`);
    } catch (err) {
      console.error("[pitch-form] Dexie put failed:", err);
      setError("Impossible de démarrer la session. Veuillez réessayer.");
      setIsPending(false);
      textareaRef.current?.focus();
    }
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} noValidate>
        <div
          className={cn(
            "rounded-2xl border bg-white transition-all duration-160",
            focused ? "border-foreground shadow-md" : "border-[#D4D4D4]",
          )}
        >
          <textarea
            ref={textareaRef}
            name="rawIdea"
            value={value}
            placeholder="Décris l'idée en quelques phrases. Aussi vague soit-elle. On la remettra en forme."
            rows={6}
            aria-label="Décris ton idée produit"
            aria-describedby={error ? errorId : undefined}
            aria-invalid={error ? true : undefined}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            className="w-full resize-none border-none bg-transparent px-[22px] pb-3 pt-5 font-sans text-lg leading-7 text-foreground placeholder:text-muted-foreground focus:outline-none"
          />

          <div className="flex flex-wrap items-center gap-2 border-t border-secondary px-3.5 pb-3.5 pt-2.5">
            {isBelowMin && (
              <span
                aria-live="polite"
                className="font-mono text-[11.5px] text-muted-foreground"
              >
                {value.trim().length} / {MIN_CHARS} caractères
              </span>
            )}
            <div className="flex-1" />
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              aria-disabled={isCtaInactive}
              className={cn(isCtaInactive && "opacity-50 cursor-not-allowed")}
            >
              {isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Lancement…
                </>
              ) : (
                <>
                  Lancer le cadrage
                  <ArrowRight size={16} />
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {error && (
        <p id={errorId} role="alert" className="mt-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
