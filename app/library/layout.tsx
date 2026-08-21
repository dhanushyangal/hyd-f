import type { ReactNode } from "react";
import { RequireAuthLayout } from "@/components/auth/RequireAuthLayout";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Library",
  path: "/library",
  noIndex: true,
});

export default function LibraryLayout({ children }: { children: ReactNode }) {
  return <RequireAuthLayout>{children}</RequireAuthLayout>;
}
