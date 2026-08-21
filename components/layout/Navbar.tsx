"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from "@clerk/nextjs";
import { AnimatePresence, motion } from "motion/react";

import { NAV_PRIMARY } from "@/lib/nav";

const MENU_EASE = [0.22, 1, 0.36, 1] as const;
const BAR_EASE = "duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

function parseCssColor(
  color: string
): { r: number; g: number; b: number; a: number } | null {
  if (!color || color === "transparent") return null;

  const comma = color.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i
  );
  if (comma) {
    return {
      r: Number(comma[1]),
      g: Number(comma[2]),
      b: Number(comma[3]),
      a: comma[4] === undefined ? 1 : Number(comma[4]),
    };
  }

  const space = color.match(
    /^rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\s*\)$/i
  );
  if (space) {
    const rawA = space[4];
    const a =
      rawA == null
        ? 1
        : rawA.endsWith("%")
          ? Number.parseFloat(rawA) / 100
          : Number(rawA);
    return { r: Number(space[1]), g: Number(space[2]), b: Number(space[3]), a };
  }

  return null;
}

function relativeLuminance(r: number, g: number, b: number) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

function sampleMediaLuminance(
  el: HTMLImageElement | HTMLVideoElement,
  x: number,
  y: number
): number | null {
  const rect = el.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return null;

  const sourceW =
    el instanceof HTMLVideoElement ? el.videoWidth : el.naturalWidth;
  const sourceH =
    el instanceof HTMLVideoElement ? el.videoHeight : el.naturalHeight;
  if (!sourceW || !sourceH) return null;

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;

  const sx = ((x - rect.left) / rect.width) * sourceW;
  const sy = ((y - rect.top) / rect.height) * sourceH;

  try {
    ctx.drawImage(el, sx, sy, 1, 1, 0, 0, 1, 1);
    const data = ctx.getImageData(0, 0, 1, 1).data;
    return relativeLuminance(data[0], data[1], data[2]);
  } catch {
    return null;
  }
}

function luminanceAtPoint(x: number, y: number): number | null {
  const stack = document.elementsFromPoint(x, y);
  for (const el of stack) {
    if (!(el instanceof HTMLElement)) continue;
    if (el.closest("[data-site-navbar]")) continue;

    if (el instanceof HTMLImageElement || el instanceof HTMLVideoElement) {
      const sampled = sampleMediaLuminance(el, x, y);
      if (sampled != null) return sampled;
      continue;
    }

    const style = getComputedStyle(el);
    const parsed = parseCssColor(style.backgroundColor);
    if (parsed && parsed.a >= 0.45) {
      return relativeLuminance(parsed.r, parsed.g, parsed.b);
    }
  }
  return null;
}

/** True when the page behind the bar is dark enough that navbar copy should be white. */
function isDarkBehindNavbar(): boolean {
  const header = document.querySelector("[data-site-navbar]");
  const rect = header?.getBoundingClientRect();
  const y = rect ? Math.max(8, Math.min(rect.top + rect.height * 0.55, 56)) : 28;
  const xs = [
    window.innerWidth * 0.22,
    window.innerWidth * 0.5,
    window.innerWidth * 0.78,
  ];

  let darkVotes = 0;
  let samples = 0;
  for (const x of xs) {
    const lum = luminanceAtPoint(x, y);
    if (lum == null) continue;
    samples += 1;
    if (lum < 0.55) darkVotes += 1;
  }

  if (samples === 0) return false;
  return darkVotes * 2 >= samples;
}

interface NavbarProps {
  variant?: "hero" | "default";
  pathname?: string;
}

