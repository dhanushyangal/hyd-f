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
              Last Updated: July 14, 2026
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
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                1. Introduction
              </h2>
              <p>
                This Cookie Policy explains how Hydrilla AI (&quot;we,&quot; &quot;our,&quot; or
                &quot;us&quot;) uses cookies and similar technologies on our Service. It
                should be read together with our{" "}
                <a
                  href="/privacy-policy"
                  className="text-black underline hover:text-gray-700"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                2. What Are Cookies?
              </h2>
              <p>
                Cookies are small text files stored on your device when you
                visit a website. They help the site function, remember your
                preferences, and understand how it is used.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                3. How We Use Cookies
              </h2>
              <p>We use cookies to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Keep you signed in and secure your session</li>
                <li>Remember your preferences</li>
                <li>Understand how the Service is used</li>
                <li>Improve performance and reliability</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                4. Types of Cookies We Use
              </h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Essential cookies</strong> — required for the Service
                  to work, including authentication and security.
                </li>
                <li>
                  <strong>Functional cookies</strong> — remember choices you
                  make to improve your experience.
                </li>
                <li>
                  <strong>Analytics cookies</strong> — help us understand usage
                  and improve the Service. We use analytics tools such as
                  PostHog for this purpose.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                5. Managing Cookies
              </h2>
              <p>
                You can control or delete cookies through your browser settings.
                Please note that disabling certain cookies may affect how the
                Service works.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                6. Changes
              </h2>
              <p>
                We may update this Cookie Policy from time to time. Changes will
                be posted on this page with an updated &quot;Last Updated&quot; date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                7. Contact
              </h2>
              <p>
                Questions about this Cookie Policy? Contact us at{" "}
                <a
                  href="mailto:founders@hydrilla.ai"
                  className="text-black underline hover:text-gray-700"
                >
                  founders@hydrilla.ai
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
