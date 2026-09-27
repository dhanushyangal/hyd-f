"use client";

import * as React from "react";
import * as NextThemes from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemes.ThemeProvider>) {
  return <NextThemes.ThemeProvider {...props}>{children}</NextThemes.ThemeProvider>;
}

export default ThemeProvider;
