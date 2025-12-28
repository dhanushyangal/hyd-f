"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";

interface NavbarProps {
  variant?: "hero" | "default";
  pathname?: string;
}

export default function Navbar({ variant = "hero", pathname = "/" }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isInSecondSection, setIsInSecondSection] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isHero = variant === "hero";

  // Check if team page, FAQ page, case study, or 3D & AI page (should use hero styling, same as team page)
  const isTeamPage = pathname === "/team";
  const isFAQPage = pathname === "/faq";
  const isCaseStudyPage = pathname === "/case-study";
  const isThreeDAIPage = pathname === "/3d-ai";
  const useHeroStyling = isHero || isTeamPage || isFAQPage || isCaseStudyPage || isThreeDAIPage;
  
  // For FAQ, case study, and 3D & AI pages, treat them the same as team page
  const isFAQPageInSecondSection = isFAQPage && isInSecondSection;
  const isCaseStudyPageInSecondSection = isCaseStudyPage && isInSecondSection;
  const isThreeDAIPageInSecondSection = isThreeDAIPage && isInSecondSection;

  // Scroll detection for hero variant and team page
  useEffect(() => {
    if (!useHeroStyling) return;

    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolled(scrollY > 50);
      
      // For team page, FAQ, case study, and 3D & AI pages, detect if we're in the second section
      if (isTeamPage || isFAQPage || isCaseStudyPage || isThreeDAIPage) {
        const heroSection = document.querySelector('section[class*="min-h-screen"]');
        if (heroSection) {
          const heroBottom = heroSection.getBoundingClientRect().bottom;
          // Check if we've scrolled past the hero section
          setIsInSecondSection(heroBottom <= 100);
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener("scroll", handleScroll);
  }, [useHeroStyling, isTeamPage, isFAQPage, isCaseStudyPage, isThreeDAIPage]);

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
  
  // Premium ultra-clear liquid glass effect for all pages
  const containerClasses = useHeroStyling
    ? "bg-white/2 backdrop-blur-[80px] border border-gray-200/20 shadow-2xl"
    : "bg-white/60 backdrop-blur-xl border border-gray-200/50 shadow-lg";
  
  // For team page, FAQ, case study, and 3D & AI pages, change text color to black when in second section
  const textColor = (useHeroStyling && !(isTeamPage && isInSecondSection) && !isFAQPageInSecondSection && !isCaseStudyPageInSecondSection && !isThreeDAIPageInSecondSection) ? "text-white" : "text-black";
  const logoClasses = `text-2xl font-bold ${textColor} tracking-tight transition-colors duration-500`;
  
  // Adjust button classes based on section for team page, FAQ, case study, and 3D & AI pages
  const isTeamPageInSecondSection = isTeamPage && isInSecondSection;
  const shouldUseWhiteButtons = (useHeroStyling && !isTeamPageInSecondSection && !isFAQPageInSecondSection && !isCaseStudyPageInSecondSection && !isThreeDAIPageInSecondSection);
  const generateButtonClasses = shouldUseWhiteButtons
    ? "px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-xs font-semibold text-white uppercase tracking-wider hover:bg-white/30 transition-all duration-500 ease-out shadow-sm"
    : "px-4 py-2 rounded-lg bg-gray-100 text-xs font-semibold text-black uppercase tracking-wider hover:bg-gray-200 transition-all duration-500 ease-out";
  
  const signInButtonClasses = shouldUseWhiteButtons
    ? "text-xs font-semibold text-white uppercase tracking-wider px-4 py-2 rounded-lg backdrop-blur-sm border border-transparent hover:border-white/20 hover:bg-white/10 transition-all duration-700 ease-in-out"
    : "text-xs font-semibold text-black uppercase tracking-wider hover:text-black/70 transition-colors duration-500 px-4 py-2";
  
  const signUpButtonClasses = shouldUseWhiteButtons
    ? "px-5 py-2.5 text-xs font-semibold text-black uppercase tracking-wider bg-white/90 backdrop-blur-md border border-white/40 rounded-lg hover:bg-white hover:scale-105 hover:shadow-2xl transition-all duration-700 ease-in-out flex items-center gap-1.5 shadow-lg"
    : "px-5 py-2.5 text-xs font-semibold text-white uppercase tracking-wider bg-black backdrop-blur-md border border-black rounded-lg hover:bg-gray-900 hover:scale-105 transition-all duration-700 ease-in-out flex items-center gap-1.5 shadow-lg hover:shadow-xl";
  
  const userButtonBorder = shouldUseWhiteButtons ? "border-white/40" : "border-gray-300";
  
  // Mobile menu classes - same as team page (white background when in second section, glass when in hero)
  const mobileMenuClasses = (useHeroStyling && !isTeamPageInSecondSection && !isFAQPageInSecondSection && !isCaseStudyPageInSecondSection && !isThreeDAIPageInSecondSection)
    ? "md:hidden border-t border-white/20 bg-white/10 backdrop-blur-xl"
    : "md:hidden border-t border-gray-200 bg-white shadow-lg";
  
  const mobileMenuItemClasses = (useHeroStyling && !isTeamPageInSecondSection && !isFAQPageInSecondSection && !isCaseStudyPageInSecondSection && !isThreeDAIPageInSecondSection)
    ? "block px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-xs font-semibold text-white uppercase tracking-wider hover:bg-white/30 transition-all"
    : "block px-4 py-3 rounded-lg bg-gray-50/80 text-sm font-medium text-black uppercase tracking-wider hover:bg-gray-100 transition-all";
  
  const mobileSignInClasses = (useHeroStyling && !isTeamPageInSecondSection && !isFAQPageInSecondSection && !isCaseStudyPageInSecondSection && !isThreeDAIPageInSecondSection)
    ? "w-full text-left text-xs font-semibold text-white uppercase tracking-wider hover:text-white/80 transition-colors"
    : "w-full text-left text-xs font-semibold text-black uppercase tracking-wider hover:text-black/70 transition-colors";
  
  const mobileSignUpClasses = (useHeroStyling && !isTeamPageInSecondSection && !isFAQPageInSecondSection && !isCaseStudyPageInSecondSection && !isThreeDAIPageInSecondSection)
    ? "w-full px-4 py-2 text-xs font-semibold text-black uppercase tracking-wider bg-white/90 backdrop-blur-md border border-white/40 rounded-lg hover:bg-white transition-all"
    : "w-full px-4 py-2 text-xs font-semibold text-white uppercase tracking-wider bg-black backdrop-blur-md border border-black rounded-lg hover:bg-gray-900 transition-all";
  
  const mobileMenuDivider = (useHeroStyling && !isTeamPageInSecondSection && !isFAQPageInSecondSection && !isCaseStudyPageInSecondSection && !isThreeDAIPageInSecondSection) ? "border-white/20" : "border-gray-200";
  
  const hamburgerClasses = isHero
    ? "md:hidden p-1.5 hover:bg-white/20 rounded-lg transition-colors"
    : "md:hidden p-1.5 hover:bg-gray-200/60 rounded-lg transition-colors";
  
  const hamburgerIconClasses = shouldUseWhiteButtons ? "w-5 h-5 text-white" : "w-5 h-5 text-black";

  // Dynamic classes based on scroll state for hero variant, team page, FAQ, case study, and 3D & AI pages
  const shouldShrink = (isHero || pathname === "/team" || pathname === "/faq" || pathname === "/case-study" || pathname === "/3d-ai") && isScrolled;
  const dynamicContainerClasses = shouldShrink
    ? "bg-white/5 backdrop-blur-[60px] border border-gray-200/15 shadow-xl max-w-2xl transition-all duration-500 ease-out"
    : containerClasses;

  const dynamicPadding = shouldShrink
    ? "px-4 md:px-6 py-2"
    : "px-4 md:px-8 py-2.5";

  const dynamicRounded = shouldShrink
    ? "rounded-full"
    : "rounded-xl md:rounded-2xl";

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-2 md:pt-4 px-4 md:px-0">
      {/* Ultra-Clear Liquid Glass Navbar */}
      <div ref={menuRef} className={`${dynamicContainerClasses} ${dynamicRounded} relative overflow-visible w-full ${shouldShrink ? 'max-w-2xl' : 'max-w-7xl'} before:absolute before:inset-0 ${shouldShrink ? 'before:rounded-full' : 'before:rounded-2xl'} before:bg-gradient-to-br ${useHeroStyling ? 'before:from-white/20 before:via-white/5 before:to-transparent' : 'before:from-white/50 before:via-transparent before:to-transparent'} before:pointer-events-none transition-all duration-500 ease-out`}>
        {/* Ultra-clear liquid glass effects - minimal layers for maximum clarity */}
        <div className={`absolute inset-0 pointer-events-none ${shouldShrink ? 'rounded-full' : 'rounded-2xl'} overflow-hidden`}>
          {useHeroStyling ? (
            <>
              {/* Minimal base layer for ultra clarity */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
              {/* Subtle top highlight */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/15 via-transparent to-white/3" />
              {/* Minimal side highlights */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/8 via-transparent to-white/8" />
              {/* Very subtle shimmer */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/3 to-white/5" />
            </>
          ) : (
            <>
              {/* Base glass layer */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent" />
              {/* Top highlight */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-white/10" />
              {/* Side highlights for 3D effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20" />
              {/* Subtle shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/15" />
            </>
          )}
        </div>
        
        <div className={`flex items-center justify-between ${dynamicPadding} gap-4 md:gap-10 relative z-10 transition-all duration-500 ease-out`}>
          {/* Logo and Brand Name - Left Side */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {(isHero || pathname === "/team" || pathname === "/faq" || pathname === "/case-study" || pathname === "/3d-ai") && (
              <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                <Image
                  src="/hyd01.png"
                  alt="Hydrilla Logo"
                  fill
                  className="object-contain"
                />
              </div>
            )}
            <span 
              className={`${logoClasses} ${shouldShrink ? 'text-lg sm:text-xl' : ''} font-dm-sans transition-all duration-500 ease-out`}
            >
              Hydrilla
            </span>
          </Link>

          {/* Navigation Links - Show on Landing Page, Team Page, FAQ Page, Case Study, 3D & AI, and Signed-In Page */}
          {(pathname === "/" || pathname === "/team" || pathname === "/faq" || pathname === "/case-study" || pathname === "/3d-ai") && !shouldShrink && (
            <nav className="hidden lg:flex items-center gap-6 md:gap-8">
              <Link 
                href="/team"
                className={`text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors font-dm-sans ${textColor} hover:opacity-80`}
              >
                Our Team
              </Link>
              <Link 
                href="/case-study"
                className={`text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors font-dm-sans ${textColor} hover:opacity-80`}
              >
                Case Study
              </Link>
              <Link 
                href="/faq"
                className={`text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors font-dm-sans ${textColor} hover:opacity-80`}
              >
                FAQ
              </Link>
              <Link 
                href="/3d-ai"
                className={`text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors font-dm-sans ${textColor} hover:opacity-80`}
              >
                3D & AI
              </Link>
            </nav>
          )}

          {/* Right Side - Generate Button, Auth Buttons / Profile */}
          <div className="flex items-center gap-2 md:gap-4">
            <SignedIn>
              {!shouldShrink && (
                <Link
                  href="/generate"
                  className={`hidden md:flex ${generateButtonClasses} font-dm-sans`}
                >
                  Generate
                </Link>
              )}
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
              {shouldShrink ? (
                // Show only Get Started button when scrolled
                <div className="hidden md:flex items-center">
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
              ) : (
                // Show both buttons when not scrolled
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
              )}
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
          <div className={`${mobileMenuClasses} absolute top-full left-0 right-0 w-full mt-2 rounded-lg`}>
            <div className="px-4 sm:px-6 py-4 space-y-2">
              {/* Navigation Links - Show on Landing Page, Team Page, FAQ Page, Case Study, 3D & AI, and Signed-In Page */}
              {(pathname === "/" || pathname === "/team" || pathname === "/faq" || pathname === "/case-study" || pathname === "/3d-ai") && (
                <div className={`space-y-2 pb-3 border-b ${mobileMenuDivider}`}>
                  <Link
                    href="/team"
                    className={`${mobileMenuItemClasses} font-dm-sans w-full text-left`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Our Team
                  </Link>
                  <Link
                    href="/case-study"
                    className={`${mobileMenuItemClasses} font-dm-sans w-full text-left`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Case Study
                  </Link>
                  <Link
                    href="/faq"
                    className={`${mobileMenuItemClasses} font-dm-sans w-full text-left`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    FAQ
                  </Link>
                  <Link
                    href="/3d-ai"
                    className={`${mobileMenuItemClasses} font-dm-sans w-full text-left`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    3D & AI
                  </Link>
                </div>
              )}
              
              <SignedIn>
                <Link
                  href="/generate"
                  className={`${mobileMenuItemClasses} font-dm-sans w-full text-left`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Generate
                </Link>
              </SignedIn>
              <SignedOut>
                <div className={`pt-3 space-y-2 border-t ${mobileMenuDivider}`}>
                  <SignInButton mode="modal">
                    <button 
                      className={`${mobileSignInClasses} font-dm-sans w-full text-left`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Log In
                    </button>
                  </SignInButton>
                  <SignUpButton mode="modal">
                    <button 
                      className={`${mobileSignUpClasses} font-dm-sans w-full`}
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

