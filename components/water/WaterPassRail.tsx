"use client";

import { cn } from "@/lib/utils";
import { passesForTier, waterPassLabel, waterPassIndex, type QualityTier } from "@/lib/waterSkills";

type Props = {
  tier: QualityTier;
  pass?: string | null;
  className?: string;
};

export function WaterPassRail({ tier, pass, className }: Props) {
  const unlocked = passesForTier(tier);
  const steps = ["assessment", "spec", ...unlocked, "done"] as string[];
  const activeIdx = waterPassIndex(pass, unlocked);

  return (
    <div className={cn("flex items-center gap-1.5 flex-wrap", className)} aria-label="Build passes">
      {steps.map((step, idx) => {
        const done = idx < activeIdx;
        const active = idx === activeIdx;
        return (
          <div
            key={step}
            className={cn(
              "h-1.5 rounded-full transition-all duration-150",
              active ? "w-8 bg-neutral-900" : done ? "w-4 bg-neutral-400" : "w-4 bg-neutral-200"
            )}
            title={waterPassLabel(step)}
          />
        );
      })}
    </div>
  );
}
