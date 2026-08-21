import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Early access",
  path: "/earlyaccess",
  noIndex: true,
});

export default function EarlyAccessLayout({ children }: { children: ReactNode }) {
  return children;
}
