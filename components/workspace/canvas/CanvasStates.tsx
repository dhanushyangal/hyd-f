"use client";

import Link from "next/link";
import { AlertTriangle, Clock, Coins } from "lucide-react";
import { ThinkingOrb } from "thinking-orbs";
import { Progress } from "@/components/ui/progress";
import { WaterPassRail } from "@/components/water/WaterPassRail";
import type { QueueInfo } from "@/lib/api";
import type { QualityTier } from "@/lib/waterSkills";
import { isPaywallError, track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { displayImageUrl, EASE, FOCUS } from "../composer-parts";
import type { ComposerMode } from "../types";

const HEADLINES: Record<ComposerMode, string> = {
  image: "Describe an image",
  "3d": "Turn an image or an idea into 3D",
  agent: "Describe something to build",
};

const EXAMPLES: Record<ComposerMode, string[]> = {
  image: [
    "Fantasy paladin in ornate silver armor, studio lighting",
    "Retro astronaut helmet with a golden visor",
    "Glowing crimson potion bottle with gold filigree",
  ],
  "3d": [
    "A futuristic sneaker with neon trim",
    "An ancient dragon skull carved from obsidian",
    "A sci-fi drone with quad rotors",
  ],
  agent: ["Vintage radio with brass knobs", "Low-poly lighthouse on a rock", "Stylized robot with articulated joints"],
};

export function CanvasEmptyState({ mode, onExample }: { mode: ComposerMode; onExample: (text: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-56 text-center">
      <h2 className="mx-auto max-w-md text-balance text-[22px] font-semibold tracking-[-0.02em] text-neutral-900 sm:text-[26px]">
        {HEADLINES[mode]}
      </h2>
      <div className="mt-5 flex max-w-xl flex-wrap justify-center gap-2">
        {EXAMPLES[mode].map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onExample(example)}
            className={cn(
              "rounded-full border border-neutral-200 bg-white px-3.5 py-2 text-[13px] text-neutral-600 hover:border-neutral-300 hover:text-neutral-900 active:scale-[0.98]",
              EASE,
              FOCUS
            )}
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CanvasPreview({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="flex flex-1 min-h-0 items-center justify-center p-5 pb-56">
      <div className="relative flex h-full max-h-full w-full max-w-full items-center justify-center overflow-hidden rounded-[24px] border border-neutral-200/70 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.14)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={displayImageUrl(imageUrl)} alt="Preview" className="h-auto max-h-full w-auto max-w-full object-contain" />
      </div>
    </div>
  );
}

type GeneratingProps = {
  message: string;
  progress: number;
  water: { tier: QualityTier; pass: string | null } | null;
  queueInfo: QueueInfo | null;
  onCancel: (() => void) | null;
};

export function CanvasGeneratingOverlay({ message, progress, water, queueInfo, onCancel }: GeneratingProps) {
  const showQueue = queueInfo && (queueInfo.jobs_ahead > 0 || (queueInfo.estimated_total_seconds ?? 0) > 0);

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center pb-48"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <ThinkingOrb state="solving" size={64} />
      <p className="mt-5 max-w-sm text-center text-[15px] font-medium tracking-tight text-neutral-800">{message}</p>
      {water && <WaterPassRail tier={water.tier} pass={water.pass} className="mt-5 justify-center" />}
      {showQueue && (
        <p className="mt-3 text-[13px] text-neutral-500">
          {queueInfo.jobs_ahead > 0 && <span>Position {queueInfo.position + 1} in queue</span>}
          {queueInfo.estimated_total_seconds != null && queueInfo.estimated_total_seconds > 0 && (
            <span>
              {queueInfo.jobs_ahead > 0 ? " · " : ""}~{Math.round(queueInfo.estimated_total_seconds / 60)} min
            </span>
          )}
        </p>
      )}
      <div className="mt-6 w-48 space-y-2">
        <Progress className="h-1 w-full" value={progress} />
        <p className="text-center text-[12px] tabular-nums text-neutral-500">{Math.round(progress)}%</p>
      </div>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="pointer-events-auto mt-5 h-9 rounded-full px-4 text-[13px] font-medium text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

function hourNotice(message: string): { window: string; now: string } | null {
  const current = message.match(/^Your hour is (.+?)\. It is (.+?) now\b/);
  if (current) return { window: current[1], now: current[2] };
  const previous = message.match(/^You can generate (.+?) \([^)]+\)\. It is (.+?) there now\b/);
  if (previous) return { window: previous[1], now: previous[2] };
  return null;
}

function needsHour(message: string): boolean {
  return /Choose your hours? in Settings, under Billing/i.test(message);
}

export function CanvasError({
  message,
  refunded,
  onDismiss,
}: {
  message: string;
  /** Only claim a refund when credits were actually charged. */
  refunded: boolean;
  onDismiss: () => void;
}) {
  const hour = hourNotice(message);
  if (hour) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-56 text-center font-dm-sans" role="status">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-900">
          <Clock className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-400">Outside your hour</p>
        <h3 className="mt-2 max-w-md text-balance text-[32px] font-semibold leading-none tracking-[-0.04em] text-neutral-900">
          {hour.window}
        </h3>
        <p className="mt-3 max-w-sm text-[15px] leading-6 text-neutral-600">
          It is <span className="font-medium tabular-nums text-neutral-900">{hour.now}</span> now. You can generate when this hour starts.
        </p>
        <p className="mt-1 text-[14px] leading-6 text-neutral-800">Your credits were not used.</p>
        <button
          type="button"
          onClick={onDismiss}
          className="mt-6 h-11 rounded-full bg-neutral-900 px-5 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          Okay
        </button>
      </div>
    );
  }

  if (needsHour(message)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-56 text-center font-dm-sans" role="status">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-900">
          <Clock className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <h3 className="mt-5 text-[28px] font-semibold tracking-[-0.03em] text-neutral-900">Choose your hour</h3>
        <p className="mt-2 max-w-sm text-[15px] leading-6 text-neutral-600">
          Open Settings, then Billing, and pick the hour you can generate. Your credits were not used.
        </p>
        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="h-11 rounded-full px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          >
            Not now
          </button>
          <Link
            href="/app/settings?section=billing"
            className="inline-flex h-11 items-center rounded-full bg-neutral-900 px-5 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          >
            Choose hour
          </Link>
        </div>
      </div>
    );
  }

  if (isPaywallError(message)) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-56 text-center font-dm-sans" role="status">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-900">
          <Coins className="h-5 w-5" strokeWidth={1.75} />
        </div>
        <h3 className="mt-5 text-[28px] font-semibold tracking-[-0.03em] text-neutral-900">Out of credits</h3>
        <p className="mt-2 max-w-sm text-[15px] leading-6 text-neutral-600">
          {message.trim() || "You don't have enough credits for this generation."}
        </p>
        <p className="mt-1 text-[14px] leading-6 text-neutral-800">Credits were not used.</p>
        <div className="mt-6 flex items-center gap-2">
          <button
            type="button"
            onClick={onDismiss}
            className="h-11 rounded-full px-4 text-sm font-medium text-neutral-600 hover:bg-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          >
            Dismiss
          </button>
          <Link
            href="/app/pricing"
            onClick={() => {
              track("upgrade_clicked", { source: "canvas_insufficient_credits" });
            }}
            className="inline-flex h-11 items-center rounded-full bg-neutral-900 px-5 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2"
          >
            Upgrade
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-56 text-center font-dm-sans" role="alert">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="h-5 w-5" strokeWidth={2} />
      </div>
      <h3 className="mt-4 text-[22px] font-semibold tracking-[-0.03em] text-neutral-900">That didn&apos;t work</h3>
      <p className="mt-2 max-w-sm text-[15px] leading-6 text-neutral-600">{message}</p>
      {refunded ? <p className="mt-2 text-[14px] font-medium text-neutral-900">Your credits are back.</p> : null}
      <button
        type="button"
        onClick={onDismiss}
        className="mt-6 h-11 rounded-full bg-neutral-900 px-5 text-sm font-medium text-white hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 active:scale-[0.98]"
      >
        Dismiss
      </button>
    </div>
  );
}
