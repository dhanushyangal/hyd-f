import type { ReactNode } from "react";
import Link from "next/link";
import Footer from "./Footer";

const DISPLAY =
  "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif";

export const EXPORT_FORMATS = ["GLB", "FBX", "OBJ", "USDZ"] as const;

export type RelatedLink = {
  label: string;
  href: string;
  hint?: string;
};

type MarketingPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  /** Show the export HUD. Default true for product pages. */
  formats?: boolean;
  meta?: string;
  related?: RelatedLink[];
};

export function MarketingPage({
  eyebrow,
  title,
  description,
  children,
  formats = true,
  meta,
  related,
}: MarketingPageProps) {
  return (
    <>
      <main className="mkt-root">
        <section className="mkt-hero">
          <div className="mkt-hero-inner">
            <div className="mkt-hero-kicker">
              <p className="mkt-eyebrow">{eyebrow}</p>
              {meta ? <p className="mkt-meta">{meta}</p> : null}
            </div>
            <h1 className="mkt-title" style={{ fontFamily: DISPLAY }}>
              {title}
            </h1>
            <p className="mkt-lede">{description}</p>
            {formats ? (
              <ul className="mkt-formats" aria-label="Export formats">
                {EXPORT_FORMATS.map((format) => (
                  <li key={format}>
                    <span>{format}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </section>
        {children}
        {related && related.length > 0 ? (
          <nav className="mkt-related" aria-label="Related">
            <p className="mkt-related-label">Continue</p>
            <ul>
              {related.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <span className="mkt-related-title">{item.label}</span>
                    {item.hint ? (
                      <span className="mkt-related-hint">{item.hint}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </main>
      <Footer />
      <style>{`
        .mkt-root {
          width: 100%;
          background: #fff;
          font-family: var(--font-dm-sans), "DM Sans", sans-serif;
          -webkit-font-smoothing: antialiased;
          color: #171717;
        }
        .mkt-hero {
          position: relative;
          padding: 7.5rem 1.25rem 2.75rem;
          background:
            linear-gradient(180deg, #f4f7fa 0%, #ffffff 100%);
          border-bottom: 1px solid rgba(17, 17, 17, 0.08);
        }
        .mkt-hero::before {
          content: "";
          position: absolute;
          left: 0;
          top: 5.75rem;
          bottom: 1.5rem;
          width: 3px;
          background: #7eb8e8;
        }
        .mkt-hero-inner {
          max-width: 42rem;
          margin: 0 auto;
        }
        .mkt-hero-kicker {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 1rem;
        }
        .mkt-eyebrow {
          margin: 0;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #6b7280;
        }
        .mkt-meta {
          margin: 0;
          font-size: 0.75rem;
          font-variant-numeric: tabular-nums;
          color: #9ca3af;
        }
        .mkt-title {
          margin: 1rem 0 0;
          font-size: clamp(2rem, 4.2vw, 3.15rem);
          font-weight: 600;
          letter-spacing: -0.04em;
          line-height: 1.06;
          color: #0a0a0a;
        }
        .mkt-lede {
          margin: 1rem 0 0;
          max-width: 36rem;
          font-size: 1.0625rem;
          line-height: 1.65;
          color: #525252;
        }
        .mkt-formats {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin: 1.5rem 0 0;
          padding: 0;
          list-style: none;
        }
        .mkt-formats span {
          display: inline-block;
          padding: 0.28rem 0.55rem;
          border: 1px solid rgba(17, 17, 17, 0.12);
          background: #fff;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          font-variant-numeric: tabular-nums;
          color: #404040;
        }
        .mkt-related {
          max-width: 42rem;
          margin: 0 auto;
          padding: 0 1.25rem 4.5rem;
        }
        .mkt-related-label {
          margin: 0 0 0.85rem;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: #9ca3af;
        }
        .mkt-related ul {
          margin: 0;
          padding: 0;
          list-style: none;
          display: grid;
          gap: 0.5rem;
        }
        .mkt-related a {
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          padding: 0.95rem 1rem;
          border: 1px solid rgba(17, 17, 17, 0.08);
          text-decoration: none;
          color: inherit;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .mkt-related a:hover {
          background: #f8fafc;
          border-color: rgba(126, 184, 232, 0.55);
        }
        .mkt-related a:focus-visible {
          outline: 2px solid #7eb8e8;
          outline-offset: 3px;
        }
        .mkt-related-title {
          font-size: 0.9375rem;
          font-weight: 600;
          letter-spacing: -0.02em;
          color: #0a0a0a;
        }
        .mkt-related-hint {
          font-size: 0.8125rem;
          color: #737373;
        }
        @media (min-width: 640px) {
          .mkt-hero {
            padding: 8.5rem 1.5rem 3.25rem;
          }
          .mkt-related {
            padding-left: 1.5rem;
            padding-right: 1.5rem;
          }
        }
        @media (prefers-reduced-motion: reduce) {
          .mkt-related a {
            transition: none;
          }
        }
      `}</style>
    </>
  );
}
