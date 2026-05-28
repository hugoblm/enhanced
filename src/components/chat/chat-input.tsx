"use client";

import { type KeyboardEvent, useRef, useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  onSubmit: (text: string) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
}

export function ChatInput({
  onSubmit,
  disabled = false,
  isStreaming = false,
  placeholder = "Écris ta réponse…",
}: Props) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = !disabled && !isStreaming && value.trim().length > 0;

  function submit() {
    if (!canSend) return;
    onSubmit(value.trim());
    setValue("");
    textareaRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-border bg-background px-4 py-3">
      <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isStreaming}
          rows={1}
          aria-label="Message"
          className={cn(
            "max-h-40 min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-[15px] leading-6 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10",
            (disabled || isStreaming) && "opacity-50",
          )}
        />
        <Button
          type="button"
          size="icon"
          onClick={submit}
          disabled={!canSend}
          aria-label="Envoyer"
        >
          {isStreaming ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <ArrowUp size={16} />
          )}
        </Button>
      </div>
    </div>
  );
}
