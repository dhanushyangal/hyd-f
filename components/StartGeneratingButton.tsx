"use client";

import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";

const buttonClassName =
  "inline-flex items-center justify-center bg-white/90 backdrop-blur-md border border-white/40 text-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-medium hover:bg-white hover:scale-[1.02] transition-all duration-200 shadow-md active:scale-[0.98]";

export default function StartGeneratingButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => {
        track("start_generating_clicked", { source: "hero" });
        router.push("/app");
      }}
      className={`${buttonClassName} font-dm-sans`}
    >
      Start Generating
    </button>
  );
}
