"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import {
  fetchHistory,
  fetchWaterJob,
  deleteJob,
  getProxyGlbUrl,
  getProxiedImageUrl,
  downloadGlbWithAuth,
  type BackendJob,
} from "../../../lib/api";
import {
  Download,
  X,
  Box,
  Plus,
  Code2,
  ImageIcon,
  Trash2,
  Sparkles,
  Wand2,
  Search,
} from "lucide-react";
import { cn } from "../../../lib/utils";
import { isWaterJob } from "../../../lib/engines";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";

const ThreeViewer = dynamic(
  () => import("../../../components/ThreeViewer").then((m) => ({ default: m.ThreeViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-neutral-50 rounded-2xl">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
      </div>
    ),
  }
);

const WaterViewer = dynamic(
  () =>
    import("../../../components/WaterViewer").then((m) => ({ default: m.WaterViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#f4f4f5] rounded-2xl">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
      </div>
    ),
  }
);

type AssetTab = "all" | "mesh" | "code" | "images";
type ImageSubFilter = "all" | "TextToImage" | "EditImage";

const tabs: { id: AssetTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "mesh", label: "3D Mesh" },
  { id: "code", label: "Water" },
  { id: "images", label: "Images" },
];

const imageSubTabs: { id: ImageSubFilter; label: string }[] = [
  { id: "all", label: "All images" },
  { id: "TextToImage", label: "Generated" },
  { id: "EditImage", label: "Edited" },
];

const IMAGE_GENERATE_TYPES = new Set(["TextToImage", "EditImage", "Combined"]);

const isWaterAsset = (job: BackendJob): boolean => isWaterJob(job);

const isMeshAsset = (job: BackendJob): boolean =>
  !isWaterAsset(job) && Boolean(job.resultGlbUrl) && job.status !== "FAIL";

const isImageAsset = (job: BackendJob): boolean =>
  !isWaterAsset(job) &&
  !job.resultGlbUrl &&
  IMAGE_GENERATE_TYPES.has(job.generateType) &&
  Boolean(job.previewImageUrl || job.imageUrl) &&
  job.status === "DONE";

function imageSubType(t: string): "TextToImage" | "EditImage" {
  return t === "EditImage" || t === "Combined" ? "EditImage" : "TextToImage";
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

async function downloadImage(url: string, filename: string): Promise<void> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(objectUrl);
  } catch {
    window.open(url, "_blank", "noopener");
  }
}

function getAssetBadge(job: BackendJob): { label: string; icon: typeof Box } {
  if (isWaterAsset(job)) return { label: "Water", icon: Code2 };
  if (isMeshAsset(job)) return { label: "3D Mesh", icon: Box };
  if (imageSubType(job.generateType) === "EditImage") return { label: "Edited", icon: Wand2 };
  return { label: "Image", icon: Sparkles };
}

function AssetCard({ job, onSelect }: { job: BackendJob; onSelect: () => void }) {
  const code = isWaterAsset(job);
  const image = isImageAsset(job);
  const previewUrl = getProxiedImageUrl(job.previewImageUrl || job.imageUrl);
  const { label, icon: BadgeIcon } = getAssetBadge(job);
  const fallbackTitle = code ? "Water Scene" : image ? "Untitled image" : "3D Model";
  const title = job.prompt
    ? job.prompt.slice(0, 42) + (job.prompt.length > 42 ? "…" : "")
    : fallbackTitle;

  return (
    <div className="group relative min-w-0">
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        className="w-full text-left outline-none cursor-pointer"
      >
        <div className="relative aspect-square rounded-[20px] overflow-hidden bg-gradient-to-b from-neutral-100 to-neutral-50 border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] transition-all duration-300 ease-out group-hover:shadow-[0_2px_6px_rgba(0,0,0,0.05),0_16px_40px_-16px_rgba(0,0,0,0.18)] group-hover:-translate-y-0.5">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
              {code ? (
                <Code2 className="w-7 h-7" strokeWidth={1.5} />
              ) : image ? (
                <ImageIcon className="w-7 h-7" strokeWidth={1.5} />
              ) : (
                <Box className="w-7 h-7" strokeWidth={1.5} />
              )}
            </div>
          )}

          {/* Type badge */}
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-black/[0.06] text-[10px] font-semibold text-neutral-700 shadow-xs">
              <BadgeIcon className="w-3 h-3" strokeWidth={2.1} />
              {label}
            </span>
          </div>

          {/* Live / failed status indicator */}
          {(job.status === "RUN" || job.status === "WAIT" || job.status === "FAIL") && (
            <span
              className={cn(
                "absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-sm",
                job.status === "FAIL" ? "bg-red-500" : "bg-amber-400 animate-pulse"
              )}
            />
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/[0.05] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>

        <div className="mt-2.5 px-0.5">
          <p className="font-semibold text-[13px] text-neutral-900 tracking-tight truncate">
            {title}
          </p>
          <p className="mt-0.5 text-[11px] text-neutral-400">
            {label}
            {job.createdAt ? ` · ${formatDate(job.createdAt)}` : ""}
          </p>
        </div>
      </div>
    </div>
  );
}

