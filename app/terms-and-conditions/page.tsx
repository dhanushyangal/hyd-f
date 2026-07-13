"use client";

import { useEffect } from "react";
import Footer from "../../components/layout/Footer";

export default function TermsAndConditionsPage() {
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
              Terms and Conditions
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
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">1. Agreement to Terms</h2>
              <p>
                By accessing or using Hydrilla AI ("the Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you may not access or use the Service.
              </p>
              <p>
                These Terms constitute a legally binding agreement between you and Hydrilla AI ("we," "us," or "our"). We reserve the right to modify these Terms at any time, and such modifications will be effective immediately upon posting on our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">2. Description of Service</h2>
              <p>
                Hydrilla AI is an AI-powered platform that enables users to generate 3D models from text prompts or images. Our Service uses advanced artificial intelligence and machine learning technologies to create 3D models, animations, and related content.
              </p>
              <p>
                We provide access to our platform through a subscription-based early access program. The Service includes features such as text-to-3D generation, image-to-3D conversion, model preview, and downloadable 3D files.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">3. User Accounts</h2>
              
              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">3.1 Account Creation</h3>
              <p>
                To use certain features of our Service, you must create an account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate, current, and complete.
              </p>

              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">3.2 Account Security</h3>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
              </p>

              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">3.3 Account Termination</h3>
              <p>
                We reserve the right to suspend or terminate your account at any time, with or without notice, for any violation of these Terms or for any other reason we deem necessary.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">4. Payment and Billing</h2>
              
              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">4.1 Subscription Fees</h3>
              <p>
                Access to our Service requires payment of subscription fees as specified on our website. All fees are charged in advance and are non-refundable except as required by law or as specified in our refund policy.
              </p>

              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">4.2 Payment Processing</h3>
              <p>
                Payments are processed through our third-party payment processor (Dodo Payments). By making a payment, you agree to the payment processor's terms and conditions. We do not store your full payment card information on our servers.
              </p>

              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">4.3 Refunds</h3>
              <p>
                Refund requests are handled on a case-by-case basis. If you are not satisfied with our Service, please contact us at <a href="mailto:founders@hydrilla.ai" className="text-black underline hover:text-gray-700">founders@hydrilla.ai</a> to discuss your situation.
              </p>

              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">4.4 Price Changes</h3>
              <p>
                We reserve the right to modify subscription fees at any time. Price changes will be communicated to existing subscribers in advance, and you will have the opportunity to cancel your subscription before the new pricing takes effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">5. User Content and Intellectual Property</h2>
              
              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">5.1 Your Content</h3>
              <p>
                You retain ownership of any content you upload, submit, or create through our Service ("User Content"). By using our Service, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and display your User Content solely for the purpose of providing and improving our Service.
              </p>

              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">5.2 Generated Content</h3>
              <p>
                3D models and other content generated through our Service ("Generated Content") are owned by you, subject to these Terms. You may use Generated Content for personal and commercial purposes, provided that you comply with all applicable laws and regulations.
              </p>

              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">5.3 Prohibited Content</h3>
              <p>You agree not to upload, submit, or generate content that:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violates any laws or regulations</li>
                <li>Infringes on intellectual property rights of others</li>
                <li>Contains harmful, offensive, or inappropriate material</li>
                <li>Is used to create deepfakes or misleading content</li>
                <li>Violates the rights of others, including privacy rights</li>
              </ul>

              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">5.4 Our Intellectual Property</h3>
              <p>
                The Service, including its design, features, and underlying technology, is owned by Hydrilla AI and protected by copyright, trademark, and other intellectual property laws. You may not copy, modify, distribute, or create derivative works of our Service without our express written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">6. Acceptable Use</h2>
              <p>You agree to use our Service only for lawful purposes and in accordance with these Terms. You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the Service in any way that violates applicable laws or regulations</li>
                <li>Attempt to gain unauthorized access to our systems or networks</li>
                <li>Interfere with or disrupt the Service or servers connected to the Service</li>
                <li>Use automated systems or bots to access the Service without permission</li>
                <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
                <li>Use the Service to create content that is defamatory, harassing, or harmful</li>
                <li>Resell or redistribute access to the Service without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">7. Service Availability and Modifications</h2>
              <p>
                We strive to provide reliable and continuous access to our Service, but we do not guarantee that the Service will be available at all times. The Service may be unavailable due to maintenance, updates, technical issues, or other reasons beyond our control.
              </p>
              <p>
                We reserve the right to modify, suspend, or discontinue any part of the Service at any time, with or without notice. We are not liable to you or any third party for any modification, suspension, or discontinuation of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">8. Disclaimers and Limitations of Liability</h2>
              
              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">8.1 Service "As Is"</h3>
              <p>
                The Service is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not warrant that the Service will be uninterrupted, error-free, or free from viruses or other harmful components.
              </p>

              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">8.2 Limitation of Liability</h3>
              <p>
                To the maximum extent permitted by law, Hydrilla AI shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses resulting from your use of the Service.
              </p>

              <h3 className="text-xl font-semibold text-black mt-6 mb-3 font-dm-sans">8.3 AI-Generated Content</h3>
              <p>
                Our Service uses AI technology that may produce unexpected or inaccurate results. We do not guarantee the accuracy, quality, or suitability of Generated Content for any particular purpose. You are solely responsible for reviewing and verifying any Generated Content before use.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">9. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Hydrilla AI, its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys' fees, arising out of or in any way connected with your use of the Service, your User Content, or your violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">10. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms. Upon termination, your right to use the Service will cease immediately.
              </p>
              <p>
                You may terminate your account at any time by contacting us at <a href="mailto:founders@hydrilla.ai" className="text-black underline hover:text-gray-700">founders@hydrilla.ai</a>. Upon termination, your account will be deactivated, and you will lose access to the Service and any Generated Content stored in your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">11. Governing Law and Dispute Resolution</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Hydrilla AI operates, without regard to its conflict of law provisions.
              </p>
              <p>
                Any disputes arising out of or relating to these Terms or the Service shall be resolved through binding arbitration in accordance with applicable arbitration rules, except where prohibited by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">12. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. We will notify you of any material changes by posting the updated Terms on this page and updating the "Last Updated" date. Your continued use of the Service after such modifications constitutes your acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">13. Severability</h2>
              <p>
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-black mt-8 mb-4 font-dm-sans">14. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us:
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
