"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { BlurReveal } from "@/components/ui/BlurReveal";
import { SANS_FONT as DISPLAY, GEIST_FONT as SANS } from "@/lib/fonts";

const CLOUDINARY_LANDING_BASE =
  "https://res.cloudinary.com/dqizbxc9e/image/upload";

const industryImage = (id: string, transform = "f_webp,q_auto,c_fill,w_420,h_590") =>
  `${CLOUDINARY_LANDING_BASE}/${transform}/v1/hydrilla-landing/industrypower/${id}`;

/* ─────────────────────────── data ─────────────────────────── */
const INDUSTRIES = [
  {
    id: "game",
    title: "Game Development",
    image: industryImage("dino"),
    mobileImage: industryImage("dino", "f_webp,q_auto,c_fill,w_900,h_675"),
    leftHeading: "Assets built for real-time production",
    ctaLabel: "Explore Game Development",
    ctaHref: "/usecase/gamedev",
    features: [
      {
        title: "Game-engine compatible models",
        body: "Generate characters, props, and environments with clean geometry suitable for Unreal Engine, Unity, and other real-time pipelines.",
      },
      {
        title: "Consistent asset iteration",
        body: "Create multiple variations of models while maintaining consistent style and scale across your game world.",
      },
    ],
  },
  {
    id: "film",
    title: "Film & Animation",
    image: industryImage("films-a"),
    mobileImage: industryImage("films-a", "f_webp,q_auto,c_fill,w_900,h_675"),
    leftHeading: "Production assets for cinematic pipelines",
    ctaLabel: "Explore Film & Animation",
    ctaHref: "/usecase/filmproduction",
    features: [
      {
        title: "High-fidelity asset generation",
        body: "Create detailed models for characters, props, and environments that integrate into animation and VFX workflows.",
      },
      {
        title: "Faster concept exploration",
        body: "Generate visual variations early in production to help teams refine direction before final modeling and texturing.",
      },
    ],
  },
  {
    id: "arc",
    title: "Architecture & Interiors",
    image: industryImage("architecture"),
    mobileImage: industryImage("architecture", "f_webp,q_auto,c_fill,w_900,h_675"),
    leftHeading: "Architectural visualization assets",
    ctaLabel: "Explore Architecture",
    ctaHref: "/usecase/architecture",
    features: [
      {
        title: "Interior and structural elements",
        body: "Generate furniture, architectural components, and interior objects suitable for visualization workflows.",
      },
      {
        title: "Rapid design iteration",
        body: "Explore layout and design variations quickly before committing to final modeling and rendering.",
      },
    ],
  },
  {
    id: "arch",
    title: "AR / VR & XR",
    image: industryImage("arvr1"),
    mobileImage: industryImage("arvr1", "f_webp,q_auto,c_fill,w_900,h_675"),
    leftHeading: "Assets designed for immersive environments",
    ctaLabel: "Explore XR Solutions",
    ctaHref: "/usecase/arvr",
    features: [
      {
        title: "Real-time optimized models",
        body: "Create lightweight assets suitable for interactive environments, simulations, and spatial applications.",
      },
      {
        title: "Rapid spatial prototyping",
        body: "Generate objects and environments quickly while developing immersive experiences.",
      },
    ],
  },
  {
    id: "prop",
    title: "Product Visualization",
    image: industryImage("lampprop"),
    mobileImage: industryImage("lampprop", "f_webp,q_auto,c_fill,w_900,h_675"),
    leftHeading: "Product assets for visualization and marketing",
    ctaLabel: "Explore Product Visualization",
    ctaHref: "/usecase/productdesign",
    features: [
      {
        title: "Clean product model generation",
        body: "Create detailed models suitable for product visualization, marketing assets, and e-commerce experiences.",
      },
      {
        title: "Flexible concept presentation",
        body: "Turn early product ideas into visual assets that teams can use across design, marketing, and presentation workflows.",
      },
    ],
  },
] as const;

type IndustryId = (typeof INDUSTRIES)[number]["id"];

/* ─────────────────────────── tokens (same palette as How it works) ─────────────────────────── */
const INK = "#000c1f";
const INK_SECONDARY = "rgba(0, 12, 31, 0.65)";
const INK_TERTIARY = "rgba(0, 12, 31, 0.45)";
const HAIRLINE = "rgba(0, 12, 31, 0.1)";
const SURFACE = "#f7f7f7";
/** Soft brand-blue light rising from the bottom of the active tile. Blue only. */
const BLUE_GLOW = [
  "radial-gradient(ellipse 95% 62% at 50% 118%, rgba(0, 102, 197, 0.34) 0%, rgba(113, 225, 255, 0.24) 42%, transparent 72%)",
].join(", ");

const EASE_OUT_QUINT: [number, number, number, number] = [0.22, 1, 0.36, 1];

type Industry = (typeof INDUSTRIES)[number];

