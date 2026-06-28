import Link from "next/link";
import Footer from "../../components/layout/Footer";
import { createPageMetadata } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Documentation",
  description:
    "Hydrilla AI documentation for text-to-3D, image-to-3D, rigging, exports, and studio integration workflows.",
  path: "/docs",
});

export default function DocsPage() {
  return (
    <>
      <main
        style={{
          width: "100%",
          minHeight: "80vh",
          backgroundColor: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "8rem 1.5rem 6rem",
          boxSizing: "border-box",
          fontFamily: "'DM Sans', Arial, sans-serif",
          WebkitFontSmoothing: "antialiased",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "16px",
            backgroundColor: "rgba(17,17,17,0.06)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "2rem",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: "#555" }}
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>

        <p
          style={{
            margin: "0 0 0.75rem",
            fontSize: "0.6875rem",
            fontWeight: 600,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "#aaa",
          }}
        >
          Documentation
        </p>

        <h1
          style={{
            margin: "0 0 1.25rem",
            fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
            fontSize: "clamp(2rem, 5vw, 3.25rem)",
            fontWeight: 700,
            color: "#111",
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
          }}
        >
          Coming Soon
        </h1>

        <p
          style={{
            margin: "0 0 2.5rem",
            fontSize: "1rem",
            color: "rgba(17,17,17,0.5)",
            lineHeight: 1.65,
            maxWidth: "28rem",
          }}
        >
          We&apos;re working on comprehensive documentation for Hydrilla. Check back soon — or reach out directly if you need help.
        </p>

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.875rem",
              backgroundColor: "#111",
              color: "#fff",
              fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
              fontSize: "0.9375rem",
              fontWeight: 600,
              textDecoration: "none",
              letterSpacing: "-0.01em",
            }}
          >
            Back to Home
          </Link>
          <a
            href="mailto:founders@hydrilla.ai"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.375rem",
              padding: "0.75rem 1.5rem",
              borderRadius: "0.875rem",
              border: "1.5px solid rgba(17,17,17,0.14)",
              backgroundColor: "transparent",
              color: "#111",
              fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
              fontSize: "0.9375rem",
              fontWeight: 600,
              textDecoration: "none",
              letterSpacing: "-0.01em",
            }}
          >
            Contact Us
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
