"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import PricingSection from "../../../components/sections/PricingSection";
import { isPaidPlan } from "../../../lib/pricing";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://hydrilla-backend.vercel.app"
).replace(/\/+$/, "");

export default function PricingPage() {
  const router = useRouter();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setAllowed(true);
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const token = await getToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const [subRes, creditsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/payments/subscription`, { headers }),
          fetch(`${BACKEND_URL}/api/payments/credits`, { headers }),
        ]);

        if (cancelled) return;

        const subJson = subRes.ok ? await subRes.json().catch(() => null) : null;
        const creditsJson = creditsRes.ok ? await creditsRes.json().catch(() => null) : null;
        const subscription = subJson?.subscription ?? null;
        const subActive =
          !!subscription &&
          (subscription.status === "active" ||
            subscription.status === "past_due" ||
            subscription.status === "on_hold");
        const resolvedPlan = creditsJson?.credits?.plan || subscription?.plan || null;

        if (subActive || isPaidPlan(resolvedPlan)) {
          router.replace("/app/settings?section=billing");
          return;
        }
      } catch {
        // Allow fallback to pricing view if check fails
      }
      if (!cancelled) setAllowed(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken, router]);

  if (!allowed) {
    return (
      <div className="app-content-page font-dm-sans bg-[var(--app-canvas)] flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="app-content-page font-dm-sans bg-[var(--app-canvas)]">
      <PricingSection compact />
    </div>
  );
}
