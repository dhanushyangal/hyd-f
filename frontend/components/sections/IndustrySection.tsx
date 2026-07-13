"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { BlurReveal } from "@/components/ui/BlurReveal";

const CLOUDINARY_LANDING_BASE =
  "https://res.cloudinary.com/dqizbxc9e/image/upload";

const industryImage = (id: string, transform = "f_auto,q_auto,c_fill,w_420,h_590") =>
  `${CLOUDINARY_LANDING_BASE}/${transform}/v1/hydrilla-landing/industrypower/${id}`;

/* ─────────────────────────── data ─────────────────────────── */
const INDUSTRIES = [
  {
    id: "game",
    title: "Game Development",
    image: industryImage("dino"),
    mobileImage: industryImage("dino", "f_auto,q_auto,c_fill,w_900,h_675"),
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
    mobileImage: industryImage("films-a", "f_auto,q_auto,c_fill,w_900,h_675"),
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
    mobileImage: industryImage("architecture", "f_auto,q_auto,c_fill,w_900,h_675"),
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
    mobileImage: industryImage("arvr1", "f_auto,q_auto,c_fill,w_900,h_675"),
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
    mobileImage: industryImage("lampprop", "f_auto,q_auto,c_fill,w_900,h_675"),
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

/* ─────────────────── gradient overlay ──────────── */
function CardGradient({ active }: { active: boolean }) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        borderRadius: "inherit",
        zIndex: 0,
        opacity: active ? 1 : 0,
        transition: "opacity 0.35s cubic-bezier(0.215,0.61,0.355,1)",
        background: [
          "radial-gradient(ellipse 95% 65% at 50% 120%, rgba(102,190,255,0.65) 0%, rgba(113,225,255,0.35) 40%, transparent 68%)",
          "radial-gradient(ellipse 60% 45% at 20% 120%, rgba(162,97,245,0.22) 0%, transparent 55%)",
          "radial-gradient(ellipse 50% 35% at 80% 115%, rgba(71,209,177,0.18) 0%, transparent 60%)",
        ].join(", "),
      }}
    />
  );
}

