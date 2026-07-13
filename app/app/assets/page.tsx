"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import {
  fetchHistory,
  getProxyGlbUrl,
  getProxiedImageUrl,
  type BackendJob,
} from "../../../lib/api";
import { Download, Share2, X, Box, Plus } from "lucide-react";
import { cn } from "../../../lib/utils";

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

type FilterTab = "all" | "yours";

const filterTabs: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All Objects" },
  { id: "yours", label: "Yours" },
];

function AssetCard({
  job,
  onSelect,
  onDownload,
}: {
  job: BackendJob;
  onSelect: () => void;
  onDownload: (e: React.MouseEvent) => void;
}) {
  const previewUrl = getProxiedImageUrl(job.previewImageUrl || job.imageUrl);
  const title = job.prompt
    ? job.prompt.slice(0, 40) + (job.prompt.length > 40 ? "…" : "")
    : "3D Model";

  return (
    <div className="group relative min-w-0">
      <button
        type="button"
        onClick={onSelect}
        className="w-full text-left outline-none"
      >
        <div className="relative aspect-square rounded-[20px] overflow-hidden bg-gradient-to-b from-neutral-100 to-neutral-50 border border-neutral-200/60 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.1)] transition-all duration-300 ease-out group-hover:shadow-[0_2px_4px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.18)] group-hover:-translate-y-0.5">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-white/80 border border-neutral-200/80 flex items-center justify-center shadow-sm">
                <Box className="w-6 h-6 text-neutral-400" strokeWidth={1.5} />
              </div>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-x-0 bottom-0 p-3 flex items-end justify-between gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <span className="text-white text-[13px] font-medium truncate drop-shadow-sm">
              {title}
            </span>
            <div className="flex items-center gap-1 shrink-0">
              <a
                href={getProxyGlbUrl(job.id)}
                download
                onClick={onDownload}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-neutral-700 hover:bg-white transition-colors"
                title="Download"
                aria-label="Download"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur-md text-neutral-700 hover:bg-white transition-colors"
                title="Share"
                aria-label="Share"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-3 px-0.5">
          <p className="font-semibold text-[14px] text-neutral-900 tracking-tight truncate">
            {title}
          </p>
          <p className="mt-0.5 text-[12px] text-neutral-500">3D model</p>
        </div>
      </button>
    </div>
  );
}

function AssetDetailModal({
  job,
  onClose,
}: {
  job: BackendJob;
  onClose: () => void;
}) {
  const [viewStyle, setViewStyle] = useState<"realistic" | "clay" | "mono">("realistic");
  const glbUrl = getProxyGlbUrl(job.id);
  const sourceImage = getProxiedImageUrl(
    job.imageUrl || (job.sourceImages && job.sourceImages[0]) || null,
  );
  const title = job.prompt
    ? job.prompt.slice(0, 60) + (job.prompt.length > 60 ? "…" : "")
    : "3D Model";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="bg-white/95 backdrop-blur-xl rounded-[22px] shadow-[0_24px_80px_-16px_rgba(0,0,0,0.28)] border border-neutral-200/60 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
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
          <div className="inline-flex h-9 items-center rounded-full border border-neutral-200/70 bg-neutral-100/80 p-1 gap-0.5">
            {(["realistic", "clay", "mono"] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setViewStyle(style)}
                className={cn(
                  "h-7 px-3 rounded-full text-[12px] font-medium capitalize transition-colors",
                  viewStyle === style
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-800"
                )}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden">
          <div className="w-full sm:w-60 shrink-0 flex flex-col gap-4 p-5 border-b sm:border-b-0 sm:border-r border-neutral-100/80">
            <div>
              <h2 className="text-[17px] font-semibold text-neutral-900 tracking-tight truncate pr-2">
                {title}
              </h2>
              <p className="text-[12px] text-neutral-500 mt-1">3D model</p>
            </div>
            {job.prompt && (
              <p className="text-sm text-neutral-600 leading-relaxed line-clamp-4">
                {job.prompt}
              </p>
            )}
            {sourceImage && (
              <div>
                <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.12em] mb-2">
                  Source image
                </p>
                <div className="rounded-2xl border border-neutral-200/70 overflow-hidden bg-neutral-50 aspect-square max-w-[140px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sourceImage}
                    alt="Source"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
            <div className="flex flex-col gap-2 mt-auto pt-4">
              <a
                href={glbUrl}
                download
                className="inline-flex items-center justify-center gap-2 w-full h-10 rounded-full bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download GLB
              </a>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col p-4">
            <div className="flex-1 min-h-[280px] h-[320px] sm:h-[360px] rounded-[20px] overflow-hidden bg-neutral-50 border border-neutral-200/70">
              <ThreeViewer glbUrl={glbUrl} />
            </div>
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
  const [filter, setFilter] = useState<FilterTab>("all");
  const [selectedJob, setSelectedJob] = useState<BackendJob | null>(null);

  const loadAssets = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const tokenGetter = async () => await getToken();
      const all = await fetchHistory(tokenGetter);
      const withGlb = all.filter((j) => j.resultGlbUrl && j.status === "DONE");
      setJobs(withGlb);
    } catch {
      setJobs([]);
    }
    setLoading(false);
  }, [isSignedIn, getToken]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const filteredJobs = filter === "yours" ? jobs : jobs;

  return (
    <div className="app-content-page font-dm-sans bg-[#fafafa]">
      <section className="flex flex-col gap-8 sm:gap-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-medium text-neutral-400 tracking-[0.14em] uppercase">
              Library
            </p>
            <h1 className="mt-1.5 text-[28px] sm:text-[34px] font-semibold text-neutral-900 tracking-[-0.03em] leading-[1.1]">
              3D Objects
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              {loading
                ? "Loading your models…"
                : `${filteredJobs.length} model${filteredJobs.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="inline-flex h-10 items-center rounded-full border border-neutral-200/80 bg-white/80 p-1 gap-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    "h-8 px-3.5 sm:px-4 rounded-full text-[12px] sm:text-[13px] font-medium transition-colors",
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
        ) : filteredJobs.length === 0 ? (
          <div className="rounded-[24px] border border-neutral-200/70 bg-white py-24 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-5">
              <Box className="w-7 h-7 text-neutral-400" strokeWidth={1.5} />
            </div>
            <p className="text-[17px] font-semibold text-neutral-900 tracking-tight mb-1.5">
              No 3D objects yet
            </p>
            <p className="text-sm text-neutral-500 mb-6">
              Generate models in Studio to see them here.
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
              <AssetCard
                key={job.id}
                job={job}
                onSelect={() => setSelectedJob(job)}
                onDownload={(e) => e.stopPropagation()}
              />
            ))}
          </div>
        )}
      </section>

      {selectedJob && (
        <AssetDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}
