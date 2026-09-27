"use client";

import { useCallback, useEffect, useRef } from "react";

/** Debounce per key so rapid edits to one key never cancel another key's pending call. */
export function useKeyedDebounce<T>(fn: (key: string, value: T) => void, ms: number) {
  const latest = useRef(fn);
  const timers = useRef(new Map<string, number>());

  useEffect(() => {
    latest.current = fn;
  }, [fn]);

  useEffect(() => {
    const pending = timers.current;
    return () => {
      pending.forEach((id) => window.clearTimeout(id));
      pending.clear();
    };
  }, []);

  return useCallback(
    (key: string, value: T) => {
      const pending = timers.current;
      const existing = pending.get(key);
      if (existing) window.clearTimeout(existing);
      pending.set(
        key,
        window.setTimeout(() => {
          pending.delete(key);
          latest.current(key, value);
        }, ms)
      );
    },
    [ms]
  );
}
