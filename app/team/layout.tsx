import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getTeamJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Team",
  description:
    "Meet the Hydrilla team at Hawan Research Labs — the people building BlueFox and production 3D tools for creators and studios.",
  path: "/team",
});

export default function TeamLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={getTeamJsonLd()} />
      {children}
    </>
  );
}
