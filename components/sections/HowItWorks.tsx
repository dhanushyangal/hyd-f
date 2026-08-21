"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { BlurReveal } from "@/components/ui/BlurReveal";
import { cloudinaryImage } from "@/lib/cloudinary";

const DASHED = "repeating-linear-gradient(90deg, #d0d0d0 0 10px, transparent 10px 20px)";

/** Explicit WebP + width — avoids Next Image Optimizer timeouts on large f_auto PNGs. */
const workflowStepImage = (id: string) =>
  cloudinaryImage(`hydrilla-landing/workflow/${id}`, "f_webp,q_auto,c_fit,w_900");

const STEPS = [
  {
    id: "describe",
    number: "01",
    title: "Describe your asset",
    body: "Describe the asset or drop a reference image. Type a prompt or upload a still — BlueFox 1 uses either.",
    image: workflowStepImage("describe"),
    hoverImage: null as string | null,
  },
  {
    id: "generate",
    number: "02",
    title: "Generate with BlueFox 1",
    body: "BlueFox 1 generates a segmented mesh with PBR maps (base color, metalness, roughness, normals).",
    image: workflowStepImage("generated-model1"),
    hoverImage: workflowStepImage("generated-model2"),
  },
  {
    id: "preview",
    number: "03",
    title: "Preview in the browser",
    body: "Preview in the browser. Inspect materials and parts before you download.",
    image: workflowStepImage("generated-model2"),
    hoverImage: null as string | null,
  },
  {
    id: "export",
    number: "04",
    title: "Export to your pipeline",
    body: "Export GLB, FBX, OBJ, or USDZ and drop into your engine or DCC.",
    image: workflowStepImage("refine"),
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
      id="howitworks"
      style={{
        width: "100%",
        backgroundColor: "#ffffff",
        padding: "5rem 1.5rem 6rem",
        boxSizing: "border-box",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <p
            style={{
              margin: "0 0 0.625rem",
              fontFamily: "'DM Sans', sans-serif",
              fontSize: "0.6875rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#666",
            }}
          >
            Process
          </p>
          <BlurReveal
            as="h2"
            style={{
              margin: 0,
              fontFamily: "'RoobertVF', 'Roobert', 'DM Sans', sans-serif",
              fontSize: "clamp(1.875rem, 4vw, 3rem)",
              fontWeight: 700,
              color: "#111",
              letterSpacing: "-0.035em",
              lineHeight: 1.15,
            }}
          >
            How it works
          </BlurReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-start">
          {/* Left: image stays aligned with the step list */}
          <div className="hidden md:flex order-2 md:order-1 items-start">
            <div
              onMouseEnter={() => setImageHovered(true)}
              onMouseLeave={() => setImageHovered(false)}
              className="w-full relative sticky top-24 rounded-2xl overflow-hidden bg-[#f5f4f2] aspect-[4/5] max-h-[520px]"
              style={{
                cursor: activeStep.hoverImage ? "pointer" : "default",
                boxShadow: "0 1px 2px rgba(17,17,17,0.04), 0 12px 32px -16px rgba(17,17,17,0.12)",
                border: "1px solid rgba(17,17,17,0.06)",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${activeId}-${displaySrc}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="absolute inset-0"
                >
                  <Image
                    src={displaySrc}
                    alt=""
                    fill
                    unoptimized
                    className="object-contain object-center p-4"
                    sizes="(max-width: 768px) 100vw, 50vw"
                    loading="lazy"
                    decoding="async"
                  />
                </motion.div>
              </AnimatePresence>
              {activeStep.hoverImage && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: imageHovered ? 0 : 1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute bottom-4 right-4 px-3 py-1.5 rounded-full bg-black/55 backdrop-blur-sm text-white text-[11px] font-medium tracking-wide pointer-events-none"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  Hover to reveal
                </motion.div>
              )}
            </div>
          </div>

          {/* Right: steps */}
          <div className="order-1 md:order-2 flex flex-col gap-4 md:gap-0">
            <div aria-hidden className="h-px w-full md:block hidden" style={{ background: DASHED }} />
            {STEPS.map((step, i) => {
              const isActive = step.id === activeId;
              return (
                <div key={step.id}>
                  {/* Mobile card */}
                  <div
                    onTouchStart={() => setActiveId(step.id)}
                    className="md:hidden flex flex-col gap-0 rounded-[1.5rem] bg-white cursor-default border border-neutral-100 shadow-sm overflow-hidden transition-[transform,box-shadow] duration-300 active:scale-[0.99]"
                    style={{
                      fontFamily: "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  >
                    <div className="relative w-full bg-[#f5f4f2]" style={{ aspectRatio: "16/9" }}>
                      <Image
                        src={step.image}
                        alt={step.title}
                        fill
                        unoptimized
                        className="object-contain object-center"
                        sizes="100vw"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="flex flex-col gap-3 p-5">
                      <span
                        className="block text-xs font-bold tracking-widest uppercase text-neutral-500"
                        style={{ fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}
                      >
                        Step {step.number}
                      </span>
                      <h3
                        className="text-xl font-bold leading-snug text-neutral-900 m-0"
                        style={{
                          fontFamily: "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif",
                          letterSpacing: "-0.025em",
                        }}
                      >
                        {step.title}
                      </h3>
                      <p className="m-0 text-sm text-neutral-500 leading-relaxed" style={{ letterSpacing: "-0.01em" }}>
                        {step.body}
                      </p>
                    </div>
                  </div>

                  {/* Desktop row */}
                  <div
                    onMouseEnter={() => setActiveId(step.id)}
                    className="hidden md:grid grid-cols-[8.5rem_1fr] gap-6 lg:gap-8 py-7 cursor-default transition-colors duration-200"
                    style={{
                      minHeight: "11.5rem",
                      alignItems: "start",
                    }}
                  >
                    <div className="pt-0.5">
                      <span
                        className="block text-xs font-semibold uppercase tracking-[0.12em] transition-colors duration-200"
                        style={{
                          fontFamily: "'DM Sans', sans-serif",
                          color: isActive ? "#111" : "#999",
                        }}
                      >
                        Step {step.number}
                      </span>
                      <span
                        className="block mt-2 text-[1.0625rem] font-semibold leading-snug transition-colors duration-200"
                        style={{
                          fontFamily: "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif",
                          letterSpacing: "-0.02em",
                          color: isActive ? "#111" : "#8a8a8a",
                        }}
                      >
                        {step.title}
                      </span>
                    </div>
                    <motion.p
                      animate={{
                        opacity: isActive ? 1 : 0.4,
                        color: isActive ? "#525252" : "#8a8a8a",
                      }}
                      transition={{ duration: 0.2 }}
                      className="m-0 text-[1.0625rem] leading-[1.65]"
                      style={{
                        fontFamily: "'DM Sans', sans-serif",
                        letterSpacing: "-0.01em",
                      }}
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
