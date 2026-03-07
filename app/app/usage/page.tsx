"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export default function UsagePage() {
  const { getToken, isSignedIn } = useAuth();
  const [credits, setCredits] = useState<{ used: number; total: number; plan: string | null; remaining: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${BACKEND_URL}/api/payments/credits`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setCredits(data.credits);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [isSignedIn, getToken]);

  const pct = credits && credits.total > 0 ? Math.round((credits.used / credits.total) * 100) : 0;

  return (
    <div className="app-content-page font-dm-sans">
      <header>
        <h1 className="text-3xl font-semibold text-neutral-900 tracking-tight">
          Usage
        </h1>
        <p className="text-base text-neutral-500 mt-1">
          Track your usage and limits.
        </p>
      </header>

      <section className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Credits</h2>
        {loading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : credits ? (
          <>
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-neutral-600">
                {credits.plan ? `${credits.plan.charAt(0).toUpperCase() + credits.plan.slice(1)} plan` : "Free"}
              </span>
              <span className="font-medium tabular-nums text-neutral-900">
                {credits.used} / {credits.total} used
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-neutral-100 overflow-hidden mb-6">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            {credits.total === 0 && (
              <p className="text-sm text-neutral-500 mb-4">
                Subscribe to get monthly credits for 3D generations.
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-neutral-500 mb-4">No credit data.</p>
        )}

        <Link
          href="/app/pricing"
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white font-medium text-sm px-4 py-2.5 hover:bg-blue-700 transition-colors"
        >
          {credits?.total && credits.total > 0 ? "Manage plan" : "Buy credits"}
        </Link>
      </section>
    </div>
  );
}
