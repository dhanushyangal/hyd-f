import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getWebPageJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Contact Hydrilla — Demos, Studios, and Support",
  description:
    "Get in touch with Hydrilla. Book a demo, reach the founders, or send a message about studio and enterprise 3D production.",
  path: "/contact",
  absoluteTitle: true,
});

export default function ContactLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd
        data={getWebPageJsonLd({
          name: "Contact Hydrilla — Demos, Studios, and Support",
          description: metadata.description as string,
          path: "/contact",
        })}
      />
      {children}
    </>
  );
}
