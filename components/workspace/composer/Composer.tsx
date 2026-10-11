"use client";

import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { ArrowUp, Box, Coins, Droplets, Image as ImageIcon, PenLine, Sparkles, Type, Upload, X } from "lucide-react";
import { COMPOSER_SIZE } from "@/lib/composer-size";
import type { PromptHistoryEntry } from "@/lib/prompt-history";
import { cn } from "@/lib/utils";
import { StudioOrb } from "../StudioOrb";
import { ChatRefTile, EASE, FOCUS, MAX_PROMPT, PromptHistoryDropdown } from "../composer-parts";
import type { ComposerMode } from "../types";

export type ComposerAttachment = {
  kind: "image" | "model";
  /** Thumbnail; null while a 3D upload is still rendering its snapshot. */
  preview: string | null;
  label: string;
};

/** The input tile left of the prompt (image → 3D, image edit, model edit). */
export type ComposerSlot = {
  label: string;
  /** Shown inside the empty dropzone when the slot is the only input. */
  hint?: string;
  kind: "image" | "model";
  attachment: ComposerAttachment | null;
  /** File types the tile's picker offers. */
  accept: ("image" | "model")[];
};

export type ComposerSuggestion = {
  label: string;
  icon: "model" | "image";
  onClick: () => void;
};

const MODES: { id: ComposerMode; label: string; icon: typeof ImageIcon }[] = [
  { id: "image", label: "Image", icon: ImageIcon },
  { id: "3d", label: "3D", icon: Box },
  { id: "agent", label: "Agent", icon: Droplets },
];

const INPUTS: Record<"3d" | "image", { id: string; label: string; icon: typeof ImageIcon }[]> = {
  "3d": [
    { id: "image", label: "Image", icon: ImageIcon },
    { id: "prompt", label: "Text", icon: Type },
    { id: "edit", label: "Edit", icon: PenLine },
  ],
  image: [
    { id: "generate", label: "Generate", icon: Sparkles },
    { id: "edit", label: "Edit", icon: PenLine },
  ],
};

const ACCEPT = {
  image: ".png,.jpg,.jpeg,.webp",
  model: ".glb,.gltf,.obj,model/gltf-binary,model/gltf+json",
} as const;

const METRICS = {
  small: {
    width: "max-w-[620px]",
    radius: "rounded-2xl",
    segment: "sm" as const,
    bar: "gap-1.5 px-2.5 pt-2",
    dropWrap: "px-2.5 pt-2 pb-2",
    drop: "h-16 gap-1 rounded-xl",
    dropLabel: "text-[13px]",
    dropHint: "text-[11px]",
    prompt: "gap-2 px-3 pt-2 pb-2",
    type: "py-1.5 text-[14px] leading-5",
    minWithSlot: "min-h-10",
    minAlone: "min-h-8",
    tile: "h-12 w-12",
    foot: "px-2.5 pb-2 pt-1.5",
    cost: "h-7 px-2 text-[11px]",
    submit: "h-8 w-8",
    promptMax: 112,
  },
  medium: {
    width: "max-w-[680px]",
    radius: "rounded-2xl",
    segment: "md" as const,
    bar: "gap-2 px-3 pt-2.5",
    dropWrap: "px-3 pt-2.5 pb-2.5",
    drop: "h-20 gap-1 rounded-xl",
    dropLabel: "text-[13px]",
    dropHint: "text-[12px]",
    prompt: "gap-2.5 px-3.5 pt-2.5 pb-2.5",
    type: "py-1.5 text-[14px] leading-5",
    minWithSlot: "min-h-12",
    minAlone: "min-h-10",
    tile: "h-14 w-14",
    foot: "px-3 pb-2.5 pt-2",
    cost: "h-8 px-2.5 text-[12px]",
    submit: "h-8 w-8",
    promptMax: 136,
  },
  large: {
    width: "max-w-[760px]",
    radius: "rounded-[24px]",
    segment: "md" as const,
    bar: "gap-2 px-3 pt-3",
    dropWrap: "px-3 pt-3 pb-2.5",
    drop: "h-24 gap-1.5 rounded-2xl",
    dropLabel: "text-[14px]",
    dropHint: "text-[12px]",
    prompt: "gap-3 px-4 pt-3 pb-2",
    type: "py-2 text-[15px] leading-6",
    minWithSlot: "min-h-16",
    minAlone: "min-h-12",
    tile: "",
    foot: "px-3 pb-3 pt-2",
    cost: "h-8 px-2.5 text-[12px]",
    submit: "h-9 w-9",
    promptMax: 160,
  },
} as const;

