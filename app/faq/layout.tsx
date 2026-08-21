import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo/JsonLd";
import { createPageMetadata, getFaqJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "FAQ",
  description:
    "Answers about Hydrilla — 3D generation, BlueFox, pricing, exports, studio workflows, and getting started for creators and teams.",
  path: "/faq",
});

export default function FAQLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <JsonLd data={getFaqJsonLd()} />
      {children}
    </>
  );
}