function ImageDetailModal({
  job,
  onClose,
  onDelete,
}: {
  job: BackendJob;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const url = getProxiedImageUrl(job.previewImageUrl || job.imageUrl);
  const { label, icon: Icon } = getAssetBadge(job);
  const sources =
    job.sourceImages && job.sourceImages.length > 0
      ? job.sourceImages
      : job.imageUrl
        ? [job.imageUrl]
        : [];
  const [deleting, setDeleting] = useState(false);
  const title = job.prompt
    ? job.prompt.slice(0, 80) + (job.prompt.length > 80 ? "…" : "")
    : "Untitled image";

  const handleDownload = useCallback(() => {
    if (!url) return;
    const ext = (url.split("?")[0].split(".").pop() || "png").toLowerCase();
    const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "png";
    void downloadImage(url, `hydrilla-${job.id.slice(0, 8)}.${safeExt}`);
  }, [url, job.id]);

  const handleDelete = useCallback(async () => {
    if (deleting) return;
    if (!window.confirm("Delete this image? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await onDelete(job.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  }, [deleting, onDelete, job.id, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] shadow-[0_24px_80px_-16px_rgba(0,0,0,0.28)] border border-neutral-200/70 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between shrink-0 px-5 py-3.5 border-b border-neutral-100">
          <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-neutral-900/[0.05] text-neutral-700 text-[12px] font-medium">
            <Icon className="w-3.5 h-3.5" />
            {label}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden">
          <div className="flex-1 min-h-[260px] bg-neutral-50 flex items-center justify-center p-5 overflow-hidden">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={title}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.2)]"
              />
            ) : (
              <div className="text-neutral-500 text-sm">No image available</div>
            )}
          </div>

          <div className="w-full sm:w-72 shrink-0 flex flex-col gap-4 p-5 border-t sm:border-t-0 sm:border-l border-neutral-100 overflow-y-auto">
            <div>
              <h2 className="text-[15px] font-semibold text-neutral-900 tracking-tight leading-snug">
                {title}
              </h2>
              <p className="text-[12px] text-neutral-500 mt-1">
                {formatDate(job.createdAt)}
              </p>
            </div>

            {job.prompt && (
              <div>
                <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.12em] mb-1.5">
                  Prompt
                </p>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                  {job.prompt}
                </p>
              </div>
            )}

            {sources.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.12em] mb-1.5">
                  Source {sources.length > 1 ? "images" : "image"}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {sources.slice(0, 4).map((src, i) => {
                    const proxied = getProxiedImageUrl(src) || src;
                    return (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={`${src}-${i}`}
                        src={proxied}
                        alt={`Source ${i + 1}`}
                        className="aspect-square w-full object-cover rounded-xl border border-neutral-200/70 bg-neutral-50"
                      />
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 mt-auto pt-2">
              <button
                type="button"
                onClick={handleDownload}
                disabled={!url}
                className="inline-flex items-center justify-center gap-2 w-full h-10 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center gap-2 w-full h-10 rounded-full border border-neutral-200 text-neutral-600 text-sm font-medium hover:bg-neutral-50 hover:text-red-600 hover:border-red-200 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AssetDetailModal({
  job,
  onClose,
  onDelete,
}: {
  job: BackendJob;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
}) {
  const { getToken } = useAuth();
  const code = isWaterAsset(job);
  const thumbSeed =
    (job.previewImageUrl && job.previewImageUrl !== "__present__" ? job.previewImageUrl : null) ||
    job.imageUrl ||
    (job.sourceImages && job.sourceImages[0]) ||
    null;

  const [factoryCode, setFactoryCode] = useState<string | null>(
    job.factoryCode && job.factoryCode !== "__present__" ? job.factoryCode : null
  );
  const [thumbnail, setThumbnail] = useState<string | null>(thumbSeed);
  const [deleting, setDeleting] = useState(false);
  const glbUrl = getProxyGlbUrl(job.id);
  const title = job.prompt
    ? job.prompt.slice(0, 80) + (job.prompt.length > 80 ? "…" : "")
    : code
      ? "Water Scene"
      : "3D Model";

  useEffect(() => {
    if (!code || factoryCode) return;
    void (async () => {
      try {
        const tokenGetter = async () => (await getToken()) ?? null;
        const cs = await fetchWaterJob(job.id, tokenGetter);
        if (cs.factoryCode) setFactoryCode(cs.factoryCode);
      } catch {
        // leave preview empty
      }
    })();
  }, [code, factoryCode, job.id, getToken]);

  const handleDelete = async () => {
    if (deleting) return;
    if (!window.confirm("Delete this asset? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await onDelete(job.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/35 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[24px] shadow-[0_24px_80px_-16px_rgba(0,0,0,0.28)] border border-neutral-200/70 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between shrink-0 px-5 sm:px-6 py-4">
          <div className="min-w-0 pr-4">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
              {code ? "Water" : "3D Mesh"}
            </p>
            <h2 className="mt-1 text-[17px] sm:text-[18px] font-semibold text-neutral-900 tracking-tight truncate">
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!code && (
              <Button
                type="button"
                size="sm"
                className="h-9 rounded-full px-4"
                onClick={() => {
                  void downloadGlbWithAuth(
                    glbUrl,
                    `hydrilla-${job.id}.glb`,
                    async () => (await getToken()) ?? null
                  ).catch((err) => {
                    console.error(err);
                    alert(err instanceof Error ? err.message : "Failed to download model");
                  });
                }}
              >
                <span className="inline-flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" />
                  GLB
                </span>
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={deleting}
              onClick={() => void handleDelete()}
              className="h-9 w-9 p-0 rounded-full text-neutral-500 hover:text-red-600"
              aria-label="Delete asset"
              title="Delete asset"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-9 w-9 p-0 rounded-full text-neutral-500"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex-1 min-h-0 px-5 sm:px-6 pb-5 sm:pb-6">
          <div className="h-[min(58vh,480px)] rounded-[20px] overflow-hidden bg-neutral-50 border border-neutral-200/70">
            {code ? (
              factoryCode ? (
                <WaterViewer
                  factoryCode={factoryCode}
                  jobId={job.id}
                  className="h-full w-full"
                  onThumbnail={(d) => setThumbnail(d)}
                />
              ) : thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={thumbnail} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <div className="h-8 w-8 rounded-full border-2 border-neutral-200 border-t-neutral-800 animate-spin" />
                </div>
              )
            ) : (
              <ThreeViewer glbUrl={glbUrl} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AssetsPage() {
  const { getToken, isSignedIn } = useAuth();
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<AssetTab>("all");
  const [imageFilter, setImageFilter] = useState<ImageSubFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<BackendJob | null>(null);

  useEffect(() => {
    const asked = new URLSearchParams(window.location.search).get("tab");
    if (asked === "images" || asked === "mesh" || asked === "code") {
      setTab(asked);
    }
  }, []);

  const loadAssets = useCallback(async () => {
    if (!isSignedIn) {
      setJobs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const tokenGetter = async () => await getToken();
      const all = await fetchHistory(tokenGetter);
      const valid = all.filter((j) => {
        if (isMeshAsset(j)) return true;
        if (isWaterAsset(j)) return j.status === "DONE" || j.status === "RUN" || j.status === "WAIT";
        if (isImageAsset(j)) return true;
        return false;
      });
      valid.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setJobs(valid);
    } catch {
      setJobs([]);
    }
    setLoading(false);
  }, [isSignedIn, getToken]);

  useEffect(() => {
    void loadAssets();
  }, [loadAssets]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const tokenGetter = async () => await getToken();
        await deleteJob(id, tokenGetter);
        setJobs((prev) => prev.filter((j) => j.id !== id));
      } catch (err) {
        window.alert((err as Error)?.message || "Failed to delete asset. Please try again.");
      }
    },
    [getToken]
  );

  const counts = useMemo(
    () => ({
      all: jobs.length,
      mesh: jobs.filter(isMeshAsset).length,
      code: jobs.filter(isWaterAsset).length,
      images: jobs.filter(isImageAsset).length,
    }),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return jobs.filter((j) => {
      if (tab === "mesh" && !isMeshAsset(j)) return false;
      if (tab === "code" && !isWaterAsset(j)) return false;
      if (tab === "images") {
        if (!isImageAsset(j)) return false;
        if (imageFilter !== "all" && imageSubType(j.generateType) !== imageFilter) {
          return false;
        }
      }
      if (q && !(j.prompt || "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [jobs, tab, imageFilter, searchQuery]);

  return (
    <div className="app-content-page font-dm-sans bg-[var(--app-canvas)]">
      <section className="flex flex-col gap-6 sm:gap-8">
        {/* Header & Primary Filter Controls */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-medium text-neutral-400 tracking-[0.14em] uppercase">
              Library
            </p>
            <h1 className="mt-1.5 text-[28px] sm:text-[34px] font-semibold text-neutral-900 tracking-[-0.03em] leading-[1.1]">
              Assets
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              {loading
                ? "Loading your library…"
                : `${filteredJobs.length} ${filteredJobs.length === 1 ? "item" : "items"} in your library`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search input */}
            <div className="relative flex-1 sm:flex-initial sm:w-56">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets…"
                className="h-10 w-full rounded-full border border-neutral-200/80 bg-white pl-9 pr-8 text-[13px] text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_2px_rgba(0,0,0,0.03)] outline-none transition-colors focus:border-neutral-400"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Category tabs */}
            <div className="inline-flex h-10 items-center rounded-full border border-neutral-200/80 bg-white p-1 gap-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-x-auto max-w-full">
              {tabs.map((t) => {
                const count = counts[t.id];
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id)}
                    className={cn(
                      "h-8 px-3.5 rounded-full text-[12px] sm:text-[13px] font-medium transition-colors whitespace-nowrap",
                      tab === t.id
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-500 hover:text-neutral-800"
                    )}
                  >
                    {t.label}
                    {count > 0 && (
                      <span
                        className={cn(
                          "ml-1.5 text-[10px] tabular-nums",
                          tab === t.id ? "text-white/70" : "text-neutral-400"
                        )}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Sub-filter when Images tab is active */}
        {tab === "images" && (
          <div className="flex items-center gap-1.5 -mt-2">
            {imageSubTabs.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setImageFilter(sub.id)}
                className={cn(
                  "h-7 px-3 rounded-full text-[12px] font-medium transition-colors border",
                  imageFilter === sub.id
                    ? "border-neutral-900 bg-neutral-900/5 text-neutral-900"
                    : "border-transparent text-neutral-500 hover:text-neutral-800 hover:bg-white/60"
                )}
              >
                {sub.label}
              </button>
            ))}
          </div>
        )}

        {/* Content Grid */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-[20px] bg-neutral-200/70" />
                <div className="mt-3 h-3.5 w-2/3 rounded-full bg-neutral-200/70" />
                <div className="mt-1.5 h-3 w-1/3 rounded-full bg-neutral-200/50" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-5">
                {tab === "code" ? (
                  <Code2 className="w-7 h-7 text-neutral-400" strokeWidth={1.5} />
                ) : tab === "images" ? (
                  <ImageIcon className="w-7 h-7 text-neutral-400" strokeWidth={1.5} />
                ) : (
                  <Box className="w-7 h-7 text-neutral-400" strokeWidth={1.5} />
                )}
              </div>
              <p className="text-[17px] font-semibold text-neutral-900 tracking-tight mb-1.5">
                {searchQuery
                  ? "No matching assets"
                  : tab === "code"
                    ? "No Water scenes yet"
                    : tab === "images"
                      ? "No images yet"
                      : "No assets yet"}
              </p>
              <p className="text-sm text-neutral-500 mb-6">
                {searchQuery
                  ? "Try a different keyword or filter."
                  : "Create 3D models, Water scenes, and images in Studio to see them here."}
              </p>
              <Button asChild className="h-10 px-5 rounded-full">
                <Link href="/app/studio" className="inline-flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  Go to Studio
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {filteredJobs.map((job) => (
              <AssetCard key={job.id} job={job} onSelect={() => setSelectedJob(job)} />
            ))}
          </div>
        )}
      </section>

      {selectedJob &&
        (isImageAsset(selectedJob) ? (
          <ImageDetailModal
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            onDelete={handleDelete}
          />
        ) : (
          <AssetDetailModal
            job={selectedJob}
            onClose={() => setSelectedJob(null)}
            onDelete={handleDelete}
          />
        ))}
    </div>
  );
}
