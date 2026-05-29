import type { KeyboardEvent } from "react";

/**
 * App-wide convention for text inputs: Enter submits, Shift+Enter inserts a
 * newline. Returns an onKeyDown handler. The passed handler should guard its own
 * "can submit" condition, so Enter on an empty or invalid field is a no-op.
 */
export function submitOnEnter(handler: () => void) {
  return (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handler();
    }
  };
}
