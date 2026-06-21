import { getPostHogDistinctIdFromCookie } from "./lib/posthog";
import { getPostHogServer } from "./lib/posthog-server";

export async function register() {
  // Required hook for Next.js instrumentation — no-op.
}

export async function onRequestError(
  err: Error & { digest?: string },
  request: { headers: { cookie?: string | string[] } }
) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const posthog = getPostHogServer();
  if (!posthog) return;

  const distinctId = getPostHogDistinctIdFromCookie(request.headers.cookie);

  await posthog.captureExceptionImmediate(err, distinctId ?? undefined, {
    digest: err.digest,
    source: "nextjs-onRequestError",
  });
}
