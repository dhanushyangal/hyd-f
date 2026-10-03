/**
 * Image generation options (text-to-image + edit) — mirrors backend
 * `src/services/imageProviders/config.ts`. Keep credit numbers in sync.
 */

export type ImageProvider = "openai" | "gemini";
export type ImageQuality = "low" | "high";
export type ImageAspect = "1:1" | "3:2" | "2:3";
export type ImageOperation = "text-to-image" | "edit";

export type ImageOptions = {
  provider: ImageProvider;
  quality: ImageQuality;
  aspect: ImageAspect;
};

export const DEFAULT_IMAGE_OPTIONS: ImageOptions = {
  provider: "openai",
  quality: "low",
  aspect: "1:1",
};

export const IMAGE_PROVIDER_OPTIONS: { id: ImageProvider; label: string }[] = [
  { id: "openai", label: "OpenAI" },
  { id: "gemini", label: "Gemini" },
];

export const IMAGE_QUALITY_OPTIONS: { id: ImageQuality; label: string }[] = [
  { id: "low", label: "Low" },
  { id: "high", label: "High" },
];

export const IMAGE_ASPECT_OPTIONS: { id: ImageAspect; label: string }[] = [
  { id: "1:1", label: "Square" },
  { id: "3:2", label: "Landscape" },
  { id: "2:3", label: "Portrait" },
];

export const IMAGE_CREDITS: Record<ImageOperation, Record<ImageQuality, number>> = {
  "text-to-image": { low: 15, high: 20 },
  edit: { low: 15, high: 20 },
};

export type Model3DResolution = "standard" | "ultra1k";

export const MODEL_3D_CREDITS: Record<Model3DResolution, number> = {
  standard: 30,
  ultra1k: 40,
};

/** Image-to-3D on the GPU VM (standard resolution default). */
export const IMAGE_TO_3D_CREDITS = 30;

export function imageCredits(op: ImageOperation, quality: ImageQuality): number {
  return IMAGE_CREDITS[op][quality];
}

export function model3DCredits(resolution: Model3DResolution): number {
  return MODEL_3D_CREDITS[resolution] ?? 30;
}

/** Short tier description shown next to the quality toggle. */
export function imageTierHint(quality: ImageQuality): string {
  return quality === "high" ? "Best detail · 2K" : "Faster · 1K";
}

const STORAGE_KEY = "hydrilla:image-options";

function isProvider(v: unknown): v is ImageProvider {
  return v === "openai" || v === "gemini";
}
function isQuality(v: unknown): v is ImageQuality {
  return v === "low" || v === "high";
}
function isAspect(v: unknown): v is ImageAspect {
  return v === "1:1" || v === "3:2" || v === "2:3";
}

export function loadImageOptions(): ImageOptions {
  if (typeof window === "undefined") return { ...DEFAULT_IMAGE_OPTIONS };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_IMAGE_OPTIONS };
    const parsed = JSON.parse(raw) as Partial<ImageOptions>;
    return {
      provider: isProvider(parsed.provider) ? parsed.provider : DEFAULT_IMAGE_OPTIONS.provider,
      quality: isQuality(parsed.quality) ? parsed.quality : DEFAULT_IMAGE_OPTIONS.quality,
      aspect: isAspect(parsed.aspect) ? parsed.aspect : DEFAULT_IMAGE_OPTIONS.aspect,
    };
  } catch {
    return { ...DEFAULT_IMAGE_OPTIONS };
  }
}

export function saveImageOptions(options: ImageOptions): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(options));
  } catch {
    /* storage full or disabled */
  }
}
