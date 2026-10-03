"use client";

import { useState } from "react";
import {
  Boxes,
  Layers,
  Triangle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Info,
} from "lucide-react";
import type { ModelMeshStats } from "@/lib/viewer/meshStats";
import { cn } from "@/lib/utils";

type Props = {
  stats: ModelMeshStats | null;
  corner?: "bottom-left" | "bottom-right" | "top-left" | "top-right";
  className?: string;
};

export function ModelStatsOverlay({
  stats,
  corner = "bottom-left",
  className,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  if (!stats || stats.faces === 0) {
    return null;
  }

  const cornerClasses = {
    "bottom-left": "bottom-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "top-left": "top-4 left-4",
    "top-right": "top-4 right-4",
  }[corner];

  if (collapsed) {
    return (
      <div className={cn("absolute z-20 pointer-events-auto", cornerClasses, className)}>
        <button
          type="button"
          onClick={() => {
            setCollapsed(false);
          }}
          className="flex items-center gap-1.5 rounded-full border border-white/15 bg-neutral-950/80 px-2.5 py-1 text-[11px] font-medium text-neutral-200 shadow-lg backdrop-blur-md transition-all hover:bg-neutral-900 hover:text-white"
          title="Show model stats (Faces, Vertices, Topology)"
        >
          <Boxes className="h-3.5 w-3.5 text-emerald-400" />
          <span>{stats.faces.toLocaleString()} Faces</span>
          <ChevronUp className="h-3 w-3 text-neutral-400" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "absolute z-20 pointer-events-auto flex flex-col items-start gap-1.5",
        cornerClasses,
        className
      )}
    >
      {/* Detailed popover card if toggled */}
      {showDetails && (
        <div className="mb-1 w-64 rounded-xl border border-white/15 bg-neutral-950/95 p-3 text-xs text-neutral-200 shadow-2xl backdrop-blur-md animate-in fade-in zoom-in-95 duration-100">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Boxes className="h-3.5 w-3.5 text-emerald-400" />
              Mesh Geometry Details
            </span>
            <button
              type="button"
              onClick={() => {
                setShowDetails(false);
              }}
              className="text-[10px] text-neutral-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <div className="mt-2.5 space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-neutral-400 font-sans">Polygons / Faces:</span>
              <span className="text-white font-semibold">{stats.faces.toLocaleString()} tris</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400 font-sans">Total Vertices:</span>
              <span className="text-white font-semibold">{stats.vertices.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400 font-sans">Topology Flow:</span>
              <span className="text-emerald-400 font-semibold">{stats.topology}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400 font-sans">Mesh Parts:</span>
              <span className="text-neutral-200">{stats.meshCount} {stats.meshCount === 1 ? "part" : "parts"}</span>
            </div>
            <div className="flex justify-between items-center pt-1 border-t border-white/10">
              <span className="text-neutral-400 font-sans">Watertight:</span>
              <span className={cn("text-[10px] font-sans font-medium px-1.5 py-0.5 rounded", stats.isWatertight ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-neutral-800 text-neutral-300")}>
                {stats.isWatertight ? "Yes (Manifold)" : "Standard Mesh"}
              </span>
            </div>
          </div>
          <p className="mt-2 text-[10px] text-neutral-400 leading-tight">
            Production-ready geometry compatible with Blender, Unreal Engine, Unity, and 3D printing slicers.
          </p>
        </div>
      )}

      {/* Main Corner Stats Pill */}
      <div className="flex items-center rounded-xl border border-white/15 bg-neutral-950/85 px-3 py-1.5 text-xs text-neutral-200 shadow-xl backdrop-blur-md select-none">
        {/* Faces */}
        <div
          className="flex items-center gap-1.5 pr-2.5"
          title={`${stats.faces.toLocaleString()} polygon faces`}
        >
          <Triangle className="h-3 w-3 text-amber-400" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
            Faces
          </span>
          <span className="font-mono font-semibold tracking-tight text-white">
            {stats.faces.toLocaleString()}
          </span>
        </div>

        <span className="h-3.5 w-px bg-white/15" />

        {/* Vertices */}
        <div
          className="flex items-center gap-1.5 px-2.5"
          title={`${stats.vertices.toLocaleString()} vertices`}
        >
          <Boxes className="h-3 w-3 text-sky-400" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
            Vertices
          </span>
          <span className="font-mono font-semibold tracking-tight text-white">
            {stats.vertices.toLocaleString()}
          </span>
        </div>

        <span className="h-3.5 w-px bg-white/15" />

        {/* Topology */}
        <div
          className="flex items-center gap-1.5 pl-2.5"
          title={`Topology: ${stats.topology}${stats.isWatertight ? " (Watertight / Closed Manifold)" : ""}`}
        >
          <Layers className="h-3 w-3 text-emerald-400" />
          <span className="text-[10px] font-medium uppercase tracking-wider text-neutral-400">
            Topology
          </span>
          <span className="font-semibold text-white">
            {stats.topology}
          </span>
          {stats.isWatertight && (
            <span
              className="inline-flex items-center gap-0.5 rounded bg-emerald-500/20 px-1 py-0.5 text-[9px] font-medium text-emerald-300 border border-emerald-500/30"
              title="Watertight 2-Manifold Mesh"
            >
              <ShieldCheck className="h-2.5 w-2.5 text-emerald-400" />
              Watertight
            </span>
          )}
        </div>

        {/* Info & Collapse Actions */}
        <div className="ml-2 flex items-center gap-1 border-l border-white/15 pl-2">
          <button
            type="button"
            onClick={() => {
              setShowDetails(!showDetails);
            }}
            className={cn(
              "rounded p-0.5 text-neutral-400 hover:text-white transition-colors",
              showDetails && "text-emerald-400 bg-white/10"
            )}
            title="Inspect mesh topology"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setCollapsed(true);
            }}
            className="rounded p-0.5 text-neutral-400 hover:text-white transition-colors"
            title="Minimize stats"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
