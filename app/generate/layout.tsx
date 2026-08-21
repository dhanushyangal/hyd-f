import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Generate",
  path: "/generate",
  noIndex: true,
});

export default function GenerateLayout({ children }: { children: ReactNode }) {
  return children;
}