/* ─────────────────────────── component ─────────────────────── */
export default function IndustrySection() {
  const [activeId, setActiveId] = useState<IndustryId>("game");
  const [mobileOpenId, setMobileOpenId] = useState<IndustryId | null>(null);
  const activeItem = INDUSTRIES.find((i) => i.id === activeId) ?? INDUSTRIES[0];

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        backgroundColor: "#ffffff",
        padding: "4.5rem 1.5rem 5rem",
        boxSizing: "border-box",
        WebkitFontSmoothing: "antialiased",
        textRendering: "optimizeLegibility",
      }}
      className="max-sm:px-4 max-sm:py-12"
    >
      <div
        style={{
          maxWidth: "72rem",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "1.75rem",
        }}
      >
        {/* Heading — scroll blur → sharp reveal */}
        <BlurReveal
          as="h2"
          style={{
            margin: 0,
            textAlign: "center",
            fontFamily: "'RoobertVF', 'Roobert', 'DM Sans', sans-serif",
            fontSize: "clamp(1.875rem, 4vw, 3rem)",
            fontWeight: 700,
            color: "#111",
            letterSpacing: "-0.035em",
            lineHeight: 1.15,
          }}
        >
          Built to{" "}
          <em style={{ fontStyle: "italic", fontWeight: 700, letterSpacing: "-0.04em" }}>
            power
          </em>
          <br />
          creators like you
        </BlurReveal>

        {/* ── MOBILE accordion ── */}
        <div className="flex flex-col gap-3 md:hidden">
          {INDUSTRIES.map((item) => {
            const isOpen = mobileOpenId === item.id;
            return (
              <div
                key={item.id}
                style={{
                  borderRadius: "1rem",
                  border: `1px solid ${isOpen ? "rgba(17,17,17,0.12)" : "rgba(17,17,17,0.08)"}`,
                  backgroundColor: "#ffffff",
                  overflow: "hidden",
                  transition: "border-color 0.2s, background-color 0.2s",
                  boxShadow: isOpen ? "0 1px 2px rgba(17,17,17,0.04)" : "none",
                }}
              >
                {/* Accordion header */}
                <button
                  type="button"
                  onClick={() => setMobileOpenId(isOpen ? null : item.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "1rem 1.125rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'RoobertVF', 'Roobert', 'DM Sans', sans-serif",
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "#111",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.3,
                      textAlign: "left",
                    }}
                  >
                    {item.title}
                  </span>
                  <span
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      backgroundColor: isOpen ? "#111" : "rgba(17,17,17,0.07)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      transition: "background-color 0.2s",
                      marginLeft: "0.75rem",
                    }}
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      style={{
                        color: isOpen ? "#fff" : "#111",
                        transform: isOpen ? "rotate(45deg)" : "rotate(0deg)",
                        transition: "transform 0.2s ease",
                      }}
                    >
                      <path
                        d="M6 1v10M1 6h10"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                </button>

                {/* Accordion body */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] as const }}
                      style={{ overflow: "hidden" }}
                    >
                      <div style={{ padding: "0 1.125rem 1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                        {/* Image */}
                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            borderRadius: "0.75rem",
                            overflow: "hidden",
                            backgroundColor: "#f5f5f5",
                            aspectRatio: "4/3",
                          }}
                        >
                          <Image
                            src={item.mobileImage}
                            alt={item.title}
                            fill
                            style={{ objectFit: "cover", objectPosition: "center" }}
                            sizes="100vw"
                            loading="lazy"
                            decoding="async"
                            unoptimized
                          />
                          <CardGradient active={true} />
                        </div>

                        {/* Heading */}
                        <h3
                          style={{
                            margin: 0,
                            fontFamily: "'RoobertVF', 'Roobert', 'DM Sans', sans-serif",
                            fontSize: "1.125rem",
                            fontWeight: 700,
                            color: "#111",
                            letterSpacing: "-0.025em",
                            lineHeight: 1.25,
                          }}
                        >
                          {item.leftHeading}
                        </h3>

                        {/* Feature bullets */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
                          {item.features.map((f, fi) => (
                            <div key={f.title}>
                              {fi > 0 && <div style={{ borderTop: "1px solid rgba(17,17,17,0.07)", marginBottom: "0.875rem" }} />}
                              <h4
                                style={{
                                  margin: "0 0 0.3rem",
                                  fontFamily: "'DM Sans', sans-serif",
                                  fontSize: "0.9375rem",
                                  fontWeight: 600,
                                  color: "#111",
                                  letterSpacing: "-0.015em",
                                }}
                              >
                                {f.title}
                              </h4>
                              <p
                                style={{
                                  margin: 0,
                                  fontFamily: "'DM Sans', sans-serif",
                                  fontSize: "0.875rem",
                                  color: "#666",
                                  lineHeight: 1.65,
                                }}
                              >
                                {f.body}
                              </p>
                            </div>
                          ))}
                        </div>

                        <CtaLink label={item.ctaLabel} href={item.ctaHref} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* ── DESKTOP tab card ── */}
        <div className="hidden md:block">

        {/* Main card */}
        <div
          style={{
            borderRadius: "1rem",
            border: "1px solid rgba(17,17,17,0.08)",
            backgroundColor: "#ffffff",
            boxShadow: "0 1px 2px rgba(17,17,17,0.04), 0 8px 24px -12px rgba(17,17,17,0.08)",
            overflow: "hidden",
          }}
        >
          {/* Industry tabs row */}
          <div style={{ display: "flex", gap: "0.5rem", padding: "0.625rem", alignItems: "stretch" }}>
            {INDUSTRIES.map((item) => {
              const isActive = item.id === activeId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveId(item.id)}
                  aria-pressed={isActive ? "true" : "false"}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    background: "transparent",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    borderRadius: "0.5rem",
                    outline: "none",
                    WebkitTapHighlightColor: "transparent",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      width: "100%",
                      height: "100%",
                      overflow: "hidden",
                      borderRadius: "0.5rem",
                      border: `1px solid ${isActive ? "rgba(17,17,17,0.12)" : "rgba(17,17,17,0.06)"}`,
                      backgroundColor: isActive ? "#ffffff" : "#fafafa",
                      padding: "0.75rem 0.375rem 1.25rem",
                      boxShadow: isActive
                        ? "0 1px 2px rgba(17,17,17,0.04), 0 6px 16px -8px rgba(17,17,17,0.1)"
                        : "none",
                      transition: "background-color 0.25s cubic-bezier(0.215,0.61,0.355,1), border-color 0.25s, box-shadow 0.25s",
                    }}
                  >
                    <span
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "center",
                        fontFamily: "'DM Sans', sans-serif",
                        fontSize: "0.6875rem",
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "#111" : "rgba(17,17,17,0.42)",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.4,
                        marginBottom: "0.625rem",
                        position: "relative",
                        zIndex: 10,
                        transition: "color 0.25s cubic-bezier(0.215,0.61,0.355,1), font-weight 0.25s",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        paddingInline: "0.25rem",
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </span>

                    <div
                      style={{
                        position: "relative",
                        zIndex: 10,
                        flexShrink: 0,
                        margin: "0 auto",
                        overflow: "hidden",
                        borderRadius: "0.25rem",
                        height: "14.5rem",
                        width: "min(100%, calc(14.5rem * 161.19 / 226))",
                        aspectRatio: "161.19 / 226",
                      }}
                    >
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        style={{
                          objectFit: "cover",
                          objectPosition: "center",
                          opacity: isActive ? 1 : 0.28,
                          transition: "opacity 0.3s cubic-bezier(0.215,0.61,0.355,1)",
                        }}
                        sizes="(max-width: 640px) 22vw, (max-width: 1024px) 18vw, 161px"
                        loading={isActive ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={isActive ? "high" : "low"}
                        unoptimized
                      />
                    </div>

                    <CardGradient active={isActive} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Animated bottom content */}
          <div style={{ borderTop: "1px solid rgba(17,17,17,0.06)", minHeight: "12rem", overflow: "hidden" }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: [0.215, 0.61, 0.355, 1] as const }}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "3.5rem",
                  padding: "2.5rem 2.75rem 2.75rem",
                }}
              >
                {/* Left */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "1.25rem",
                    flexShrink: 0,
                    maxWidth: "42%",
                    minWidth: "min(260px, 40%)",
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "'RoobertVF', 'Roobert', 'DM Sans', sans-serif",
                      fontSize: "clamp(1.375rem, 2.4vw, 1.875rem)",
                      fontWeight: 700,
                      color: "#111",
                      letterSpacing: "-0.03em",
                      lineHeight: 1.2,
                    }}
                  >
                    {activeItem.leftHeading}
                  </h3>
                  <CtaLink label={activeItem.ctaLabel} href={activeItem.ctaHref} />
                </div>

                {/* Right – feature bullets */}
                <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
                  {activeItem.features.map((f, i) => (
                    <div key={f.title}>
                      {i > 0 && (
                        <div style={{ borderTop: "1px solid rgba(17,17,17,0.07)", margin: "1.25rem 0" }} />
                      )}
                      <h4
                        style={{
                          margin: "0 0 0.375rem",
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "1.0625rem",
                          fontWeight: 600,
                          color: "#111",
                          letterSpacing: "-0.02em",
                          lineHeight: 1.3,
                        }}
                      >
                        {f.title}
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: "0.9375rem",
                          fontWeight: 400,
                          color: "#666",
                          letterSpacing: "-0.01em",
                          lineHeight: 1.7,
                        }}
                      >
                        {f.body}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        </div> {/* end hidden md:block desktop wrapper */}
      </div>
    </section>
  );
}

/* ── CTA link ── */
function CtaLink({ label, href }: { label: string; href: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href={href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        alignSelf: "flex-start",
        padding: "0.5625rem 1.125rem",
        borderRadius: "0.625rem",
        border: `1px solid ${hovered ? "rgba(17,17,17,0.18)" : "rgba(17,17,17,0.10)"}`,
        backgroundColor: hovered ? "rgba(17,17,17,0.04)" : "transparent",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: "0.8125rem",
        fontWeight: 500,
        color: "#111",
        letterSpacing: "-0.01em",
        textDecoration: "none",
        transition: "background-color 0.18s, border-color 0.18s",
        whiteSpace: "nowrap",
        cursor: "pointer",
      }}
    >
      {label}
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden style={{ flexShrink: 0 }}>
        <path
          d="M2.5 6.5h8M8 4L10.5 6.5 8 9"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}
