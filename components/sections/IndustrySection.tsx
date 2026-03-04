"use client";

import React, { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────── data ─────────────────────────── */
const INDUSTRIES = [
  {
    id: "game",
    title: "Game Development",
    image: "/industrypower/dino.png",
    leftHeading: "Build game worlds faster",
    ctaLabel: "Explore Game Development",
    features: [
      {
        title: "Game-ready assets instantly",
        body: "Generate characters, props, and environments with clean topology optimized for engines like Unreal and Unity.",
      },
      {
        title: "Scale your asset pipeline",
        body: "Produce consistent asset variations quickly so teams can expand game worlds without slowing production.",
      },
    ],
  },
  {
    id: "film",
    title: "Film & Animation",
    image: "/industrypower/films%26a.png",
    leftHeading: "Create cinematic assets faster",
    ctaLabel: "Explore Film & Animation",
    features: [
      {
        title: "Cinematic-grade models",
        body: "Generate detailed characters, props, and environments suitable for animation and visual effects pipelines.",
      },
      {
        title: "Accelerate creative iteration",
        body: "Explore multiple visual concepts rapidly so artists can focus on storytelling and final refinement.",
      },
    ],
  },
  {
    id: "arc",
    title: "Architecture & Interiors",
    image: "/industrypower/architecture.png",
    leftHeading: "Design and visualize spaces instantly",
    ctaLabel: "Explore Architecture Solutions",
    features: [
      {
        title: "Architectural assets on demand",
        body: "Create interiors, furniture, and structural elements for faster concept development and visualization.",
      },
      {
        title: "Improve client presentations",
        body: "Generate multiple design variations quickly to explore layouts and materials before final production.",
      },
    ],
  },
  {
    id: "arch",
    title: "AR / VR & XR",
    image: "/industrypower/arvr1.png",
    leftHeading: "Build immersive experiences",
    ctaLabel: "Explore XR Solutions",
    features: [
      {
        title: "Assets optimized for real-time worlds",
        body: "Generate lightweight 3D models designed for interactive environments and spatial applications.",
      },
      {
        title: "Prototype immersive ideas faster",
        body: "Create environments and objects quickly while developing next-generation XR experiences.",
      },
    ],
  },
  {
    id: "prop",
    title: "Product Visualization",
    image: "/industrypower/lampprop.png",
    leftHeading: "Bring products to life in 3D",
    ctaLabel: "Explore Product Visualization",
    features: [
      {
        title: "High-quality product renders",
        body: "Generate photorealistic models for marketing visuals, product showcases, and e-commerce.",
      },
      {
        title: "Speed up product storytelling",
        body: "Transform early concepts into compelling 3D visuals ready for presentations and campaigns.",
      },
    ],
  },
] as const;

type IndustryId = (typeof INDUSTRIES)[number]["id"];

/* ─────────────────── gradient overlay (GrainGradient-inspired) ──────────── */
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
  const activeItem = INDUSTRIES.find((i) => i.id === activeId) ?? INDUSTRIES[0];

  return (
    <section
      style={{
        position: "relative",
        width: "100%",
        backgroundColor: "#f6f5f3",
        padding: "4.5rem 1.5rem 5rem",
        boxSizing: "border-box",
        WebkitFontSmoothing: "antialiased",
        textRendering: "optimizeLegibility",
      }}
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
        {/* ── Heading – outside the box ── */}
        <h2
          style={{
            margin: 0,
            textAlign: "center",
            fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
            fontSize: "clamp(1.875rem, 4vw, 3rem)",
            fontWeight: 700,
            color: "#111",
            letterSpacing: "-0.035em",
            lineHeight: 1.15,
          }}
        >
          Built to{" "}
          <em
            style={{
              fontStyle: "italic",
              fontWeight: 700,
              letterSpacing: "-0.04em",
            }}
          >
            power
          </em>
          <br />
          creators like you
        </h2>

        {/* ── Main card ── */}
        <div
          style={{
            borderRadius: "1rem",
            border: "1px solid rgba(17,17,17,0.06)",
            backgroundColor: "#fbfaf9",
            boxShadow:
              "0 1px 4px rgba(17,17,17,0.05), 0 0 0 1px rgba(17,17,17,0.03)",
            overflow: "hidden",
          }}
        >
          {/* ── Industry tabs row ── */}
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              padding: "0.625rem",
              alignItems: "stretch",
            }}
          >
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
                  {/* Inner styled card */}
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
                      border: `1px solid ${
                        isActive
                          ? "rgba(17,17,17,0.10)"
                          : "rgba(17,17,17,0.055)"
                      }`,
                      backgroundColor: isActive
                        ? "rgba(255,255,255,0.96)"
                        : "rgba(239,238,230,0.28)",
                      padding: "0.75rem 0.375rem 1.25rem",
                      transition:
                        "background-color 0.25s cubic-bezier(0.215,0.61,0.355,1), border-color 0.25s cubic-bezier(0.215,0.61,0.355,1)",
                    }}
                  >
                    {/* Card label */}
                    <span
                      style={{
                        display: "block",
                        width: "100%",
                        textAlign: "center",
                        fontFamily: "'DM Sans', Arial, sans-serif",
                        fontSize: "0.6875rem",
                        fontWeight: isActive ? 600 : 400,
                        color: isActive ? "#111" : "rgba(17,17,17,0.42)",
                        letterSpacing: "-0.01em",
                        lineHeight: 1.4,
                        marginBottom: "0.625rem",
                        position: "relative",
                        zIndex: 10,
                        transition:
                          "color 0.25s cubic-bezier(0.215,0.61,0.355,1), font-weight 0.25s",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        paddingInline: "0.25rem",
                      }}
                      title={item.title}
                    >
                      {item.title}
                    </span>

                    {/* Image – 161.19×226 crop, height 13rem */}
                    <div
                      style={{
                        position: "relative",
                        zIndex: 10,
                        flexShrink: 0,
                        margin: "0 auto",
                        overflow: "hidden",
                        borderRadius: "0.25rem",
                        height: "13rem",
                        width: "min(100%, calc(13rem * 161.19 / 226))",
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
                          transition:
                            "opacity 0.3s cubic-bezier(0.215,0.61,0.355,1)",
                        }}
                        sizes="(max-width: 640px) 22vw, (max-width: 1024px) 18vw, 161px"
                      />
                    </div>

                    {/* Gradient bloom */}
                    <CardGradient active={isActive} />
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Animated bottom content ── */}
          <div
            style={{
              borderTop: "1px solid rgba(17,17,17,0.06)",
              minHeight: "12rem",
              overflow: "hidden",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{
                  duration: 0.28,
                  ease: [0.215, 0.61, 0.355, 1],
                }}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "3.5rem",
                  padding: "2.5rem 2.75rem 2.75rem",
                }}
              >
                {/* Left – heading + CTA */}
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
                      fontFamily:
                        "'Space Grotesk', 'DM Sans', Arial, sans-serif",
                      fontSize: "clamp(1.25rem, 2.4vw, 1.75rem)",
                      fontWeight: 700,
                      color: "#111",
                      letterSpacing: "-0.03em",
                      lineHeight: 1.2,
                    }}
                  >
                    {activeItem.leftHeading}
                  </h3>
                  <CtaLink label={activeItem.ctaLabel} />
                </div>

                {/* Right – feature bullets */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  {activeItem.features.map((f, i) => (
                    <div key={f.title}>
                      {i > 0 && (
                        <div
                          style={{
                            borderTop: "1px solid rgba(17,17,17,0.07)",
                            margin: "1.25rem 0",
                          }}
                        />
                      )}
                      <h4
                        style={{
                          margin: "0 0 0.375rem",
                          fontFamily: "'DM Sans', Arial, sans-serif",
                          fontSize: "0.9375rem",
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
                          fontFamily: "'DM Sans', Arial, sans-serif",
                          fontSize: "0.8125rem",
                          fontWeight: 400,
                          color: "#5e5c5a",
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
      </div>
    </section>
  );
}

/* ── small CTA link ── */
function CtaLink({ label }: { label: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <a
      href="/earlyaccess"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "0.35rem",
        alignSelf: "flex-start",
        padding: "0.5625rem 1.125rem",
        borderRadius: "0.625rem",
        border: `1px solid ${
          hovered ? "rgba(17,17,17,0.18)" : "rgba(17,17,17,0.10)"
        }`,
        backgroundColor: hovered ? "rgba(17,17,17,0.04)" : "transparent",
        fontFamily: "'DM Sans', Arial, sans-serif",
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
      <svg
        width="13"
        height="13"
        viewBox="0 0 13 13"
        fill="none"
        aria-hidden
        style={{ flexShrink: 0 }}
      >
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
