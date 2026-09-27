"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Check,
  ChevronDown,
  Clock,
  Cloud,
  Droplets,
  Gauge,
  Image as ImageIcon,
  Images,
  Layers,
  Minus,
  Pencil,
  Plus,
  Type,
  WandSparkles,
  X,
} from "lucide-react";
import { CreateEnginePicker } from "@/components/CreateEnginePicker";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QUALITY_TIERS, type QualityTier } from "@/lib/waterSkills";
import { getProxiedImageUrl } from "@/lib/api";
import type { CatalogModel, ModelId } from "@/lib/models";
import { enhancePrompt, isEnhancedPrompt } from "@/lib/prompt-enhancer";
import type { PromptHistoryEntry } from "@/lib/prompt-history";
import { StudioOrb } from "@/components/workspace/StudioOrb";
import { cn } from "@/lib/utils";

export type ChatInputMode = "text" | "image" | "text_1img" | "text_2img";

const MAX_PROMPT = 800;

const displayImageUrl = (url: string | null | undefined): string =>
  getProxiedImageUrl(url) || url || "";

type ModeDef = {
  id: ChatInputMode;
  label: string;
  icon: typeof Type;
  cloudOnly?: boolean;
};

const MODES: ModeDef[] = [
  { id: "text", label: "Text", icon: Type },
  { id: "image", label: "Image", icon: ImageIcon, cloudOnly: true },
  { id: "text_1img", label: "Edit", icon: Pencil },
  { id: "text_2img", label: "Combine", icon: Layers, cloudOnly: true },
];

const EASE = "transition-[background-color,border-color,color,transform] duration-150 ease-out";
const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-neutral-300";
const GHOST = cn(
  "group inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium text-neutral-600",
  "hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.97] data-[state=open]:bg-neutral-100 data-[state=open]:text-neutral-950",
  EASE,
  FOCUS
);
const ICON_BUTTON = cn(
  "flex h-8 w-8 shrink-0 items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.97]",
  "disabled:pointer-events-none disabled:opacity-35 data-[state=open]:bg-neutral-100 data-[state=open]:text-neutral-950",
  EASE,
  FOCUS
);
const CHEVRON =
  "h-3.5 w-3.5 text-neutral-400 transition-transform duration-150 ease-out group-data-[state=open]:rotate-180";

export type WaterEditSlot = {
  parentId: string | null;
  title: string;
  previewUrl: string | null;
  highlight: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onClear: () => void;
};

type ChatComponentProps = {
  prompt: string;
  onPromptChange: (value: string) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  inputMode: ChatInputMode;
  onInputModeChange: (mode: ChatInputMode) => void;
  selectedIsCode: boolean;
  editAvailable: boolean;
  combineAvailable: boolean;
  selectedModel: ModelId;
  selectedLabel: string;
  waterPickerModels: CatalogModel[];
  enabledWaterIds: string[];
  providerKeyOk: (provider: string) => boolean;
  onSelectModel: (id: ModelId, option: CatalogModel) => void;
  qualityTier: QualityTier;
  onQualityTierChange: (tier: QualityTier) => void;
  numGenerations: number;
  onNumGenerationsChange: (n: number) => void;
  promptHistory: PromptHistoryEntry[];
  onSelectHistory: (item: string) => void;
  onClearHistory: () => void;
  image1: string | null;
  image2: string | null;
  isDragging: boolean;
  onImageDrop: (e: React.DragEvent, slot: 1 | 2) => void;
  onImagePaste: (e: React.ClipboardEvent, slot: 1 | 2) => void;
  onImageFileSelect: (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) => void;
  onImageClear: (slot: 1 | 2) => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  waterEdit: WaterEditSlot | null;
  onGenerate: () => void;
  generating: boolean;
  disabled?: boolean;
  error?: string | null;
  costLabel: string;
  generateLabel: string;
  className?: string;
};

function ChatRefTile({
  label,
  image,
  inputId,
  isDragging,
  onDrop,
  onPaste,
  onFileSelect,
  onClear,
  onDragOver,
  onDragLeave,
}: {
  label: string;
  image: string | null;
  inputId: string;
  isDragging: boolean;
  onDrop: (e: React.DragEvent) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
}) {
  return (
    <div
        className={cn(
          "relative flex h-[88px] w-[132px] shrink-0 flex-col items-center justify-center overflow-hidden rounded-[14px] border",
          isDragging
            ? "border-neutral-400 bg-neutral-200"
            : "border-neutral-200/80 bg-neutral-100"
        )}
      onDrop={onDrop}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver();
      }}
      onDragLeave={onDragLeave}
      onPaste={onPaste}
    >
      <input
        type="file"
        accept=".png,.jpg,.jpeg,.webp"
        className="hidden"
        id={inputId}
        onChange={onFileSelect}
      />
      {image ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={displayImageUrl(image)} alt={label} className="absolute inset-0 h-full w-full object-cover" />
          <button
            type="button"
            onClick={onClear}
            className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white active:scale-[0.97]"
            aria-label={`Remove ${label}`}
          >
            <X className="h-3 w-3" strokeWidth={2.4} />
          </button>
        </>
      ) : (
        <label
          htmlFor={inputId}
          className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 px-1.5 text-center"
        >
          <ImageIcon className="h-4 w-4 text-neutral-500" strokeWidth={1.75} />
          <span className="text-[11px] font-medium leading-tight text-neutral-500">{label}</span>
        </label>
      )}
    </div>
  );
}

