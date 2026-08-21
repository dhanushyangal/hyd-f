"use client";

import React, { Suspense } from "react";
import dynamic from "next/dynamic";
import { motion } from "motion/react";
import { SignUpButton } from "@clerk/nextjs";
import { BlurReveal } from "@/components/ui/BlurReveal";

/**
 * Below-the-fold homepage sections.
 * Text-heavy blocks SSR so crawlers and LLMs see Features, Pricing, FAQ, and How it works.
 * Video/image showcases stay client-only to keep the initial document small.
 */
const IndustrySection = dynamic(() => import("@/components/sections/IndustrySection"), {
  loading: () => <div className="min-h-[320px] w-full" aria-hidden />,
});
const HowItWorks = dynamic(() => import("@/components/sections/HowItWorks"), {
  loading: () => <div className="min-h-[280px] w-full" aria-hidden />,
});
const Showcase = dynamic(() => import("@/components/sections/Showcase"), {
  ssr: false,
  loading: () => <div className="min-h-[480px] w-full" aria-hidden />,
});
const AppShowcase = dynamic(() => import("@/components/sections/AppShowcase"), {
  ssr: false,
  loading: () => <div className="min-h-[200px] w-full" aria-hidden />,
});
const FeaturesSection = dynamic(() => import("@/components/sections/FeaturesSection"), {
  loading: () => <div className="min-h-[320px] w-full" aria-hidden />,
});
const WhyHydrilla = dynamic(() => import("@/components/sections/WhyHydrilla"), {
  loading: () => <div className="min-h-[200px] w-full" aria-hidden />,
});
const PricingSection = dynamic(() => import("@/components/sections/PricingSection"), {
  loading: () => <div className="min-h-[400px] w-full" aria-hidden />,
});
const FAQSection = dynamic(() => import("@/components/sections/FAQSection"), {
  loading: () => <div className="min-h-[300px] w-full" aria-hidden />,
});

function MissionSection() {
  return (
    <section className="relative w-full bg-gradient-to-b from-white to-neutral-100 py-20 sm:py-24 md:py-32 px-4 sm:px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <BlurReveal
          as="p"
          stagger={0.09}
          duration={0.8}
          blurPx={14}
          className="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight tracking-tight text-[#111]"
          style={{ fontFamily: "var(--font-dm-sans), DM Sans, sans-serif" }}
        >
          Our mission is to build intelligent workflows that accelerate animation and 3D production.
        </BlurReveal>
      </div>
    </section>
  );
}

export default function HomeBelowFold() {
  return (
    <>
      <MissionSection />

      <div id="solutions">
        <Suspense fallback={<div className="min-h-[320px]" aria-hidden />}>
          <IndustrySection />
        </Suspense>
      </div>

      <Suspense fallback={<div className="min-h-[280px]" aria-hidden />}>
        <HowItWorks />
      </Suspense>

      <Showcase />

      <Suspense fallback={<div className="min-h-[200px]" aria-hidden />}>
        <AppShowcase />
      </Suspense>

      <div id="features">
        <Suspense fallback={<div className="min-h-[320px]" aria-hidden />}>
          <FeaturesSection />
        </Suspense>
      </div>

      <Suspense fallback={<div className="min-h-[200px]" aria-hidden />}>
        <WhyHydrilla />
      </Suspense>

      <div id="pricing">
        <Suspense fallback={<div className="min-h-[400px]" aria-hidden />}>
          <PricingSection />
        </Suspense>
      </div>

      <Suspense fallback={<div className="min-h-[300px]" aria-hidden />}>
        <FAQSection />
      </Suspense>

      <section
        className="relative w-full bg-white py-16 sm:py-20 md:py-24 border-t border-neutral-100"
        style={{ boxSizing: "border-box", WebkitFontSmoothing: "antialiased" }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8 text-center">
          <BlurReveal
            as="h2"
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111] tracking-tight leading-tight mb-6"
            style={{ fontFamily: "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif" }}
          >
            Ready to raise your 3D game?
          </BlurReveal>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="text-base sm:text-lg text-neutral-600 mb-10 max-w-2xl mx-auto"
            style={{ fontFamily: "var(--font-dm-sans), DM Sans, sans-serif" }}
          >
            Start creating production-ready 3D assets, or book a demo with our team.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-5"
          >
            <SignUpButton mode="modal" forceRedirectUrl="/app/studio">
              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-[#111] text-white text-base font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
                style={{ fontFamily: "var(--font-dm-sans), DM Sans, sans-serif" }}
              >
                Start creating
              </button>
            </SignUpButton>
            <a
              href="https://cal.com/hydrilla"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-[#111] bg-transparent text-[#111] text-base font-semibold hover:bg-[#111] hover:text-white transition-colors"
              style={{ fontFamily: "var(--font-dm-sans), DM Sans, sans-serif" }}
            >
              Book Demo
            </a>
          </motion.div>
        </div>
      </section>
    </>
  );
}
