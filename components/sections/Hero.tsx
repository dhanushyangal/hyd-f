"use client";

import React from "react";
import Link from "next/link";
import VideoBackground from "./VideoBackground";
import Showcase from "./Showcase";

/**
 * Hero Section Component
 * Features optimized video background with mobile performance considerations
 */
export default function Hero() {
  return (
    <>
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Optimized Video Background */}
      <VideoBackground 
        videoSrc="/herohydrilla.mp4"
        posterSrc="/herohydrillasrc.jpg"
        overlay={true}
      />
      
      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-6 pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 flex flex-col items-center justify-center min-h-screen">
        {/* Main Heading - mobile: larger typography; md+ unchanged */}
        <h1 className="text-center mb-4 sm:mb-6 md:mb-8 max-w-5xl px-2">
          <span 
            className="block text-4xl leading-[1.15] tracking-tight font-semibold sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl text-white md:leading-[1.1]"
            style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
          >
            Create Production Ready 3D Assets In Minutes
          </span>
        </h1>

        {/* Subheading - mobile: slightly larger for readability */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10 max-w-2xl px-4">
          <p 
            className="text-base leading-relaxed mb-2 font-dm-sans drop-shadow-lg text-white/90 sm:text-base md:text-lg lg:text-xl"
          >
            Transform text and images into high quality 3D models instantly.
          </p>
          <p 
            className="text-sm leading-relaxed font-dm-sans drop-shadow-md text-white/80 sm:text-sm md:text-base lg:text-lg"
          >
            Trusted by artist studios and game developers worldwide.
          </p>
        </div>

        {/* CTA Button - large, prominent; subtle hover shade */}
        <div className="mb-8 sm:mb-12 md:mb-16">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-3 bg-white/90 backdrop-blur-md border border-white/40 text-black px-8 sm:px-10 md:px-12 py-4 sm:py-5 md:py-6 rounded-full text-lg sm:text-xl md:text-2xl font-bold hover:bg-white hover:opacity-95 transition-all duration-300 shadow-2xl active:scale-95 font-dm-sans"
          >
            GET STARTED
            <svg
              width="22"
              height="22"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 sm:w-6 sm:h-6"
            >
              <path
                d="M1 7H13M13 7L7 1M13 7L7 13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>

    {/* Showcase Section */}
    <Showcase />

    {/* Mission Section */}
    <section className="relative w-full bg-gradient-to-b from-white to-[#faf8f5] py-20 sm:py-24 md:py-32 px-4 sm:px-6 md:px-8">
      <div className="max-w-6xl mx-auto">
        <p 
          className="text-center text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-black leading-tight tracking-tight"
          style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
        >
          Our mission is to build intelligent workflows that accelerate animation and 3D production.
        </p>
      </div>
    </section>
    </>
  );
}

