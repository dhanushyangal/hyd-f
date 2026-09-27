"use client";

import {
  ColorControl,
  Folder,
  SelectControl,
  Slider,
  Toggle,
} from "dialkit";
import "dialkit/styles.css";
import "./asset-inspector.css";
import { WaterOutliner } from "@/components/water/WaterOutliner";
import type {
  PartMaterial,
  ViewerCameraMode,
  ViewerEnvLighting,
  ViewerLook,
  ViewerMaterialRoughness,
  ViewerMaterialType,
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
};

const MATERIAL_OPTIONS = [
  { value: "standard", label: "PBR" },
  { value: "matcap", label: "Matcap" },
  { value: "toon", label: "Toon" },
  { value: "lambert", label: "Lambert" },
  { value: "normal", label: "Normal" },
];

const LIGHT_OPTIONS = [
  { value: "studio", label: "Studio" },
  { value: "neutral", label: "Neutral" },
  { value: "outdoor", label: "Outdoor" },
];

export function AssetInspector({
  kind,
  parts,
  selectedPart,
  onSelectPart,
  look,
  onLookChange,
  partMaterial,
  onPartMaterial,
}: Props) {
  if (kind === "empty" || kind === "preview") {
    return (
      <div className="px-1 py-2">
        <p className="text-[12px] leading-5 text-neutral-500">
          {kind === "preview" ? "Generate 3D to tune materials, light, and parts." : "Open a 3D asset to tune look and parts."}
        </p>
      </div>
    );
  }

  const showLook = kind === "3d" || kind === "code";
  const showCloudSurface = kind === "3d";

  return (
    <div className="asset-dials dialkit-root flex min-h-0 flex-1 flex-col">
      {parts.length > 0 && (
        <Folder title="Parts" defaultOpen>
          <WaterOutliner meshNames={parts} selectedName={selectedPart} onSelect={onSelectPart} />
        </Folder>
      )}

      {selectedPart && partMaterial && onPartMaterial ? (
        <Folder title="Edit part" defaultOpen>
          <ColorControl
            label="Color"
            value={partMaterial.color}
            onChange={(color) => onPartMaterial({ color })}
          />
          <Slider
            label="Rough"
            value={partMaterial.roughness}
            min={0}
            max={1}
            step={0.05}
            onChange={(roughness) => onPartMaterial({ roughness })}
          />
          <Slider
            label="Metal"
            value={partMaterial.metalness}
            min={0}
            max={1}
            step={0.05}
            onChange={(metalness) => onPartMaterial({ metalness })}
          />
        </Folder>
      ) : null}

      {showLook && (
        <>
          <Folder title="Surface" defaultOpen>
            {showCloudSurface ? (
              <SelectControl
                label="Material"
                value={look.materialType}
                options={MATERIAL_OPTIONS}
                onChange={(value) => onLookChange({ materialType: value as ViewerMaterialType })}
              />
            ) : null}
            {showCloudSurface && look.materialType === "standard" ? (
              <SelectControl
                label="Finish"
                value={look.materialRoughness}
                options={["smooth", "medium", "rough"]}
                onChange={(value) => onLookChange({ materialRoughness: value as ViewerMaterialRoughness })}
              />
            ) : null}
            <Toggle
              label="Wireframe"
              checked={look.wireframe}
              onChange={(wireframe) => onLookChange({ wireframe })}
            />
          </Folder>

          <Folder title="Light" defaultOpen>
            <SelectControl
              label="Preset"
              value={look.lighting}
              options={LIGHT_OPTIONS}
              onChange={(value) => onLookChange({ lighting: value as ViewerEnvLighting })}
            />
            <Slider
              label="Intensity"
              value={look.lightIntensity}
              min={0.3}
              max={2}
              step={0.1}
              onChange={(lightIntensity) => onLookChange({ lightIntensity })}
            />
            <Slider
              label="Exposure"
              value={look.brightness}
              min={0.5}
              max={2}
              step={0.05}
              onChange={(brightness) => onLookChange({ brightness })}
            />
            <Toggle label="Backdrop" checked={look.background} onChange={(background) => onLookChange({ background })} />
            <Toggle label="Grid" checked={look.grid} onChange={(grid) => onLookChange({ grid })} />
            <Toggle label="Shadow" checked={look.shadow} onChange={(shadow) => onLookChange({ shadow })} />
            <Toggle label="Rotate" checked={look.autoRotate} onChange={(autoRotate) => onLookChange({ autoRotate })} />
          </Folder>

          <Folder title="Camera" defaultOpen>
            <SelectControl
              label="Lens"
              value={look.cameraMode}
              options={[
                { value: "perspective", label: "Perspective" },
                { value: "isometric", label: "Isometric" },
              ]}
              onChange={(value) => onLookChange({ cameraMode: value as ViewerCameraMode })}
            />
            {look.cameraMode === "perspective" ? (
              <Slider
                label="Distortion"
                value={look.distortion}
                min={0}
                max={1}
                step={0.01}
                onChange={(distortion) => onLookChange({ distortion })}
              />
            ) : null}
          </Folder>
        </>
      )}
    </div>
  );
}
