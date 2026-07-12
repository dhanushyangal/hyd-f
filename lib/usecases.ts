import type { LucideIcon } from "lucide-react";
import {
  Gamepad2,
  Clapperboard,
  Building2,
  Glasses,
  Package,
} from "lucide-react";

export type UseCaseId =
  | "gamedev"
  | "filmproduction"
  | "architecture"
  | "arvr"
  | "productdesign";

export type UseCaseNavItem = {
  id: UseCaseId;
  /** Short label for switcher */
  label: string;
  /** SEO / page title */
  title: string;
  href: string;
  /** One-line switcher description */
  blurb: string;
  Icon: LucideIcon;
};

/** Canonical use-case navigation — used by switcher + hub for continuity. */
export const USE_CASE_NAV: UseCaseNavItem[] = [
  {
    id: "gamedev",
    label: "Game development",
    title: "Game Development",
    href: "/usecase/gamedev",
    blurb: "Characters, props, and environments for real-time engines.",
    Icon: Gamepad2,
  },
  {
    id: "filmproduction",
    label: "Film & animation",
    title: "Film & Animation",
    href: "/usecase/filmproduction",
    blurb: "Concept and production assets for cinematic pipelines.",
    Icon: Clapperboard,
  },
  {
    id: "architecture",
    label: "Architecture",
    title: "Architecture & Interiors",
    href: "/usecase/architecture",
    blurb: "Furniture and interior elements for visualization.",
    Icon: Building2,
  },
  {
    id: "arvr",
    label: "AR / VR",
    title: "AR / VR & XR",
    href: "/usecase/arvr",
    blurb: "Lightweight assets for immersive experiences.",
    Icon: Glasses,
  },
  {
    id: "productdesign",
    label: "Product design",
    title: "Product Visualization",
    href: "/usecase/productdesign",
    blurb: "Product models for marketing and digital commerce.",
    Icon: Package,
  },
];

export function getUseCaseNav(id: UseCaseId): UseCaseNavItem {
  const item = USE_CASE_NAV.find((u) => u.id === id);
  if (!item) throw new Error(`Unknown use case: ${id}`);
  return item;
}
