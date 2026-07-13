"use client";

import Link from "next/link";
import { SignedIn, UserButton } from "@clerk/nextjs";

/**
 * Minimal navbar for /library — Hydrilla home + profile only.
 * No marketing links, generate CTA, or hamburger menu.
 */
export default function LibraryNavbar() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-neutral-200/80 bg-white/90 backdrop-blur-xl"
      data-site-navbar
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-lg font-bold tracking-[-0.03em] text-neutral-950 transition-opacity hover:opacity-70"
        >
          Hydrilla
        </Link>

        <SignedIn>
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "h-8 w-8 border-2 border-neutral-300 md:h-9 md:w-9",
              },
            }}
          />
        </SignedIn>
      </div>
    </header>
  );
}
