import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Sign up",
  path: "/sign-up",
  noIndex: true,
});

export default function SignUpLayout({ children }: { children: ReactNode }) {
  return children;
}
