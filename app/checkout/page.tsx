"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://hydrilla-backend.vercel.app";

const PLAN_INFO: Record<string, { label: string; price: string; credits: string; color: string }> = {
  creator: {
    label: "Creator",
    price: "$8.99/month",
    credits: "1,000 credits/month",
    color: "#3B8EE8",
  },
  studio: {
    label: "Studio",
    price: "₹27.99/month",
    credits: "4,000 credits/month",
    color: "#111111",
  },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isSignedIn, getToken, isLoaded } = useAuth();
  const { user } = useUser();

  const plan = searchParams.get("plan") || "";
  const planInfo = PLAN_INFO[plan];

  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const userEmail =
    user?.emailAddresses?.[0]?.emailAddress ||
    user?.primaryEmailAddress?.emailAddress ||
    null;

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      router.push(`/sign-in?redirect_url=/checkout?plan=${plan}`);
      return;
    }

    if (!planInfo) {
      setError(`Unknown plan: "${plan}". Please go back and choose a valid plan.`);
      setStatus("error");
      return;
    }

    if (!userEmail) {
      setError("Could not get your email address. Please try signing in again.");
      setStatus("error");
      return;
    }

    // Auto-start checkout as soon as we have everything
    if (status === "idle") {
      startCheckout();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, userEmail, plan]);

  async function startCheckout() {
    setStatus("loading");
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch(`${BACKEND_URL}/api/payments/create-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plan, email: userEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      if (!data.checkoutUrl) {
        throw new Error("No checkout URL returned from server");
      }

      // Redirect to Dodo Payments hosted checkout
      window.location.href = data.checkoutUrl;
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Logo / brand */}
        <div className="mb-8">
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Hydrilla
          </span>
        </div>

        {status === "error" ? (
          <div className="rounded-2xl border border-red-100 bg-red-50 p-8">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <div className="flex flex-col gap-3">
              <button
                onClick={startCheckout}
                className="w-full py-3 rounded-xl bg-black text-white text-sm font-semibold hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => router.back()}
                className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            {/* Plan badge */}
            {planInfo && (
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-white mb-6"
                style={{ backgroundColor: planInfo.color }}
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {planInfo.label} Plan
              </div>
            )}

            {/* Spinner */}
            <div className="w-16 h-16 mx-auto mb-6 relative">
              <div className="w-16 h-16 rounded-full border-4 border-gray-100 border-t-black animate-spin" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {status === "loading" ? "Opening Checkout…" : "Preparing your checkout"}
            </h2>

            {planInfo && (
              <p className="text-sm text-gray-500 mb-1">
                {planInfo.label} · {planInfo.price}
              </p>
            )}
            {planInfo && (
              <p className="text-sm text-gray-400">{planInfo.credits}</p>
            )}

            <p className="mt-6 text-xs text-gray-400">
              You&apos;ll be securely redirected to our payment provider.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-gray-100 border-t-black animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
