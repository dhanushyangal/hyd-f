"use client";

import React, { useRef, useState, useEffect, useLayoutEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const CLOUDINARY_BASE = "https://res.cloudinary.com/dqizbxc9e/image/upload";
const img = (id: string, t = "f_auto,q_auto,c_fit,w_1120,h_720") =>
  `${CLOUDINARY_BASE}/${t}/v1/hydrilla-landing/features/${id}`;

const F = "'DM Sans', system-ui, sans-serif";

// Light theme palette
const BG = "#ffffff";
const BG_CARD = "#f7f7f7";
const DIVIDER = "#f0f0f0";
const ACCENT = "#3b8ee8";
const TXT_HI = "#111111";
const TXT_BODY = "#606060";
const TXT_MUTED = "#888888";
const TXT_DIM = "#c0c0c0";

const FEATURES = [
  {
    id: 1,
    number: "01",
    title: "Text & Image to 3D Generation",
    body: "Hydrilla transforms natural language descriptions and reference images into structured 3D assets. This enables artists and technical teams to translate concepts into editable geometry without manual base modeling.",
    image: img("3d1"),
    mobileImage: img("3d1", "f_auto,q_auto,c_fit,w_900,h_600"),
  },
  {
    id: 2,
    number: "02",
    title: "Intelligent Asset Segmentation",
    body: "Hydrilla isolates objects and structural components from source imagery using AI-driven segmentation. Separated visual elements are reconstructed into organised geometry for accurate model generation and downstream editing.",
    image: img("3d2"),
    mobileImage: img("3d2", "f_auto,q_auto,c_fit,w_900,h_600"),
  },
  {
    id: 3,
    number: "03",
    title: "Automatic UV Mapping",
    body: "Generated assets include UV-mapped surfaces prepared for standard texturing workflows. Materials, texture maps, and surface details can be applied immediately within professional rendering pipelines.",
    image: img("3d3"),
    mobileImage: img("3d3", "f_auto,q_auto,c_fit,w_900,h_600"),
  },
  {
    id: 4,
    number: "04",
    title: "Iterative Asset Generation",
    body: "Hydrilla enables iterative generation of asset variations while maintaining structural coherence. Teams can explore design directions, proportions, and stylistic changes without rebuilding models from scratch.",
    image: img("3d4"),
    mobileImage: img("3d4", "f_auto,q_auto,c_fit,w_900,h_600"),
  },
  {
    id: 5,
    number: "05",
    title: "Refinement Workspace",
    body: "Models can be inspected and refined inside the Hydrilla workspace prior to export. The workspace provides controls for material adjustments, geometry inspection, and asset preparation within an interactive viewport.",
    image: img("3d5"),
    mobileImage: img("3d5", "f_auto,q_auto,c_fit,w_900,h_600"),
  },
  {
    id: 6,
    number: "06",
    title: "Production-Ready Topology",
    body: "Hydrilla generates structured meshes designed for integration into real production environments. Assets are suitable for use in real-time engines, rendering systems, and animation workflows.",
    image: img("3d6"),
    mobileImage: img("3d6", "f_auto,q_auto,c_fit,w_900,h_600"),
  },
  {
    id: 7,
    number: "07",
    title: "Export for Professional Pipelines",
    body: "Assets can be exported in widely supported formats compatible with major 3D tools and engines — GLB, FBX, OBJ, and USDZ — ready for immediate use in your pipeline.",
    image: img("3d7"),
    mobileImage: img("3d7", "f_auto,q_auto,c_fit,w_900,h_600"),
    tags: ["GLB", "FBX", "OBJ", "USDZ"],
  },
  {
    id: 8,
    number: "08",
    title: "API and Pipeline Integration",
    body: "Hydrilla provides a generation API that allows teams to integrate asset creation directly into internal production pipelines. Automated workflows can trigger asset generation, iteration, and export programmatically.",
    image: img("3d8"),
    mobileImage: img("3d8", "f_auto,q_auto,c_fit,w_900,h_600"),
  },
];

export default function FeaturesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [wrapperHeight, setWrapperHeight] = useState(3000);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const leftContentRef = useRef<HTMLDivElement>(null);

  // ── Size the tall scroll driver based on left-column content height ───────
  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const recalc = () => {
      const leftContent = leftContentRef.current;
      const leftCol = leftColRef.current;
      if (!leftContent || !leftCol) return;
      const scrollRange = Math.max(0, leftContent.scrollHeight - leftCol.clientHeight);
      setWrapperHeight(window.innerHeight + scrollRange);
    };
    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  // ── Page scroll → drive left-column scroll + active index in sync ─────────
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const leftCol = leftColRef.current;
    const leftContent = leftContentRef.current;
    if (!wrapper || !leftCol || !leftContent) return;

    const onScroll = () => {
      const colH = leftCol.clientHeight;
      const maxScroll = Math.max(0, leftContent.scrollHeight - colH);
      if (maxScroll <= 0) return;

      const winH = window.innerHeight;
      const scrollRange = wrapper.offsetHeight - winH;
      if (scrollRange <= 0) return;

      const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
      const progress = Math.max(0, Math.min(1, (window.scrollY - wrapperTop) / scrollRange));

      leftCol.scrollTop = progress * maxScroll;
      const idx = Math.min(FEATURES.length - 1, Math.floor(progress * FEATURES.length));
      setActiveIndex(idx);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [wrapperHeight]);

  const scrollToFeature = (i: number) => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const scrollRange = wrapper.offsetHeight - window.innerHeight;
    const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
    const progress = FEATURES.length > 1 ? i / (FEATURES.length - 1) : 0;
    window.scrollTo({ top: wrapperTop + scrollRange * progress, behavior: "smooth" });
  };

  const progressPct = ((activeIndex + 1) / FEATURES.length) * 100;

  return (
    <div style={{ backgroundColor: BG, WebkitFontSmoothing: "antialiased" }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: "6rem 1.5rem 3.5rem", boxSizing: "border-box" }}
        className="max-sm:px-4 max-sm:pt-12 max-sm:pb-8">
        <div style={{ maxWidth: "72rem", margin: "0 auto", textAlign: "center" }}>
          <p style={{
            margin: "0 0 1rem",
            fontFamily: F,
            fontSize: "0.6875rem",
            fontWeight: 600,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: TXT_MUTED,
          }}>
            Platform Capabilities
          </p>
          <h2 style={{
            margin: 0,
            fontFamily: F,
            fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
            fontWeight: 700,
            color: TXT_HI,
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
          }}>
            Everything you need for{" "}
            <span style={{ color: ACCENT }}>production grade 3D assets</span>
          </h2>
        </div>
      </section>

      {/* ── Desktop: tall scroll driver + sticky two-column panel ──────────── */}
      <div
        ref={wrapperRef}
        style={{ width: "100%", height: wrapperHeight, boxSizing: "border-box" }}
        className="hidden md:block"
      >
        <section style={{
          position: "sticky",
          top: 0,
          width: "100%",
          height: "100vh",
          backgroundColor: BG,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>
          {/* Progress bar — very top of the sticky panel */}
          <div style={{ height: 2, backgroundColor: "#f0f0f0", flexShrink: 0 }}>
            <motion.div
              style={{ height: "100%", backgroundColor: ACCENT, originX: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>

          <div style={{
            flex: 1,
            minHeight: 0,
            maxWidth: "90rem",
            margin: "0 auto",
            width: "100%",
            padding: "0 2.5rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            alignItems: "stretch",
          }}>

            {/* LEFT ─────────────────────────────────────────────────────── */}
            <div
              ref={leftColRef}
              className="features-left-col"
              style={{
                paddingRight: "3rem",
                borderRight: `1px solid ${DIVIDER}`,
                overflowY: "auto",
                overflowX: "hidden",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <style>{`.features-left-col::-webkit-scrollbar{display:none}`}</style>
              <div ref={leftContentRef}>
                {FEATURES.map((feat, idx) => {
                  const active = activeIndex === idx;
                  return (
                    <div
                      key={feat.id}
                      ref={(el) => { itemRefs.current[idx] = el; }}
                      onClick={() => scrollToFeature(idx)}
                      style={{
                        position: "relative",
                        padding: "4.5rem 0 4.5rem 1.25rem",
                        borderTop: idx === 0 ? "none" : `1px solid ${DIVIDER}`,
                        opacity: active ? 1 : 0.38,
                        backgroundColor: active ? "rgba(59,142,232,0.04)" : "transparent",
                        borderRadius: active ? "0 0.5rem 0.5rem 0" : 0,
                        transition: "opacity 0.3s ease, background-color 0.3s ease",
                        cursor: "pointer",
                      }}
                    >
                      {/* Left accent bar */}
                      <motion.div
                        animate={{
                          opacity: active ? 1 : 0,
                          scaleY: active ? 1 : 0.4,
                        }}
                        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        style={{
                          position: "absolute",
                          left: 0,
                          top: "4.5rem",
                          bottom: "4.5rem",
                          width: 3,
                          borderRadius: 2,
                          backgroundColor: ACCENT,
                          transformOrigin: "top",
                        }}
                      />

                      <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", marginBottom: "1.125rem" }}>
                        <span style={{
                          flexShrink: 0,
                          fontFamily: F,
                          fontSize: "0.6875rem",
                          fontWeight: 700,
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          color: active ? ACCENT : TXT_DIM,
                          marginTop: "0.4rem",
                          transition: "color 0.3s ease",
                        }}>
                          {feat.number}
                        </span>
                        <h3 style={{
                          margin: 0,
                          fontFamily: F,
                          fontSize: "clamp(1.25rem, 2.2vw, 1.75rem)",
                          fontWeight: 700,
                          color: TXT_HI,
                          letterSpacing: "-0.03em",
                          lineHeight: 1.25,
                        }}>
                          {feat.title}
                        </h3>
                      </div>

                      <p style={{
                        margin: "0 0 0 2.5rem",
                        fontFamily: F,
                        fontSize: "1rem",
                        fontWeight: 400,
                        color: TXT_BODY,
                        lineHeight: 1.75,
                      }}>
                        {feat.body}
                      </p>

                      {feat.tags && (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.125rem", marginLeft: "2.5rem" }}>
                          {feat.tags.map((t) => (
                            <span key={t} style={{
                              padding: "0.3rem 0.75rem",
                              borderRadius: "0.375rem",
                              border: "1px solid rgba(59,142,232,0.22)",
                              backgroundColor: "rgba(59,142,232,0.05)",
                              fontFamily: F,
                              fontSize: "0.8125rem",
                              fontWeight: 600,
                              color: ACCENT,
                              letterSpacing: "0.03em",
                            }}>
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                <div style={{ height: "2rem" }} />
              </div>
            </div>

            {/* RIGHT ────────────────────────────────────────────────────── */}
            <div style={{
              paddingLeft: "3rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <div style={{
                position: "relative",
                width: "100%",
                maxWidth: "960px",
                aspectRatio: "16 / 9",
                borderRadius: "1rem",
                overflow: "hidden",
                backgroundColor: BG_CARD,
                border: "1px solid #ebebeb",
                boxShadow: "0 2px 24px rgba(17,17,17,0.06), 0 1px 3px rgba(17,17,17,0.04)",
              }}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
                    style={{ position: "absolute", inset: 0 }}
                  >
                    <Image
                      src={FEATURES[activeIndex]?.image ?? img("3d1")}
                      alt={FEATURES[activeIndex]?.title ?? ""}
                      fill
                      style={{ objectFit: "contain", objectPosition: "center" }}
                      sizes="(max-width: 1200px) 50vw, 960px"
                      loading={activeIndex === 0 ? "eager" : "lazy"}
                      decoding="async"
                      unoptimized
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Step dots */}
                <div style={{
                  position: "absolute",
                  top: "1.125rem",
                  right: "1.125rem",
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: 5,
                }}>
                  {FEATURES.map((_, i) => (
                    <button
                      key={i}
                      aria-label={`Step ${i + 1}`}
                      onClick={() => scrollToFeature(i)}
                      style={{
                        width: 5,
                        height: i === activeIndex ? 20 : 5,
                        borderRadius: 100,
                        backgroundColor: i === activeIndex ? ACCENT : "rgba(17,17,17,0.15)",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        transition: "height 0.22s ease, background-color 0.22s ease",
                      }}
                    />
                  ))}
                </div>

                {/* Step counter */}
                <div style={{
                  position: "absolute",
                  bottom: "1.125rem",
                  left: "1.125rem",
                  fontFamily: F,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "rgba(17,17,17,0.35)",
                  letterSpacing: "0.06em",
                  userSelect: "none",
                }}>
                  {String(activeIndex + 1).padStart(2, "0")} / 08
                </div>
              </div>
            </div>

          </div>
        </section>
      </div>

      {/* ── Mobile: stacked cards ──────────────────────────────────────────── */}
      <div className="md:hidden w-full max-w-4xl mx-auto px-4 py-6 pb-12" style={{ backgroundColor: BG }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {FEATURES.map((feat, i) => (
            <motion.article
              key={feat.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.38, ease: [0.4, 0, 0.2, 1] }}
              style={{
                borderRadius: "1rem",
                border: "1px solid #ebebeb",
                backgroundColor: BG,
                overflow: "hidden",
                boxShadow: "0 1px 6px rgba(17,17,17,0.05)",
              }}
            >
              <div style={{
                position: "relative",
                width: "100%",
                aspectRatio: "16 / 10",
                backgroundColor: BG_CARD,
                borderBottom: `1px solid ${DIVIDER}`,
              }}>
                <Image
                  src={feat.mobileImage}
                  alt={feat.title}
                  fill
                  style={{ objectFit: "contain", objectPosition: "center", padding: "0.75rem" }}
                  sizes="100vw"
                  loading={i < 2 ? "eager" : "lazy"}
                  decoding="async"
                  unoptimized
                />
              </div>
              <div style={{ padding: "1.25rem 1.25rem 1.5rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem", marginBottom: "0.625rem" }}>
                  <span style={{
                    fontFamily: F,
                    fontSize: "0.6875rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: ACCENT,
                    flexShrink: 0,
                    marginTop: "0.2rem",
                  }}>
                    {feat.number}
                  </span>
                  <h3 style={{
                    margin: 0,
                    fontFamily: F,
                    fontSize: "1.0625rem",
                    fontWeight: 700,
                    color: TXT_HI,
                    lineHeight: 1.3,
                    letterSpacing: "-0.02em",
                  }}>
                    {feat.title}
                  </h3>
                </div>
                <p style={{
                  margin: "0 0 0 1.375rem",
                  fontFamily: F,
                  fontSize: "0.9375rem",
                  fontWeight: 400,
                  color: TXT_BODY,
                  lineHeight: 1.68,
                }}>
                  {feat.body}
                </p>
                {feat.tags && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.875rem", marginLeft: "1.375rem" }}>
                    {feat.tags.map((t) => (
                      <span key={t} style={{
                        padding: "0.25rem 0.625rem",
                        borderRadius: "0.3125rem",
                        border: "1px solid rgba(59,142,232,0.22)",
                        backgroundColor: "rgba(59,142,232,0.05)",
                        fontFamily: F,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        color: ACCENT,
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.article>
          ))}
        </div>
      </div>

    </div>
  );
}
