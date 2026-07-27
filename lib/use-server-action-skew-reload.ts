"use client";

import { useEffect } from "react";
import {
  isServerActionSkewError,
  SERVER_ACTION_SKEW_RELOAD_KEY,
} from "@/lib/server-action-skew";

/**
 * Hard-reload once when a Server Action skew error surfaces in an error boundary.
 * A second hit in the same session falls through to the normal error UI.
 */
export function useServerActionSkewReload(
  error: Error & { digest?: string }
): boolean {
  const isSkew = isServerActionSkewError(error);

  useEffect(() => {
    if (!isSkew || typeof window === "undefined") return;

    try {
      if (sessionStorage.getItem(SERVER_ACTION_SKEW_RELOAD_KEY) === "1") {
        sessionStorage.removeItem(SERVER_ACTION_SKEW_RELOAD_KEY);
        return;
      }
      sessionStorage.setItem(SERVER_ACTION_SKEW_RELOAD_KEY, "1");
    } catch {
      // sessionStorage may be unavailable; still attempt a reload.
    }

    window.location.reload();
  }, [isSkew, error]);

  return isSkew;
}
