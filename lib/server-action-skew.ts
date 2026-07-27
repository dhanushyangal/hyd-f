/**
 * Detect Next.js "Failed to find Server Action" deployment skew errors.
 * These happen when a stale client (pre-deploy tab) posts a Server Action ID
 * that no longer exists in the current build — commonly from Clerk's
 * invalidateCacheAction after a rollout.
 */
export function isServerActionSkewError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const message = error.message || "";
  return (
    message.includes("Failed to find Server Action") ||
    message.includes("older or newer deployment")
  );
}

export const SERVER_ACTION_SKEW_RELOAD_KEY =
  "hydrilla:server-action-skew-reload";
