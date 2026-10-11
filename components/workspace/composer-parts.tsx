"use client";

import {
  Box,
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

/** Input slot in the composer: empty opens a picker; filled shows a thumbnail with remove. */
export function ChatRefTile({
  label,
  preview,
  kind = "image",
  filled,
  onPick,
  onClear,
  className,
}: {
  label: string;
  /** Thumbnail; null shows the kind icon (e.g. a 3D file still rendering). */
  preview: string | null;
  kind?: "image" | "model";
  filled: boolean;
  onPick: () => void;
  onClear: () => void;
  className?: string;
}) {
  const Icon = kind === "model" ? Box : ImageIcon;
  if (!filled) {
    return (
      <button
        type="button"
        onClick={onPick}
        className={cn(
          "flex h-16 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-neutral-300 bg-neutral-50 text-neutral-500 hover:border-neutral-400 hover:bg-neutral-100 hover:text-neutral-900",
          EASE,
          FOCUS,
          className
        )}
      >
        <Icon className="h-4 w-4" strokeWidth={1.85} />
        <span className="text-[11px] font-medium leading-none">{label}</span>
      </button>
    );
  }
  return (
    <div
      className={cn("relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100", className)}
      title={label}
    >
      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={displayImageUrl(preview)} alt={label} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-neutral-400">
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>
      )}
      {kind === "model" ? (
        <span className="absolute bottom-1 left-1 rounded bg-black/65 px-1 text-[10px] font-semibold leading-4 text-white">3D</span>
      ) : null}
      <button
        type="button"
        onClick={onClear}
        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-white hover:bg-black"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" strokeWidth={2.4} />
      </button>
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
