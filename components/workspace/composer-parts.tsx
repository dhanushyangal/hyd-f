"use client";

import {
  Check,
  ChevronDown,
  Clock,
  Cloud,
  Droplets,
  Gauge,
  Image as ImageIcon,
  SlidersHorizontal,
  Wand2,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  QUALITY_TIERS,
  WATER_SKILLS,
  type QualityTier,
  type WaterSkillId,
} from "@/lib/waterSkills";
import { getProxiedImageUrl } from "@/lib/api";
import type { PromptHistoryEntry } from "@/lib/prompt-history";
import { StudioOrb } from "@/components/workspace/StudioOrb";
import { cn } from "@/lib/utils";
import type { ImageProviderAvailability } from "@/lib/apiHealth";
import {
  IMAGE_ASPECT_OPTIONS,
  IMAGE_PROVIDER_OPTIONS,
  IMAGE_QUALITY_OPTIONS,
  imageCredits,
  imageTierHint,
  type ImageOptions,
} from "@/lib/imageOptions";

export const MAX_PROMPT = 800;

export const displayImageUrl = (url: string | null | undefined): string => {
  return getProxiedImageUrl(url) || url || "";
};

export const EASE =
  "transition-[background-color,border-color,color,transform] duration-150 ease-out";
export const FOCUS = "outline-none focus-visible:ring-2 focus-visible:ring-neutral-300";
export const GHOST = cn(
  "group inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium text-neutral-600",
  "hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.97] data-[state=open]:bg-neutral-100 data-[state=open]:text-neutral-950",
  EASE,
  FOCUS
);
export const ICON_BUTTON = cn(
  "flex h-8 w-8 shrink-0 items-center justify-center text-neutral-500 hover:bg-neutral-100 hover:text-neutral-950 active:scale-[0.97]",
  "disabled:pointer-events-none disabled:opacity-35 data-[state=open]:bg-neutral-100 data-[state=open]:text-neutral-950",
  EASE,
  FOCUS
);
export const CHEVRON =
  "h-3.5 w-3.5 text-neutral-400 transition-transform duration-150 ease-out group-data-[state=open]:rotate-180";

export function ChatRefTile({
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
  className,
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
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-[88px] w-full shrink-0 flex-col items-center justify-center overflow-hidden rounded-[14px] border",
        isDragging
          ? "border-neutral-400 bg-neutral-200"
          : "border-neutral-200/80 bg-neutral-100",
        className
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
          <img
            src={displayImageUrl(image)}
            alt={label}
            className="absolute inset-0 h-full w-full object-cover"
          />
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
          <span className="text-[11px] font-medium leading-tight text-neutral-500">
            {label}
          </span>
        </label>
      )}
    </div>
  );
}

export function PromptHistoryDropdown({
  promptHistory,
  onSelectHistory,
  onClearHistory,
  open,
  onOpenChange,
}: {
  promptHistory: PromptHistoryEntry[];
  onSelectHistory: (item: string) => void;
  onClearHistory: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
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
        side="bottom"
        sideOffset={8}
        className="w-[min(340px,calc(100vw-2rem))] max-h-[min(340px,50vh)] overflow-y-auto p-0"
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
          <p className="px-4 py-8 text-center text-[13px] text-neutral-500">
            No prompts in this project yet
          </p>
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
                  <EngineIcon
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 text-neutral-400"
                    strokeWidth={1.85}
                  />
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
  );
}

