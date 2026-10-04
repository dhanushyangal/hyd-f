/**
 * Browser notifications for generation completion.
 * Only fires when the user is away from the site (hidden tab or unfocused window).
 */

export type GenerationNotifyType = "image" | "3d";

export interface GenerationNotifyOptions {
  type: GenerationNotifyType;
  prompt?: string | null;
}

const titleTracker: {
  originalTitle: string | null;
  intervalId: ReturnType<typeof setInterval> | null;
  listenerAttached: boolean;
} = {
  originalTitle: null,
  intervalId: null,
  listenerAttached: false,
};

/**
 * Returns true if the user is currently away from the web page
 * (e.g. in another tab, minimized, or window is unfocused).
 */
export function isUserAwayFromSite(): boolean {
  if (typeof document === "undefined") {
    return false;
  }
  return document.visibilityState === "hidden" || !document.hasFocus();
}

/**
 * Request notification permission from the user during user interactions.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | null> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }

  if (Notification.permission === "default") {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch {
      return null;
    }
  }

  return Notification.permission;
}

function restoreOriginalTitle(): void {
  if (titleTracker.intervalId !== null) {
    clearInterval(titleTracker.intervalId);
    titleTracker.intervalId = null;
  }
  if (titleTracker.originalTitle !== null && typeof document !== "undefined") {
    document.title = titleTracker.originalTitle;
    titleTracker.originalTitle = null;
  }
}

function startFlashingTabTitle(alertText: string): void {
  if (typeof document === "undefined" || typeof window === "undefined") {
    return;
  }

  if (titleTracker.originalTitle === null) {
    titleTracker.originalTitle = document.title;
  }

  if (!titleTracker.listenerAttached) {
    const handleReturn = () => {
      restoreOriginalTitle();
    };
    window.addEventListener("focus", handleReturn);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        restoreOriginalTitle();
      }
    });
    titleTracker.listenerAttached = true;
  }

  if (titleTracker.intervalId !== null) {
    clearInterval(titleTracker.intervalId);
  }

  const baseTitle = titleTracker.originalTitle || "Hydrilla";
  const state = { showingAlert: true };

  titleTracker.intervalId = setInterval(() => {
    if (!isUserAwayFromSite()) {
      restoreOriginalTitle();
      return;
    }

    state.showingAlert = !state.showingAlert;
    document.title = state.showingAlert ? alertText : baseTitle;
  }, 1000);

  document.title = alertText;
}

/**
 * Dispatch completion notification if the user is away from the site.
 * If the user is currently on the website, this is a no-op.
 */
export function notifyGenerationComplete(options: GenerationNotifyOptions): void {
  if (typeof window === "undefined") {
    return;
  }

  // Strict check: Only fire when the user is NOT actively viewing the site
  if (!isUserAwayFromSite()) {
    return;
  }

  const cleanPrompt = (options.prompt || "").trim();
  const truncatedPrompt = cleanPrompt.length > 60 ? `${cleanPrompt.slice(0, 57)}...` : cleanPrompt;

  const is3D = options.type === "3d";
  const title = is3D ? "3D Model Ready!" : "Image Ready!";
  const alertTitle = is3D ? "(✓) 3D Model Ready! | Hydrilla" : "(✓) Image Ready! | Hydrilla";

  const defaultBody = is3D
    ? "Your 3D model generation has completed. Click to view it in Hydrilla."
    : "Your concept image generation has completed. Click to view it in Hydrilla.";

  const body = truncatedPrompt ? `"${truncatedPrompt}" is ready.` : defaultBody;

  // Flash the tab title so users can notice even if OS-level notification is silenced
  startFlashingTabTitle(alertTitle);

  // Trigger system notification if granted
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      const notification = new Notification(title, {
        body,
        icon: "/vectorized_019cb4b0-6961-73df-8fbb-bdaa166fad56.svg",
        tag: `hydrilla-${options.type}-${Date.now()}`,
      });

      notification.onclick = () => {
        try {
          window.focus();
        } catch {
          // ignore window focus restrictions
        }
        restoreOriginalTitle();
        notification.close();
      };
    } catch {
      // Notification constructor might throw in restricted environments
    }
  }
}
