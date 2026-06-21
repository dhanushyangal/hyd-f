import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Terms of Service",
  description: "Hydrilla AI terms and conditions for using our 3D generation platform and services.",
  path: "/terms-and-conditions",
});

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children;
}
