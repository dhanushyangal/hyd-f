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
    title: "Terms of Service",
    subtitle: "Account terms, generated asset ownership, and acceptable use on Hydrilla.",
    href: "/terms-and-conditions",
    date: "Jul 14, 2026",
    author: "Hydrilla Legal",
    thumbVariant: "docs-flow",
  },
];

export default function CookiePolicyPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  return (
    <PickleArticlePage
      kicker="Legal"
      kickerHref="/security"
      title="Cookie Policy"
      subtitle="How Hydrilla AI uses essential session cookies, preferences, and analytics."
      date="Jul 14, 2026"
      author="Hydrilla Legal"
      ctaLabel="Contact Privacy"
      ctaHref="mailto:founders@hydrilla.ai"
      footnote="Questions about cookies or browser storage? Email founders@hydrilla.ai."
      relatedItems={RELATED}
    >
      <section className="pickle-head-block">
        <h2 className="pickle-h2">1. Introduction</h2>
        <div className="pickle-text">
          <p>
            This Cookie Policy explains how Hydrilla AI (&quot;we,&quot; &quot;our,&quot; or
            &quot;us&quot;) uses cookies and similar technologies on our Service. It
            should be read together with our{" "}
            <Link href="/privacy-policy">Privacy Policy</Link>.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">2. What Are Cookies?</h2>
        <div className="pickle-text">
          <p>
            Cookies are small text files stored on your device when you visit a
            website. They help the site function, remember your preferences, and
            understand how it is used.
          </p>
        </div>
      </section>

      <section className="pickle-section">
        <div className="pickle-head-block">
          <h2 className="pickle-h2">3. Types of Cookies We Use</h2>
          <div className="pickle-text">
            <p>
              We keep our cookie footprint minimal and focused on authentication,
              studio preferences, and product reliability:
            </p>
          </div>
        </div>

        <figure className="pickle-figure">
          <div className="pickle-card-surface">
            <table className="pickle-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Provider</th>
                  <th>Purpose</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>Essential cookies</th>
                  <td>Clerk / Hydrilla</td>
                  <td>Required for authentication, session security, and workspace access.</td>
                </tr>
                <tr>
                  <th>Functional storage</th>
                  <td>Hydrilla Studio</td>
                  <td>Remembers studio viewport, theme, and local Bridge connection state.</td>
                </tr>
                <tr>
                  <th>Analytics cookies</th>
                  <td>PostHog / Vercel</td>
                  <td>Helps us measure reliability, page speed, and aggregate feature usage.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <figcaption className="pickle-caption">
            Summary of cookies and local storage used by Hydrilla Studio.
          </figcaption>
        </figure>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">4. Managing Cookies</h2>
        <div className="pickle-text">
          <p>
            You can control or delete cookies through your browser settings.
            Please note that disabling essential cookies will prevent sign-in
            and authenticated Studio features from working properly.
          </p>
        </div>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">5. Changes &amp; Contact</h2>
        <div className="pickle-text">
          <p>
            We may update this Cookie Policy from time to time. Changes will be
            posted on this page with an updated date.
          </p>
          <p>
            Questions about this Cookie Policy? Contact us at{" "}
            <a href="mailto:founders@hydrilla.ai">founders@hydrilla.ai</a>.
          </p>
        </div>
      </section>
    </PickleArticlePage>
  );
}
