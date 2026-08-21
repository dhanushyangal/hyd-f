import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getWebPageJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Hydrilla Enterprise — Studio Pipelines, Seats, and API",
  description:
    "Volume generation, team seats, and BlueFox 1 API access for studios. Custom plans and pipeline support.",
  path: "/enterprise",
  absoluteTitle: true,
});

export default function EnterpriseLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={getWebPageJsonLd({
          name: "Hydrilla Enterprise — Studio Pipelines, Seats, and API",
          description: metadata.description as string,
          path: "/enterprise",
        })}
      />
      {children}
    </>
  );
}
