import type { ReactNode } from "react";
import { RequireAuthLayout } from "@/components/auth/RequireAuthLayout";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Generations",
  path: "/generations",
  noIndex: true,
});

export default function GenerationsLayout({ children }: { children: ReactNode }) {
  return <RequireAuthLayout>{children}</RequireAuthLayout>;
}
