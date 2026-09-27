"use client";

import { cn } from "@/lib/utils";

type Props = {
  meshNames: string[];
  selectedName?: string | null;
  onSelect?: (name: string) => void;
};

export function WaterOutliner({ meshNames, selectedName, onSelect }: Props) {
  const names = [...new Set(meshNames.filter(Boolean))];
  if (names.length === 0) {
    return <p className="text-[11px] text-neutral-400">No named parts yet</p>;
  }
  return (
    <div className="flex max-h-[132px] flex-wrap content-start gap-1 overflow-y-auto">
      {names.map((name) => (
        <button
          key={name}
          type="button"
          title={name}
          onClick={() => onSelect?.(name)}
          className={cn(
            "h-6 max-w-full truncate rounded-md px-2 text-[11px] font-medium active:scale-[0.98]",
            selectedName === name
              ? "bg-neutral-950 text-white"
              : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
          )}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
