/**
 * Quality tiers and progress labels for the Water UI.
 * Skill packs live only in the backend (`src/lib/water/skills/index.ts`); the frontend never
 * sees them. `QualityTier`, `BuildPassId`, and `TIER_PASS_UNLOCK` mirror the backend's
 * `src/lib/waterSkills.ts` — keep them identical.
 */

export type QualityTier = "fast" | "standard" | "studio";

/** img2threejs-style locked build passes (after planner/spec). */
export type BuildPassId =
  | "blockout"
  | "structural"
  | "form"
  | "material"
  | "surface"
  | "lighting"
  | "interaction"
  | "optimization";

export type QualityTierDef = {
  id: QualityTier;
  label: string;
  description: string;
  /** Human hint for token / time cost. */
  hint: string;
};

export const BUILD_PASS_ORDER: BuildPassId[] = [
  "blockout",
  "structural",
  "form",
  "material",
  "surface",
  "lighting",
  "interaction",
  "optimization",
];

/** Passes unlocked by quality tier (inclusive). */
export const TIER_PASS_UNLOCK: Record<QualityTier, BuildPassId[]> = {
  fast: ["blockout"],
  standard: ["blockout", "structural", "form", "material"],
  studio: [...BUILD_PASS_ORDER],
};

export const QUALITY_TIERS: QualityTierDef[] = [
  {
    id: "fast",
    label: "Fast",
    description: "Blockout only — quick silhouette",
    hint: "~2 LLM calls · ~1 min",
  },
  {
    id: "standard",
    label: "Standard",
    description: "Through materials — production-ready prop",
    hint: "~6 LLM calls · ~2–4 min",
  },
  {
    id: "studio",
    label: "Studio",
    description: "Full 8-pass professional sculpt",
    hint: "~12 LLM calls · ~4–8 min",
  },
];

export const DEFAULT_QUALITY_TIER: QualityTier = "standard";
export const WATER_TIER_STORAGE_KEY = "hydrilla_water_tier";

const TIER_IDS = new Set(QUALITY_TIERS.map((t) => t.id));

export function getQualityTier(id?: string | null): QualityTierDef {
  const found = QUALITY_TIERS.find((t) => t.id === id);
  return found || QUALITY_TIERS[1]!;
}

export function parseQualityTier(value?: string | null): QualityTier {
  if (value && TIER_IDS.has(value as QualityTier)) return value as QualityTier;
  return DEFAULT_QUALITY_TIER;
}

export function passesForTier(tier: QualityTier): BuildPassId[] {
  return TIER_PASS_UNLOCK[tier] || TIER_PASS_UNLOCK.standard;
}

/** Human labels for progress UI (planner + build passes). */
export const WATER_PASS_LABELS: Record<string, string> = {
  intake: "Checking the brief…",
  assessment: "Mapping the parts…",
  planner: "Writing the quality plan…",
  spec: "Writing the build plan…",
  blockout: "Building the blockout…",
  structural: "Adding structure…",
  form: "Refining form…",
  material: "Applying materials…",
  surface: "Detailing surfaces…",
  lighting: "Tuning lighting response…",
  interaction: "Wiring interaction…",
  optimization: "Optimizing the factory…",
  review: "Reviewing this pass…",
  evaluate: "Evaluating quality…",
  done: "Ready",
  partial: "Saved (partial studio run)",
};

export const WATER_PROGRESS_STEPS = [
  "assessment",
  "spec",
  "blockout",
  "structural",
  "form",
  "material",
  "surface",
  "lighting",
  "interaction",
  "optimization",
  "done",
] as const;

export function waterPassLabel(pass?: string | null): string {
  return WATER_PASS_LABELS[pass || ""] || "Building…";
}

export function waterPassIndex(pass?: string | null, unlocked?: BuildPassId[]): number {
  const steps = unlocked?.length
    ? (["assessment", "spec", ...unlocked, "done"] as string[])
    : [...WATER_PROGRESS_STEPS];
  const i = steps.indexOf(pass || "assessment");
  return i >= 0 ? i : 0;
}
