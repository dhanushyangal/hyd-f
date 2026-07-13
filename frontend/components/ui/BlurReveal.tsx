"use client";

import {
  Children,
  isValidElement,
  type CSSProperties,
  type ReactNode,
} from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

const MOTION_TAGS = {
  div: motion.div,
  span: motion.span,
  p: motion.p,
  h1: motion.h1,
  h2: motion.h2,
  h3: motion.h3,
  header: motion.header,
} as const;

type BlurRevealTag = keyof typeof MOTION_TAGS;

type WordUnit =
  | { kind: "word"; text: string; italic?: boolean }
  | { kind: "br" };

function pushWords(
  units: WordUnit[],
  text: string,
  italic?: boolean
) {
  const parts = text.split(/(\n+)/);
  for (const part of parts) {
    if (!part) continue;
    if (/^\n+$/.test(part)) {
      for (let i = 0; i < part.length; i++) units.push({ kind: "br" });
      continue;
    }
    for (const word of part.trim().split(/\s+/).filter(Boolean)) {
      units.push({ kind: "word", text: word, italic });
    }
  }
}

/** Flatten heading children into word tokens (supports <em>, <br />, newlines). */
function toWordUnits(children: ReactNode): WordUnit[] {
  const units: WordUnit[] = [];

  Children.forEach(children, (child) => {
    if (child == null || typeof child === "boolean") return;
    if (typeof child === "string" || typeof child === "number") {
      pushWords(units, String(child));
      return;
    }
    if (isValidElement<{ children?: ReactNode }>(child)) {
      const type = child.type;
      if (type === "br") {
        units.push({ kind: "br" });
        return;
      }
      if (type === "em" || type === "i") {
        pushWords(units, String(child.props.children ?? ""), true);
        return;
      }
      pushWords(units, String(child.props.children ?? ""));
    }
  });

  return units;
}

type BlurRevealProps = {
  children: ReactNode;
  as?: BlurRevealTag;
  className?: string;
  style?: CSSProperties;
  /** Delay before the first word */
  delay?: number;
  /** Stagger between words (seconds) — slower = more premium */
  stagger?: number;
  /** Per-word animation duration */
  duration?: number;
  margin?: string;
  blurPx?: number;
  y?: number;
  once?: boolean;
  id?: string;
};

/**
 * Heading scroll reveal — opacity + translate only (no CSS blur filters).
 * Blur-per-word was a major GPU cost on long marketing pages.
 */
export function BlurReveal({
  children,
  as = "div",
  className,
  style,
  delay = 0,
  stagger = 0.06,
  duration = 0.55,
  margin = "-10% 0px -6% 0px",
  blurPx = 0,
  y = 10,
  once = true,
  id,
}: BlurRevealProps) {
  const reduceMotion = useReducedMotion();
  const Tag = MOTION_TAGS[as];
  const units = toWordUnits(children);
  const words = units.filter((u) => u.kind === "word");
  const plainText = words.map((u) => (u as { text: string }).text).join(" ");
  // Cap expensive per-word work; long lines animate as a single block.
  const usePerWord = words.length > 0 && words.length <= 8;
  void blurPx;

  if (reduceMotion || words.length === 0) {
    const StaticTag = as;
    return (
      <StaticTag id={id} className={className} style={style}>
        {children}
      </StaticTag>
    );
  }

  if (!usePerWord) {
    return (
      <Tag
        id={id}
        className={cn(className)}
        style={style}
        initial={{ opacity: 0, y }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once, margin, amount: 0.35 }}
        transition={{ duration, delay, ease: EASE }}
      >
        {children}
      </Tag>
    );
  }

  let wordIndex = 0;

  return (
    <Tag
      id={id}
      className={cn(className)}
      style={style}
      aria-label={plainText}
    >
      <span aria-hidden className="inline">
        {units.map((unit, i) => {
          if (unit.kind === "br") {
            return <br key={`br-${i}`} />;
          }

          const index = wordIndex++;
          const isLast = index === words.length - 1;

          return (
            <motion.span
              key={`w-${i}-${unit.text}`}
              className={cn(
                "inline-block will-change-[opacity,transform]",
                unit.italic && "italic"
              )}
              style={{
                marginRight: isLast ? undefined : "0.28em",
              }}
              initial={{
                opacity: 0,
                y,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{ once, margin, amount: 0.35 }}
              transition={{
                duration,
                delay: delay + index * stagger,
                ease: EASE,
              }}
            >
              {unit.text}
            </motion.span>
          );
        })}
      </span>
    </Tag>
  );
}
