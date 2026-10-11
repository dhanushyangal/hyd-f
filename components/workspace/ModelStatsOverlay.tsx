"use client";

import { useState } from "react";
import { Boxes, Cloud, Droplets, Info, Triangle, Upload } from "lucide-react";
import type { ModelMeshStats } from "@/lib/viewer/meshStats";
import { cn } from "@/lib/utils";

export type ModelBadge = {
  label: string;
  icon: "water" | "cloud" | "upload";
};

type Props = {
  stats: ModelMeshStats | null;
  /** Which engine made this model; shown even before stats are ready. */
  badge?: ModelBadge | null;
  corner?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  /** Sit in normal flow, stretched, instead of floating on the canvas. */
  embedded?: boolean;
  className?: string;
};

const BADGE_ICON = { water: Droplets, cloud: Cloud, upload: Upload } as const;

const CORNER = {
  "bottom-left": "bottom-3 left-3",
  "bottom-right": "bottom-3 right-3",
  "top-left": "top-3 left-3",
  "top-right": "top-3 right-3",
} as const;

function compact(n: number): string {
  return n >= 10_000 ? `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k` : n.toLocaleString();
}

export function ModelStatsOverlay({ stats, badge, corner = "top-left", embedded = false, className }: Props) {
  const [showDetails, setShowDetails] = useState(false);
  const hasStats = Boolean(stats && stats.faces > 0);
  if (!hasStats && !badge) return null;

  const BadgeIcon = badge ? BADGE_ICON[badge.icon] : null;
  const top = corner.startsWith("top");

  return (
    <div
      className={cn(
        "pointer-events-auto flex gap-1.5",
        embedded
          ? "relative w-full flex-col items-stretch"
          : cn("absolute z-20", top ? "flex-col items-start" : "flex-col-reverse items-start", CORNER[corner]),
        className
      )}
    >
      <div className={cn("flex h-8 select-none items-center rounded-full border border-neutral-200/80 bg-white/90 pl-1 pr-1 text-[12px] text-neutral-600 shadow-[0_4px_16px_-8px_rgba(0,0,0,0.18)] backdrop-blur", embedded && "w-full")}>
        {badge && BadgeIcon ? (
          <span className={cn("inline-flex h-6 min-w-0 items-center gap-1.5 rounded-full bg-neutral-100 px-2 font-medium text-neutral-800", embedded && "max-w-[46%]")}>
            <BadgeIcon className={cn("h-3.5 w-3.5 shrink-0", badge.icon === "water" ? "text-sky-600" : "text-neutral-500")} strokeWidth={2} />
            <span className="truncate">{badge.label}</span>
          </span>
        ) : null}

        {hasStats && stats ? (
          <>
            <span className={cn("flex items-center gap-1 pl-2.5", !embedded && "@max-[720px]:hidden")} title={`${stats.faces.toLocaleString()} faces`}>
              <Triangle className="h-3 w-3 text-neutral-400" strokeWidth={2} />
              <span className="font-medium tabular-nums text-neutral-900">{compact(stats.faces)}</span>
              <span className="text-neutral-500">faces</span>
            </span>
            <span className={cn("flex items-center gap-1 pl-2.5", !embedded && "@max-[720px]:hidden")} title={`${stats.vertices.toLocaleString()} vertices`}>
              <Boxes className="h-3 w-3 text-neutral-400" strokeWidth={2} />
              <span className="font-medium tabular-nums text-neutral-900">{compact(stats.vertices)}</span>
              <span className="text-neutral-500">verts</span>
            </span>
            <button
              type="button"
              onClick={() => setShowDetails((v) => !v)}
              aria-expanded={showDetails}
              aria-label="Mesh details"
              title="Mesh details"
              className={cn(
                "ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/25",
                showDetails && "bg-neutral-100 text-neutral-900"
              )}
            >
              <Info className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </>
        ) : (
          <span className="w-1" />
        )}
      </div>

      {showDetails && hasStats && stats ? (
        <dl className={cn("rounded-xl border border-neutral-200/80 bg-white/95 p-3 text-[12px] shadow-[0_12px_32px_-12px_rgba(0,0,0,0.2)] backdrop-blur", embedded ? "w-full" : "w-56")}>
          {[
            ["Faces", stats.faces.toLocaleString()],
            ["Vertices", stats.vertices.toLocaleString()],
            ["Topology", stats.topology],
            ["Parts", String(stats.meshCount)],
            ["Watertight", stats.isWatertight ? "Yes" : "No"],
          ].map(([term, value]) => (
            <div key={term} className="flex items-center justify-between py-1">
              <dt className="text-neutral-500">{term}</dt>
              <dd className="font-medium tabular-nums text-neutral-900">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}
