"use client";

import { useRef } from "react";
import Image from "next/image";
import Footer from "../../components/layout/Footer";

export default function ContactPage() {
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
            alt="Contact Background"
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
            className="text-sm sm:text-base md:text-lg text-black/70 mb-4 sm:mb-6 tracking-wide"
            style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
          >
            ( Get in Touch )
          </p>
          
          {/* Main Heading */}
          <h1 className="text-center">
            <span 
              className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-black leading-tight tracking-tight font-bold"
              style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
            >
              Contact
            </span>
          </h1>
        </div>
      </section>

      {/* Content Section */}
      <section 
        ref={contentSectionRef}
        className="relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 bg-neutral-50"
      >
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-6">
            <p 
              className="text-lg sm:text-xl text-gray-600 leading-relaxed"
              style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
            >
              Have questions or want to learn more about Hydrilla AI?
            </p>
            <div className="pt-4">
              <a 
                href="mailto:hi@hydrilla.ai"
                className="text-2xl sm:text-3xl font-bold text-black hover:text-gray-700 transition-colors inline-block"
                style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
              >
                hi@hydrilla.ai
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

