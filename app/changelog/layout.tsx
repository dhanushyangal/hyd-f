import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getWebPageJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Hydrilla Changelog — Product Updates",
  description:
    "What shipped in Hydrilla and BlueFox 1: generation, exports, studio, and API.",
  path: "/changelog",
  absoluteTitle: true,
});

export default function ChangelogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={getWebPageJsonLd({
          name: "Hydrilla Changelog — Product Updates",
          description: metadata.description as string,
          path: "/changelog",
        })}
      />
      {children}
    </>
  );
}
