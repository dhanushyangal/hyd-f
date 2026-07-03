import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

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

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    // Always send expired/missing sessions to /sign-in (not marketing home).
    await auth.protect({
      unauthenticatedUrl: new URL("/sign-in", req.url).toString(),
    });
  }
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
