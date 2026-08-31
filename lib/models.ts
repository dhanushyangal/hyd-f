/** Hydrilla cloud catalog + Water model id helpers. Water lists come from GET /api/user/models. */

export type ApiKeyProvider = "anthropic" | "openai" | "google" | "openrouter" | "cursor";

export type ModelId = string;

export type CatalogModel = {
  id: ModelId;
  label: string;
  group: "Hydrilla" | string;
  kind: "mesh" | "code";
  provider: ApiKeyProvider | "hydrilla";
  comingSoon?: boolean;
  free?: boolean;
  vision?: boolean;
  source?: "user" | "platform";
};

export const MODEL_CATALOG: CatalogModel[] = [
  { id: "trilles", label: "BlueFox 1", group: "Hydrilla", kind: "mesh", provider: "hydrilla" },
  {
    id: "hunyuan3d",
    label: "Hunyuan 3D",
    group: "Hydrilla",
    kind: "mesh",
    provider: "hydrilla",
    comingSoon: true,
  },
];

export const MODEL_GROUPS = ["Hydrilla"] as const;

export function getCatalogModel(id: string): CatalogModel | undefined {
  return MODEL_CATALOG.find((m) => m.id === id);
}

export function migrateCodeModelId(id: string | null | undefined): string | null {
  if (!id) return null;
  const raw = id.trim();
  if (!raw) return null;
  if (raw === "claude-sonnet-4-5" || raw === "claude-sonnet-5") return "anthropic:claude-sonnet-5";
  if (raw === "claude-opus-4-5" || raw === "claude-opus-5") return "anthropic:claude-opus-5";
  if (raw === "claude-haiku-4-5") return "anthropic:claude-haiku-4-5";
  if (raw === "gpt-4.1" || raw === "gpt-4.1-mini") return `openai:${raw}`;
  if (raw.startsWith("gemini-")) return `google:${raw}`;
  if (raw === "cursor-auto" || raw === "cursor-composer-2") return "cursor:auto";
  if (raw.startsWith("cursor/")) return `cursor:${raw.slice("cursor/".length) || "auto"}`;
  if (raw.startsWith("cursor-") && !raw.startsWith("cursor:")) {
    const rest = raw.slice("cursor-".length);
    return rest === "auto" ? "cursor:auto" : `cursor:${rest}`;
  }
  if (raw === "openrouter/free") return "openrouter:openrouter/free";
  if (raw.startsWith("openrouter/") && !raw.startsWith("openrouter:")) {
    return `openrouter:${raw.slice("openrouter/".length)}`;
  }
  if (raw.endsWith(":free") && !raw.startsWith("openrouter:") && !raw.startsWith("anthropic:")) {
    return `openrouter:${raw}`;
  }
  return raw;
}

export function parseWaterModelId(
  modelId: string
): { provider: ApiKeyProvider; nativeId: string } | null {
  const migrated = migrateCodeModelId(modelId) || modelId;
  const colon = migrated.indexOf(":");
  if (colon > 0) {
    const prefix = migrated.slice(0, colon) === "gemini" ? "google" : migrated.slice(0, colon);
    const native = migrated.slice(colon + 1);
    if (
      (prefix === "anthropic" ||
        prefix === "openai" ||
        prefix === "google" ||
        prefix === "openrouter" ||
        prefix === "cursor") &&
      native
    ) {
      return { provider: prefix, nativeId: native };
    }
  }
  if (migrated.startsWith("claude-")) return { provider: "anthropic", nativeId: migrated };
  if (migrated.startsWith("gpt-")) return { provider: "openai", nativeId: migrated };
  if (migrated.startsWith("gemini-")) return { provider: "google", nativeId: migrated };
  return null;
}

export function isCodeModel(id: string): boolean {
  if (id === "trilles" || id === "hunyuan3d") return false;
  return parseWaterModelId(id) !== null;
}

export function providerForModelId(id: string): ApiKeyProvider | "hydrilla" | null {
  if (id === "trilles" || id === "hunyuan3d") return "hydrilla";
  return parseWaterModelId(id)?.provider ?? null;
}

export function providerLabel(provider: ApiKeyProvider | "hydrilla"): string {
  switch (provider) {
    case "anthropic":
      return "Anthropic";
    case "openai":
      return "OpenAI";
    case "google":
      return "Google";
    case "openrouter":
      return "OpenRouter";
    case "cursor":
      return "Cursor";
    case "hydrilla":
      return "Hydrilla";
  }
}

export function normalizeProviderId(value: string): ApiKeyProvider | null {
  const v = value === "gemini" ? "google" : value;
  if (
    v === "anthropic" ||
    v === "openai" ||
    v === "google" ||
    v === "openrouter" ||
    v === "cursor"
  ) {
    return v;
  }
  return null;
}
