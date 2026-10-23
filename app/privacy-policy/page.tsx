"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  PickleArticlePage,
  type PickleRelatedItem,
} from "@/components/layout/PicklePage";

const RELATED: PickleRelatedItem[] = [
  {
    title: "Terms of Service",
    subtitle: "Account terms, generated asset ownership, and acceptable use on Hydrilla.",
    href: "/terms-and-conditions",
    date: "Jul 14, 2026",
    author: "Hydrilla Legal",
    thumbVariant: "docs-flow",
  },
  {
    title: "Security & Trust",
    subtitle: "How Hydrilla isolates accounts, private workspaces, and exported files.",
    href: "/security",
    date: "Oct 1, 2026",
    author: "Hydrilla Team",
    thumbVariant: "privacy-enclave",
  },
];

export default function PrivacyPolicyPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <PickleArticlePage
      kicker="Legal"
      kickerHref="/security"
      title="Privacy Policy"
      subtitle="How Hydrilla AI collects, uses, and protects your account and service information."
      date="Jul 14, 2026"
      author="Hydrilla Legal"
      heroThumbVariant="privacy-enclave"
      ctaLabel="Contact Privacy"
      ctaHref="mailto:founders@hydrilla.ai"
      footnote="Questions about data handling or privacy rights? Email founders@hydrilla.ai."
      relatedItems={RELATED}
    >
      {/* Pickle Legal Summary Card (_summary_1xcli_140) */}
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
          Summary at a glance
        </h2>
        <ul className="pickle-text" style={{ width: "100%", margin: 0, fontSize: "16px" }}>
          <li>We do not sell your personal information or your generated 3D assets.</li>
          <li>Authentication is managed through Clerk; payments are processed by our third-party payment provider.</li>
          <li>Starter and Pro workspaces keep generated meshes and maps private to your account.</li>
        </ul>
      </div>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">1. Introduction</h2>
        <div className="pickle-text">
          <p>
            This Privacy Policy explains how Hydrilla AI (&quot;Hydrilla,&quot;
            &quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) collects, uses, and shares information
            when you use our websites, products, and services (collectively, the
            &quot;Service&quot;).
          </p>
          <p>
            By using the Service, you agree to this Privacy Policy. If you do
            not agree, please do not use the Service. Please also review our{" "}
            <Link href="/terms-and-conditions">Terms and Conditions</Link> and{" "}
            <Link href="/cookie-policy">Cookie Policy</Link>.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">2. Information We Collect</h2>
        <h3 className="pickle-h3">2.1 Information You Provide</h3>
        <div className="pickle-text">
          <ul>
            <li>
              <strong>Account information,</strong> such as your name and email
              address when you create an account.
            </li>
            <li>
              <strong>Payment information</strong> when you make a purchase.
              Payments are processed by our third-party payment provider. We do
              not store full payment card details on our servers.
            </li>
            <li>
              <strong>Content you submit,</strong> including prompts, images,
              and other materials you upload, as well as content generated
              through the Service.
            </li>
            <li>
              <strong>Communications</strong> you send to us, such as support or
              sales inquiries.
            </li>
          </ul>
        </div>

        <h3 className="pickle-h3" style={{ marginTop: "12px" }}>
          2.2 Information Collected Automatically
        </h3>
        <div className="pickle-text">
          <ul>
            <li>
              <strong>Usage data,</strong> such as pages visited, features used,
              and how you interact with the Service.
            </li>
            <li>
              <strong>Device and technical data,</strong> such as IP address,
              browser type, operating system, and device identifiers.
            </li>
            <li>
              <strong>Cookies and similar technologies,</strong> as described in
              our <Link href="/cookie-policy">Cookie Policy</Link>.
            </li>
          </ul>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">3. How We Use Information</h2>
        <div className="pickle-text">
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve the Service</li>
            <li>Create and manage accounts</li>
            <li>Process payments and transactions</li>
            <li>Generate and deliver outputs based on your inputs</li>
            <li>Communicate with you about your account, updates, and support</li>
            <li>Analyze usage and improve performance and reliability</li>
            <li>Detect, prevent, and address security issues, fraud, and abuse</li>
            <li>Comply with legal obligations and enforce our Terms</li>
          </ul>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">4. How We Share Information</h2>
        <div className="pickle-text">
          <p>
            We do not sell your personal information. We may share information
            with:
          </p>
          <ul>
            <li>
              <strong>Service providers</strong> who help us operate the
              Service, including authentication, payment processing, hosting,
              and analytics providers (such as PostHog)
            </li>
            <li>
              <strong>Legal authorities</strong> when required by law or to
              protect our rights, users, or the public
            </li>
            <li>
              <strong>Business transferees</strong> in connection with a merger,
              acquisition, or sale of assets
            </li>
          </ul>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">5. Data Security</h2>
        <div className="pickle-text">
          <p>
            We take reasonable measures to protect personal information.
            However, no method of transmission or storage is completely secure,
            and we cannot guarantee absolute security.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">6. Your Rights and Choices</h2>
        <div className="pickle-text">
          <p>
            Depending on your location, you may have rights to access, correct,
            delete, or export your personal information, or to opt out of
            certain communications. To exercise these rights, contact us at{" "}
            <a href="mailto:founders@hydrilla.ai">founders@hydrilla.ai</a>.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">7. Cookies</h2>
        <div className="pickle-text">
          <p>
            We use cookies and similar technologies as described in our{" "}
            <Link href="/cookie-policy">Cookie Policy</Link>.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">8. Children&apos;s Privacy</h2>
        <div className="pickle-text">
          <p>
            The Service is not directed to children under 13, and we do not
            knowingly collect personal information from children under 13. If
            you believe we have collected information from a child under 13,
            please contact us at{" "}
            <a href="mailto:founders@hydrilla.ai">founders@hydrilla.ai</a>, and
            we will take steps to delete it.
          </p>
          <p>
            If you are under the age required to consent to online services in
            your country, you may use the Service only with parental or guardian
            permission where required by law.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">9. International Transfers</h2>
        <div className="pickle-text">
          <p>
            Your information may be processed in countries other than your own.
            Those countries may have different data protection laws. By using
            the Service, you acknowledge that your information may be
            transferred as described in this Policy.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">10. Retention</h2>
        <div className="pickle-text">
          <p>
            We retain personal information only as long as needed to provide the
            Service, comply with legal obligations, resolve disputes, and
            enforce our agreements. When it is no longer needed, we delete or
            de-identify it.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">11. Changes</h2>
        <div className="pickle-text">
          <p>
            We may update this Privacy Policy from time to time. We will post
            any changes on this page and update the date above. Continued use of
            the Service after changes take effect means you accept the updated
            Policy.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">12. Contact Us</h2>
        <div className="pickle-text">
          <p>
            If you have questions about this Privacy Policy, contact us at{" "}
            <a href="mailto:founders@hydrilla.ai">founders@hydrilla.ai</a> or
            visit <Link href="/">https://hydrilla.ai</Link>.
          </p>
        </div>
      </section>
    </PickleArticlePage>
  );
}
