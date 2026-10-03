"use client";

import { useEffect, useRef, useState } from "react";
import { Droplets, Sparkles } from "lucide-react";
import { CreateEnginePicker } from "@/components/CreateEnginePicker";
import { WaterChat, type WaterThreadJob } from "@/components/water/WaterChat";
import type { CatalogModel, ModelId } from "@/lib/models";
import type { PromptHistoryEntry } from "@/lib/prompt-history";
import type { QualityTier, WaterSkillId } from "@/lib/waterSkills";
import {
  MAX_PROMPT,
  PanelGenerateFooter,
  PromptHistoryDropdown,
  WaterQualityDropdown,
  WaterSkillDropdown,
} from "./composer-parts";
import { cn } from "@/lib/utils";

type Props = {
  prompt: string;
  onPromptChange: (value: string) => void;
  selectedModel: ModelId;
  selectedLabel: string;
  waterPickerModels: CatalogModel[];
  enabledWaterIds: string[];
  providerKeyOk: (provider: string) => boolean;
  onSelectModel: (id: ModelId, opt: CatalogModel) => void;
  qualityTier: QualityTier;
  onQualityTierChange: (tier: QualityTier) => void;
  skillId: WaterSkillId;
  onSkillChange: (skillId: WaterSkillId) => void;
  promptHistory: PromptHistoryEntry[];
  onSelectHistory: (item: string) => void;
  onClearHistory: () => void;
  onGenerate: () => void;
  generating: boolean;
  disabled?: boolean;
  activeWaterJobId: string | null;
  waterThreadJobs: WaterThreadJob[];
  getToken: () => Promise<string | null>;
  onWaterRefine?: (prompt: string) => void;
  onWaterScene?: (scene: unknown) => void;
  className?: string;
};

export function AgentPanel({
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
  skillId,
  onSkillChange,
  promptHistory,
  onSelectHistory,
  onClearHistory,
  onGenerate,
  generating,
  disabled,
  activeWaterJobId,
  waterThreadJobs,
  getToken,
  onWaterRefine,
  onWaterScene,
  className,
}: Props) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"build" | "chat">("build");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [prompt]);

  useEffect(() => {
    if (activeWaterJobId) {
      setActiveTab("chat");
    }
  }, [activeWaterJobId]);

  const canSubmit = !generating && !disabled && prompt.trim().length > 0;

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
            <span className="text-[13px] font-semibold text-neutral-900">Agent Studio</span>
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-neutral-800 border border-neutral-200/80">
              Water
            </span>
          </div>
          <p className="text-[11px] text-neutral-400">Procedural Three.js code generator</p>
        </div>

        {activeWaterJobId ? (
          <div className="flex items-center rounded-lg bg-neutral-100 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setActiveTab("build")}
              className={cn(
                "rounded-md px-2 py-1 font-medium transition-colors",
                activeTab === "build"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800"
              )}
            >
              Build
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={cn(
                "rounded-md px-2 py-1 font-medium transition-colors",
                activeTab === "chat"
                  ? "bg-white text-neutral-900 shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800"
              )}
            >
              Chat
            </button>
          </div>
        ) : null}
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        {activeTab === "chat" && activeWaterJobId ? (
          <div className="h-full flex flex-col p-3">
            <WaterChat
              jobId={activeWaterJobId}
              threadJobs={waterThreadJobs}
              modelId={selectedModel}
              getToken={getToken}
              disabled={generating}
              docked={true}
              onRefine={onWaterRefine}
              onScene={onWaterScene}
              className="flex-1 shadow-none border border-neutral-200"
            />
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {/* Prompt input */}
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-3.5 shadow-xs">
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="agent-prompt-input"
                  className="text-[12px] font-semibold text-neutral-800 flex items-center gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Prompt</span>
                </label>
                <div className="flex items-center gap-2">
                  <PromptHistoryDropdown
                    promptHistory={promptHistory}
                    onSelectHistory={onSelectHistory}
                    onClearHistory={onClearHistory}
                    open={historyOpen}
                    onOpenChange={setHistoryOpen}
                  />
                  <span className="text-[11px] tabular-nums text-neutral-400">
                    {prompt.length}/{MAX_PROMPT}
                  </span>
                </div>
              </div>

              <textarea
                id="agent-prompt-input"
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
                placeholder="Describe your 3D asset or scene in detail (e.g. vintage radio with brass knobs, stylized robot with articulated joints)..."
                className="w-full resize-none bg-transparent text-[13px] leading-relaxed text-neutral-900 outline-none placeholder:text-neutral-400 disabled:opacity-50"
              />
            </div>

            {/* Engine & Settings Row / selection box */}
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-3 shadow-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Engine & Skill
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <CreateEnginePicker
                  selectedModel={selectedModel}
                  selectedLabel={selectedLabel}
                  selectedIsCode={true}
                  waterPickerModels={waterPickerModels}
                  enabledWaterIds={enabledWaterIds}
                  providerKeyOk={providerKeyOk}
                  onSelect={onSelectModel}
                  variant="compact"
                  side="top"
                  align="start"
                  scope="water"
                />

                <WaterSkillDropdown skillId={skillId} onSkillChange={onSkillChange} />
                <WaterQualityDropdown
                  qualityTier={qualityTier}
                  onQualityTierChange={onQualityTierChange}
                />
              </div>
            </div>

            {/* Info callout */}
            <div className="rounded-xl bg-neutral-50 border border-neutral-200/80 p-3 text-[12px] text-neutral-700 leading-relaxed">
              <div className="flex items-center gap-1.5 font-semibold text-neutral-900 mb-1">
                <Droplets className="h-3.5 w-3.5 text-neutral-700 shrink-0" />
                <span>Code-based generation</span>
              </div>
              <p className="text-neutral-500 text-[11px]">
                Agent creates models directly via Three.js procedural code using your API key. No GPU
                credits required.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky footer */}
      {activeTab === "build" && (
        <PanelGenerateFooter
          canSubmit={canSubmit}
          generating={generating}
          onGenerate={onGenerate}
          label="Generate with Agent"
          timeEstimate={
            qualityTier === "fast"
              ? "~1 min"
              : qualityTier === "standard"
                ? "~2–4 min"
                : "~4–8 min"
          }
          creditCost={0}
          disabledReason="Enter a prompt to generate"
        />
      )}
    </div>
  );
}
