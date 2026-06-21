import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Case Studies",
  description:
    "See how studios and creators use Hydrilla AI for production-ready 3D asset generation.",
  path: "/case-study",
});

export default function CaseStudyLayout({ children }: { children: ReactNode }) {
  return children;
}
