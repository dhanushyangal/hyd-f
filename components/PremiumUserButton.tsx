"use client";

import { useEffect, useState } from "react";
import { UserButton, useAuth, useUser } from "@clerk/nextjs";
import { checkEarlyAccess } from "../lib/api";

interface PremiumUserButtonProps {
  afterSignOutUrl?: string;
  appearance?: any;
  className?: string;
}

/**
 * UserButton with Premium Pass ring
 * Shows a bright silver/platinum glowing ring around the avatar if user has early access.
 * Renders UserButton only after mount to avoid Clerk hydration mismatch.
 */
export default function PremiumUserButton({ 
  afterSignOutUrl = "/", 
  appearance,
  className = ""
}: PremiumUserButtonProps) {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [hasPremium, setHasPremium] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [mounted, setMounted] = useState(false);

  const userEmail = user?.emailAddresses?.[0]?.emailAddress || user?.primaryEmailAddress?.emailAddress || null;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const checkPremium = async () => {
      if (!isSignedIn || !userEmail) {
        setHasPremium(false);
        setIsChecking(false);
        return;
      }

      try {
        const { hasAccess } = await checkEarlyAccess(userEmail, getToken);
        setHasPremium(hasAccess);
      } catch (err) {
        console.error("Error checking premium status:", err);
        setHasPremium(false);
      } finally {
        setIsChecking(false);
      }
    };

    checkPremium();
  }, [isSignedIn, userEmail, getToken]);

  // Defer UserButton until client mount to avoid hydration mismatch (Clerk renders different markup on server vs client)
  if (!mounted) {
    return (
      <div className={`relative inline-flex items-center ${className}`} aria-hidden="true">
        <div className="w-8 h-8 rounded-full bg-neutral-200 animate-pulse" />
      </div>
    );
  }

  // If user has premium, wrap avatar with perfect silver circle
  if (hasPremium && !isChecking) {
    return (
      <div className={`relative inline-flex items-center justify-center group ${className}`} title="Early Pass">
        {/* Perfect silver circle ring wrapper - creates exact circle around avatar */}
        <div className="relative inline-flex items-center justify-center">
          {/* Silver ring - using padding to create perfect circle */}
          <div className="p-[2.5px] rounded-full bg-gradient-to-br from-slate-200 via-white to-slate-300 shadow-[0_0_8px_rgba(148,163,184,0.5)]">
            <UserButton
              afterSignOutUrl={afterSignOutUrl}
              appearance={{
                ...appearance,
                elements: {
                  ...appearance?.elements,
                  avatarBox: `${appearance?.elements?.avatarBox || 'w-8 h-8'} rounded-full`,
                  rootBox: "relative",
                },
              }}
            />
          </div>
        </div>
        
        {/* Small star indicator */}
        <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-gradient-to-br from-white to-slate-200 border border-slate-200 shadow-sm flex items-center justify-center z-20">
          <svg 
            className="w-2 h-2 text-slate-500" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>

        {/* Tooltip on hover */}
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2 py-0.5 bg-slate-700 text-white text-[10px] font-medium rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          Early Pass
        </div>
      </div>
    );
  }

  // Regular user button without premium styling
  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <UserButton
        afterSignOutUrl={afterSignOutUrl}
        appearance={appearance}
      />
    </div>
  );
}
