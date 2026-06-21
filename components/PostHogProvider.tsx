"use client";

import { useEffect } from "react";

/**
 * Lazy-loaded PostHog provider
 * Only loads PostHog after page is interactive to improve initial load
 * This reduces initial JavaScript bundle size by ~118 KiB
 */
export default function PostHogProvider() {
  useEffect(() => {
    // Early return if not in browser - this check must be first
    if (typeof window === "undefined" || typeof document === "undefined") {
      return;
    }

    // Only load PostHog after page is interactive
    const loadPostHog = () => {
      import("../instrumentation-client").catch((err) => {
        console.error("Failed to load PostHog:", err);
      });
    };

    // At this point, TypeScript knows window and document exist
    // Use explicit type assertion to help TypeScript
    const win = window as Window;
    const doc = document as Document;

    if (typeof (win as Window & { requestIdleCallback?: typeof requestIdleCallback }).requestIdleCallback === "function") {
      (win as Window & { requestIdleCallback: typeof requestIdleCallback }).requestIdleCallback(loadPostHog, { timeout: 5000 });
      return;
    }

    // Fallback: load after page is fully idle
    if (doc.readyState === "complete") {
      setTimeout(loadPostHog, 4000);
    } else {
      win.addEventListener("load", () => {
        setTimeout(loadPostHog, 4000);
      });
    }
  }, []);

  return null;
}
