import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "3D & AI",
  description:
    "How Hydrilla combines AI and 3D production to deliver fast, production-ready assets for creative teams.",
  path: "/3d-ai",
});

export default function ThreeDAILayout({ children }: { children: ReactNode }) {
  return children;
}
