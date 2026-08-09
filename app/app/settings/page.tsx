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
  RefreshCw,
} from "lucide-react";
import {
  deleteUserApiKey,
  fetchCursorModels,
  fetchOpenRouterFreeModels,
  fetchOpenRouterKeyStatus,
  fetchUserApiKeys,
  saveUserApiKey,
  saveUserModelPrefs,
  verifyUserApiKey,
  type OpenRouterFreeModelRow,
  type UserApiKeyMeta,
  type UserModelPrefs,
} from "@/lib/api";
import {
  MODEL_CATALOG,
  OPENROUTER_MODELS,
  mergeCursorModels,
  mergeFreeModels,
  migrateCodeModelId,
  providerLabel,
  type ApiKeyProvider,
  type CatalogModel,
  type ModelId,
} from "@/lib/models";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const PROVIDERS: {
  id: ApiKeyProvider;
  placeholder: string;
  docs?: string;
}[] = [
  {
    id: "anthropic",
    placeholder: "sk-ant-...",
    docs: "https://platform.claude.com/settings/keys",
  },
  { id: "openai", placeholder: "sk-...", docs: "https://platform.openai.com/api-keys" },
  { id: "gemini", placeholder: "AIza...", docs: "https://aistudio.google.com/apikey" },
  {
    id: "cursor",
    placeholder: "crsr_...",
    docs: "https://cursor.com/dashboard/api",
  },
  {
    id: "openrouter",
    placeholder: "sk-or-v1-...",
    docs: "https://openrouter.ai/settings/keys",
  },
];

