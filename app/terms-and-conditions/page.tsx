"use client";

import { useEffect } from "react";
import Footer from "../../components/layout/Footer";

export default function TermsAndConditionsPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-black mb-6 leading-tight font-dm-sans">
              Terms and Conditions
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
                1. Agreement to Terms
              </h2>
              <p>
                By accessing or using Hydrilla AI (the &quot;Service&quot;), you agree to
                these Terms and Conditions (&quot;Terms&quot;). If you do not agree, do
                not use the Service.
              </p>
              <p>
                These Terms are an agreement between you and Hydrilla AI
                (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). Your use of the Service is also
                subject to our{" "}
                <a
                  href="/privacy-policy"
                  className="text-black underline hover:text-gray-700"
                >
                  Privacy Policy
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
                2. Eligibility
              </h2>
              <p>
                You must be at least 13 years old to use the Service. By using
                the Service, you represent that you meet this requirement. If
                you are under the age of digital consent in your country, you
                may use the Service only with parental or guardian permission
                where required by law.
              </p>
              <p>
                The Service is not directed to children under 13. We do not
                knowingly collect personal information from children under 13.
                If we learn that we have done so, we will take steps to delete
                that information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                3. Description of Service
              </h2>
              <p>
                Hydrilla AI is an AI-powered platform that enables users to
                generate 3D models from text or images. Features may include
                generation, preview, editing, and download of 3D assets. We may
                update or change features at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                4. Accounts
              </h2>
              <p>
                To use certain features, you must create an account. You agree
                to provide accurate information and keep your credentials
                secure. You are responsible for all activity under your account.
              </p>
              <p>
                We may suspend or terminate accounts that violate these Terms or
                that we reasonably believe pose a risk to the Service or other
                users.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                5. Payments
              </h2>
              <p>
                Paid plans, subscriptions, or credits are charged as described
                on our pricing pages. Fees are generally non-refundable except
                as required by law or as we agree otherwise.
              </p>
              <p>
                Payments are processed by third-party payment providers. We do
                not store full payment card details on our servers. For billing
                questions, contact{" "}
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
                6. Content and Intellectual Property
              </h2>
              <p>
                You retain ownership of content you upload (&quot;User Content&quot;). You
                grant us a license to use that content as needed to operate and
                improve the Service.
              </p>
              <p>
                Subject to these Terms, you own the 3D models and other outputs
                you generate through the Service (&quot;Generated Content&quot;) and may
                use them for personal or commercial purposes, provided you
                comply with applicable law.
              </p>
              <p>
                You may not upload or generate content that is illegal,
                infringing, harmful, exploitative of minors, or otherwise
                violates the rights of others.
              </p>
              <p>
                The Service itself—including its software, design, and
                branding—is owned by Hydrilla AI and may not be copied or
                reverse engineered except as permitted by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                7. Acceptable Use
              </h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service unlawfully or in violation of these Terms</li>
                <li>Attempt unauthorized access to the Service or related systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>
                  Use automated means to access the Service without permission
                </li>
                <li>Harass, harm, or exploit others, including minors</li>
                <li>Resell or redistribute access without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                8. Availability
              </h2>
              <p>
                We aim to keep the Service available, but we do not guarantee
                uninterrupted or error-free operation. We may modify, suspend,
                or discontinue features at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                9. Disclaimers and Limitation of Liability
              </h2>
              <p>
                The Service is provided &quot;as is&quot; and &quot;as available&quot; without
                warranties of any kind, to the maximum extent permitted by law.
              </p>
              <p>
                AI-generated content may be inaccurate or unsuitable for your
                purpose. You are responsible for reviewing Generated Content
                before use.
              </p>
              <p>
                To the maximum extent permitted by law, Hydrilla AI is not
                liable for indirect, incidental, special, consequential, or
                punitive damages, or loss of profits, data, or goodwill arising
                from your use of the Service. Our total liability will not
                exceed the amounts you paid us for the Service in the twelve
                (12) months before the claim.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                10. Indemnification
              </h2>
              <p>
                You agree to indemnify and hold harmless Hydrilla AI from claims
                arising out of your use of the Service, your content, or your
                violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                11. Termination
              </h2>
              <p>
                We may suspend or terminate your access if you breach these
                Terms. You may stop using the Service at any time and request
                account closure by contacting{" "}
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
                12. Governing Law
              </h2>
              <p>
                These Terms are governed by applicable law without regard to
                conflict-of-law principles, except where mandatory consumer
                protections apply. Disputes will be resolved in accordance with
                applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                13. Changes
              </h2>
              <p>
                We may update these Terms from time to time. We will post
                changes on this page and update the &quot;Last Updated&quot; date.
                Continued use after changes take effect constitutes acceptance.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">
                14. Contact
              </h2>
              <p>Questions about these Terms:</p>
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
