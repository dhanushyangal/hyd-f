"use client";

import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full">
      {/* Top Section - White Background */}
      <div className="bg-white px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12 md:gap-16 lg:gap-20">
            {/* COMPANY */}
            <div className="w-full sm:w-auto">
              <h3 
                className="text-sm sm:text-base lg:text-lg text-gray-500 uppercase tracking-wider mb-4 sm:mb-6 lg:mb-8 font-medium"
                style={{ fontFamily: 'var(--font-space-grotesk), Space Grotesk, sans-serif' }}
              >
                COMPANY
              </h3>
              <ul className="space-y-2 sm:space-y-3 lg:space-y-4">
                <li>
                  <Link 
                    href="/roadmap" 
                    className="text-xl sm:text-2xl lg:text-3xl font-bold text-black hover:text-gray-700 transition-colors block"
                    style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                  >
                    Roadmap
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/faq" 
                    className="text-xl sm:text-2xl lg:text-3xl font-bold text-black hover:text-gray-700 transition-colors block"
                    style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                  >
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/contact" 
                    className="text-xl sm:text-2xl lg:text-3xl font-bold text-black hover:text-gray-700 transition-colors block"
                    style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            {/* KNOWLEDGE */}
            <div className="w-full sm:w-auto">
              <h3 
                className="text-sm sm:text-base lg:text-lg text-gray-500 uppercase tracking-wider mb-4 sm:mb-6 lg:mb-8 font-medium"
                style={{ fontFamily: 'var(--font-space-grotesk), Space Grotesk, sans-serif' }}
              >
                KNOWLEDGE
              </h3>
              <ul className="space-y-2 sm:space-y-3 lg:space-y-4">
                <li>
                  <Link 
                    href="/3d-ai" 
                    className="text-xl sm:text-2xl lg:text-3xl font-bold text-black hover:text-gray-700 transition-colors block"
                    style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                  >
                    3D & AI
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/science-technology" 
                    className="text-xl sm:text-2xl lg:text-3xl font-bold text-black hover:text-gray-700 transition-colors block"
                    style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                  >
                    Science & Technology
                  </Link>
                </li>
              </ul>
            </div>

            {/* TEAM & WORK */}
            <div className="w-full sm:w-auto">
              <h3 
                className="text-sm sm:text-base lg:text-lg text-gray-500 uppercase tracking-wider mb-4 sm:mb-6 lg:mb-8 font-medium"
                style={{ fontFamily: 'var(--font-space-grotesk), Space Grotesk, sans-serif' }}
              >
                TEAM & WORK
              </h3>
              <ul className="space-y-2 sm:space-y-3 lg:space-y-4">
                <li>
                  <Link 
                    href="/team" 
                    className="text-xl sm:text-2xl lg:text-3xl font-bold text-black hover:text-gray-700 transition-colors block"
                    style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                  >
                    Our Team
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/careers" 
                    className="text-xl sm:text-2xl lg:text-3xl font-bold text-black hover:text-gray-700 transition-colors block"
                    style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                  >
                    Careers
                  </Link>
                </li>
              </ul>
            </div>

            {/* CONTACT */}
            <div className="w-full sm:w-auto">
              <h3 
                className="text-sm sm:text-base lg:text-lg text-gray-500 uppercase tracking-wider mb-4 sm:mb-6 lg:mb-8 font-medium"
                style={{ fontFamily: 'var(--font-space-grotesk), Space Grotesk, sans-serif' }}
              >
                CONTACT
              </h3>
              <a 
                href="mailto:hi@hydrilla.ai" 
                className="text-xl sm:text-2xl lg:text-3xl font-bold text-black hover:text-gray-700 transition-colors block"
                style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
              >
                hi@hydrilla.ai
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Section - Light Beige Background */}
      <div className="bg-neutral-50 px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-6 sm:gap-8">
          {/* Brand Name - Centered on mobile */}
          <div className="w-full sm:w-auto">
            <span 
              className="text-4xl sm:text-5xl lg:text-6xl font-bold text-black leading-tight block text-center sm:text-left"
              style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
            >
              Hydrilla
            </span>
          </div>

          {/* Copyright and Social Icons - Stacked on mobile, side by side on desktop */}
          <div className="flex flex-col sm:flex-row items-center justify-between w-full sm:w-auto gap-4 sm:gap-6">
            <p 
              className="text-sm sm:text-base text-black text-center sm:text-left order-2 sm:order-1"
              style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
            >
              2025 Hydrilla AI - All Rights Reserved
            </p>
            <div className="flex items-center gap-5 sm:gap-6 order-1 sm:order-2">
              {/* LinkedIn */}
              <a
                href="https://www.linkedin.com/company/hydrilla-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black hover:text-gray-700 transition-colors"
                aria-label="LinkedIn"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>

              {/* Twitter/X */}
              <a
                href="https://x.com/hydrilla_ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black hover:text-gray-700 transition-colors"
                aria-label="Twitter"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* Instagram */}
              <a
                href="https://www.instagram.com/hydrilla.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black hover:text-gray-700 transition-colors"
                aria-label="Instagram"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>

              {/* Reddit */}
              <a
                href="https://www.reddit.com/r/hydrilla/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-black hover:text-gray-700 transition-colors"
                aria-label="Reddit"
              >
                <img 
                  src="https://img.icons8.com/?size=100&id=Aj0b870PMQIm&format=png&color=000000" 
                  alt="Reddit" 
                  className="w-6 h-6"
                />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

