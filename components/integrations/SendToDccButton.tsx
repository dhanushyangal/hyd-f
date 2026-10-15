"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Box, ChevronDown, ExternalLink, Loader2, Send } from "lucide-react";
import Link from "next/link";
import { checkBridgeHealth, sendGlbBytesToBridge } from "@/lib/dcc/bridge";
import {
  BRIDGE_DEFAULT_URL,
  INTEGRATIONS,
  type Integration,
} from "@/lib/integrations";
import { cn } from "@/lib/utils";

const SEND_TARGETS = INTEGRATIONS.filter(
  (item) =>
    item.status === "available" &&
    (item.category === "modeling" || item.category === "engines")
);

type Props = {
  meshUrl: string | null | undefined;
  jobId?: string | null;
  className?: string;
  compact?: boolean;
};

export function SendToDccButton({
  meshUrl,
  jobId,
  className,
  compact = false,
}: Props) {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [bridgeOk, setBridgeOk] = useState<boolean | null>(null);
  const [busyTarget, setBusyTarget] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const state = { cancelled: false };
    void checkBridgeHealth(BRIDGE_DEFAULT_URL)
      .then(() => {
        if (!state.cancelled) {
          setBridgeOk(true);
        }
      })
      .catch(() => {
        if (!state.cancelled) {
          setBridgeOk(false);
        }
      });
    return () => {
      state.cancelled = true;
    };
  }, [open]);

  const disabled = !meshUrl;

  const send = async (target: Integration) => {
    if (!meshUrl) {
      return;
    }
    setBusyTarget(target.slug);
    setMessage(null);
    try {
      await sendGlbBytesToBridge({
        meshUrl,
        name: `hydrilla-${jobId || target.slug}`,
        target: target.bridgeTarget,
        jobId: jobId || undefined,
        getToken: async () => (await getToken()) ?? null,
      });
      setMessage(`Sent to ${target.name}. Import from the plugin Bridge panel.`);
      setBridgeOk(true);
    } catch {
      setBridgeOk(false);
      setMessage(
        "Bridge offline. In the DCC plugin click Run Bridge, then retry."
      );
    } finally {
      setBusyTarget(null);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full text-neutral-800 disabled:cursor-not-allowed disabled:opacity-50",
          compact
            ? "h-8 px-2.5 text-[12px] font-semibold text-neutral-600 hover:bg-neutral-100"
            : "h-9 border border-neutral-200/80 bg-white px-3.5 text-[13px] font-semibold shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)] hover:bg-neutral-50"
        )}
        title="Send to DCC via local Hydrilla Bridge"
      >
        <Send className="h-3.5 w-3.5" strokeWidth={2} />
        Send to DCC
        <ChevronDown className="h-3.5 w-3.5 opacity-60" strokeWidth={2} />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+8px)] z-40 w-[280px] rounded-2xl border border-neutral-200 bg-white p-2 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.35)]">
          <div className="mb-2 flex items-start gap-2 rounded-xl bg-neutral-50 px-3 py-2">
            <Box className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500" strokeWidth={1.85} />
            <div className="min-w-0 text-[12px] leading-5 text-neutral-600">
              {bridgeOk === null ? (
                <span>Checking local Bridge…</span>
              ) : bridgeOk ? (
                <span>Bridge online at {BRIDGE_DEFAULT_URL}</span>
              ) : (
                <span>
                  Bridge offline.{" "}
                  <Link href="/integrations" className="font-semibold text-neutral-950 underline">
                    Setup
                  </Link>
                </span>
              )}
            </div>
          </div>

          <ul className="max-h-64 space-y-0.5 overflow-auto">
            {SEND_TARGETS.map((target) => (
              <li key={target.slug}>
                <button
                  type="button"
                  disabled={Boolean(busyTarget)}
                  onClick={() => void send(target)}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] font-medium text-neutral-900 hover:bg-neutral-50 disabled:opacity-60"
                >
                  <span>{target.name}</span>
                  {busyTarget === target.slug ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>

          {message ? (
            <p className="mt-2 px-2 text-[12px] leading-5 text-neutral-600">{message}</p>
          ) : null}

          <Link
            href="/integrations"
            className="mt-2 flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px] font-semibold text-neutral-700 hover:bg-neutral-50"
            onClick={() => setOpen(false)}
          >
            All integrations
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : null}
    </div>
  );
}
