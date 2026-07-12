/** Shared PostHog config — supports legacy NEXT_PUBLIC_POSTHOG_KEY or docs-style PROJECT_TOKEN. */

export function getPostHogToken(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_POSTHOG_KEY ||
    process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  );
}

export function getPostHogHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.i.posthog.com";
}

/** Parse PostHog distinct_id from request cookies for server-side error linking. */
export function getPostHogDistinctIdFromCookie(
  cookieHeader: string | string[] | undefined
): string | null {
  if (!cookieHeader) return null;

  const cookieString = Array.isArray(cookieHeader)
    ? cookieHeader.join("; ")
    : cookieHeader;

  const match = cookieString.match(/ph_phc_.*?_posthog=([^;]+)/);
  if (!match?.[1]) return null;

  try {
    const data = JSON.parse(decodeURIComponent(match[1])) as {
      distinct_id?: string;
    };
    return data.distinct_id ?? null;
  } catch {
    return null;
  }
}
