"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Box,
  Crown,
  Dices,
  Image as ImageIcon,
  Layers,
  UploadCloud,
  Wand2,
} from "lucide-react";
import { CreateEnginePicker } from "@/components/CreateEnginePicker";
import type { CatalogModel, ModelId } from "@/lib/models";
import type { BackendJob } from "@/lib/api";
import {
  displayImageUrl,
  MAX_PROMPT,
  PanelGenerateFooter,
} from "./composer-parts";
import { cn } from "@/lib/utils";

const RANDOM_EDIT_3D_PROMPTS = [
  "Add glowing neon cybernetic wings to the back and glowing runes",
  "Change the material to polished engraved gold with metallic reflections",
  "Add battle-damaged weathered look with armor cracks and metallic scratches",
  "Transform into a translucent glowing blue ice crystal aesthetic",
  "Add intricate futuristic mechanical armor plating and glowing energy vents",
  "Add glowing magical runes etched across the surface with purple light",
  "Restyle with stylized low-poly cel-shaded aesthetics",
  "Add ornate fantasy filigree with embedded glowing ruby gems",
  "Change textures into dark obsidian stone with molten lava fissures",
  "Add a menacing samurai demon mask motif with sharp horns",
];

type Props = {
  prompt: string;
  onPromptChange: (value: string) => void;
  image: string | null;
  file?: File | null;
  jobId?: string | null;
  selected3DJob?: BackendJob | null;
  library3DAssets?: BackendJob[];
  libraryImages?: BackendJob[];
  onSelect3DModel?: (job: BackendJob) => void;
  onSelectImage?: (job: BackendJob) => void;
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
  resolution?: "standard" | "ultra1k";
  onResolutionChange?: (res: "standard" | "ultra1k") => void;
  onGenerate: () => void;
  generating: boolean;
  disabled?: boolean;
  onSwitchToModel?: () => void;
  className?: string;
  multiViewPreviews?: string[];
  isRenderingMultiView?: boolean;
};

