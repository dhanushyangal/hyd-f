import { parseWaterModelId } from "@/lib/models";
import type { WaterModelGroup, WaterModelRow } from "@/lib/api";

export const ENABLED_WATER_MODELS_KEY = "hydrilla.water.enabledModels";
export const ENABLED_WATER_MODELS_EVENT = "hydrilla-water-enabled";

const ALWAYS_PER_PROVIDER = 3;

const FEATURED: Record<string, string[]> = {
  anthropic: ["claude-sonnet-4", "claude-sonnet-5", "claude-haiku", "claude-opus-4"],
  openai: ["gpt-4.1-mini", "gpt-4.1", "gpt-4o-mini", "gpt-4o", "o4-mini"],
  google: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-2.0-flash", "gemini-flash"],
  openrouter: [
    "openrouter/free",
    "google/gemini-2.5-flash",
    "anthropic/claude-sonnet",
    "openai/gpt-4o-mini",
  ],
  cursor: ["auto"],
};

function nativeOf(id: string, nativeId?: string): string {
  if (nativeId) return nativeId;
  return parseWaterModelId(id)?.nativeId || id;
}

function rank(provider: string, nativeId: string): number {
  const needles = FEATURED[provider] || [];
  const hay = nativeId.toLowerCase();
  return needles.findIndex((n) => hay === n.toLowerCase() || hay.includes(n.toLowerCase()));
}

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ENABLED_WATER_MODELS_EVENT));
}

export function pickAlwaysOnIds(groups: WaterModelGroup[]): string[] {
  const ids: string[] = [];
  for (const g of groups) {
    const scored = [...g.models]
      .map((m) => ({ m, r: rank(g.provider, nativeOf(m.id, m.nativeId)) }))
      .filter((x) => x.r >= 0)
      .sort((a, b) => a.r - b.r);
    const take = (scored.length ? scored : g.models.map((m) => ({ m, r: 99 }))).slice(
      0,
      ALWAYS_PER_PROVIDER
    );
    for (const row of take) {
      if (!ids.includes(row.m.id)) ids.push(row.m.id);
    }
  }
  return ids;
}

export function readEnabledModelIds(): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ENABLED_WATER_MODELS_KEY);
    if (raw == null) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((x): x is string => typeof x === "string");
  } catch {
    return null;
  }
}

export function writeEnabledModelIds(ids: string[]) {
  const unique = [...new Set(ids)];
  try {
    window.localStorage.setItem(ENABLED_WATER_MODELS_KEY, JSON.stringify(unique));
  } catch {
    /* ignore */
  }
  notify();
}

/** Seed featured models once. Later edits are the user's list. */
export function resolveEnabledModelIds(
  groups: WaterModelGroup[],
  serverIds?: string[] | null
): string[] {
  if (!groups.length) return serverIds?.length ? serverIds : readEnabledModelIds() ?? [];
  const stored = serverIds?.length ? serverIds : readEnabledModelIds();
  if (stored) {
    const live = new Set(groups.flatMap((g) => g.models.map((m) => m.id)));
    let keep = stored.filter((id) => live.has(id));
    for (const g of groups) {
      if (!g.models.some((m) => keep.includes(m.id))) {
        const pin = pickAlwaysOnIds([g])[0];
        if (pin) keep.push(pin);
      }
    }
    const unique = [...new Set(keep)];
    writeEnabledModelIds(unique);
    return unique;
  }
  const seeded = pickAlwaysOnIds(groups);
  writeEnabledModelIds(seeded);
  return seeded;
}

export function setModelEnabled(
  id: string,
  on: boolean,
  current: string[],
  groups: WaterModelGroup[]
): string[] {
  let next = on ? [...new Set([...current, id])] : current.filter((x) => x !== id);
  for (const g of groups) {
    const hasOn = g.models.some((m) => next.includes(m.id));
    if (!hasOn) {
      const pin = pickAlwaysOnIds([g])[0];
      if (pin) next = [...next, pin];
    }
  }
  writeEnabledModelIds(next);
  return next;
}

export function isPinnedModel(id: string, enabled: string[], groups: WaterModelGroup[]): boolean {
  const provider = parseWaterModelId(id)?.provider;
  if (!provider) return false;
  const g = groups.find((x) => x.provider === provider);
  if (!g) return false;
  const onInGroup = g.models.filter((m) => enabled.includes(m.id));
  return onInGroup.length <= 1 && enabled.includes(id);
}

export function isModelEnabled(id: string, enabled: string[]): boolean {
  return enabled.includes(id);
}

export function filterModelsByQuery(models: WaterModelRow[], query: string): WaterModelRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return models;
  return models.filter(
    (m) =>
      m.name.toLowerCase().includes(q) ||
      m.id.toLowerCase().includes(q) ||
      (m.nativeId || "").toLowerCase().includes(q)
  );
}

export function pickerVisibleIds(enabled: string[], selectedId?: string | null): Set<string> {
  const set = new Set(enabled);
  if (selectedId) set.add(selectedId);
  return set;
}
