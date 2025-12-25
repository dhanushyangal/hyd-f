"use client";

import { useState } from "react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="border-b border-neutral-100 bg-white sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 lg:px-6 py-3">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-black flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-black">
            Hydrilla 3D
          </span>
        </a>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <SignedIn>
            <a
              href="/generate"
              className="text-sm font-medium text-neutral-600 hover:text-black transition-colors"
            >
              Generate
            </a>
            <a
              href="/library"
              className="text-sm font-medium text-neutral-600 hover:text-black transition-colors"
            >
              Library
            </a>
            <div className="h-4 w-px bg-neutral-200"></div>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          </SignedIn>

          <SignedOut>
            <SignInButton mode="modal">
              <button className="text-sm font-medium text-neutral-600 hover:text-black transition-colors">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="px-4 py-2 text-sm font-medium bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors">
                Get Started
              </button>
            </SignUpButton>
          </SignedOut>
        </nav>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-3">
          <SignedIn>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8",
                },
              }}
            />
          </SignedIn>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? (
              <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-100 bg-white">
          <div className="px-4 py-4 space-y-1">
            <SignedIn>
              <a
                href="/generate"
                className="block px-4 py-3 text-base font-medium text-black hover:bg-neutral-50 rounded-xl transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Generate
              </a>
              <a
                href="/library"
                className="block px-4 py-3 text-base font-medium text-black hover:bg-neutral-50 rounded-xl transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Library
              </a>
            </SignedIn>

            <SignedOut>
              <div className="pt-2 space-y-2">
                <SignInButton mode="modal">
                  <button 
                    className="w-full px-4 py-3 text-base font-medium text-black hover:bg-neutral-50 rounded-xl transition-colors text-left"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button 
                    className="w-full px-4 py-3 text-base font-medium bg-black text-white rounded-xl hover:bg-neutral-800 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Get Started
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
          </div>
        </div>
      )}
    </header>
  );
}

