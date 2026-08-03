/**
 * Hydrilla has two generation engines:
 *
 * 1) Hydrilla cloud — models we host (e.g. Trilles). Uses platform credits → GLB.
 * 2) Water          — bring-your-own-key (BYOK). Uses the user’s LLM key → Three.js code.
 *
 * Legacy Code Sculpt wire values (`code_sculpt`, `CodeSculpt`) are still accepted on read.
 */

/** Persisted `jobs.engine` values (including legacy). */
export type PersistedEngine = "trilles" | "hunyuan" | "water" | "code_sculpt";

export const ENGINE = {
  /** Cloud mesh engine (our GPU). Model catalog id remains `trilles`. */
  hydrilla: {
    id: "hydrilla" as const,
    label: "Hydrilla cloud",
    shortLabel: "Cloud",
    description: "Models we provide — run on Hydrilla cloud credits. Output: GLB mesh.",
    defaultModelId: "trilles",
    persistedIds: ["trilles", "hunyuan"] as const,
    writeEngine: "trilles" as const,
    resultKind: "glb" as const,
  },
  /** BYOK procedural engine. */
  water: {
    id: "water" as const,
    label: "Water",
    shortLabel: "Water",
    description: "Bring-your-own-key — your LLM builds procedural Three.js. 0 Hydrilla credits.",
    generateType: "Water",
    persistedIds: ["water", "code_sculpt"] as const,
    legacyGenerateTypes: ["CodeSculpt", "code_sculpt", "codesculpt"] as const,
    writeEngine: "water" as const,
    writeGenerateType: "Water" as const,
    resultKind: "three_factory" as const,
    analyticsStarted: "water_started" as const,
    analyticsStartedLegacy: "code_sculpt_started" as const,
  },
} as const;

export function isWaterEngine(value?: string | null): boolean {
  if (!value) return false;
  const v = value.toLowerCase().replace(/[\s_-]+/g, "");
  return (
    v === "water" ||
    v === "waterengine" ||
    v === "codesculpt" ||
    v.includes("codesculpt")
  );
}

export function isHydrillaCloudEngine(value?: string | null): boolean {
  if (!value) return false;
  const v = value.toLowerCase().replace(/[\s_-]+/g, "");
  return v === "trilles" || v === "trellis" || v === "hydrilla" || v === "hunyuan" || v.includes("hunyuan");
}

/** User-facing engine / generation type label. */
export function formatEngineLabel(value?: string | null): string {
  if (!value) return "Image";
  if (isWaterEngine(value)) return ENGINE.water.label;
  if (/hunyuan/i.test(value || "")) return "Hunyuan 3D";
  if (isHydrillaCloudEngine(value)) return "Trilles";
  return value.replace(/_/g, " ").trim();
}

export function isWaterJob(job: {
  engine?: string | null;
  generateType?: string | null;
  resultKind?: string | null;
  hasFactoryCode?: boolean | null;
  factoryCode?: string | null;
}): boolean {
  if (isWaterEngine(job.engine) || isWaterEngine(job.generateType)) return true;
  if (job.resultKind === "three_factory") return true;
  if (job.hasFactoryCode || (job.factoryCode && job.factoryCode !== "__present__")) {
    return true;
  }
  return false;
}
