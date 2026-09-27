"use client";

import { ReactNode } from "react";
import ThemeProvider from "@/components/theme-provider";
import { UserSync } from "./UserSync";
import { TopLoadingBar } from "./TopLoadingBar";
import { ScrollbarActivity } from "./ScrollbarActivity";
import { PostHogIdentify } from "./PostHogIdentify";

/**
 * Client-side providers shared across the app.
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
    >
      <TopLoadingBar />
      <ScrollbarActivity />
      <UserSync />
      <PostHogIdentify />
      {children}
    </ThemeProvider>
  );
}
