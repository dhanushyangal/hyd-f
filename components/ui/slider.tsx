"use client";

import { Slider as BaseSlider } from "@base-ui/react/slider";

interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  /** Fill color for the active portion of the track. */
  indicatorClassName?: string;
  "aria-label"?: string;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className = "",
  indicatorClassName = "bg-neutral-800",
  "aria-label": ariaLabel,
}: SliderProps) {
  return (
    <BaseSlider.Root
      value={[value]}
      onValueChange={(next) => {
        const value = Array.isArray(next) ? next[0] : next;
        if (typeof value === "number" && !Number.isNaN(value)) onValueChange(value);
      }}
      min={min}
      max={max}
      step={step}
      className={`relative flex w-full touch-none select-none items-center ${className}`}
    >
      <BaseSlider.Control className="flex w-full items-center py-2">
        <BaseSlider.Track className="h-1.5 w-full rounded-full bg-neutral-200">
          <BaseSlider.Indicator className={`rounded-full ${indicatorClassName}`} />
          <BaseSlider.Thumb
            aria-label={ariaLabel}
            className="block size-4 rounded-full border-2 border-white bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.18),0_1px_2px_rgba(0,0,0,0.16)] cursor-grab focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/30 focus-visible:ring-offset-2 active:cursor-grabbing"
          />
        </BaseSlider.Track>
      </BaseSlider.Control>
    </BaseSlider.Root>
  );
}
