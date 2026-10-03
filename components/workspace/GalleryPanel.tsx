"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Box,
  Image as ImageIcon,
  Library,
  PanelRightClose,
  Search,
  Sliders,
  Upload,
} from "lucide-react";
import { type BackendJob, unwrapProxiedImageUrl } from "@/lib/api";
import type { PartMaterial, ViewerLook } from "@/lib/viewer/look";
import type { ModelMeshStats } from "@/lib/viewer/meshStats";
import { AssetInspector } from "./AssetInspector";
import { displayImageUrl } from "./composer-parts";
import type { WorkspaceSection } from "./WorkspaceRail";
import { cn } from "@/lib/utils";

type Props = {
  workspaceName: string;
  onWorkspaceNameChange: (name: string) => void;
  activeSection: WorkspaceSection;
  images: BackendJob[];
  assets3D: BackendJob[];
  loading: boolean;
  onImageClick: (item: BackendJob) => void;
  on3DClick: (item: BackendJob) => void;
  isWaterJobFn: (item: BackendJob) => boolean;
  isOpen: boolean;
  onClose: () => void;
  inspectorKind: "empty" | "preview" | "3d" | "code";
  /** Changes whenever a different 3D asset loads in the viewer. */
  inspectorAssetKey: string;
  parts: string[];
  selectedPart: string | null;
  onSelectPart: (name: string) => void;
  look: ViewerLook;
  onLookChange: (patch: Partial<ViewerLook>) => void;
  partMaterial?: PartMaterial | null;
  onPartMaterial?: (patch: Partial<PartMaterial>) => void;
  onUploadFile?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  modelStats?: ModelMeshStats | null;
  className?: string;
};

