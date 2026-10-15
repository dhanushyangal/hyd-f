"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronDown, Coins, FolderOpen, HelpCircle, PanelLeft, Plus, User } from "lucide-react";
import { ModeToggle } from "@/components/mode-toggle";
import { UserButtonWithHelp } from "@/components/support/UserButtonWithHelp";
import { useSupport } from "@/context/SupportContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { EASE, FOCUS, ICON_BUTTON } from "../composer-parts";

type LibraryProps = {
  workspaceName: string;
  onWorkspaceNameChange: (name: string) => void;
  libraryOpen: boolean;
  onToggleLibrary: () => void;
  onNewWorkspace: () => void;
  /** Pill over the canvas when the library column is closed. */
  floating?: boolean;
  /** Hidden when the library bar flag is the options list, so the full column stays closed. */
  showLibraryToggle?: boolean;
};

/** Logo, library toggle, and workspace name. Only as wide as the library column. */
export function WorkspaceLibraryBar({
  workspaceName,
  onWorkspaceNameChange,
  libraryOpen,
  onToggleLibrary,
  onNewWorkspace,
  floating = false,
  showLibraryToggle = true,
}: LibraryProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center bg-white",
        floating
          ? "pointer-events-auto h-10 w-[220px] gap-0.5 rounded-full border border-neutral-200/80 px-1 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)]"
          : "h-12 gap-1 border-b border-neutral-200/80 px-2"
      )}
    >
      <Link
        href="/app/studio"
        prefetch
        aria-label="Back to Studio"
        title="Back to Studio"
        className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-900", FOCUS)}
      >
        <span className="relative h-[18px] w-[18px] logo-spin-hover">
          <Image src="/hyd01.png" alt="" fill className="object-contain" sizes="18px" priority />
        </span>
      </Link>

      {showLibraryToggle ? (
        <button
          type="button"
          onClick={onToggleLibrary}
          aria-pressed={libraryOpen}
          aria-label={libraryOpen ? "Hide library" : "Show library"}
          title="Library"
          className={cn(ICON_BUTTON, "rounded-full", libraryOpen && "bg-neutral-100 text-neutral-950")}
        >
          <PanelLeft className="h-4 w-4" strokeWidth={1.85} />
        </button>
      ) : null}

      <div className="flex min-w-0 flex-1 items-center">
        <input
          value={workspaceName}
          onChange={(e) => onWorkspaceNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") e.currentTarget.blur();
          }}
          placeholder="Untitled"
          aria-label="Workspace name"
          className={cn(
            "h-8 min-w-0 flex-1 rounded-lg bg-transparent px-1.5 font-semibold text-neutral-900 outline-none placeholder:text-neutral-400 hover:bg-neutral-50 focus:bg-neutral-100",
            floating ? "text-[13px]" : "text-[14px]"
          )}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className={cn(ICON_BUTTON, "h-7 w-7 rounded-full")} aria-label="Workspace menu">
              <ChevronDown className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" sideOffset={8} className="min-w-[200px] p-1">
            <DropdownMenuItem onSelect={onNewWorkspace} className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-[13px]">
              <Plus className="h-4 w-4 text-neutral-500" strokeWidth={1.85} />
              New workspace
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="cursor-pointer gap-2.5 rounded-lg px-2.5 py-2 text-[13px]">
              <Link href="/generations">
                <FolderOpen className="h-4 w-4 text-neutral-500" strokeWidth={1.85} />
                All generations
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

type AccountProps = {
  creditsRemaining: number;
  creditsLoading: boolean;
  clientMounted: boolean;
  className?: string;
};

/** Credits, theme, and profile. Sits in the inspector column, or as a corner pill. */
export function WorkspaceAccountBar({ creditsRemaining, creditsLoading, clientMounted, className }: AccountProps) {
  const { openSupport } = useSupport();

  return (
    <div className={cn("flex items-center gap-1 [&_button]:h-8 [&_button]:w-8", className)}>
      <Link
        href="/pricing"
        title={creditsLoading ? "Credits" : `${creditsRemaining} credits`}
        className={cn(
          "inline-flex h-8 items-center gap-1 rounded-full px-2 text-[12px] text-neutral-500 hover:bg-neutral-100",
          EASE,
          FOCUS
        )}
      >
        <Coins className="h-3.5 w-3.5 text-neutral-500" strokeWidth={1.9} />
        <span className="font-semibold tabular-nums text-neutral-900">{creditsLoading ? "…" : creditsRemaining}</span>
      </Link>
      <button
        type="button"
        onClick={() => openSupport("issue")}
        title="Support & Feedback"
        aria-label="Support & Feedback"
        className={cn(ICON_BUTTON, "rounded-full")}
      >
        <HelpCircle className="h-4 w-4" strokeWidth={1.85} />
      </button>
      <ModeToggle />
      <div className="flex h-8 w-8 items-center justify-center [&_.cl-userButtonBox]:!flex [&_.cl-userButtonTrigger]:!rounded-full">
        {clientMounted ? (
          <UserButtonWithHelp afterSignOutUrl="/" />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-200 text-neutral-400 animate-pulse">
            <User className="h-3.5 w-3.5" />
          </div>
        )}
      </div>
    </div>
  );
}
