"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { BlurReveal } from "@/components/ui/BlurReveal";
import { cloudinaryImage } from "@/lib/cloudinary";
import { SANS_FONT as DISPLAY, GEIST_FONT as SANS } from "@/lib/fonts";

/** Explicit WebP + width — avoids Next Image Optimizer timeouts on large f_auto PNGs. */
const workflowStepImage = (id: string) =>
  cloudinaryImage(`hydrilla-landing/workflow/${id}`, "f_webp,q_auto,c_fit,w_900");

type Step = {
  id: string;
  number: string;
  title: string;
  body: string;
  image: string;
  hoverImage: string | null;
};

const STEPS: Step[] = [
  {
    id: "describe",
    number: "01",
    title: "Describe your asset.",
    body: "Type a prompt or drop a reference image. BlueFox 1 takes either.",
    image: workflowStepImage("describe"),
    hoverImage: null,
  },
  {
    id: "generate",
    number: "02",
    title: "Generate with BlueFox 1.",
    body: "BlueFox 1 produces a segmented mesh with PBR maps — base color, metalness, roughness, and normals.",
    image: workflowStepImage("generated-model1"),
    hoverImage: workflowStepImage("generated-model2"),
  },
  {
    id: "refine",
    number: "03",
    title: "Refine and export.",
    body: "Inspect materials in the browser, then export GLB, FBX, OBJ, or USDZ into your engine or DCC.",
    image: workflowStepImage("refine"),
    hoverImage: null,
  },
];

/* Design tokens (mirrors the reference system) */
const INK = "#000c1f"; // --color-blue-900
const INK_SECONDARY = "rgba(0, 12, 31, 0.65)"; // --color-text-secondary
const INK_TERTIARY = "rgba(0, 12, 31, 0.45)"; // --color-text-tertiary
const SURFACE = "#f7f7f7"; // --color-grey-50
const EASE_OUT_QUINT: [number, number, number, number] = [0.22, 1, 0.36, 1];


function SwapIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      style={{
        transition: "transform 400ms cubic-bezier(0.22, 1, 0.36, 1)",
        transform: active ? "rotate(180deg)" : "rotate(0deg)",
      }}
    >
      <path
        d="M2.5 5.5h9m0 0L9 3m2.5 2.5L9 8M13.5 10.5h-9m0 0L7 8m-2.5 2.5L7 13"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepRow({ step }: { step: Step }) {
  const reduceMotion = useReducedMotion();
  const [showAlt, setShowAlt] = useState(false);
  const hasAlt = Boolean(step.hoverImage);

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, ease: EASE_OUT_QUINT }}
      className="grid w-full grid-cols-1 items-center gap-8 md:grid-cols-12 md:gap-x-4 md:gap-y-0"
    >
      {/* Media card — square, large radius, soft surface */}
      <div className="flex min-w-0 justify-center md:col-span-5 md:col-start-2 lg:col-span-4 lg:col-start-3">
        <div
          onPointerEnter={(e) => {
            if (hasAlt && e.pointerType === "mouse") setShowAlt(true);
          }}
          onPointerLeave={(e) => {
            if (hasAlt && e.pointerType === "mouse") setShowAlt(false);
          }}
          className="relative aspect-square w-full max-w-[34rem] overflow-hidden rounded-[2rem] md:rounded-[2.5rem]"
          style={{ backgroundColor: SURFACE }}
        >
          <Image
            src={step.image}
            alt={step.title.replace(/\.$/, "")}
            fill
            unoptimized
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 100vw, 40vw"
            className="object-contain object-center p-5 transition-opacity duration-500 ease-out md:p-6"
            style={{ opacity: showAlt ? 0 : 1 }}
          />
          {step.hoverImage && (
            <Image
              src={step.hoverImage}
              alt=""
              aria-hidden
              fill
              unoptimized
              loading="lazy"
              decoding="async"
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-contain object-center p-5 transition-opacity duration-500 ease-out md:p-6"
              style={{ opacity: showAlt ? 1 : 0 }}
            />
          )}

          {hasAlt && (
            <button
              type="button"
              onClick={() => setShowAlt((v) => !v)}
              aria-pressed={showAlt}
              aria-label={showAlt ? "Show first result" : "Show second result"}
              className="absolute bottom-4 right-4 inline-flex h-11 w-11 items-center justify-center rounded-full text-white outline-none backdrop-blur-md transition-transform duration-200 ease-out hover:bg-black/75 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/60 active:scale-[0.96] md:bottom-5 md:right-5"
              style={{
                backgroundColor: "rgba(12, 12, 12, 0.6)",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <SwapIcon active={showAlt} />
            </button>
          )}
        </div>
      </div>

      {/* Copy */}
      <div className="flex min-w-0 flex-col justify-center px-6 md:col-span-4 md:col-start-8 md:px-0 lg:col-span-3 lg:col-start-8">
        <div className="mx-auto flex w-full max-w-md flex-col gap-4 md:mx-0 md:max-w-xs lg:max-w-sm">
          <span
            className="text-xs font-medium uppercase"
            style={{ color: INK_TERTIARY, letterSpacing: "0.1em", fontFamily: DISPLAY }}
          >
            Step {step.number}
          </span>
          <h3
            className="m-0"
            style={{
              fontFamily: DISPLAY,
              fontWeight: 400,
              color: INK,
              fontSize: "clamp(2rem, 1.6rem + 1.6vw, 2.75rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              textWrap: "balance",
            }}
          >
            {step.title}
          </h3>
          <p
            className="m-0"
            style={{
              fontFamily: SANS,
              color: INK_SECONDARY,
              fontSize: "clamp(1.125rem, 1.05rem + 0.3vw, 1.25rem)",
              lineHeight: 1.5,
              letterSpacing: "-0.02em",
              textWrap: "pretty",
            }}
          >
            {step.body}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

export default function HowItWorks() {
  return (
    <section
      id="howitworks"
      aria-labelledby="howitworks-heading"
      className="w-full bg-white"
      style={{
        padding: "clamp(4.5rem, 3rem + 6vw, 9rem) 0",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div
        className="mx-auto flex flex-col items-center"
        style={{
          width: "min(100% - 2rem, 87rem)",
          gap: "clamp(4rem, 2.5rem + 6vw, 7.5rem)",
        }}
      >
        <header className="flex flex-col items-center gap-3 px-6 text-center">
          <p
            className="m-0 text-xs font-medium uppercase"
            style={{ color: INK_TERTIARY, letterSpacing: "0.1em", fontFamily: DISPLAY }}
          >
            Process
          </p>
          <BlurReveal
            as="h2"
            id="howitworks-heading"
            style={{
              margin: 0,
              fontFamily: DISPLAY,
              fontSize: "clamp(2.25rem, 1.7rem + 2.4vw, 3.75rem)",
              fontWeight: 400,
              color: INK,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
            }}
          >
            How it works
          </BlurReveal>
        </header>

        <div
          className="flex w-full flex-col"
          style={{ gap: "clamp(4rem, 2.5rem + 6vw, 7.5rem)" }}
        >
          {STEPS.map((step) => (
            <StepRow key={step.id} step={step} />
          ))}
        </div>
      </div>
    </section>
  );
}
