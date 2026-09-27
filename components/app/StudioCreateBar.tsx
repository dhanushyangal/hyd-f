"use client";

import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  disabled?: boolean;
  submitting?: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function StudioCreateBar({
  value,
  disabled,
  submitting,
  onChange,
  onSubmit,
}: Props) {
  const canSubmit = value.trim().length > 0 && !disabled && !submitting;

  return (
    <form
      className="w-full max-w-[720px]"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit();
      }}
    >
      <label htmlFor="studio-create" className="sr-only">
        What should we make?
      </label>
      <div
        className={cn(
          "rounded-[18px] border border-neutral-200/90 bg-white",
          "shadow-[0_1px_2px_rgba(0,0,0,0.04)]",
          "focus-within:border-neutral-300 focus-within:ring-4 focus-within:ring-neutral-900/[0.04]",
          "transition-shadow"
        )}
      >
        <textarea
          id="studio-create"
          rows={3}
          value={value}
          disabled={disabled || submitting}
          onChange={(e) => onChange(e.target.value)}
          placeholder="A ceramic mug on a wooden table"
          className="block w-full resize-none bg-transparent px-4 pt-3.5 pb-2 text-[16px] leading-relaxed text-neutral-900 placeholder:text-neutral-400 outline-none disabled:opacity-60"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (canSubmit) onSubmit();
            }
          }}
        />
        <div className="flex items-center justify-end px-2.5 pb-2.5">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-neutral-900 px-3.5 text-[13px] font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
          >
            {submitting ? "Creating…" : "Create"}
            {!submitting && <ArrowUp className="h-3.5 w-3.5" strokeWidth={2.25} />}
          </button>
        </div>
      </div>
      <p className="mt-2.5 px-0.5 text-[13px] text-neutral-500">
        Type what you want. We open a workspace and start from there.
      </p>
    </form>
  );
}
