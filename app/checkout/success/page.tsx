"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { track } from "@/lib/analytics";

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://hydrilla-backend.vercel.app").replace(/\/+$/, "");

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-black animate-spin" />
    </div>
  );
}

function CheckoutSuccessContent() {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [subscriptionStatus, setSubscriptionStatus] = useState<
    "checking" | "active" | "pending" | "error"
  >("checking");
  const activatedTracked = useRef(false);

  // Dodo returns different params depending on payment type:
  //   subscription: ?subscription_id=sub_xxx&status=active&email=...
  //   one-time:     ?payment_id=pay_xxx
  const paymentId = searchParams.get("payment_id");
  const subscriptionIdFromUrl = searchParams.get("subscription_id");
  const statusFromUrl = searchParams.get("status"); // "active" when Dodo confirms

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setSubscriptionStatus("pending");
      return;
    }

    runSyncThenCheck();
    // Poll for up to 30s so we pick up webhook/sync when it lands
    const interval = setInterval(runSyncThenCheck, 2000);
    const stop = setTimeout(() => clearInterval(interval), 30000);
    return () => {
      clearInterval(interval);
      clearTimeout(stop);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, paymentId, subscriptionIdFromUrl]);

  async function runSyncThenCheck() {
    setSubscriptionStatus((prev) => (prev === "active" ? prev : "checking"));
    try {
      const token = await getToken();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};

      // Always call sync when we have any identifier from Dodo (payment_id or subscription_id)
      if (paymentId || subscriptionIdFromUrl) {
        try {
          const syncBody: Record<string, string> = {};
          if (paymentId) syncBody.payment_id = paymentId;
          if (subscriptionIdFromUrl) syncBody.subscription_id = subscriptionIdFromUrl;

          await fetch(`${BACKEND_URL}/api/payments/sync`, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify(syncBody),
          });
        } catch {
          // ignore sync errors – polling will still pick up once webhook lands
        }
      }

      const [subRes, credRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/payments/subscription`, { headers }),
        fetch(`${BACKEND_URL}/api/payments/credits`, { headers }),
      ]);

      let hasActiveSubscription = false;
      if (subRes.ok) {
        const r = await subRes.json();
        hasActiveSubscription = !!(r.subscription && (r.subscription.status === "active" || r.subscription.status === "on_hold"));
      }
      let hasCredits = false;
      if (credRes.ok) {
        const cred = await credRes.json();
        // Only count as "paid credits" when the plan is set (not free tier)
        hasCredits = !!(cred.credits && cred.credits.plan && cred.credits.total > 0);
      }

      setSubscriptionStatus((prev) => {
        if (prev === "active") return prev;
        const next = hasActiveSubscription || hasCredits ? "active" : "pending";
        if (next === "active" && !activatedTracked.current) {
          activatedTracked.current = true;
          track("subscription_activated", {
            source: "checkout_success",
            has_subscription_id: !!subscriptionIdFromUrl,
            has_payment_id: !!paymentId,
          });
        }
        return next;
      });
    } catch {
      setSubscriptionStatus("pending");
    }
  }

  async function checkSubscription() {
    await runSyncThenCheck();
  }

  // Auto-redirect after success
  useEffect(() => {
    if (subscriptionStatus === "active") {
      const t = setTimeout(() => router.push("/app/studio"), 3500);
      return () => clearTimeout(t);
    }
  }, [subscriptionStatus, router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Hydrilla
          </span>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          {subscriptionStatus === "checking" ? (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full border-4 border-gray-100 border-t-black animate-spin" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying your subscription…</h2>
              <p className="text-sm text-gray-500">This takes just a moment.</p>
            </>
          ) : subscriptionStatus === "active" ? (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-green-50 flex items-center justify-center">
                <svg className="w-9 h-9 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">You&apos;re all set! 🎉</h2>
              <p className="text-sm text-gray-600 mb-6">
                Your subscription is active and your credits have been added. Redirecting you to Studio…
              </p>
              {(paymentId || subscriptionIdFromUrl) && (
                <p className="text-xs text-gray-400 mb-4">
                  {paymentId ? `Payment ID: ${paymentId}` : `Subscription ID: ${subscriptionIdFromUrl}`}
                </p>
              )}
              <Link
                href="/app/studio"
                className="inline-flex items-center justify-center w-full py-3 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Go to Studio
              </Link>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-yellow-50 flex items-center justify-center">
                <svg className="w-9 h-9 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Payment received!</h2>
              <p className="text-sm text-gray-600 mb-6">
                Your payment was successful. We&apos;re activating your subscription — this can take up to a minute. Please refresh this page shortly.
              </p>
              {(paymentId || subscriptionIdFromUrl) && (
                <p className="text-xs text-gray-400 mb-4">
                  {paymentId ? `Payment ID: ${paymentId}` : `Subscription ID: ${subscriptionIdFromUrl}`}
                </p>
              )}
              <div className="flex flex-col gap-3">
                <button
                  onClick={checkSubscription}
                  className="w-full py-3 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
                >
                  Check Again
                </button>
                <Link
                  href="/app/studio"
                  className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors text-center"
                >
                  Go to Studio Anyway
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CheckoutSuccessContent />
    </Suspense>
  );
}
