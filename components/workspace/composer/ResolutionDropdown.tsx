"use client";

import { Check, ChevronDown, Crown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { CHEVRON, GHOST } from "../composer-parts";

export type Resolution = "standard" | "ultra1k";

const OPTIONS: { id: Resolution; label: string }[] = [
  { id: "standard", label: "Standard" },
  { id: "ultra1k", label: "Ultra 1K" },
];

export function ResolutionDropdown({
  value,
  onChange,
  costFor,
}: {
  value: Resolution;
  onChange: (value: Resolution) => void;
  /** Omit when cost doesn't depend on resolution. */
  costFor?: (value: Resolution) => number;
}) {
  const active = OPTIONS.find((o) => o.id === value) ?? OPTIONS[0]!;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className={GHOST} aria-label={`Resolution: ${active.label}`}>
          {value === "ultra1k" ? <Crown className="h-3.5 w-3.5 text-neutral-400" strokeWidth={1.85} /> : null}
          <span>{active.label}</span>
          <ChevronDown className={CHEVRON} strokeWidth={2} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" sideOffset={8} className="min-w-[180px] p-1">
        <DropdownMenuLabel>Resolution</DropdownMenuLabel>
        {OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.id}
            onSelect={() => onChange(option.id)}
            className="cursor-pointer rounded-lg px-2.5 py-2 text-[13px]"
          >
            <span className={cn("flex-1", value === option.id && "font-semibold")}>{option.label}</span>
            {costFor ? <span className="text-[12px] tabular-nums text-neutral-500">{costFor(option.id)} cr</span> : null}
            {value === option.id ? <Check className="h-3.5 w-3.5" strokeWidth={2.4} /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
