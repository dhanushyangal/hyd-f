"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

const DEMO_MEETING_URL = "https://cal.com/hydrilla";

export default function DemoMeetingPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/sign-in?redirect_url=" + encodeURIComponent("/app/demo-meeting"));
      return;
    }
    window.location.href = DEMO_MEETING_URL;
  }, [isLoaded, isSignedIn, router]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
        <p className="text-neutral-600 text-sm">Taking you to your demo meeting…</p>
      </div>
    </div>
  );
}
