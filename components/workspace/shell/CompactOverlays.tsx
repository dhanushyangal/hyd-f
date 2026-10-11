"use client";

export function CompactGeneratedToast() {
  return (
    <div
      className="lg:hidden fixed left-0 right-0 top-[calc(3.25rem+env(safe-area-inset-top,0px))] z-30 flex justify-center px-3 py-2 pointer-events-none"
      role="status"
    >
      <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-950 text-white text-xs font-medium shadow-lg">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
        Generated
      </span>
    </div>
  );
}
