"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { SLOT_PRICING, type SlotPlanId } from "@/lib/pricing";
import { cn } from "@/lib/utils";

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://hydrilla-backend.vercel.app").replace(/\/+$/, "");

type HourRow = {
  hour: number;
  label: string;
  taken: boolean;
};

type SlotState = {
  enrolled: boolean;
  plan: SlotPlanId | null;
  timezone: string | null;
  durationHours: number | null;
  capacity: number;
  open: boolean;
  window: { startHour: number; label: string } | null;
  canChange: boolean;
  nextChangeOn: string | null;
  hours: HourRow[];
};

const DAY_PARTS = ["Night", "Morning", "Afternoon", "Evening"] as const;
type DayPart = (typeof DAY_PARTS)[number];

function browserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
}

function timezoneLabel(timeZone: string): string {
  return timeZone.replaceAll("_", " ");
}

function changeDateLabel(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function dayPart(label: string): DayPart {
  const match = label.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return "Morning";
  let hour = Number(match[1]) % 12;
  if (match[3].toUpperCase() === "PM") hour += 12;
  if (hour < 6) return "Night";
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

function splitRange(label: string): { start: string; end: string } {
  const [start, end] = label.split(" – ");
  return { start: start ?? label, end: end ?? "" };
}

function ConfirmDialog({
  title,
  body,
  error,
  saving,
  onCancel,
  onConfirm,
}: {
  title: string;
  body: string;
  error: string | null;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const [shown, setShown] = useState(false);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const bodyId = useId();

  useEffect(() => {
    const frame = requestAnimationFrame(() => setShown(true));
    confirmRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
    };
  }, [onCancel, saving]);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 bg-neutral-950/45 transition-opacity duration-200 ease-out",
          shown ? "opacity-100" : "opacity-0"
        )}
        onClick={() => {
          if (!saving) onCancel();
        }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        className={cn(
          "relative w-full max-w-[340px] rounded-2xl bg-white p-5 font-dm-sans shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)] transition-[opacity,transform] duration-200 ease-out",
          shown ? "translate-y-0 scale-100 opacity-100" : "translate-y-1 scale-[0.97] opacity-0"
        )}
      >
        <h3 id={titleId} className="text-[17px] font-semibold tracking-[-0.02em] text-neutral-900">
          {title}
        </h3>
        <p id={bodyId} className="mt-1.5 text-[14px] leading-6 text-neutral-500">
          {body}
        </p>
        {error ? <p className="mt-3 text-[13px] leading-5 text-red-700">{error}</p> : null}
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="h-11 rounded-full border border-neutral-200 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={saving}
            className="h-11 rounded-full bg-neutral-900 text-sm font-medium text-white transition-colors hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Confirm"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function SlotHours({
  getToken,
  active,
}: {
  getToken: () => Promise<string | null>;
  active: boolean;
}) {
  const [state, setState] = useState<SlotState | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState<DayPart | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!active) return;
    const token = await getToken();
    const timezone = encodeURIComponent(browserTimeZone());
    const res = await fetch(`${BACKEND_URL}/api/payments/slot?timezone=${timezone}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error || "Could not load your hours. Try again.");
    setState(body as SlotState);
  }, [active, getToken]);

  useEffect(() => {
    if (!active) return;
    void load().catch((err: unknown) => {
      setError(err instanceof Error ? err.message : "Could not load your hours. Try again.");
    });
  }, [active, load]);

  const closeConfirm = useCallback(() => setConfirming(false), []);

  if (!active) return null;

  const planLabel = state?.plan ? SLOT_PRICING[state.plan].label : "Slot";
  const timezone = state?.timezone;
  const firstChoice = !state?.window;
  const selectedHour = state?.hours.find((hour) => hour.hour === selected) ?? null;
  const currentPart = state?.window ? dayPart(state.window.label) : null;
  const activePart: DayPart = tab ?? currentPart ?? "Morning";
  const visible = state?.hours.filter((hour) => dayPart(hour.label) === activePart) ?? [];

  const save = async () => {
    if (selected == null || !timezone || saving) return;
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/payments/slot`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ startHour: selected, timezone }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not save these hours. Try again.");
      setState(body as SlotState);
      setSelected(null);
      setConfirming(false);
      setSaved(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not save these hours. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const allowance = !state
    ? ""
    : firstChoice
      ? "Your first choice is free. After that, you can change it once a week."
      : state.canChange
        ? "You can change your hour once this week."
        : state.nextChangeOn
          ? `You can change it again on ${changeDateLabel(state.nextChangeOn)}.`
          : "You can change your hour once a week.";

  const confirmTitle = selectedHour ? `Set your hour to ${selectedHour.label}?` : "";
  const confirmBody = firstChoice
    ? "This first choice does not use a change."
    : "This uses your change for the week. You can change it again next Monday.";

  return (
    <>
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex items-start justify-between gap-4 px-5 pb-4 pt-5">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">{planLabel} hour</p>
              {state?.window ? (
                <>
                  <p className="mt-1.5 text-[26px] font-semibold leading-none tracking-[-0.03em] text-neutral-900 tabular-nums">
                    {state.window.label}
                  </p>
                  <p className="mt-2 text-[13px] text-neutral-500">
                    {timezone ? timezoneLabel(timezone) : ""}
                  </p>
                </>
              ) : (
                <>
                  <h2 className="mt-1.5 text-[22px] font-semibold leading-tight tracking-[-0.03em] text-neutral-900">
                    Choose your hour
                  </h2>
                  <p className="mt-1.5 text-[13px] leading-5 text-neutral-500">
                    You can generate only during this hour.
                    {timezone ? ` Times are in ${timezoneLabel(timezone)}.` : ""}
                  </p>
                </>
              )}
            </div>
            {state?.window ? (
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium",
                  state.open ? "bg-emerald-50 text-emerald-700" : "bg-neutral-100 text-neutral-600"
                )}
              >
                <span
                  aria-hidden
                  className={cn("h-1.5 w-1.5 rounded-full", state.open ? "bg-emerald-500" : "bg-neutral-400")}
                />
                {state.open ? "Open now" : "Closed now"}
              </span>
            ) : null}
          </div>

          {!state ? (
            <p className="flex min-h-24 items-center gap-2 border-t border-neutral-100 px-5 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading hours
            </p>
          ) : (
            <>
              <div className="border-t border-neutral-100 px-5 py-4">
                <p className="text-[13px] leading-5 text-neutral-500">{allowance}</p>

                <div
                  role="tablist"
                  aria-label="Time of day"
                  className="mt-4 grid grid-cols-4 gap-1 rounded-full bg-neutral-100 p-1"
                >
                  {DAY_PARTS.map((part) => (
                    <button
                      key={part}
                      type="button"
                      role="tab"
                      aria-selected={activePart === part}
                      onClick={() => setTab(part)}
                      className={cn(
                        "h-9 rounded-full text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900",
                        activePart === part
                          ? "bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
                          : "text-neutral-500 hover:text-neutral-900"
                      )}
                    >
                      {part}
                    </button>
                  ))}
                </div>

                <div role="tabpanel" className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {visible.map((hour) => {
                    const mine = state.window?.startHour === hour.hour;
                    const isSelected = selected === hour.hour;
                    const locked = !state.canChange || hour.taken || mine;
                    const range = splitRange(hour.label);
                    return (
                      <button
                        key={hour.hour}
                        type="button"
                        disabled={locked || saving}
                        aria-pressed={isSelected}
                        onClick={() => {
                          setSaved(false);
                          setError(null);
                          setSelected(hour.hour);
                        }}
                        className={cn(
                          "rounded-xl border px-3 py-2.5 text-left transition-[transform,background-color,border-color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 active:scale-[0.98]",
                          isSelected
                            ? "border-neutral-900 bg-neutral-900 text-white"
                            : mine
                              ? "border-neutral-900 bg-neutral-50 text-neutral-900"
                              : "border-neutral-200 bg-white text-neutral-900 hover:border-neutral-400",
                          locked && !mine && "cursor-not-allowed opacity-40 hover:border-neutral-200 active:scale-100"
                        )}
                      >
                        <span className="block text-[15px] font-semibold leading-5 tracking-tight tabular-nums">
                          {range.start}
                        </span>
                        <span
                          className={cn(
                            "block text-[12px] leading-5",
                            isSelected ? "text-white/70" : "text-neutral-500"
                          )}
                        >
                          {hour.taken ? "Full" : mine ? "Current" : range.end ? `to ${range.end}` : ""}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {state.window && !state.open ? (
                  <p className="mt-3 text-[13px] text-neutral-500">Generation is off until {state.window.label}.</p>
                ) : null}
                {saved && state.window ? (
                  <p className="mt-3 text-[13px] font-medium text-emerald-700" role="status">
                    Saved. Your hour is {state.window.label}.
                  </p>
                ) : null}
                {error && !confirming ? <p className="mt-3 text-[13px] text-red-700">{error}</p> : null}
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50/70 px-5 py-3.5">
                <p className="min-w-0 truncate text-[13px] text-neutral-500">
                  {selectedHour ? (
                    <>
                      New hour <span className="font-medium text-neutral-900 tabular-nums">{selectedHour.label}</span>
                    </>
                  ) : (
                    "Pick an hour to continue"
                  )}
                </p>
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  disabled={!selectedHour || saving || !state.canChange}
                  className="h-10 shrink-0 rounded-full bg-neutral-900 px-5 text-sm font-medium text-white transition-[transform,background-color] duration-150 ease-out hover:bg-neutral-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100"
                >
                  Save
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {confirming && selectedHour ? (
        <ConfirmDialog
          title={confirmTitle}
          body={confirmBody}
          error={error}
          saving={saving}
          onCancel={closeConfirm}
          onConfirm={() => void save()}
        />
      ) : null}
    </>
  );
}
