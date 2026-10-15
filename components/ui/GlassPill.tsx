import type { ComponentPropsWithoutRef, ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type GlassPillTone = "glass" | "solid" | "disabled";

const toneClass: Record<GlassPillTone, string> = {
  glass: "",
  solid: "glass-pill-solid",
  disabled: "glass-pill-disabled",
};

type SharedProps = {
  children: ReactNode;
  tone?: GlassPillTone;
  wide?: boolean;
  className?: string;
};

export function GlassPillButton({
  children,
  tone = "glass",
  wide = false,
  className,
  disabled,
  ...props
}: SharedProps & ComponentPropsWithoutRef<"button">) {
  const isDisabled = disabled || tone === "disabled";
  return (
    <button
      type="button"
      disabled={isDisabled}
      className={cn("glass-pill", wide && "glass-pill-wide", toneClass[tone], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function GlassPillLink({
  children,
  tone = "glass",
  wide = false,
  className,
  href,
  ...props
}: SharedProps & ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      href={href}
      className={cn("glass-pill", wide && "glass-pill-wide", toneClass[tone], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
