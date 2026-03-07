"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const DASHED = "repeating-linear-gradient(90deg, #d0d0d0 0 10px, transparent 10px 20px)";

const STEPS = [
  {
    id: "describe",
    number: "01",
    title: "Describe your asset",
    body: "Type a prompt or upload a reference image. Describe your character, environment, or prop in plain language—our AI understands context and intent.",
    image: "/workflow/describe.png",
    hoverImage: null as string | null,
  },
  {
    id: "generate",
    number: "02",
    title: "Generate in seconds",
    body: "Hydrilla's models produce a production-quality 3D asset instantly. View the result from every angle—wireframe to full texture.",
    image: "/workflow/generated-model1.png",
    hoverImage: "/workflow/generated-model2.png",
  },
  {
    id: "refine",
    number: "03",
    title: "Refine and export",
    body: "Iterate on your asset, adjust details, and export in the format your pipeline requires—GLB, FBX, OBJ, or USD.",
    image: "/workflow/refine.png",
    hoverImage: null as string | null,
  },
];

export default function HowItWorks() {
  const [activeId, setActiveId] = useState(STEPS[0].id);
  const [imageHovered, setImageHovered] = useState(false);

  const activeStep = STEPS.find((s) => s.id === activeId) ?? STEPS[0];
  const displaySrc =
    imageHovered && activeStep.hoverImage ? activeStep.hoverImage : activeStep.image;

  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "#ffffff",
        padding: "5rem 1.5rem 6rem",
        boxSizing: "border-box",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        {/* Section label + heading */}
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <p
            style={{
              margin: "0 0 0.625rem",
              fontFamily: "'DM Sans', Arial, sans-serif",
              fontSize: "0.6875rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#888",
            }}
          >
            Process
          </p>
          <h2
            style={{
              margin: 0,
              fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
              fontSize: "clamp(1.875rem, 4vw, 3rem)",
              fontWeight: 700,
              color: "#111",
              letterSpacing: "-0.035em",
              lineHeight: 1.15,
            }}
          >
            How it works
          </h2>
        </div>

        {/* Two-column grid: Image LEFT, Steps RIGHT */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-stretch"
          style={{ alignItems: "stretch" }}
        >
          {/* ── Left: Image panel (desktop only; mobile shows only step cards) ── */}
          <div className="hidden md:flex order-2 md:order-1 items-center">
            <div
              onMouseEnter={() => setImageHovered(true)}
              onMouseLeave={() => setImageHovered(false)}
              className="w-full relative rounded-xl overflow-hidden bg-[#f5f4f2] min-h-[280px] md:min-h-[360px] aspect-[4/5] max-h-[420px] md:max-h-[520px]"
              style={{ cursor: activeStep.hoverImage ? "pointer" : "default" }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={displaySrc}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.22, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={displaySrc}
                    alt=""
                    fill
                    className="object-contain object-center"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    unoptimized
                  />
                </motion.div>
              </AnimatePresence>
              {activeStep.hoverImage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: imageHovered ? 0 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium tracking-wide pointer-events-none"
                  style={{ fontFamily: "'DM Sans', Arial, sans-serif" }}
                >
                  Hover to reveal
                </motion.div>
              )}
            </div>
          </div>

          {/* ── Right: Steps (desktop: list; mobile: cards) ── */}
          <div className="order-1 md:order-2 flex flex-col gap-4 md:gap-0">
            {/* Desktop: dashed list with larger text */}
            <div aria-hidden className="h-px w-full md:block hidden" style={{ background: DASHED }} />
            {STEPS.map((step, i) => {
              const isActive = step.id === activeId;
              return (
                <div key={step.id}>
                  {/* Mobile: card per step */}
                  <div
                    onTouchStart={() => setActiveId(step.id)}
                    className="md:hidden flex flex-col gap-0 rounded-[1.5rem] bg-white cursor-default border border-neutral-100 shadow-sm overflow-hidden transition-[transform,box-shadow] duration-300 active:scale-[0.99]"
                    style={{
                      fontFamily: "var(--font-inter), 'DM Sans', Arial, sans-serif",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    {/* Image area */}
                    <div className="relative w-full bg-[#f5f4f2]" style={{ aspectRatio: "16/9" }}>
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        className="object-contain object-center"
                        sizes="100vw"
                        unoptimized
                      />
                    </div>
                    {/* Text content */}
                    <div className="flex flex-col gap-3 p-5">
                      <span
                        className="block text-xs font-bold tracking-widest uppercase text-neutral-400"
                        style={{ fontFamily: "var(--font-dm-sans), 'DM Sans', Arial, sans-serif" }}
                      >
                        Step {step.number}
                      </span>
                      <h3
                        className="text-xl font-bold leading-snug text-neutral-900 m-0"
                        style={{ fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif", letterSpacing: "-0.025em" }}
                      >
                        {step.title}
                      </h3>
                      <p className="m-0 text-sm text-neutral-500 leading-relaxed" style={{ letterSpacing: "-0.01em" }}>
                        {step.body}
                      </p>
                    </div>
                  </div>
                  {/* Desktop: grid row with larger text */}
                  <div
                    onMouseEnter={() => setActiveId(step.id)}
                    className="hidden md:grid grid-cols-[9rem_1fr] gap-4 md:gap-8 py-6 md:py-8 cursor-default"
                  >
                    <div>
                      <span
                        className="block text-xs md:text-sm font-medium uppercase tracking-widest transition-colors"
                        style={{
                          fontFamily: "'DM Sans', Arial, sans-serif",
                          color: isActive ? "#111" : "#aaa",
                        }}
                      >
                        Step {step.number}
                      </span>
                      <span
                        className="block mt-1 text-base md:text-lg font-semibold leading-snug transition-colors"
                        style={{
                          fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif",
                          color: isActive ? "#111" : "#999",
                        }}
                      >
                        {step.title}
                      </span>
                    </div>
                    <motion.p
                      animate={{ opacity: isActive ? 1 : 0.38 }}
                      transition={{ duration: 0.22 }}
                      className="m-0 text-base md:text-lg text-neutral-500 leading-relaxed"
                      style={{ fontFamily: "'DM Sans', Arial, sans-serif", letterSpacing: "-0.01em" }}
                    >
                      {step.body}
                    </motion.p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div aria-hidden className="hidden md:block h-px w-full" style={{ background: DASHED }} />
                  )}
                </div>
              );
            })}
            <div aria-hidden className="h-px w-full md:block hidden" style={{ background: DASHED }} />
          </div>
        </div>
      </div>
    </section>
  );
}
