import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require an authenticated user. Unauthenticated visitors hitting
// these will be redirected to the sign-in page by Clerk.
const isProtectedRoute = createRouteMatcher([
  "/app(.*)",
  "/workspace(.*)",
  "/generate(.*)",
  "/generations(.*)",
  "/library(.*)",
  "/checkout(.*)",
  "/rigging(.*)",
  "/admin(.*)",
]);

/** Valid Next.js Server Action IDs are ~40+ hex chars; short values are scanners. */
function isMalformedNextActionHeader(req: NextRequest): boolean {
  if (req.method !== "POST") return false;
  const nextAction = req.headers.get("next-action");
  if (!nextAction) return false;
  return nextAction.length < 40;
}

function withSkewProtectionCookie(
  req: NextRequest,
  response: NextResponse
): NextResponse {
  // Pin long-lived sessions (workspace tabs) to the deployment that served them
  // so Clerk/Next Server Actions keep resolving after a production rollout.
  // Requires Skew Protection enabled in the Vercel project settings.
  // https://vercel.com/docs/skew-protection#extending-skew-protection-for-long-lived-sessions
  const deploymentId = process.env.VERCEL_DEPLOYMENT_ID;
  if (!deploymentId || req.cookies.get("__vdpl")) return response;

  response.cookies.set("__vdpl", deploymentId, {
    path: "/",
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

export default clerkMiddleware(async (auth, req) => {
  if (isMalformedNextActionHeader(req)) {
    return new NextResponse(null, { status: 404 });
  }

  if (isProtectedRoute(req)) {
    // Always send expired/missing sessions to /sign-in (not marketing home).
    await auth.protect({
      unauthenticatedUrl: new URL("/sign-in", req.url).toString(),
    });
  }

  return withSkewProtectionCookie(req, NextResponse.next());
});

export const config = {
  matcher: [
    // Run on every route except Next.js internals and static asset files.
    // This is required so that pages that call `auth()` (e.g. `/`) are
    // covered by clerkMiddleware.
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
