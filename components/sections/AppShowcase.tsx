"use client";

import React from "react";
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
  "top-left": "left-4 sm:left-6 md:left-8 top-4 sm:top-6 md:top-8",
  "top-right": "right-4 sm:right-6 md:right-8 top-4 sm:top-6 md:top-8",
  "bottom-left": "left-4 sm:left-6 md:left-8 bottom-4 sm:bottom-6 md:bottom-8",
};

export default function AppShowcase() {
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
        <div className="relative w-full min-h-[480px] sm:min-h-[540px] md:min-h-[600px] rounded-2xl overflow-hidden bg-neutral-100">
          {/* Background: back.gif */}
          <div className="absolute inset-0">
            <Image
              src="/workflow/back.gif"
              alt=""
              fill
              className="object-cover object-center"
              sizes="(max-width: 1280px) 100vw, 1152px"
              unoptimized
            />
          </div>

          {/* Floating review-style cards (on top of back.gif) */}
          {FLOATING_TAGS.map((tag) => (
            <div
              key={tag.title}
              className={`absolute z-10 w-[calc(100%-2rem)] sm:w-auto sm:max-w-[200px] md:max-w-[220px] rounded-lg bg-white/95 backdrop-blur-sm border border-[#11111114] p-3 sm:p-3.5 shadow-[0_6px_20px_rgba(0,0,0,0.06)] ${positionClasses[tag.position]}`}
            >
              <div className="flex items-start gap-2">
                <div
                  className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ring-2 ring-white/80"
                  style={{ backgroundColor: "rgba(99, 179, 237, 0.85)" }}
                />
                <div className="min-w-0">
                  <h3
                    className="font-bold text-[#111] text-xs sm:text-sm mb-0.5 leading-tight"
                    style={{ fontFamily: "var(--font-space-grotesk), Space Grotesk, sans-serif" }}
                  >
                    {tag.title}
                  </h3>
                  <p
                    className="text-neutral-500 text-[11px] sm:text-xs leading-relaxed"
                    style={{ fontFamily: "var(--font-dm-sans), DM Sans, sans-serif" }}
                  >
                    {tag.description}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Center: full-sized workspace screenshot (floating card) */}
          <div className="absolute inset-0 flex items-center justify-center p-6 sm:p-8 md:p-10">
            <div
              className="app-showcase-img relative w-full max-w-[min(100%,960px)] rounded-lg overflow-hidden bg-white flex items-center justify-center"
              style={{
                boxShadow:
                  "0 26px 60px -6px rgba(25,34,35,0.12), 0 28px 28px -14px rgba(25,34,35,0.04), 0 6px 6px -3px rgba(25,34,35,0.06), 0 1px 1px -0.5px rgba(25,34,35,0.06)",
                outline: "1px solid rgba(17,17,17,0.08)",
                outlineOffset: -1,
              }}
            >
              <Image
                src="/workflow/image.png"
                alt="Hydrilla workspace"
                fill
                className="object-contain object-top"
                sizes="(max-width: 640px) 82vw, (max-width: 1024px) 100vw, 960px"
                priority={false}
                unoptimized
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
