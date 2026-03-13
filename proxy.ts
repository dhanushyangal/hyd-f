import { clerkMiddleware } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";

// Next.js proxy uses the same signature as middleware: (request, event)
export function proxy(request: NextRequest, event: unknown) {
  const handler = clerkMiddleware();
  return (handler as (req: NextRequest, evt: unknown) => ReturnType<typeof handler>)(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
