import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "AI 3D Use Cases for Games, Film, Architecture & XR",
  description:
    "See how Hydrilla generates production-ready 3D for game development, film and animation, architecture, AR/VR, and product visualization.",
  path: "/usecase",
  keywords: [
    "AI 3D use cases",
    "text to 3D for games",
    "AI architecture visualization",
    "AI VFX assets",
    "AR VR 3D generation",
  ],
});

export default function UseCaseLayout({ children }: { children: ReactNode }) {
  return children;
}
