"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { createPortal } from "react-dom";

const BAR_HEIGHT = 6;
const BAR_COLOR = "#1e3a5f";

/**
 * Dark blue loading bar at the top of the viewport. Rendered via portal into
 * document.body so it always sits on top. Shows on link click and pathname change.
 */
export function TopLoadingBar() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Show bar when user clicks an internal link
  useEffect(() => {
    if (!mounted) return;
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement)?.closest?.("a");
      if (!anchor?.href) return;
      try {
        const url = new URL(anchor.href);
        if (url.origin !== window.location.origin || url.pathname === pathname) return;
        if (!url.pathname.startsWith("/")) return;
        setVisible(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setVisible(false), 1500);
      } catch {
        // ignore
      }
    };
    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [mounted, pathname]);

  // Show bar when pathname changes
  useEffect(() => {
    if (!mounted) return;
    if (prevPathRef.current !== null && pathname !== prevPathRef.current) {
      setVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setVisible(false), 1200);
    }
    prevPathRef.current = pathname;
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
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
        }}
      />
    </div>
  );

  return createPortal(bar, document.body);
}
