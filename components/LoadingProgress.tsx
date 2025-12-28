"use client";

interface LoadingProgressProps {
  progress: number;
  message?: string;
}

export function LoadingProgress({ progress, message = "Loading..." }: LoadingProgressProps) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-inline-styles */}
        <div 
          className="h-full bg-black rounded-full transition-all duration-300"
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        ></div>
      </div>
      {message && (
        <p className="text-sm text-neutral-600">{message}</p>
      )}
    </div>
  );
}
