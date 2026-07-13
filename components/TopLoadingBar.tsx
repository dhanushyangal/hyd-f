"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";

/** Thin top progress bar — 2px, near-black. Snappy for in-app navigations. */
const BAR_HEIGHT = 2;
const BAR_COLOR = "#111111";

/**
 * Loading bar at the top of the viewport. Rendered via portal into
 * document.body so it always sits on top. Shows on link click and pathname change.
 */
export function TopLoadingBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathRef = useRef<string | null>(null);

  const clearHide = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const showBriefly = (ms: number) => {
    setVisible(true);
    clearHide();
    hideTimerRef.current = setTimeout(() => setVisible(false), ms);
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest?.("a");
      if (!anchor?.href) return;
      try {
        const url = new URL(anchor.href);
        if (url.origin !== window.location.origin || url.pathname === pathname) return;
        if (!url.pathname.startsWith("/")) return;
        // In-app hops should feel instant — shorter bar.
        const inApp =
          pathname.startsWith("/app") && url.pathname.startsWith("/app");
        showBriefly(inApp ? 420 : 900);
      } catch {
        // ignore
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [mounted, pathname]);

  useEffect(() => {
    if (!mounted) return;
    if (prevPathRef.current !== null && pathname !== prevPathRef.current) {
      const inApp =
        prevPathRef.current.startsWith("/app") && pathname.startsWith("/app");
      showBriefly(inApp ? 280 : 650);
    }
    prevPathRef.current = pathname;
    return () => clearHide();
  }, [mounted, pathname]);

  if (!mounted || typeof document === "undefined" || !visible) return null;

  const bar = (
    <div
      role="progressbar"
      aria-label="Loading page"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: BAR_HEIGHT,
        zIndex: 2147483647,
        overflow: "hidden",
        background: "transparent",
        pointerEvents: "none",
      }}
    >
      <div
        className="animate-loading-bar-width"
        style={{
          height: "100%",
          width: 0,
          background: BAR_COLOR,
          boxShadow: "0 0 6px rgba(17, 17, 17, 0.25)",
        }}
      />
    </div>
  );

  return createPortal(bar, document.body);
}
