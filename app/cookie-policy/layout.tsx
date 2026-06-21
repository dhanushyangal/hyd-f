import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Cookie Policy",
  description: "Hydrilla AI cookie policy — how we use cookies and similar technologies on hydrilla.ai.",
  path: "/cookie-policy",
});

export default function CookiePolicyLayout({ children }: { children: ReactNode }) {
  return children;
}
