"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser } from "../lib/api";

type AccessGateProps = {
  children: React.ReactNode;
};

const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdminClient(user: ReturnType<typeof useUser>["user"]): boolean {
  if (!user) return false;
  if (user.publicMetadata?.role === "admin") return true;
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
  return !!email && adminEmails.includes(email);
}

/**
 * Redirects unapproved logged-in users to /access-denied.
 * Must be used inside SignedIn contexts or on routes already protected by Clerk middleware.
 */
export function AccessGate({ children }: AccessGateProps) {
  const { isSignedIn, getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!isSignedIn || !isLoaded) {
      if (!isSignedIn) {
        setChecking(false);
        setAllowed(false);
      }
      return;
    }

    // Admins always pass (even before migration is run)
    if (isAdminClient(user)) {
      setAllowed(true);
      setChecking(false);
      return;
    }

    let cancelled = false;

    const checkAccess = async () => {
      const tokenGetter = async () => await getToken();
      const profile = await getCurrentUser(tokenGetter);

      if (cancelled) return;

      if (!profile?.user?.isApproved) {
        router.replace("/access-denied");
        setAllowed(false);
      } else {
        setAllowed(true);
      }
      setChecking(false);
    };

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, isLoaded, user, getToken, router]);

  if (checking) {
    return (
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  if (!allowed) return null;

  return <>{children}</>;
}
