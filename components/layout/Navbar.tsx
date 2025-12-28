"use client";

import { useState, useEffect, useRef } from "react";
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
  const menuRef = useRef<HTMLDivElement>(null);

  const isHero = variant === "hero";

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when menu is open on mobile
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Premium liquid glass effect for all pages
  const containerClasses = isHero
    ? "bg-white/70 backdrop-blur-2xl border border-white/40 shadow-2xl"
    : "bg-white/80 backdrop-blur-xl border border-gray-200/60 shadow-lg";
  
  const textColor = "text-black";
  const logoClasses = `text-2xl font-bold ${textColor} tracking-tight`;
  
  const generateButtonClasses = isHero
    ? "px-4 py-2 rounded-lg bg-gray-100 text-xs font-semibold text-black uppercase tracking-wider hover:bg-gray-200 transition-all shadow-sm"
    : "px-4 py-2 rounded-lg bg-gray-100 text-xs font-semibold text-black uppercase tracking-wider hover:bg-gray-200 transition-all";
  
  const signInButtonClasses = isHero
    ? "text-xs font-semibold text-black uppercase tracking-wider hover:text-black/70 transition-colors px-4 py-2"
    : "text-xs font-semibold text-black uppercase tracking-wider hover:text-black/70 transition-colors px-4 py-2";
  
  const signUpButtonClasses = isHero
    ? "px-5 py-2.5 text-xs font-semibold text-white uppercase tracking-wider bg-black backdrop-blur-md border border-black rounded-lg hover:bg-gray-900 transition-all duration-300 flex items-center gap-1.5 shadow-lg hover:shadow-xl"
    : "px-5 py-2.5 text-xs font-semibold text-white uppercase tracking-wider bg-black backdrop-blur-md border border-black rounded-lg hover:bg-gray-900 transition-all duration-300 flex items-center gap-1.5 shadow-lg hover:shadow-xl";
  
  const userButtonBorder = "border-gray-300";
  
  const mobileMenuClasses = isHero
    ? "md:hidden border-t border-gray-200 bg-white backdrop-blur-xl"
    : "md:hidden border-t border-gray-200 bg-white";
  
  const mobileMenuItemClasses = isHero
    ? "block px-4 py-2 rounded-lg bg-gray-50 text-xs font-semibold text-black uppercase tracking-wider hover:bg-gray-100 transition-all"
    : "block px-4 py-2 rounded-lg bg-gray-50 text-xs font-semibold text-black uppercase tracking-wider hover:bg-gray-100 transition-all";
  
  const mobileSignInClasses = isHero
    ? "w-full text-left text-xs font-semibold text-black uppercase tracking-wider hover:text-black/70 transition-colors"
    : "w-full text-left text-xs font-semibold text-black uppercase tracking-wider hover:text-black/70 transition-colors";
  
  const mobileSignUpClasses = isHero
    ? "w-full px-4 py-2 text-xs font-semibold text-white uppercase tracking-wider bg-black backdrop-blur-md border border-black rounded-lg hover:bg-gray-900 transition-all"
    : "w-full px-4 py-2 text-xs font-semibold text-white uppercase tracking-wider bg-black backdrop-blur-md border border-black rounded-lg hover:bg-gray-900 transition-all";
  
  const mobileMenuDivider = "border-gray-200";
  
  const hamburgerClasses = isHero
    ? "md:hidden p-1.5 hover:bg-gray-200/60 rounded-lg transition-colors"
    : "md:hidden p-1.5 hover:bg-gray-200/60 rounded-lg transition-colors";
  
  const hamburgerIconClasses = "w-5 h-5 text-black";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-2 md:pt-4 px-4 md:px-0">
      {/* Liquid Glass Navbar */}
      <div ref={menuRef} className={`${containerClasses} rounded-xl md:rounded-2xl relative overflow-hidden w-full max-w-7xl before:absolute before:inset-0 before:rounded-2xl before:bg-gradient-to-br before:from-white/50 before:via-transparent before:to-transparent before:pointer-events-none`}>
        {/* Liquid glass effects - multiple layers for depth */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
          {/* Base glass layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent" />
          {/* Top highlight */}
          <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-white/10" />
          {/* Side highlights for 3D effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20" />
          {/* Subtle shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/15" />
        </div>
        
        <div className="flex items-center justify-between px-4 md:px-8 py-2.5 gap-4 md:gap-10 relative z-10">
          {/* Logo - Left Side */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <span 
              className={`${logoClasses} font-dm-sans`}
            >
              Hydrilla
            </span>
          </Link>

          {/* Right Side - Generate Button, Auth Buttons / Profile */}
          <div className="flex items-center gap-2 md:gap-4">
            <SignedIn>
              <Link
                href="/generate"
                className={`hidden md:flex ${generateButtonClasses} font-dm-sans`}
              >
                Generate
              </Link>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: `w-8 h-8 md:w-9 md:h-9 border-2 ${userButtonBorder}`,
                  },
                }}
              />
            </SignedIn>

            <SignedOut>
              <div className="hidden md:flex items-center gap-2 md:gap-4">
                <SignInButton mode="modal">
                  <button 
                    className={`${signInButtonClasses} font-dm-sans`}
                  >
                    Log In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button 
                    className={`${signUpButtonClasses} font-dm-sans`}
                  >
                    Get Started
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </SignUpButton>
              </div>
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
                  className={`${mobileMenuItemClasses} font-dm-sans`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Generate
                </Link>
              </SignedIn>
              <SignedOut>
                <div className={`pt-2 space-y-2 border-t ${mobileMenuDivider}`}>
                  <SignInButton mode="modal">
                    <button 
                      className={`${mobileSignInClasses} font-dm-sans`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button 
                      className={`${mobileSignUpClasses} font-dm-sans`}
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
      </div>
    </header>
  );
}

