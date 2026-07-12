"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  fetchHistory,
  deleteJob,
  getProxiedImageUrl,
  type BackendJob,
} from "../../../lib/api";
import {
  Download,
  X,
  ImageIcon,
  Trash2,
  Sparkles,
  Wand2,
  Layers,
  Plus,
} from "lucide-react";
import { cn } from "../../../lib/utils";

type FilterTab = "all" | "TextToImage" | "EditImage" | "Combined";

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "TextToImage", label: "Text" },
  { id: "EditImage", label: "Edit" },
  { id: "Combined", label: "Combined" },
];

const IMAGE_GENERATE_TYPES = new Set(["TextToImage", "EditImage", "Combined"]);

function pickImageUrl(job: BackendJob): string | null {
  return getProxiedImageUrl(job.previewImageUrl || job.imageUrl);
}

function proxiedSource(url: string | null | undefined): string | null {
  return getProxiedImageUrl(url ?? null);
}

function typeLabel(t: string): { label: string; icon: typeof Sparkles } {
  if (t === "EditImage") return { label: "Edit", icon: Wand2 };
  if (t === "Combined") return { label: "Combined", icon: Layers };
  return { label: "Text", icon: Sparkles };
}

function shortPrompt(p: string | null, n = 60): string {
  if (!p) return "Untitled image";
  return p.length > n ? `${p.slice(0, n)}…` : p;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
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

function ImageCard({
  job,
  onSelect,
}: {
  job: BackendJob;
  onSelect: () => void;
}) {
  const url = pickImageUrl(job);
  const { label, icon: Icon } = typeLabel(job.generateType);
  const title = shortPrompt(job.prompt, 40);

  return (
    <div className="group relative min-w-0">
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left outline-none"
      >
        <div className="relative aspect-square rounded-[20px] overflow-hidden bg-gradient-to-b from-neutral-100 to-neutral-50 border border-neutral-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.1)] transition-all duration-300 ease-out group-hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.18)] group-hover:-translate-y-0.5">
          {url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-white/80 border border-neutral-200/80 flex items-center justify-center shadow-sm">
                <ImageIcon className="w-6 h-6 text-neutral-400" strokeWidth={1.5} />
              </div>
            </div>
          )}

          <div className="absolute top-2.5 left-2.5">
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-md border border-white/60 text-[10px] font-semibold text-neutral-700 shadow-sm">
              <Icon className="w-3 h-3" strokeWidth={2.25} />
              {label}
            </span>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/[0.06] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
        </div>

        <div className="mt-3 px-0.5">
          <p className="font-semibold text-[14px] text-neutral-900 tracking-tight truncate">
            {title}
          </p>
          <p className="mt-0.5 text-[12px] text-neutral-500">{label}</p>
        </div>
      </button>
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
  const url = pickImageUrl(job);
  const { label, icon: Icon } = typeLabel(job.generateType);
  const sources =
    job.sourceImages && job.sourceImages.length > 0
      ? job.sourceImages
      : job.imageUrl
        ? [job.imageUrl]
        : [];
  const [deleting, setDeleting] = useState(false);

  const handleDownload = useCallback(() => {
    if (!url) return;
    const ext = (url.split("?")[0].split(".").pop() || "png").toLowerCase();
    const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "png";
    downloadImage(url, `hydrilla-${job.id.slice(0, 8)}.${safeExt}`);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white/95 backdrop-blur-xl rounded-[22px] shadow-[0_24px_80px_-16px_rgba(0,0,0,0.28)] border border-neutral-200/60 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between shrink-0 px-5 py-3.5 border-b border-neutral-100/80">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 items-center gap-2 px-3 rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="text-sm font-medium">Close</span>
          </button>
          <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-neutral-900/[0.05] text-neutral-700 text-[12px] font-medium">
            <Icon className="w-3.5 h-3.5" />
            {label}
          </span>
        </div>

        <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden">
          <div className="flex-1 min-h-[260px] bg-neutral-50 flex items-center justify-center p-5 overflow-hidden">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={shortPrompt(job.prompt, 80)}
                className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_8px_30px_-12px_rgba(0,0,0,0.2)]"
              />
            ) : (
              <div className="text-neutral-500 text-sm">No image available</div>
            )}
          </div>

          <div className="w-full sm:w-72 shrink-0 flex flex-col gap-4 p-5 border-t sm:border-t-0 sm:border-l border-neutral-100/80 overflow-y-auto">
            <div>
              <h2 className="text-[15px] font-semibold text-neutral-900 tracking-tight leading-snug">
                {shortPrompt(job.prompt, 80)}
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
                    const proxied = proxiedSource(src) || src;
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

export default function ImagePage() {
  const { getToken, isSignedIn } = useAuth();
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedJob, setSelectedJob] = useState<BackendJob | null>(null);

  const loadImages = useCallback(async () => {
    if (!isSignedIn) {
      setJobs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const tokenGetter = async () => await getToken();
      const all = await fetchHistory(tokenGetter);
      const imageOnly = all.filter((j) => {
        const hasImage = !!(j.previewImageUrl || j.imageUrl);
        const isImageType = IMAGE_GENERATE_TYPES.has(j.generateType);
        const hasMesh = !!j.resultGlbUrl;
        return hasImage && isImageType && !hasMesh && j.status === "DONE";
      });
      imageOnly.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setJobs(imageOnly);
    } catch {
      setJobs([]);
    }
    setLoading(false);
  }, [isSignedIn, getToken]);

  useEffect(() => {
    loadImages();
  }, [loadImages]);

  const filteredJobs = useMemo(() => {
    if (filter === "all") return jobs;
    return jobs.filter((j) => j.generateType === filter);
  }, [jobs, filter]);

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        const tokenGetter = async () => await getToken();
        await deleteJob(id, tokenGetter);
        setJobs((prev) => prev.filter((j) => j.id !== id));
      } catch (err) {
        window.alert(
          (err as Error)?.message || "Failed to delete image. Please try again.",
        );
      }
    },
    [getToken],
  );

  return (
    <div className="app-content-page font-dm-sans bg-[#fafafa]">
      <section className="flex flex-col gap-8 sm:gap-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-medium text-neutral-400 tracking-[0.14em] uppercase">
              Library
            </p>
            <h1 className="mt-1.5 text-[28px] sm:text-[34px] font-semibold text-neutral-900 tracking-[-0.03em] leading-[1.1]">
              Images
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              {loading
                ? "Loading your images…"
                : `${filteredJobs.length} image${filteredJobs.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="inline-flex h-10 items-center rounded-full border border-neutral-200/80 bg-white/80 p-1 gap-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] overflow-x-auto max-w-full">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "h-8 px-3 sm:px-3.5 rounded-full text-[12px] sm:text-[13px] font-medium transition-colors whitespace-nowrap",
                  filter === tab.id
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:text-neutral-800"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-[20px] bg-neutral-200/70" />
                <div className="mt-3 h-3.5 w-2/3 rounded-full bg-neutral-200/70" />
                <div className="mt-2 h-3 w-1/3 rounded-full bg-neutral-200/50" />
              </div>
            ))}
          </div>
        ) : !isSignedIn ? (
          <div className="rounded-[24px] border border-neutral-200/70 bg-white py-24 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <p className="text-[17px] font-semibold text-neutral-900 tracking-tight mb-1.5">
              Sign in to view your images
            </p>
            <p className="text-sm text-neutral-500">
              Your generated images will appear here.
            </p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-[24px] border border-neutral-200/70 bg-white py-24 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-5">
              <ImageIcon className="w-7 h-7 text-neutral-400" strokeWidth={1.5} />
            </div>
            <p className="text-[17px] font-semibold text-neutral-900 tracking-tight mb-1.5">
              {filter === "all"
                ? "No images yet"
                : `No ${filterTabs.find((t) => t.id === filter)?.label.toLowerCase()} images yet`}
            </p>
            <p className="text-sm text-neutral-500 mb-6">
              Generate images in Studio to see them here.
            </p>
            <Link
              href="/app/studio"
              className="inline-flex items-center gap-1.5 h-10 px-5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-full transition-colors"
            >
              <Plus className="w-4 h-4" />
              Go to Studio
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {filteredJobs.map((job) => (
              <ImageCard
                key={job.id}
                job={job}
                onSelect={() => setSelectedJob(job)}
              />
            ))}
          </div>
        )}
      </section>

      {selectedJob && (
        <ImageDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
