"use client";

import { useEffect } from "react";
import Footer from "../../components/layout/Footer";

export default function CookiePolicyPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-black mb-6 leading-tight font-dm-sans">
              Cookie Policy
            </h1>
            <p className="text-base sm:text-lg text-black/80 font-dm-sans">
              Effective Date: Monday, January 23rd, 2026
            </p>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-24">
        <div className="prose prose-lg max-w-none">
          <div
            className="space-y-8 text-gray-700 leading-relaxed"
            style={{ fontFamily: "var(--font-dm-sans), DM Sans, sans-serif" }}
          >
            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">1. What are cookies</h2>
              <p>
                Cookies are small text files that websites place on your device (computer, tablet, or phone) when you visit. They help the site remember your preferences, keep you signed in, and understand how the site is used.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">2. How we use cookies</h2>
              <p>Hydrilla AI uses cookies to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Keep you logged in and manage your session</li>
                <li>Remember your preferences and settings</li>
                <li>Understand how our site and product are used (e.g. analytics)</li>
                <li>Improve performance and security</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">3. Types of cookies we use</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Strictly necessary:</strong> Required for the site to work (e.g. authentication). You cannot turn these off and still use the service.</li>
                <li><strong>Functional:</strong> Remember choices you make (e.g. language, region) to give you a better experience.</li>
                <li><strong>Analytics:</strong> Help us see how people use our site (e.g. pages visited, features used) so we can improve it. We may use services like PostHog for this.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">4. Managing cookies</h2>
              <p>
                You can control or delete cookies through your browser settings. Disabling or blocking certain cookies may affect how the site works (for example, you may need to sign in again or some features may not work as intended).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">5. Changes</h2>
              <p>
                We may update this Cookie Policy from time to time. We will post the updated version on this page and change the effective date when we do.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">6. Contact</h2>
              <p>
                If you have questions about our use of cookies, contact us at{" "}
                <a href="mailto:founders@hydrilla.co" className="text-black underline hover:text-gray-700">
                  founders@hydrilla.co
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
