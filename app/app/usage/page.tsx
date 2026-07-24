"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  ImageIcon,
  Box,
  Sparkles,
  ChevronRight,
  PenLine,
  Layers,
  Download,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { checkoutHref, formatUsd, PRICING } from "@/lib/pricing";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://hydrilla-backend.vercel.app";

type CreditsData = {
  used: number;
  total: number;
  remaining: number;
  plan: string | null;
  resetAt?: string | null;
};

type BreakdownItem = {
  type: string;
  label: string;
  credits: number;
  count: number;
};

type UsageRow = {
  id: string;
  date: string;
  type: string;
  credits: number;
  status: string;
};

const PLANS = [
  {
    id: "free",
    name: PRICING.free.label,
    price: formatUsd(PRICING.free.monthly),
    credits: PRICING.free.creditsLabel,
    tagline: "Explore image and 3D generation.",
    cta: "Start creating",
    href: "/generate",
  },
  {
    id: "creator",
    name: PRICING.creator.label,
    price: formatUsd(PRICING.creator.monthly),
    credits: PRICING.creator.creditsLabel,
    tagline: "More volume and quality for creators.",
    cta: "Choose Creator",
    href: checkoutHref("creator"),
  },
  {
    id: "studio",
    name: PRICING.studio.label,
    price: formatUsd(PRICING.studio.monthly),
    credits: PRICING.studio.creditsLabel,
    tagline: "Collaboration and scale for teams.",
    cta: "Choose Studio",
    href: checkoutHref("studio"),
  },
] as const;

const BREAKDOWN_ICONS: Record<string, typeof Box> = {
  "3d": Box,
  image: ImageIcon,
  edit: PenLine,
  combined: Layers,
};

const CHART_TYPE_ORDER = ["Image generation", "3D model", "Edit image", "Combine images"] as const;
const CHART_COLORS: Record<string, string> = {
  "Image generation": "#525252",
  "3D model": "#171717",
  "Edit image": "#a3a3a3",
  "Combine images": "#737373",
};

function formatResetDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return "";
  }
}

function formatTableDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function exportToCsv(rows: UsageRow[], rangeLabel: string) {
  const headers = ["Date", "Type", "Credits", "Status"];
  const lines = [headers.join(","), ...rows.map((r) => [formatTableDate(r.date), r.type, r.credits, r.status].join(","))];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safe = rangeLabel.replace(/\s*–\s*/g, "-").replace(/,/g, "").replace(/\s+/g, "-") || "export";
  a.download = `hydrilla-usage-${safe}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function UsagePage() {
  const { getToken, isSignedIn } = useAuth();
  const [credits, setCredits] = useState<CreditsData | null>(null);
  const [breakdown, setBreakdown] = useState<BreakdownItem[]>([]);
  const [usageHistory, setUsageHistory] = useState<UsageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [range, setRange] = useState<"1d" | "7d" | "30d">("30d");

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      setHistoryLoading(false);
      return;
    }
    (async () => {
      try {
        const token = await getToken();
        const headers = (token ? { Authorization: `Bearer ${token}` } : {}) as HeadersInit;
        const [creditsRes, usageRes, historyRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/payments/credits`, { headers }),
          fetch(`${BACKEND_URL}/api/payments/usage`, { headers }),
          fetch(`${BACKEND_URL}/api/payments/usage/history?limit=200`, { headers }),
        ]);
        if (creditsRes.ok) {
          const data = await creditsRes.json();
          setCredits(data.credits ?? null);
        }
        if (usageRes.ok) {
          const data = await usageRes.json();
          setBreakdown(data.breakdown ?? []);
        }
        if (historyRes.ok) {
          const data = await historyRes.json();
          setUsageHistory(data.usage ?? []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
        setHistoryLoading(false);
      }
    })();
  }, [isSignedIn, getToken]);

  const pct = credits && credits.total > 0 ? Math.round((credits.used / credits.total) * 100) : 0;
  const remaining = credits
    ? typeof credits.remaining === "number"
      ? credits.remaining
      : Math.max(0, credits.total - credits.used)
    : 0;
  const resetStr = formatResetDate(credits?.resetAt);
  const currentPlanId = (credits?.plan ?? "free").toLowerCase();
  const planLabel = credits?.plan
    ? credits.plan.charAt(0).toUpperCase() + credits.plan.slice(1)
    : "Free";

  const now = Date.now();
  const rangeMs = { "1d": 86400000, "7d": 86400000 * 7, "30d": 86400000 * 30 }[range];
  const cutoff = now - rangeMs;
  const filteredHistory = useMemo(
    () => usageHistory.filter((r) => new Date(r.date).getTime() >= cutoff),
    [usageHistory, range]
  );

  const dateRangeLabel = useMemo(() => {
    const to = new Date();
    const from = new Date(cutoff);
    return `${from.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${to.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  }, [cutoff]);

  const chartStart = useMemo(() => {
    if (credits?.resetAt) {
      const r = new Date(credits.resetAt);
      r.setDate(r.getDate() - 1);
      return r.getTime();
    }
    return now - 30 * 86400000;
  }, [credits?.resetAt, now]);

  const chartData = useMemo(() => {
    const byDay: Record<string, Record<string, number>> = {};
    const add = (dayKey: string, type: string, credits: number) => {
      if (!byDay[dayKey]) byDay[dayKey] = {};
      byDay[dayKey][type] = (byDay[dayKey][type] ?? 0) + credits;
    };
    usageHistory.forEach((r) => {
      const t = new Date(r.date).getTime();
      if (t < chartStart) return;
      const d = new Date(t);
      d.setHours(0, 0, 0, 0);
      const dayKey = d.toISOString().slice(0, 10);
      add(dayKey, r.type, r.credits);
    });
    const sortedDays = Object.keys(byDay).sort();
    const result: Array<Record<string, string | number>> = [];
    const cum: Record<string, number> = {};
    CHART_TYPE_ORDER.forEach((t) => (cum[t] = 0));
    sortedDays.forEach((dayKey) => {
      CHART_TYPE_ORDER.forEach((t) => {
        cum[t] += byDay[dayKey][t] ?? 0;
      });
      const row: Record<string, string | number> = { date: dayKey };
      CHART_TYPE_ORDER.forEach((t) => (row[t] = cum[t]));
      result.push(row);
    });
    const todayStr = new Date().toISOString().slice(0, 10);
    if (result.length > 0 && result[result.length - 1].date !== todayStr) {
      const last = result[result.length - 1];
      const todayRow: Record<string, string | number> = { date: todayStr };
      CHART_TYPE_ORDER.forEach((t) => (todayRow[t] = last[t]));
      result.push(todayRow);
    }
    return result;
  }, [usageHistory, chartStart]);

  const todayKey = useMemo(() => new Date().toISOString().slice(0, 10), []);

  return (
    <div className="app-content-page font-dm-sans bg-[#fafafa]">
      <section className="flex flex-col gap-8 sm:gap-10 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <p className="text-[11px] sm:text-xs font-medium text-neutral-400 tracking-[0.14em] uppercase">
              Account
            </p>
            <h1 className="mt-1.5 text-[28px] sm:text-[34px] font-semibold text-neutral-900 tracking-[-0.03em] leading-[1.1]">
              Usage
            </h1>
            <p className="mt-2 text-sm text-neutral-500">
              {loading
                ? "Loading your usage…"
                : `${planLabel} plan · ${remaining.toLocaleString()} credits remaining`}
            </p>
          </div>
          <Link
            href="/app/pricing"
            className="inline-flex items-center justify-center gap-1.5 h-10 px-5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.08)] transition-colors shrink-0"
          >
            Manage plan
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {PLANS.map((plan) => {
            const isCurrent = currentPlanId === plan.id;
            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex min-h-[220px] flex-col rounded-[22px] border bg-white p-5 transition-all duration-200",
                  isCurrent
                    ? "border-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(0,0,0,0.18)]"
                    : "border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:border-neutral-300 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.12)]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[15px] font-semibold tracking-tight text-neutral-900">
                      {plan.name}
                    </p>
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-neutral-400">
                      {plan.credits}
                    </p>
                  </div>
                  {isCurrent && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-neutral-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white">
                      <Check className="h-3 w-3" strokeWidth={2.5} />
                      Current
                    </span>
                  )}
                </div>

                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="text-[32px] font-semibold tracking-[-0.04em] text-neutral-900">
                    {plan.price}
                  </span>
                  <span className="text-sm text-neutral-500">/ month</span>
                </div>
                <p className="mt-2 text-sm leading-5 text-neutral-500 flex-1">
                  {plan.tagline}
                </p>

                <Link
                  href={isCurrent ? "/app/pricing" : plan.href}
                  className={cn(
                    "mt-5 inline-flex h-10 w-full items-center justify-center gap-1 rounded-full text-sm font-medium transition-colors",
                    isCurrent
                      ? "bg-neutral-100 text-neutral-800 hover:bg-neutral-200"
                      : "bg-neutral-900 text-white hover:bg-neutral-800"
                  )}
                >
                  {isCurrent ? "Manage plan" : plan.cta}
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>

        {/* Credits balance */}
        <section
          className="rounded-[22px] border border-neutral-200/70 bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
          style={{
            background:
              "linear-gradient(165deg, #ffffff 0%, #fafafa 55%, #f5f5f5 100%)",
          }}
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                This billing period
              </p>
              {loading ? (
                <div className="mt-3 h-9 w-40 rounded-full bg-neutral-200/70 animate-pulse" />
              ) : (
                <p className="mt-2 text-[34px] font-semibold tracking-[-0.03em] text-neutral-900 tabular-nums leading-none">
                  {credits?.used.toLocaleString() ?? "0"}
                  <span className="text-neutral-400 font-medium text-[22px]">
                    {" "}/ {credits?.total.toLocaleString() ?? "0"}
                  </span>
                </p>
              )}
              <p className="mt-2 text-sm text-neutral-500">
                Credits used
                {resetStr && <> · Resets {resetStr}</>}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[22px] font-semibold tracking-tight text-neutral-900 tabular-nums">
                {loading ? "—" : remaining.toLocaleString()}
              </p>
              <p className="text-[12px] text-neutral-500 mt-0.5">remaining</p>
            </div>
          </div>
          {!loading && credits && credits.total > 0 && (
            <div className="mt-5">
              <div className="h-1.5 w-full rounded-full bg-neutral-200/80 overflow-hidden">
                <div
                  className="h-full rounded-full bg-neutral-900 transition-all duration-500 ease-out"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <p className="mt-2 text-[12px] text-neutral-400 tabular-nums">
                {pct}% used
              </p>
            </div>
          )}
        </section>

        {/* Breakdown */}
        {breakdown.length > 0 && (
          <section>
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400 mb-3">
              Credits by type
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {breakdown.map((item) => {
                const Icon = BREAKDOWN_ICONS[item.type] || Box;
                return (
                  <div
                    key={item.type}
                    className="rounded-2xl border border-neutral-200/70 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-neutral-600" strokeWidth={1.75} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-neutral-900 truncate tracking-tight">
                        {item.label}
                      </p>
                      <p className="text-[12px] text-neutral-500 tabular-nums mt-0.5">
                        {item.count} job{item.count !== 1 ? "s" : ""} · {item.credits} credits
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Usage chart + table */}
        <section className="flex flex-col gap-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-[17px] font-semibold text-neutral-900 tracking-tight">
                Your usage
              </h2>
              <p className="mt-1 text-sm text-neutral-500">
                Daily credit usage across this period.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="text-[13px] text-neutral-500 tabular-nums hidden sm:inline">
                {dateRangeLabel}
              </span>
              <div className="inline-flex h-9 items-center rounded-full border border-neutral-200/80 bg-white p-1 gap-0.5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                {(["1d", "7d", "30d"] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRange(r)}
                    className={cn(
                      "h-7 px-3 rounded-full text-[12px] font-medium transition-colors",
                      range === r
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-500 hover:text-neutral-800"
                    )}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => exportToCsv(filteredHistory, dateRangeLabel)}
                disabled={filteredHistory.length === 0}
                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-neutral-200/80 bg-white px-3.5 text-[12px] font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
              >
                <Download className="w-3.5 h-3.5" />
                Export
              </button>
            </div>
          </div>

          {/* Chart */}
          <div className="rounded-[22px] border border-neutral-200/70 bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="px-5 py-3.5 border-b border-neutral-100/80 flex items-center justify-between gap-3">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
                Cumulative by type
              </p>
              {chartData.length > 0 && (
                <div className="hidden sm:flex flex-wrap gap-3">
                  {CHART_TYPE_ORDER.map((type) => (
                    <div key={type} className="flex items-center gap-1.5">
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: CHART_COLORS[type] ?? "#888" }}
                      />
                      <span className="text-[11px] text-neutral-500">{type}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 sm:p-5">
              {chartData.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center gap-2">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mb-1">
                    <Sparkles className="w-5 h-5 text-neutral-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-sm font-medium text-neutral-600">No usage yet</p>
                  <p className="text-[13px] text-neutral-500 max-w-xs">
                    Credits you spend on images and 3D models will appear here.
                  </p>
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <defs>
                        {CHART_TYPE_ORDER.map((type) => (
                          <linearGradient key={type} id={`area-${type.replace(/\s/g, "-")}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={CHART_COLORS[type] ?? "#888"} stopOpacity={0.35} />
                            <stop offset="100%" stopColor={CHART_COLORS[type] ?? "#888"} stopOpacity={0.04} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) => {
                          const d = new Date(v);
                          return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                        }}
                        tick={{ fontSize: 11, fill: "#a3a3a3" }}
                        axisLine={{ stroke: "#f0f0f0" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 11, fill: "#a3a3a3" }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                      />
                      <Tooltip
                        formatter={(value: unknown) => [typeof value === "number" ? value : 0, ""]}
                        labelFormatter={(label) =>
                          new Date(String(label)).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        }
                        contentStyle={{
                          borderRadius: 16,
                          border: "1px solid rgba(0,0,0,0.06)",
                          boxShadow: "0 8px 30px -8px rgba(0,0,0,0.15)",
                          fontSize: 12,
                        }}
                      />
                      {CHART_TYPE_ORDER.map((type) => (
                        <Area
                          key={type}
                          type="monotone"
                          dataKey={type}
                          stackId="1"
                          stroke={CHART_COLORS[type] ?? "#888"}
                          fill={`url(#area-${type.replace(/\s/g, "-")})`}
                          strokeWidth={1.5}
                        />
                      ))}
                      <ReferenceLine x={todayKey} stroke="#d4d4d4" strokeDasharray="4 4" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
            {chartData.length > 0 && (
              <div className="px-5 pb-4 flex flex-wrap gap-3 justify-center sm:hidden">
                {CHART_TYPE_ORDER.map((type) => (
                  <div key={type} className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: CHART_COLORS[type] ?? "#888" }}
                    />
                    <span className="text-[11px] text-neutral-500">{type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* History table */}
          <div className="rounded-[22px] border border-neutral-200/70 bg-white overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            {historyLoading ? (
              <div className="p-16 text-center">
                <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-neutral-500">Loading usage…</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="p-16 text-center">
                <p className="text-sm font-medium text-neutral-600 mb-1">No usage in this period</p>
                <p className="text-[13px] text-neutral-500">
                  Credits you spend will show up here.
                </p>
              </div>
            ) : (
              <>
                <div className="px-5 py-3.5 border-b border-neutral-100/80 flex items-center justify-between gap-3">
                  <p className="text-[13px] text-neutral-500">
                    <span className="font-medium text-neutral-800 tabular-nums">
                      {filteredHistory.length}
                    </span>{" "}
                    event{filteredHistory.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-[12px] text-neutral-400 tabular-nums hidden sm:block">
                    {dateRangeLabel}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-neutral-100">
                        <th className="text-left font-medium text-[11px] uppercase tracking-[0.1em] text-neutral-400 px-5 py-3">
                          Date
                        </th>
                        <th className="text-left font-medium text-[11px] uppercase tracking-[0.1em] text-neutral-400 px-5 py-3">
                          Type
                        </th>
                        <th className="text-right font-medium text-[11px] uppercase tracking-[0.1em] text-neutral-400 px-5 py-3">
                          Credits
                        </th>
                        <th className="text-left font-medium text-[11px] uppercase tracking-[0.1em] text-neutral-400 px-5 py-3">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistory.map((row) => (
                        <tr
                          key={row.id}
                          className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/80 transition-colors"
                        >
                          <td className="px-5 py-3.5 text-neutral-500 tabular-nums text-[13px]">
                            {formatTableDate(row.date)}
                          </td>
                          <td className="px-5 py-3.5 text-neutral-900 font-medium text-[13px]">
                            {row.type}
                          </td>
                          <td className="px-5 py-3.5 text-right font-semibold tabular-nums text-neutral-900 text-[13px]">
                            {row.credits}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="inline-flex items-center rounded-full bg-neutral-100 px-2.5 py-0.5 text-[11px] font-medium text-neutral-600 capitalize">
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </section>

        {/* CTA */}
        <div className="rounded-[22px] border border-neutral-200/70 bg-white py-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <p className="text-[15px] font-semibold text-neutral-900 tracking-tight mb-1.5">
            Ready to create?
          </p>
          <p className="text-sm text-neutral-500 mb-5">
            Open a workspace and start generating.
          </p>
          <Link
            href="/app/studio"
            className="inline-flex items-center gap-1.5 h-10 px-5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-full transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Go to Studio
          </Link>
        </div>
      </section>
    </div>
  );
}
