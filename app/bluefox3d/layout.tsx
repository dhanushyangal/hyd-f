import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getBlueFoxJsonLd } from "@/lib/seo";
import { WHY_HYDRILLA_MEDIA } from "@/lib/cloudinary";

export const metadata = createPageMetadata({
  title: "BlueFox 3D | BlueFox 1 generative 3D model",
  description:
    "BlueFox 3D is Hawan Research Labs’ generative 3D model family. BlueFox 1 turns text or images into segmented meshes with PBR, exported from Hydrilla.",
  path: "/bluefox3d",
  absoluteTitle: true,
  keywords: [
    "BlueFox 1",
    "BlueFox 3D",
    "AI 3D generation",
    "text to 3D",
    "image to 3D",
    "production-ready 3D assets",
  ],
  ogImage: WHY_HYDRILLA_MEDIA.bluefox.poster,
});

export default function BlueFoxLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={getBlueFoxJsonLd()} />
      {children}
    </>
  );
}
