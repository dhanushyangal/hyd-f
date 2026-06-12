"use client";

import { SignOutButton, SignedIn, SignedOut } from "@clerk/nextjs";
import Link from "next/link";

const adminEmail =
  process.env.NEXT_PUBLIC_ADMIN_CONTACT_EMAIL || "admin@hydrilla.co";

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-neutral-50">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-gray-900 mb-3">
            Access not granted
          </h1>
          <p className="text-gray-600 mb-2">
            You don&apos;t have access to Hydrilla yet.
          </p>
          <p className="text-gray-600 mb-6">
            Please contact the website admin at{" "}
            <a
              href={`mailto:${adminEmail}`}
              className="text-black font-medium underline hover:text-gray-700"
            >
              {adminEmail}
            </a>{" "}
            to request access.
          </p>

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
        </div>
      </div>
    </div>
  );
}
