"use client";

import { Toggle } from "@base-ui/react/toggle";
import { ToggleGroup as ToggleGroupPrimitive } from "@base-ui/react/toggle-group";
import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };

type Props<T extends string> = {
  label: string;
  value: T;
  options: Option<T>[];
  onValueChange: (value: T) => void;
  /** Wrap when the labels cannot share one row. */
  wrap?: boolean;
};

/** Single-choice bar. The pressed item stays selected; clicking it again does not clear it. */
export function ToggleGroup<T extends string>({ label, value, options, onValueChange, wrap = false }: Props<T>) {
  return (
    <ToggleGroupPrimitive
      aria-label={label}
      value={[value]}
      onValueChange={(next) => {
        const picked = next.find((item) => item !== value) ?? next[0];
        if (picked && picked !== value) onValueChange(picked as T);
      }}
      className={cn("flex rounded-lg bg-neutral-100 p-0.5", wrap && "flex-wrap gap-0.5")}
    >
      {options.map((option) => (
        <Toggle
          key={option.value}
          value={option.value}
          className={cn(
            "h-8 min-w-0 flex-1 rounded-md px-1.5 text-[12px] font-medium text-neutral-600 transition-colors",
            "hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900/25",
            "data-[pressed]:bg-white data-[pressed]:text-neutral-950 data-[pressed]:shadow-[0_1px_2px_rgba(0,0,0,0.08)]",
            wrap && "min-w-[30%]"
          )}
        >
          {option.label}
        </Toggle>
      ))}
    </ToggleGroupPrimitive>
  );
}
