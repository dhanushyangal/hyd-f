"use client";

import React, { useState } from "react";
import Link from "next/link";

const FOOTER_NAV = [
  {
    heading: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "How It Works", href: "/#howitworks" },
      { label: "API", href: "/api" },
      { label: "Pricing", href: "/#pricing" },
    ],
  },
  {
    heading: "Solutions",
    links: [
      { label: "Game Development", href: "/usecase/gamedev" },
      { label: "Film & Animation", href: "/usecase/filmproduction" },
      { label: "Architecture & Interiors", href: "/usecase/architecture" },
      { label: "AR / VR & XR", href: "/usecase/arvr" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Careers", href: "/careers" },
    ],
    email: "founders@hydrilla.co",
  },
];

const SOCIAL_LINKS = [
  {
    label: "X (Twitter)",
    href: "https://x.com/hydrillaai",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/company/hydrilla-ai",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
  {
    label: "Reddit",
    href: "https://www.reddit.com/r/hydrilla",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/hydrilla.ai",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
  },
];

const headingStyle = {
  margin: "0 0 1.25rem",
  fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  color: "rgba(17,17,17,0.65)",
};
const linkStyle = {
  fontFamily: "'DM Sans', Arial, sans-serif",
  fontSize: "1rem",
  fontWeight: 400,
  color: "rgba(17,17,17,0.7)",
  textDecoration: "none" as const,
  transition: "color 0.18s ease",
  letterSpacing: "-0.01em",
};

export default function Footer() {
  const [videoError, setVideoError] = useState(false);
  return (
    <footer
      style={{
        width: "100%",
        backgroundColor: "#faf9f7",
        fontFamily: "'DM Sans', Arial, sans-serif",
        WebkitFontSmoothing: "antialiased",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Top nav — desktop (lg+): 4 cols only. Mobile/tablet (< lg): single 2x2 grid only. */}
      <div
        style={{
          maxWidth: "80rem",
          margin: "0 auto",
          padding: "4.5rem 2rem 3.5rem",
          boxSizing: "border-box",
        }}
        className="max-md:py-10 max-md:px-4 max-sm:py-6 max-sm:px-4 max-sm:pb-4"
      >
        {/* Desktop only (lg and up) — no inline display so hidden works on mobile */}
        <div className="hidden lg:grid lg:grid-cols-4 lg:gap-10">
          {FOOTER_NAV.map((col) => (
            <div key={col.heading}>
              <p style={headingStyle}>{col.heading}</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} style={linkStyle} className="footer-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {"email" in col && col.email && (
                <div style={{ marginTop: "1rem" }}>
                  <a href={`mailto:${col.email}`} style={{ ...linkStyle, fontSize: "0.9375rem", fontWeight: 600, color: "rgba(17,17,17,0.9)" }} className="footer-link footer-email">
                    {col.email}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Mobile & tablet only (< lg): one clean 2x2 grid — headings highlighted */}
        <div className="lg:hidden grid grid-cols-2 gap-x-6 gap-y-6 max-sm:gap-y-5 max-sm:gap-x-4">
          {FOOTER_NAV.map((col) => (
            <div key={col.heading}>
              <p className="mb-4 text-[#111] font-bold text-xs uppercase tracking-widest border-b border-[#11111118] pb-2" style={{ fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif" }}>{col.heading}</p>
              <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} style={linkStyle} className="footer-link">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {"email" in col && col.email && (
                <div style={{ marginTop: "1rem" }}>
                  <a href={`mailto:${col.email}`} style={{ ...linkStyle, fontSize: "0.9375rem", fontWeight: 600, color: "rgba(17,17,17,0.9)" }} className="footer-link footer-email">
                    {col.email}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "0 2rem", boxSizing: "border-box" }} className="max-sm:px-4">
        <div style={{ borderTop: "1px solid rgba(17,17,17,0.08)" }} />
      </div>

      {/* Large wordmark with video / image background */}
      <div
        style={{
          maxWidth: "80rem",
          margin: "0 auto",
          padding: "2.5rem 2rem 0",
          boxSizing: "border-box",
          overflow: "hidden",
          position: "relative",
          minHeight: "12rem",
        }}
        className="max-sm:px-4 max-sm:pt-6 max-sm:min-h-[8rem] max-sm:flex max-sm:flex-col max-sm:items-center max-sm:justify-center"
      >
        {/* Background: video with poster fallback; if video errors or slow, show image */}
        {!videoError ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            poster="/herohydrillasrc.jpg"
            onError={() => setVideoError(true)}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              pointerEvents: "none",
            }}
          >
            <source src="/herohydrilla.mp4" type="video/mp4" />
          </video>
        ) : null}
        {videoError && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url(/herohydrillasrc.jpg)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              pointerEvents: "none",
            }}
          />
        )}
        <svg
          viewBox="0 0 1561 456"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto block relative z-10 max-sm:w-[85vw] max-sm:max-w-[340px] max-sm:mx-auto max-sm:flex-shrink-0"
          style={{ position: "relative", zIndex: 1 }}
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

      {/* Bottom legal bar — mobile: stack and center */}
      <div
        style={{
          maxWidth: "80rem",
          margin: "0 auto",
          padding: "1.5rem 2rem 2.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          boxSizing: "border-box",
          flexWrap: "wrap",
        }}
        className="max-sm:flex-col max-sm:items-center max-sm:justify-center max-sm:gap-4 max-sm:px-4 max-sm:pb-8 max-sm:text-center"
      >
        <p style={{ margin: 0, fontFamily: "'DM Sans', Arial, sans-serif", fontSize: "0.875rem", color: "rgba(17,17,17,0.65)", letterSpacing: "-0.01em" }}>
          © 2026 Hydrilla. All rights reserved.
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }} className="max-sm:justify-center">
          {[
            { label: "Privacy Policy", href: "/privacy-policy" },
            { label: "Terms of Service", href: "/terms-and-conditions" },
            { label: "Cookie Policy", href: "/cookie-policy" },
          ].map((l) => (
            <Link key={l.label} href={l.href} style={{ ...linkStyle, fontSize: "0.875rem", color: "rgba(17,17,17,0.65)" }} className="footer-link">
              {l.label}
            </Link>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }} className="max-sm:justify-center">
          {SOCIAL_LINKS.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              style={{
                width: "2.25rem",
                height: "2.25rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(17,17,17,0.06)",
                color: "rgba(17,17,17,0.6)",
                transition: "background-color 0.18s ease, color 0.18s ease",
                textDecoration: "none",
              }}
              className="footer-social"
            >
              {s.icon}
            </a>
          ))}
        </div>
      </div>

      <style>{`
        .footer-link:hover { color: #111 !important; }
        .footer-email:hover { color: #111 !important; text-decoration: underline; }
        .footer-social:hover { background-color: rgba(17,17,17,0.1) !important; color: #111 !important; }
      `}</style>
    </footer>
  );
}
