"use client";

import React, { useState } from "react";
import Image from "next/image";
import SeeWorkspaceButton from "../SeeWorkspaceButton";

const FLOATING_TAGS = [
  {
    title: "Prompt to 3D",
    description: "Describe what you need and generate production-ready 3D assets in one flow.",
    position: "top-left",
  },
  {
    title: "Image to 3D",
    description: "Upload a reference and get clean topology for Unreal, Unity, and more.",
    position: "top-right",
  },
  {
    title: "Asset lineage",
    description: "Track every step from concept to final model in one workspace.",
    position: "bottom-left",
  },
];

const positionClasses: Record<string, string> = {
  "top-left": "left-3 top-3 sm:left-6 sm:top-6 md:left-8 md:top-8",
  "top-right": "right-3 top-3 sm:right-6 sm:top-6 md:right-8 md:top-8",
  "bottom-left": "left-3 bottom-3 sm:left-6 sm:bottom-6 md:left-8 md:bottom-8",
};

export default function AppShowcase() {
  const [imgLoaded, setImgLoaded] = useState(false);

  return (
    <section className="relative w-full bg-neutral-50 py-16 sm:py-20 md:py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Headline: Space Grotesk */}
        <div className="text-center mb-12 sm:mb-14 md:mb-16">
          <h2
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-bold text-[#111] tracking-tight leading-[1.12]"
            style={{ fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif" }}
          >
            Workflow for you
          </h2>
        </div>

        {/* Main visual: back.gif with floating tags + center screenshot */}
        <div className="relative w-full min-h-[620px] sm:min-h-[620px] md:min-h-[600px] rounded-2xl overflow-hidden bg-neutral-100">
          {/* Background: back.gif — keep unoptimized for animation, lazy load since below fold */}
          <div className="absolute inset-0 h-full w-full bg-neutral-100">
            <Image
              src="/workflow/back.gif"
              alt=""
              fill
              className="object-cover object-center"
              sizes="(max-width: 1280px) 100vw, 1152px"
              unoptimized
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Floating review-style cards (on top of back.gif) */}
          {FLOATING_TAGS.map((tag) => (
            <div
              key={tag.title}
              className={`absolute z-30 w-[min(42vw,170px)] sm:w-auto sm:max-w-[200px] md:max-w-[220px] rounded-lg bg-white/90 backdrop-blur-md border border-white/70 p-2.5 sm:p-3.5 shadow-[0_12px_28px_rgba(15,23,42,0.1)] ring-1 ring-black/[0.03] ${positionClasses[tag.position]}`}
            >
              <div className="flex items-start gap-2 max-[390px]:gap-1.5">
                <div
                  className="flex-shrink-0 w-2.5 h-2.5 sm:w-7 sm:h-7 mt-1 rounded-full flex items-center justify-center ring-2 ring-white/80"
                  style={{ backgroundColor: "rgba(99, 179, 237, 0.85)" }}
                />
                <div className="min-w-0">
                  <h3
                    className="font-bold text-[#111] text-[11px] sm:text-sm mb-0.5 leading-tight"
                    style={{ fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif" }}
                  >
                    {tag.title}
                  </h3>
                  <p
                    className="text-neutral-500 text-[10px] sm:text-xs leading-snug sm:leading-relaxed"
                    style={{ fontFamily: "var(--font-dm-sans), DM Sans, sans-serif" }}
                  >
                    {tag.description}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Center: mobile = square mbworkflow image; desktop = workspace screenshot in card */}
          <div className="absolute inset-0 flex items-center justify-center px-4 py-24 sm:p-8 md:p-10">
            {/* Mobile only: square workflow image (no card), on top */}
            <div className="md:hidden relative w-full max-w-[78vw] aspect-square rounded-xl overflow-hidden z-20 shadow-[0_18px_45px_rgba(15,23,42,0.18)] ring-1 ring-white/60">
              <Image
                src="/workflow/worflow-image-mobile.png"
                alt="Hydrilla workflow across industries"
                fill
                className="object-cover object-center"
                sizes="78vw"
                priority={false}
              />
            </div>
            {/* Desktop: workspace screenshot in card */}
            <div
              className="hidden md:flex app-showcase-img relative w-full max-w-[min(100%,960px)] rounded-lg overflow-hidden bg-white items-center justify-center"
              style={{
                boxShadow:
                  "0 26px 60px -6px rgba(25,34,35,0.12), 0 28px 28px -14px rgba(25,34,35,0.04), 0 6px 6px -3px rgba(25,34,35,0.06), 0 1px 1px -0.5px rgba(25,34,35,0.06)",
                outline: "1px solid rgba(17,17,17,0.08)",
                outlineOffset: -1,
              }}
            >
              {!imgLoaded && (
                <div
                  className="absolute inset-0 z-10"
                  style={{
                    background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                    backgroundSize: "200% 100%",
                    animation: "shimmer 1.4s infinite",
                  }}
                />
              )}
              <Image
                src="/workflow/image.png"
                alt="Hydrilla workspace"
                fill
                className="object-contain object-top"
                sizes="(max-width: 1024px) 100vw, 960px"
                loading="lazy"
                onLoad={() => setImgLoaded(true)}
              />
            </div>
          </div>
          <style>{`
            .app-showcase-img {
              height: clamp(320px, 65vh, 560px);
            }
            @media (max-width: 640px) {
              .app-showcase-img {
                height: auto;
                aspect-ratio: 1 / 1;
                max-width: 82vw;
              }
            }
            @keyframes shimmer {
              0% { background-position: -200% 0; }
              100% { background-position: 200% 0; }
            }
          `}</style>
        </div>

        {/* CTA */}
        <div className="text-center mt-10 sm:mt-12">
          <SeeWorkspaceButton />
        </div>
      </div>
    </section>
  );
}
