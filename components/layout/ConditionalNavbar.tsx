"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Don't show navbar on app shell, auth gates, or minimal utility pages
  if (
    pathname?.startsWith("/app") ||
    pathname === "/generate" ||
    pathname?.startsWith("/workspace") ||
    pathname === "/generations" ||
    pathname?.startsWith("/sign-in") ||
    pathname?.startsWith("/sign-up") ||
    pathname === "/access-denied"
  ) {
    return null;
  }
  
  // Use default variant for library, viewer, privacy-policy, and terms pages (black text), hero for others
  const variant = pathname === "/library" || pathname === "/viewer" || pathname === "/privacy-policy" || pathname === "/terms-and-conditions" ? "default" : "hero";
  
  return <Navbar variant={variant} pathname={pathname} />;
}

