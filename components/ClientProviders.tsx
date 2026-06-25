"use client";

import { ReactNode } from "react";
import { UserSync } from "./UserSync";
import { TopLoadingBar } from "./TopLoadingBar";
import { ScrollbarActivity } from "./ScrollbarActivity";
import { PostHogIdentify } from "./PostHogIdentify";

/**
 * Client-side providers shared across the app.
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <>
      <TopLoadingBar />
      <ScrollbarActivity />
      <UserSync />
      <PostHogIdentify />
      {children}
    </>
  );
}
