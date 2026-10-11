"use client";

import { useId, type ReactNode } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup } from "@/components/ui/toggle-group";
import { WaterOutliner } from "@/components/water/WaterOutliner";
import type { ModelMeshStats } from "@/lib/viewer/meshStats";
import { cn } from "@/lib/utils";
import type { ModelBadge } from "./ModelStatsOverlay";
import {
  DEFAULT_PBR,
  FOV_RANGE,
  toHexColor,
  type PartMaterial,
  type ViewerCameraMode,
  type ViewerCameraView,
  type ViewerEnvLighting,
  type ViewerLook,
  type ViewerMaterialType,
} from "@/lib/viewer/look";

type Props = {
  kind: "empty" | "preview" | "3d" | "code";
  parts: string[];
  selectedPart: string | null;
  onSelectPart: (name: string) => void;
  look: ViewerLook;
  onLookChange: (patch: Partial<ViewerLook>) => void;
  partMaterial?: PartMaterial | null;
  onPartMaterial?: (patch: Partial<PartMaterial>) => void;
  /** Average authored roughness / metalness, shown until the user overrides them. */
  authoredPbr?: { roughness: number; metalness: number } | null;
  onCameraView?: (view: ViewerCameraView) => void;
  stats?: ModelMeshStats | null;
  badge?: ModelBadge | null;
  /** Grid, rotate and wireframe already live in the viewer toolbar. */
  hideViewToggles?: boolean;
};

/** Each PBR channel keeps one color, so the bars can be scanned without reading every label. */
const PBR_TONE = {
  roughness: "bg-amber-600",
  metalness: "bg-slate-500",
  reflections: "bg-sky-600",
  clearcoat: "bg-teal-600",
} as const;

const SHADING_OPTIONS: { value: ViewerMaterialType; label: string }[] = [
  { value: "standard", label: "PBR" },
  { value: "matcap", label: "Matcap" },
  { value: "toon", label: "Toon" },
  { value: "lambert", label: "Lambert" },
  { value: "normal", label: "Normals" },
];

const LIGHT_OPTIONS: { value: ViewerEnvLighting; label: string }[] = [
  { value: "studio", label: "Studio" },
  { value: "neutral", label: "Neutral" },
  { value: "outdoor", label: "Outdoor" },
];

const LENS_OPTIONS: { value: ViewerCameraMode; label: string }[] = [
  { value: "perspective", label: "Perspective" },
  { value: "isometric", label: "Isometric" },
];

const VIEW_OPTIONS: { value: ViewerCameraView; label: string }[] = [
  { value: "front", label: "Front" },
  { value: "side", label: "Side" },
  { value: "top", label: "Top" },
  { value: "reset", label: "Reset" },
];

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-neutral-200/80 py-3 first:border-t-0 first:pt-0">
      <h3 className="mb-2 truncate text-[11px] font-semibold tracking-wide text-neutral-600" title={title}>
        {title}
      </h3>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function Channel({
  label,
  value,
  min,
  max,
  step,
  tone,
  suffix,
  inherited,
  marked = false,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  tone: string;
  suffix?: string;
  inherited?: boolean;
  marked?: boolean;
  onChange: (value: number) => void;
}) {
  const shown = step >= 1 ? String(Math.round(value)) : value.toFixed(2);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-8 items-center justify-between gap-3">
        <span className="inline-flex min-w-0 items-center gap-1.5 text-[12px] font-medium text-neutral-800">
          {marked ? <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", tone)} aria-hidden /> : null}
          <span className="truncate">{label}</span>
        </span>
        <span className="shrink-0 text-right text-[12px] font-medium tabular-nums text-neutral-900">
          {shown}
          {suffix}
        </span>
      </div>
      <Slider
        aria-label={inherited ? `${label}, using the model's value` : label}
        value={value}
        min={min}
        max={max}
        step={step}
        indicatorClassName={tone}
        onValueChange={onChange}
      />
    </div>
  );
}