export function GalleryPanel({
  workspaceName,
  onWorkspaceNameChange,
  activeSection,
  images,
  assets3D,
  loading,
  onImageClick,
  on3DClick,
  isWaterJobFn,
  isOpen,
  onClose,
  inspectorKind,
  inspectorAssetKey,
  parts,
  selectedPart,
  onSelectPart,
  look,
  onLookChange,
  partMaterial,
  onPartMaterial,
  onUploadFile,
  modelStats,
  className,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewTab, setViewTab] = useState<"gallery" | "inspector">("gallery");
  const [galleryFilter, setGalleryFilter] = useState<"auto" | "all" | "3d" | "images">("auto");

  // Filter items based on active section or explicit user selection
  const effectiveFilter = galleryFilter === "auto" ? activeSection : galleryFilter;

  const filteredItems = useMemo(() => {
    const list = (() => {
      if (effectiveFilter === "images" || effectiveFilter === "image") {
        return images.map((job) => ({ job, type: "image" as const }));
      }
      if (effectiveFilter === "agent") {
        return assets3D
          .filter((job) => isWaterJobFn(job))
          .map((job) => ({ job, type: "3d" as const }));
      }
      if (effectiveFilter === "model") {
        return assets3D
          .filter((job) => !isWaterJobFn(job))
          .map((job) => ({ job, type: "3d" as const }));
      }
      if (effectiveFilter === "edit") {
        return [
          ...assets3D.map((job) => ({ job, type: "3d" as const })),
          ...images.map((job) => ({ job, type: "image" as const })),
        ];
      }
      if (effectiveFilter === "3d") {
        return assets3D.map((job) => ({ job, type: "3d" as const }));
      }
      // "all"
      return [
        ...assets3D.map((job) => ({ job, type: "3d" as const })),
        ...images.map((job) => ({ job, type: "image" as const })),
      ];
    })();

    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return list;
    }

    return list.filter((item) => {
      const prompt = (item.job.prompt || "").toLowerCase();
      const id = (item.job.id || "").toLowerCase();
      return prompt.includes(query) || id.includes(query);
    });
  }, [effectiveFilter, images, assets3D, isWaterJobFn, searchQuery]);

  const hasInspector = inspectorKind === "3d" || inspectorKind === "code";

  useEffect(() => {
    if (hasInspector && inspectorAssetKey) {
      setViewTab("inspector");
    }
  }, [hasInspector, inspectorAssetKey]);

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      className={cn(
        "flex h-full w-[310px] shrink-0 flex-col overflow-hidden bg-white border-l border-neutral-200/80 text-neutral-900 select-none",
        className
      )}
    >
      {/* Top Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-200/80 px-3.5 py-3">
        <input
          type="text"
          value={workspaceName}
          onChange={(e) => onWorkspaceNameChange(e.target.value)}
          placeholder="Workspace Name"
          className="h-7 min-w-0 flex-1 bg-transparent px-1 text-[13px] font-semibold text-neutral-900 outline-none placeholder:text-neutral-400"
        />

        <div className="flex items-center gap-1">
          <Link
            href="/library"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            title="Open Full Library"
          >
            <Library className="h-4 w-4" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
            title="Collapse Panel"
          >
            <PanelRightClose className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs if 3D asset is open: Generations vs Inspector */}
      {hasInspector ? (
        <div className="flex shrink-0 border-b border-neutral-200/80 px-3 py-2 bg-neutral-50/50">
          <div className="grid w-full grid-cols-2 rounded-lg bg-neutral-100 p-0.5 text-[12px]">
            <button
              type="button"
              onClick={() => setViewTab("gallery")}
              className={cn(
                "rounded-md py-1 font-medium transition-colors flex items-center justify-center gap-1.5",
                viewTab === "gallery"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-800"
              )}
            >
              <Box className="h-3.5 w-3.5" />
              <span>Generations</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab("inspector")}
              className={cn(
                "rounded-md py-1 font-medium transition-colors flex items-center justify-center gap-1.5",
                viewTab === "inspector"
                  ? "bg-white text-neutral-900 shadow-xs"
                  : "text-neutral-500 hover:text-neutral-800"
              )}
            >
              <Sliders className="h-3.5 w-3.5" />
              <span>Inspector</span>
            </button>
          </div>
        </div>
      ) : null}

      {/* ViewTab === "inspector" */}
      {hasInspector && viewTab === "inspector" ? (
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <AssetInspector
            kind={inspectorKind}
            parts={parts}
            selectedPart={selectedPart}
            onSelectPart={onSelectPart}
            look={look}
            onLookChange={onLookChange}
            partMaterial={partMaterial}
            onPartMaterial={onPartMaterial}
            modelStats={modelStats}
          />
        </div>
      ) : (
        /* ViewTab === "gallery" */
        <div className="flex flex-1 min-h-0 flex-col overflow-hidden">
          {/* Search & Upload Bar */}
          <div className="space-y-2 border-b border-neutral-100 p-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search my generation"
                  className="h-8 w-full rounded-xl border border-neutral-200 bg-neutral-50/80 pl-8 pr-2.5 text-[12px] text-neutral-800 outline-none transition-colors focus:border-neutral-300 focus:bg-white"
                />
              </div>

              {onUploadFile && (
                <label className="flex h-8 items-center gap-1.5 cursor-pointer rounded-xl bg-neutral-900 px-2.5 text-[12px] font-semibold text-white hover:bg-neutral-800 transition-colors shrink-0">
                  <Upload className="h-3.5 w-3.5" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp"
                    className="hidden"
                    onChange={onUploadFile}
                  />
                </label>
              )}
            </div>

            {/* Quick Filter chips */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                type="button"
                onClick={() => setGalleryFilter("auto")}
                className={cn(
                  "rounded-full px-2.5 py-0.5 font-medium transition-colors",
                  galleryFilter === "auto"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:bg-neutral-100"
                )}
              >
                Current ({activeSection})
              </button>
              <button
                type="button"
                onClick={() => setGalleryFilter("all")}
                className={cn(
                  "rounded-full px-2 py-0.5 font-medium transition-colors",
                  galleryFilter === "all"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:bg-neutral-100"
                )}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setGalleryFilter("3d")}
                className={cn(
                  "rounded-full px-2 py-0.5 font-medium transition-colors",
                  galleryFilter === "3d"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:bg-neutral-100"
                )}
              >
                3D
              </button>
              <button
                type="button"
                onClick={() => setGalleryFilter("images")}
                className={cn(
                  "rounded-full px-2 py-0.5 font-medium transition-colors",
                  galleryFilter === "images"
                    ? "bg-neutral-900 text-white"
                    : "text-neutral-500 hover:bg-neutral-100"
                )}
              >
                Images
              </button>
            </div>
          </div>

          {/* Grid of Generations */}
          <div className="flex-1 min-h-0 overflow-y-auto p-3">
            {loading ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square rounded-xl bg-neutral-100 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[160px] rounded-xl border border-dashed border-neutral-200 p-6 text-center text-neutral-400">
                <Box className="h-8 w-8 text-neutral-300 mb-1.5" />
                <p className="text-[12px] font-medium text-neutral-600">No generations found</p>
                <p className="text-[11px] text-neutral-400">
                  {searchQuery ? "Try another search term" : "Your generation history will appear here"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {filteredItems.map(({ job, type }) => {
                  const isWater = isWaterJobFn(job);
                  const isRunning = job.status === "RUN" || job.status === "WAIT";
                  const isFailed = job.status === "FAIL";
                  const previewUrl = job.previewImageUrl || job.imageUrl;

                  return (
                    <button
                      key={job.id}
                      type="button"
                      draggable={true}
                      onDragStart={(e) => {
                        const imgUrl = previewUrl || "";
                        e.dataTransfer.setData("application/job-id", job.id);
                        if (isWater) {
                          e.dataTransfer.setData("application/water-job", "1");
                        }
                        e.dataTransfer.setData("text/uri-list", imgUrl);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      onClick={() => {
                        if (type === "3d") {
                          on3DClick(job);
                        } else {
                          onImageClick(job);
                        }
                      }}
                      className={cn(
                        "group relative aspect-square w-full rounded-xl overflow-hidden border border-neutral-200/80 bg-neutral-100 text-left transition-all duration-150 hover:border-neutral-400 hover:shadow-xs active:scale-[0.98]"
                      )}
                      title={job.prompt || (type === "3d" ? "3D Model" : "Image")}
                    >
                      {previewUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={displayImageUrl(previewUrl)}
                          alt={job.prompt ? (job.prompt.length > 50 ? `${job.prompt.slice(0, 50)}...` : job.prompt) : (type === "3d" ? "3D Model" : "Image")}
                          className="h-full w-full object-cover pointer-events-none"
                          onError={(e) => {
                            const currentTarget = e.currentTarget;
                            const currentSrc = currentTarget.src;
                            const unproxied = unwrapProxiedImageUrl(previewUrl);
                            if (unproxied && unproxied !== currentSrc && !currentSrc.endsWith(unproxied)) {
                              currentTarget.src = unproxied;
                            } else {
                              currentTarget.style.display = "none";
                            }
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center p-2 text-center text-neutral-400">
                          {type === "3d" ? (
                            <Box className="h-6 w-6 text-neutral-300" />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-neutral-300" />
                          )}
                          <span className="text-[10px] truncate max-w-full mt-1 font-medium text-neutral-500">
                            {job.prompt || "Generated asset"}
                          </span>
                        </div>
                      )}

                      {/* Status overlay */}
                      {isRunning && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[1px] text-white">
                          <div className="h-4 w-4 rounded-full border-2 border-white/60 border-t-white animate-spin mb-1" />
                          <span className="text-[9px] font-semibold uppercase tracking-wider">
                            {job.status === "WAIT" ? "Queued" : "Building"}
                          </span>
                        </div>
                      )}

                      {/* Status Dot */}
                      {isFailed && (
                        <span
                          className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"
                          title="Generation failed"
                        />
                      )}

                      {/* Type badge on hover */}
                      <div className="absolute bottom-1 right-1 rounded-md bg-black/60 px-1 py-0.5 text-[8px] font-medium text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        {isWater ? "Water" : type === "3d" ? "3D" : "Image"}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