export function WaterQualityDropdown({
  qualityTier,
  onQualityTierChange,
}: {
  qualityTier: QualityTier;
  onQualityTierChange: (tier: QualityTier) => void;
}) {
  const activeQuality =
    QUALITY_TIERS.find((t) => t.id === qualityTier) ?? QUALITY_TIERS[1]!;

  return (
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
      <DropdownMenuContent align="start" side="bottom" sideOffset={8} className="min-w-[180px] p-1">
        <DropdownMenuLabel>Quality tier</DropdownMenuLabel>
        {QUALITY_TIERS.map((tier) => {
          const selected = qualityTier === tier.id;
          return (
            <DropdownMenuItem
              key={tier.id}
              onSelect={() => onQualityTierChange(tier.id)}
              className="cursor-pointer rounded-lg px-2.5 py-2 text-[13px]"
            >
              <div className="flex flex-1 flex-col">
                <span className={cn(selected && "font-semibold")}>{tier.label}</span>
                <span className="text-[11px] text-neutral-400">{tier.hint}</span>
              </div>
              {selected ? <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function WaterSkillDropdown({
  skillId,
  onSkillChange,
}: {
  skillId: WaterSkillId;
  onSkillChange: (skillId: WaterSkillId) => void;
}) {
  const activeSkill =
    WATER_SKILLS.find((s) => s.id === skillId) ?? WATER_SKILLS[0]!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(GHOST, "max-w-[160px]")}
          title={activeSkill.description}
          aria-label={`Skill: ${activeSkill.label}`}
        >
          <Wand2 className="h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={1.85} />
          <span className="truncate">{activeSkill.label}</span>
          <ChevronDown className={CHEVRON} strokeWidth={2} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" sideOffset={8} className="min-w-[220px] p-1">
        <DropdownMenuLabel>Skill pack</DropdownMenuLabel>
        {WATER_SKILLS.map((skill) => {
          const selected = skillId === skill.id;
          return (
            <DropdownMenuItem
              key={skill.id}
              onSelect={() => onSkillChange(skill.id)}
              className="cursor-pointer rounded-lg px-2.5 py-2 text-[13px]"
            >
              <div className="flex flex-1 flex-col">
                <span className={cn(selected && "font-semibold")}>{skill.label}</span>
                <span className="text-[11px] text-neutral-400 leading-snug">
                  {skill.description}
                </span>
              </div>
              {selected ? <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ImageOptionsDropdown({
  imageOptions,
  onImageOptionsChange,
  imageProviders,
  isEditMode,
}: {
  imageOptions: ImageOptions;
  onImageOptionsChange: (options: ImageOptions) => void;
  imageProviders: ImageProviderAvailability;
  isEditMode: boolean;
}) {
  const providerLabel =
    IMAGE_PROVIDER_OPTIONS.find((p) => p.id === imageOptions.provider)?.label ??
    imageOptions.provider;
  const qualityLabel =
    IMAGE_QUALITY_OPTIONS.find((q) => q.id === imageOptions.quality)?.label ??
    imageOptions.quality;
  const imageOperation = isEditMode ? "edit" : "text-to-image";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(GHOST, "max-w-[190px]")}
          title={`${providerLabel} · ${qualityLabel} · ${imageCredits(imageOperation, imageOptions.quality)} credits`}
          aria-label={`Image settings: ${providerLabel}, ${qualityLabel} quality`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={1.85} />
          <span className="truncate">
            {providerLabel} · {qualityLabel}
            {!isEditMode ? ` · ${imageOptions.aspect}` : ""}
          </span>
          <ChevronDown className={CHEVRON} strokeWidth={2} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="bottom" sideOffset={8} className="min-w-[220px] p-1">
        <DropdownMenuLabel>Model</DropdownMenuLabel>
        {IMAGE_PROVIDER_OPTIONS.map((option) => {
          const selected = imageOptions.provider === option.id;
          const available = imageProviders[option.id];
          return (
            <DropdownMenuItem
              key={option.id}
              disabled={!available}
              onSelect={(e) => {
                e.preventDefault();
                onImageOptionsChange({ ...imageOptions, provider: option.id });
              }}
              className="cursor-pointer rounded-lg px-2.5 py-2 text-[13px]"
            >
              <span className={cn("flex-1", selected && "font-semibold")}>{option.label}</span>
              {!available ? <span className="text-[11px] text-neutral-400">No key</span> : null}
              {selected ? <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> : null}
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Quality</DropdownMenuLabel>
        {IMAGE_QUALITY_OPTIONS.map((option) => {
          const selected = imageOptions.quality === option.id;
          return (
            <DropdownMenuItem
              key={option.id}
              onSelect={(e) => {
                e.preventDefault();
                onImageOptionsChange({ ...imageOptions, quality: option.id });
              }}
              className="cursor-pointer rounded-lg px-2.5 py-2 text-[13px]"
            >
              <span className="flex flex-1 flex-col">
                <span className={cn(selected && "font-semibold")}>{option.label}</span>
                <span className="text-[11px] text-neutral-400">{imageTierHint(option.id)}</span>
              </span>
              <span className="text-[11px] tabular-nums text-neutral-500">
                {imageCredits(imageOperation, option.id)} cr
              </span>
              {selected ? <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> : null}
            </DropdownMenuItem>
          );
        })}
        {!isEditMode ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Aspect</DropdownMenuLabel>
            {IMAGE_ASPECT_OPTIONS.map((option) => {
              const selected = imageOptions.aspect === option.id;
              return (
                <DropdownMenuItem
                  key={option.id}
                  onSelect={(e) => {
                    e.preventDefault();
                    onImageOptionsChange({ ...imageOptions, aspect: option.id });
                  }}
                  className="cursor-pointer rounded-lg px-2.5 py-2 text-[13px]"
                >
                  <span className={cn("flex-1", selected && "font-semibold")}>{option.label}</span>
                  <span className="text-[11px] tabular-nums text-neutral-400">{option.id}</span>
                  {selected ? <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> : null}
                </DropdownMenuItem>
              );
            })}
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PanelGenerateFooter({
  canSubmit,
  generating,
  onGenerate,
  label,
  timeEstimate,
  creditCost,
  disabledReason,
}: {
  canSubmit: boolean;
  generating: boolean;
  onGenerate: () => void;
  label: string;
  timeEstimate?: string;
  creditCost?: number | string;
  disabledReason?: string;
}) {
  return (
    <div className="shrink-0 border-t border-neutral-200/80 bg-white/95 p-3.5 backdrop-blur-md">
      {(timeEstimate || creditCost !== undefined) && (
        <div className="mb-2.5 flex items-center justify-between px-1 text-[12px] text-neutral-500">
          {timeEstimate ? (
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-neutral-400" />
              <span>{timeEstimate}</span>
            </span>
          ) : (
            <span />
          )}
          {creditCost !== undefined ? (
            <span className="flex items-center gap-1 font-medium text-neutral-700">
              <span className="tabular-nums">{creditCost}</span> credits
            </span>
          ) : null}
        </div>
      )}
      <button
        type="button"
        onClick={onGenerate}
        disabled={!canSubmit || generating}
        title={!canSubmit && disabledReason ? disabledReason : label}
        className={cn(
          "flex h-11 w-full items-center justify-center gap-2 rounded-xl font-medium text-[14px] shadow-sm",
          EASE,
          FOCUS,
          canSubmit && !generating
            ? "bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.99] shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2)]"
            : "cursor-not-allowed bg-neutral-100 text-neutral-400"
        )}
      >
        {generating ? (
          <>
            <StudioOrb state="working" size={20} theme="dark" />
            <span>Generating…</span>
          </>
        ) : (
          <>
            <Wand2 className="h-4 w-4" />
            <span>{label}</span>
          </>
        )}
      </button>
    </div>
  );
}