export function EditPanel({
  prompt,
  onPromptChange,
  image,
  file,
  jobId,
  selected3DJob,
  library3DAssets = [],
  libraryImages = [],
  onSelect3DModel,
  onSelectImage,
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
  resolution = "standard",
  onResolutionChange,
  onGenerate,
  generating,
  disabled,
  onSwitchToModel,
  className,
  multiViewPreviews = [],
  isRenderingMultiView = false,
}: Props) {
  const [internalResolution, setInternalResolution] = useState<"standard" | "ultra1k">("standard");
  const activeResolution = resolution ?? internalResolution;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [prompt]);

  const handleResolutionSelect = (res: "standard" | "ultra1k") => {
    setInternalResolution(res);
    if (onResolutionChange) {
      onResolutionChange(res);
    }
  };

  const handleRandomPrompt = () => {
    const candidates = RANDOM_EDIT_3D_PROMPTS.filter((p) => {
      return p !== prompt.trim();
    });
    const randomPick = candidates[Math.floor(Math.random() * candidates.length)] ?? RANDOM_EDIT_3D_PROMPTS[0];
    onPromptChange(randomPick);
  };

  const hasModelSelected = Boolean(image || file || jobId);
  const hasPrompt = prompt.trim().length >= 2;
  const canSubmit = !generating && !disabled && hasModelSelected && hasPrompt;

  const [workspaceAssetTab, setWorkspaceAssetTab] = useState<"3d" | "images">("3d");

  const available3DModels = library3DAssets.filter((j) => {
    return j.status === "DONE" && Boolean(j.previewImageUrl || j.imageUrl || j.resultGlbUrl);
  });

  const availableImages = libraryImages.filter((j) => {
    return Boolean(j.previewImageUrl || j.imageUrl);
  });

  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 w-full flex-col overflow-hidden bg-neutral-50/60 border-r border-neutral-200/80 text-neutral-900 select-none",
        className
      )}
    >
      {/* Top Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-neutral-200/80 bg-white px-4 py-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-semibold text-neutral-900">Edit Studio</span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-semibold text-neutral-800 border border-neutral-200/90">
              3D MODEL EDIT
            </span>
          </div>
          <p className="text-[11px] text-neutral-400">Prompt-guided 3D model modifications</p>
        </div>
      </div>

      {/* Progressive View 1: When no 3D Model is selected yet */}
      {!hasModelSelected ? (
        <>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 p-4">
            {/* Step 1 Indicator */}
            <div className="rounded-2xl border border-neutral-200/80 bg-neutral-50/80 p-3.5">
              <div className="flex items-center gap-2 text-neutral-900">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[11px] font-bold text-white">
                  1
                </span>
                <span className="text-[12px] font-semibold">Select 3D Model to Edit</span>
              </div>
              <p className="mt-1 text-[11px] text-neutral-500 leading-relaxed">
                Choose an existing 3D model from your workspace or drop a 3D file (.glb / mesh) to start editing.
              </p>
            </div>

            {/* Drop / Upload 3D Model Card */}
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-xs">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[12px] font-semibold text-neutral-800 flex items-center gap-1.5">
                  <Box className="h-3.5 w-3.5 text-neutral-500" />
                  <span>Upload 3D Model</span>
                </span>
                <span className="text-[10px] font-medium text-neutral-400">
                  .GLB, .GLTF, .OBJ
                </span>
              </div>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  onDragOver();
                }}
                onDragLeave={onDragLeave}
                onDrop={onImageDrop}
                onClick={() => {
                  const input = document.getElementById("edit-studio-3d-upload") as HTMLInputElement | null;
                  if (input) {
                    input.click();
                  }
                }}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-150 cursor-pointer",
                  isDragging
                    ? "border-neutral-900 bg-neutral-100 scale-[0.99]"
                    : "border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/60"
                )}
              >
                <input
                  id="edit-studio-3d-upload"
                  type="file"
                  accept=".glb,.gltf,.obj,model/gltf-binary,model/gltf+json,image/*"
                  onChange={onImageFileSelect}
                  className="hidden"
                />
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 mb-2">
                  <UploadCloud className="h-5 w-5" />
                </div>
                <p className="text-[12px] font-semibold text-neutral-800">
                  Drop 3D model here, or <span className="text-neutral-900 underline font-bold">browse</span>
                </p>
                <p className="mt-1 text-[11px] text-neutral-400">
                  Drop any .glb / 3D model or reference render to start editing
                </p>
              </div>
            </div>

            {/* Workspace Assets Picker (3D Models & Images) */}
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-xs">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-1 rounded-xl bg-neutral-100 p-0.5 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => {
                      setWorkspaceAssetTab("3d");
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all",
                      workspaceAssetTab === "3d"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-500 hover:text-neutral-800"
                    )}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>3D Models ({available3DModels.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setWorkspaceAssetTab("images");
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg px-2.5 py-1 transition-all",
                      workspaceAssetTab === "images"
                        ? "bg-white text-neutral-900 shadow-xs"
                        : "text-neutral-500 hover:text-neutral-800"
                    )}
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    <span>Workspace Images ({availableImages.length})</span>
                  </button>
                </div>
              </div>

              {workspaceAssetTab === "3d" ? (
                available3DModels.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {available3DModels.map((job) => {
                      const preview = job.previewImageUrl || job.imageUrl;
                      return (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => {
                            if (onSelect3DModel) {
                              onSelect3DModel(job);
                            }
                          }}
                          className="group relative flex flex-col rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-1.5 text-left transition-all hover:border-neutral-900 hover:bg-neutral-100/70 hover:shadow-xs active:scale-[0.98]"
                        >
                          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-100">
                            {preview ? (
                              <img
                                src={displayImageUrl(preview)}
                                alt={job.prompt || "3D Model"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-neutral-300">
                                <Box className="h-6 w-6" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/70 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-neutral-900 shadow-sm">
                                Edit This
                              </span>
                            </div>
                          </div>
                          <span className="mt-1.5 truncate px-0.5 text-[11px] font-medium text-neutral-700">
                            {job.prompt || "3D Model"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-neutral-200 p-5 text-center">
                    <Box className="h-6 w-6 mx-auto text-neutral-300 mb-1.5" />
                    <p className="text-[12px] font-medium text-neutral-600">No 3D models in this workspace</p>
                    <p className="mt-0.5 text-[11px] text-neutral-400">
                      Generate your first model in Model Studio or drop a 3D file above
                    </p>
                    {onSwitchToModel && (
                      <button
                        type="button"
                        onClick={onSwitchToModel}
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-neutral-900 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-neutral-800 transition-colors"
                      >
                        <span>Go to Model Studio</span>
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                )
              ) : (
                availableImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {availableImages.map((job) => {
                      const preview = job.previewImageUrl || job.imageUrl;
                      return (
                        <button
                          key={job.id}
                          type="button"
                          onClick={() => {
                            if (onSelectImage) {
                              onSelectImage(job);
                            } else if (onSelect3DModel) {
                              onSelect3DModel(job);
                            }
                          }}
                          className="group relative flex flex-col rounded-xl border border-neutral-200/80 bg-neutral-50/50 p-1.5 text-left transition-all hover:border-neutral-900 hover:bg-neutral-100/70 hover:shadow-xs active:scale-[0.98]"
                        >
                          <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-neutral-100">
                            {preview ? (
                              <img
                                src={displayImageUrl(preview)}
                                alt={job.prompt || "Workspace Image"}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-neutral-300">
                                <ImageIcon className="h-6 w-6" />
                              </div>
                            )}
                            <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/70 opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-neutral-900 shadow-sm">
                                Edit to 3D
                              </span>
                            </div>
                          </div>
                          <span className="mt-1.5 truncate px-0.5 text-[11px] font-medium text-neutral-700">
                            {job.prompt || "Workspace Image"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-neutral-200 p-5 text-center">
                    <ImageIcon className="h-6 w-6 mx-auto text-neutral-300 mb-1.5" />
                    <p className="text-[12px] font-medium text-neutral-600">No images in this workspace</p>
                    <p className="mt-0.5 text-[11px] text-neutral-400">
                      Generate concept art in Image Studio or upload an image
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Sticky footer when no model selected */}
          <div className="shrink-0 border-t border-neutral-200/80 bg-white/95 p-3.5 backdrop-blur-md">
            <div className="mb-2.5 flex items-center justify-between px-1 text-[12px] text-neutral-500">
              <span className="flex items-center gap-1.5 text-neutral-400">
                Select a 3D model above to unlock editing
              </span>
              <span className="font-medium text-neutral-700">
                65 credits
              </span>
            </div>
            <button
              type="button"
              disabled
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl font-medium text-[14px] bg-neutral-100 text-neutral-400 cursor-not-allowed"
            >
              <Box className="h-4 w-4" />
              <span>Select 3D Model to Edit</span>
            </button>
          </div>
        </>
      ) : (
        /* Progressive View 2: When 3D Model is selected - reveal all editing features */
        <>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-3.5 p-4">
            {/* Active Selected 3D Model Banner */}
            <div className="rounded-2xl border border-neutral-200/90 bg-neutral-50/80 p-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-white">
                    {image && !image.endsWith(".glb") && !image.endsWith(".gltf") && !image.endsWith(".obj") && !image.includes("/glb/") && !(image.startsWith("blob:") && file && (file.name.endsWith(".glb") || file.name.endsWith(".gltf") || file.name.endsWith(".obj"))) ? (
                      <img
                        src={displayImageUrl(image)}
                        alt="Selected 3D Model"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-neutral-400">
                        <Box className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="rounded-full bg-neutral-900 px-2 py-0.5 text-[9px] font-semibold text-white">
                        ACTIVE 3D MODEL
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[12px] font-semibold text-neutral-900">
                      {selected3DJob?.prompt || file?.name || "Selected 3D Model"}
                    </p>
                    <p className="text-[10px] text-neutral-400">Ready for prompt-guided 3D editing</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onImageClear}
                  className="shrink-0 rounded-lg border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors shadow-xs"
                  title="Choose another 3D model"
                >
                  Change
                </button>
              </div>
            </div>

            {/* Prompt Input Box with Dice Randomizer */}
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-xs">
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="edit-prompt-input"
                  className="text-[12px] font-semibold text-neutral-800 flex items-center gap-1.5"
                >
                  <Wand2 className="h-3.5 w-3.5 text-neutral-600" />
                  <span>3D Edit Instructions</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] tabular-nums text-neutral-400">
                    {prompt.length}/{MAX_PROMPT}
                  </span>
                </div>
              </div>

              <textarea
                id="edit-prompt-input"
                ref={textareaRef}
                value={prompt}
                onChange={(e) => {
                  onPromptChange(e.target.value.slice(0, MAX_PROMPT));
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                    if (canSubmit) {
                      e.preventDefault();
                      onGenerate();
                    }
                  }
                }}
                maxLength={MAX_PROMPT}
                rows={3}
                disabled={disabled}
                placeholder="Describe how to modify this 3D model (e.g., add glowing neon cybernetic wings, change armor to polished gold, add battle-damaged cracks)..."
                className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-400 disabled:opacity-50"
              />

              {/* Prompt Action Bar (Dice helper) */}
              <div className="mt-2.5 flex items-center justify-between border-t border-neutral-100 pt-2 text-[11px]">
                <button
                  type="button"
                  onClick={handleRandomPrompt}
                  className="flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                  title="Surprise me with a creative 3D modification prompt"
                >
                  <Dices className="h-3.5 w-3.5 text-neutral-600" />
                  <span>Surprise Me</span>
                </button>

                {prompt.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      onPromptChange("");
                    }}
                    className="text-[11px] text-neutral-400 hover:text-neutral-600 transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

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
                side="top"
                align="start"
                scope="cloud"
              />
            </div>

            {/* Resolution Options */}
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-xs">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-medium text-neutral-700">Resolution</span>
                  <span className="text-[11px] text-neutral-400">High Quality Reconstruction</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      handleResolutionSelect("standard");
                    }}
                    className={cn(
                      "rounded-lg py-1.5 font-medium transition-colors border text-center",
                      activeResolution === "standard"
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    )}
                  >
                    Standard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleResolutionSelect("ultra1k");
                    }}
                    className={cn(
                      "rounded-lg py-1.5 font-medium transition-colors border flex items-center justify-center gap-1",
                      activeResolution === "ultra1k"
                        ? "border-neutral-900 bg-neutral-900 text-white"
                        : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    )}
                  >
                    <span>Ultra 1K</span>
                    <Crown className="h-2.5 w-2.5 opacity-80" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky footer: Shows 65 credits and ~8 min directly */}
          <PanelGenerateFooter
            canSubmit={canSubmit}
            generating={generating}
            onGenerate={onGenerate}
            label="Edit 3D Model"
            timeEstimate={activeResolution === "ultra1k" ? "~8–10 min" : "~8 min"}
            creditCost={65}
            disabledReason={
              !hasPrompt
                ? "Enter edit instructions to modify 3D model"
                : undefined
            }
          />
        </>
      )}
    </div>
  );
}
