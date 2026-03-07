"use client";

import Link from "next/link";
import Footer from "../../components/layout/Footer";
import { motion } from "framer-motion";

const GamepadIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="6" width="20" height="12" rx="4" />
    <path d="M8 12h4M10 10v4" />
    <circle cx="16" cy="11" r="1" fill="currentColor" stroke="none" />
    <circle cx="18" cy="13" r="1" fill="currentColor" stroke="none" />
  </svg>
);
const FilmIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="2.18" />
    <path d="M7 2v20M17 2v20M2 12h20M2 7h5M17 7h5M2 17h5M17 17h5" />
  </svg>
);
const BuildingIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const GlassesIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="6" cy="15" r="4" />
    <circle cx="18" cy="15" r="4" />
    <path d="M2 15h4M14 15h4M10 15a4 4 0 0 1 4 0M10 4v4" />
  </svg>
);
const BoxIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const USE_CASES = [
  {
    href: "/usecase/gamedev",
    title: "Game Development",
    tagline: "Assets built for real-time production",
    description: "Generate characters, props, and environments with clean geometry optimised for Unreal Engine, Unity, and other real-time pipelines.",
    tags: ["Unreal Engine", "Unity", "Characters", "Environments"],
    Icon: GamepadIcon,
    accent: "#3b8ee8",
    accentBg: "rgba(59,142,232,0.07)",
  },
  {
    href: "/usecase/filmproduction",
    title: "Film & Animation",
    tagline: "Production assets for cinematic pipelines",
    description: "Create detailed models for characters, props, and environments that integrate seamlessly into animation and VFX workflows.",
    tags: ["VFX", "Animation", "Props", "Characters"],
    Icon: FilmIcon,
    accent: "#e06c3b",
    accentBg: "rgba(224,108,59,0.07)",
  },
  {
    href: "/usecase/architecture",
    title: "Architecture & Interiors",
    tagline: "Architectural visualisation assets",
    description: "Generate furniture, architectural components, and interior objects suitable for high-fidelity visualisation workflows.",
    tags: ["Visualization", "Interiors", "Furniture", "Structures"],
    Icon: BuildingIcon,
    accent: "#7b5af5",
    accentBg: "rgba(123,90,245,0.07)",
  },
  {
    href: "/usecase/arvr",
    title: "AR / VR & XR",
    tagline: "Assets designed for immersive environments",
    description: "Create lightweight, spatially accurate assets including Gaussian splat-based environments for VR and AR experiences.",
    tags: ["Meta Quest", "Vision Pro", "WebXR", "Gaussian Splatting"],
    Icon: GlassesIcon,
    accent: "#3bbf8e",
    accentBg: "rgba(59,191,142,0.07)",
  },
  {
    href: "/usecase/productdesign",
    title: "Product Visualisation",
    tagline: "Product assets for visualisation and marketing",
    description: "Turn product concepts into polished 3D assets for e-commerce, marketing materials, and AR try-on experiences.",
    tags: ["E-commerce", "Marketing", "Product Design", "3D Commerce"],
    Icon: BoxIcon,
    accent: "#f0a830",
    accentBg: "rgba(240,168,48,0.07)",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.215, 0.61, 0.355, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
};

export default function UseCasesPage() {
  return (
    <>
      <main
        style={{
          width: "100%",
          backgroundColor: "#fff",
          fontFamily: "'DM Sans', Arial, sans-serif",
          WebkitFontSmoothing: "antialiased",
        }}
      >
        {/* ── Hero ── */}
        <section
          style={{
            width: "100%",
            minHeight: "70vh",
            background: "linear-gradient(160deg, #0a0a0a 60%, #0e1620 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "10rem 1.5rem 6rem",
            boxSizing: "border-box",
            textAlign: "center",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle radial glow */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(59,142,232,0.08) 0%, transparent 65%)",
              pointerEvents: "none",
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.215, 0.61, 0.355, 1] }}
            style={{ position: "relative", zIndex: 1, maxWidth: "46rem" }}
          >
            <p
              style={{
                margin: "0 0 1.125rem",
                fontFamily: "'DM Sans', Arial, sans-serif",
                fontSize: "0.6875rem",
                fontWeight: 600,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              Use Cases
            </p>
            <h1
              style={{
                margin: "0 0 1.25rem",
                fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
                fontSize: "clamp(2.25rem, 6vw, 4.25rem)",
                fontWeight: 700,
                color: "#fff",
                letterSpacing: "-0.04em",
                lineHeight: 1.08,
              }}
            >
              Built for every
              <br />
              creative pipeline
            </h1>
            <p
              style={{
                margin: 0,
                fontFamily: "'DM Sans', Arial, sans-serif",
                fontSize: "1.0625rem",
                color: "rgba(255,255,255,0.48)",
                lineHeight: 1.65,
                maxWidth: "34rem",
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              From game worlds to cinematic assets — Hydrilla generates production-ready 3D for any workflow.
            </p>
          </motion.div>
        </section>

        {/* ── Use case cards ── */}
        <section
          style={{
            width: "100%",
            padding: "5rem 1.5rem 7rem",
            boxSizing: "border-box",
            backgroundColor: "#faf9f7",
          }}
        >
          <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(330px, 1fr))",
                gap: "1.25rem",
              }}
            >
              {USE_CASES.map((uc) => (
                <motion.div key={uc.href} variants={fadeUp}>
                  <Link
                    href={uc.href}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "1.25rem",
                      padding: "1.875rem 2rem",
                      borderRadius: "1.125rem",
                      border: "1px solid rgba(17,17,17,0.08)",
                      backgroundColor: "#fff",
                      textDecoration: "none",
                      color: "inherit",
                      transition: "border-color 0.2s, box-shadow 0.2s, transform 0.18s",
                      boxShadow: "0 1px 4px rgba(17,17,17,0.04)",
                    }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(17,17,17,0.18)";
                      el.style.boxShadow = "0 6px 28px rgba(17,17,17,0.08)";
                      el.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(17,17,17,0.08)";
                      el.style.boxShadow = "0 1px 4px rgba(17,17,17,0.04)";
                      el.style.transform = "none";
                    }}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "12px",
                        backgroundColor: uc.accentBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: uc.accent,
                      }}
                    >
                      <uc.Icon />
                    </div>

                    <div>
                      <h2
                        style={{
                          margin: "0 0 0.375rem",
                          fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
                          fontSize: "1.125rem",
                          fontWeight: 700,
                          color: "#111",
                          letterSpacing: "-0.025em",
                          lineHeight: 1.25,
                        }}
                      >
                        {uc.title}
                      </h2>
                      <p
                        style={{
                          margin: "0 0 0.75rem",
                          fontFamily: "'DM Sans', Arial, sans-serif",
                          fontSize: "0.8125rem",
                          color: uc.accent,
                          fontWeight: 500,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {uc.tagline}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontFamily: "'DM Sans', Arial, sans-serif",
                          fontSize: "0.875rem",
                          color: "#5e5c5a",
                          lineHeight: 1.65,
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {uc.description}
                      </p>
                    </div>

                    {/* Tags */}
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem" }}>
                      {uc.tags.map((tag) => (
                        <span
                          key={tag}
                          style={{
                            padding: "0.25rem 0.625rem",
                            borderRadius: "100px",
                            border: "1px solid rgba(17,17,17,0.09)",
                            fontSize: "0.6875rem",
                            fontWeight: 500,
                            color: "#555",
                            letterSpacing: "0.01em",
                            backgroundColor: "#f5f4f2",
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* CTA row */}
                    <div
                      style={{
                        marginTop: "auto",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.375rem",
                        fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: uc.accent,
                        letterSpacing: "-0.01em",
                      }}
                    >
                      Explore {uc.title}
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden>
                        <path d="M2 6.5h9M8 4l3 2.5-3 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
