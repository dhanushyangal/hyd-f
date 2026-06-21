export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { initPostHogLogs } = await import("./lib/posthog-logs");
    initPostHogLogs();
  }
}

export async function onRequestError(
  err: Error & { digest?: string },
  request: { headers: { cookie?: string | string[] } }
) {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { getPostHogDistinctIdFromCookie } = await import("./lib/posthog");
  const { getPostHogServer } = await import("./lib/posthog-server");
  const {
    getPostHogLogger,
    flushPostHogLogs,
    SeverityNumber,
  } = await import("./lib/posthog-logs");

  const posthog = getPostHogServer();
  const distinctId = getPostHogDistinctIdFromCookie(request.headers.cookie);

  if (posthog) {
    await posthog.captureExceptionImmediate(err, distinctId ?? undefined, {
      digest: err.digest,
      source: "nextjs-onRequestError",
    });
  }

  const logger = getPostHogLogger();
  logger?.emit({
    body: err.message,
    severityNumber: SeverityNumber.ERROR,
    attributes: {
      digest: err.digest,
      source: "nextjs-onRequestError",
      stack: err.stack,
    },
  });
  await flushPostHogLogs();
}
