"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import dynamic from "next/dynamic";
import {
  fetchHistory,
  fetchWaterJob,
  getProxyGlbUrl,
  getProxiedImageUrl,
  downloadGlbWithAuth,
  type BackendJob,
} from "../../../lib/api";
import { Download, X, Box, Plus, Code2 } from "lucide-react";
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

type AssetTab = "all" | "mesh" | "code";

const tabs: { id: AssetTab; label: string }[] = [
  { id: "all", label: "All assets" },
  { id: "mesh", label: "Mesh" },
  { id: "code", label: "Water" },
];

const isWaterAsset = (job: BackendJob): boolean => isWaterJob(job);

function AssetCard({ job, onSelect }: { job: BackendJob; onSelect: () => void }) {
  const code = isWaterAsset(job);
  const previewUrl = getProxiedImageUrl(job.previewImageUrl || job.imageUrl);
  const title = job.prompt
    ? job.prompt.slice(0, 40) + (job.prompt.length > 40 ? "…" : "")
    : code
      ? "Water"
      : "3D Model";

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
            <div className="absolute inset-0 flex items-center justify-center text-neutral-300">
              {code ? (
                <Code2 className="w-7 h-7" strokeWidth={1.5} />
              ) : (
                <Box className="w-7 h-7" strokeWidth={1.5} />
              )}
            </div>
          )}

          {/* Only show status for live / failed */}
          {(job.status === "RUN" || job.status === "WAIT" || job.status === "FAIL") && (
            <span
              className={cn(
                "absolute left-2.5 top-2.5 h-2 w-2 rounded-full ring-2 ring-white shadow-sm",
                job.status === "FAIL" ? "bg-red-500" : "bg-amber-400 animate-pulse"
              )}
            />
          )}
        </div>
        <div className="mt-2.5 px-0.5">
          <p className="font-medium text-[13px] text-neutral-900 tracking-tight truncate">{title}</p>
          <p className="mt-0.5 text-[11px] text-neutral-400">{code ? "Water" : "Mesh"}</p>
        </div>
      </div>
    </div>
  );
}

function AssetDetailModal({ job, onClose }: { job: BackendJob; onClose: () => void }) {
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
  const glbUrl = getProxyGlbUrl(job.id);
  const title = job.prompt
    ? job.prompt.slice(0, 80) + (job.prompt.length > 80 ? "…" : "")
    : code
      ? "Water"
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
              {code ? "Water" : "3D mesh"}
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
            {/* Water: Download GLB / GLTF / OBJ / STL / PNG / .ts via WaterViewer toolbar */}
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
  const [selectedJob, setSelectedJob] = useState<BackendJob | null>(null);

  const loadAssets = useCallback(async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const tokenGetter = async () => await getToken();
      const all = await fetchHistory(tokenGetter);
      const assets = all.filter((j) => {
        if (j.status === "FAIL") return false;
        if (j.resultGlbUrl) return true;
        if (isWaterAsset(j)) return j.status === "DONE" || j.status === "RUN" || j.status === "WAIT";
        return false;
      });
      setJobs(assets);
    } catch {
      setJobs([]);
    }
    setLoading(false);
  }, [isSignedIn, getToken]);

  useEffect(() => {
    loadAssets();
  }, [loadAssets]);

  const filteredJobs = jobs.filter((j) => {
    if (tab === "mesh") return !isWaterAsset(j) && Boolean(j.resultGlbUrl);
    if (tab === "code") return isWaterAsset(j);
    return true;
  });

  const counts = {
    all: jobs.length,
    mesh: jobs.filter((j) => !isWaterAsset(j) && Boolean(j.resultGlbUrl)).length,
    code: jobs.filter(isWaterAsset).length,
  };

  return (
    <div className="app-content-page font-dm-sans bg-[#fafafa]">
      <section className="flex flex-col gap-6 sm:gap-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-medium text-neutral-400 tracking-[0.14em] uppercase">
              Library
            </p>
            <h1 className="mt-1.5 text-[28px] sm:text-[34px] font-semibold text-neutral-900 tracking-[-0.03em] leading-[1.1]">
              Assets
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              {loading
                ? "Loading your assets…"
                : `${filteredJobs.length} asset${filteredJobs.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="inline-flex h-10 items-center rounded-full border border-neutral-200/80 bg-white p-1 gap-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            {tabs.map((t) => {
              const count = counts[t.id];
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "h-8 px-3.5 sm:px-4 rounded-full text-[12px] sm:text-[13px] font-medium transition-colors",
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

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square rounded-[20px] bg-neutral-200/70" />
                <div className="mt-3 h-3.5 w-2/3 rounded-full bg-neutral-200/70" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-5">
                {tab === "code" ? (
                  <Code2 className="w-7 h-7 text-neutral-400" strokeWidth={1.5} />
                ) : (
                  <Box className="w-7 h-7 text-neutral-400" strokeWidth={1.5} />
                )}
              </div>
              <p className="text-[17px] font-semibold text-neutral-900 tracking-tight mb-1.5">
                {tab === "code" ? "No Water assets yet" : "No assets yet"}
              </p>
              <p className="text-sm text-neutral-500 mb-6">
                {tab === "code"
                  ? "Use a Water model in Studio to build procedural Three.js scenes."
                  : "Generate models in Studio to see them here."}
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

      {selectedJob && (
        <AssetDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
      )}
    </div>
  );
}
