import type { ReactNode } from "react";
import { RequireAuthLayout } from "@/components/auth/RequireAuthLayout";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Workspace",
  path: "/workspace",
  noIndex: true,
});

export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <RequireAuthLayout>{children}</RequireAuthLayout>;
}
