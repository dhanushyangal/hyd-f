"use client";

import { memo } from "react";
import { Box, Download, Grid3x3, Maximize2, Minimize2, RotateCw, SlidersHorizontal } from "lucide-react";
import { SendToDccButton } from "@/components/integrations/SendToDccButton";
import type { ViewerLook } from "@/lib/viewer/look";
import { cn } from "@/lib/utils";

type Props = {
  /** "3d" shows look toggles; "code" (Water) only exposes export + focus. */
  kind: "3d" | "code";
  look: ViewerLook;
  onLookChange: (patch: Partial<ViewerLook>) => void;
  onExport: () => void;
  fullView: boolean;
  onToggleFullView: () => void;
  inspectorOpen: boolean;
  onToggleInspector: () => void;
  /** Sit in a parent row instead of pinning itself to the canvas corner. */
  embedded?: boolean;
  /** Absolute or proxy URL for the current mesh (enables Send to DCC). */
  meshUrl?: string | null;
  jobId?: string | null;
};

function ToggleButton({
  active,
  label,
  title,
  onClick,
  children,
}: {
  active: boolean;
  label: string;
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-neutral-300",
        active ? "bg-neutral-950 text-white" : "text-neutral-500 hover:bg-neutral-100"
      )}
    >
      {children}
    </button>
  );
}

export const ViewerToolbar = memo(function ViewerToolbar({
  kind,
  look,
  onLookChange,
  onExport,
  fullView,
  onToggleFullView,
  inspectorOpen,
  onToggleInspector,
  embedded = false,
  meshUrl = null,
  jobId = null,
}: Props) {
  const bar = (
    <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-neutral-200/70 bg-white px-1 py-1 sm:px-1.5 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)]">
      {kind === "3d" ? (
        <div className="hidden items-center gap-0.5 sm:flex">
          <ToggleButton
            active={look.grid}
            label="Grid"
            title={look.grid ? "Hide grid" : "Show grid"}
            onClick={() => onLookChange({ grid: !look.grid })}
          >
            <Grid3x3 className="h-4 w-4" strokeWidth={1.85} />
          </ToggleButton>
          <ToggleButton
            active={look.autoRotate}
            label="Auto rotate"
            title={look.autoRotate ? "Pause rotation" : "Auto rotate"}
            onClick={() => onLookChange({ autoRotate: !look.autoRotate })}
          >
            <RotateCw className="h-4 w-4" strokeWidth={1.85} />
          </ToggleButton>
          <ToggleButton
            active={look.wireframe}
            label="Wireframe"
            title={look.wireframe ? "Wireframe on" : "Wireframe"}
            onClick={() => onLookChange({ wireframe: !look.wireframe })}
          >
            <Box className="h-4 w-4" strokeWidth={1.85} />
          </ToggleButton>
          <span className="mx-1 h-4 w-px bg-neutral-200" />
        </div>
      ) : null}
      <ToggleButton active={inspectorOpen} label="Adjust" title="Adjust look and parts" onClick={onToggleInspector}>
        <SlidersHorizontal className="h-4 w-4" strokeWidth={1.85} />
      </ToggleButton>
      <ToggleButton
        active={fullView}
        label={fullView ? "Exit focus" : "Focus"}
        title={fullView ? "Show library and composer" : "Focus on the model"}
        onClick={onToggleFullView}
      >
        {fullView ? <Minimize2 className="h-4 w-4" strokeWidth={1.85} /> : <Maximize2 className="h-4 w-4" strokeWidth={1.85} />}
      </ToggleButton>
      <span className="mx-0.5 sm:mx-1 h-4 w-px bg-neutral-200" />
      <button
        type="button"
        title="Export GLB"
        aria-label="Export GLB"
        onClick={onExport}
        className="inline-flex h-8 w-8 sm:w-auto items-center justify-center gap-1.5 rounded-full bg-neutral-950 sm:px-3 text-[12px] font-semibold text-white outline-none hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-300"
      >
        <Download className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
        <span className="hidden sm:inline">Export</span>
      </button>
      {kind === "3d" ? (
        <SendToDccButton compact meshUrl={meshUrl} jobId={jobId} className="ml-0.5 hidden sm:inline-flex" />
      ) : null}
    </div>
  );
  if (embedded) {
    return bar;
  }
  return <div className="pointer-events-none absolute right-3 top-3 z-[25] flex items-center justify-end">{bar}</div>;
});
