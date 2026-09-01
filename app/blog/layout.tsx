import type { ReactNode } from "react";

export const revalidate = 3600;

export default function BlogLayout({ children }: { children: ReactNode }) {
  return children;
}
