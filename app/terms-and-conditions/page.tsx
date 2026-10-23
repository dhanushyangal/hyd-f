"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  PickleArticlePage,
  type PickleRelatedItem,
} from "@/components/layout/PicklePage";

const RELATED: PickleRelatedItem[] = [
  {
    title: "Privacy Policy",
    subtitle: "How Hydrilla AI collects, uses, and protects your account and service information.",
    href: "/privacy-policy",
    date: "Jul 14, 2026",
    author: "Hydrilla Legal",
    thumbVariant: "privacy-enclave",
  },
  {
    title: "Cookie Policy",
    subtitle: "How Hydrilla uses essential, functional, and analytics cookies.",
    href: "/cookie-policy",
    date: "Jul 14, 2026",
    author: "Hydrilla Legal",
    thumbVariant: "docs-flow",
  },
];

export default function TermsAndConditionsPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <PickleArticlePage
      kicker="Legal"
      kickerHref="/security"
      title="Terms of Service"
      subtitle="Agreement governing your access to Hydrilla AI, BlueFox 1 generation, and ownership of generated 3D assets."
      date="Jul 14, 2026"
      author="Hydrilla Legal"
      ctaLabel="Contact Legal"
      ctaHref="mailto:founders@hydrilla.ai"
      footnote="Questions about commercial licensing or enterprise terms? Email founders@hydrilla.ai."
      relatedItems={RELATED}
    >
      {/* Pickle Legal Summary Card */}
      <div
        className="pickle-card-surface"
        style={{ width: "min(600px, 100%)", padding: "24px 28px", borderRadius: "20px", background: "#f6f6f6" }}
      >
        <h2
          style={{
            margin: "0 0 12px",
            fontSize: "18px",
            fontWeight: 566,
            color: "#000",
          }}
        >
          Key terms at a glance
        </h2>
        <ul className="pickle-text" style={{ width: "100%", margin: 0, fontSize: "16px" }}>
          <li>You retain ownership of content you upload and own the 3D outputs you generate under these Terms.</li>
          <li>Generated assets may be used for personal or commercial production pipelines.</li>
          <li>Subscriptions and credit plans are billed as described on our Pricing page.</li>
        </ul>
      </div>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">1. Agreement to Terms</h2>
        <div className="pickle-text">
          <p>
            By accessing or using Hydrilla AI (the &quot;Service&quot;), you agree to
            these Terms and Conditions (&quot;Terms&quot;). If you do not agree, do
            not use the Service.
          </p>
          <p>
            These Terms are an agreement between you and Hydrilla AI (&quot;we,&quot;
            &quot;us,&quot; or &quot;our&quot;). Your use of the Service is also subject to our{" "}
            <Link href="/privacy-policy">Privacy Policy</Link> and{" "}
            <Link href="/cookie-policy">Cookie Policy</Link>.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">2. Eligibility</h2>
        <div className="pickle-text">
          <p>
            You must be at least 13 years old to use the Service. By using the
            Service, you represent that you meet this requirement. If you are
            under the age of digital consent in your country, you may use the
            Service only with parental or guardian permission where required by
            law.
          </p>
          <p>
            The Service is not directed to children under 13. We do not
            knowingly collect personal information from children under 13. If we
            learn that we have done so, we will take steps to delete that
            information.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">3. Description of Service</h2>
        <div className="pickle-text">
          <p>
            Hydrilla AI is an AI-powered platform that enables users to generate
            3D models from text or images. Features may include generation,
            preview, editing, and download of 3D assets. We may update or change
            features at any time.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">4. Accounts</h2>
        <div className="pickle-text">
          <p>
            To use certain features, you must create an account. You agree to
            provide accurate information and keep your credentials secure. You
            are responsible for all activity under your account.
          </p>
          <p>
            We may suspend or terminate accounts that violate these Terms or
            that we reasonably believe pose a risk to the Service or other
            users.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">5. Payments</h2>
        <div className="pickle-text">
          <p>
            Paid plans, subscriptions, or credits are charged as described on
            our <Link href="/pricing">Pricing</Link> pages. Fees are generally
            non-refundable except as required by law or as we agree otherwise.
          </p>
          <p>
            Payments are processed by third-party payment providers. We do not
            store full payment card details on our servers. For billing
            questions, contact{" "}
            <a href="mailto:founders@hydrilla.ai">founders@hydrilla.ai</a>.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">6. Content and Intellectual Property</h2>
        <div className="pickle-text">
          <p>
            You retain ownership of content you upload (&quot;User Content&quot;). You
            grant us a license to use that content as needed to operate and
            improve the Service.
          </p>
          <p>
            Subject to these Terms, you own the 3D models and other outputs you
            generate through the Service (&quot;Generated Content&quot;) and may use
            them for personal or commercial purposes, provided you comply with
            applicable law.
          </p>
          <p>
            You may not upload or generate content that is illegal, infringing,
            harmful, exploitative of minors, or otherwise violates the rights of
            others.
          </p>
          <p>
            The Service itself—including its software, design, and branding—is
            owned by Hydrilla AI and may not be copied or reverse engineered
            except as permitted by law.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">7. Acceptable Use</h2>
        <div className="pickle-text">
          <p>You agree not to:</p>
          <ul>
            <li>Use the Service unlawfully or in violation of these Terms</li>
            <li>Attempt unauthorized access to the Service or related systems</li>
            <li>Interfere with or disrupt the Service</li>
            <li>Use automated means to access the Service without permission</li>
            <li>Harass, harm, or exploit others, including minors</li>
            <li>Resell or redistribute access without authorization</li>
          </ul>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">8. Availability</h2>
        <div className="pickle-text">
          <p>
            We aim to keep the Service available, but we do not guarantee
            uninterrupted or error-free operation. We may modify, suspend, or
            discontinue features at any time.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">9. Disclaimers and Limitation of Liability</h2>
        <div className="pickle-text">
          <p>
            The Service is provided &quot;as is&quot; and &quot;as available&quot; without
            warranties of any kind, to the maximum extent permitted by law.
          </p>
          <p>
            AI-generated content may be inaccurate or unsuitable for your
            purpose. You are responsible for reviewing Generated Content before
            use.
          </p>
          <p>
            To the maximum extent permitted by law, Hydrilla AI is not liable
            for indirect, incidental, special, consequential, or punitive
            damages, or loss of profits, data, or goodwill arising from your use
            of the Service. Our total liability will not exceed the amounts you
            paid us for the Service in the twelve (12) months before the claim.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">10. Indemnification</h2>
        <div className="pickle-text">
          <p>
            You agree to indemnify and hold harmless Hydrilla AI from claims
            arising out of your use of the Service, your content, or your
            violation of these Terms.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">11. Termination</h2>
        <div className="pickle-text">
          <p>
            We may suspend or terminate your access if you breach these Terms.
            You may stop using the Service at any time and request account
            closure by contacting{" "}
            <a href="mailto:founders@hydrilla.ai">founders@hydrilla.ai</a>.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">12. Governing Law &amp; Changes</h2>
        <div className="pickle-text">
          <p>
            These Terms are governed by applicable law without regard to
            conflict-of-law principles, except where mandatory consumer
            protections apply. Disputes will be resolved in accordance with
            applicable law.
          </p>
          <p>
            We may update these Terms from time to time. We will post changes on
            this page and update the date above. Continued use after changes
            take effect constitutes acceptance.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">13. Contact</h2>
        <div className="pickle-text">
          <p>
            Questions about these Terms? Email{" "}
            <a href="mailto:founders@hydrilla.ai">founders@hydrilla.ai</a> or
            visit <Link href="/">https://hydrilla.ai</Link>.
          </p>
        </div>
      </section>
    </PickleArticlePage>
  );
}
