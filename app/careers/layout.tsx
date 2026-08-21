import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getWebPageJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Careers at Hydrilla — Engineering, Research, GTM",
  description:
    "Join Hydrilla and Hawan Research Labs. Help build BlueFox and production 3D tools for games, film, architecture, and immersive media. Email founders@hydrilla.ai to apply.",
  path: "/careers",
  absoluteTitle: true,
  keywords: ["Hydrilla careers", "Hawan Research Labs jobs", "AI 3D jobs"],
});

export default function CareersLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={getWebPageJsonLd({
          name: "Careers at Hydrilla — Engineering, Research, GTM",
          description: metadata.description as string,
          path: "/careers",
        })}
      />
      {children}
    </>
  );
}
