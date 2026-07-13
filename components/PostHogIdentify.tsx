"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import posthog from "posthog-js";
import { useEffect, useRef } from "react";

/**
 * Links Clerk users to PostHog for session replay + error tracking.
 * PostHog itself is initialized in instrumentation-client.ts (Next.js 15.3+).
 */
export function PostHogIdentify() {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const wasSignedIn = useRef(false);

  useEffect(() => {
    if (isSignedIn && userId) {
      posthog.identify(userId, {
        email: user?.primaryEmailAddress?.emailAddress,
        name: user?.fullName ?? undefined,
      });
      wasSignedIn.current = true;
      return;
    }

    if (wasSignedIn.current && !isSignedIn) {
      posthog.reset();
      wasSignedIn.current = false;
    }
  }, [isSignedIn, userId, user]);

  return null;
}
