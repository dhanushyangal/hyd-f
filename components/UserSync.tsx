"use client";

import { useEffect, useRef } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { syncUser } from "../lib/api";

/**
 * Component that syncs user data to backend database after login.
 * Should be placed in the root layout.
 */
export function UserSync() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const hasSynced = useRef(false);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    // Only sync when:
    // 1. User is signed in
    // 2. We have user data
    // 3. We haven't synced for this user yet in this session
    if (isSignedIn && user && (!hasSynced.current || lastUserId.current !== user.id)) {
      const doSync = async () => {
        const tokenGetter = async () => await getToken();
        const result = await syncUser(tokenGetter);
        
        if (result.success) {
          console.log("User synced to database:", result.user?.email);
          hasSynced.current = true;
          lastUserId.current = user.id;
        } else {
          console.warn("Failed to sync user to database");
        }
      };

      doSync();
    }

    // Reset sync flag when user signs out
    if (!isSignedIn) {
      hasSynced.current = false;
      lastUserId.current = null;
    }
  }, [isSignedIn, user, getToken]);

  // This component doesn't render anything
  return null;
}

