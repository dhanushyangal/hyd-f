"use client";

import { useEffect } from "react";
import Footer from "../../components/layout/Footer";

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-black mb-6 leading-tight font-dm-sans">
              Privacy Policy
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
                This Privacy Policy explains how Hydrilla AI (&quot;Hydrilla,&quot;
                &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) collects, uses, and shares information
                when you use our websites, products, and services
                (collectively, the &quot;Service&quot;).
              </p>
              <p>
                By using the Service, you agree to this Privacy Policy. If you
                do not agree, please do not use the Service. Please also review
                our{" "}
                <a
                  href="/terms-and-conditions"
                  className="text-black underline hover:text-gray-700"
                >
                  Terms and Conditions
                </a>{" "}
                and{" "}
                <a
                  href="/cookie-policy"
                  className="text-black underline hover:text-gray-700"
                >
                  Cookie Policy
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                2. Information We Collect
              </h2>

              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">
                2.1 Information You Provide
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Account information,</strong> such as your name and
                  email address when you create an account.
                </li>
                <li>
                  <strong>Payment information</strong> when you make a purchase.
                  Payments are processed by our third-party payment provider. We
                  do not store full payment card details on our servers.
                </li>
                <li>
                  <strong>Content you submit,</strong> including prompts,
                  images, and other materials you upload, as well as content
                  generated through the Service.
                </li>
                <li>
                  <strong>Communications</strong> you send to us, such as
                  support or sales inquiries.
                </li>
              </ul>

              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">
                2.2 Information Collected Automatically
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Usage data,</strong> such as pages visited, features
                  used, and how you interact with the Service.
                </li>
                <li>
                  <strong>Device and technical data,</strong> such as IP
                  address, browser type, operating system, and device
                  identifiers.
                </li>
                <li>
                  <strong>Cookies and similar technologies,</strong> as
                  described in our Cookie Policy.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                3. How We Use Information
              </h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, maintain, and improve the Service</li>
                <li>Create and manage accounts</li>
                <li>Process payments and transactions</li>
                <li>Generate and deliver outputs based on your inputs</li>
                <li>
                  Communicate with you about your account, updates, and support
                </li>
                <li>Analyze usage and improve performance and reliability</li>
                <li>
                  Detect, prevent, and address security issues, fraud, and abuse
                </li>
                <li>Comply with legal obligations and enforce our Terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                4. How We Share Information
              </h2>
              <p>
                We do not sell your personal information. We may share
                information with:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Service providers</strong> who help us operate the
                  Service, including authentication, payment processing,
                  hosting, and analytics providers (such as PostHog)
                </li>
                <li>
                  <strong>Legal authorities</strong> when required by law or to
                  protect our rights, users, or the public
                </li>
                <li>
                  <strong>Business transferees</strong> in connection with a
                  merger, acquisition, or sale of assets
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                5. Data Security
              </h2>
              <p>
                We take reasonable measures to protect personal information.
                However, no method of transmission or storage is completely
                secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                6. Your Rights and Choices
              </h2>
              <p>
                Depending on your location, you may have rights to access,
                correct, delete, or export your personal information, or to opt
                out of certain communications. To exercise these rights, contact
                us at{" "}
                <a
                  href="mailto:founders@hydrilla.ai"
                  className="text-black underline hover:text-gray-700"
                >
                  founders@hydrilla.ai
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                7. Cookies
              </h2>
              <p>
                We use cookies and similar technologies as described in our{" "}
                <a
                  href="/cookie-policy"
                  className="text-black underline hover:text-gray-700"
                >
                  Cookie Policy
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                8. Children&apos;s Privacy
              </h2>
              <p>
                The Service is not directed to children under 13, and we do not
                knowingly collect personal information from children under 13.
                If you believe we have collected information from a child under
                13, please contact us at{" "}
                <a
                  href="mailto:founders@hydrilla.ai"
                  className="text-black underline hover:text-gray-700"
                >
                  founders@hydrilla.ai
                </a>
                , and we will take steps to delete it.
              </p>
              <p>
                If you are under the age required to consent to online services
                in your country, you may use the Service only with parental or
                guardian permission where required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                9. International Transfers
              </h2>
              <p>
                Your information may be processed in countries other than your
                own. Those countries may have different data protection laws. By
                using the Service, you acknowledge that your information may be
                transferred as described in this Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                10. Retention
              </h2>
              <p>
                We retain personal information only as long as needed to provide
                the Service, comply with legal obligations, resolve disputes,
                and enforce our agreements. When it is no longer needed, we
                delete or de-identify it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                11. Changes
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will
                post any changes on this page and update the &quot;Last Updated&quot;
                date. Continued use of the Service after changes take effect
                means you accept the updated Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                12. Contact Us
              </h2>
              <p>If you have questions about this Privacy Policy, contact us:</p>
              <div className="bg-gray-50 p-6 rounded-lg mt-4">
                <p className="mb-2">
                  <strong>Email:</strong>{" "}
                  <a
                    href="mailto:founders@hydrilla.ai"
                    className="text-black underline hover:text-gray-700"
                  >
                    founders@hydrilla.ai
                  </a>
                </p>
                <p>
                  <strong>Website:</strong>{" "}
                  <a
                    href="https://hydrilla.ai"
                    className="text-black underline hover:text-gray-700"
                  >
                    https://hydrilla.ai
                  </a>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
