"use client";

import { useCallback, useSyncExternalStore } from "react";

// Returns false on the server and during the first client render to avoid
// hydration mismatch. The mobile (tabs) layout is the safe initial render.
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", callback);
      return () => media.removeEventListener("change", callback);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
