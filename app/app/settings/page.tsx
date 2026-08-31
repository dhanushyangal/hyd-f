"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  Eye,
  EyeOff,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  Search,
  RefreshCw,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  filterModelsByQuery,
  isPinnedModel,
  resolveEnabledModelIds,
  setModelEnabled,
} from "@/lib/waterModels";
import {
  deleteUserApiKey,
  fetchUserApiKeys,
  fetchWaterModels,
  providerKeyAvailable,
  saveUserApiKey,
  saveUserModelPrefs,
  verifyUserApiKey,
  type ConnectorPublic,
  type UserApiKeyMeta,
  type UserModelPrefs,
  type WaterModelGroup,
} from "@/lib/api";
import { FALLBACK_CONNECTORS } from "@/lib/connectors";
import { migrateCodeModelId, type ApiKeyProvider, type ModelId } from "@/lib/models";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SettingsPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [keys, setKeys] = useState<UserApiKeyMeta[]>([]);
  const [sharedKeys, setSharedKeys] = useState<UserApiKeyMeta[]>([]);
  const [connectors, setConnectors] = useState<ConnectorPublic[]>([]);
  const [prefs, setPrefs] = useState<UserModelPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!isSignedIn) return;
    setLoading(true);
    setError(null);
    try {
      const tokenGetter = async () => (await getToken()) ?? null;
      const data = await fetchUserApiKeys(tokenGetter);
      setKeys(data.keys);
      setSharedKeys(data.sharedKeys ?? []);
      setConnectors(data.connectors?.length ? data.connectors : FALLBACK_CONNECTORS);
      setPrefs(data.prefs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    void load();
  }, [isLoaded, isSignedIn]);

  return (
    <div className="app-content-page font-dm-sans bg-[#fafafa]">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <header>
          <p className="text-[11px] sm:text-xs font-medium text-neutral-400 tracking-[0.14em] uppercase">
            Account
          </p>
          <h1 className="mt-1.5 text-[28px] sm:text-[32px] font-semibold text-neutral-900 tracking-[-0.03em]">
            Settings
          </h1>
          <p className="mt-2 text-sm text-neutral-500">Keys and models for Water.</p>
        </header>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-end justify-between gap-3 px-0.5">
                <h2 className="text-sm font-semibold text-neutral-900">API keys</h2>
                <Link
                  href="/app/studio"
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
                >
                  Back to Studio
                </Link>
              </div>
              {(connectors.length ? connectors : FALLBACK_CONNECTORS).map((p) => (
                <ApiKeyCard
                  key={p.id}
                  connector={p}
                  meta={keys.find((k) => (k.provider === "gemini" ? "google" : k.provider) === p.id)}
                  shared={sharedKeys.find((k) => (k.provider === "gemini" ? "google" : k.provider) === p.id)}
                  onChanged={load}
                />
              ))}
            </section>

            <WaterModelSlots
              keys={keys}
              sharedKeys={sharedKeys}
              connectors={connectors.length ? connectors : FALLBACK_CONNECTORS}
              defaultCodeModel={(migrateCodeModelId(prefs?.defaultCodeModel) as ModelId) || null}
              serverEnabled={prefs?.enabledCodeModels}
              onDefaultSaved={async (id) => {
                const tokenGetter = async () => (await getToken()) ?? null;
                const next = await saveUserModelPrefs(
                  { defaultCodeModel: migrateCodeModelId(id) || id },
                  tokenGetter
                );
                setPrefs(next);
              }}
              onEnabledSaved={async (ids) => {
                const tokenGetter = async () => (await getToken()) ?? null;
                try {
                  const next = await saveUserModelPrefs({ enabledCodeModels: ids }, tokenGetter);
                  setPrefs(next);
                } catch {
                  // localStorage already updated; SQL 008 may not be applied yet
                }
              }}
            />

            <LimitsCard />
          </>
        )}
      </div>
    </div>
  );
}

