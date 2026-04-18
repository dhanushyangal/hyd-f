"use client";

import dynamic from "next/dynamic";

const RiggingApp = dynamic(() => import("@/components/rigging/RiggingApp"), {
  ssr: false,
  loading: () => (
    <div className="flex h-screen w-screen items-center justify-center bg-neutral-100">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-[3px] border-neutral-300 border-t-black rounded-full animate-spin" />
        <p className="text-sm font-medium text-neutral-500">Loading Rigging Tool…</p>
      </div>
    </div>
  ),
});

export default function RiggingPage() {
  return <RiggingApp />;
}
