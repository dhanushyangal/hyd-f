"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ModelMeshStats } from "@/lib/viewer/meshStats";
import type { PartMaterial, ViewerCameraView, ViewerLook } from "@/lib/viewer/look";
import { cn } from "@/lib/utils";
import { AssetInspector } from "../AssetInspector";
import { ICON_BUTTON } from "../composer-parts";
import type { ModelBadge } from "../ModelStatsOverlay";

type Props = {
  kind: "3d" | "code";
  parts: string[];
  selectedPart: string | null;
  onSelectPart: (name: string) => void;
  look: ViewerLook;
  onLookChange: (patch: Partial<ViewerLook>) => void;
  partMaterial?: PartMaterial | null;
  onPartMaterial?: (patch: Partial<PartMaterial>) => void;
  authoredPbr?: { roughness: number; metalness: number } | null;
  onCameraView?: (view: ViewerCameraView) => void;
  stats?: ModelMeshStats | null;
  badge?: ModelBadge | null;
  onClose: () => void;
  /** Compact screens: slide over the canvas instead of docking beside it. */
  overlay: boolean;
  /** Credits, theme, and profile. Stays inside this column. */
  account?: ReactNode;
};

export function InspectorPanel({ onClose, overlay, kind, stats = null, badge = null, account = null, ...inspector }: Props) {
  const panel = (
    <aside
      aria-label="Adjust"
      className={cn(
        "flex h-full w-[288px] max-w-[85vw] shrink-0 flex-col overflow-hidden border-l border-neutral-200/80 bg-white pt-[env(safe-area-inset-top)] select-none",
        overlay && "shadow-[-24px_0_60px_-30px_rgba(0,0,0,0.35)]"
      )}
    >
      <div className="flex h-12 shrink-0 items-center gap-1 border-b border-neutral-200/80 pl-3 pr-1.5">
        <span className="shrink-0 text-[13px] font-semibold text-neutral-900">Adjust</span>
        <div className="ml-auto min-w-0">{account}</div>
        <button type="button" onClick={onClose} className={cn(ICON_BUTTON, "rounded-full")} aria-label="Close adjust panel">
          <X className="h-4 w-4" strokeWidth={1.85} />
        </button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        <div className="px-3 pb-5">
          <AssetInspector kind={kind} hideViewToggles={kind === "3d"} stats={stats} badge={badge} {...inspector} />
        </div>
      </ScrollArea>
    </aside>
  );

  if (!overlay) return panel;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button type="button" aria-label="Close adjust panel" onClick={onClose} className="absolute inset-0 bg-black/20" />
      <div className="relative h-full">{panel}</div>
    </div>
  );
}
