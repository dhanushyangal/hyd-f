"use client";

import { memo, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { MODEL_CATALOG, type CatalogModel, type ModelId } from "@/lib/models";
import { pickerVisibleIds } from "@/lib/waterModels";
import { cn } from "@/lib/utils";

type Props = {
  selectedModel: ModelId;
  selectedLabel: string;
  selectedIsCode: boolean;
  waterPickerModels: CatalogModel[];
  enabledWaterIds: string[];
  providerKeyOk: (provider: string) => boolean;
  onSelect: (id: ModelId, opt: CatalogModel) => void;
  variant?: "default" | "compact";
  tone?: "light" | "dark";
  side?: "top" | "bottom";
  align?: "start" | "center" | "end";
  /** `cloud` lists only Hydrilla engines; `water` lists only bring-your-own-key models. */
  scope?: "all" | "cloud" | "water";
};

function matchesQuery(m: CatalogModel, q: string): boolean {
  if (!q) return true;
  return m.label.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
}

function CreateEnginePickerInner({
  selectedModel,
  selectedLabel,
  selectedIsCode,
  waterPickerModels,
  enabledWaterIds,
  providerKeyOk,
  onSelect,
  variant = "default",
  tone = "light",
  side = "bottom",
  align = "end",
  scope = "all",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const searchRef = useRef<HTMLInputElement>(null);
  const compact = variant === "compact";
  const dark = tone === "dark";

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => searchRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const visible = useMemo(
    () => pickerVisibleIds(enabledWaterIds, selectedModel),
    [enabledWaterIds, selectedModel]
  );

  const grouped = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    const itemsFor = (group: string): CatalogModel[] => {
      if (group === "Hydrilla") {
        return MODEL_CATALOG.filter((m) => m.group === "Hydrilla" && matchesQuery(m, q));
      }
      return waterPickerModels.filter(
        (m) => m.group === group && visible.has(m.id) && matchesQuery(m, q)
      );
    };

    const waterNames = [...new Set(waterPickerModels.map((m) => m.group))];
    const unlocked: string[] = [];
    const locked: string[] = [];
    for (const group of waterNames) {
      const items = itemsFor(group);
      if (!items.length && q) continue;
      const anyUnlocked = items.some((opt) => providerKeyOk(opt.provider));
      if (anyUnlocked) unlocked.push(group);
      else locked.push(group);
    }

    const order =
      scope === "cloud"
        ? ["Hydrilla"]
        : scope === "water"
          ? [...unlocked, ...locked]
          : ["Hydrilla", ...unlocked, ...locked];
    return { order, itemsFor };
  }, [deferredQuery, waterPickerModels, visible, providerKeyOk, scope]);

  return (
    <div className={cn("relative", compact ? "min-w-0 max-w-[132px] sm:max-w-[176px]" : "min-w-[160px] max-w-[220px]")}>
      <DropdownMenu
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setQuery("");
        }}
      >
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant={compact ? "ghost" : "outline"}
            className={cn(
              compact
                ? "h-8 w-auto max-w-full justify-start gap-1 rounded-full border-0 bg-transparent px-2.5 py-0 text-[13px] font-medium shadow-none"
                : "h-auto w-full justify-between gap-1.5 rounded-full px-3 py-2 text-xs font-medium sm:px-2.5 sm:py-1.5",
              compact && dark
                ? "text-white/80 hover:bg-white/10 hover:text-white"
                : compact
                  ? "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-950"
                  : "text-neutral-800 hover:bg-neutral-50"
            )}
          >
            <span className="flex min-w-0 items-center gap-1.5 truncate">
              {!compact && (
                <span
                  className={
                    selectedIsCode
                      ? "shrink-0 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800"
                      : "shrink-0 rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600"
                  }
                >
                  {selectedIsCode ? "Water" : "Cloud"}
                </span>
              )}
              <span className="truncate">{selectedLabel}</span>
            </span>
            <svg
              className={cn(
                "shrink-0 transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "h-3.5 w-3.5",
                compact && dark ? "text-white/45" : compact ? "text-neutral-400" : "text-neutral-500",
                open && "rotate-180"
              )}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align={align}
          side={side}
          sideOffset={8}
          className={cn(
            "w-[300px] p-0 max-h-[var(--radix-dropdown-menu-content-available-height)]",
            dark && "border-white/10 bg-[#0a0a0a] text-[#fafafa] shadow-[0_24px_64px_-20px_rgba(0,0,0,0.65)]"
          )}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div
            className={cn("px-2.5 py-2", dark ? "border-b border-white/10" : "border-b border-neutral-100")}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <Input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models"
              className={cn(
                "h-8 rounded-lg text-xs",
                dark &&
                  "border-white/10 bg-white/5 text-white placeholder:text-white/35 focus-visible:border-white/25 focus-visible:ring-white/10"
              )}
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
          </div>
          <div className="max-h-[min(320px,55vh)] overflow-y-auto p-1.5">
            {grouped.order.every((group) => grouped.itemsFor(group).length === 0) ? (
              <p className={cn("px-2.5 py-6 text-center text-xs", dark ? "text-white/45" : "text-neutral-500")}>
                {scope === "water"
                  ? "No Water models yet. Add an API key in Settings."
                  : "No models found"}
              </p>
            ) : null}
            {grouped.order.map((group, gi) => {
              const items = grouped.itemsFor(group);
              if (!items.length) return null;
              return (
                <DropdownMenuGroup key={group}>
                  {gi > 0 && (
                    <DropdownMenuSeparator className={dark ? "bg-white/10" : undefined} />
                  )}
                  <DropdownMenuLabel className={dark ? "text-white/35" : undefined}>
                    {group === "Hydrilla" ? "Cloud" : group}
                  </DropdownMenuLabel>
                  {items.map((opt) => {
                    const needsKey = opt.provider !== "hydrilla";
                    const keyOk = !needsKey || providerKeyOk(opt.provider);
                    const disabled = Boolean(opt.comingSoon);
                    const locked = disabled || (needsKey && !keyOk);
                    const selected = selectedModel === opt.id;
                    return (
                      <DropdownMenuItem
                        key={opt.id}
                        disabled={disabled}
                        onSelect={() => {
                          if (disabled) return;
                          if (needsKey && !keyOk) {
                            window.location.href = "/app/settings";
                            return;
                          }
                          onSelect(opt.id, opt);
                        }}
                        className={cn(
                          "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs",
                          dark
                            ? locked
                              ? "text-white/35"
                              : selected
                                ? "bg-white/10 font-semibold text-white"
                                : "text-white/80 focus:bg-white/10 focus:text-white"
                            : locked
                              ? "text-neutral-400"
                              : selected
                                ? "bg-neutral-100 font-semibold text-neutral-800"
                                : "text-neutral-700"
                        )}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className={cn("truncate", locked && (dark ? "text-white/35" : "text-neutral-400"))}>
                            {opt.label}
                          </span>
                          {locked && (
                            <span title={opt.comingSoon ? "Coming soon" : "Add API key in Settings"}>
                              <svg
                                className="h-3.5 w-3.5 shrink-0 text-neutral-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                                aria-hidden
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                              </svg>
                            </span>
                          )}
                        </span>
                        {!locked && selected && (
                          <svg
                            className={cn("h-3.5 w-3.5 shrink-0", dark ? "text-white/70" : "text-neutral-500")}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuGroup>
              );
            })}
          </div>
          <div className={cn("px-3 py-2", dark ? "border-t border-white/10" : "border-t border-neutral-100")}>
            <a
              href="/app/settings"
              className={cn(
                "text-[11px] font-medium underline-offset-2 hover:underline",
                dark ? "text-white/70 hover:text-white" : "text-neutral-700 hover:text-neutral-900"
              )}
              onClick={() => setOpen(false)}
            >
              Models in Settings
            </a>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export const CreateEnginePicker = memo(CreateEnginePickerInner);
