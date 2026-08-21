import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Sign in",
  path: "/sign-in",
  noIndex: true,
});

export default function SignInLayout({ children }: { children: ReactNode }) {
  return children;
}
