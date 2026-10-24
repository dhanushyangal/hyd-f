"use client";

import { memo, useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { createPortal } from "react-dom";
import { Box, Image as ImageIcon, PanelLeftOpen } from "lucide-react";
import { type BackendJob, unwrapProxiedImageUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { displayImageUrl, EASE, FOCUS } from "../composer-parts";
import { libraryCardPreview } from "./cardPreview";

type Kind = "3d" | "image";

type Props = {
  images: BackendJob[];
  assets3D: BackendJob[];
  loading: boolean;
  activeJobId: string | null;
  onImageClick: (job: BackendJob) => void;
  on3DClick: (job: BackendJob) => void;
  isWaterJobFn: (job: BackendJob) => boolean;
  onExpand: () => void;
};

const timestamp = (job: BackendJob): number => {
  const parsed = Date.parse(job.createdAt || job.updatedAt || "");
  return Number.isFinite(parsed) ? parsed : 0;
};

const KIND = {
  "3d": { label: "3D", icon: Box, badge: "bg-[#0071e3] text-white" },
  image: { label: "Image", icon: ImageIcon, badge: "bg-[#ff9f0a] text-[#1c1c1e]" },
} as const;

function pickRailItems(images: BackendJob[], assets3D: BackendJob[]) {
  const models = [...assets3D].sort((a, b) => timestamp(b) - timestamp(a));
  const pictures = [...images].sort((a, b) => timestamp(b) - timestamp(a));
  const picked: { job: BackendJob; kind: Kind }[] = [];
  const push = (job: BackendJob | undefined, kind: Kind) => {
    if (!job || picked.some((item) => item.job.id === job.id) || picked.length >= 4) return;
    picked.push({ job, kind });
  };
  push(models[0], "3d");
  push(pictures[0], "image");
  for (const job of models) push(job, "3d");
  for (const job of pictures) push(job, "image");
  return picked;
}

export const LibraryRail = memo(function LibraryRail({
  images,
  assets3D,
  loading,
  activeJobId,
  onImageClick,
  on3DClick,
  isWaterJobFn,
  onExpand,
}: Props) {
  const items = useMemo(() => pickRailItems(images, assets3D), [images, assets3D]);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const openMenu = (event: ReactMouseEvent) => {
    event.preventDefault();
    const width = 168;
    const height = 44;
    setMenu({
      x: Math.max(8, Math.min(event.clientX, window.innerWidth - width - 8)),
      y: Math.max(8, Math.min(event.clientY, window.innerHeight - height - 8)),
    });
  };

  const expand = () => {
    setMenu(null);
    onExpand();
  };

  useEffect(() => {
    if (!menu) return;
    const close = (event: Event) => {
      if (event.target instanceof Node && menuRef.current?.contains(event.target)) return;
      setMenu(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenu(null);
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menu]);

  return (
    <>
      <nav
        aria-label="Library"
        onContextMenu={openMenu}
        className="library-rail pointer-events-auto flex w-[100px] flex-col items-center gap-2.5 rounded-[28px] border border-neutral-200 bg-white p-2.5 shadow-[0_1px_1px_rgba(0,0,0,0.05),0_16px_36px_-20px_rgba(0,0,0,0.38)]"
      >
        {loading && items.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 w-20 rounded-[20px] bg-neutral-100" aria-hidden />
            ))
          : items.map(({ job, kind }) => {
              const meta = KIND[kind];
              const Icon = meta.icon;
              const previewUrl = libraryCardPreview(job, kind);
              const active = activeJobId === job.id;
              const open = () => (kind === "image" ? onImageClick(job) : on3DClick(job));
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
                  onClick={open}
                  onContextMenu={openMenu}
                  aria-label={`${meta.label}: ${job.prompt || "untitled"}`}
                  aria-current={active ? "true" : undefined}
                  title={job.prompt || meta.label}
                  className={cn(
                    "relative h-20 w-20 shrink-0 overflow-hidden rounded-[20px] bg-neutral-100",
                    EASE,
                    FOCUS,
                    "focus-visible:ring-offset-2",
                    active ? "ring-2 ring-neutral-950 ring-offset-2 ring-offset-white" : "ring-1 ring-neutral-200/80 hover:ring-neutral-300"
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
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-neutral-400">
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                  )}
                  <span
                    className={cn(
                      "absolute bottom-1 right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.28)]",
                      meta.badge
                    )}
                  >
                    <Icon className="h-2.5 w-2.5" strokeWidth={2.4} aria-hidden />
                  </span>
                </button>
              );
            })}
      </nav>
      {menu
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              aria-label="Library"
              style={{ left: menu.x, top: menu.y }}
              className="fixed z-[80] min-w-[168px] rounded-xl border border-neutral-200 bg-white p-1 shadow-[0_16px_48px_-16px_rgba(0,0,0,0.22)]"
            >
              <button
                type="button"
                role="menuitem"
                autoFocus
                onClick={expand}
                className={cn(
                  "flex h-9 w-full items-center gap-2 rounded-lg px-2.5 text-left text-[13px] font-medium text-neutral-900 hover:bg-neutral-100",
                  FOCUS
                )}
              >
                <PanelLeftOpen className="h-4 w-4 text-neutral-500" strokeWidth={1.85} />
                Expand
              </button>
            </div>,
            document.body
          )
        : null}
    </>
  );
});
