import { Faculty_Glyphic } from "next/font/google";

/** Shared display face for landing sections (Faculty Glyphic ships a single 400 weight). */
export const glyphic = Faculty_Glyphic({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const DISPLAY_FONT = `${glyphic.style.fontFamily}, Georgia, serif`;
export const SANS_FONT = "var(--font-dm-sans), 'DM Sans', Arial, Helvetica, sans-serif";
