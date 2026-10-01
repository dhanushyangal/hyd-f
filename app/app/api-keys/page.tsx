"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  Key,
  Copy,
  Check,
  Trash2,
  Plus,
  ExternalLink,
  AlertCircle,
  Loader2,
  Code2,
  Terminal,
  ShieldCheck,
  Boxes,
  BarChart2,
  Zap,
  X,
} from "lucide-react";
import {
  fetchDeveloperApiKeys,
  fetchDeveloperKeyDetails,
  createDeveloperApiKey,
  revokeDeveloperApiKey,
  type DeveloperApiKeyMeta,
  type DeveloperApiKeyDetails,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ApiKeysPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [keys, setKeys] = useState<DeveloperApiKeyMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New key creation state
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creatingSubmitting, setCreatingSubmitting] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Single key deep dive modal state
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [keyDetails, setKeyDetails] = useState<DeveloperApiKeyDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  // Snippet language tab
  const [snippetLang, setSnippetLang] = useState<"curl" | "python" | "typescript">("curl");

  const loadKeys = async () => {
    if (!isSignedIn) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const tokenGetter = async () => {
        return (await getToken()) ?? null;
      };
      const data = await fetchDeveloperApiKeys(tokenGetter);
      setKeys(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const loadKeyDetails = async (keyId: string) => {
    setLoadingDetails(true);
    setDetailsError(null);
    try {
      const tokenGetter = async () => {
        return (await getToken()) ?? null;
      };
      const data = await fetchDeveloperKeyDetails(keyId, tokenGetter);
      setKeyDetails(data);
    } catch (err: unknown) {
      setDetailsError(err instanceof Error ? err.message : "Failed to load key details");
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }
    void loadKeys();
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    if (!selectedKeyId) {
      setKeyDetails(null);
      setDetailsError(null);
      return;
    }
    void loadKeyDetails(selectedKeyId);
  }, [selectedKeyId]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      return;
    }
    setCreatingSubmitting(true);
    setError(null);
    try {
      const tokenGetter = async () => {
        return (await getToken()) ?? null;
      };
      const res = await createDeveloperApiKey(newKeyName.trim(), tokenGetter);
      setNewlyCreatedKey(res.apiKey);
      setNewKeyName("");
      setIsCreating(false);
      void loadKeys();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create API key");
    } finally {
      setCreatingSubmitting(false);
    }
  };

  const handleRevoke = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key? This action cannot be undone.")) {
      return;
    }
    try {
      const tokenGetter = async () => {
        return (await getToken()) ?? null;
      };
      await revokeDeveloperApiKey(keyId, tokenGetter);
      void loadKeys();
      if (selectedKeyId === keyId) {
        void loadKeyDetails(keyId);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to revoke API key");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => {
      setCopiedKey(false);
    }, 2500);
  };

  const displayKeyPlaceholder = newlyCreatedKey || "hyd_live_your_api_key_here";

  const snippets = {
    curl: `curl -X POST https://api.hydrilla.ai/v1/3d/image-to-3d \\
  -H "Authorization: Bearer ${displayKeyPlaceholder}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "image_url": "https://example.com/character.png",
    "resolution": 1536
  }'`,
    python: `import requests

url = "https://api.hydrilla.ai/v1/3d/image-to-3d"
headers = {
    "Authorization": "Bearer ${displayKeyPlaceholder}",
    "Content-Type": "application/json"
}
payload = {
    "image_url": "https://example.com/character.png",
    "resolution": 1536
}

response = requests.post(url, json=payload, headers=headers)
task = response.json()
print("Task queued:", task["id"])`,
    typescript: `import fetch from "node-fetch";

const res = await fetch("https://api.hydrilla.ai/v1/3d/image-to-3d", {
  method: "POST",
  headers: {
    "Authorization": "Bearer ${displayKeyPlaceholder}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    image_url: "https://example.com/character.png",
    resolution: 1536
  })
});

const task = await res.json();
console.log("Task queued:", task.id);`,
  };

  return (
    <div className="app-content-page font-dm-sans bg-(--app-canvas) py-8 px-4 sm:px-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-neutral-400 tracking-[0.14em] uppercase">
                Developers
              </span>
              <span className="text-neutral-300">•</span>
              <Link
                href="https://docs.hydrilla.ai"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline"
              >
                docs.hydrilla.ai
                <ExternalLink className="h-3 w-3" />
              </Link>
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-[-0.03em]">
              API Keys
            </h1>
            <p className="mt-1 text-sm text-neutral-500">
              Manage developer secret keys to run Text-to-3D, Image-to-3D, and Image generation pipelines.
            </p>
          </div>

          <Button
            onClick={() => {
              setIsCreating(true);
            }}
            className="inline-flex items-center gap-2 bg-neutral-900 text-white hover:bg-neutral-800"
          >
            <Plus className="h-4 w-4" />
            Create Secret Key
          </Button>
        </header>

        {/* Global Error Banner */}
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Newly Created Key Alert */}
        {newlyCreatedKey && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-semibold text-sm">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Save your secret key
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Please copy your secret key right now and store it securely. For security reasons, you will not be able to view it again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white border border-emerald-200 rounded-lg px-3 py-2 text-xs font-mono text-neutral-900 break-all select-all">
                {newlyCreatedKey}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  copyToClipboard(newlyCreatedKey);
                }}
                className="shrink-0 bg-white border-emerald-300 text-emerald-900 hover:bg-emerald-100"
              >
                {copiedKey ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Create Key Form Modal/Card */}
        {isCreating && (
          <Card className="border-neutral-200 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <h2 className="text-base font-semibold text-neutral-900">Create new secret key</h2>
              <p className="text-xs text-neutral-500">
                Give your API key a name to identify where it is being used (e.g. Production Pipeline, Blender Addon).
              </p>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <form onSubmit={handleCreateKey} className="space-y-4">
                <div>
                  <label htmlFor="keyName" className="block text-xs font-medium text-neutral-700 mb-1">
                    Key Name
                  </label>
                  <Input
                    id="keyName"
                    value={newKeyName}
                    onChange={(e) => {
                      setNewKeyName(e.target.value);
                    }}
                    placeholder="e.g. Game Engine Pipeline"
                    autoFocus
                    required
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setIsCreating(false);
                    }}
                    disabled={creatingSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={creatingSubmitting || !newKeyName.trim()}>
                    {creatingSubmitting ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Generating…
                      </>
                    ) : (
                      "Create Secret Key"
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Keys List */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900">Active Keys</h2>
            <span className="text-xs text-neutral-500">
              Usage is measured strictly in credits consumed.
            </span>
          </div>

          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading API keys…
              </CardContent>
            </Card>
          ) : keys.length === 0 ? (
            <Card className="border-dashed border-neutral-300">
              <CardContent className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <div className="p-3 bg-neutral-100 rounded-full text-neutral-500">
                  <Key className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-800">No secret keys yet</h3>
                  <p className="text-xs text-neutral-500 max-w-sm mt-1">
                    Generate an API key to call Hydrilla AI from your backend, custom tools, or game engines.
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setIsCreating(true);
                  }}
                  variant="outline"
                  size="sm"
                >
                  Create your first key
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-[11px] uppercase tracking-wider text-neutral-400 border-b border-neutral-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Name</th>
                    <th className="px-4 py-3 font-semibold">Key</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Credits Used</th>
                    <th className="px-4 py-3 font-semibold">Requests</th>
                    <th className="px-4 py-3 font-semibold">Created</th>
                    <th className="px-4 py-3 font-semibold">Last Used</th>
                    <th className="px-4 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {keys.map((k) => (
                    <tr key={k.id} className="hover:bg-neutral-50/50">
                      <td className="px-4 py-3.5 font-medium text-neutral-900">{k.name}</td>
                      <td className="px-4 py-3.5 font-mono text-neutral-500">{k.keyPrefix}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                            k.status === "active"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-neutral-100 text-neutral-500"
                          }`}
                        >
                          {k.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-neutral-900 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <Zap className="h-3.5 w-3.5 text-amber-500" />
                          {k.totalCreditsUsed ?? 0} credits
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-neutral-600 font-medium">
                        {k.totalRequests ?? 0}
                      </td>
                      <td className="px-4 py-3.5 text-neutral-500">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-neutral-500">
                        {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : "Never"}
                      </td>
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedKeyId(k.id);
                            }}
                            className="h-7 px-2 text-xs text-neutral-700 hover:text-neutral-900 border-neutral-200"
                            title="View key analytics & logs"
                          >
                            <BarChart2 className="h-3.5 w-3.5 mr-1 text-neutral-500" />
                            Details
                          </Button>
                          {k.status === "active" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                handleRevoke(k.id);
                              }}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 px-2"
                              title="Revoke key"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Quickstart Code Snippets */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-2">
              <Code2 className="h-4 w-4 text-neutral-600" />
              Quickstart Example
            </h2>
            <div className="flex items-center rounded-lg border border-neutral-200 bg-white p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  setSnippetLang("curl");
                }}
                className={`px-2.5 py-1 rounded-md transition ${
                  snippetLang === "curl" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                cURL
              </button>
              <button
                type="button"
                onClick={() => {
                  setSnippetLang("python");
                }}
                className={`px-2.5 py-1 rounded-md transition ${
                  snippetLang === "python" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                Python
              </button>
              <button
                type="button"
                onClick={() => {
                  setSnippetLang("typescript");
                }}
                className={`px-2.5 py-1 rounded-md transition ${
                  snippetLang === "typescript" ? "bg-neutral-900 text-white" : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                TypeScript
              </button>
            </div>
          </div>

          <div className="relative rounded-xl border border-neutral-800 bg-neutral-950 p-4 text-neutral-100 shadow-sm font-mono text-xs overflow-x-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                copyToClipboard(snippets[snippetLang]);
              }}
              className="absolute top-2 right-2 text-neutral-400 hover:text-white hover:bg-neutral-800 h-7 px-2"
            >
              {copiedKey ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            </Button>
            <pre className="pr-12">{snippets[snippetLang]}</pre>
          </div>
        </section>

        {/* Endpoints & Models Reference Summary */}
        <section className="grid sm:grid-cols-2 gap-4">
          <Card className="border-neutral-200">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                <Boxes className="h-4 w-4 text-neutral-500" />
                Supported Models
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-xs text-neutral-600 space-y-2">
              <div>
                <span className="font-semibold text-neutral-900">BlueFox 3D (bluefox-1)</span>: 1536/1024 resolution image-to-3D mesh reconstruction with 4096 PBR maps.
              </div>
              <div>
                <span className="font-semibold text-neutral-900">OpenAI Images</span>: gpt-image-2.5-flare (low) and sunburst (high) for orthographic concept rendering.
              </div>
              <div>
                <span className="font-semibold text-neutral-900">Google Gemini Images</span>: gemini-3.1-flash-image and gemini-3-pro-image for 1K/2K generation.
              </div>
            </CardContent>
          </Card>

          <Card className="border-neutral-200">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-800">
                <Terminal className="h-4 w-4 text-neutral-500" />
                API Endpoints
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-xs text-neutral-600 space-y-1.5 font-mono">
              <div><span className="text-emerald-600 font-semibold">POST</span> /v1/3d/image-to-3d</div>
              <div><span className="text-emerald-600 font-semibold">POST</span> /v1/3d/text-to-3d</div>
              <div><span className="text-blue-600 font-semibold">GET</span> /v1/3d/tasks/:taskId</div>
              <div><span className="text-emerald-600 font-semibold">POST</span> /v1/images/generate</div>
              <div><span className="text-emerald-600 font-semibold">POST</span> /v1/images/edit</div>
              <div><span className="text-blue-600 font-semibold">GET</span> /v1/models &amp; /v1/user/me</div>
            </CardContent>
          </Card>
        </section>
      </div>

      {/* Single API Key Inspection Modal */}
      {selectedKeyId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => {
            setSelectedKeyId(null);
          }}
        >
          <div
            className="relative w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-neutral-50/70">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-neutral-900 text-white rounded-lg">
                  <Key className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-neutral-900">
                      {keyDetails?.key.name || "API Key Details"}
                    </h3>
                    {keyDetails && (
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          keyDetails.key.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-neutral-100 text-neutral-500 border border-neutral-200"
                        }`}
                      >
                        {keyDetails.key.status}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <code className="text-xs font-mono text-neutral-500">
                      {keyDetails?.key.keyPrefix || "Loading..."}
                    </code>
                    {keyDetails && (
                      <button
                        type="button"
                        onClick={() => {
                          copyToClipboard(keyDetails.key.keyPrefix);
                        }}
                        className="text-neutral-400 hover:text-neutral-700 text-xs inline-flex items-center gap-1"
                        title="Copy prefix"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedKeyId(null);
                }}
                className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {loadingDetails ? (
                <div className="flex flex-col items-center justify-center py-16 text-neutral-500 gap-3">
                  <Loader2 className="h-6 w-6 animate-spin text-neutral-900" />
                  <p className="text-sm">Loading credit analytics &amp; request logs...</p>
                </div>
              ) : detailsError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="space-y-2">
                    <p>{detailsError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (selectedKeyId) {
                          void loadKeyDetails(selectedKeyId);
                        }
                      }}
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ) : keyDetails ? (
                <>
                  {/* KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50">
                      <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                        Total Credits Used
                      </div>
                      <div className="mt-1 text-2xl font-bold text-neutral-900 flex items-center gap-1.5">
                        <Zap className="h-5 w-5 text-amber-500" />
                        {keyDetails.summary.totalCreditsUsed}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">credits consumed</div>
                    </div>

                    <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50">
                      <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                        Total Requests
                      </div>
                      <div className="mt-1 text-2xl font-bold text-neutral-900">
                        {keyDetails.summary.totalRequests}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">lifetime API calls</div>
                    </div>

                    <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50">
                      <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                        3D Pipeline
                      </div>
                      <div className="mt-1 text-2xl font-bold text-blue-600">
                        {keyDetails.summary.credits3d}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        credits ({keyDetails.summary.requests3d} tasks)
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50">
                      <div className="text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">
                        2D Image Gen
                      </div>
                      <div className="mt-1 text-2xl font-bold text-emerald-600">
                        {keyDetails.summary.credits2d}
                      </div>
                      <div className="text-[11px] text-neutral-400 mt-0.5">
                        credits ({keyDetails.summary.requests2d} calls)
                      </div>
                    </div>
                  </div>

                  {/* Key Metadata Row */}
                  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3.5 text-xs text-neutral-600 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <span className="text-neutral-400">Created:</span>{" "}
                      <span className="font-medium text-neutral-800">
                        {new Date(keyDetails.key.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="text-neutral-400">Last Used:</span>{" "}
                      <span className="font-medium text-neutral-800">
                        {keyDetails.key.lastUsedAt
                          ? new Date(keyDetails.key.lastUsedAt).toLocaleString()
                          : "Never"}
                      </span>
                    </div>
                    {keyDetails.key.status === "active" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          await handleRevoke(keyDetails.key.id);
                          setSelectedKeyId(null);
                        }}
                        className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-100"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Revoke this key
                      </Button>
                    )}
                  </div>

                  {/* Endpoint Breakdown */}
                  {Object.keys(keyDetails.summary.endpointCounts).length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                        Usage by Endpoint
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {Object.entries(keyDetails.summary.endpointCounts).map(([endpoint, stats]) => (
                          <div
                            key={endpoint}
                            className="p-3 rounded-lg border border-neutral-200 bg-white flex items-center justify-between text-xs"
                          >
                            <code className="font-mono text-neutral-800 font-medium">{endpoint}</code>
                            <div className="text-right">
                              <span className="font-semibold text-neutral-900">{stats.requests} calls</span>
                              <span className="text-neutral-400 mx-1">•</span>
                              <span className="text-amber-600 font-semibold">{stats.credits} credits</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent Request Logs */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                      Recent Activity Log ({keyDetails.recentLogs.length} events)
                    </h4>
                    {keyDetails.recentLogs.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-neutral-200 p-8 text-center text-xs text-neutral-500">
                        No requests recorded for this key yet. Calls made to the developer API will show here in real-time.
                      </div>
                    ) : (
                      <div className="rounded-xl border border-neutral-200 overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-neutral-50 text-[10px] uppercase tracking-wider text-neutral-400 border-b border-neutral-200">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Time</th>
                              <th className="px-3 py-2 font-semibold">Method &amp; Endpoint</th>
                              <th className="px-3 py-2 font-semibold">Status</th>
                              <th className="px-3 py-2 font-semibold">Credits</th>
                              <th className="px-3 py-2 font-semibold">Details</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-100 text-neutral-700">
                            {keyDetails.recentLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-neutral-50/50">
                                <td className="px-3 py-2 text-neutral-400 whitespace-nowrap text-[11px]">
                                  {new Date(log.createdAt).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    second: "2-digit",
                                  })}
                                </td>
                                <td className="px-3 py-2 font-mono whitespace-nowrap">
                                  <span
                                    className={`font-semibold mr-1.5 ${
                                      log.method === "POST" ? "text-emerald-600" : "text-blue-600"
                                    }`}
                                  >
                                    {log.method}
                                  </span>
                                  <span className="text-neutral-800">{log.endpoint}</span>
                                </td>
                                <td className="px-3 py-2">
                                  <span
                                    className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${
                                      log.statusCode >= 200 && log.statusCode < 300
                                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                        : log.statusCode === 402
                                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                                        : "bg-red-50 text-red-700 border border-red-200"
                                    }`}
                                  >
                                    {log.statusCode}
                                  </span>
                                </td>
                                <td className="px-3 py-2 font-semibold whitespace-nowrap">
                                  {log.creditsDeducted > 0 ? (
                                    <span className="text-amber-600 font-mono">
                                      -{log.creditsDeducted} credits
                                    </span>
                                  ) : (
                                    <span className="text-neutral-400 font-mono">0 credits</span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-neutral-500 text-[11px] truncate max-w-50">
                                  {log.details && Object.keys(log.details).length > 0 ? (
                                    <span>
                                      {String(
                                        log.details.model ||
                                          log.details.taskId ||
                                          log.details.prompt ||
                                          log.details.error ||
                                          JSON.stringify(log.details)
                                      )}
                                    </span>
                                  ) : (
                                    "—"
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-neutral-200 px-6 py-3 bg-neutral-50/70 flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedKeyId(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
