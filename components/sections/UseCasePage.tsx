"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { SignUpButton } from "@clerk/nextjs";

export interface UseCaseFeature {
  title: string;
  body: string;
}

export interface UseCaseWho {
  role: string;
  description: string;
}

export interface UseCaseData {
  industry: string;
  headline: string;
  tagline: string;
  features: UseCaseFeature[];
  who: UseCaseWho[];
  backHref?: string;
  /** Single hero image path (e.g. /usecase/games.jpg) */
  heroImage?: string;
  /** Multiple hero images for cycling (e.g. AR/VR) */
  heroImages?: string[];
  /** Use portrait/vertical card (e.g. Film) */
  cardVertical?: boolean;
  /** Accent colour for the page (e.g. "#3b8ee8") */
  accentColor?: string;
}

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.215, 0.61, 0.355, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
};

const CAL_DEMO_URL = "https://cal.com/hydrilla";

export default function UseCasePage({ data }: { data: UseCaseData }) {
  const { isSignedIn } = useAuth();
  const accent = data.accentColor ?? "#3b8ee8";
  const heroSources = data.heroImages?.length
    ? data.heroImages
    : data.heroImage
      ? [data.heroImage]
      : [];
  const [cyclingIndex, setCyclingIndex] = useState(0);
  useEffect(() => {
    if (heroSources.length <= 1) return;
    const t = setInterval(() => {
      setCyclingIndex((i) => (i + 1) % heroSources.length);
    }, 4000);
    return () => clearInterval(t);
  }, [heroSources.length]);
  const displayHeroSrc = heroSources[cyclingIndex] ?? heroSources[0];
  const hasHeroCard = heroSources.length > 0;

  return (
    <main
      style={{
        width: "100%",
        backgroundColor: "#fff",
        fontFamily: "'DM Sans', Arial, sans-serif",
        WebkitFontSmoothing: "antialiased",
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      {/* ── Hero ── */}
      <section
        style={{
          position: "relative",
          width: "100%",
          minHeight: "100dvh",
          background: "#0a0a0a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "max(env(safe-area-inset-top), 6rem) 1.25rem 5rem",
          paddingLeft: "max(1.25rem, env(safe-area-inset-left))",
          paddingRight: "max(1.25rem, env(safe-area-inset-right))",
          boxSizing: "border-box",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 80% 55% at 50% 0%, rgba(255,255,255,0.04) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />

        <div
          className={`grid gap-6 md:gap-10 w-full max-w-6xl mx-auto ${hasHeroCard ? "md:grid-cols-[1fr_minmax(280px,420px)]" : ""}`}
          style={{
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Left: content */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            style={{
              width: "100%",
              textAlign: hasHeroCard ? "left" : "center",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
              minWidth: 0,
            }}
          >
            <motion.div variants={fadeUp}>
              <Link
                href={data.backHref ?? "/"}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "100px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  backgroundColor: "rgba(255,255,255,0.05)",
                  color: "rgba(255,255,255,0.55)",
                  fontSize: "0.75rem",
                  fontWeight: 500,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  marginBottom: "0.25rem",
                  minHeight: "44px",
                  boxSizing: "border-box",
                  justifyContent: "center",
                }}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                  <path d="M8 10L4 6l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {data.industry}
              </Link>
            </motion.div>
            <motion.h1
              variants={fadeUp}
              style={{
                margin: 0,
                fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
                fontSize: "clamp(2rem, 5vw, 4rem)",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.04em",
                lineHeight: 1.08,
              }}
            >
              {data.headline}
            </motion.h1>
            <motion.p
              variants={fadeUp}
              style={{
                margin: 0,
                fontFamily: "'DM Sans', Arial, sans-serif",
                fontSize: "clamp(0.9375rem, 1.8vw, 1.1875rem)",
                fontWeight: 400,
                color: "rgba(255,255,255,0.55)",
                lineHeight: 1.65,
                maxWidth: hasHeroCard ? "36rem" : "40rem",
                alignSelf: hasHeroCard ? "stretch" : "center",
              }}
            >
              {data.tagline}
            </motion.p>
            <motion.div
              variants={fadeUp}
              style={{
                display: "flex",
                gap: "0.75rem",
                justifyContent: hasHeroCard ? "flex-start" : "center",
                flexWrap: "wrap",
                marginTop: "0.25rem",
              }}
            >
              {isSignedIn ? (
                <Link
                  href="/app/studio"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.875rem 1.75rem",
                    minHeight: "48px",
                    borderRadius: "100px",
                    backgroundColor: "#fff",
                    color: "#111",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    textDecoration: "none",
                    letterSpacing: "-0.01em",
                    whiteSpace: "nowrap",
                  }}
                >
                  Start Creating
                </Link>
              ) : (
                <SignUpButton mode="modal" forceRedirectUrl="/app/studio">
                  <button
                    type="button"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0.875rem 1.75rem",
                      minHeight: "48px",
                      borderRadius: "100px",
                      backgroundColor: "#fff",
                      color: "#111",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      whiteSpace: "nowrap",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Start Creating
                  </button>
                </SignUpButton>
              )}
              <a
                href={CAL_DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.875rem 1.75rem",
                  minHeight: "48px",
                  borderRadius: "100px",
                  border: "1.5px solid rgba(255,255,255,0.2)",
                  backgroundColor: "transparent",
                  color: "#fff",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  letterSpacing: "-0.01em",
                  whiteSpace: "nowrap",
                }}
              >
                Book Demo
              </a>
            </motion.div>
          </motion.div>

          {/* Right: hero image card (HowItWorks-style) */}
          {hasHeroCard && displayHeroSrc && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="show"
              style={{
                width: "100%",
                maxWidth: "100%",
                borderRadius: "1.25rem",
                overflow: "hidden",
                backgroundColor: "#f5f4f2",
                aspectRatio: data.cardVertical ? "3 / 4" : "4 / 5",
                maxHeight: data.cardVertical ? "520px" : "480px",
                position: "relative",
              }}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={displayHeroSrc}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  style={{ position: "absolute", inset: 0 }}
                >
                  <Image
                    src={displayHeroSrc}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 420px"
                    style={{ objectFit: "contain", objectPosition: "center" }}
                    unoptimized
                  />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </section>

      {/* ── Features ── */}
      <section
        style={{
          width: "100%",
          backgroundColor: "#fff",
          padding: "3rem 1.25rem 4rem",
          boxSizing: "border-box",
        }}
        className="md:py-16 md:px-6"
      >
        <div style={{ maxWidth: "72rem", margin: "0 auto" }} className="px-0">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
            style={{ textAlign: "center", marginBottom: "3.5rem" }}
          >
            <p
              style={{
                margin: "0 0 0.625rem",
                fontSize: "0.6875rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#888",
              }}
            >
              Capabilities
            </p>
            <h2
              style={{
                margin: 0,
                fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
                fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
                fontWeight: 700,
                color: "#111",
                letterSpacing: "-0.035em",
                lineHeight: 1.15,
              }}
            >
              What you can build
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5"
          >
            {data.features.map((feature, idx) => (
              <motion.div
                key={feature.title}
                variants={fadeUp}
                style={{
                  padding: "1.75rem 2rem",
                  borderRadius: "1rem",
                  border: "1px solid rgba(17,17,17,0.07)",
                  backgroundColor: "#fafaf9",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
                  <span
                    style={{
                      flexShrink: 0,
                      width: "28px",
                      height: "28px",
                      borderRadius: "8px",
                      backgroundColor: `color-mix(in srgb, ${accent} 12%, transparent)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontSize: "0.6875rem",
                      fontWeight: 700,
                      color: accent,
                      letterSpacing: "0.02em",
                      marginTop: "2px",
                    }}
                  >
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <h3
                    style={{
                      margin: 0,
                      fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
                      fontSize: "1.0625rem",
                      fontWeight: 600,
                      color: "#111",
                      letterSpacing: "-0.025em",
                      lineHeight: 1.3,
                    }}
                  >
                    {feature.title}
                  </h3>
                </div>
                <p
                  style={{
                    margin: "0 0 0 2.875rem",
                    fontSize: "0.875rem",
                    color: "#5e5c5a",
                    lineHeight: 1.7,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {feature.body}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Who uses this ── */}
      <section
        style={{
          width: "100%",
          backgroundColor: "#f6f5f3",
          padding: "3rem 1.25rem 4rem",
          boxSizing: "border-box",
        }}
        className="md:py-14 md:px-6"
      >
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, ease: [0.215, 0.61, 0.355, 1] }}
            style={{ textAlign: "center", marginBottom: "3.5rem" }}
          >
            <p
              style={{
                margin: "0 0 0.625rem",
                fontSize: "0.6875rem",
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#888",
              }}
            >
              Who it&apos;s for
            </p>
            <h2
              style={{
                margin: 0,
                fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
                fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)",
                fontWeight: 700,
                color: "#111",
                letterSpacing: "-0.035em",
                lineHeight: 1.15,
              }}
            >
              Built for teams that move fast
            </h2>
          </motion.div>

          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-60px" }}
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "1rem",
            }}
          >
            {data.who.map((item) => (
              <motion.div
                key={item.role}
                variants={fadeUp}
                style={{
                  padding: "1.5rem 1.75rem",
                  borderRadius: "0.875rem",
                  border: "1px solid rgba(17,17,17,0.07)",
                  backgroundColor: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.125rem" }}>
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      backgroundColor: accent,
                      flexShrink: 0,
                    }}
                  />
                  <p
                    style={{
                      margin: 0,
                      fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
                      fontSize: "0.9375rem",
                      fontWeight: 600,
                      color: "#111",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {item.role}
                  </p>
                </div>
                <p
                  style={{
                    margin: "0 0 0 1.25rem",
                    fontSize: "0.8125rem",
                    color: "#5e5c5a",
                    lineHeight: 1.65,
                    letterSpacing: "-0.01em",
                  }}
                >
                  {item.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section
        style={{
          width: "100%",
          backgroundColor: "#0a0a0a",
          padding: "3rem 1.25rem 4rem",
          boxSizing: "border-box",
          textAlign: "center",
        }}
        className="md:py-16 md:px-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.215, 0.61, 0.355, 1] }}
          style={{
            maxWidth: "40rem",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: "1.75rem",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
              fontSize: "clamp(1.875rem, 4vw, 3rem)",
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "-0.04em",
              lineHeight: 1.12,
            }}
          >
            Ready to build faster?
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "1rem",
              color: "rgba(255,255,255,0.5)",
              lineHeight: 1.65,
            }}
          >
            Start generating production-ready 3D assets today or book a demo to see what&apos;s possible.
          </p>
          <div style={{ display: "flex", gap: "0.875rem", justifyContent: "center", flexWrap: "wrap" }}>
            {isSignedIn ? (
              <Link
                href="/app/studio"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0.875rem 2rem",
                  borderRadius: "100px",
                  backgroundColor: "#fff",
                  color: "#111",
                  fontSize: "0.9375rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  letterSpacing: "-0.01em",
                }}
              >
                Start Creating
              </Link>
            ) : (
              <SignUpButton mode="modal" forceRedirectUrl="/app/studio">
                <button
                  type="button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0.875rem 2rem",
                    borderRadius: "100px",
                    backgroundColor: "#fff",
                    color: "#111",
                    fontSize: "0.9375rem",
                    fontWeight: 600,
                    letterSpacing: "-0.01em",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Start Creating
                </button>
              </SignUpButton>
            )}
            <a
              href={CAL_DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0.875rem 2rem",
                borderRadius: "100px",
                border: "1.5px solid rgba(255,255,255,0.2)",
                backgroundColor: "transparent",
                color: "#fff",
                fontSize: "0.9375rem",
                fontWeight: 600,
                textDecoration: "none",
                letterSpacing: "-0.01em",
              }}
            >
              Book Demo
            </a>
          </div>
        </motion.div>
      </section>
    </main>
  );
}
