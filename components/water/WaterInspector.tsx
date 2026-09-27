"use client";

import type { WaterVisualEvidence } from "@/lib/api";
import type { WaterSceneBundle } from "@/lib/api";

type Props = {
  scene?: WaterSceneBundle | null;
  visual?: WaterVisualEvidence | null;
  selectedName?: string | null;
  onTransform?: (patch: {
    op: "move" | "rotate" | "scale";
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    material?: { color?: string; roughness?: number; metalness?: number };
  }) => void;
};

function num(v: unknown, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export function WaterInspector({
  scene,
  visual,
  selectedName,
  onTransform,
}: Props) {
  const instance = scene?.ir?.instances?.[0];
  const mat = instance?.material || {};
  const stills = visual?.turntables || [];

  if (!selectedName) return null;

  return (
    <div className="flex min-h-0 w-full flex-col overflow-y-auto bg-white">
      <div className="border-b border-neutral-200/70 px-3 py-3">
        <p className="truncate text-[12px] font-semibold text-neutral-900">{selectedName}</p>
      </div>

      <div className="space-y-2 border-b border-neutral-200/70 px-3 py-3">
        <label className="flex items-center justify-between gap-2 text-[12px] text-neutral-600">
          Color
          <input
            type="color"
            value={mat.color && /^#/.test(mat.color) ? mat.color : "#888888"}
            onChange={(e) => onTransform?.({ op: "move", material: { color: e.target.value } })}
            className="h-7 w-10 cursor-pointer rounded border border-neutral-200"
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-[12px] text-neutral-600">
          Rough
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={mat.roughness ?? 0.5}
            onChange={(e) => onTransform?.({ op: "move", material: { roughness: num(e.target.value, 0.5) } })}
            className="h-7 w-16 rounded-md border border-neutral-200 bg-neutral-50 px-1 text-[11px]"
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-[12px] text-neutral-600">
          Metal
          <input
            type="number"
            min={0}
            max={1}
            step={0.05}
            value={mat.metalness ?? 0}
            onChange={(e) => onTransform?.({ op: "move", material: { metalness: num(e.target.value, 0) } })}
            className="h-7 w-16 rounded-md border border-neutral-200 bg-neutral-50 px-1 text-[11px]"
          />
        </label>
      </div>

      {stills.length > 0 && (
        <div className="px-3 py-3">
          <div className="grid grid-cols-2 gap-1.5">
            {stills.slice(0, 4).map((t) => (
              <img
                key={t.angle}
                src={t.dataUrl}
                alt=""
                className="aspect-square rounded-lg border border-neutral-200 bg-neutral-50 object-cover"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
