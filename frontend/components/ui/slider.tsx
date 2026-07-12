"use client";

import { Slider as BaseSlider } from "@base-ui/react/slider";
import * as React from "react";

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  "aria-label"?: string;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className = "",
  "aria-label": ariaLabel,
}: SliderProps) {
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <BaseSlider.Root
      value={[value]}
      onValueChange={(v) => onValueChange(Array.isArray(v) ? v[0] : v)}
      min={min}
      max={max}
      step={step}
      className={`relative flex w-full touch-none select-none items-center ${className}`}
      aria-label={ariaLabel}
    >
      <BaseSlider.Control className="relative h-3 w-full min-h-[12px] grow rounded-full bg-neutral-200">
        <BaseSlider.Track className="absolute inset-0 h-full w-full rounded-full overflow-hidden bg-neutral-200">
          <BaseSlider.Indicator
            className="absolute h-full rounded-full bg-neutral-700 transition-[width] duration-150 ease-out"
            style={{ width: `${pct}%` }}
          />
          <BaseSlider.Thumb className="block h-4 w-4 rounded-full border-2 border-neutral-300 bg-white shadow-md ring-0 transition-colors hover:border-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-grab active:cursor-grabbing" />
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
