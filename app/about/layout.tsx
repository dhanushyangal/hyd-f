import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getAboutJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "About Hydrilla, Hawan Research Labs, and BlueFox",
  description:
    "Hydrilla is the product. Hawan Research Labs is the lab. BlueFox 3D is the model family. Built for creators and studios who need production-ready 3D, fast.",
  path: "/about",
  keywords: [
    "Hydrilla",
    "Hawan Research Labs",
    "about Hydrilla",
    "BlueFox",
    "AI 3D company",
  ],
});

export default function AboutLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={getAboutJsonLd()} />
      {children}
    </>
  );
}
