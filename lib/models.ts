/** Shared model catalog — keep in sync with backend llmProviders.ts */

export type ApiKeyProvider = "anthropic" | "openai" | "gemini" | "openrouter";

/** Model ids are catalog keys; OpenRouter free models use the real OR slug as id. */
export type ModelId = string;

export type CatalogModel = {
  id: ModelId;
  label: string;
  group: "Hydrilla" | "Anthropic" | "OpenAI" | "Google" | "OpenRouter" | "OpenRouter Free";
  kind: "mesh" | "code";
  provider: ApiKeyProvider | "hydrilla";
  /** OpenRouter API model slug when calling the API */
  openRouterSlug?: string;
  /** True when model accepts images (needed for Water fidelity) */
  vision?: boolean;
  free?: boolean;
  comingSoon?: boolean;
};

export const MODEL_CATALOG: CatalogModel[] = [
  { id: "trilles", label: "Trilles", group: "Hydrilla", kind: "mesh", provider: "hydrilla" },
  {
    id: "hunyuan3d",
    label: "Hunyuan 3D",
    group: "Hydrilla",
    kind: "mesh",
    provider: "hydrilla",
    comingSoon: true,
  },
  {
    id: "claude-sonnet-4-5",
    label: "Claude Sonnet 4.5",
    group: "Anthropic",
    kind: "code",
    provider: "anthropic",
    vision: true,
  },
  {
    id: "claude-opus-4-5",
    label: "Claude Opus 4.5",
    group: "Anthropic",
    kind: "code",
    provider: "anthropic",
    vision: true,
  },
  { id: "gpt-4.1", label: "GPT-4.1", group: "OpenAI", kind: "code", provider: "openai", vision: true },
  {
    id: "gpt-4.1-mini",
    label: "GPT-4.1 Mini",
    group: "OpenAI",
    kind: "code",
    provider: "openai",
    vision: true,
  },
  {
    id: "gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    group: "Google",
    kind: "code",
    provider: "gemini",
    vision: true,
  },
  {
    id: "gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    group: "Google",
    kind: "code",
    provider: "gemini",
    vision: true,
  },
  // --- OpenRouter Free (BYOK, $0) ---
  {
    id: "openrouter/free",
    label: "Auto Free (recommended)",
    group: "OpenRouter Free",
    kind: "code",
    provider: "openrouter",
    openRouterSlug: "openrouter/free",
    vision: true,
    free: true,
  },
  {
    id: "google/gemma-4-31b-it:free",
    label: "Gemma 4 31B",
    group: "OpenRouter Free",
    kind: "code",
    provider: "openrouter",
    openRouterSlug: "google/gemma-4-31b-it:free",
    vision: true,
    free: true,
  },
  {
    id: "google/gemma-4-26b-a4b-it:free",
    label: "Gemma 4 26B",
    group: "OpenRouter Free",
    kind: "code",
    provider: "openrouter",
    openRouterSlug: "google/gemma-4-26b-a4b-it:free",
    vision: true,
    free: true,
  },
  {
    id: "nvidia/nemotron-nano-12b-v2-vl:free",
    label: "Nemotron Nano 12B VL",
    group: "OpenRouter Free",
    kind: "code",
    provider: "openrouter",
    openRouterSlug: "nvidia/nemotron-nano-12b-v2-vl:free",
    vision: true,
    free: true,
  },
  {
    id: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    label: "Nemotron 3 Nano Omni",
    group: "OpenRouter Free",
    kind: "code",
    provider: "openrouter",
    openRouterSlug: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    vision: true,
    free: true,
  },
  // --- OpenRouter paid (still BYOK) ---
  {
    id: "openrouter/anthropic/claude-sonnet-4",
    label: "Claude Sonnet 4",
    group: "OpenRouter",
    kind: "code",
    provider: "openrouter",
    openRouterSlug: "anthropic/claude-sonnet-4",
    vision: true,
  },
  {
    id: "openrouter/anthropic/claude-opus-4",
    label: "Claude Opus 4",
    group: "OpenRouter",
    kind: "code",
    provider: "openrouter",
    openRouterSlug: "anthropic/claude-opus-4",
    vision: true,
  },
  {
    id: "openrouter/openai/gpt-4.1",
    label: "GPT-4.1",
    group: "OpenRouter",
    kind: "code",
    provider: "openrouter",
    openRouterSlug: "openai/gpt-4.1",
    vision: true,
  },
  {
    id: "openrouter/openai/gpt-4.1-mini",
    label: "GPT-4.1 Mini",
    group: "OpenRouter",
    kind: "code",
    provider: "openrouter",
    openRouterSlug: "openai/gpt-4.1-mini",
    vision: true,
  },
  {
    id: "openrouter/google/gemini-2.5-flash",
    label: "Gemini 2.5 Flash",
    group: "OpenRouter",
    kind: "code",
    provider: "openrouter",
    openRouterSlug: "google/gemini-2.5-flash",
    vision: true,
  },
  {
    id: "openrouter/google/gemini-2.5-pro",
    label: "Gemini 2.5 Pro",
    group: "OpenRouter",
    kind: "code",
    provider: "openrouter",
    openRouterSlug: "google/gemini-2.5-pro",
    vision: true,
  },
];

