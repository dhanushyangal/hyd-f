"use client";

import React, { useState } from "react";
import Image from "next/image";
import SeeWorkspaceButton from "../SeeWorkspaceButton";
import { BlurReveal } from "@/components/ui/BlurReveal";

const CLOUDINARY_WORKFLOW_BASE =
  "https://res.cloudinary.com/dqizbxc9e/image/upload";

const workflowImage = (id: string, transform: string) =>
  `${CLOUDINARY_WORKFLOW_BASE}/${transform}/v1/hydrilla-landing/workflow/${id}`;

const WORKFLOW_BACKDROP = workflowImage("back", "f_auto,q_auto,w_1280");
const WORKFLOW_DESKTOP = workflowImage("workspace", "f_auto,q_auto,c_fit,w_1200");
const WORKFLOW_MOBILE = workflowImage("workflow-mobile", "f_auto,q_auto,c_fill,w_760,h_760");

const FLOATING_TAGS = [
  {
    title: "Prompt to 3D",
    description: "Generate assets from a short description.",
    position: "top-left",
  },
  {
    title: "Image to 3D",
    description: "Turn a reference into clean topology.",
    position: "top-right",
  },
  {
    title: "Asset lineage",
    description: "Every step, one workspace.",
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
    <section className="relative w-full bg-white py-16 sm:py-20 md:py-24 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="text-center mb-12 sm:mb-14 md:mb-16">
          <BlurReveal
            as="h2"
            className="text-3xl sm:text-4xl md:text-5xl lg:text-[2.75rem] font-bold text-[#111] tracking-tight leading-[1.12]"
            style={{ fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}
          >
            Workflow for you
          </BlurReveal>
        </div>

        <div className="relative w-full min-h-[620px] sm:min-h-[620px] md:min-h-[600px] rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200/60">
          <div className="absolute inset-0 h-full w-full bg-neutral-100">
            <Image
              src={WORKFLOW_BACKDROP}
              alt=""
              fill
              className="object-cover object-center"
              sizes="(max-width: 1280px) 100vw, 1152px"
              unoptimized
              loading="lazy"
              decoding="async"
            />
          </div>

          {/* Simple floating labels — title + one short line */}
          {FLOATING_TAGS.map((tag) => (
            <div
              key={tag.title}
              className={`absolute z-30 max-w-[150px] sm:max-w-[168px] rounded-xl bg-white/92 backdrop-blur-sm border border-black/[0.06] px-3 py-2.5 sm:px-3.5 sm:py-3 shadow-[0_4px_16px_rgba(0,0,0,0.06)] ${positionClasses[tag.position]}`}
            >
              <h3
                className="font-semibold text-[#111] text-[12px] sm:text-[13px] leading-tight tracking-[-0.01em]"
                style={{ fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}
              >
                {tag.title}
              </h3>
              <p
                className="mt-1 text-neutral-500 text-[11px] sm:text-[12px] leading-snug"
                style={{ fontFamily: "var(--font-dm-sans), DM Sans, sans-serif" }}
              >
                {tag.description}
              </p>
            </div>
          ))}

          <div className="absolute inset-0 flex items-center justify-center px-4 py-24 sm:p-8 md:p-10">
            <div className="md:hidden relative w-full max-w-[78vw] aspect-square rounded-xl overflow-hidden z-20 shadow-[0_18px_45px_rgba(15,23,42,0.18)] ring-1 ring-white/60">
              <Image
                src={WORKFLOW_MOBILE}
                alt="Hydrilla workflow across industries"
                fill
                className="object-cover object-center"
                sizes="78vw"
                loading="lazy"
                decoding="async"
                unoptimized
              />
            </div>
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
                src={WORKFLOW_DESKTOP}
                alt="Hydrilla workspace"
                fill
                className="object-contain object-top"
                sizes="(max-width: 1024px) 100vw, 960px"
                loading="lazy"
                decoding="async"
                unoptimized
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

        <div className="text-center mt-10 sm:mt-12">
          <SeeWorkspaceButton />
        </div>
      </div>
    </section>
  );
}
