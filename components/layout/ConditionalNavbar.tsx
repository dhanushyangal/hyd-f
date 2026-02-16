"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Don't show navbar on generate, workspace, sign-in, and sign-up pages
  if (pathname === "/generate" || pathname === "/workspace" || pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up")) {
    return null;
  }
  
  // Use default variant for library, viewer, privacy-policy, and terms pages (black text), hero for others
  const variant = pathname === "/library" || pathname === "/viewer" || pathname === "/privacy-policy" || pathname === "/terms-and-conditions" ? "default" : "hero";
  
  return <Navbar variant={variant} pathname={pathname} />;
}

