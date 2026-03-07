import Link from "next/link";
import Footer from "../../components/layout/Footer";

export const metadata = {
  title: "API — Hydrilla",
  description: "Setting the API for studios. Coming soon.",
};

export default function ApiPage() {
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
        {/* Card container */}
        <div
          style={{
            maxWidth: "32rem",
            width: "100%",
            borderRadius: "1.25rem",
            border: "1px solid rgba(17,17,17,0.08)",
            backgroundColor: "#fff",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            padding: "2.5rem 2rem",
            textAlign: "center",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              backgroundColor: "rgba(59,142,232,0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1.5rem",
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
              style={{ color: "#3b8ee8" }}
            >
              <path d="M18 20V10" />
              <path d="M12 20V4" />
              <path d="M6 20v-6" />
            </svg>
          </div>

          <p
            style={{
              margin: "0 0 0.5rem",
              fontSize: "0.6875rem",
              fontWeight: 600,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#aaa",
            }}
          >
            API
          </p>

          <h1
            style={{
              margin: "0 0 1rem",
              fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
              fontSize: "clamp(1.75rem, 4vw, 2.5rem)",
              fontWeight: 700,
              color: "#111",
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
            }}
          >
            Coming soon
          </h1>

          <p
            style={{
              margin: "0 0 2rem",
              fontSize: "1rem",
              color: "rgba(17,17,17,0.55)",
              lineHeight: 1.6,
            }}
          >
            Setting the API for studios! We&apos;re building programmatic access so you can integrate Hydrilla into your pipeline. Check back soon or reach out if you need early access.
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
              href="mailto:founders@hydrilla.co"
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
        </div>
      </main>
      <Footer />
    </>
  );
}
