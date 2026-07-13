import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "FAQ",
  description:
    "Answers about Hydrilla AI — 3D generation, pricing, exports, studio workflows, and getting started for creators and teams.",
  path: "/faq",
});

export default function FAQLayout({ children }: { children: ReactNode }) {
  return children;
}
