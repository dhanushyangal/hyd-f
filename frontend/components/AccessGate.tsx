"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getCurrentUser } from "../lib/api";

type AccessGateProps = {
  children: React.ReactNode;
};

/**
 * Invite / approval gate.
 *
 * ON HOLD by default — any signed-in user can use workspace + generate.
 * Set NEXT_PUBLIC_ACCESS_CONTROL_ENABLED=true to re-enable enforcement.
 * Access-denied page, invite flow, and admin invites stay in the codebase.
 */
const ACCESS_CONTROL_ENABLED =
  process.env.NEXT_PUBLIC_ACCESS_CONTROL_ENABLED === "true";

const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 800;

function isAdminClient(user: ReturnType<typeof useUser>["user"]): boolean {
  if (!user) return false;
  if (user.publicMetadata?.role === "admin") return true;
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
  return !!email && adminEmails.includes(email);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Pass-through when access control is on hold; otherwise enforces approval.
 * Must be used inside SignedIn contexts or on routes already protected by Clerk middleware.
 */
export function AccessGate({ children }: AccessGateProps) {
  if (!ACCESS_CONTROL_ENABLED) {
    return <>{children}</>;
  }

  return <AccessGateEnforced>{children}</AccessGateEnforced>;
}

/**
 * Redirects unapproved logged-in users to /access-denied.
 * Network / token blips are NOT treated as "unapproved".
 */
function AccessGateEnforced({ children }: AccessGateProps) {
  const { isSignedIn, getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [verifyError, setVerifyError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const retry = useCallback(() => {
    setVerifyError(false);
    setChecking(true);
    setAllowed(false);
    setRetryKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setChecking(false);
      setAllowed(false);
      setVerifyError(false);
      return;
    }

    // Admins always pass (even before migration is run)
    if (isAdminClient(user)) {
      setAllowed(true);
      setChecking(false);
      setVerifyError(false);
      return;
    }

    let cancelled = false;

    const checkAccess = async () => {
      setChecking(true);
      setVerifyError(false);

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
        const result = await getCurrentUser(async () => await getToken());

        if (cancelled) return;

        if (result.ok) {
          if (result.user?.isApproved) {
            setAllowed(true);
            setChecking(false);
            return;
          }

          // Explicit unapproved profile — only deny when backend confirms it.
          router.replace("/access-denied");
          setAllowed(false);
          setChecking(false);
          return;
        }

        // Token not ready yet or transient failure — wait and retry.
        if (attempt < MAX_ATTEMPTS - 1) {
          await sleep(RETRY_DELAY_MS * (attempt + 1));
        }
      }

      if (cancelled) return;

      // Still signed in with Clerk, but we could not verify approval.
      // Do not kick to /access-denied or treat as logout.
      setAllowed(false);
      setVerifyError(true);
      setChecking(false);
    };

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, isLoaded, user, getToken, router, retryKey]);

  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (verifyError) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-neutral-50 px-6 text-center">
        <p className="text-neutral-800 font-medium">Couldn&apos;t verify your session</p>
        <p className="text-sm text-neutral-500 max-w-sm">
          You&apos;re still signed in. A temporary network issue stopped us from loading your account.
        </p>
        <button
          type="button"
          onClick={retry}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
