"use client";

import { useState } from "react";
import Link from "next/link";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

interface NavbarProps {
  variant?: "hero" | "default";
}

export default function Navbar({ variant = "hero" }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHero = variant === "hero";

  // Hero variant: white/transparent glass with white text
  // Default variant: gray glassmorphic with black text
  const containerClasses = isHero
    ? "bg-white/8 backdrop-blur-3xl border border-white/25"
    : "bg-gray-100/80 backdrop-blur-3xl border border-gray-200/50";
  
  const textColor = isHero ? "text-white" : "text-black";
  const logoClasses = `text-2xl font-bold ${textColor} tracking-tight`;
  
  const generateButtonClasses = isHero
    ? "px-4 py-2 rounded-lg bg-white/15 backdrop-blur-md border border-white/30 text-xs font-semibold text-white uppercase tracking-wider hover:bg-white/20 transition-all shadow-sm"
    : "px-4 py-2 rounded-lg bg-gray-200/60 backdrop-blur-md border border-gray-300/50 text-xs font-semibold text-black uppercase tracking-wider hover:bg-gray-300/60 transition-all shadow-sm";
  
  const signInButtonClasses = isHero
    ? "text-xs font-semibold text-white uppercase tracking-wider hover:text-white/80 transition-colors px-4 py-2"
    : "text-xs font-semibold text-black uppercase tracking-wider hover:text-black/70 transition-colors px-4 py-2";
  
  const signUpButtonClasses = isHero
    ? "px-5 py-2.5 text-xs font-semibold text-black uppercase tracking-wider bg-white/25 backdrop-blur-md border border-white/40 rounded-lg hover:bg-white/35 transition-all duration-300 flex items-center gap-1.5 shadow-lg hover:shadow-xl"
    : "px-5 py-2.5 text-xs font-semibold text-white uppercase tracking-wider bg-black backdrop-blur-md border border-black rounded-lg hover:bg-gray-900 transition-all duration-300 flex items-center gap-1.5 shadow-lg hover:shadow-xl";
  
  const userButtonBorder = isHero ? "border-white/40" : "border-gray-300";
  
  const mobileMenuClasses = isHero
    ? "md:hidden border-t border-white/20 bg-white/10 backdrop-blur-xl"
    : "md:hidden border-t border-gray-200 bg-gray-100/50 backdrop-blur-xl";
  
  const mobileMenuItemClasses = isHero
    ? "block px-4 py-2 rounded-lg bg-white/15 text-xs font-semibold text-white uppercase tracking-wider hover:bg-white/20 transition-all"
    : "block px-4 py-2 rounded-lg bg-gray-200/60 text-xs font-semibold text-black uppercase tracking-wider hover:bg-gray-300/60 transition-all";
  
  const mobileSignInClasses = isHero
    ? "w-full text-left text-xs font-semibold text-white uppercase tracking-wider hover:text-white/80 transition-colors"
    : "w-full text-left text-xs font-semibold text-black uppercase tracking-wider hover:text-black/70 transition-colors";
  
  const mobileSignUpClasses = isHero
    ? "w-full px-4 py-2 text-xs font-semibold text-white uppercase tracking-wider bg-white/25 backdrop-blur-md border border-white/40 rounded-lg hover:bg-white/35 transition-all"
    : "w-full px-4 py-2 text-xs font-semibold text-white uppercase tracking-wider bg-black backdrop-blur-md border border-black rounded-lg hover:bg-gray-900 transition-all";
  
  const mobileMenuDivider = isHero ? "border-white/20" : "border-gray-200";
  
  const hamburgerClasses = isHero
    ? "md:hidden p-1.5 hover:bg-white/10 rounded-lg transition-colors"
    : "md:hidden p-1.5 hover:bg-gray-200/60 rounded-lg transition-colors";
  
  const hamburgerIconClasses = isHero ? "w-5 h-5 text-white" : "w-5 h-5 text-black";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4">
      {/* Glassmorphic Navbar */}
      <div className={`${containerClasses} rounded-2xl shadow-2xl relative overflow-hidden min-w-[750px]`}>
        {/* Glass inner glow effects */}
        {isHero ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-white/15 via-transparent to-transparent pointer-events-none rounded-2xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-white/8 to-transparent pointer-events-none rounded-2xl" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200/20 via-transparent to-transparent pointer-events-none rounded-2xl" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-100/10 to-transparent pointer-events-none rounded-2xl" />
          </>
        )}
        
        <div className="flex items-center justify-between px-8 py-2.5 gap-10 relative z-10">
          {/* Logo - Left Side */}
          <Link href="/" className="flex items-center mr-12">
            <span 
              className={logoClasses}
              style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
            >
              Hydrilla
            </span>
          </Link>

          {/* Right Side - Generate Button, Auth Buttons / Profile */}
          <div className="flex items-center gap-4">
            <SignedIn>
              <Link
                href="/generate"
                className={`hidden md:flex ${generateButtonClasses}`}
                style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
              >
                Generate
              </Link>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: `w-9 h-9 border-2 ${userButtonBorder}`,
                  },
                }}
              />
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <button 
                  className={signInButtonClasses}
                  style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                >
                  Log In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button 
                  className={signUpButtonClasses}
                  style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                >
                  Get Started
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </SignUpButton>
            </SignedOut>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className={hamburgerClasses}
            >
              {mobileMenuOpen ? (
                <svg className={hamburgerIconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className={hamburgerIconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className={mobileMenuClasses}>
            <div className="px-5 py-3 space-y-2">
              <SignedIn>
                <Link
                  href="/generate"
                  className={mobileMenuItemClasses}
                  onClick={() => setMobileMenuOpen(false)}
                  style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                >
                  Generate
                </Link>
              </SignedIn>
              <SignedOut>
                <div className={`pt-2 space-y-2 border-t ${mobileMenuDivider}`}>
                  <SignInButton mode="modal">
                    <button 
                      className={mobileSignInClasses}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                    >
                      Log In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button 
                      className={mobileSignUpClasses}
                      onClick={() => setMobileMenuOpen(false)}
                      style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                    >
                      Get Started
                    </button>
                  </SignUpButton>
                </div>
              </SignedOut>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

