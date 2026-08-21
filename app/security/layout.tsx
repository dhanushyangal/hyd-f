import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getWebPageJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Security",
  description:
    "How Hydrilla handles accounts, generated assets, and exports. Trust details for studios evaluating BlueFox 1 in a production pipeline.",
  path: "/security",
});

export default function SecurityLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={getWebPageJsonLd({
          name: "Security | Hydrilla",
          description: metadata.description as string,
          path: "/security",
        })}
      />
      {children}
    </>
  );
}
