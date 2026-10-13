"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth, useUser, SignInButton } from "@clerk/nextjs";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Gift,
  Loader2,
  Lock,
  Sparkles,
} from "lucide-react";
import {
  getClaimInfo,
  claimCredits,
  type ClaimInfoResponse,
  type ClaimCreditsResponse,
} from "@/lib/api";

export default function ClaimTokenPage() {
  const params = useParams<{ token: string }>();
  const rawToken = typeof params?.token === "string" ? params.token : "";
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const { user } = useUser();

  const [claimInfo, setClaimInfo] = useState<ClaimInfoResponse | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(true);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimResult, setClaimResult] = useState<ClaimCreditsResponse | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const loadInfo = useCallback(async () => {
    if (!rawToken) {
      setClaimInfo({ status: "not_found" });
      setIsChecking(false);
      return;
    }

    setIsChecking(true);
    try {
      const authToken = isSignedIn ? await getToken() : null;
      const info = await getClaimInfo(rawToken, authToken);
      setClaimInfo(info);
    } catch {
      setClaimInfo({ status: "not_found" });
    } finally {
      setIsChecking(false);
    }
  }, [rawToken, isSignedIn, getToken]);

  useEffect(() => {
    if (isLoaded) {
      const timer = setTimeout(() => {
        void loadInfo();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isLoaded, loadInfo]);

  const handleClaim = async () => {
    if (!isSignedIn) {
      return;
    }
    setIsClaiming(true);
    setClaimError(null);
    try {
      const authToken = await getToken();
      if (!authToken) {
        setClaimError("Please sign in to claim credits.");
        return;
      }
      const res = await claimCredits(rawToken, authToken);
      setClaimResult(res);
    } catch (err: any) {
      setClaimError(err?.message || "Failed to claim credits.");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-black text-white selection:bg-white/20">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-emerald-500/10 via-cyan-500/10 to-transparent blur-[120px] pointer-events-none rounded-full" />

      {/* Brand logo */}
      <div className="mb-8 z-10 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center font-bold tracking-tight text-white group-hover:scale-105 transition-transform">
            H
          </div>
          <span className="font-semibold text-lg tracking-tight text-white/90">Hydrilla</span>
        </Link>
      </div>

      {/* Main Container */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-neutral-950/80 p-8 shadow-2xl backdrop-blur-xl">
        {/* State 1: Checking token */}
        {isChecking || !isLoaded ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-white/40" />
            <p className="text-sm text-neutral-400">Verifying claim link...</p>
          </div>
        ) : null}

        {/* State 2: Successfully Claimed */}
        {!isChecking && claimResult ? (
          <div className="text-center space-y-6 py-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold tracking-tight text-white">Credits Claimed!</h1>
              <p className="text-sm text-neutral-300">
                You have successfully added{" "}
                <span className="font-semibold text-emerald-400">+{claimResult.amount} credits</span> to your account.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
              <p className="text-xs text-neutral-400 uppercase tracking-wider font-mono">New Credit Balance</p>
              <p className="text-2xl font-bold text-white mt-1">{claimResult.remaining} Credits</p>
            </div>

            <div className="pt-2 flex flex-col gap-3">
              <Link
                href="/app/studio"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-neutral-200 transition-colors"
              >
                Go to Studio
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/app/settings?tab=billing"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-neutral-200 hover:bg-white/[0.08] transition-colors"
              >
                View in Billing
              </Link>
            </div>
          </div>
        ) : null}

        {/* State 3: Not Found / Invalid */}
        {!isChecking && !claimResult && claimInfo?.status === "not_found" ? (
          <div className="text-center space-y-6 py-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <AlertCircle className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Invalid Claim Link</h1>
              <p className="text-sm text-neutral-400">
                This claim link does not exist, has expired, or is no longer valid.
              </p>
            </div>
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              Return Home
            </Link>
          </div>
        ) : null}

        {/* State 4: Disabled */}
        {!isChecking && !claimResult && claimInfo?.status === "disabled" ? (
          <div className="text-center space-y-6 py-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Link Disabled</h1>
              <p className="text-sm text-neutral-400">
                This credit claim link has been disabled by an administrator.
              </p>
            </div>
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              Return Home
            </Link>
          </div>
        ) : null}

        {/* State 5: Expired */}
        {!isChecking && !claimResult && claimInfo?.status === "expired" ? (
          <div className="text-center space-y-6 py-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Clock className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Link Expired</h1>
              <p className="text-sm text-neutral-400">
                This credit claim link has passed its expiration deadline and can no longer be used.
              </p>
            </div>
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              Return Home
            </Link>
          </div>
        ) : null}

        {/* State 6: Exhausted / Already Claimed */}
        {!isChecking && !claimResult && claimInfo?.status === "exhausted" ? (
          <div className="text-center space-y-6 py-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center text-neutral-400">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                {claimInfo?.alreadyClaimedByUser ? "Already Claimed" : "Link Exhausted"}
              </h1>
              <p className="text-sm text-neutral-400">
                {claimInfo?.alreadyClaimedByUser
                  ? "You have already claimed credits from this link."
                  : "All available credits from this claim link have already been claimed."}
              </p>
            </div>
            <Link
              href="/app/studio"
              className="w-full inline-flex items-center justify-center rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-black hover:bg-neutral-200 transition-colors"
            >
              Open Studio
            </Link>
          </div>
        ) : null}

        {/* State 7: Email Mismatch */}
        {!isChecking && !claimResult && claimInfo?.status === "email_mismatch" ? (
          <div className="text-center space-y-6 py-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Lock className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Restricted Claim Link</h1>
              <p className="text-sm text-neutral-400">
                This link was created exclusively for{" "}
                <span className="font-mono text-amber-300 font-semibold">{claimInfo.allowedEmail}</span>.
              </p>
              {user?.primaryEmailAddress?.emailAddress ? (
                <p className="text-xs text-neutral-500 pt-1">
                  You are currently signed in as {user.primaryEmailAddress.emailAddress}.
                </p>
              ) : null}
            </div>
            <Link
              href="/"
              className="w-full inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition-colors"
            >
              Return Home
            </Link>
          </div>
        ) : null}

        {/* State 8: OK (Ready to Claim or Sign In) */}
        {!isChecking && !claimResult && claimInfo?.status === "ok" ? (
          <div className="text-center space-y-6 py-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Gift className="h-7 w-7" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Sparkles className="h-3 w-3" />
                Claimable Gift
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                +{claimInfo.amount} Credits
              </h1>
              {claimInfo.reason ? (
                <p className="text-sm text-neutral-400 italic">“{claimInfo.reason}”</p>
              ) : (
                <p className="text-sm text-neutral-400">
                  You have received free credits to generate 3D models on Hydrilla.
                </p>
              )}
            </div>

            {claimError ? (
              <div className="rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-xs text-rose-300">
                {claimError}
              </div>
            ) : null}

            {isSignedIn ? (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClaim}
                  disabled={isClaiming}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  {isClaiming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Claiming Credits...
                    </>
                  ) : (
                    <>
                      Claim Credits
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                <SignInButton mode="modal">
                  <button
                    type="button"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-neutral-200 transition-colors"
                  >
                    Sign in to Claim
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </SignInButton>
                <p className="text-xs text-neutral-500">
                  New to Hydrilla? Signing in creates an account automatically.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
