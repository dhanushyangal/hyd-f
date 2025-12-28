"use client";

import React from "react";
import Link from "next/link";

/**
 * Hero Section Component
 * Features premium white background with main heading and CTA
 */
export default function Hero() {

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-white">
      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-6 pt-20 sm:pt-24 md:pt-32 pb-12 sm:pb-16 md:pb-20 flex flex-col items-center justify-center min-h-screen">
        {/* Main Heading */}
        <h1 className="text-center mb-4 sm:mb-6 md:mb-8 max-w-5xl px-2">
          <span 
            className="block text-3xl sm:text-4xl md:text-5xl lg:text-7xl xl:text-8xl text-black leading-[1.1] tracking-tight font-dm-sans"
          >
            Create Production Ready 3D Assets In Minutes
          </span>
        </h1>

        {/* Subheading */}
        <div className="text-center mb-6 sm:mb-8 md:mb-10 max-w-2xl px-4">
          <p 
            className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 leading-relaxed mb-2 font-dm-sans"
          >
            Transform text and images into high quality 3D models instantly.
          </p>
          <p 
            className="text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 leading-relaxed font-dm-sans"
          >
            Trusted by artist studios and game developers worldwide.
          </p>
        </div>

        {/* CTA Button */}
        <div className="mb-8 sm:mb-12 md:mb-16">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 sm:gap-3 bg-black text-white px-6 sm:px-8 py-3 sm:py-4 rounded-full text-sm sm:text-base md:text-lg font-bold hover:bg-gray-900 hover:scale-105 transition-all duration-300 shadow-2xl active:scale-95 font-dm-sans"
          >
            GET STARTED
            <svg
              width="18"
              height="18"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 sm:w-5 sm:h-5"
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
  );
}

