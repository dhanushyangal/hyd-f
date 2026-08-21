import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Viewer",
  path: "/viewer",
  noIndex: true,
});

export default function ViewerLayout({ children }: { children: ReactNode }) {
  return children;
}
