"use client";

import { useEffect, useState } from "react";
import { formatSlotRemaining, slotRemaining } from "../lib/slot-remaining";

const RAW_BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "https://hydrilla-backend.vercel.app";
const BACKEND_URL = RAW_BACKEND.replace(/\/+$/, "");

export type SlotStatus = {
  loading: boolean;
  enrolled: boolean;
  open: boolean;
  needsHour: boolean;
  label: string | null;
  remainingLabel: string | null;
  /** Sentence for the workspace submit control. Empty when generate is allowed. */
  blockedNote: string | null;
};

const idle: SlotStatus = {
  loading: false,
  enrolled: false,
  open: true,
  needsHour: false,
  label: null,
  remainingLabel: null,
  blockedNote: null,
};

type WindowSnap = { startHour: number; durationHours: number; label: string };

export function useSlotStatus(
  getToken: () => Promise<string | null>,
  enabled: boolean,
  options?: { tick?: boolean }
): SlotStatus {
  const tick = options?.tick ?? false;
  const [snap, setSnap] = useState<WindowSnap | null>(null);
  const [needsHour, setNeedsHour] = useState(false);
  const [enrolled, setEnrolled] = useState(false);
  const [loading, setLoading] = useState(enabled);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setEnrolled(false);
      setNeedsHour(false);
      setSnap(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const res = await fetch(
          `${BACKEND_URL}/api/payments/slot?timezone=${encodeURIComponent(timezone)}`,
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
        if (!res.ok || cancelled) return;
        const body = await res.json();
        if (cancelled) return;
        setEnrolled(Boolean(body.enrolled));
        if (body.window && typeof body.window.startHour === "number") {
          setNeedsHour(false);
          setSnap({
            startHour: body.window.startHour,
            durationHours: body.durationHours ?? 1,
            label: body.window.label,
          });
        } else {
          setSnap(null);
          setNeedsHour(Boolean(body.enrolled));
        }
      } catch {
        if (!cancelled) {
          setEnrolled(false);
          setNeedsHour(false);
          setSnap(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, getToken]);

  useEffect(() => {
    if (!snap || !tick) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [snap, tick]);

  useEffect(() => {
    if (!snap || tick) return;
    const clock = slotRemaining(snap.startHour, snap.durationHours, new Date(now));
    const id = window.setTimeout(() => setNow(Date.now()), Math.min(clock.remainingMs + 250, 60 * 60 * 1000));
    return () => window.clearTimeout(id);
  }, [snap, tick, now]);

  if (!enabled || loading || !enrolled) {
    return { ...idle, loading: enabled && loading };
  }
  if (needsHour || !snap) {
    return {
      loading: false,
      enrolled: true,
      open: false,
      needsHour: true,
      label: null,
      remainingLabel: null,
      blockedNote: "Choose your hour in Settings before you generate.",
    };
  }
  const clock = slotRemaining(snap.startHour, snap.durationHours, new Date(now));
  const remainingLabel = formatSlotRemaining(clock.remainingMs);
  return {
    loading: false,
    enrolled: true,
    open: clock.open,
    needsHour: false,
    label: snap.label,
    remainingLabel,
    blockedNote: clock.open
      ? null
      : `You can generate ${snap.label}. Opens in ${remainingLabel}.`,
  };
}
