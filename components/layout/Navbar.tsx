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
import { NAVBAR } from "@/lib/nav-chrome";
import { Button } from "@/components/ui/button";
import { MegaMenu } from "./MegaMenu";
import { MobileNav } from "./MobileNav";

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
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [onDark, setOnDark] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | null>(null);
  const expandedWidthRef = useRef(0);
  const [holdWidth, setHoldWidth] = useState(false);

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
    setOpenMenu(null);
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
    if (!mobileMenuOpen && !openMenu) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
        setOpenMenu(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileMenuOpen, openMenu]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (!mq.matches) setOpenMenu(null);
      else setMobileMenuOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const cancelMenuClose = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const openDesktopMenu = (label: string) => {
    cancelMenuClose();
    setOpenMenu(label);
  };

  const scheduleMenuClose = () => {
    cancelMenuClose();
    closeTimer.current = window.setTimeout(() => setOpenMenu(null), 160);
  };

  const mode = NAVBAR;
  const sectioned = mode !== "wide";
  const compact = mode === "compact";
  const pinWidth = compact || mode === "v2";
  const shouldShrink = isScrolled && (sectioned || isHero);

  const containerClasses = useHeroStyling
    ? "bg-white/2 backdrop-blur-[80px] border border-gray-200/20 shadow-2xl"
    : "bg-white/60 backdrop-blur-xl border border-gray-200/50 shadow-lg";

  const textColor = sectioned ? "text-[#141414]" : onDark ? "text-white" : "text-black";
  const wordmarkSrc = textColor === "text-white"
    ? "/logo-hydrilla/hydsvg.svg"
    : "/logo-hydrilla/hydsvgblack.svg";

  const control =
    mode === "compact"
      ? shouldShrink
        ? "h-8 px-3 text-[14px]"
        : "h-10 px-4 text-[15px]"
      : mode === "v2"
        ? shouldShrink
          ? "h-8 px-3 text-[14px]"
          : "h-8 px-3 text-[13px]"
        : "h-8 px-2.5 text-[13px]";
  const controlRadius =
    mode === "compact" || (mode === "v2" && shouldShrink) ? "rounded-xl" : mode === "v2" ? "rounded-[10px]" : "rounded-lg";

  const generateButtonClasses = sectioned
    ? `${control} cursor-pointer items-center ${controlRadius} bg-[#141414] font-semibold tracking-[-0.01em] text-white normal-case hover:bg-[#2a2a2a]`
    : onDark
      ? "px-4 py-2 rounded-lg bg-white/20 backdrop-blur-md border border-white/30 text-xs font-semibold text-white uppercase tracking-wider hover:bg-white/30 transition-all duration-500 ease-out shadow-sm"
      : "px-4 py-2 rounded-lg bg-gray-100 text-xs font-semibold text-black uppercase tracking-wider hover:bg-gray-200 transition-all duration-500 ease-out";

  const signInButtonClasses = sectioned
    ? `${mode === "v2" && !shouldShrink ? "h-8 px-2.5 text-[13px]" : control} cursor-pointer font-medium tracking-[-0.01em] text-[#141414] hover:bg-black/[0.05] hover:text-[#141414]`
    : onDark
      ? "h-9 px-3 text-sm font-medium text-white hover:bg-white/10 hover:text-white"
      : "h-9 px-3 text-sm font-medium text-[#000c1f] hover:bg-[#000c1f]/5 hover:text-[#000c1f]";

  const signUpButtonClasses = sectioned
    ? `${control} cursor-pointer ${controlRadius} tracking-[-0.01em] shadow-none`
    : onDark
      ? "bg-white text-[#000c1f] shadow-none hover:bg-white/90"
      : "";

  const bookDemoButtonClasses = sectioned
    ? `${control} cursor-pointer ${controlRadius} border border-black/10 bg-white font-semibold tracking-[-0.01em] text-[#141414] shadow-none hover:bg-[#f6f7f8]`
    : signUpButtonClasses;

  const userButtonBorder = sectioned
    ? "border-black/10"
    : onDark
      ? "border-white/40"
      : "border-gray-300";

  const hamburgerClasses = sectioned
    ? `lg:hidden relative z-20 flex cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141414]/30 ${
        mode === "small" ? "h-8 w-8" : mode === "v2" ? "h-9 w-9" : "h-11 w-11"
      }`
    : onDark
      ? "lg:hidden relative z-20 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-white/15"
      : "lg:hidden relative z-20 flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-black/6";

  const barColor = sectioned ? "bg-[#141414]" : onDark ? "bg-white" : "bg-black";

  const activeGroup = NAV_PRIMARY.find((item) => item.label === openMenu);

  useEffect(() => {
    if (shouldShrink) setOpenMenu(null);
  }, [shouldShrink]);

  useEffect(() => {
    if (!pinWidth) return;
    if (shouldShrink) {
      setHoldWidth(true);
      return;
    }
    const delay = reduceMotion ? 0 : 520;
    const timer = window.setTimeout(() => setHoldWidth(false), delay);
    return () => window.clearTimeout(timer);
  }, [pinWidth, shouldShrink, reduceMotion]);

  useLayoutEffect(() => {
    if (!pinWidth || shouldShrink || holdWidth) return;
    const el = menuRef.current;
    if (!el) return;
    const measure = () => {
      expandedWidthRef.current = el.getBoundingClientRect().width;
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [pinWidth, shouldShrink, holdWidth, pathname]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current);
    };
  }, []);

  const chromeSurface = sectioned
    ? "border border-black/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.4)_10%,rgba(255,255,255,0.8))] shadow-[0_8px_32px_-12px_rgba(3,3,2,0.18),inset_0_1px_0_rgba(255,255,255,0.7)] backdrop-blur-[20px]"
    : useHeroStyling
      ? `${shouldShrink ? "bg-white/5" : "bg-white/2"} backdrop-blur-[80px] border border-gray-200/20 shadow-2xl`
      : containerClasses;
  const dynamicPadding = compact
    ? `${shouldShrink ? "h-[52px]" : "h-[60px]"} items-center gap-3 pl-4 pr-2`
    : mode === "v2"
      ? `${shouldShrink ? "h-[52px] items-center gap-3 pl-4 pr-2" : "h-[52px] items-center gap-2 pl-4 pr-2"}`
      : mode === "small"
        ? `${shouldShrink ? "h-10" : "h-11"} items-center gap-5 pl-2.5 pr-1.5`
        : shouldShrink
          ? "px-4 md:px-6 py-2"
          : "px-4 md:px-8 py-2.5";
  const dynamicRounded = mode === "small"
    ? "rounded-full"
    : sectioned
      ? shouldShrink
        ? "rounded-full"
        : "rounded-[14px]"
      : shouldShrink
        ? "rounded-full"
        : "rounded-xl md:rounded-2xl";

  const shellClass = compact
    ? `relative mx-auto w-full overflow-visible transition-[width] ${BAR_EASE} lg:w-[min(72rem,calc(100vw-2rem))]`
    : mode === "v2"
      ? `relative mx-auto w-full overflow-visible transition-[width] ${BAR_EASE} max-w-3xl lg:max-w-4xl`
      : mode === "small"
        ? "relative mx-auto w-max max-w-[calc(100vw-2rem)]"
        : `relative mx-auto w-full overflow-visible transition-[max-width] ${BAR_EASE} ${
            shouldShrink ? "max-w-2xl" : "max-w-7xl"
          }`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 flex justify-center ${
        sectioned ? "px-3 pt-3 md:px-4" : "pt-2 md:pt-4 px-4 md:px-0"
      }`}
      data-site-navbar
    >
      <div
        ref={menuRef}
        className={shellClass}
        style={
          pinWidth && shouldShrink && (compact ? expandedWidthRef.current > 0 : typeof window !== "undefined")
            ? {
                width: `min(${Math.max(
                  640,
                  Math.round(
                    (compact
                      ? expandedWidthRef.current
                      : Math.min(72 * 16, window.innerWidth - 32)) * 0.62,
                  ),
                )}px, 100%)`,
              }
            : pinWidth && holdWidth && expandedWidthRef.current > 0
              ? { minWidth: `min(${Math.round(expandedWidthRef.current)}px, 100%)` }
              : undefined
        }
      >
        <div
          className={`${chromeSurface} ${dynamicRounded} relative isolate w-full overflow-hidden transition-[border-radius,background-color,box-shadow] ${BAR_EASE} ${
            sectioned
              ? ""
              : `before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-br ${
                  useHeroStyling
                    ? "before:from-white/20 before:via-white/5 before:to-transparent"
                    : "before:from-white/50 before:via-transparent before:to-transparent"
                }`
          }`}
        >
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
            {sectioned ? null : useHeroStyling ? (
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
            className={`relative z-10 flex items-center ${
              compact || mode === "v2"
                ? "justify-between lg:grid lg:grid-cols-[minmax(max-content,1fr)_auto_minmax(max-content,1fr)]"
                : mode === "small"
                  ? "justify-center"
                  : "justify-between gap-3 md:gap-6"
            } ${dynamicPadding} transition-[padding,height] ${BAR_EASE}`}
          >
          <Link href="/" className={`relative z-10 flex shrink-0 items-center group ${compact ? "gap-2.5 lg:justify-self-start" : mode === "v2" ? "gap-2 lg:justify-self-start" : sectioned ? "gap-2" : "gap-2 sm:gap-3"}`}>
            <div className={`logo-spin-hover shrink-0 transition-[height,width] ${BAR_EASE} ${
              compact
                ? shouldShrink ? "h-9 w-9" : "h-11 w-11"
                : mode === "v2"
                  ? shouldShrink ? "h-9 w-9" : "h-8 w-8"
                : sectioned
                  ? "h-7 w-7"
                  : "w-8 h-8 sm:w-10 sm:h-10"
            }`}>
              <div className={`relative h-full w-full ${compact || (mode === "v2" && shouldShrink) ? "-translate-y-0.5" : mode === "small" ? "-translate-y-px" : ""}`}>
                <Image
                  src="/hyd01.png"
                  alt="Hydrilla Logo"
                  fill
                  className="object-contain"
                  sizes={compact ? "44px" : mode === "v2" ? "32px" : sectioned ? "28px" : "(max-width: 640px) 32px, 40px"}
                  priority
                />
              </div>
            </div>
            <img
              src={wordmarkSrc}
              alt=""
              className={`block w-auto transition-[height] ${BAR_EASE} ${
                compact
                  ? shouldShrink ? "h-7 translate-y-px" : "h-9 translate-y-[2px]"
                  : mode === "v2"
                    ? shouldShrink ? "h-7 translate-y-px" : "h-6 translate-y-px"
                  : sectioned
                    ? "h-5 translate-y-px"
                    : "h-8 sm:h-9"
              }`}
            />
          </Link>

          <nav
            className={
              sectioned
                ? `hidden min-w-0 items-center overflow-hidden lg:flex transition-[max-width,opacity] ${BAR_EASE} ${
                    compact || mode === "v2" ? "lg:min-w-0 lg:justify-self-center" : ""
                  } ${
                    shouldShrink
                      ? "pointer-events-none max-w-0 opacity-0"
                      : compact
                        ? "max-w-[42rem] opacity-100"
                        : "max-w-[36rem] opacity-100"
                  }`
                : `pointer-events-none absolute inset-0 hidden items-center justify-center lg:flex transition-opacity duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
                    shouldShrink ? "opacity-0" : "opacity-100"
                  }`
            }
            aria-hidden={shouldShrink}
            onMouseLeave={scheduleMenuClose}
          >
            <div className={`flex items-center ${
              compact
                ? "gap-4 px-4 xl:gap-5 xl:px-6"
                : mode === "v2"
                  ? "gap-2 px-6"
                  : mode === "small"
                    ? "gap-2"
                    : "gap-6 md:gap-8"
            } ${
              shouldShrink ? "pointer-events-none" : "pointer-events-auto"
            }`}>
              {NAV_PRIMARY.map((item) => {
                const hasMenu = Boolean(item.columns?.length);
                const isOpen = openMenu === item.label;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    tabIndex={shouldShrink ? -1 : 0}
                    aria-expanded={hasMenu ? isOpen : undefined}
                    aria-haspopup={hasMenu ? "true" : undefined}
                    onMouseEnter={() => {
                      if (hasMenu) openDesktopMenu(item.label);
                      else {
                        cancelMenuClose();
                        setOpenMenu(null);
                      }
                    }}
                    onFocus={() => {
                      if (hasMenu) openDesktopMenu(item.label);
                      else setOpenMenu(null);
                    }}
                    className={
                      sectioned
                        ? `inline-flex cursor-pointer items-center font-medium leading-none tracking-[-0.012em] transition-colors font-dm-sans focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141414]/25 ${
                            compact
                              ? "h-10 rounded-lg px-3.5 text-[15px]"
                              : mode === "v2"
                                ? "rounded-lg px-3 py-2 text-[14px]"
                                : "h-8 rounded-md px-2.5 text-[13px]"
                          } ${textColor} ${
                            isOpen
                              ? "bg-black/[0.05]"
                              : "hover:bg-black/[0.05]"
                          } ${openMenu && !isOpen ? "opacity-45" : ""}`
                        : `text-[14px] font-medium tracking-[-0.018em] transition-opacity font-dm-sans ${textColor} ${
                            openMenu && !isOpen ? "opacity-45" : "hover:opacity-80"
                          }`
                    }
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          <div className={`relative z-10 flex shrink-0 items-center ${compact || mode === "v2" ? "gap-2 lg:justify-self-end" : mode === "small" ? "gap-1.5" : "gap-2 md:gap-4"}`}>
            <SignedIn>
              <Link
                href="/app/studio"
                className={`hidden md:flex ${generateButtonClasses} font-dm-sans overflow-hidden transition-[max-width,opacity,padding,margin] ${BAR_EASE} ${
                  shouldShrink
                    ? "pointer-events-none max-w-0 opacity-0 px-0 mr-0 border-0"
                    : "max-w-[9rem] opacity-100"
                }`}
              >
                App
              </Link>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: `${
                      compact
                        ? shouldShrink ? "h-8 w-8 border" : "h-9 w-9 border"
                        : mode === "v2"
                          ? shouldShrink ? "h-8 w-8 border" : "h-7 w-7 border"
                          : sectioned
                            ? "h-7 w-7 border"
                            : "w-8 h-8 md:w-9 md:h-9 border-2"
                    } ${userButtonBorder}`,
                  },
                }}
              />
            </SignedIn>

            <SignedOut>
              <div className={`hidden md:flex items-center ${compact ? "gap-2" : sectioned ? "gap-1.5" : "gap-2 md:gap-4"}`}>
                <div
                  className={`overflow-hidden transition-[max-width,opacity] ${BAR_EASE} ${
                    shouldShrink
                      ? "pointer-events-none max-w-0 opacity-0"
                      : "max-w-[8rem] opacity-100"
                  }`}
                >
                  <SignInButton mode="modal">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      tabIndex={shouldShrink ? -1 : 0}
                      className={`${signInButtonClasses} font-dm-sans`}
                    >
                      Log in
                    </Button>
                  </SignInButton>
                </div>
                <div
                  className={`overflow-hidden transition-[max-width,opacity] ${BAR_EASE} ${
                    shouldShrink
                      ? "pointer-events-none max-w-0 opacity-0"
                      : "max-w-[10rem] opacity-100"
                  }`}
                >
                  <Button asChild size="sm" variant={sectioned ? "outline" : "default"} className={`${bookDemoButtonClasses} font-dm-sans`}>
                    <a
                      href="https://cal.com/hydrilla"
                      tabIndex={shouldShrink ? -1 : 0}
                    >
                      Book demo
                    </a>
                  </Button>
                </div>
                <SignUpButton mode="modal">
                  <Button
                    type="button"
                    size="sm"
                    className={`${signUpButtonClasses} font-dm-sans`}
                  >
                    Get started
                  </Button>
                </SignUpButton>
              </div>
            </SignedOut>

            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => {
                setOpenMenu(null);
                setMobileMenuOpen((open) => !open);
              }}
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
          {activeGroup?.columns && !shouldShrink && (
            <motion.div
              key="desktop-mega-menu"
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 6 }}
              transition={{ duration: reduceMotion ? 0.1 : 0.18, ease: MENU_EASE }}
              className={
                compact
                  ? "absolute inset-x-0 top-full z-50 hidden pt-2.5 lg:block"
                  : sectioned
                    ? "absolute inset-x-0 top-full z-50 hidden pt-2 lg:block"
                    : "absolute left-0 right-0 top-full z-50 hidden pt-2 lg:block"
              }
              onMouseEnter={cancelMenuClose}
              onMouseLeave={scheduleMenuClose}
            >
              <MegaMenu
                group={activeGroup}
                onNavigate={() => setOpenMenu(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <MobileNav
          open={mobileMenuOpen}
          onDark={onDark}
          reduceMotion={reduceMotion}
          onClose={() => setMobileMenuOpen(false)}
        />
      </div>
    </header>
  );
}
