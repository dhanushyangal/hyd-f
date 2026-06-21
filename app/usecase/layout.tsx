import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Solutions",
  description:
    "AI 3D generation for game development, film and animation, architecture, AR/VR, and product design workflows.",
  path: "/usecase",
});

export default function UseCaseLayout({ children }: { children: ReactNode }) {
  return children;
}
