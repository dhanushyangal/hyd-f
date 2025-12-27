"use client";

import { ReactNode } from "react";
import { UserSync } from "./UserSync";

/**
 * Client-side providers and components that need to be in the layout
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <UserSync />
      {children}
    </>
  );
}
