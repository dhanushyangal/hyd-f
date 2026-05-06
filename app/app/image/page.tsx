"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
} from "lucide-react";

type FilterTab = "all" | "TextToImage" | "EditImage" | "Combined";

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "TextToImage", label: "Text" },
  { id: "EditImage", label: "Edit" },
  { id: "Combined", label: "Combined" },
];

const IMAGE_GENERATE_TYPES = new Set(["TextToImage", "EditImage", "Combined"]);

function pickImageUrl(job: BackendJob): string | null {
  // Always proxy through the backend so private/expired S3 URLs still load.
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
    // Fallback: open in a new tab so the user can save manually.
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
    <div
      onClick={onSelect}
      className="group relative aspect-square rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md hover:border-neutral-300 transition-all duration-200 overflow-hidden cursor-pointer"
    >
      <div className="absolute inset-0 flex items-center justify-center bg-neutral-50">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-neutral-200 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-neutral-400" />
          </div>
        )}
      </div>

      <div className="absolute top-2 left-2">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-neutral-200 text-[11px] font-medium text-neutral-700 shadow-sm">
          <Icon className="w-3 h-3" />
          {label}
        </span>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between gap-2">
        <span className="text-white text-sm font-medium truncate">
          {title}
        </span>
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between shrink-0 px-5 py-3 border-b border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <X className="w-5 h-5" />
            <span className="text-sm font-medium">Close</span>
          </button>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 text-xs font-medium">
            <Icon className="w-3.5 h-3.5" />
            {label}
          </span>
        </div>

        <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden">
          <div className="flex-1 min-h-[260px] bg-neutral-100 flex items-center justify-center p-4 overflow-hidden">
            {url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={shortPrompt(job.prompt, 80)}
                className="max-w-full max-h-full object-contain rounded-xl"
              />
            ) : (
              <div className="text-neutral-500 text-sm">No image available</div>
            )}
          </div>

          <div className="w-full sm:w-72 shrink-0 flex flex-col gap-4 p-5 border-t sm:border-t-0 sm:border-l border-neutral-100 overflow-y-auto">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 leading-snug">
                {shortPrompt(job.prompt, 80)}
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                {formatDate(job.createdAt)}
              </p>
            </div>

            {job.prompt && (
              <div>
                <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
                  Prompt
                </p>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed">
                  {job.prompt}
                </p>
              </div>
            )}

            {sources.length > 0 && (
              <div>
                <p className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider mb-1.5">
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
                        className="aspect-square w-full object-cover rounded-lg border border-neutral-200 bg-neutral-50"
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
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-50 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
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
      // Image jobs only: completed, has a viewable image, and is not a 3D mesh job.
      const imageOnly = all.filter((j) => {
        const hasImage = !!(j.previewImageUrl || j.imageUrl);
        const isImageType = IMAGE_GENERATE_TYPES.has(j.generateType);
        const hasMesh = !!j.resultGlbUrl;
        return hasImage && isImageType && !hasMesh && j.status === "DONE";
      });
      // Newest first
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
    <div className="app-content-page font-dm-sans">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 flex-wrap min-w-0">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight truncate">
            Images
          </h1>
          <p className="text-sm sm:text-base text-neutral-500 mt-1">
            Your generated images from Studio.
          </p>
        </div>
        <div className="flex rounded-full border border-neutral-200 bg-neutral-50/80 p-1 sm:p-1.5 gap-0.5 shrink-0 overflow-x-auto">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                filter === tab.id
                  ? "bg-white text-neutral-900 shadow-sm border border-neutral-200/80"
                  : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-16 sm:py-24">
          <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
        </div>
      ) : !isSignedIn ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 py-16 sm:py-24 text-center">
          <p className="text-sm sm:text-base font-medium text-neutral-600 mb-1">
            Sign in to view your images
          </p>
          <p className="text-xs sm:text-sm text-neutral-500">
            Your generated images will appear here.
          </p>
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 py-16 sm:py-24 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <ImageIcon className="w-7 h-7 sm:w-8 sm:h-8 text-neutral-400" />
          </div>
          <p className="text-sm sm:text-base font-medium text-neutral-600 mb-1">
            {filter === "all"
              ? "No images yet"
              : `No ${filterTabs.find((t) => t.id === filter)?.label.toLowerCase()} images yet`}
          </p>
          <p className="text-xs sm:text-sm text-neutral-500">
            Generate images in Studio to see them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-6">
          {filteredJobs.map((job) => (
            <ImageCard
              key={job.id}
              job={job}
              onSelect={() => setSelectedJob(job)}
            />
          ))}
        </div>
      )}

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