type Props = {
  mode: ComposerMode;
  onModeChange: (mode: ComposerMode) => void;
  /** Sub-mode under the tabs: 3D source (Model3DSource) or image generate / edit. */
  inputSwitch?: {
    set: "3d" | "image";
    value: string;
    onChange: (value: string) => void;
    /** Options shown but not selectable, with the reason as a tooltip. */
    disabled?: { ids: string[]; reason: string };
    /** Briefly shine one option; a new `key` replays it. */
    attention?: { id: string; key: string };
  } | null;
  /** Agent refine history, shown collapsed above the prompt. */
  thread?: ReactNode;
  slot: ComposerSlot | null;
  onClearAttachment: () => void;
  /** Accept dropped / pasted files in this mode. */
  acceptFiles: boolean;
  onAttachFile: (file: File) => void;
  onDropOnComposer: (e: React.DragEvent) => void;
  /** False when the slot alone is the input (image → 3D); the placeholder becomes a hint. */
  showPrompt: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  suggestion: ComposerSuggestion | null;
  settings: ReactNode;
  cost: number | null;
  submitLabel: string;
  canSubmit: boolean;
  generating: boolean;
  onSubmit: () => void;
  error: string | null;
  onDismissError: () => void;
  promptHistory: PromptHistoryEntry[];
  onSelectHistory: (text: string) => void;
  onClearHistory: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  className?: string;
};

function Segmented<T extends string>({
  label,
  items,
  value,
  onChange,
  disabled,
  attention,
  size,
}: {
  label: string;
  items: { id: T; label: string; icon: typeof ImageIcon }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: { ids: string[]; reason: string };
  attention?: { id: string; key: string };
  size: "md" | "sm";
}) {
  return (
    <div
      className="flex shrink-0 items-center rounded-lg bg-neutral-100 p-0.5 ring-1 ring-inset ring-black/[0.06]"
      role="radiogroup"
      aria-label={label}
    >
      {items.map(({ id, label: itemLabel, icon: Icon }) => {
        const off = Boolean(disabled?.ids.includes(id));
        return (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          aria-label={itemLabel}
          aria-disabled={off || undefined}
          title={off ? disabled?.reason : undefined}
          onClick={() => {
            if (!off) onChange(id);
          }}
          className={cn(
            "relative inline-flex items-center gap-1.5 overflow-hidden font-medium",
            size === "md" ? "h-8 rounded-md px-2.5 text-[13px]" : "h-7 rounded-md px-2 text-[12px]",
            EASE,
            FOCUS,
            value === id
              ? "bg-white text-neutral-950 shadow-[0_1px_1px_rgba(0,0,0,0.06)] ring-1 ring-neutral-200"
              : off
                ? "cursor-not-allowed text-neutral-300"
                : "text-neutral-500 hover:text-neutral-900"
          )}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="max-sm:sr-only">{itemLabel}</span>
          {attention?.id === id && value !== id && !off ? (
            <span key={attention.key} aria-hidden className="segment-shine" />
          ) : null}
        </button>
        );
      })}
    </div>
  );
}

