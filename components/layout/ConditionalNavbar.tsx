"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Don't show navbar on generate, sign-in, and sign-up pages
  if (pathname === "/generate" || pathname?.startsWith("/sign-in") || pathname?.startsWith("/sign-up")) {
    return null;
  }
  
  // Use default variant for library and viewer pages (black text), hero for others
  const variant = pathname === "/library" || pathname === "/viewer" ? "default" : "hero";
  
  return <Navbar variant={variant} pathname={pathname} />;
}

