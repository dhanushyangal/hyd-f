import type { ReactNode } from "react";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Privacy Policy",
  description: "Hydrilla AI privacy policy — how we collect, use, and protect your data.",
  path: "/privacy-policy",
});

export default function PrivacyPolicyLayout({ children }: { children: ReactNode }) {
  return children;
}
