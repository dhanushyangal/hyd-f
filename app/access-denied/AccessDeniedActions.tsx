"use client";

import { SignOutButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

export function AccessDeniedActions() {
  return (
    <>
      <SignedIn>
        <SignOutButton>
          <button className="w-full rounded-lg bg-black text-white py-2.5 px-4 text-sm font-medium hover:bg-gray-900 transition-colors">
            Sign out
          </button>
        </SignOutButton>
      </SignedIn>

      <SignedOut>
        <Link
          href="/"
          className="inline-block w-full rounded-lg bg-black text-white py-2.5 px-4 text-sm font-medium hover:bg-gray-900 transition-colors"
        >
          Back to home
        </Link>
      </SignedOut>
    </>
  );
}
