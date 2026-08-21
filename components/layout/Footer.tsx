"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { HERO_POSTER_URL, HERO_VIDEO_URL } from "@/lib/cloudinary";
import { CONTACT_EMAIL } from "@/lib/brand";
import { FOOTER_NAV } from "@/lib/nav";

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "/privacy-policy" },
  { label: "Terms of Service", href: "/terms-and-conditions" },
  { label: "Cookie Policy", href: "/cookie-policy" },
];

const SOCIAL_LINKS = [
  {
    label: "X (Twitter)",
    href: "https://x.com/hydrillaai",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/hydrilla-ai",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "Reddit",
    href: "https://www.reddit.com/r/hydrilla",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/hydrilla.ai",
    icon: (
      <svg className="w-[18px] h-[18px]" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
];

function MailIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function FooterEmail() {
  return (
    <a
      href={`mailto:${CONTACT_EMAIL}`}
      className="footer-email"
      aria-label={`Email ${CONTACT_EMAIL}`}
    >
      <span className="footer-email-icon">
        <MailIcon />
      </span>
      <span className="footer-email-text">{CONTACT_EMAIL}</span>
    </a>
  );
}

export default function Footer() {
  const [videoError, setVideoError] = useState(false);
  const [shouldLoadVideo, setShouldLoadVideo] = useState(false);
  const wordmarkRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = wordmarkRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoadVideo(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px 0px", threshold: 0.01 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <footer className="footer-root" id="site-footer" role="contentinfo">
      {/* Primary nav */}
      <div className="footer-inner footer-nav">
        <div className="footer-brand-col">
          <p className="footer-brand-name">Hydrilla</p>
          <p className="footer-brand-tag">
            Production-ready 3D assets from a single prompt.
          </p>
          <div className="footer-email-wrap">
            <p className="footer-col-heading">Get in touch</p>
            <FooterEmail />
          </div>
        </div>

        <div className="footer-cols">
          {FOOTER_NAV.map((col) => (
            <div key={col.heading} className="footer-col">
              <p className="footer-col-heading">{col.heading}</p>
              <ul className="footer-link-list">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="footer-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="footer-inner">
        <div className="footer-rule" />
      </div>

      {/* Large wordmark */}
      <div className="footer-inner footer-wordmark" ref={wordmarkRef}>
        {shouldLoadVideo && !videoError ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="none"
            poster={HERO_POSTER_URL}
            onError={() => setVideoError(true)}
            className="footer-wordmark-media"
          >
            <source src={HERO_VIDEO_URL} type="video/mp4" />
          </video>
        ) : (
          <div
            className="footer-wordmark-media"
            style={{
              backgroundImage: `url(${HERO_POSTER_URL})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        )}
        <svg
          viewBox="0 0 1561 456"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="footer-wordmark-svg"
          preserveAspectRatio="xMidYMid meet"
          aria-label="Hydrilla"
        >
          <path
            d="M220.5 356V5.99998H288V356H220.5ZM8.9407e-07 356V5.99998H67.5V356H8.9407e-07ZM58.5 204.5V150H232V204.5H58.5ZM357.008 456L413.508 328H399.508L298.008 108H371.508L443.008 269H445.008L509.008 108H581.008L428.508 456H357.008ZM675.609 362C652.276 362 631.943 356.5 614.609 345.5C597.276 334.167 583.776 318.667 574.109 299C564.443 279.333 559.609 257 559.609 232C559.609 207 564.443 184.667 574.109 165C583.776 145.333 597.443 130 615.109 119C632.776 107.667 653.776 102 678.109 102C697.443 102 714.109 105.833 728.109 113.5C742.443 120.833 753.776 129.667 762.109 140V5.99998H829.609V356H772.609L769.109 312.5H767.109C760.776 322.833 753.109 331.667 744.109 339C735.109 346.333 724.943 352 713.609 356C702.276 360 689.609 362 675.609 362ZM695.609 306.5C709.276 306.5 721.109 303.333 731.109 297C741.443 290.667 749.276 282 754.609 271C760.276 259.667 763.109 246.5 763.109 231.5C763.109 216.833 760.276 204 754.609 193C749.276 181.667 741.443 172.833 731.109 166.5C720.776 160.167 708.776 157 695.109 157C681.776 157 669.943 160.167 659.609 166.5C649.609 172.833 641.776 181.667 636.109 193C630.776 204 628.109 216.833 628.109 231.5C628.109 246.5 630.776 259.667 636.109 271C641.776 282 649.609 290.667 659.609 297C669.943 303.333 681.943 306.5 695.609 306.5ZM857.285 356V108H914.785L920.785 162.5H922.785C930.118 144.833 938.118 131.833 946.785 123.5C955.452 114.833 965.285 109.167 976.285 106.5C987.618 103.5 1000.29 102 1014.29 102V173.5H995.785C984.452 173.5 974.285 174.833 965.285 177.5C956.618 179.833 949.285 183.833 943.285 189.5C937.285 194.833 932.618 202 929.285 211C926.285 220 924.785 230.833 924.785 243.5V356H857.285ZM1029.97 356V108H1097.47V356H1029.97ZM1063.97 76.5C1051.64 76.5 1041.47 73 1033.47 66C1025.81 58.6666 1021.97 49.5 1021.97 38.5C1021.97 27.5 1025.81 18.3333 1033.47 11C1041.47 3.66665 1051.64 -6.19888e-06 1063.97 -6.19888e-06C1076.31 -6.19888e-06 1086.31 3.66665 1093.97 11C1101.64 18.3333 1105.47 27.5 1105.47 38.5C1105.47 49.1666 1101.64 58.1666 1093.97 65.5C1086.31 72.8333 1076.31 76.5 1063.97 76.5ZM1133.01 356V5.99998H1200.51V356H1133.01ZM1232.75 356V5.99998H1300.25V356H1232.75ZM1408.56 362C1388.89 362 1372.56 358.667 1359.56 352C1346.89 345.333 1337.56 336.333 1331.56 325C1325.56 313.667 1322.56 301.167 1322.56 287.5C1322.56 272.167 1326.39 258.667 1334.06 247C1342.06 235.333 1354.06 226.333 1370.06 220C1386.06 213.333 1406.23 210 1430.56 210H1493.06C1493.06 197.667 1491.23 187.5 1487.56 179.5C1484.23 171.5 1478.89 165.5 1471.56 161.5C1464.56 157.5 1455.56 155.5 1444.56 155.5C1431.56 155.5 1420.39 158.5 1411.06 164.5C1402.06 170.167 1396.39 179.167 1394.06 191.5H1328.56C1330.56 173.167 1336.56 157.333 1346.56 144C1356.89 130.667 1370.39 120.333 1387.06 113C1404.06 105.667 1423.23 102 1444.56 102C1468.56 102 1489.23 106 1506.56 114C1523.89 121.667 1537.23 133.167 1546.56 148.5C1555.89 163.5 1560.56 181.833 1560.56 203.5V356H1504.56L1497.56 317.5H1495.56C1490.23 324.833 1484.39 331.333 1478.06 337C1472.06 342.667 1465.39 347.333 1458.06 351C1450.73 354.667 1442.89 357.333 1434.56 359C1426.23 361 1417.56 362 1408.56 362ZM1430.56 310C1439.89 310 1447.89 308.5 1454.56 305.5C1461.56 302.167 1467.56 297.833 1472.56 292.5C1477.56 287.167 1481.39 281 1484.06 274C1487.06 266.667 1489.06 259.167 1490.06 251.5H1438.06C1427.73 251.5 1419.23 252.833 1412.56 255.5C1406.23 257.833 1401.56 261.333 1398.56 266C1395.56 270.333 1394.06 275.5 1394.06 281.5C1394.06 287.5 1395.56 292.667 1398.56 297C1401.56 301.333 1405.89 304.667 1411.56 307C1417.23 309 1423.56 310 1430.56 310Z"
            fill="url(#footerGrad)"
          />
          <defs>
            <linearGradient id="footerGrad" x1="-22.5" y1="10.835" x2="1756.5" y2="30.165" gradientUnits="userSpaceOnUse">
              <stop stopColor="white" />
              <stop offset="0.63" stopColor="#99D0FF" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Bottom bar */}
      <div className="footer-inner footer-bottom">
        <p className="footer-copy">© 2026 Hydrilla. All rights reserved.</p>

        <nav className="footer-legal" aria-label="Legal">
          {LEGAL_LINKS.map((l, i) => (
            <React.Fragment key={l.label}>
              {i > 0 && <span className="footer-legal-dot" aria-hidden />}
              <Link href={l.href} className="footer-legal-link">
                {l.label}
              </Link>
            </React.Fragment>
          ))}
        </nav>

        <div className="footer-socials">
          {SOCIAL_LINKS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="footer-social"
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>

      <style>{`
        .footer-root {
          width: 100%;
          background: #f7f6f3;
          font-family: 'DM Sans', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          box-sizing: border-box;
          overflow: hidden;
          border-top: 1px solid rgba(17, 17, 17, 0.06);
        }

        .footer-inner {
          max-width: 80rem;
          margin: 0 auto;
          padding-left: 2rem;
          padding-right: 2rem;
          box-sizing: border-box;
        }

        .footer-nav {
          padding-top: 5rem;
          padding-bottom: 4rem;
          display: grid;
          grid-template-columns: minmax(220px, 1.15fr) 2.4fr;
          gap: 3.5rem 4rem;
          align-items: start;
        }

        .footer-brand-name {
          margin: 0 0 0.75rem;
          font-family: 'RoobertVF', 'Roobert', 'DM Sans', sans-serif;
          font-size: 1.75rem;
          font-weight: 600;
          letter-spacing: -0.03em;
          color: #111;
          line-height: 1.1;
        }

        .footer-brand-tag {
          margin: 0 0 2rem;
          max-width: 16rem;
          font-size: 0.9375rem;
          line-height: 1.55;
          color: rgba(17, 17, 17, 0.55);
          letter-spacing: -0.01em;
        }

        .footer-email-wrap {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }

        .footer-cols {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 2rem 2.5rem;
        }

        .footer-col-heading {
          margin: 0 0 1.15rem;
          font-family: 'RoobertVF', 'Roobert', 'DM Sans', sans-serif;
          font-size: 0.6875rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(17, 17, 17, 0.42);
        }

        .footer-link-list {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }

        .footer-link {
          font-size: 0.9375rem;
          font-weight: 400;
          color: rgba(17, 17, 17, 0.72);
          text-decoration: none;
          letter-spacing: -0.015em;
          transition: color 0.15s ease;
          line-height: 1.35;
        }

        .footer-link:hover {
          color: #111;
        }

        /* Email — clear, scannable, not buried in a link list */
        .footer-email {
          display: inline-flex;
          align-items: center;
          gap: 0.55rem;
          max-width: 100%;
          padding: 0.65rem 0.85rem;
          border-radius: 0.5rem;
          background: #111;
          color: #fff;
          text-decoration: none;
          transition: background 0.15s ease, transform 0.15s ease;
        }

        .footer-email:hover {
          background: #2a2a2a;
        }

        .footer-email:active {
          transform: scale(0.98);
        }

        .footer-email-icon {
          display: flex;
          flex-shrink: 0;
          opacity: 0.75;
        }

        .footer-email-text {
          font-size: 0.875rem;
          font-weight: 500;
          letter-spacing: -0.01em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .footer-rule {
          border-top: 1px solid rgba(17, 17, 17, 0.08);
        }

        .footer-wordmark {
          position: relative;
          padding-top: 2.75rem;
          padding-bottom: 0;
          min-height: 11rem;
          overflow: hidden;
        }

        .footer-wordmark-media {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          pointer-events: none;
        }

        .footer-wordmark-svg {
          position: relative;
          z-index: 1;
          display: block;
          width: 100%;
          height: auto;
        }

        .footer-bottom {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          align-items: center;
          gap: 1.25rem 1.5rem;
          padding-top: 1.75rem;
          padding-bottom: 2.25rem;
        }

        .footer-copy {
          margin: 0;
          font-size: 0.8125rem;
          color: rgba(17, 17, 17, 0.45);
          letter-spacing: -0.01em;
        }

        .footer-legal {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 0.15rem 0.65rem;
        }

        .footer-legal-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: rgba(17, 17, 17, 0.2);
          flex-shrink: 0;
        }

        .footer-legal-link {
          font-size: 0.8125rem;
          color: rgba(17, 17, 17, 0.5);
          text-decoration: none;
          letter-spacing: -0.01em;
          transition: color 0.15s ease;
        }

        .footer-legal-link:hover {
          color: #111;
        }

        .footer-socials {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 0.4rem;
        }

        .footer-social {
          width: 2.125rem;
          height: 2.125rem;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 0.4rem;
          color: rgba(17, 17, 17, 0.45);
          text-decoration: none;
          transition: color 0.15s ease, background 0.15s ease;
        }

        .footer-social:hover {
          color: #111;
          background: rgba(17, 17, 17, 0.05);
        }

        @media (max-width: 1023px) {
          .footer-nav {
            grid-template-columns: 1fr;
            gap: 2.75rem;
            padding-top: 3.5rem;
            padding-bottom: 3rem;
          }

          .footer-brand-tag {
            max-width: 22rem;
            margin-bottom: 1.5rem;
          }

          .footer-cols {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 2rem 1.75rem;
          }

          .footer-bottom {
            grid-template-columns: 1fr;
            justify-items: start;
            gap: 1.25rem;
            padding-top: 1.5rem;
            padding-bottom: 2rem;
          }

          .footer-legal {
            justify-content: flex-start;
          }

          .footer-socials {
            justify-content: flex-start;
          }
        }

        @media (max-width: 639px) {
          .footer-inner {
            padding-left: 1.25rem;
            padding-right: 1.25rem;
          }

          .footer-nav {
            padding-top: 2.75rem;
            padding-bottom: 2.25rem;
            gap: 2.25rem;
          }

          .footer-brand-name {
            font-size: 1.5rem;
          }

          .footer-cols {
            gap: 1.75rem 1.25rem;
          }

          .footer-col-heading {
            margin-bottom: 0.85rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid rgba(17, 17, 17, 0.08);
          }

          .footer-link {
            font-size: 0.875rem;
          }

          .footer-email {
            width: 100%;
            justify-content: center;
          }

          .footer-wordmark {
            min-height: 7.5rem;
            padding-top: 1.75rem;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .footer-wordmark-svg {
            width: 85vw;
            max-width: 340px;
          }

          .footer-bottom {
            justify-items: center;
            text-align: center;
            padding-bottom: 2.5rem;
            gap: 1.35rem;
          }

          .footer-legal {
            justify-content: center;
          }

          .footer-socials {
            justify-content: center;
          }
        }
      `}</style>
    </footer>
  );
}
