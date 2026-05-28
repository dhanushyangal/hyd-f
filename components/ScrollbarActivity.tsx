"use client";

import { useEffect } from "react";

export function ScrollbarActivity() {
  useEffect(() => {
    let hideTimer: number | undefined;

    const showScrollbar = () => {
      document.body.classList.add("is-scrolling");
      if (hideTimer) window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        document.body.classList.remove("is-scrolling");
      }, 900);
    };

    window.addEventListener("scroll", showScrollbar, { passive: true });
    window.addEventListener("wheel", showScrollbar, { passive: true });
    window.addEventListener("touchmove", showScrollbar, { passive: true });

    return () => {
      if (hideTimer) window.clearTimeout(hideTimer);
      document.body.classList.remove("is-scrolling");
      window.removeEventListener("scroll", showScrollbar);
      window.removeEventListener("wheel", showScrollbar);
      window.removeEventListener("touchmove", showScrollbar);
    };
  }, []);

  return null;
}
