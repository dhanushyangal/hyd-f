"use client";

import { useEffect } from "react";
import Footer from "../../components/layout/Footer";

export default function PrivacyPolicyPage() {
  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  return (
    <div className="min-h-screen bg-[#faf8f5]">

      {/* Header Section - Matching Image Style */}
      <section className="pt-24 sm:pt-32 pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-black mb-6 leading-tight font-dm-sans"
            >
              Privacy Policy
            </h1>
            <p 
              className="text-base sm:text-lg text-black/80 font-dm-sans"
            >
              Effective Date: Monday, January 23rd, 2026
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-24">
        <div className="prose prose-lg max-w-none">

          <div className="space-y-8 text-gray-700 leading-relaxed" style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">1. Introduction</h2>
              <p>
                Welcome to Hydrilla AI ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website, services, and platform (collectively, the "Service").
              </p>
              <p>
                By accessing or using Hydrilla AI, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with our policies and practices, please do not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> When you create an account, we collect your name, email address, and authentication credentials.</li>
                <li><strong>Payment Information:</strong> When you make a purchase, we collect billing information through our payment processor (Dodo Payments). We do not store your full payment card details on our servers.</li>
                <li><strong>Content You Upload:</strong> We collect images, text prompts, and 3D models you upload or generate through our Service.</li>
                <li><strong>Communications:</strong> We collect information when you contact us for support or inquiries.</li>
              </ul>

              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Usage Data:</strong> We collect information about how you interact with our Service, including pages visited, features used, and time spent on the platform.</li>
                <li><strong>Device Information:</strong> We collect information about your device, including IP address, browser type, operating system, and device identifiers.</li>
                <li><strong>Cookies and Tracking Technologies:</strong> We use cookies and similar technologies to enhance your experience, analyze usage patterns, and provide personalized content.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">3. How We Use Your Information</h2>
              <p>We use the information we collect for the following purposes:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>To provide, maintain, and improve our Service</li>
                <li>To process payments and manage your account</li>
                <li>To generate 3D models based on your inputs</li>
                <li>To communicate with you about your account, transactions, and updates</li>
                <li>To provide customer support and respond to your inquiries</li>
                <li>To detect, prevent, and address technical issues and security threats</li>
                <li>To analyze usage patterns and improve our Service</li>
                <li>To comply with legal obligations and enforce our Terms and Conditions</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">4. Information Sharing and Disclosure</h2>
              <p>We do not sell your personal information. We may share your information in the following circumstances:</p>
              
              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">4.1 Service Providers</h3>
              <p>We may share information with third-party service providers who perform services on our behalf, including:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Payment processing (Dodo Payments)</li>
                <li>Cloud storage and hosting services</li>
                <li>Analytics and performance monitoring</li>
                <li>Email delivery services</li>
              </ul>

              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">4.2 Legal Requirements</h3>
              <p>We may disclose your information if required by law or in response to valid legal requests, such as court orders or subpoenas.</p>

              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">4.3 Business Transfers</h3>
              <p>In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction.</p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
              <p>
                We use industry-standard encryption, secure authentication, and regular security audits to safeguard your data. Your payment information is processed securely through our payment processor and is not stored on our servers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">6. Your Rights and Choices</h2>
              <p>Depending on your location, you may have certain rights regarding your personal information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Access:</strong> You can request access to the personal information we hold about you.</li>
                <li><strong>Correction:</strong> You can update or correct your account information through your account settings.</li>
                <li><strong>Deletion:</strong> You can request deletion of your account and associated data.</li>
                <li><strong>Data Portability:</strong> You can request a copy of your data in a portable format.</li>
                <li><strong>Opt-Out:</strong> You can opt out of certain communications and marketing emails.</li>
              </ul>
              <p className="mt-4">
                To exercise these rights, please contact us at <a href="mailto:founders@hydrilla.ai" className="text-black underline hover:text-gray-700">founders@hydrilla.ai</a>.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">7. Cookies and Tracking Technologies</h2>
              <p>
                We use cookies and similar tracking technologies to collect and store information about your preferences and usage patterns. You can control cookies through your browser settings, but disabling cookies may limit your ability to use certain features of our Service.
              </p>
              <p>
                We use cookies for authentication, session management, analytics, and to improve your user experience. We also use third-party analytics services (such as PostHog) to understand how users interact with our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">8. Children's Privacy</h2>
              <p>
                Our Service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you believe we have collected information from a child under 13, please contact us immediately, and we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">9. International Data Transfers</h2>
              <p>
                Your information may be transferred to and processed in countries other than your country of residence. These countries may have data protection laws that differ from those in your country. By using our Service, you consent to the transfer of your information to these countries.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">10. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. We encourage you to review this Privacy Policy periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">11. Contact Us</h2>
              <p>
                If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg mt-4">
                <p className="mb-2"><strong>Email:</strong> <a href="mailto:founders@hydrilla.ai" className="text-black underline hover:text-gray-700">founders@hydrilla.ai</a></p>
                <p><strong>Website:</strong> <a href="https://hydrilla.ai" className="text-black underline hover:text-gray-700">https://hydrilla.ai</a></p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
