"use client";

import { useState } from "react";
import {
  Box,
  Crown,
  HelpCircle,
  Image as ImageIcon,
  UploadCloud,
  Wand2,
  X,
} from "lucide-react";
import { CreateEnginePicker } from "@/components/CreateEnginePicker";
import type { CatalogModel, ModelId } from "@/lib/models";
import { displayImageUrl, PanelGenerateFooter } from "./composer-parts";
import { cn } from "@/lib/utils";

type Props = {
  image: string | null;
  isDragging: boolean;
  onImageDrop: (e: React.DragEvent) => void;
  onImagePaste: (e: React.ClipboardEvent) => void;
  onImageFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageClear: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  selectedModel: ModelId;
  selectedLabel: string;
  waterPickerModels: CatalogModel[];
  enabledWaterIds: string[];
  providerKeyOk: (provider: string) => boolean;
  onSelectModel: (id: ModelId, opt: CatalogModel) => void;
  onGenerate: () => void;
  generating: boolean;
  disabled?: boolean;
  onSwitchToImage: () => void;
  className?: string;
};

export function ModelPanel({
  image,
  isDragging,
  onImageDrop,
  onImagePaste,
  onImageFileSelect,
  onImageClear,
  onDragOver,
  onDragLeave,
  selectedModel,
  selectedLabel,
  waterPickerModels,
  enabledWaterIds,
  providerKeyOk,
  onSelectModel,
  onGenerate,
  generating,
  disabled,
  onSwitchToImage,
  className,
}: Props) {
  const [resolution, setResolution] = useState<"standard" | "ultra2k" | "ultra4k">("standard");
  const [detailMode, setDetailMode] = useState<"detail" | "topology">("detail");

  const canSubmit = !generating && !disabled && Boolean(image);

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 w-full flex-col overflow-hidden bg-neutral-50/60 border-r border-neutral-200/80 text-neutral-900 select-none",
        className
      )}
    >
      {/* Top Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-200/80 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
            <Box className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-neutral-900">Model Studio</span>
            </div>
            <p className="text-[11px] text-neutral-400">High precision Image-to-3D</p>
          </div>
        </div>

        {/* Detail vs Topology pill */}
        <div className="flex items-center rounded-lg bg-neutral-100 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => setDetailMode("detail")}
            className={cn(
              "rounded-md px-2 py-1 font-medium transition-colors",
              detailMode === "detail"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800"
            )}
          >
            High Detail
          </button>
          <button
            type="button"
            onClick={() => setDetailMode("topology")}
            className={cn(
              "rounded-md px-2 py-1 font-medium transition-colors",
              detailMode === "topology"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800"
            )}
          >
            Smart Topology
          </button>
        </div>
      </div>

      {/* Main form scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3.5 p-4">
        {/* Model engine selection */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-xs">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              AI Engine
            </span>
            <span className="text-[11px] text-neutral-400">Flagship GPU pipeline</span>
          </div>

          <CreateEnginePicker
            selectedModel={selectedModel}
            selectedLabel={selectedLabel}
            selectedIsCode={false}
            waterPickerModels={waterPickerModels}
            enabledWaterIds={enabledWaterIds}
            providerKeyOk={providerKeyOk}
            onSelect={onSelectModel}
            variant="compact"
            side="bottom"
            align="start"
            scope="cloud"
          />
        </div>

        {/* Meshy-style Prominent Image Dropzone */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-xs">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-[12px] font-semibold text-neutral-800 flex items-center gap-1.5">
              <ImageIcon className="h-3.5 w-3.5 text-neutral-400" />
              <span>Reference Image</span>
            </span>
            <span className="text-[11px] font-semibold text-emerald-600">Required</span>
          </div>

          {image ? (
            <div className="relative flex h-[180px] w-full items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displayImageUrl(image)}
                alt="Selected reference"
                className="h-full w-full object-contain"
              />
              <button
                type="button"
                onClick={onImageClear}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/75 text-white hover:bg-black transition-colors"
                aria-label="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div
              className={cn(
                "relative flex h-[170px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-colors cursor-pointer",
                isDragging
                  ? "border-emerald-500 bg-emerald-50/50"
                  : "border-neutral-200/90 bg-neutral-50/70 hover:border-neutral-300 hover:bg-neutral-100/60"
              )}
              onDrop={onImageDrop}
              onDragOver={(e) => {
                e.preventDefault();
                onDragOver();
              }}
              onDragLeave={onDragLeave}
              onPaste={onImagePaste}
            >
              <input
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                className="hidden"
                id="model-image-dropzone-input"
                onChange={onImageFileSelect}
              />
              <label
                htmlFor="model-image-dropzone-input"
                className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1.5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs border border-neutral-200 text-neutral-500">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <p className="text-[13px] font-medium text-neutral-800">
                  Click / Drag &amp; Drop / Paste Image
                </p>
                <p className="text-[11px] text-neutral-400">
                  Supported Formats: .png, .jpg, .jpeg, .webp
                </p>
                <p className="text-[10px] text-neutral-400">Max size: 20MB</p>
              </label>
            </div>
          )}

          {/* No image yet banner */}
          {!image && (
            <div className="mt-2.5 flex items-center justify-between rounded-xl bg-neutral-100/80 px-3 py-2 text-[11px]">
              <span className="flex items-center gap-1.5 text-neutral-500">
                <HelpCircle className="h-3.5 w-3.5" />
                <span>No image yet? Generate one first.</span>
              </span>
              <button
                type="button"
                onClick={onSwitchToImage}
                className="font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
              >
                <Wand2 className="h-3 w-3" />
                <span>Generate Image</span>
              </button>
            </div>
          )}
        </div>

        {/* Resolution */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-xs">
          <div>
            <span className="text-[12px] font-medium text-neutral-700 block mb-2">Resolution</span>
            <div className="grid grid-cols-3 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => setResolution("standard")}
                className={cn(
                  "rounded-lg py-1.5 font-medium transition-colors border",
                  resolution === "standard"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                )}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setResolution("ultra2k")}
                className={cn(
                  "rounded-lg py-1.5 font-medium transition-colors border flex items-center justify-center gap-1",
                  resolution === "ultra2k"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                )}
              >
                <span>Ultra 2K</span>
                <Crown className="h-2.5 w-2.5 text-amber-500" />
              </button>
              <button
                type="button"
                onClick={() => setResolution("ultra4k")}
                className={cn(
                  "rounded-lg py-1.5 font-medium transition-colors border flex items-center justify-center gap-1",
                  resolution === "ultra4k"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                )}
              >
                <span>Ultra 4K</span>
                <Crown className="h-2.5 w-2.5 text-amber-500" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <PanelGenerateFooter
        canSubmit={canSubmit}
        generating={generating}
        onGenerate={onGenerate}
        label="Generate 3D Model"
        timeEstimate="~2 min"
        creditCost={30}
        disabledReason="Upload a reference image to generate 3D"
      />
    </div>
  );
}
