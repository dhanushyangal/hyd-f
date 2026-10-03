"use client";

import { useEffect, useRef, useState } from "react";
import {
  Crown,
  Dices,
  Image as ImageIcon,
  Pencil,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";
import { CreateEnginePicker } from "@/components/CreateEnginePicker";
import type { CatalogModel, ModelId } from "@/lib/models";
import type { PromptHistoryEntry } from "@/lib/prompt-history";
import type { BackendJob } from "@/lib/api";
import {
  displayImageUrl,
  MAX_PROMPT,
  PanelGenerateFooter,
  PromptHistoryDropdown,
} from "./composer-parts";
import { cn } from "@/lib/utils";

const SAMPLE_3D_PROMPTS = [
  "A futuristic cyberpunk sneaker with glowing neon trim and carbon fiber sole",
  "A detailed ancient dragon skull carved from weathered black obsidian",
  "A high-tech sci-fi surveillance drone with quad rotors and metallic finish",
  "An ornate fantasy health potion bottle with glowing crimson liquid and gold filigree",
  "A stylized retro astronaut helmet with reflective golden visor",
  "A battle-hardened samurai helmet with horned crest and lacquered red armor",
];

type Props = {
  prompt?: string;
  onPromptChange?: (value: string) => void;
  promptHistory?: PromptHistoryEntry[];
  onSelectHistory?: (item: string) => void;
  onClearHistory?: () => void;
  inputMode?: "image" | "prompt";
  onInputModeChange?: (mode: "image" | "prompt") => void;
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
  resolution?: "standard" | "ultra1k";
  onResolutionChange?: (res: "standard" | "ultra1k") => void;
  onGenerate: () => void;
  generating: boolean;
  disabled?: boolean;
  libraryImages?: BackendJob[];
  onSelectImage?: (job: BackendJob) => void;
  onSwitchToImage?: () => void;
  onSwitchToEdit?: () => void;
  className?: string;
};

export function ModelPanel({
  prompt,
  onPromptChange,
  promptHistory,
  onSelectHistory,
  onClearHistory,
  inputMode,
  onInputModeChange,
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
  resolution = "standard",
  onResolutionChange,
  onGenerate,
  generating,
  disabled,
  libraryImages = [],
  onSelectImage,
  className,
}: Props) {
  const [internalMode, setInternalMode] = useState<"image" | "prompt">("image");
  const activeMode = inputMode ?? internalMode;

  const [internalPrompt, setInternalPrompt] = useState("");
  const activePrompt = prompt ?? internalPrompt;

  const [internalResolution, setInternalResolution] = useState<"standard" | "ultra1k">("standard");
  const activeResolution = resolution ?? internalResolution;

  const [historyOpen, setHistoryOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [activePrompt, activeMode]);

  const handleModeChange = (mode: "image" | "prompt") => {
    setInternalMode(mode);
    if (onInputModeChange) {
      onInputModeChange(mode);
    }
  };

  const handlePromptChange = (val: string) => {
    setInternalPrompt(val);
    if (onPromptChange) {
      onPromptChange(val);
    }
  };

  const handleRandomPrompt = () => {
    const candidates = SAMPLE_3D_PROMPTS.filter((p) => {
      return p !== activePrompt.trim();
    });
    const pick = candidates[Math.floor(Math.random() * candidates.length)] ?? SAMPLE_3D_PROMPTS[0];
    handlePromptChange(pick);
  };

  const handleResolutionSelect = (res: "standard" | "ultra1k") => {
    setInternalResolution(res);
    if (onResolutionChange) {
      onResolutionChange(res);
    }
  };

  const canSubmit =
    activeMode === "image"
      ? !generating && !disabled && Boolean(image)
      : !generating && !disabled && activePrompt.trim().length >= 2;

  const disabledReason =
    activeMode === "image"
      ? "Upload a reference image to generate 3D"
      : "Enter a prompt to generate 3D";

  const label = activeMode === "prompt" ? "Generate 3D from Prompt" : "Generate 3D Model";
  const creditCost = activeResolution === "ultra1k" ? 40 : 30;

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
            <span className="text-[13px] font-semibold text-neutral-900">Model Studio</span>
          </div>
          <p className="text-[11px] text-neutral-400">High precision Image-to-3D</p>
        </div>
      </div>

      {/* Main form scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-3.5 p-4">
        {/* Main Creation Card: Image Upload or Prompt to 3D */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-xs">
          {/* Segmented Mode Switcher */}
          <div className="mb-3.5 grid grid-cols-2 rounded-xl bg-neutral-100 p-1 text-neutral-600">
            <button
              type="button"
              onClick={() => handleModeChange("image")}
              title="Reference Image"
              aria-label="Reference Image"
              className={cn(
                "flex h-8 items-center justify-center gap-1.5 rounded-lg transition-all duration-150",
                activeMode === "image"
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              <ImageIcon className="h-4 w-4" />
              {image ? (
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    activeMode === "image" ? "bg-white" : "bg-neutral-900"
                  )}
                />
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("prompt")}
              title="Prompt to 3D"
              aria-label="Prompt to 3D"
              className={cn(
                "flex h-8 items-center justify-center gap-1.5 rounded-lg transition-all duration-150",
                activeMode === "prompt"
                  ? "bg-neutral-900 text-white shadow-xs"
                  : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              <Pencil className="h-4 w-4" />
              {activePrompt.trim().length > 0 ? (
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    activeMode === "prompt" ? "bg-white" : "bg-neutral-900"
                  )}
                />
              ) : null}
            </button>
          </div>

          {activeMode === "image" ? (
            <div className="flex min-h-[220px] flex-col justify-between">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-neutral-900 flex items-center gap-1.5">
                    <ImageIcon className="h-3.5 w-3.5 text-neutral-500" />
                    <span>Reference Image</span>
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                    Required
                  </span>
                </div>

                {image ? (
                  <div className="relative flex h-[170px] w-full items-center justify-center overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
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
                      "relative flex h-[130px] w-full flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center transition-all cursor-pointer",
                      isDragging
                        ? "border-neutral-900 bg-neutral-100"
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
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs border border-neutral-200 text-neutral-700">
                        <UploadCloud className="h-4.5 w-4.5" />
                      </div>
                      <p className="text-[12px] font-medium text-neutral-900">
                        Click / Drag &amp; Drop / Paste Image
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        Supported: .png, .jpg, .jpeg, .webp (max 20MB)
                      </p>
                    </label>
                  </div>
                )}
              </div>

              {/* No image ready helper */}
              {!image ? (
                <div className="mt-2.5 flex items-center justify-between rounded-xl border border-neutral-200/80 bg-neutral-50/80 px-3 py-2 text-[11px]">
                  <span className="flex items-center gap-1.5 text-neutral-500">
                    <Pencil className="h-3.5 w-3.5 text-neutral-500" />
                    <span>Don&apos;t have an image?</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => handleModeChange("prompt")}
                    className="font-semibold text-neutral-900 hover:underline transition-colors"
                  >
                    Use Text Prompt &rarr;
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-[220px] flex-col justify-between">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-neutral-900 flex items-center gap-1.5">
                    <Pencil className="h-3.5 w-3.5 text-neutral-500" />
                    <span>3D Prompt</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {promptHistory && promptHistory.length > 0 && onSelectHistory && onClearHistory ? (
                      <PromptHistoryDropdown
                        promptHistory={promptHistory}
                        onSelectHistory={onSelectHistory}
                        onClearHistory={onClearHistory}
                        open={historyOpen}
                        onOpenChange={setHistoryOpen}
                      />
                    ) : null}
                    <span className="text-[11px] tabular-nums text-neutral-400">
                      {activePrompt.length}/{MAX_PROMPT}
                    </span>
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  value={activePrompt}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  placeholder="Describe the 3D model to generate (e.g. A futuristic cybernetic sneaker with metallic laces)..."
                  rows={4}
                  maxLength={MAX_PROMPT}
                  className="w-full resize-none rounded-xl border border-neutral-200/90 bg-neutral-50/50 p-2.5 text-[12px] text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-900 focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              {/* Suggestions & roll random */}
              <div className="mt-2.5 flex items-center justify-between gap-1 pt-1">
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                  {["Sci-Fi Drone", "Cyberpunk Helmet", "Fantasy Potion", "Mech Armor"].map((idea) => {
                    return (
                      <button
                        key={idea}
                        type="button"
                        onClick={() => {
                          const match =
                            SAMPLE_3D_PROMPTS.find((p) => {
                              return p.toLowerCase().includes(idea.toLowerCase().split(" ")[0]);
                            }) ?? idea;
                          handlePromptChange(match);
                        }}
                        className="shrink-0 rounded-lg border border-neutral-200/80 bg-neutral-50 px-2 py-1 text-[10px] font-medium text-neutral-700 hover:border-neutral-400 hover:bg-neutral-100 transition-colors"
                      >
                        {idea}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleRandomPrompt}
                  className="flex items-center gap-1 shrink-0 pl-1 text-[11px] font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                  title="Surprise me with a random prompt"
                >
                  <Dices className="h-3.5 w-3.5 text-neutral-500" />
                  <span>Roll</span>
                </button>
              </div>
            </div>
          )}
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
              <span className="text-[11px] text-neutral-400">
                {activeResolution === "ultra1k" ? "40 credits" : "30 credits"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleResolutionSelect("standard")}
                className={cn(
                  "rounded-lg py-1.5 font-medium transition-colors border text-center",
                  activeResolution === "standard"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                )}
              >
                Standard (30 cr)
              </button>
              <button
                type="button"
                onClick={() => handleResolutionSelect("ultra1k")}
                className={cn(
                  "rounded-lg py-1.5 font-medium transition-colors border flex items-center justify-center gap-1",
                  activeResolution === "ultra1k"
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                )}
              >
                <span>Ultra 1K (40 cr)</span>
                <Crown className="h-2.5 w-2.5 opacity-80" />
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
        label={label}
        timeEstimate={activeResolution === "ultra1k" ? "~8–10 min" : "~8 min"}
        creditCost={creditCost}
        disabledReason={disabledReason}
      />
    </div>
  );
}
