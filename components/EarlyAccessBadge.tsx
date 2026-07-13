"use client";

import { useState, useEffect } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { checkEarlyAccess } from "@/lib/api";

interface EarlyAccessBadgeProps {
  className?: string;
}

export default function EarlyAccessBadge({ className = "" }: EarlyAccessBadgeProps) {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!isSignedIn || !user) {
        setLoading(false);
        return;
      }

      try {
        const email = user.primaryEmailAddress?.emailAddress;
        const result = await checkEarlyAccess(email, getToken);
        setHasAccess(result.hasAccess);
      } catch (error) {
        console.error("Error checking early access:", error);
      } finally {
        setLoading(false);
      }
    }

    checkAccess();
  }, [isSignedIn, user, getToken]);

  // Don't show anything while loading or if no access
  if (loading || !hasAccess) {
    return null;
  }

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {/* Badge */}
      <div className="relative group">
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-slate-100/90 to-white/90 border border-slate-200/60 shadow-sm backdrop-blur-sm">
          {/* Star/Premium Icon */}
          <svg 
            className="w-3 h-3 text-slate-600" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          
          <span className="text-[10px] font-semibold text-slate-700 tracking-wide uppercase">
            Early Access
          </span>
          
          {/* Checkmark */}
          <svg 
            className="w-3 h-3 text-emerald-500" 
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
        
        {/* Tooltip on hover */}
        <div className="absolute left-1/2 -translate-x-1/2 top-full mt-1 px-2 py-1 bg-slate-800 text-white text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
          Premium Member
        </div>
      </div>
    </div>
  );
}
