"use client";

import { useRef } from "react";
import Image from "next/image";
import Footer from "../../components/layout/Footer";

export default function AboutPage() {
  // Refs for sections (navbar will detect scroll position)
  const heroSectionRef = useRef<HTMLElement>(null);
  const contentSectionRef = useRef<HTMLElement>(null);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section ref={heroSectionRef} className="relative min-h-screen w-full overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/waterhydrilla.png"
            alt="About Background"
            fill
            className="object-cover"
            priority
          />
          {/* Overlay for better text readability */}
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        {/* Content Container */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 md:px-8 pt-32 sm:pt-40 md:pt-48 pb-12 sm:pb-16 md:pb-20 flex flex-col items-center justify-center min-h-screen">
          {/* Subtitle */}
          <p 
            className="text-xs sm:text-sm md:text-base text-black/70 mb-6 sm:mb-8 tracking-[0.15em] uppercase font-medium animate-fade-in"
            style={{ fontFamily: 'var(--font-space-grotesk), Space Grotesk, sans-serif' }}
          >
            ( About Hydrilla AI )
          </p>
          
          {/* Main Heading */}
          <h1 className="text-center animate-fade-in-up">
            <span 
              className="block text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl text-black leading-[1.05] tracking-[-0.02em] font-bold"
              style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
            >
              About
            </span>
          </h1>
        </div>
      </section>

      {/* Content Section */}
      <section 
        ref={contentSectionRef}
        className="relative py-20 sm:py-24 md:py-32 px-4 sm:px-6 md:px-8 bg-gradient-to-b from-neutral-50 to-white"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center animate-fade-in-up animate-delay-200">
            <p 
              className="text-xl sm:text-2xl md:text-3xl text-gray-600 leading-relaxed font-medium tracking-tight"
              style={{ fontFamily: 'var(--font-space-grotesk), Space Grotesk, sans-serif' }}
            >
              Content coming soon...
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}



