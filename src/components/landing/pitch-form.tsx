"use client";

import { type SyntheticEvent, useRef, useState, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSession } from "@/app/actions/session";
import { rawIdeaSchema } from "@/lib/schemas/session";
import { cn } from "@/lib/utils";

const MIN_CHARS = 20;

export function PitchForm() {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [focused, setFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const errorId = "pitch-error";

  const isBelowMin = value.trim().length < MIN_CHARS;
  const isCtaInactive = isBelowMin || isPending;

  function handleSubmit(e: SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const rawIdea = formData.get("rawIdea");
    const parsed = rawIdeaSchema.safeParse({ rawIdea });

    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      textareaRef.current?.focus();
      return;
    }

    startTransition(async () => {
      const result = await createSession(formData);
      if (result?.error) {
        setError(result.error);
        textareaRef.current?.focus();
      }
    });
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} noValidate>
        <div
          className={cn(
            "rounded-2xl border bg-white transition-all duration-160",
            focused
              ? "border-foreground shadow-md"
              : "border-[#D4D4D4]",
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
              className={cn(
                isCtaInactive && "opacity-50 cursor-not-allowed",
              )}
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
        <p
          id={errorId}
          role="alert"
          className="mt-3 text-sm text-destructive"
        >
          {error}
        </p>
      )}
    </div>
  );
}
