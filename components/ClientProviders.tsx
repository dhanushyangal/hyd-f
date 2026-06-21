"use client";

import { ReactNode } from "react";
import dynamic from "next/dynamic";
import { UserSync } from "./UserSync";

const TopLoadingBar = dynamic(
  () => import("./TopLoadingBar").then((m) => m.TopLoadingBar),
  { ssr: false }
);

const ScrollbarActivity = dynamic(
  () => import("./ScrollbarActivity").then((m) => m.ScrollbarActivity),
  { ssr: false }
);

import { PostHogIdentify } from "./PostHogIdentify";

/**
 * Client-side providers deferred off the critical path where possible.
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