export default function SettingsPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [keys, setKeys] = useState<UserApiKeyMeta[]>([]);
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

  const keyOk = (provider: ApiKeyProvider) =>
    Boolean(
      keys.find((k) => k.provider === provider)?.configured &&
        keys.find((k) => k.provider === provider)?.status === "valid"
    );

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
          <p className="mt-2 text-sm text-neutral-500">
            API keys for Water (BYOK). Hydrilla cloud models still use plan credits.
          </p>
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
              {PROVIDERS.map((p) => (
                <ApiKeyCard
                  key={p.id}
                  provider={p.id}
                  placeholder={p.placeholder}
                  docs={p.docs}
                  meta={keys.find((k) => k.provider === p.id)}
                  onChanged={load}
                />
              ))}
            </section>

            <WaterDefaultModel
              keys={keys}
              keyOk={keyOk}
              value={(migrateCodeModelId(prefs?.defaultCodeModel) as ModelId) || null}
              onSaved={async (id) => {
                const tokenGetter = async () => (await getToken()) ?? null;
                const next = await saveUserModelPrefs(
                  { defaultCodeModel: migrateCodeModelId(id) || id },
                  tokenGetter
                );
                setPrefs(next);
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
  provider,
  placeholder,
  docs,
  meta,
  onChanged,
}: {
  provider: ApiKeyProvider;
  placeholder: string;
  docs?: string;
  meta?: UserApiKeyMeta;
  onChanged: () => Promise<void>;
}) {
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
                {providerLabel(provider)}
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

/**
 * Single Water default: one `defaultCodeModel` for Claude / OpenAI / Gemini /
 * OpenRouter / Cursor. Live-sync OpenRouter Free + Cursor when keys are valid.
 */
function WaterDefaultModel({
  keys: _keys,
  keyOk,
  value,
  onSaved,
}: {
  keys: UserApiKeyMeta[];
  keyOk: (provider: ApiKeyProvider) => boolean;
  value: ModelId | null;
  onSaved: (id: ModelId) => Promise<void>;
}) {
  const { getToken } = useAuth();
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [local, setLocal] = useState<ModelId | null>(value);
  const [freeModels, setFreeModels] = useState<CatalogModel[]>(() => mergeFreeModels([]));
  const [cursorModels, setCursorModels] = useState<CatalogModel[]>(() =>
    mergeCursorModels([])
  );
  const [keyUsage, setKeyUsage] = useState<string | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  useEffect(() => {
    setLocal(value);
  }, [value]);

  const anyKey =
    keyOk("anthropic") ||
    keyOk("openai") ||
    keyOk("gemini") ||
    keyOk("openrouter") ||
    keyOk("cursor");

  const syncLive = async () => {
    setSyncing(true);
    setSyncNote(null);
    const tokenGetter = async () => (await getToken()) ?? null;
    const notes: string[] = [];
    if (keyOk("openrouter")) {
      try {
        const data = await fetchOpenRouterFreeModels(tokenGetter);
        setFreeModels(mergeFreeModels(data.models as OpenRouterFreeModelRow[]));
        try {
          const status = await fetchOpenRouterKeyStatus(tokenGetter);
          if (status.usage != null || status.limit != null) {
            setKeyUsage(
              `${status.usage ?? "—"}` +
                (status.limit != null ? ` / ${status.limit}` : "") +
                (status.isFreeTier ? " · free tier" : "")
            );
          }
        } catch {
          // optional
        }
      } catch (err: unknown) {
        notes.push(err instanceof Error ? err.message : "OpenRouter sync failed");
        setFreeModels(mergeFreeModels([]));
      }
    }
    if (keyOk("cursor")) {
      try {
        const data = await fetchCursorModels(tokenGetter);
        setCursorModels(mergeCursorModels(data.models));
      } catch (err: unknown) {
        notes.push(err instanceof Error ? err.message : "Cursor sync failed");
        setCursorModels(mergeCursorModels([]));
      }
    }
    setSyncNote(notes.length ? notes.join(" · ") : null);
    setSyncing(false);
  };

  useEffect(() => {
    if (!anyKey) return;
    void syncLive();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    keyOk("anthropic"),
    keyOk("openai"),
    keyOk("gemini"),
    keyOk("openrouter"),
    keyOk("cursor"),
  ]);

  if (!anyKey) {
    return (
      <Card className="border-dashed bg-white/70">
        <CardContent className="p-5 text-sm text-neutral-500">
          Add a valid API key above to choose a default Water model.
        </CardContent>
      </Card>
    );
  }

  const staticBy = (provider: ApiKeyProvider) =>
    MODEL_CATALOG.filter((m) => m.kind === "code" && m.provider === provider && !m.comingSoon);

  const sections: { title: string; models: CatalogModel[]; showVision?: boolean }[] = [];
  if (keyOk("cursor")) {
    sections.push({ title: "Cursor", models: cursorModels });
  }
  if (keyOk("openrouter")) {
    sections.push({
      title: "OpenRouter Free",
      models: freeModels.length ? freeModels : mergeFreeModels([]),
      showVision: true,
    });
    sections.push({ title: "OpenRouter Paid", models: OPENROUTER_MODELS });
  }
  if (keyOk("anthropic")) {
    sections.push({ title: "Anthropic", models: staticBy("anthropic") });
  }
  if (keyOk("openai")) {
    sections.push({ title: "OpenAI", models: staticBy("openai") });
  }
  if (keyOk("gemini")) {
    sections.push({ title: "Google", models: staticBy("gemini") });
  }

  const selected = local || sections[0]?.models[0]?.id || "cursor-auto";

  return (
    <Card>
      <CardContent className="p-5 space-y-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">
              Default Water model
            </h2>
            <p className="mt-0.5 text-[12px] text-neutral-500">
              Used when the workspace opens. The Engine picker saves the same preference.
            </p>
          </div>
          {(keyOk("openrouter") || keyOk("cursor")) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 shrink-0 rounded-lg gap-1.5 text-xs"
              disabled={syncing}
              onClick={() => void syncLive()}
            >
              {syncing ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <RefreshCw className="h-3.5 w-3.5" />
              )}
              Sync
            </Button>
          )}
        </div>

        {(keyUsage || syncNote) && (
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-neutral-500">
            {keyUsage && (
              <span className="rounded-md bg-neutral-100 px-2 py-1 font-medium text-neutral-700">
                OpenRouter {keyUsage}
              </span>
            )}
            {syncNote && <span className="text-amber-700">{syncNote}</span>}
          </div>
        )}

        {sections.map((s) => (
          <ModelGrid
            key={s.title}
            title={s.title}
            models={s.models}
            selected={selected}
            onSelect={setLocal}
            showVision={s.showVision}
          />
        ))}

        <Button
          type="button"
          className="h-10 rounded-xl"
          disabled={saving || !selected || selected === value}
          onClick={async () => {
            if (!selected) return;
            setSaving(true);
            try {
              await onSaved(selected);
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save default"}
        </Button>
      </CardContent>
    </Card>
  );
}

function ModelGrid({
  title,
  models,
  selected,
  onSelect,
  showVision,
}: {
  title: string;
  models: CatalogModel[];
  selected: ModelId;
  onSelect: (id: ModelId) => void;
  showVision?: boolean;
}) {
  return (
    <div>
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
        {title}
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {models.map((m) => {
          const active = selected === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m.id)}
              className={cn(
                "rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                active
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
              )}
            >
              <span className="flex items-center gap-1.5 font-medium">
                <span className="truncate">{m.label}</span>
                {showVision && m.vision && (
                  <span
                    className={cn(
                      "shrink-0 rounded px-1 py-0.5 text-[9px] font-semibold uppercase tracking-wide",
                      active ? "bg-white/15 text-white/90" : "bg-neutral-100 text-neutral-600"
                    )}
                  >
                    vision
                  </span>
                )}
              </span>
              <span
                className={cn(
                  "mt-0.5 block truncate text-[10px]",
                  active ? "text-white/65" : "text-neutral-400"
                )}
              >
                {m.cursorModelId || m.openRouterSlug || m.id}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
