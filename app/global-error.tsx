"use client";

import posthog from "posthog-js";
import NextError from "next/error";
import { useEffect } from "react";
import { useServerActionSkewReload } from "@/lib/use-server-action-skew-reload";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isSkew = useServerActionSkewReload(error);

  useEffect(() => {
    if (isSkew) return;
    posthog.captureException(error, {
      digest: error.digest,
      source: "app-global-error",
    });
  }, [error, isSkew]);

  if (isSkew) {
    return (
      <html lang="en">
        <body>
          <p>Updating to the latest version…</p>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
