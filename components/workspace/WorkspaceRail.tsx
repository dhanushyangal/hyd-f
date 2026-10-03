"use client";

import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import { Bot, Box, Image as ImageIcon, User, Wand2 } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { cn } from "@/lib/utils";

export type WorkspaceSection = "agent" | "image" | "model" | "edit";

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
        className,
      )}
    >
      {/* Top: Logo & Main Navigation */}
      <div className="flex flex-col items-center gap-2.5 w-full">
        {/* App Logo & Text / Link to Studio */}
        <Link
          href="/"
          className="group flex flex-col items-center gap-1 transition-all duration-200 hover:opacity-85 active:scale-95"
          title="Hydrilla"
        >
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-900 shadow-sm transition-all duration-200 group-hover:scale-105 group-hover:shadow-md">
            <div className="relative h-5 w-5 transition-transform duration-300 group-hover:scale-110 logo-spin-hover">
              <Image
                src="/hyd01.png"
                alt="Hydrilla Logo"
                fill
                className="object-contain"
                sizes="20px"
                priority
              />
            </div>
          </div>
          <span className="font-dm-sans text-[11px] font-bold tracking-tight text-neutral-900 leading-none">
            Hydrilla
          </span>
        </Link>

        <div className="h-px w-8 bg-neutral-200/80" />

        {/* 4 Main Sections */}
        <div className="flex flex-col items-center gap-2 w-full px-2">
          {/* 1. Agent */}
          <button
            type="button"
            onClick={() => onSelectSection("agent")}
            title="Agent - Procedural 3D Code (Water)"
            className={cn(
              "group relative flex w-full flex-col items-center justify-center gap-1 rounded-2xl py-2.5 transition-all duration-150",
              activeSection === "agent"
                ? "bg-neutral-900 text-white font-semibold shadow-sm"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
            )}
          >
            <div className="relative">
              <Bot
                className="h-5 w-5"
                strokeWidth={activeSection === "agent" ? 2.2 : 1.8}
              />
              <span
                className={cn(
                  "absolute -right-2.5 -top-1.5 rounded-full px-1 py-0.2 text-[8px] font-bold uppercase tracking-wider transition-colors",
                  activeSection === "agent"
                    ? "bg-white text-neutral-950"
                    : "bg-neutral-900 text-white",
                )}
              >
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
                ? "bg-neutral-900 text-white font-semibold shadow-sm"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
            )}
          >
            <ImageIcon
              className="h-5 w-5"
              strokeWidth={activeSection === "image" ? 2.2 : 1.8}
            />
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
                ? "bg-neutral-900 text-white font-semibold shadow-sm"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
            )}
          >
            <Box
              className="h-5 w-5"
              strokeWidth={activeSection === "model" ? 2.2 : 1.8}
            />
            <span className="text-[10px] tracking-tight">Model</span>
          </button>

          {/* 4. Edit (Prompt to 3D / Chained Edit-to-3D) */}
          <button
            type="button"
            onClick={() => onSelectSection("edit")}
            title="Edit - Prompt to 3D & Model Editing"
            className={cn(
              "group relative flex w-full flex-col items-center justify-center gap-1 rounded-2xl py-2.5 transition-all duration-150",
              activeSection === "edit"
                ? "bg-neutral-900 text-white font-semibold shadow-sm"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
            )}
          >
            <Wand2
              className="h-5 w-5"
              strokeWidth={activeSection === "edit" ? 2.2 : 1.8}
            />
            <span className="text-[10px] tracking-tight">Edit</span>
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
          <span className="text-[9px] uppercase tracking-wider text-neutral-400">
            credits
          </span>
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