/* ─────────────────────────── pieces ─────────────────────────── */
function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M2.5 7h9M8 3.5 11.5 7 8 10.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Outlined CTA — fills with ink on hover. Colours live in classes so hover states can override them. */
function CtaLink({ label, href, block = false }: { label: string; href: string; block?: boolean }) {
  return (
    <Link
      href={href}
      className={`group inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[rgba(0,12,31,0.2)] bg-white px-5 text-sm font-medium text-[#000c1f] no-underline outline-none transition-[transform,background-color,color,border-color] duration-200 ease-out hover:border-[#000c1f] hover:bg-[#000c1f] hover:text-white focus-visible:ring-2 focus-visible:ring-[#000c1f] focus-visible:ring-offset-2 active:scale-[0.98] ${
        block ? "w-full" : "self-start"
      }`}
      style={{ fontFamily: DISPLAY, letterSpacing: "-0.01em" }}
    >
      {label}
      <span className="transition-transform duration-200 ease-out group-hover:translate-x-0.5">
        <ArrowIcon />
      </span>
    </Link>
  );
}

function Features({ items }: { items: Industry["features"] }) {
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {items.map((f, i) => (
        <li
          key={f.title}
          className="flex flex-col gap-2 py-6 first:pt-0 last:pb-0"
          style={i > 0 ? { borderTop: `1px solid ${HAIRLINE}` } : undefined}
        >
          <h4
            className="m-0 text-lg font-medium"
            style={{ fontFamily: DISPLAY, color: INK, letterSpacing: "-0.02em", lineHeight: 1.3 }}
          >
            {f.title}
          </h4>
          <p
            className="m-0 text-base"
            style={{
              fontFamily: SANS,
              color: INK_SECONDARY,
              letterSpacing: "-0.015em",
              lineHeight: 1.55,
            }}
          >
            {f.body}
          </p>
        </li>
      ))}
    </ul>
  );
}

const panelHeadingStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: DISPLAY,
  fontWeight: 400,
  color: INK,
  fontSize: "clamp(1.625rem, 1.35rem + 1vw, 2.25rem)",
  lineHeight: 1.12,
  letterSpacing: "-0.03em",
  textWrap: "balance",
};

