"use client";

import { Menu as MenuIcon } from "lucide-react";

interface HamburgerMenuProps {
  onClick: () => void;
  className?: string;
}

export function HamburgerMenu({ onClick, className = "" }: HamburgerMenuProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Open menu"
      className={`p-2.5 bg-white/90 backdrop-blur-sm rounded-xl hover:bg-white transition-colors shadow-lg border border-neutral-200 ${className}`}
    >
      <MenuIcon className="w-5 h-5 text-black" />
    </button>
  );
}