export const MODEL_GROUPS: CatalogModel["group"][] = [
  "Hydrilla",
  "OpenRouter Free",
  "Anthropic",
  "OpenAI",
  "Google",
  "OpenRouter",
];

export type OpenRouterFreeModel = {
  id: string;
  name: string;
  vision: boolean;
  contextLength: number | null;
};

export function getCatalogModel(id: string): CatalogModel | undefined {
  return MODEL_CATALOG.find((m) => m.id === id);
}

export function isCodeModel(id: string): boolean {
  const m = getCatalogModel(id);
  if (m) return m.kind === "code";
  // Dynamic free / openrouter slugs from live sync
  return (
    id.endsWith(":free") ||
    id === "openrouter/free" ||
    id.startsWith("openrouter/")
  );
}

export function providerForModelId(id: string): ApiKeyProvider | "hydrilla" | null {
  const m = getCatalogModel(id);
  if (m) return m.provider;
  if (id.endsWith(":free") || id === "openrouter/free" || id.startsWith("openrouter/")) {
    return "openrouter";
  }
  return null;
}

export function providerLabel(provider: ApiKeyProvider | "hydrilla"): string {
  switch (provider) {
    case "anthropic":
      return "Anthropic (Claude)";
    case "openai":
      return "OpenAI";
    case "gemini":
      return "Google (Gemini)";
    case "openrouter":
      return "OpenRouter";
    case "hydrilla":
      return "Hydrilla";
  }
}

export const OPENROUTER_FREE_MODELS = MODEL_CATALOG.filter((m) => m.free);
export const OPENROUTER_MODELS = MODEL_CATALOG.filter(
  (m) => m.provider === "openrouter" && !m.free
);

/** Merge live free models into picker options (dedupe by id). */
export function mergeFreeModels(
  live: OpenRouterFreeModel[]
): CatalogModel[] {
  const byId = new Map<string, CatalogModel>();
  for (const m of OPENROUTER_FREE_MODELS) byId.set(m.id, m);
  for (const m of live) {
    if (byId.has(m.id)) {
      const prev = byId.get(m.id)!;
      byId.set(m.id, { ...prev, vision: m.vision, label: m.name.replace(/\s*\(free\)\s*/i, "").trim() || prev.label });
      continue;
    }
    byId.set(m.id, {
      id: m.id,
      label: m.name.replace(/\s*\(free\)\s*/i, "").trim() || m.id,
      group: "OpenRouter Free",
      kind: "code",
      provider: "openrouter",
      openRouterSlug: m.id,
      vision: m.vision,
      free: true,
    });
  }
  // Prefer Auto Free first, then vision models, then the rest
  return [...byId.values()].sort((a, b) => {
    if (a.id === "openrouter/free") return -1;
    if (b.id === "openrouter/free") return 1;
    if (a.vision !== b.vision) return a.vision ? -1 : 1;
    return a.label.localeCompare(b.label);
  });
}
