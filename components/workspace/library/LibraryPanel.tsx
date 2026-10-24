"use client";

import { memo, useMemo, useState } from "react";
import Link from "next/link";
import { Box, Image as ImageIcon, PanelLeftClose, Search, X } from "lucide-react";
import { type BackendJob, unwrapProxiedImageUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { displayImageUrl, EASE, FOCUS, ICON_BUTTON } from "../composer-parts";
import { libraryCardPreview } from "./cardPreview";

type Filter = "all" | "3d" | "images";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "3d", label: "3D" },
  { id: "images", label: "Images" },
];

type Props = {
  images: BackendJob[];
  assets3D: BackendJob[];
  loading: boolean;
  activeJobId: string | null;
  onImageClick: (job: BackendJob) => void;
  on3DClick: (job: BackendJob) => void;
  isWaterJobFn: (job: BackendJob) => boolean;
  onClose: () => void;
  className?: string;
};

const timestamp = (job: BackendJob): number => {
  const parsed = Date.parse(job.createdAt || job.updatedAt || "");
  return Number.isFinite(parsed) ? parsed : 0;
};

export const LibraryPanel = memo(function LibraryPanel({
  images,
  assets3D,
  loading,
  activeJobId,
  onImageClick,
  on3DClick,
  isWaterJobFn,
  onClose,
  className,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const items = useMemo(() => {
    const models = assets3D.map((job) => ({ job, type: "3d" as const }));
    const pictures = images.map((job) => ({ job, type: "image" as const }));
    const list =
      filter === "3d"
        ? models
        : filter === "images"
          ? pictures
          : [...models, ...pictures].sort((a, b) => timestamp(b.job) - timestamp(a.job));
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(({ job }) => (job.prompt || "").toLowerCase().includes(q) || job.id.toLowerCase().includes(q));
  }, [assets3D, images, filter, query]);

  return (
    <aside
      aria-label="Library"
      className={cn("flex h-full w-[264px] shrink-0 flex-col overflow-hidden border-r border-neutral-200/80 bg-white select-none", className)}
    >
      <div className="flex h-12 shrink-0 items-center gap-1 px-3">
        {searchOpen ? (
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <input
              autoFocus
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setQuery("");
                  setSearchOpen(false);
                }
              }}
              placeholder="Search"
              aria-label="Search library"
              className="h-8 w-full rounded-full border border-neutral-200 bg-neutral-50 pl-8 pr-2.5 text-[13px] text-neutral-800 outline-none focus:border-neutral-300 focus:bg-white"
            />
          </div>
        ) : (
          <div className="flex flex-1 items-center rounded-full bg-neutral-100 p-0.5" role="radiogroup" aria-label="Filter library">
            {FILTERS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="radio"
                aria-checked={filter === id}
                onClick={() => setFilter(id)}
                className={cn(
                  "h-7 flex-1 rounded-full text-[12px] font-medium",
                  EASE,
                  FOCUS,
                  filter === id ? "bg-white text-neutral-950 shadow-[0_1px_3px_rgba(0,0,0,0.12)]" : "text-neutral-500 hover:text-neutral-900"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            if (searchOpen) setQuery("");
            setSearchOpen((v) => !v);
          }}
          className={cn(ICON_BUTTON, "rounded-full")}
          aria-label={searchOpen ? "Close search" : "Search library"}
          title={searchOpen ? "Close search" : "Search"}
        >
          {searchOpen ? <X className="h-4 w-4" strokeWidth={1.85} /> : <Search className="h-4 w-4" strokeWidth={1.85} />}
        </button>
        <button type="button" onClick={onClose} className={cn(ICON_BUTTON, "rounded-full")} aria-label="Hide library" title="Hide library">
          <PanelLeftClose className="h-4 w-4" strokeWidth={1.85} />
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-3 pb-3">
        {loading && items.length === 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square rounded-xl bg-neutral-100 animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex min-h-[160px] flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-200 p-6 text-center">
            <Box className="h-6 w-6 text-neutral-300" strokeWidth={1.75} />
            <p className="text-[13px] text-neutral-500">{query ? "No matches" : "Nothing here yet"}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {items.map(({ job, type }) => {
              const isWater = isWaterJobFn(job);
              const isRunning = job.status === "RUN" || job.status === "WAIT" || job.id.startsWith("pending-");
              const isFailed = job.status === "FAIL";
              const previewUrl = libraryCardPreview(job, type);
              const kindLabel = isWater ? "Water" : type === "3d" ? "3D" : "Image";
              const active = activeJobId === job.id;

              return (
                <button
                  key={job.id}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/job-id", job.id);
                    if (isWater) e.dataTransfer.setData("application/water-job", "1");
                    e.dataTransfer.setData("text/uri-list", previewUrl || "");
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => (type === "3d" ? on3DClick(job) : onImageClick(job))}
                  title={job.prompt || kindLabel}
                  aria-label={`${kindLabel}: ${job.prompt || "untitled"}`}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "group relative aspect-square w-full overflow-hidden rounded-xl border bg-neutral-100 text-left active:scale-[0.98]",
                    EASE,
                    FOCUS,
                    active ? "border-neutral-900 ring-2 ring-neutral-900/10" : "border-neutral-200/80 hover:border-neutral-400"
                  )}
                >
                  {previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={displayImageUrl(previewUrl)}
                      alt=""
                      loading="lazy"
                      className="pointer-events-none h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const unproxied = unwrapProxiedImageUrl(previewUrl);
                        if (unproxied && unproxied !== target.src && !target.src.endsWith(unproxied)) {
                          target.src = unproxied;
                        } else {
                          target.style.display = "none";
                        }
                      }}
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-neutral-300">
                      {type === "3d" ? <Box className="h-6 w-6" strokeWidth={1.6} /> : <ImageIcon className="h-6 w-6" strokeWidth={1.6} />}
                    </div>
                  )}

                  {isRunning ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/35">
                      <div className="h-5 w-5 rounded-full border-2 border-white/50 border-t-white animate-spin" aria-label="In progress" />
                    </div>
                  ) : null}

                  {isFailed ? (
                    <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" aria-label="Failed" />
                  ) : null}

                  {type === "3d" ? (
                    <span className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 text-[10px] font-semibold leading-[18px] text-white">
                      {kindLabel}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-neutral-100 px-3 py-2">
        <Link
          href="/library"
          className="flex h-8 items-center justify-center rounded-full text-[12px] font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          Open full library
        </Link>
      </div>
    </aside>
  );
});
