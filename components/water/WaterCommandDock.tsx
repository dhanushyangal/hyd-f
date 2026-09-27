"use client";

import type { CatalogModel, ModelId } from "@/lib/models";
import type { QualityTier } from "@/lib/waterSkills";
import { QUALITY_TIERS } from "@/lib/waterSkills";
import { cn } from "@/lib/utils";
import { CreateEnginePicker } from "@/components/CreateEnginePicker";

type Props = {
  prompt: string;
  onPromptChange: (value: string) => void;
  selectedModel: ModelId;
  selectedLabel: string;
  waterPickerModels: CatalogModel[];
  enabledWaterIds: string[];
  providerKeyOk: (provider: string) => boolean;
  onSelectModel: (id: ModelId, option: CatalogModel) => void;
  qualityTier: QualityTier;
  onQualityTierChange: (tier: QualityTier) => void;
  onGenerate: () => void;
  generating: boolean;
  disabled?: boolean;
};

export function WaterCommandDock({
  prompt,
  onPromptChange,
  selectedModel,
  selectedLabel,
  waterPickerModels,
  enabledWaterIds,
  providerKeyOk,
  onSelectModel,
  qualityTier,
  onQualityTierChange,
  onGenerate,
  generating,
  disabled,
}: Props) {
  return (
    <div className="hidden shrink-0 border-t border-neutral-200/70 bg-white/95 px-3 py-2.5 backdrop-blur-xl lg:block">
      <div className="mx-auto flex max-w-[1180px] items-center gap-2">
        <div className="min-w-0 flex-1">
          <textarea
            value={prompt}
            onChange={(event) => onPromptChange(event.target.value.slice(0, 800))}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                if (!disabled && prompt.trim()) onGenerate();
              }
            }}
            rows={1}
            maxLength={800}
            placeholder="Describe one asset to build…"
            className="block h-11 max-h-24 w-full resize-none rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[13px] leading-5 text-neutral-900 outline-none transition-[border-color,background-color] duration-150 focus:border-neutral-400 focus:bg-white"
          />
        </div>

        <CreateEnginePicker
          selectedModel={selectedModel}
          selectedLabel={selectedLabel}
          selectedIsCode
          waterPickerModels={waterPickerModels}
          enabledWaterIds={enabledWaterIds}
          providerKeyOk={providerKeyOk}
          onSelect={onSelectModel}
        />

        <div
          className="flex h-10 items-center rounded-full border border-neutral-200 bg-neutral-100 p-1"
          aria-label="Water quality"
        >
          {QUALITY_TIERS.map((tier) => {
            const selected = qualityTier === tier.id;
            return (
              <button
                key={tier.id}
                type="button"
                onClick={() => onQualityTierChange(tier.id)}
                className={cn(
                  "h-8 rounded-full px-3 text-[11px] font-semibold transition-[background-color,color,transform] duration-150 active:scale-[0.97]",
                  selected
                    ? "bg-neutral-950 text-white"
                    : "text-neutral-500 hover:text-neutral-900"
                )}
                title={tier.description}
                aria-pressed={selected}
              >
                {tier.label}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onGenerate}
          disabled={disabled || generating || !prompt.trim()}
          className="inline-flex h-11 min-w-[116px] items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-[13px] font-semibold text-white transition-[background-color,transform] duration-150 hover:bg-neutral-800 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {generating && (
            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/35 border-t-white animate-spin" />
          )}
          {generating ? "Building…" : "Generate"}
        </button>
      </div>
    </div>
  );
}