export function Composer({
  mode,
  onModeChange,
  inputSwitch,
  thread,
  slot,
  onClearAttachment,
  acceptFiles,
  onAttachFile,
  onDropOnComposer,
  showPrompt,
  value,
  onChange,
  placeholder,
  suggestion,
  settings,
  cost,
  submitLabel,
  canSubmit,
  generating,
  onSubmit,
  error,
  onDismissError,
  promptHistory,
  onSelectHistory,
  onClearHistory,
  textareaRef,
  className,
}: Props) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const metrics = METRICS[COMPOSER_SIZE];

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, metrics.promptMax)}px`;
  }, [value, textareaRef, showPrompt, metrics.promptMax]);

  const pickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onAttachFile(file);
  };

  const submitIfReady = () => {
    if (canSubmit && !generating) onSubmit();
  };

  const ready = canSubmit && !generating;

  return (
    <div className={cn("relative mx-auto w-full", metrics.width, className)}>
      {suggestion && !generating ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-full flex justify-center pb-2.5">
          <button
            type="button"
            onClick={suggestion.onClick}
            className={cn(
              "pointer-events-auto inline-flex h-8 items-center gap-2 rounded-full border border-neutral-200/80 bg-white/95 px-3 text-[13px] font-medium text-neutral-800 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)] backdrop-blur-xl hover:bg-neutral-50 active:scale-[0.98]",
              EASE,
              FOCUS
            )}
          >
            {suggestion.icon === "model" ? (
              <Box className="h-3.5 w-3.5 text-neutral-500" strokeWidth={1.9} />
            ) : (
              <ImageIcon className="h-3.5 w-3.5 text-neutral-500" strokeWidth={1.9} />
            )}
            {suggestion.label}
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          "pointer-events-auto overflow-hidden border bg-white shadow-[0_1px_1px_rgba(0,0,0,0.04),0_10px_28px_-16px_rgba(0,0,0,0.28)]",
          metrics.radius,
          dragOver ? "border-neutral-900 ring-4 ring-neutral-900/5" : "border-neutral-200",
          "transition-[border-color,box-shadow] duration-150"
        )}
        onDragOver={(e) => {
          if (!acceptFiles) return;
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          setDragOver(false);
          onDropOnComposer(e);
        }}
      >
        {error ? (
          <div className="flex items-start gap-2 border-b border-red-100 bg-red-50/80 px-4 py-2.5 text-[13px] leading-5 text-red-700" role="alert">
            <span className="min-w-0 flex-1">{error}</span>
            <button
              type="button"
              onClick={onDismissError}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-red-500 hover:bg-red-100 hover:text-red-700"
              aria-label="Dismiss error"
            >
              <X className="h-3.5 w-3.5" strokeWidth={2.2} />
            </button>
          </div>
        ) : null}

        <div className={cn("flex items-center", metrics.bar)}>
          <Segmented label="Create" items={MODES} value={mode} onChange={onModeChange} size={metrics.segment} />
          {inputSwitch ? (
            <>
              <span className="h-4 w-px bg-neutral-300" aria-hidden />
              <Segmented
                label={inputSwitch.set === "3d" ? "Generate from" : "Image action"}
                items={INPUTS[inputSwitch.set]}
                value={inputSwitch.value}
                onChange={inputSwitch.onChange}
                disabled={inputSwitch.disabled}
                attention={inputSwitch.attention}
                size={COMPOSER_SIZE === "large" ? "sm" : metrics.segment}
              />
            </>
          ) : null}
          <div className="ml-auto">
            {promptHistory.length > 0 && showPrompt ? (
              <PromptHistoryDropdown
                promptHistory={promptHistory}
                onSelectHistory={onSelectHistory}
                onClearHistory={onClearHistory}
                open={historyOpen}
                onOpenChange={setHistoryOpen}
              />
            ) : null}
          </div>
        </div>

        {thread ? <div className="mt-2.5 border-t border-neutral-100">{thread}</div> : null}

        {slot && !slot.attachment && !showPrompt ? (
          <div className={metrics.dropWrap}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex w-full flex-col items-center justify-center border border-dashed border-neutral-300 bg-neutral-50 text-neutral-500 hover:border-neutral-900 hover:bg-white hover:text-neutral-900",
                metrics.drop,
                dragOver && "border-neutral-900 bg-white",
                EASE,
                FOCUS
              )}
            >
              <span className={cn("flex items-center gap-1.5 font-medium text-neutral-900", metrics.dropLabel)}>
                <Upload className="h-3.5 w-3.5" strokeWidth={2} />
                {slot.label}
              </span>
              {slot.hint ? <span className={cn("text-neutral-400", metrics.dropHint)}>{slot.hint}</span> : null}
            </button>
          </div>
        ) : (
        <div className={cn("flex items-start", metrics.prompt, thread && "pt-2")}>
          {slot ? (
            <ChatRefTile
              label={slot.attachment?.label ?? slot.label}
              preview={slot.attachment?.preview ?? null}
              kind={slot.attachment?.kind ?? slot.kind}
              filled={Boolean(slot.attachment)}
              onPick={() => fileInputRef.current?.click()}
              onClear={onClearAttachment}
              className={metrics.tile || undefined}
            />
          ) : null}

          {showPrompt ? (
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value.slice(0, MAX_PROMPT))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  submitIfReady();
                }
              }}
              onPaste={(e) => {
                const file = e.clipboardData.files?.[0];
                if (file && acceptFiles) {
                  e.preventDefault();
                  onAttachFile(file);
                }
              }}
              rows={1}
              maxLength={MAX_PROMPT}
              aria-label="Prompt"
              placeholder={placeholder}
              className={cn(
                "flex-1 resize-none bg-transparent text-neutral-900 outline-none placeholder:text-neutral-400",
                metrics.type,
                slot ? metrics.minWithSlot : metrics.minAlone
              )}
            />
          ) : null}
        </div>
        )}

        <div className={cn("flex items-center gap-1 border-t border-neutral-200", metrics.foot)}>
          <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto no-scrollbar">{settings}</div>

          {cost != null ? (
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1 rounded-full bg-neutral-100 font-medium tabular-nums text-neutral-700",
                metrics.cost
              )}
              title={`${cost} credits`}
            >
              <Coins className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.9} />
              {cost}
            </span>
          ) : null}
          <button
            type="button"
            onClick={submitIfReady}
            disabled={!ready}
            aria-label={submitLabel}
            title={submitLabel}
            className={cn(
              "ml-1 flex shrink-0 items-center justify-center rounded-full",
              metrics.submit,
              EASE,
              FOCUS,
              ready ? "bg-neutral-950 text-white hover:bg-neutral-800 active:scale-[0.95]" : "cursor-not-allowed bg-neutral-100 text-neutral-400"
            )}
          >
            {generating ? <StudioOrb state="working" size={20} /> : <ArrowUp className="h-4 w-4" strokeWidth={2.4} />}
          </button>
        </div>

        {slot ? (
          <input
            ref={fileInputRef}
            type="file"
            accept={slot.accept.map((k) => ACCEPT[k]).join(",")}
            className="hidden"
            onChange={pickFile}
          />
        ) : null}
      </div>
    </div>
  );
}
