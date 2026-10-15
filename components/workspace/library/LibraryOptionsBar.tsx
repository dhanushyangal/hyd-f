"use client";

import { useMemo, useState } from "react";
import { type BackendJob, unwrapProxiedImageUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { displayImageUrl, EASE, FOCUS } from "../composer-parts";

type Filter = "all" | "3d" | "image";
type Kind = "3d" | "image";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "3d", label: "3D" },
  { id: "image", label: "Image" },
];

type Props = {
  images: BackendJob[];
  assets3D: BackendJob[];
  loading: boolean;
  activeJobId: string | null;
  onImageClick: (job: BackendJob) => void;
  on3DClick: (job: BackendJob) => void;
  isWaterJobFn: (job: BackendJob) => boolean;
};

const timestamp = (job: BackendJob): number => {
  const parsed = Date.parse(job.createdAt || job.updatedAt || "");
  return Number.isFinite(parsed) ? parsed : 0;
};

function libraryItems(images: BackendJob[], assets3D: BackendJob[], filter: Filter) {
  const models = [...assets3D].sort((a, b) => timestamp(b) - timestamp(a));
  const pictures = [...images].sort((a, b) => timestamp(b) - timestamp(a));
  const modelIds = new Set(models.map((job) => job.id));
  const seen = new Set<string>();
  const picked: { job: BackendJob; kind: Kind }[] = [];

  const push = (job: BackendJob, kind: Kind) => {
    if (seen.has(job.id)) return;
    seen.add(job.id);
    picked.push({ job, kind });
  };

  if (filter === "3d") {
    for (const job of models) push(job, "3d");
    return picked;
  }
  if (filter === "image") {
    for (const job of pictures) push(job, "image");
    return picked;
  }

  const merged = [
    ...models.map((job) => ({ job, kind: "3d" as const })),
    ...pictures.map((job) => ({ job, kind: "image" as const })),
  ].sort((a, b) => timestamp(b.job) - timestamp(a.job));
  for (const item of merged) push(item.job, modelIds.has(item.job.id) ? "3d" : item.kind);
  return picked;
}

export function LibraryOptionsBar({
  images,
  assets3D,
  loading,
  activeJobId,
  onImageClick,
  on3DClick,
  isWaterJobFn,
}: Props) {
  const [filter, setFilter] = useState<Filter>("all");
  const items = useMemo(() => libraryItems(images, assets3D, filter), [images, assets3D, filter]);
  const emptyLabel = filter === "3d" ? "No models yet" : filter === "image" ? "No images yet" : "Nothing here yet";

  return (
    <nav
      aria-label="Library"
      className="library-rail pointer-events-auto flex max-h-[min(32rem,calc(100dvh-18rem))] min-h-0 w-full flex-col gap-2 overflow-hidden rounded-[24px] border border-neutral-200 bg-white p-2 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_16px_36px_-20px_rgba(0,0,0,0.38)]"
    >
      <div className="flex h-8 w-full shrink-0 rounded-xl bg-neutral-100 p-0.5" role="radiogroup" aria-label="Library filter">
        {FILTERS.map(({ id, label }) => {
          const selected = filter === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setFilter(id)}
              className={cn(
                "h-full min-w-0 flex-1 whitespace-nowrap rounded-[10px] px-0.5 text-[11px] font-medium leading-none",
                EASE,
                FOCUS,
                selected
                  ? "bg-white text-neutral-950 shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
                  : "text-neutral-600 hover:text-neutral-950"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="scrollbar-minimal flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto overscroll-contain">
        {loading && items.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square w-full shrink-0 rounded-[16px] bg-neutral-100" aria-hidden />
          ))
        ) : items.length === 0 ? (
          <p className="px-1 py-6 text-center text-[12px] leading-5 text-neutral-600">{emptyLabel}</p>
        ) : (
          items.map(({ job, kind }) => {
            const previewUrl = job.previewImageUrl || job.imageUrl;
            const active = activeJobId === job.id;
            const label = kind === "3d" ? "3D" : "Image";
            const running = job.status === "RUN" || job.status === "WAIT" || job.id.startsWith("pending-");
            const failed = job.status === "FAIL";
            const water = isWaterJobFn(job);
            return (
              <button
                key={job.id}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/job-id", job.id);
                  if (water) e.dataTransfer.setData("application/water-job", "1");
                  e.dataTransfer.setData("text/uri-list", previewUrl || "");
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => (kind === "image" ? onImageClick(job) : on3DClick(job))}
                aria-label={`${label}: ${job.prompt || "untitled"}`}
                aria-current={active ? "true" : undefined}
                title={job.prompt || label}
                className={cn(
                  "relative aspect-square w-full shrink-0 overflow-hidden rounded-[16px] bg-neutral-100",
                  EASE,
                  FOCUS,
                  active
                    ? "ring-2 ring-inset ring-neutral-950"
                    : "ring-1 ring-inset ring-neutral-200/80 hover:ring-neutral-300"
                )}
              >
                {previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayImageUrl(previewUrl)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="pointer-events-none h-full w-full object-cover object-center"
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
                ) : null}
                {running ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/50 border-t-white" />
                  </span>
                ) : null}
                {failed ? (
                  <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" aria-label="Failed" />
                ) : null}
              </button>
            );
          })
        )}
      </div>
    </nav>
  );
}
