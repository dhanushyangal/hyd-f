"use client";

import { ThinkingOrb, type OrbState, type OrbTheme } from "thinking-orbs";

type Props = {
  state?: OrbState;
  size?: 64 | 32 | 20;
  theme?: OrbTheme;
};

export function StudioOrb({ state = "searching", size = 64, theme = "light" }: Props) {
  return <ThinkingOrb state={state} size={size} theme={theme} />;
}
