"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { useServerActionSkewReload } from "@/lib/use-server-action-skew-reload";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isSkew = useServerActionSkewReload(error);

  useEffect(() => {
    if (isSkew) return;
    posthog.captureException(error, {
      digest: error.digest,
      source: "app-error-boundary",
    });
  }, [error, isSkew]);

  if (isSkew) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-neutral-50">
        <p className="text-sm text-gray-600">Updating to the latest version…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-neutral-50">
      <div className="w-full max-w-md text-center rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-6">
          An unexpected error occurred. Our team has been notified.
        </p>
        <button
          type="button"
          onClick={reset}
          className="w-full rounded-lg bg-black text-white py-2.5 px-4 text-sm font-medium hover:bg-gray-900 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
