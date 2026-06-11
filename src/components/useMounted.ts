"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

// Date/time formatting depends on the viewer's timezone, which the server
// can't know — gate it behind hydration to avoid mismatches. Returns false
// during SSR/hydration and true on the client afterwards.
export function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
