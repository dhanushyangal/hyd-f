/**
 * Capability monitor. Uses backend `GET /api/3d/health`:
 * - text_to_image / edit_image: an OpenAI or Gemini key is configured
 * - image_to_3d: the GPU VM (https://api.hydrilla.co) has its pipeline loaded
 */

export type GpuFeatures = {
  text_to_image: boolean;
  text_to_3d: boolean;
  image_to_3d: boolean;
  edit_image: boolean;
};

export type ImageProviderAvailability = {
  openai: boolean;
  gemini: boolean;
};

export type GpuHealthState = {
  status: "ok" | "degraded" | "down" | "unknown";
  mode: string;
  features: GpuFeatures;
  providers: ImageProviderAvailability;
};

/** Optimistic defaults until the first probe returns. */
const DEFAULT_FEATURES: GpuFeatures = {
  text_to_image: true,
  text_to_3d: true,
  image_to_3d: true,
  edit_image: true,
};

const DEFAULT_PROVIDERS: ImageProviderAvailability = {
  openai: true,
  gemini: true,
};

/** Backend unreachable: nothing works. */
const OFFLINE_FEATURES: GpuFeatures = {
  text_to_image: false,
  text_to_3d: false,
  image_to_3d: false,
  edit_image: false,
};

/** Single GPU runtime — no fallback to another host */
const GPU_API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "https://api.hydrilla.co"
).replace(/\/$/, "");

function getBackendBase(): string {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (
    !url ||
    url === "NEXT_PUBLIC_BACKEND_URL" ||
    url.includes("NEXT_PUBLIC_BACKEND_URL")
  ) {
    return "https://hydrilla-backend.vercel.app";
  }
  return url.replace(/\/$/, "");
}

const PROBE_TIMEOUT_MS = 5_000;
const RECOVERY_POLL_MS = 30_000;

let _state: GpuHealthState = {
  status: "unknown",
  mode: "cloud",
  features: { ...DEFAULT_FEATURES },
  providers: { ...DEFAULT_PROVIDERS },
};

let _gpuAvailable = true;
let _recoveryTimer: ReturnType<typeof setInterval> | null = null;

type HealthListener = (gpuUp: boolean) => void;
type FeaturesListener = (state: GpuHealthState) => void;
const _listeners = new Set<HealthListener>();
const _featureListeners = new Set<FeaturesListener>();

function _notify(): void {
  _listeners.forEach((fn) => fn(_gpuAvailable));
  _featureListeners.forEach((fn) => fn(_state));
}

export function onHealthChange(listener: HealthListener): () => void {
  _listeners.add(listener);
  return () => {
    _listeners.delete(listener);
  };
}

export function onFeaturesChange(listener: FeaturesListener): () => void {
  _featureListeners.add(listener);
  return () => {
    _featureListeners.delete(listener);
  };
}

function applyHealthPayload(data: any): void {
  const mode = (data?.mode as string) || "cloud";
  const f = data?.features;
  const features: GpuFeatures = {
    text_to_image: f?.text_to_image ?? true,
    text_to_3d: f?.text_to_3d ?? true,
    image_to_3d: f?.image_to_3d ?? true,
    edit_image: f?.edit_image ?? true,
  };
  const p = data?.providers;
  const providers: ImageProviderAvailability = {
    openai: p?.openai ?? true,
    gemini: p?.gemini ?? true,
  };
  const status = (data?.status as GpuHealthState["status"]) || "unknown";
  _state = { status, mode, features, providers };
  _gpuAvailable = features.image_to_3d;
}

async function probeBackendHealth(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const res = await fetch(`${getBackendBase()}/api/3d/health`, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(tid);
    if (!res.ok) return false;
    const data = await res.json();
    applyHealthPayload(data);
    return true;
  } catch {
    return false;
  }
}

async function refreshCapabilities(): Promise<void> {
  const ok = await probeBackendHealth();
  if (!ok) {
    _state = {
      status: "down",
      mode: "cloud",
      features: { ...OFFLINE_FEATURES },
      providers: { openai: false, gemini: false },
    };
    _gpuAvailable = false;
  }
  _notify();
  if (!_gpuAvailable) startRecoveryPolling();
  else if (_recoveryTimer) {
    clearInterval(_recoveryTimer);
    _recoveryTimer = null;
  }
}

function startRecoveryPolling(): void {
  if (_recoveryTimer) return;
  _recoveryTimer = setInterval(() => {
    void refreshCapabilities();
  }, RECOVERY_POLL_MS);
}

export function markPrimaryDown(): void {
  if (!_gpuAvailable) return;
  _gpuAvailable = false;
  _state = {
    ..._state,
    status: _state.features.text_to_image ? "degraded" : "down",
    features: { ..._state.features, image_to_3d: false, text_to_3d: false },
  };
  console.warn(
    "[apiHealth] GPU unavailable at api.hydrilla.co — retrying until recovery",
  );
  _notify();
  if (typeof window !== "undefined") startRecoveryPolling();
}

export function isPrimaryUp(): boolean {
  return _gpuAvailable;
}

export function getHealthState(): GpuHealthState {
  return _state;
}

export function canEdit(): boolean {
  return !!_state.features.edit_image;
}

export function canTextToImage(): boolean {
  return !!_state.features.text_to_image;
}

export function canTextTo3d(): boolean {
  return !!_state.features.text_to_3d;
}

export function canImageTo3d(): boolean {
  return !!_state.features.image_to_3d;
}

export function imageProviderAvailable(
  provider: keyof ImageProviderAvailability,
): boolean {
  return !!_state.providers[provider];
}

export function getPrimaryUrl(): string {
  return GPU_API_URL;
}

/** @deprecated Use getPrimaryUrl — single host only */
export function getGpuUrl(): string {
  return GPU_API_URL;
}

if (typeof window !== "undefined") {
  void refreshCapabilities();
}
