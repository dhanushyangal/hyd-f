import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Team",
  description:
    "Meet the Hydrilla AI team building the next generation of AI-powered 3D production tools for creators and studios.",
  path: "/team",
});

export default function TeamLayout({ children }: { children: ReactNode }) {
  return children;
}
