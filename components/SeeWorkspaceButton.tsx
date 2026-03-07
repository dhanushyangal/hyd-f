"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";

export default function SeeWorkspaceButton() {
  return (
    <>
      <SignedIn>
        <Link
          href="/app/studio"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#111] text-white text-sm font-semibold hover:bg-neutral-800 transition-colors"
          style={{ fontFamily: "var(--font-dm-sans), DM Sans, sans-serif" }}
        >
          See Workspace
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </SignedIn>
      <SignedOut>
        <SignInButton mode="modal" forceRedirectUrl="/app/studio">
          <button
            type="button"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#111] text-white text-sm font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
            style={{ fontFamily: "var(--font-dm-sans), DM Sans, sans-serif" }}
          >
            See Workspace
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </SignInButton>
      </SignedOut>
    </>
  );
}
