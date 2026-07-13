/**
 * API Health Monitor
 *
 * Tracks whether the primary gateway (api.hydrilla.ai) is reachable.
 *
 * Feature availability per gateway:
 *   Primary  (api.hydrilla.ai) — Text, Edit, Combine, Image-to-3D
 *   Alternative (api.hydrilla.co) — Text, Image-to-3D only
 *
 * When the primary is down:
 *   - Text-to-image and Image-to-3D automatically fall back to the alternative.
 *   - Edit and Combine are unavailable (primary-only).
 *
 * Health status is cached so we never probe on every request.
 * A background recovery poller re-checks the primary every 30 s
 * and switches back automatically once it responds.
 */

const PRIMARY_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.hydrilla.ai"
).replace(/\/$/, "");


const ALTERNATIVE_URL = (
  process.env.NEXT_PUBLIC_API_URL_ALTERNATIVE || "https://api.hydrilla.co"
).replace(/\/$/, "");

const PROBE_TIMEOUT_MS = 5_000;
const RECOVERY_POLL_MS = 30_000;

let _primaryAvailable = true;
let _recoveryTimer: ReturnType<typeof setInterval> | null = null;

// ── Listener / subscription system ──────────────────────────────────
type HealthListener = (primaryUp: boolean) => void;
const _listeners = new Set<HealthListener>();

function _notify(): void {
  _listeners.forEach((fn) => fn(_primaryAvailable));
}

/**
 * Subscribe to health-state changes.
 * Returns an unsubscribe function.
 */
export function onHealthChange(listener: HealthListener): () => void {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

// ── Probing / recovery ──────────────────────────────────────────────
/** Use GET /health (not HEAD /): CORS and nginx often allow GET to /health while HEAD on / fails in the browser. */
function healthCheckUrl(base: string): string {
  const b = base.replace(/\/$/, "");
  return `${b}/health`;
}

async function probe(baseUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(healthCheckUrl(baseUrl), {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(tid);
    // Any completed response means the browser can reach the host with CORS
    // (same idea as the old HEAD probe, which ignored status). Do not require
    // res.ok: `/health` may be 503/502 while other routes still work via the LB.
    await res.arrayBuffer().catch(() => new ArrayBuffer(0));
    return true;
  } catch {
    return false;
  }
}

function startRecoveryPolling(): void {
  if (_recoveryTimer) return;
  _recoveryTimer = setInterval(async () => {
    if (await probe(PRIMARY_URL)) {
      _primaryAvailable = true;
      clearInterval(_recoveryTimer!);
      _recoveryTimer = null;
      console.log("[apiHealth] Primary API recovered:", PRIMARY_URL);
      _notify();
    }
  }, RECOVERY_POLL_MS);
}

/**
 * Mark the primary API as unavailable and begin polling for recovery.
 * Called when any gateway request hits a network error.
 */
export function markPrimaryDown(): void {
  if (!_primaryAvailable) return;
  _primaryAvailable = false;
  console.warn(
    "[apiHealth] Primary API marked unavailable — fallback active for Text & Image-to-3D:",
    ALTERNATIVE_URL,
  );
  _notify();
  if (typeof window !== "undefined") startRecoveryPolling();
}

export function isPrimaryUp(): boolean {
  return _primaryAvailable;
}

export function getPrimaryUrl(): string {
  return PRIMARY_URL;
}

export function getAlternativeUrl(): string {
  return ALTERNATIVE_URL;
}

/**
 * Returns the best available gateway URL for features that exist on
 * both gateways (text-to-image, image-to-3d).
 */
export function getFallbackCapableUrl(): string {
  return _primaryAvailable ? PRIMARY_URL : ALTERNATIVE_URL;
}

// Run a non-blocking startup probe on the client so the very first
// request already knows whether to fall back.
if (typeof window !== "undefined") {
  probe(PRIMARY_URL).then((ok) => {
    if (_primaryAvailable !== ok) {
      _primaryAvailable = ok;
      _notify();
    }
    if (!ok) {
      console.warn("[apiHealth] Primary API unavailable at startup");
      startRecoveryPolling();
    }
  });
}
