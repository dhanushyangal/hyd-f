"use client";

import { useState } from "react";
import Image from "next/image";
import Footer from "../../components/layout/Footer";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "What does Hydrilla AI do?",
    answer: "Hydrilla AI helps studios and professional artists generate production-usable 3D assets from text or image inputs in minutes."
  },
  {
    question: "Who is Hydrilla AI built for?",
    answer: "Hydrilla is built for game studios, animation teams, and professional 3D artists who need fast asset creation for prototyping and production workflows."
  },
  {
    question: "What types of 3D assets can I generate?",
    answer: "You can generate single objects and simple background assets such as props, environment elements, and modular structures."
  },
  {
    question: "Is Hydrilla AI suitable for final production assets?",
    answer: "Hydrilla is best suited for background assets, prototyping, and early production stages. Final hero assets may still require manual refinement."
  },
  {
    question: "What input methods are supported?",
    answer: "You can generate 3D assets using either a text description or a reference image of a single object."
  },
  {
    question: "What file formats are supported?",
    answer: "Hydrilla supports exporting 3D assets in GLB and FBX formats, compatible with Blender, Unity, and Unreal Engine."
  },
  {
    question: "Are the generated assets textured?",
    answer: "Yes, generated assets include basic textures suitable for immediate use and further refinement in your pipeline."
  },
  {
    question: "Do I need 3D expertise to use Hydrilla?",
    answer: "No advanced 3D expertise is required. Hydrilla is designed to be simple and accessible while still meeting professional needs."
  },
  {
    question: "How long does it take to generate an asset?",
    answer: "Most assets are generated within a few minutes, depending on complexity and selected quality."
  },
  {
    question: "Can I edit the generated assets?",
    answer: "You can edit exported assets using standard 3D tools such as Blender, Maya, Unity, or Unreal Engine."
  },
  {
    question: "Does Hydrilla support animation or rigging?",
    answer: "Animation and rigging are not supported in the current version. Hydrilla focuses on static 3D asset generation."
  },
  {
    question: "Can I use Hydrilla assets commercially?",
    answer: "Yes, assets generated using Hydrilla can be used in commercial projects, subject to the terms of service."
  },
  {
    question: "Is Hydrilla AI available publicly?",
    answer: "Hydrilla is currently in private beta. Access is provided to selected studios and professionals."
  },
  {
    question: "How can I request access?",
    answer: "You can request access directly through the website by submitting your details."
  },
  {
    question: "What makes Hydrilla different from other 3D AI tools?",
    answer: "Hydrilla is designed with studio workflows in mind, prioritizing clean outputs, production usability, and pipeline compatibility."
  },
  {
    question: "Will more features be added?",
    answer: "Yes. Future updates will focus on improving output quality, workflow integration, and expanded use cases based on user feedback."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen w-full overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/icehydrilla.png"
            alt="FAQ Background"
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
            ( Frequently Asked Questions )
          </p>
          
          {/* Main Heading */}
          <h1 className="text-center">
            <span 
              className="block text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-black leading-tight tracking-tight font-bold"
              style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
            >
              3D FAQ
            </span>
          </h1>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative py-16 sm:py-20 md:py-24 px-4 sm:px-6 md:px-8 bg-neutral-50">
        <div className="max-w-4xl mx-auto">
          <div className="space-y-0">
            {faqData.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className="border-b border-gray-200 last:border-b-0"
                >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full text-left py-6 sm:py-7 md:py-8 flex items-center justify-between gap-6 px-0 hover:bg-gray-50/40 transition-all duration-500 ease-in-out group"
                  {...(isOpen ? { 'aria-expanded': true } : { 'aria-expanded': false })}
                >
                  <h3 
                    className="text-lg sm:text-xl md:text-2xl font-medium text-black pr-8 flex-1 transition-all duration-500"
                    style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                  >
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0">
                    <svg
                      className={`w-5 h-5 sm:w-6 sm:h-6 text-gray-400 transition-all duration-700 ease-in-out ${
                        isOpen ? 'rotate-180' : 'rotate-0'
                      }`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </button>
                
                {/* Answer - Slow Smooth Animated */}
                <div
                  className={`overflow-hidden transition-all duration-700 ease-in-out ${
                    isOpen ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'
                  }`}
                  style={{
                    transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
                  }}
                >
                  <div className="px-0 pb-6 sm:pb-7 md:pb-8 pt-2">
                    <p 
                      className="text-base sm:text-lg text-gray-600 leading-relaxed"
                      style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                    >
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}

