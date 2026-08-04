/**
 * Clerk JS CDN version — must match lazy-loaded chunks (e.g. subscriptionDetails).
 * Without this, the main script loads from @5 while chunks load from @5.127.1 → ChunkLoadError.
 * Bump when upgrading @clerk/nextjs (see @clerk/shared versionSelector default).
 */
export const CLERK_JS_VERSION =
  process.env.NEXT_PUBLIC_CLERK_JS_VERSION || "5.127.1";

/** Host serving clerk-js for the current publishable key (dev vs prod). */
export function clerkPreconnectHost(): string {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "";
  if (key.startsWith("pk_test_") || key.startsWith("pk_live_")) {
    try {
      const encoded = key.replace(/^pk_(test|live)_/, "");
      const domain = Buffer.from(encoded, "base64").toString("utf8").replace(/\$$/, "");
      if (domain.includes("clerk")) return `https://${domain}`;
    } catch {
      /* fall through */
    }
  }
  return "https://clerk.accounts.dev";
}
