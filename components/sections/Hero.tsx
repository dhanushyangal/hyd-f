"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowUp } from "lucide-react";

/**
 * Hero Section Component
 * Features gradient background with promotional badge, main heading, and CTA
 */
export default function Hero() {
  const [inputValue, setInputValue] = useState("");
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [placeholderOpacity, setPlaceholderOpacity] = useState(1);
  
  const placeholders = [
    "Create a futuristic robot character",
    "Generate a vintage car model",
    "Design a modern furniture piece"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      setPlaceholderOpacity(0);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % placeholders.length);
        // Fade in
        setPlaceholderOpacity(1);
      }, 300); // Half of transition duration
    }, 3000); // Change every 3 seconds

    return () => clearInterval(interval);
  }, [placeholders.length]);

  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Background GIF */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/bg-hydrilla.gif')",
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-transparent to-blue-900/40" />

      {/* Content Container */}
      <div className="relative z-10 container mx-auto px-4 md:px-6 pt-24 md:pt-32 pb-20 flex flex-col items-center justify-center min-h-screen">
        {/* Main Heading */}
        <h1 className="text-center mb-6 md:mb-8 max-w-5xl">
          <span 
            className="block text-5xl md:text-7xl lg:text-8xl text-white leading-[1.1] tracking-tight"
            style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
          >
            Create Production Ready 3D Assets In Minutes
          </span>
        </h1>

        {/* Subheading */}
        <div className="text-center mb-8 md:mb-10 max-w-2xl">
          <p 
            className="text-lg md:text-xl text-white/95 leading-relaxed mb-2"
            style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
          >
            Transform text and images into high quality 3D models instantly.
          </p>
          <p 
            className="text-base md:text-lg text-white/85 leading-relaxed"
            style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
          >
            Trusted by artist studios and game developers worldwide.
          </p>
        </div>

        {/* CTA Button */}
        <div className="mb-12 md:mb-16">
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-3 bg-white text-black px-8 py-4 rounded-full text-base md:text-lg font-bold hover:bg-gray-50 hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-[0_20px_60px_rgba(255,255,255,0.3)]"
          >
            GET STARTED
            <svg
              width="18"
              height="18"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
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

        {/* Search/Question Input */}
        <div className="w-full max-w-2xl">
          <div className="relative group">
            <div className="relative w-full">
              <label htmlFor="prompt-input" className="sr-only">
                Enter prompt to create 3D asset
              </label>
              <input
                id="prompt-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                aria-label="Enter prompt to create 3D asset"
                className="w-full px-6 py-4 md:px-8 md:py-5 pr-16 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-white text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-white/40 transition-all duration-300 shadow-lg"
                style={{
                  fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                }}
              />
              {!inputValue && (
                <div 
                  className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 pointer-events-none text-white/60 text-base md:text-lg"
                  style={{
                    fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
                    opacity: placeholderOpacity,
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  {placeholders[placeholderIndex]}
                </div>
              )}
            </div>
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 flex items-center justify-center transition-all duration-300 group-hover:scale-110"
              aria-label="Submit question"
            >
              <ArrowUp className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Bottom Text */}
        <div className="mt-12 md:mt-16">
          <p 
            className="text-white/80 text-sm md:text-base font-medium"
            style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
          >
            Describe anything. Generate 3D assets.
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
    </section>
  );
}