/* ─────────────────────────── section ─────────────────────────── */
export default function IndustrySection() {
  const reduceMotion = useReducedMotion();
  const [activeId, setActiveId] = useState<IndustryId>(INDUSTRIES[0].id);
  const [mobileOpenId, setMobileOpenId] = useState<IndustryId | null>(INDUSTRIES[0].id);
  const active = INDUSTRIES.find((i) => i.id === activeId) ?? INDUSTRIES[0];

  const onTabKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const idx = INDUSTRIES.findIndex((i) => i.id === activeId);
    const next =
      (idx + (e.key === "ArrowRight" ? 1 : -1) + INDUSTRIES.length) % INDUSTRIES.length;
    setActiveId(INDUSTRIES[next].id);
    requestAnimationFrame(() => {
      document.getElementById(`industry-tab-${INDUSTRIES[next].id}`)?.focus();
    });
  };

  const swap = reduceMotion
    ? {}
    : {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition: { duration: 0.3, ease: EASE_OUT_QUINT },
      };

  return (
    <section
      aria-labelledby="industry-heading"
      className="w-full bg-white"
      style={{
        padding: "clamp(4.5rem, 3rem + 6vw, 9rem) 0",
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div
        className="mx-auto flex flex-col"
        style={{
          width: "min(100% - 2rem, 87rem)",
          gap: "clamp(2.5rem, 2rem + 3vw, 4.5rem)",
        }}
      >
        {/* Header */}
        <header className="flex flex-col items-center gap-4 px-2 text-center">
          <p
            className="m-0 text-xs font-medium uppercase"
            style={{ color: INK_TERTIARY, letterSpacing: "0.1em", fontFamily: DISPLAY }}
          >
            Industries
          </p>
          <BlurReveal
            as="h2"
            id="industry-heading"
            style={{
              margin: 0,
              fontFamily: DISPLAY,
              fontWeight: 400,
              color: INK,
              fontSize: "clamp(2.25rem, 1.7rem + 2.4vw, 3.75rem)",
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
              textWrap: "balance",
            }}
          >
            Built to power creators like you
          </BlurReveal>
        </header>

        {/* ───────── Mobile: accordion ───────── */}
        <div className="flex flex-col gap-3 md:hidden">
          {INDUSTRIES.map((item, i) => {
            const isOpen = mobileOpenId === item.id;
            return (
              <div
                key={item.id}
                className="overflow-hidden rounded-[1.5rem] bg-white transition-[border-color,box-shadow] duration-300"
                style={{
                  border: `1px solid ${isOpen ? "rgba(0, 12, 31, 0.22)" : "rgba(0, 12, 31, 0.08)"}`,
                  boxShadow: isOpen ? "0 10px 40px rgba(1, 14, 36, 0.08)" : "none",
                }}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`industry-body-${item.id}`}
                  onClick={() => setMobileOpenId(isOpen ? null : item.id)}
                  className="flex w-full items-center gap-4 bg-transparent px-5 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#000c1f]"
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  <span
                    aria-hidden
                    className="w-7 shrink-0 text-lg"
                    style={{
                      fontFamily: DISPLAY,
                      color: isOpen ? INK : INK_TERTIARY,
                      transition: "color 0.25s",
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="min-w-0 flex-1 text-[1.0625rem] font-medium"
                    style={{ fontFamily: DISPLAY, color: INK, letterSpacing: "-0.02em", lineHeight: 1.3 }}
                  >
                    {item.title}
                  </span>
                  <span
                    aria-hidden
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors duration-200"
                    style={{ backgroundColor: isOpen ? INK : "rgba(0, 12, 31, 0.06)" }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      style={{
                        color: isOpen ? "#fff" : INK,
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                        transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1)",
                      }}
                    >
                      <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
                    </svg>
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`industry-body-${item.id}`}
                      initial={reduceMotion ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduceMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: EASE_OUT_QUINT }}
                      style={{ overflow: "hidden" }}
                    >
                      <div className="flex flex-col gap-6 px-5 pb-6">
                        <div
                          className="relative w-full overflow-hidden rounded-[1.25rem]"
                          style={{ aspectRatio: "4 / 3", backgroundColor: SURFACE }}
                        >
                          <Image
                            src={item.mobileImage}
                            alt={item.title}
                            fill
                            unoptimized
                            loading="lazy"
                            decoding="async"
                            sizes="100vw"
                            className="object-cover object-center"
                          />
                        </div>

                        <h3 style={panelHeadingStyle}>{item.leftHeading}</h3>
                        <Features items={item.features} />
                        <CtaLink label={item.ctaLabel} href={item.ctaHref} block />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* ───────── Desktop: tile row → panel ───────── */}
        <div
          className="relative mx-auto hidden w-full max-w-[72rem] overflow-hidden rounded-[2rem] bg-white md:block"
          style={{
            border: "1px solid rgba(0, 12, 31, 0.08)",
            boxShadow: "0 10px 40px rgba(1, 14, 36, 0.06)",
          }}
        >
          <div
            role="tablist"
            aria-label="Industries"
            onKeyDown={onTabKeyDown}
            className="grid grid-cols-5 gap-3 p-3"
          >
            {INDUSTRIES.map((item) => {
              const on = item.id === activeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  id={`industry-tab-${item.id}`}
                  aria-selected={on}
                  aria-controls="industry-panel"
                  tabIndex={on ? 0 : -1}
                  onClick={() => setActiveId(item.id)}
                  className="group relative flex min-w-0 cursor-pointer flex-col items-center gap-4 overflow-hidden rounded-2xl px-4 pb-5 pt-4 outline-none transition-[background-color,border-color] duration-200 ease-out hover:border-[rgba(0,12,31,0.22)] focus-visible:ring-2 focus-visible:ring-[#000c1f] focus-visible:ring-offset-2"
                  style={{
                    backgroundColor: "#ffffff",
                    border: `1px solid ${on ? "rgba(0, 12, 31, 0.24)" : "rgba(0, 12, 31, 0.08)"}`,
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 transition-opacity duration-500 ease-out"
                    style={{ background: BLUE_GLOW, opacity: on ? 1 : 0 }}
                  />
                  <span
                    className="relative block w-full truncate text-center text-[0.9375rem] font-medium transition-colors duration-200"
                    style={{
                      fontFamily: DISPLAY,
                      letterSpacing: "-0.015em",
                      color: on ? INK : INK_TERTIARY,
                    }}
                    title={item.title}
                  >
                    {item.title}
                  </span>
                  {/* multiply: the sketch's white ground melts into the tile, like a printed illustration */}
                  <span className="relative block aspect-[161/226] w-full overflow-hidden">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      unoptimized
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 1100px) 16vw, 190px"
                      className="object-cover object-center mix-blend-multiply transition-opacity duration-300 ease-out"
                      style={{ opacity: on ? 1 : 0.7 }}
                    />
                  </span>
                </button>
              );
            })}
          </div>

          <div aria-hidden className="mx-3" style={{ height: 1, backgroundColor: HAIRLINE }} />

          <div
            id="industry-panel"
            role="tabpanel"
            aria-labelledby={`industry-tab-${active.id}`}
            className="px-8 pb-14 pt-12 lg:px-16"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.id}
                {...swap}
                className="grid grid-cols-12 items-start gap-x-10"
              >
                <div className="col-span-5 flex flex-col items-start gap-7">
                  <h3 style={panelHeadingStyle}>{active.leftHeading}</h3>
                  <CtaLink label={active.ctaLabel} href={active.ctaHref} />
                </div>
                <div className="col-span-6 col-start-7 lg:col-span-5 lg:col-start-8">
                  <Features items={active.features} />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
