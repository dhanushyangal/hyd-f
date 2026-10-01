"use client";

import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { Bot, Box, Image as ImageIcon, Sparkles, User } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

export type WorkspaceSection = "agent" | "image" | "model";

type Props = {
  activeSection: WorkspaceSection;
  onSelectSection: (section: WorkspaceSection) => void;
  creditsTotal: number;
  creditsUsed: number;
  creditsLoading: boolean;
  clientMounted: boolean;
  className?: string;
};

export function WorkspaceRail({
  activeSection,
  onSelectSection,
  creditsTotal,
  creditsUsed,
  creditsLoading,
  clientMounted,
  className,
}: Props) {
  const creditsRemaining = Math.max(0, creditsTotal - creditsUsed);

  return (
    <aside
      className={cn(
        "flex w-[68px] shrink-0 flex-col items-center justify-between border-r border-neutral-200/80 bg-white py-3.5 select-none",
        className
      )}
    >
      {/* Top: Logo & Main Navigation */}
      <div className="flex flex-col items-center gap-4 w-full">
        {/* App Logo / Link to Studio */}
        <Link
          href="/app/studio"
          className="group flex h-10 w-10 items-center justify-center rounded-2xl bg-neutral-950 text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
          title="Back to Studio"
        >
          <Sparkles className="h-5 w-5 text-white" />
        </Link>

        <div className="h-px w-8 bg-neutral-200/80" />

        {/* 3 Main Sections */}
        <div className="flex flex-col items-center gap-2 w-full px-2">
          {/* 1. Agent */}
          <button
            type="button"
            onClick={() => onSelectSection("agent")}
            title="Agent - Procedural 3D Code (Water)"
            className={cn(
              "group relative flex w-full flex-col items-center justify-center gap-1 rounded-2xl py-2.5 transition-all duration-150",
              activeSection === "agent"
                ? "bg-sky-50 text-sky-700 font-semibold shadow-xs"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            )}
          >
            <div className="relative">
              <Bot className="h-5 w-5" strokeWidth={activeSection === "agent" ? 2.2 : 1.8} />
              <span className="absolute -right-2.5 -top-1.5 rounded-full bg-sky-500 px-1 py-0.2 text-[8px] font-bold text-white uppercase tracking-wider">
                BETA
              </span>
            </div>
            <span className="text-[10px] tracking-tight">Agent</span>
          </button>

          {/* 2. Image */}
          <button
            type="button"
            onClick={() => onSelectSection("image")}
            title="Image - Text to Image & Edit"
            className={cn(
              "group relative flex w-full flex-col items-center justify-center gap-1 rounded-2xl py-2.5 transition-all duration-150",
              activeSection === "image"
                ? "bg-pink-50 text-pink-700 font-semibold shadow-xs"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            )}
          >
            <ImageIcon className="h-5 w-5" strokeWidth={activeSection === "image" ? 2.2 : 1.8} />
            <span className="text-[10px] tracking-tight">Image</span>
          </button>

          {/* 3. Model */}
          <button
            type="button"
            onClick={() => onSelectSection("model")}
            title="Model - Image to 3D Generation"
            className={cn(
              "group relative flex w-full flex-col items-center justify-center gap-1 rounded-2xl py-2.5 transition-all duration-150",
              activeSection === "model"
                ? "bg-emerald-50 text-emerald-700 font-semibold shadow-xs"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            )}
          >
            <Box className="h-5 w-5" strokeWidth={activeSection === "model" ? 2.2 : 1.8} />
            <span className="text-[10px] tracking-tight">Model</span>
          </button>
        </div>
      </div>

      {/* Bottom: Credits, Theme, Profile */}
      <div className="flex flex-col items-center gap-3 w-full px-2">
        {/* Credits pill */}
        <div
          className="flex flex-col items-center justify-center rounded-xl bg-neutral-100 px-2 py-1 text-center w-full"
          title="Credits remaining"
        >
          <span className="text-[11px] font-bold tabular-nums text-neutral-800">
            {creditsLoading ? "…" : creditsRemaining}
          </span>
          <span className="text-[9px] uppercase tracking-wider text-neutral-400">credits</span>
        </div>

        {/* Dark/Light mode */}
        <div className="flex items-center justify-center">
          <ModeToggle />
        </div>

        {/* User Button */}
        <div className="flex items-center justify-center [&_.cl-userButtonBox]:!flex [&_.cl-userButtonTrigger]:!rounded-full">
          {clientMounted ? (
            <UserButton afterSignOutUrl="/" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 animate-pulse text-neutral-400">
              <User className="h-4 w-4" />
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
