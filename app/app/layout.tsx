import type { ReactNode } from "react";
import { AppAuthenticatedLayout } from "@/components/app/AppAuthenticatedLayout";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Studio",
  path: "/app",
  noIndex: true,
});

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppAuthenticatedLayout>{children}</AppAuthenticatedLayout>;
}
