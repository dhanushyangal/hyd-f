"use client";

import React, { useRef, useState, useEffect, useCallback, useLayoutEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const FEATURES = [
  {
    id: 1,
    number: "01",
    title: "Text & Image to 3D Generation",
    body: "Hydrilla transforms natural language descriptions and reference images into structured 3D assets. This enables artists and technical teams to translate concepts into editable geometry without manual base modeling.",
    image: "/features/3d1.webp",
  },
  {
    id: 2,
    number: "02",
    title: "Intelligent Asset Segmentation",
    body: "Hydrilla isolates objects and structural components from source imagery using AI-driven segmentation. Separated visual elements are reconstructed into organised geometry for accurate model generation and downstream editing.",
    image: "/features/3d2.webp",
  },
  {
    id: 3,
    number: "03",
    title: "Automatic UV Mapping",
    body: "Generated assets include UV-mapped surfaces prepared for standard texturing workflows. Materials, texture maps, and surface details can be applied immediately within professional rendering pipelines.",
    image: "/features/3d3.webp",
  },
  {
    id: 4,
    number: "04",
    title: "Iterative Asset Generation",
    body: "Hydrilla enables iterative generation of asset variations while maintaining structural coherence. Teams can explore design directions, proportions, and stylistic changes without rebuilding models from scratch.",
    image: "/features/3d4.webp",
  },
  {
    id: 5,
    number: "05",
    title: "Refinement Workspace",
    body: "Models can be inspected and refined inside the Hydrilla workspace prior to export. The workspace provides controls for material adjustments, geometry inspection, and asset preparation within an interactive viewport.",
    image: "/features/3d5.webp",
  },
  {
    id: 6,
    number: "06",
    title: "Production-Ready Topology",
    body: "Hydrilla generates structured meshes designed for integration into real production environments. Assets are suitable for use in real-time engines, rendering systems, and animation workflows.",
    image: "/features/3d6.webp",
  },
  {
    id: 7,
    number: "07",
    title: "Export for Professional Pipelines",
    body: "Assets can be exported in widely supported formats compatible with major 3D tools and engines — GLB, FBX, OBJ, and USDZ — ready for immediate use in your pipeline.",
    image: "/features/3d7.webp",
    tags: ["GLB", "FBX", "OBJ", "USDZ"],
  },
  {
    id: 8,
    number: "08",
    title: "API and Pipeline Integration",
    body: "Hydrilla provides a generation API that allows teams to integrate asset creation directly into internal production pipelines. Automated workflows can trigger asset generation, iteration, and export programmatically.",
    image: "/features/3d8.webp",
  },
];

export default function FeaturesSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [wrapperHeight, setWrapperHeight] = useState(3000);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const leftColRef = useRef<HTMLDivElement>(null);
  const leftContentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const leftContent = leftContentRef.current;
    const leftCol = leftColRef.current;
    if (!leftContent || !leftCol) return;
    const contentH = leftContent.scrollHeight;
    const colH = leftCol.clientHeight;
    const viewportH = typeof window !== "undefined" ? window.innerHeight : 900;
    const scrollRange = Math.max(0, contentH - colH);
    setWrapperHeight(viewportH + scrollRange);
  }, []);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const leftCol = leftColRef.current;
    const leftContent = leftContentRef.current;
    if (!wrapper || !leftCol || !leftContent) return;

    const onScroll = () => {
      const contentH = leftContent.scrollHeight;
      const colH = leftCol.clientHeight;
      const maxScroll = Math.max(0, contentH - colH);
      if (maxScroll <= 0) return;

      const winH = window.innerHeight;
      const scrollRange = wrapper.offsetHeight - winH;
      if (scrollRange <= 0) return;

      const wrapperTop = wrapper.getBoundingClientRect().top + window.scrollY;
      const scrollY = window.scrollY;
      const progress = Math.max(0, Math.min(1, (scrollY - wrapperTop) / scrollRange));
      leftCol.scrollTop = progress * maxScroll;
      // Drive active index from scroll so steps advance one-by-one without skipping
      const n = FEATURES.length;
      const idx = Math.min(n - 1, Math.floor(progress * n));
      setActiveIndex(idx);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [wrapperHeight]);

  // When user scrolls the left column (e.g. click-to-feature), keep activeIndex in sync
  useEffect(() => {
    const leftCol = leftColRef.current;
    const leftContent = leftContentRef.current;
    if (!leftCol || !leftContent) return;
    const onColScroll = () => {
      const maxScroll = Math.max(0, leftContent.scrollHeight - leftCol.clientHeight);
      if (maxScroll <= 0) return;
      const progress = Math.max(0, Math.min(1, leftCol.scrollTop / maxScroll));
      const n = FEATURES.length;
      setActiveIndex(Math.min(n - 1, Math.floor(progress * n)));
    };
    leftCol.addEventListener("scroll", onColScroll, { passive: true });
    return () => leftCol.removeEventListener("scroll", onColScroll);
  }, []);

  const scrollToFeature = (i: number) => {
    const leftCol = leftColRef.current;
    const el = itemRefs.current[i];
    if (!leftCol || !el) return;
    const colH = leftCol.clientHeight;
    const target = el.offsetTop - colH / 2 + el.offsetHeight / 2;
    leftCol.scrollTo({ top: Math.max(0, target), behavior: "smooth" });
  };

  return (
    <>
      {/* Separate header section – scrolls away; sticky starts after this */}
      <section
        style={{
          width: "100%",
          backgroundColor: "#fff",
          padding: "6rem 1.5rem 3rem",
          boxSizing: "border-box",
          WebkitFontSmoothing: "antialiased",
        }}
        className="max-sm:px-4 max-sm:pt-12 max-sm:pb-8"
      >
        <div
          style={{
            maxWidth: "72rem",
            margin: "0 auto",
            padding: "0 1.5rem",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 0.75rem",
              fontFamily: "'DM Sans', Arial, sans-serif",
              fontSize: "0.6875rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#666",
            }}
          >
            Platform Capabilities
          </p>
          <h2
            style={{
              margin: 0,
              fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
              fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
              fontWeight: 700,
              color: "#111",
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
            }}
          >
            Everything you need for{" "}
            <span
              style={{
                backgroundImage: "linear-gradient(135deg, #6cbcf5 0%, #3b8ee8 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              production grade 3D assets
            </span>
          </h2>
        </div>
      </section>

      {/* Desktop: Sticky wrapper with two-column block */}
      <div
        ref={wrapperRef}
        style={{
          width: "100%",
          height: wrapperHeight,
          boxSizing: "border-box",
        }}
        className="max-md:!h-auto hidden md:block"
      >
        <section
          style={{
            position: "sticky",
            top: 0,
            left: 0,
            right: 0,
            width: "100%",
            height: "100vh",
            backgroundColor: "#fff",
            padding: 0,
            boxSizing: "border-box",
            WebkitFontSmoothing: "antialiased",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
          className="max-md:!relative max-md:!h-auto max-md:min-h-0"
        >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            maxWidth: "90rem",
            margin: "0 auto",
            padding: "0 2.5rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 0,
            alignItems: "stretch",
          }}
          className="max-md:grid-cols-1 max-md:gap-6"
        >
          {/* LEFT: only this column scrolls; invisible scrollbar on desktop, driven by page scroll */}
          <div
            ref={leftColRef}
            className="order-2 md:order-1 features-left-col"
            style={{
              paddingRight: "3rem",
              borderRight: "1px solid rgba(17,17,17,0.08)",
              overflowY: "auto",
              overflowX: "hidden",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <style>{`.features-left-col::-webkit-scrollbar { display: none; }`}</style>
            <div ref={leftContentRef}>
              {FEATURES.map((feat, idx) => (
                <div
                  key={feat.id}
                  ref={(el) => { itemRefs.current[idx] = el; }}
                  data-feature-idx={idx}
                  style={{
                    padding: "5rem 0",
                    borderTop: idx === 0 ? "none" : "1px solid rgba(17,17,17,0.06)",
                    transition: "opacity 0.28s cubic-bezier(0.4,0,0.2,1)",
                    opacity: activeIndex === idx ? 1 : 0.4,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", marginBottom: "1.5rem" }}>
                    <span
                      style={{
                        flexShrink: 0,
                        fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
                        fontSize: "0.8125rem",
                        fontWeight: 700,
                        color: activeIndex === idx ? "#3b8ee8" : "#bbb",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        marginTop: "0.35rem",
                        transition: "color 0.28s",
                      }}
                    >
                      {feat.number}
                    </span>
                    <h3
                      style={{
                        margin: 0,
                        fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
                        fontSize: "clamp(1.5rem, 2.6vw, 1.9375rem)",
                        fontWeight: 700,
                        color: "#111",
                        letterSpacing: "-0.03em",
                        lineHeight: 1.25,
                      }}
                    >
                      {feat.title}
                    </h3>
                  </div>
                  <p
                    style={{
                      margin: "0 0 1.5rem 2.75rem",
                      fontFamily: "'DM Sans', Arial, sans-serif",
                      fontSize: "1.125rem",
                      color: "#565656",
                      lineHeight: 1.7,
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {feat.body}
                  </p>
                  {feat.tags && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginLeft: "2.75rem" }}>
                      {feat.tags.map((t) => (
                        <span
                          key={t}
                          style={{
                            padding: "0.35rem 0.75rem",
                            borderRadius: "0.375rem",
                            border: "1px solid rgba(59,142,232,0.25)",
                            backgroundColor: "rgba(59,142,232,0.06)",
                            fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
                            fontSize: "0.8125rem",
                            fontWeight: 600,
                            color: "#3b8ee8",
                            letterSpacing: "0.02em",
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <div style={{ height: "2rem" }} />
            </div>
          </div>

          {/* RIGHT: fixed canvas */}
          <div
            className="order-1 md:order-2 hidden md:flex"
            style={{
              paddingLeft: "3rem",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: "960px",
                aspectRatio: "16 / 9",
                borderRadius: "0.75rem",
                overflow: "hidden",
                backgroundColor: "#f8f8f8",
                boxShadow: "0 4px 40px rgba(17,17,17,0.06), 0 1px 3px rgba(17,17,17,0.04)",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
                  style={{ position: "absolute", inset: 0 }}
                >
                  <Image
                    src={FEATURES[activeIndex]?.image ?? "/features/3d1.webp"}
                    alt={FEATURES[activeIndex]?.title ?? ""}
                    fill
                    style={{ objectFit: "contain", objectPosition: "center" }}
                    sizes="(max-width: 1200px) 50vw, 960px"
                    loading="lazy"
                    decoding="async"
                  />
                </motion.div>
              </AnimatePresence>
              <div
                style={{
                  position: "absolute",
                  top: "1rem",
                  right: "1rem",
                  zIndex: 10,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.375rem",
                }}
              >
                {FEATURES.map((feat, i) => (
                  <button
                    key={i}
                    aria-label={`Go to step ${feat.number}: ${feat.title}`}
                    onClick={() => scrollToFeature(i)}
                    style={{
                      width: "6px",
                      height: i === activeIndex ? "22px" : "6px",
                      borderRadius: "100px",
                      backgroundColor: i === activeIndex ? "#3b8ee8" : "rgba(17,17,17,0.18)",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      transition: "height 0.2s cubic-bezier(0.4,0,0.2,1), background-color 0.2s",
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        </section>
      </div>

      {/* Mobile: cards one after another — matter then image, normal scroll, premium UI */}
      <div className="md:hidden w-full max-w-6xl mx-auto px-4 py-6 pb-12">
        <div className="flex flex-col gap-8">
          {FEATURES.map((feat) => (
            <motion.article
              key={feat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4 }}
              className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm overflow-hidden"
            >
              <div className="flex items-start gap-3 mb-4">
                <span className="text-xs font-bold tracking-widest uppercase text-[#3b8ee8] shrink-0 pt-0.5">
                  {feat.number}
                </span>
                <h3 className="text-xl font-bold text-neutral-900 tracking-tight leading-tight m-0">
                  {feat.title}
                </h3>
              </div>
              <p className="text-[1rem] text-neutral-600 leading-relaxed mb-5 pl-9">
                {feat.body}
              </p>
              {feat.tags && (
                <div className="flex flex-wrap gap-2 mb-5 pl-9">
                  {feat.tags.map((t) => (
                    <span
                      key={t}
                      className="inline-block px-3 py-1 rounded-md text-xs font-semibold text-[#3b8ee8] border border-[#3b8ee8]/30 bg-[#3b8ee8]/10"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
              <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-neutral-100 -mx-1">
                <Image
                  src={feat.image}
                  alt={feat.title}
                  fill
                  className="object-contain object-center"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </>
  );
}