function Flag({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex h-8 items-center justify-between gap-3">
      <Label htmlFor={id} className="min-w-0 truncate text-[12px] font-medium text-neutral-800">
        {label}
      </Label>
      <Switch id={id} checked={checked} onCheckedChange={(next) => onChange(next === true)} className="focus-visible:ring-neutral-900/25" />
    </div>
  );
}

function ColorRow({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const id = useId();
  const hex = toHexColor(value) ?? "#888888";
  return (
    <div className="flex h-8 items-center justify-between gap-3">
      <label htmlFor={id} className="text-[12px] font-medium text-neutral-800">
        Base color
      </label>
      <span className="flex items-center justify-end gap-2">
        <span className="font-mono text-[12px] tabular-nums uppercase text-neutral-900">{hex}</span>
        <input
          id={id}
          type="color"
          value={hex}
          onChange={(event) => {
            const next = toHexColor(event.target.value);
            if (next) onChange(next);
          }}
          className="h-6 w-6 cursor-pointer appearance-none overflow-hidden rounded-full border border-neutral-300 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/25 [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
        />
      </span>
    </div>
  );
}

export function AssetInspector({
  kind,
  parts,
  selectedPart,
  onSelectPart,
  look,
  onLookChange,
  partMaterial,
  onPartMaterial,
  authoredPbr,
  onCameraView,
  stats = null,
  badge = null,
  hideViewToggles = false,
}: Props) {
  if (kind === "empty" || kind === "preview") {
    return (
      <p className="text-[13px] leading-5 text-neutral-600">
        {kind === "preview" ? "Turn this image into 3D to adjust materials, light and camera." : "Open a 3D model to adjust it."}
      </p>
    );
  }

  const isCloud = kind === "3d";
  const pbrShading = !isCloud || look.materialType === "standard";
  const pbrEdited =
    look.roughness !== DEFAULT_PBR.roughness ||
    look.metalness !== DEFAULT_PBR.metalness ||
    look.reflections !== DEFAULT_PBR.reflections ||
    look.clearcoat !== DEFAULT_PBR.clearcoat;
  const roughness = look.roughness ?? authoredPbr?.roughness ?? 0.5;
  const metalness = look.metalness ?? authoredPbr?.metalness ?? 0;

  return (
    <div className="flex flex-col">
      {stats && stats.faces > 0 ? (
        <Section title={badge?.label ?? "Model"}>
          <dl>
            {[
              ["Faces", stats.faces.toLocaleString()],
              ["Vertices", stats.vertices.toLocaleString()],
              ["Parts", String(stats.meshCount)],
            ].map(([label, value]) => (
              <div key={label} className="flex h-8 items-center justify-between gap-3">
                <dt className="text-[12px] font-medium text-neutral-800">{label}</dt>
                <dd className="shrink-0 text-right text-[12px] font-medium tabular-nums text-neutral-900">{value}</dd>
              </div>
            ))}
          </dl>
        </Section>
      ) : null}
      {parts.length > 0 ? (
        <Section title="Parts">
          <WaterOutliner meshNames={parts} selectedName={selectedPart} onSelect={onSelectPart} />
        </Section>
      ) : null}

      {selectedPart && partMaterial && onPartMaterial ? (
        <Section title={selectedPart}>
          <ColorRow value={partMaterial.color} onChange={(color) => onPartMaterial({ color })} />
          <Channel
            label="Roughness"
            value={partMaterial.roughness}
            min={0}
            max={1}
            step={0.01}
            tone={PBR_TONE.roughness}
            marked
            onChange={(value) => onPartMaterial({ roughness: value })}
          />
          <Channel
            label="Metalness"
            value={partMaterial.metalness}
            min={0}
            max={1}
            step={0.01}
            tone={PBR_TONE.metalness}
            marked
            onChange={(value) => onPartMaterial({ metalness: value })}
          />
        </Section>
      ) : null}

      <Section title="Material">
        {isCloud ? (
          <ToggleGroup
            label="Shading"
            value={look.materialType}
            options={SHADING_OPTIONS}
            wrap
            onValueChange={(materialType) => onLookChange({ materialType })}
          />
        ) : null}
        {pbrShading ? (
          <>
            <Channel
              label="Roughness"
              value={roughness}
              min={0}
              max={1}
              step={0.01}
              tone={PBR_TONE.roughness}
              marked
              inherited={look.roughness == null}
              onChange={(value) => onLookChange({ roughness: value })}
            />
            <Channel
              label="Metalness"
              value={metalness}
              min={0}
              max={1}
              step={0.01}
              tone={PBR_TONE.metalness}
              marked
              inherited={look.metalness == null}
              onChange={(value) => onLookChange({ metalness: value })}
            />
            <Channel
              label="Reflections"
              value={look.reflections}
              min={0}
              max={3}
              step={0.05}
              tone={PBR_TONE.reflections}
              marked
              onChange={(reflections) => onLookChange({ reflections })}
            />
            <Channel
              label="Clearcoat"
              value={look.clearcoat}
              min={0}
              max={1}
              step={0.01}
              tone={PBR_TONE.clearcoat}
              marked
              onChange={(clearcoat) => onLookChange({ clearcoat })}
            />
            {pbrEdited ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-full text-[12px] font-medium"
                onClick={() => onLookChange({ ...DEFAULT_PBR })}
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" strokeWidth={2} />
                Reset material
              </Button>
            ) : null}
          </>
        ) : (
          <p className="text-[12px] leading-5 text-neutral-600">Roughness, metalness, reflections and clearcoat apply when shading is PBR.</p>
        )}
        {hideViewToggles ? null : <Flag label="Wireframe" checked={look.wireframe} onChange={(wireframe) => onLookChange({ wireframe })} />}
      </Section>

      <Section title="Light">
        <ToggleGroup label="Light preset" value={look.lighting} options={LIGHT_OPTIONS} onValueChange={(lighting) => onLookChange({ lighting })} />
        <Channel
          label="Intensity"
          value={look.lightIntensity}
          min={0.3}
          max={2}
          step={0.05}
          tone="bg-neutral-800"
          onChange={(lightIntensity) => onLookChange({ lightIntensity })}
        />
        <Channel
          label="Exposure"
          value={look.brightness}
          min={0.5}
          max={2}
          step={0.05}
          tone="bg-neutral-800"
          onChange={(brightness) => onLookChange({ brightness })}
        />
        <Flag label="Backdrop" checked={look.background} onChange={(background) => onLookChange({ background })} />
        <Flag label="Shadow" checked={look.shadow} onChange={(shadow) => onLookChange({ shadow })} />
        {hideViewToggles ? null : (
          <>
            <Flag label="Grid" checked={look.grid} onChange={(grid) => onLookChange({ grid })} />
            <Flag label="Rotate" checked={look.autoRotate} onChange={(autoRotate) => onLookChange({ autoRotate })} />
          </>
        )}
      </Section>

      <Section title="Camera">
        <ToggleGroup
          label="Lens"
          value={look.cameraMode}
          options={LENS_OPTIONS}
          onValueChange={(cameraMode) => onLookChange({ cameraMode })}
        />
        {look.cameraMode === "perspective" ? (
          <Channel
            label="Field of view"
            value={look.fov}
            min={FOV_RANGE.min}
            max={FOV_RANGE.max}
            step={1}
            suffix="°"
            tone="bg-neutral-800"
            onChange={(fov) => onLookChange({ fov })}
          />
        ) : null}
        {onCameraView ? (
          <div role="group" aria-label="Camera view" className="flex rounded-lg bg-neutral-100 p-0.5">
            {VIEW_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onCameraView(option.value)}
                className="h-8 min-w-0 flex-1 rounded-md px-1.5 text-[12px] font-medium text-neutral-700 transition-colors hover:bg-white hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/25"
              >
                {option.label}
              </button>
            ))}
          </div>
        ) : null}
      </Section>
    </div>
  );
}