export function ChatComponent({
  prompt,
  onPromptChange,
  textareaRef,
  inputMode,
  onInputModeChange,
  selectedIsCode,
  editAvailable,
  combineAvailable,
  selectedModel,
  selectedLabel,
  waterPickerModels,
  enabledWaterIds,
  providerKeyOk,
  onSelectModel,
  qualityTier,
  onQualityTierChange,
  numGenerations,
  onNumGenerationsChange,
  promptHistory,
  onSelectHistory,
  onClearHistory,
  image1,
  image2,
  isDragging,
  onImageDrop,
  onImagePaste,
  onImageFileSelect,
  onImageClear,
  onDragOver,
  onDragLeave,
  waterEdit,
  onGenerate,
  generating,
  disabled,
  error,
  costLabel,
  generateLabel,
  className,
}: ChatComponentProps) {
  const innerRef = useRef<HTMLTextAreaElement>(null);
  const promptRef = textareaRef ?? innerRef;
  const preEnhanceRef = useRef<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const activeQuality = QUALITY_TIERS.find((t) => t.id === qualityTier) ?? QUALITY_TIERS[1]!;
  const tabsRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);

  const measureThumb = useCallback(() => {
    const active = tabsRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    setThumb(active ? { left: active.offsetLeft, width: active.offsetWidth } : null);
  }, []);

  useLayoutEffect(measureThumb, [measureThumb, inputMode, selectedIsCode]);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measureThumb);
    observer.observe(el);
    return () => observer.disconnect();
  }, [measureThumb]);

  useEffect(() => {
    if (!prompt) preEnhanceRef.current = null;
    const el = promptRef.current;
    if (!el) return;
    el.style.height = "24px";
    el.style.height = `${Math.min(el.scrollHeight, 136)}px`;
  }, [prompt, promptRef]);

  const visibleModes = MODES.filter((mode) => !mode.cloudOnly || !selectedIsCode);
  const isLocked = (id: ChatInputMode) =>
    !selectedIsCode && ((id === "text_1img" && !editAvailable) || (id === "text_2img" && !combineAvailable));

  const showPrompt = inputMode !== "image";
  const showCloudImages =
    !selectedIsCode && (inputMode === "image" || inputMode === "text_1img" || inputMode === "text_2img");
  const showWaterEdit = Boolean(selectedIsCode && inputMode === "text_1img" && waterEdit);
  const showTiles = showCloudImages || showWaterEdit;
  const canSubmit = !generating && !disabled && (inputMode === "image" ? Boolean(image1) : prompt.trim().length > 0);
  const enhanced = isEnhancedPrompt(prompt);

  const handleEnhance = () => {
    if (disabled || generating || !showPrompt) return;
    if (enhanced && preEnhanceRef.current != null) {
      onPromptChange(preEnhanceRef.current.slice(0, MAX_PROMPT));
      preEnhanceRef.current = null;
      return;
    }
    const source = prompt.trim();
    if (!source) {
      promptRef.current?.focus();
      return;
    }
    preEnhanceRef.current = source;
    const { text } = enhancePrompt(source, {
      engine: selectedIsCode ? "water" : "cloud",
      mode: inputMode === "text_1img" ? "edit" : "create",
    });
    onPromptChange(text.slice(0, MAX_PROMPT));
    promptRef.current?.focus();
  };

  const placeholder =
    selectedIsCode
      ? inputMode === "text_1img"
        ? "Describe how to refine this Water model…"
        : "Describe the object to build in Three.js…"
      : inputMode === "text"
        ? "Describe your 3D object or scene…"
        : inputMode === "text_1img"
          ? "Describe how to edit this image…"
          : "Describe how to combine these images…";

  return (
    <div className={cn("w-full", className)}>
      {error ? (
        <div className="mb-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-[12px] leading-5 text-red-700">
          {error}
        </div>
      ) : null}

      <div
        className={cn(
          "relative overflow-hidden rounded-[24px] border border-neutral-200 bg-white text-neutral-950",
          "shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(0,0,0,0.16)]",
          "transition-[border-color,box-shadow] duration-200 ease-out",
          "focus-within:border-neutral-300 focus-within:shadow-[0_1px_2px_rgba(0,0,0,0.05),0_16px_40px_-18px_rgba(0,0,0,0.22)]"
        )}
      >
        <div className="flex items-center gap-2 px-2.5 pt-2.5">
          <div className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div
              ref={tabsRef}
              role="tablist"
              aria-label="Create mode"
              className="relative inline-flex items-center gap-0.5 rounded-full bg-neutral-100 p-[3px]"
            >
              {thumb ? (
                <span
                  aria-hidden
                  className="absolute inset-y-[3px] left-0 rounded-full bg-white shadow-[0_1px_2px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.04)] transition-[transform,width] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
                  style={{ width: thumb.width, transform: `translateX(${thumb.left}px)` }}
                />
              ) : null}
              {visibleModes.map((mode) => {
                const Icon = mode.icon;
                const active = inputMode === mode.id;
                const locked = isLocked(mode.id);
                return (
                  <button
                    key={mode.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    disabled={locked}
                    onClick={() => {
                      if (!locked) onInputModeChange(mode.id);
                    }}
                    title={locked ? "Requires high-GPU mode (Flux)" : mode.label}
                    className={cn(
                      "relative z-10 inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium active:scale-[0.97]",
                      EASE,
                      FOCUS,
                      active ? "text-neutral-950" : "text-neutral-500 hover:text-neutral-900",
                      locked && "cursor-not-allowed opacity-40 hover:text-neutral-500"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.85} />
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={handleEnhance}
              disabled={disabled || generating || !showPrompt}
              className={cn(ICON_BUTTON, "rounded-full", enhanced && "bg-neutral-100 text-neutral-950")}
              title={enhanced ? "Restore original prompt" : "Enhance prompt"}
              aria-label={enhanced ? "Restore original prompt" : "Enhance prompt"}
              aria-pressed={enhanced}
            >
              <WandSparkles className="h-4 w-4" strokeWidth={1.75} />
            </button>

            <DropdownMenu open={historyOpen} onOpenChange={setHistoryOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(ICON_BUTTON, "rounded-full")}
                  title="Prompt history"
                  aria-label="Prompt history"
                >
                  <Clock className="h-4 w-4" strokeWidth={1.75} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="top"
                sideOffset={10}
                className="w-[min(360px,calc(100vw-2rem))] max-h-[min(340px,50vh)] overflow-y-auto p-0"
              >
                <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-100 bg-white px-3.5 py-2.5">
                  <DropdownMenuLabel className="p-0">Prompt history</DropdownMenuLabel>
                  {promptHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onClearHistory();
                      }}
                      className="text-[11px] font-medium text-neutral-400 hover:text-neutral-950"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {promptHistory.length === 0 ? (
                  <p className="px-4 py-8 text-center text-[13px] text-neutral-500">No prompts in this project yet</p>
                ) : (
                  <DropdownMenuGroup className="p-1">
                    {promptHistory.map((entry) => {
                      const EngineIcon = entry.engine === "water" ? Droplets : Cloud;
                      return (
                        <DropdownMenuItem
                          key={`${entry.at}-${entry.text.slice(0, 24)}`}
                          onSelect={() => onSelectHistory(entry.text.slice(0, MAX_PROMPT))}
                          className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-left"
                        >
                          <EngineIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={1.85} />
                          <span className="min-w-0 flex-1 text-[13px] leading-snug text-neutral-800 line-clamp-2">
                            {entry.text}
                          </span>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuGroup>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {showTiles ? (
          <div className="flex gap-2 overflow-x-auto px-3 pt-3">
            {showWaterEdit && waterEdit ? (
              <div
                className={cn(
                  "relative flex h-[88px] w-[132px] shrink-0 overflow-hidden rounded-[14px] border",
                  waterEdit.highlight
                    ? "border-sky-400 bg-sky-50"
                    : "border-neutral-200/80 bg-neutral-100"
                )}
                onDragOver={waterEdit.onDragOver}
                onDragLeave={waterEdit.onDragLeave}
                onDrop={waterEdit.onDrop}
              >
                {waterEdit.previewUrl ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={displayImageUrl(waterEdit.previewUrl)}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={waterEdit.onClear}
                      className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white active:scale-[0.97]"
                      aria-label="Clear model"
                    >
                      <X className="h-3 w-3" strokeWidth={2.4} />
                    </button>
                  </>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-3 text-center">
                    <Layers className="h-4 w-4 text-neutral-500" strokeWidth={1.75} />
                    <span className="text-[11px] font-medium leading-tight text-neutral-500">
                      Image refs
                    </span>
                  </div>
                )}
              </div>
            ) : null}

            {showCloudImages ? (
              <>
                <ChatRefTile
                  label="Image refs"
                  image={image1}
                  inputId="workspace-chat-image-1"
                  isDragging={isDragging}
                  onDrop={(e) => onImageDrop(e, 1)}
                  onPaste={(e) => onImagePaste(e, 1)}
                  onFileSelect={(e) => onImageFileSelect(e, 1)}
                  onClear={() => onImageClear(1)}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                />
                {inputMode === "text_2img" ? (
                  <ChatRefTile
                    label="Image 2"
                    image={image2}
                    inputId="workspace-chat-image-2"
                    isDragging={isDragging}
                    onDrop={(e) => onImageDrop(e, 2)}
                    onPaste={(e) => onImagePaste(e, 2)}
                    onFileSelect={(e) => onImageFileSelect(e, 2)}
                    onClear={() => onImageClear(2)}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                  />
                ) : null}
              </>
            ) : null}
          </div>
        ) : null}

        {showPrompt ? (
          <div className="px-4 pt-3">
            <textarea
              ref={promptRef}
              value={prompt}
              onChange={(e) => onPromptChange(e.target.value.slice(0, MAX_PROMPT))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  if (canSubmit) onGenerate();
                }
              }}
              maxLength={MAX_PROMPT}
              rows={1}
              disabled={disabled}
              placeholder={placeholder}
              aria-label="Generation prompt"
              className="block max-h-[136px] min-h-[24px] w-full resize-none bg-transparent text-[15px] leading-[1.5] text-neutral-950 outline-none placeholder:text-neutral-400 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        ) : (
          <p className="px-4 pt-3 text-[15px] leading-[1.5] text-neutral-400">Upload an image, then generate a 3D model.</p>
        )}

        <div className="flex items-center gap-1 px-2.5 pb-2.5 pt-3">
          <CreateEnginePicker
            selectedModel={selectedModel}
            selectedLabel={selectedLabel}
            selectedIsCode={selectedIsCode}
            waterPickerModels={waterPickerModels}
            enabledWaterIds={enabledWaterIds}
            providerKeyOk={providerKeyOk}
            onSelect={onSelectModel}
            variant="compact"
            side="top"
            align="start"
          />

          <span aria-hidden className="mx-0.5 h-4 w-px shrink-0 bg-neutral-200" />

          {selectedIsCode ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={cn(GHOST, "max-w-[140px]")}
                  title={activeQuality.description}
                  aria-label={`Quality: ${activeQuality.label}`}
                >
                  <Gauge className="h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={1.85} />
                  <span className="truncate">{activeQuality.label}</span>
                  <ChevronDown className={CHEVRON} strokeWidth={2} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" sideOffset={8} className="min-w-[160px] p-1">
                <DropdownMenuLabel>Quality</DropdownMenuLabel>
                {QUALITY_TIERS.map((tier) => {
                  const selected = qualityTier === tier.id;
                  return (
                    <DropdownMenuItem
                      key={tier.id}
                      onSelect={() => onQualityTierChange(tier.id)}
                      className="cursor-pointer rounded-lg px-2.5 py-2 text-[13px]"
                    >
                      <span className={cn("flex-1", selected && "font-semibold")}>{tier.label}</span>
                      {selected ? <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> : null}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="inline-flex h-8 shrink-0 items-center gap-0.5 pl-2 text-neutral-600" title="How many variants to generate">
              <Images className="mr-0.5 h-3.5 w-3.5 text-neutral-400" strokeWidth={1.85} />
              <button
                type="button"
                onClick={() => onNumGenerationsChange(Math.max(1, numGenerations - 1))}
                disabled={numGenerations <= 1}
                className={cn(ICON_BUTTON, "h-6 w-6 rounded-full")}
                aria-label="Decrease generations"
              >
                <Minus className="h-3 w-3" strokeWidth={2.2} />
              </button>
              <span className="min-w-[1.5ch] text-center text-[13px] font-medium tabular-nums text-neutral-900">
                {numGenerations}
              </span>
              <button
                type="button"
                onClick={() => onNumGenerationsChange(Math.min(10, numGenerations + 1))}
                disabled={numGenerations >= 10}
                className={cn(ICON_BUTTON, "h-6 w-6 rounded-full")}
                aria-label="Increase generations"
              >
                <Plus className="h-3 w-3" strokeWidth={2.2} />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={onGenerate}
            disabled={!canSubmit}
            title={`${generateLabel} · ${costLabel}`}
            aria-label={generateLabel}
            className={cn(
              "ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full active:scale-[0.97]",
              EASE,
              FOCUS,
              canSubmit || generating
                ? "bg-neutral-950 text-white shadow-[0_1px_2px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.12)] hover:bg-neutral-800"
                : "cursor-not-allowed bg-neutral-100 text-neutral-400"
            )}
          >
            {generating ? (
              <StudioOrb state="working" size={20} theme="dark" />
            ) : (
              <ArrowUp className="h-4 w-4" strokeWidth={2.25} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
