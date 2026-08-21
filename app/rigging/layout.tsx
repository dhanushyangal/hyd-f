import type { ReactNode } from "react";
import { RequireAuthLayout } from "@/components/auth/RequireAuthLayout";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Rigging",
  path: "/rigging",
  noIndex: true,
});

export default function RiggingLayout({ children }: { children: ReactNode }) {
  return <RequireAuthLayout>{children}</RequireAuthLayout>;
}
