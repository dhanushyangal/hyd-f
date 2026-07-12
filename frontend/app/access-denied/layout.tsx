import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Access Denied",
  description: "You do not have access to Hydrilla yet.",
  path: "/access-denied",
  noIndex: true,
});

export default function AccessDeniedLayout({ children }: { children: ReactNode }) {
  return children;
}
