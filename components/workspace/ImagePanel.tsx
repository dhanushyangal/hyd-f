"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Image as ImageIcon, Sparkles, Wand2 } from "lucide-react";
import type { PromptHistoryEntry } from "@/lib/prompt-history";
import type { ImageProviderAvailability } from "@/lib/apiHealth";
import {
  imageCredits,
  type ImageOptions,
} from "@/lib/imageOptions";
import {
  ChatRefTile,
  ImageOptionsDropdown,
  MAX_PROMPT,
  PanelGenerateFooter,
  PromptHistoryDropdown,
} from "./composer-parts";
import { cn } from "@/lib/utils";

type Props = {
  prompt: string;
  onPromptChange: (value: string) => void;
  isEditMode: boolean;
  onToggleEditMode: (edit: boolean) => void;
  editAvailable: boolean;
  imageOptions: ImageOptions;
  onImageOptionsChange: (options: ImageOptions) => void;
  imageProviders: ImageProviderAvailability;
  image: string | null;
  isDragging: boolean;
  onImageDrop: (e: React.DragEvent) => void;
  onImagePaste: (e: React.ClipboardEvent) => void;
  onImageFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImageClear: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  promptHistory: PromptHistoryEntry[];
  onSelectHistory: (item: string) => void;
  onClearHistory: () => void;
  onGenerate: () => void;
  generating: boolean;
  disabled?: boolean;
  onSwitchToModel?: () => void;
  className?: string;
};

export function ImagePanel({
  prompt,
  onPromptChange,
  isEditMode,
  onToggleEditMode,
  editAvailable,
  imageOptions,
  onImageOptionsChange,
  imageProviders,
  image,
  isDragging,
  onImageDrop,
  onImagePaste,
  onImageFileSelect,
  onImageClear,
  onDragOver,
  onDragLeave,
  promptHistory,
  onSelectHistory,
  onClearHistory,
  onGenerate,
  generating,
  disabled,
  onSwitchToModel,
  className,
}: Props) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [prompt]);

  const imageOperation = isEditMode ? "edit" : "text-to-image";
  const cost = imageCredits(imageOperation, imageOptions.quality);
  const canSubmit =
    !generating &&
    !disabled &&
    (isEditMode ? Boolean(image && prompt.trim().length >= 2) : prompt.trim().length >= 2);

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
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-100 text-pink-700">
            <ImageIcon className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-neutral-900">Image Studio</span>
            </div>
            <p className="text-[11px] text-neutral-400">Generate reference concepts</p>
          </div>
        </div>

        {/* Mode Switcher: Text vs Edit */}
        <div className="flex items-center rounded-lg bg-neutral-100 p-0.5 text-[11px]">
          <button
            type="button"
            onClick={() => onToggleEditMode(false)}
            className={cn(
              "rounded-md px-2.5 py-1 font-medium transition-colors",
              !isEditMode
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800"
            )}
          >
            Generate
          </button>
          <button
            type="button"
            onClick={() => onToggleEditMode(true)}
            disabled={!editAvailable}
            title={!editAvailable ? "Editing requires OpenAI or Gemini API key" : "Edit image"}
            className={cn(
              "rounded-md px-2.5 py-1 font-medium transition-colors",
              isEditMode
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800",
              !editAvailable && "opacity-40 cursor-not-allowed"
            )}
          >
            Edit
          </button>
        </div>
      </div>

      {/* Main Form */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 p-4">
        {/* Settings row */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
              Provider & Settings
            </span>
            <PromptHistoryDropdown
              promptHistory={promptHistory}
              onSelectHistory={onSelectHistory}
              onClearHistory={onClearHistory}
              open={historyOpen}
              onOpenChange={setHistoryOpen}
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <ImageOptionsDropdown
              imageOptions={imageOptions}
              onImageOptionsChange={onImageOptionsChange}
              imageProviders={imageProviders}
              isEditMode={isEditMode}
            />
          </div>
        </div>

        {/* Reference Image (in Edit Mode) */}
        {isEditMode && (
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-xs">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[12px] font-semibold text-neutral-800 flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-neutral-400" />
                <span>Base Image to Edit</span>
              </span>
              <span className="text-[11px] text-red-500 font-medium">Required</span>
            </div>

            <ChatRefTile
              label="Click or drop base image"
              image={image}
              inputId="image-edit-base"
              isDragging={isDragging}
              onDrop={onImageDrop}
              onPaste={onImagePaste}
              onFileSelect={onImageFileSelect}
              onClear={onImageClear}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className="h-[120px]"
            />
          </div>
        )}

        {/* Prompt input */}
        <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-xs">
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="image-prompt-input"
              className="text-[12px] font-semibold text-neutral-800 flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-neutral-400" />
              <span>{isEditMode ? "Edit instructions" : "Prompt"}</span>
            </label>
            <span className="text-[11px] tabular-nums text-neutral-400">
              {prompt.length}/{MAX_PROMPT}
            </span>
          </div>

          <textarea
            id="image-prompt-input"
            ref={textareaRef}
            value={prompt}
            onChange={(e) => onPromptChange(e.target.value.slice(0, MAX_PROMPT))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                if (canSubmit) {
                  e.preventDefault();
                  onGenerate();
                }
              }
            }}
            maxLength={MAX_PROMPT}
            rows={4}
            disabled={disabled}
            placeholder={
              isEditMode
                ? "Describe how to modify the image (e.g. change color to crimson, add wings, remove background)..."
                : "Describe the image to generate (e.g. fantasy paladin warrior in ornate silver armor, studio lighting)..."
            }
            className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-400 disabled:opacity-50"
          />
        </div>

        {/* 3D Handoff Banner */}
        {onSwitchToModel && (
          <div
            onClick={onSwitchToModel}
            className="group cursor-pointer rounded-xl border border-neutral-200/90 bg-white p-3 transition-colors hover:border-neutral-300 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Wand2 className="h-3.5 w-3.5" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-neutral-800">Want a 3D Model?</p>
                  <p className="text-[11px] text-neutral-400">Jump to Model Studio to turn images into 3D meshes</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-neutral-400 transition-transform group-hover:translate-x-0.5 group-hover:text-neutral-700" />
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer */}
      <PanelGenerateFooter
        canSubmit={canSubmit}
        generating={generating}
        onGenerate={onGenerate}
        label={isEditMode ? "Edit Image" : "Generate Image"}
        timeEstimate="~10–20s"
        creditCost={cost}
        disabledReason={
          isEditMode && !image
            ? "Upload a base image to edit"
            : "Enter a prompt to generate"
        }
      />
    </div>
  );
}
