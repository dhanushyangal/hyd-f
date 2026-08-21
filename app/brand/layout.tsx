import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Press kit",
  description:
    "Hydrilla names, logo, and boilerplate for press. Not linked from the public site.",
  path: "/brand",
  noIndex: true,
});

export default function BrandLayout({ children }: { children: ReactNode }) {
  return children;
}
