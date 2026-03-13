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
  Zap,
  PenLine,
  Layers,
  Download,
  Check,
} from "lucide-react";

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
    name: "Free",
    price: "$0",
    period: "/mo.",
    tagline: "Get started with 200 credits per month for image and 3D generation.",
    cta: "Get Started",
    href: "/generate",
    icon: Zap,
  },
  {
    id: "creator",
    name: "Creator",
    price: "$8.99",
    period: "/mo.",
    tagline: "1,000 credits/month. Best for creators who need more volume and quality.",
    cta: "Upgrade to Creator",
    href: "/checkout?plan=creator",
    icon: Sparkles,
  },
  {
    id: "studio",
    name: "Studio",
    price: "$27.99",
    period: "/mo.",
    tagline: "4,000 credits/month. Best for studios and teams.",
    cta: "Upgrade to Studio",
    href: "/checkout?plan=studio",
    icon: Layers,
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
  "Image generation": "#22d3ee",
  "3D model": "#3b82f6",
  "Edit image": "#a78bfa",
  "Combine images": "#34d399",
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
  const resetStr = formatResetDate(credits?.resetAt);
  const currentPlanId = (credits?.plan ?? "free").toLowerCase();

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

  // Billing period start for chart (resetAt or 30 days ago)
  const chartStart = useMemo(() => {
    if (credits?.resetAt) {
      const r = new Date(credits.resetAt);
      r.setDate(r.getDate() - 1);
      return r.getTime();
    }
    return now - 30 * 86400000;
  }, [credits?.resetAt, now]);

  // Cumulative credits by type per day for stacked area chart
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
    // Ensure today is in data so "Today" reference line shows
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
    <div className="app-content-page font-dm-sans w-full max-w-6xl mx-auto px-4 sm:px-6">
      <header className="mb-6 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 tracking-tight">
          Usage
        </h1>
        <p className="text-sm sm:text-base text-neutral-500 mt-1">
          Your plan, credit balance, and usage history.
        </p>
      </header>

      {/* Top row: Plan cards (like Cursor) — centered grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {PLANS.map((plan) => {
          const isCurrent = currentPlanId === plan.id;
          return (
            <div
              key={plan.id}
              className={`rounded-2xl border p-5 flex flex-col ${
                isCurrent
                  ? "border-green-500/50 bg-green-50/30 border-2"
                  : "border-neutral-200 bg-white hover:border-neutral-300 shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-neutral-700">{plan.name}</span>
                {isCurrent && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-600 text-white text-xs font-medium px-2 py-0.5">
                    <Check className="w-3 h-3" />
                    Current
                  </span>
                )}
              </div>
              <div className="flex items-baseline gap-0.5 mb-1">
                <span className="text-2xl font-bold text-neutral-900">{plan.price}</span>
                <span className="text-sm text-neutral-500">{plan.period}</span>
              </div>
              <p className="text-xs text-neutral-500 mb-4 flex-1 min-h-[2.5rem]">{plan.tagline}</p>
              <Link
                href={plan.href}
                className={`inline-flex items-center justify-center gap-1.5 rounded-xl text-sm font-medium px-4 py-2.5 transition-colors ${
                  isCurrent
                    ? "bg-neutral-800 text-white hover:bg-neutral-700"
                    : "bg-neutral-900 text-white hover:bg-neutral-800"
                }`}
              >
                {isCurrent ? "Adjust Plan" : plan.cta}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          );
        })}
      </section>

      {/* Credits this period — On-Demand style: bar + Edit Limit */}
      <section className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden mb-8">
        <div className="px-5 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-neutral-900 tabular-nums">
              {credits?.used.toLocaleString() ?? "0"} / {credits?.total.toLocaleString() ?? "0"}
            </h2>
            <p className="text-sm text-neutral-500 mt-0.5">
              Credits used this billing period
              {resetStr && (
                <>
                  {" "}
                  · Resets {resetStr}
                </>
              )}
            </p>
          </div>
          <Link
            href="/app/pricing"
            className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 text-white font-medium text-sm px-4 py-2.5 hover:bg-neutral-800 transition-colors shrink-0"
          >
            Edit limit
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        {!loading && credits && credits.total > 0 && (
          <div className="px-5 sm:px-6 pb-5">
            <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-neutral-800 transition-all duration-500"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        )}
      </section>

      {/* Your Usage — chart + table like Cursor */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-neutral-900 mb-1">Your Usage</h2>
        <p className="text-sm text-neutral-500 mb-4">
          Your usage per day across this billing period.
        </p>

        {/* Filters row: date range + Export CSV */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">{dateRangeLabel}</span>
            <div className="flex rounded-lg bg-neutral-100 p-0.5">
              {(["1d", "7d", "30d"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    range === r ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-600 hover:text-neutral-900"
                  }`}
                >
                  {r === "1d" ? "1d" : r === "7d" ? "7d" : "30d"}
                </button>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={() => exportToCsv(filteredHistory, dateRangeLabel)}
            disabled={filteredHistory.length === 0}
            className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>

        {/* Cumulative credits by type — stacked area chart */}
        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm mb-6">
          <div className="px-4 py-3 border-b border-neutral-100 flex flex-wrap items-center gap-3">
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">By type</span>
            <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">Credits</span>
          </div>
          <div className="p-4">
            {chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-sm text-neutral-500">
                No usage in this period. Usage will appear here once you use credits.
              </div>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      {CHART_TYPE_ORDER.map((type) => (
                        <linearGradient key={type} id={`area-${type.replace(/\s/g, "-")}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={CHART_COLORS[type] ?? "#888"} stopOpacity={0.6} />
                          <stop offset="100%" stopColor={CHART_COLORS[type] ?? "#888"} stopOpacity={0.1} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(v) => {
                        const d = new Date(v);
                        return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
                      }}
                      tick={{ fontSize: 11, fill: "#737373" }}
                      axisLine={{ stroke: "#e5e5e5" }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#737373" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => (v >= 1000 ? `${v / 1000}k` : String(v))}
                    />
                    <Tooltip
                      formatter={(value: unknown) => [typeof value === "number" ? value : 0, ""]}
                      labelFormatter={(label) => new Date(String(label)).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                      contentStyle={{ borderRadius: 8, border: "1px solid #e5e5e5" }}
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
                    <ReferenceLine x={todayKey} stroke="#a3a3a3" strokeDasharray="4 4" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          {chartData.length > 0 && (
            <div className="px-4 pb-4 flex flex-wrap gap-4 justify-center">
              {CHART_TYPE_ORDER.map((type) => (
                <div key={type} className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-sm shrink-0"
                    style={{ backgroundColor: CHART_COLORS[type] ?? "#888" }}
                  />
                  <span className="text-xs text-neutral-600">{type}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden shadow-sm">
          {historyLoading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-neutral-500">Loading usage…</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-neutral-500">
                No usage in this period. Credits you spend on images and 3D models will appear here.
              </p>
            </div>
          ) : (
            <>
              <p className="px-4 py-3 text-xs text-neutral-500 border-b border-neutral-100">
                Showing {filteredHistory.length} row{filteredHistory.length !== 1 ? "s" : ""} from {dateRangeLabel}.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50/80">
                      <th className="text-left font-semibold text-neutral-700 px-4 py-3">Date</th>
                      <th className="text-left font-semibold text-neutral-700 px-4 py-3">Type</th>
                      <th className="text-right font-semibold text-neutral-700 px-4 py-3">Credits</th>
                      <th className="text-left font-semibold text-neutral-700 px-4 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((row) => (
                      <tr key={row.id} className="border-b border-neutral-100 hover:bg-neutral-50/50">
                        <td className="px-4 py-3 text-neutral-600 tabular-nums">{formatTableDate(row.date)}</td>
                        <td className="px-4 py-3 text-neutral-900">{row.type}</td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums text-neutral-900">{row.credits}</td>
                        <td className="px-4 py-3 text-neutral-500">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Credits used by job type — summary cards */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider mb-4">
          Credits by job type
        </h2>
        {breakdown.length === 0 ? null : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {breakdown.map((item) => {
              const Icon = BREAKDOWN_ICONS[item.type] || Box;
              return (
                <div
                  key={item.type}
                  className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm flex items-center gap-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-neutral-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate">{item.label}</p>
                    <p className="text-xs text-neutral-500">
                      {item.count} job{item.count !== 1 ? "s" : ""} · {item.credits} credits
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick link */}
      <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50/50 p-5 text-center">
        <p className="text-sm text-neutral-600 mb-3">Ready to create?</p>
        <Link
          href="/workspace"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-900 hover:text-neutral-700 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          Open workspace
        </Link>
      </div>
    </div>
  );
}
