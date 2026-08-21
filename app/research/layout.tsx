import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getResearchJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Hawan Research Labs | BlueFox 3D research",
  description:
    "Hawan Research Labs builds generative 3D models. BlueFox 1 is the first public model, shipped in Hydrilla as BlueFox 3D.",
  path: "/research",
  absoluteTitle: true,
  keywords: ["Hawan Research Labs", "BlueFox", "3D generation research"],
});

export default function ResearchLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={getResearchJsonLd()} />
      {children}
    </>
  );
}