export default function Navbar({ variant = "hero", pathname = "/" }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [onDark, setOnDark] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isHero = variant === "hero";
  const useHeroStyling = isHero;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduceMotion(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useLayoutEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      setIsScrolled(window.scrollY > 50);
      setOnDark(isDarkBehindNavbar());
    };
    const onScrollOrResize = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        update();
      });
    };

    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("load", update);
    update();
    const retry = window.setTimeout(() => setOnDark(isDarkBehindNavbar()), 250);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("load", update);
      window.clearTimeout(retry);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [pathname]);

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

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen]);

  const containerClasses = useHeroStyling
    ? "bg-white/2 backdrop-blur-[80px] border border-gray-200/20 shadow-2xl"
    : "bg-white/60 backdrop-blur-xl border border-gray-200/50 shadow-lg";

  const textColor = onDark ? "text-white" : "text-black";
  const logoClasses = `font-bold ${textColor} tracking-tight transition-colors duration-500`;

  const generateButtonClasses = onDark
    ? "px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-xs font-semibold text-white uppercase tracking-wider hover:bg-white/30 transition-all duration-500 ease-out shadow-sm"
    : "px-4 py-2 rounded-lg bg-gray-100 text-xs font-semibold text-black uppercase tracking-wider hover:bg-gray-200 transition-all duration-500 ease-out";

  const signInButtonClasses = onDark
    ? "text-xs font-semibold text-white uppercase tracking-wider px-4 py-2 rounded-lg backdrop-blur-sm border border-transparent hover:border-white/20 hover:bg-white/10 transition-all duration-700 ease-in-out"
    : "text-xs font-semibold text-black uppercase tracking-wider hover:text-black/70 transition-colors duration-500 px-4 py-2";

  const signUpButtonClasses = onDark
    ? "px-5 py-2.5 text-xs font-semibold text-black uppercase tracking-wider bg-white/90 backdrop-blur-md border border-white/40 rounded-lg hover:bg-white hover:scale-105 hover:shadow-2xl transition-all duration-700 ease-in-out flex items-center gap-1.5 shadow-lg"
    : "px-5 py-2.5 text-xs font-semibold text-white uppercase tracking-wider bg-black backdrop-blur-md border border-black rounded-lg hover:bg-gray-900 hover:scale-105 transition-all duration-700 ease-in-out flex items-center gap-1.5 shadow-lg hover:shadow-xl";

  const userButtonBorder = onDark ? "border-white/40" : "border-gray-300";

  const hamburgerClasses = onDark
    ? "lg:hidden relative z-20 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/15"
    : "lg:hidden relative z-20 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/6";

  const barColor = onDark ? "bg-white" : "bg-black";

  const shouldShrink = isHero && isScrolled;
  const chromeSurface = useHeroStyling
    ? `${shouldShrink ? "bg-white/5" : "bg-white/2"} backdrop-blur-[80px] border border-gray-200/20 shadow-2xl`
    : containerClasses;
  const dynamicPadding = shouldShrink
    ? "px-4 md:px-6 py-2"
    : "px-4 md:px-8 py-2.5";
  const dynamicRounded = shouldShrink
    ? "rounded-full"
    : "rounded-xl md:rounded-2xl";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-2 md:pt-4 px-4 md:px-0"
      data-site-navbar
    >
      <div
        ref={menuRef}
        className={`relative mx-auto w-full overflow-visible transition-[max-width] ${BAR_EASE} ${
          shouldShrink ? "max-w-2xl" : "max-w-7xl"
        }`}
      >
        <div
          className={`${chromeSurface} ${dynamicRounded} relative isolate w-full overflow-hidden transition-[border-radius,background-color,box-shadow] ${BAR_EASE} before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-br ${
            useHeroStyling
              ? "before:from-white/20 before:via-white/5 before:to-transparent"
              : "before:from-white/50 before:via-transparent before:to-transparent"
          }`}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            {useHeroStyling ? (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/5 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-white/15 via-transparent to-white/3" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/8 via-transparent to-white/8" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/3 to-white/5" />
              </>
            ) : (
              <>
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-white/30 via-transparent to-white/10" />
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20" />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-white/15" />
              </>
            )}
          </div>

          <div
            className={`relative z-10 flex items-center justify-between gap-3 md:gap-6 ${dynamicPadding} transition-[padding] ${BAR_EASE}`}
          >
          <Link href="/" className="relative z-10 flex shrink-0 items-center gap-2 sm:gap-3 group">
            <div className="relative w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 logo-spin-hover">
              <Image
                src="/hyd01.png"
                alt="Hydrilla Logo"
                fill
                className="object-contain"
                sizes="(max-width: 640px) 32px, 40px"
                priority
              />
            </div>
            <span 
              className={`${logoClasses} text-xl sm:text-2xl font-dm-sans`}
            >
              Hydrilla
            </span>
          </Link>

          <nav
            className={`pointer-events-none absolute inset-0 hidden items-center justify-center lg:flex transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
              shouldShrink ? "opacity-0" : "opacity-100"
            }`}
            aria-hidden={shouldShrink}
          >
            <div
              className={`flex items-center gap-6 md:gap-8 ${
                shouldShrink ? "pointer-events-none" : "pointer-events-auto"
              }`}
            >
              {NAV_PRIMARY.map((item) =>
                item.children ? (
                  <div key={item.label} className="group relative">
                    <Link
                      href={item.href}
                      tabIndex={shouldShrink ? -1 : 0}
                      className={`text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors font-dm-sans ${textColor} hover:opacity-80`}
                    >
                      {item.label}
                    </Link>
                    <div className="invisible absolute left-1/2 top-full z-50 pt-3 opacity-0 transition-[opacity,visibility] duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                      <div className="-translate-x-1/2 min-w-[18rem] rounded-2xl border border-black/8 bg-white/95 p-2 shadow-[0_24px_60px_-28px_rgba(0,0,0,0.35)] backdrop-blur-xl">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            tabIndex={shouldShrink ? -1 : 0}
                            className="block rounded-xl px-3 py-2.5 hover:bg-black/[0.04]"
                          >
                            <span className="block text-[13px] font-semibold tracking-[-0.02em] text-neutral-950">
                              {child.label}
                            </span>
                            {child.description ? (
                              <span className="mt-0.5 block text-[12px] leading-4 text-neutral-500">
                                {child.description}
                              </span>
                            ) : null}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    tabIndex={shouldShrink ? -1 : 0}
                    className={`text-xs sm:text-sm font-semibold uppercase tracking-wider transition-colors font-dm-sans ${textColor} hover:opacity-80`}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </div>
          </nav>

          <div className="relative z-10 flex items-center gap-2 md:gap-4">
            <SignedIn>
              <Link
                href="/generate"
                className={`hidden md:flex ${generateButtonClasses} font-dm-sans overflow-hidden transition-[max-width,opacity,padding,margin] ${BAR_EASE} ${
                  shouldShrink
                    ? "pointer-events-none max-w-0 opacity-0 px-0 mr-0 border-0"
                    : "max-w-[9rem] opacity-100"
                }`}
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
                <div
                  className={`overflow-hidden transition-[max-width,opacity] ${BAR_EASE} ${
                    shouldShrink
                      ? "pointer-events-none max-w-0 opacity-0"
                      : "max-w-[7rem] opacity-100"
                  }`}
                >
                  <SignInButton mode="modal">
                    <button
                      type="button"
                      tabIndex={shouldShrink ? -1 : 0}
                      className={`${signInButtonClasses} font-dm-sans whitespace-nowrap`}
                    >
                      Log In
                    </button>
                  </SignInButton>
                </div>
                <SignUpButton mode="modal">
                  <button
                    type="button"
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
              type="button"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              className={hamburgerClasses}
            >
              <span className="relative block h-4 w-[18px]">
                <motion.span
                  className={`absolute left-0 h-px w-full ${barColor}`}
                  initial={false}
                  animate={
                    mobileMenuOpen
                      ? { top: 8, rotate: 45 }
                      : { top: 2, rotate: 0 }
                  }
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.28, ease: MENU_EASE }
                  }
                />
                <motion.span
                  className={`absolute left-0 top-2 h-px w-full ${barColor}`}
                  initial={false}
                  animate={{ opacity: mobileMenuOpen ? 0 : 1 }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.16, ease: MENU_EASE }
                  }
                />
                <motion.span
                  className={`absolute left-0 h-px w-full ${barColor}`}
                  initial={false}
                  animate={
                    mobileMenuOpen
                      ? { top: 8, rotate: -45 }
                      : { top: 14, rotate: 0 }
                  }
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { duration: 0.28, ease: MENU_EASE }
                  }
                />
              </span>
            </button>
          </div>
        </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              role="navigation"
              aria-label="Mobile"
              initial={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -10, scale: 0.98, filter: "blur(10px)" }
              }
              animate={
                reduceMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
              }
              exit={
                reduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -8, scale: 0.985, filter: "blur(8px)" }
              }
              transition={{ duration: reduceMotion ? 0.12 : 0.32, ease: MENU_EASE }}
              className={`lg:hidden absolute top-full left-0 right-0 mt-2 overflow-hidden rounded-[22px] border ${
                onDark
                  ? "border-white/12 bg-black/55 text-white shadow-[0_28px_80px_-24px_rgba(0,0,0,0.65)]"
                  : "border-black/8 bg-white/92 text-neutral-950 shadow-[0_28px_80px_-28px_rgba(0,0,0,0.28)]"
              } backdrop-blur-2xl`}
              style={{ transformOrigin: "top center" }}
            >
              <div
                aria-hidden
                className={`pointer-events-none absolute inset-x-8 top-0 h-px ${
                  onDark
                    ? "bg-gradient-to-r from-transparent via-white/35 to-transparent"
                    : "bg-gradient-to-r from-transparent via-black/15 to-transparent"
                }`}
              />

              <nav className="px-3 pt-3 pb-2" style={{ perspective: 900 }}>
                {NAV_PRIMARY.flatMap((item) =>
                  item.children?.length ? item.children : [item]
                ).map((link, index) => (
                  <motion.div
                    key={link.href}
                    initial={
                      reduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, y: 12, rotateX: 16 }
                    }
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.3,
                      ease: MENU_EASE,
                      delay: reduceMotion ? 0 : 0.045 + index * 0.034,
                    }}
                    style={{ transformOrigin: "top center" }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`group flex items-center justify-between rounded-[14px] px-3.5 py-3 text-[15px] font-medium tracking-[-0.022em] transition-colors ${
                        onDark
                          ? "text-white/90 hover:bg-white/8 hover:text-white"
                          : "text-neutral-900 hover:bg-black/[0.04]"
                      }`}
                      style={{
                        fontFamily:
                          "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif",
                      }}
                    >
                      {link.label}
                      <span
                        className={`text-[11px] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5 ${
                          onDark ? "text-white/30" : "text-black/25"
                        }`}
                      >
                        →
                      </span>
                    </Link>
                  </motion.div>
                ))}
              </nav>

              <div className={`mx-5 h-px ${onDark ? "bg-white/10" : "bg-black/8"}`} />

              <div className="px-3 py-3">
                <SignedIn>
                  <Link
                    href="/generate"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-center rounded-full px-4 py-3 text-[14px] font-semibold tracking-[-0.02em] transition-transform duration-300 active:scale-[0.98] ${
                      onDark
                        ? "bg-white text-black"
                        : "bg-neutral-950 text-white"
                    }`}
                  >
                    Generate
                  </Link>
                </SignedIn>
                <SignedOut>
                  <div className="flex flex-col gap-1.5">
                    <SignInButton mode="modal">
                      <button
                        type="button"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`rounded-full px-4 py-2.5 text-[14px] font-medium tracking-[-0.02em] transition-colors ${
                          onDark
                            ? "text-white/80 hover:bg-white/8 hover:text-white"
                            : "text-neutral-600 hover:bg-black/[0.04] hover:text-neutral-950"
                        }`}
                      >
                        Log in
                      </button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                      <button
                        type="button"
                        onClick={() => setMobileMenuOpen(false)}
                        className={`rounded-full px-4 py-3 text-[14px] font-semibold tracking-[-0.02em] transition-transform duration-300 active:scale-[0.98] ${
                          onDark
                            ? "bg-white text-black"
                            : "bg-neutral-950 text-white"
                        }`}
                      >
                        Get started
                      </button>
                    </SignUpButton>
                  </div>
                </SignedOut>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
