"use client";

import { type KeyboardEvent, useLayoutEffect, useRef, useState } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

// leading-6 (24px/line) + py-2.5 (20px vertical padding) + 2px border.
// The border counts because the textarea is border-box and scrollHeight
// excludes the border; without it a 2px scrollbar shows at the line cap.
// 7 lines on desktop, 5 on mobile, then the textarea scrolls.
const LINE_HEIGHT = 24;
const VERTICAL_PADDING = 20;
const BORDER = 2;
const heightFor = (lines: number) => lines * LINE_HEIGHT + VERTICAL_PADDING + BORDER;

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
  const isWide = useMediaQuery("(min-width: 640px)");
  const minHeight = heightFor(2); // 2 lines at rest
  const maxHeight = heightFor(isWide ? 7 : 5);

  // Auto-grow: reset, then clamp the outer height (scrollHeight + border, since
  // scrollHeight excludes the border on a border-box element) between 2 lines
  // and maxHeight; beyond that the textarea scrolls internally. Re-runs on
  // value or viewport breakpoint change.
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const outer = el.scrollHeight + BORDER;
    el.style.height = `${Math.min(Math.max(outer, minHeight), maxHeight)}px`;
  }, [value, minHeight, maxHeight]);

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
          rows={2}
          style={{ maxHeight }}
          aria-label="Message"
          className={cn(
            "flex-1 resize-none overflow-y-auto rounded-xl border border-border bg-background px-3 py-2.5 text-[15px] leading-6 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/10",
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
