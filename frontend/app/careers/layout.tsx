import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Careers",
  description:
    "Join Hydrilla AI and help build AI-powered 3D production tools for games, film, architecture, and immersive media.",
  path: "/careers",
});

export default function CareersLayout({ children }: { children: ReactNode }) {
  return children;
}
