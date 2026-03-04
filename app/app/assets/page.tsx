"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import {
  fetchHistory,
  getProxyGlbUrl,
  type BackendJob,
} from "../../../lib/api";
import { Download, Share2, X, ImageIcon } from "lucide-react";

const ThreeViewer = dynamic(
  () => import("../../../components/ThreeViewer").then((m) => ({ default: m.ThreeViewer })),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center bg-neutral-100 rounded-xl"><div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-700 rounded-full animate-spin" /></div> }
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
  const previewUrl = job.previewImageUrl || job.imageUrl;
  const title = job.name || (job.prompt ? job.prompt.slice(0, 40) + (job.prompt.length > 40 ? "…" : "") : "3D Model");

  return (
    <div
      onClick={onSelect}
      className="group relative aspect-square rounded-2xl border border-neutral-200 bg-white shadow-sm hover:shadow-md hover:border-neutral-300 transition-all duration-200 overflow-hidden cursor-pointer"
    >
      <div className="absolute inset-0 flex items-center justify-center bg-neutral-50 p-4">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt=""
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-16 h-16 rounded-2xl bg-neutral-200 flex items-center justify-center">
            <ImageIcon className="w-8 h-8 text-neutral-400" />
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between gap-2">
        <span className="text-white text-sm font-medium truncate">{title}</span>
        <div className="flex items-center gap-1 shrink-0">
          <a
            href={getProxyGlbUrl(job.id)}
            download
            onClick={onDownload}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </a>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
            title="Share"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
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
  const sourceImage = job.imageUrl || (job.sourceImages && job.sourceImages[0]) || null;
  const title = job.name || (job.prompt ? job.prompt.slice(0, 60) + (job.prompt.length > 60 ? "…" : "") : "3D Model");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between shrink-0 px-5 py-3 border-b border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 transition-colors"
          >
            <X className="w-5 h-5" />
            <span className="text-sm font-medium">Close</span>
          </button>
          <div className="flex gap-2">
            {(["realistic", "clay", "mono"] as const).map((style) => (
              <button
                key={style}
                type="button"
                onClick={() => setViewStyle(style)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
                  viewStyle === style
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden">
          {/* Left: details + actions */}
          <div className="w-full sm:w-56 shrink-0 flex flex-col gap-4 p-5 border-b sm:border-b-0 sm:border-r border-neutral-100">
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 font-dm-sans truncate pr-2">
                {title}
              </h2>
              <p className="text-xs text-neutral-500 mt-1">Category · 3D Model</p>
            </div>
            {job.prompt && (
              <p className="text-sm text-neutral-600 line-clamp-3">{job.prompt}</p>
            )}
            {sourceImage && (
              <div>
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-2">Source image</p>
                <div className="rounded-xl border border-neutral-200 overflow-hidden bg-neutral-50 aspect-square max-w-[140px]">
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
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-neutral-900 text-white text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            </div>
          </div>

          {/* Right: 3D viewer */}
          <div className="flex-1 min-h-0 flex flex-col p-4">
            <div className="flex-1 min-h-[280px] h-[320px] sm:h-[360px] rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200">
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
    <div className="app-content-page font-dm-sans">
      {/* Page header – big and clear */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 flex-wrap">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight">
            3D Objects
          </h1>
          <p className="text-base text-neutral-500 mt-1">
            Your generated 3D models from Studio.
          </p>
        </div>
        <div className="flex rounded-full border border-neutral-200 bg-neutral-50/80 p-1.5 gap-0.5">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-colors ${
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

      {/* Content area */}
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-neutral-400" />
          </div>
          <p className="text-base font-medium text-neutral-600 mb-1">No 3D objects yet</p>
          <p className="text-sm text-neutral-500">
            Generate models in Studio to see them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
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

      {selectedJob && (
        <AssetDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}
    </div>
  );
}
