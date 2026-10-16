"use client";

import { usePathname } from "next/navigation";
import LibraryNavbar from "./LibraryNavbar";
import Navbar from "./Navbar";

export function ConditionalNavbar() {
  const pathname = usePathname();

  // Don't show marketing navbar on app shell / workspace (auth pages keep it so
  // Hydrilla → home and the post-login App button stay available).
  if (
    pathname?.startsWith("/app") ||
    pathname === "/generate" ||
    pathname?.startsWith("/workspace") ||
    pathname === "/generations"
  ) {
    return null;
  }

  // Library uses a minimal bar — brand + home only
  if (pathname === "/library") {
    return <LibraryNavbar />;
  }

  // Use default variant (black text) for light pages; hero for dark/immersive heroes
  const variant =
    pathname === "/viewer" ||
    pathname === "/privacy-policy" ||
    pathname === "/terms-and-conditions" ||
    pathname === "/cookie-policy" ||
    pathname?.startsWith("/usecase") ||
    pathname === "/blog" ||
    pathname?.startsWith("/blog/") ||
    pathname === "/integrations" ||
    pathname?.startsWith("/integrations/") ||
    pathname?.startsWith("/sign-in") ||
    pathname?.startsWith("/sign-up")
      ? "default"
      : "hero";

  return <Navbar variant={variant} pathname={pathname} />;
}