function LimitsCard() {
  return (
    <Card>
      <CardHeader className="px-5 pt-5 pb-0">
        <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">
          Limits & credits
        </h2>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-3">
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-[11px] uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-3 py-2 font-semibold">Engine</th>
                <th className="px-3 py-2 font-semibold">Cost</th>
                <th className="px-3 py-2 font-semibold">Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              <tr>
                <td className="px-3 py-2.5 font-medium text-neutral-900">Hydrilla cloud</td>
                <td className="px-3 py-2.5">2–10 Hydrilla credits</td>
                <td className="px-3 py-2.5">Your plan balance</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-medium text-neutral-900">Water</td>
                <td className="px-3 py-2.5">0 Hydrilla credits</td>
                <td className="px-3 py-2.5">Your provider key</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-medium text-neutral-900">OpenRouter free</td>
                <td className="px-3 py-2.5">$0 · your key</td>
                <td className="px-3 py-2.5">~50/day · ~20/min</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12px] text-neutral-500 leading-relaxed">
          One Water build uses 2 provider requests (up to 4 if a quality gate retries).
          After a one-time $10 OpenRouter credit purchase, free-model daily limit rises to ~1,000.
        </p>
      </CardContent>
    </Card>
  );
}

function ApiKeyCard({
  connector,
  meta,
  shared,
  onChanged,
}: {
  connector: ConnectorPublic;
  meta?: UserApiKeyMeta;
  shared?: UserApiKeyMeta;
  onChanged: () => Promise<void>;
}) {
  const provider = connector.id as ApiKeyProvider;
  const placeholder = connector.keyPlaceholder;
  const docs = connector.docsUrl;
  const { getToken } = useAuth();
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<"save" | "verify" | "remove" | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const status = meta?.status ?? "unchecked";
  const configured = Boolean(meta?.configured);
  const tokenGetter = async () => (await getToken()) ?? null;

  const handleSave = async () => {
    if (!value.trim()) return;
    setBusy("save");
    setLocalError(null);
    try {
      await saveUserApiKey(provider, value.trim(), tokenGetter);
      setValue("");
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1600);
      await onChanged();
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  };

  const handleVerify = async () => {
    setBusy("verify");
    setLocalError(null);
    try {
      await verifyUserApiKey(provider, tokenGetter);
      await onChanged();
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Verify failed");
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = async () => {
    setBusy("remove");
    setLocalError(null);
    try {
      await deleteUserApiKey(provider, tokenGetter);
      await onChanged();
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold tracking-tight text-neutral-900">
                {connector.name}
              </h3>
              {docs && (
                <a
                  href={docs}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-neutral-800"
                >
                  Get key
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {connector.product ? (
              <p className="mt-0.5 text-[12px] text-neutral-500">{connector.product}</p>
            ) : null}
            {!configured && shared?.configured && shared.status !== "invalid" ? (
              <p className="mt-1 text-[12px] text-neutral-500">Hydrilla key available until you add your own.</p>
            ) : null}
          </div>
          <StatusPill configured={configured} status={status} last4={meta?.last4} />
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={show ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={configured ? `••••••••${meta?.last4 || ""}` : placeholder}
              className="h-10 rounded-xl pr-10"
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSave();
              }}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              aria-label={show ? "Hide key" : "Show key"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={!value.trim() || busy !== null}
            className="h-10 rounded-xl px-4"
          >
            {busy === "save" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : savedFlash ? (
              <Check className="h-4 w-4" />
            ) : (
              "Save"
            )}
          </Button>
        </div>

        {(configured || localError || (meta?.lastError && status === "invalid")) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {configured && (
              <>
                <button
                  type="button"
                  onClick={() => void handleVerify()}
                  disabled={busy !== null}
                  className="text-xs font-medium text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
                >
                  {busy === "verify" ? "Verifying…" : "Verify"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleRemove()}
                  disabled={busy !== null}
                  className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {busy === "remove" ? "Removing…" : "Remove"}
                </button>
              </>
            )}
            {meta?.lastError && status === "invalid" && (
              <p className="w-full text-[11px] text-red-600 flex items-start gap-1">
                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                {meta.lastError}
              </p>
            )}
            {localError && <p className="w-full text-[11px] text-red-600">{localError}</p>}
          </div>
        )}
        {provider === "anthropic" && (
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            Create a Console key at{" "}
            <a
              href="https://platform.claude.com/settings/keys"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-neutral-700 underline-offset-2 hover:underline"
            >
              platform.claude.com/settings/keys
            </a>
            , ensure billing/credits are active, then Save and Verify.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusPill({
  configured,
  status,
  last4,
}: {
  configured: boolean;
  status: string;
  last4?: string | null;
}) {
  if (!configured) {
    return (
      <span className="rounded-md bg-neutral-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
        Not set
      </span>
    );
  }
  if (status === "valid") {
    return (
      <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
        Valid{last4 ? ` · ${last4}` : ""}
      </span>
    );
  }
  if (status === "invalid") {
    return (
      <span className="rounded-md bg-red-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-700">
        Invalid
      </span>
    );
  }
  return (
    <span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
      Unchecked
    </span>
  );
}

function WaterModelSlots({
  keys,
  sharedKeys,
  connectors,
  defaultCodeModel,
  serverEnabled,
  onDefaultSaved,
  onEnabledSaved,
}: {
  keys: UserApiKeyMeta[];
  sharedKeys: UserApiKeyMeta[];
  connectors: ConnectorPublic[];
  defaultCodeModel: ModelId | null;
  serverEnabled?: string[] | null;
  onDefaultSaved: (id: ModelId) => Promise<void>;
  onEnabledSaved: (ids: string[]) => Promise<void>;
}) {
  const { getToken } = useAuth();
  const [groups, setGroups] = useState<WaterModelGroup[]>([]);
  const [enabled, setEnabled] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const keyFingerprint = [...keys, ...sharedKeys]
    .map((k) => `${k.provider}:${k.configured}:${k.status}`)
    .sort()
    .join("|");

  const loadModels = async () => {
    setSyncing(true);
    try {
      const data = await fetchWaterModels(async () => (await getToken()) ?? null);
      setGroups(data.groups);
      setEnabled(resolveEnabledModelIds(data.groups, serverEnabled));
      setLoadError(null);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Could not load models");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    void loadModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyFingerprint]);

  const hasAccess = connectors.some((c) => providerKeyAvailable(c.id, keys, sharedKeys));

  if (!hasAccess && !groups.length && !syncing) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-[15px] text-neutral-500">
          Save a key above. Models for that provider will show up here.
        </CardContent>
      </Card>
    );
  }

  const toggle = (id: string, on: boolean) => {
    const next = setModelEnabled(id, on, enabled, groups);
    setEnabled(next);
    void onEnabledSaved(next);
    if (on && !defaultCodeModel) {
      void onDefaultSaved(id);
    }
    if (!on && defaultCodeModel === id) {
      const fallback = next[0];
      if (fallback) void onDefaultSaved(fallback);
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="px-0.5 text-sm font-semibold text-neutral-900">Models</h2>
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-neutral-200 bg-white px-3 py-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Add or search model"
              className="h-12 rounded-xl border-neutral-200 pl-10 text-[15px]"
            />
          </div>
          <button
            type="button"
            onClick={() => void loadModels()}
            disabled={syncing}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
            aria-label="Refresh models"
          >
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
          </button>
        </div>

        {loadError && (
          <p className="border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">{loadError}</p>
        )}

        <div className="max-h-[min(28rem,60vh)] overflow-y-auto">
          {groups.map((g) => {
            const models = filterModelsByQuery(g.models, query);
            if (!models.length) return null;
            return (
              <div key={g.provider}>
                <div className="sticky top-0 z-[1] bg-neutral-50 px-4 py-2 text-[13px] font-medium text-neutral-500">
                  {g.name}
                </div>
                {models.map((m) => {
                  const on = enabled.includes(m.id);
                  const pinned = isPinnedModel(m.id, enabled, groups);
                  return (
                    <div
                      key={m.id}
                      className="flex min-h-[3.5rem] items-center justify-between gap-4 border-t border-neutral-100 px-4 py-3"
                    >
                      <span className="min-w-0 truncate text-[16px] font-medium leading-snug text-neutral-900">
                        {m.name}
                      </span>
                      <Switch
                        checked={on}
                        disabled={pinned && on}
                        onCheckedChange={(next) => toggle(m.id, next)}
                        className="h-6 w-11 shrink-0 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-neutral-200 [&>span]:h-5 [&>span]:w-5 data-[state=checked]:[&>span]:translate-x-5"
                        aria-label={`Show ${m.name} in Engine`}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
