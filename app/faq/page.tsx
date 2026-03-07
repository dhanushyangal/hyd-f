"use client";

import Footer from "../../components/layout/Footer";
import FAQSection from "../../components/sections/FAQSection";

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Page header */}
      <section
        style={{
          width: "100%",
          backgroundColor: "#fff",
          padding: "8rem 1.5rem 3rem",
          boxSizing: "border-box",
          WebkitFontSmoothing: "antialiased",
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: "0 0 0.75rem",
            fontFamily: "'DM Sans', Arial, sans-serif",
            fontSize: "0.6875rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#888",
          }}
        >
          Frequently Asked Questions
        </p>
        <h1
          style={{
            margin: 0,
            fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
            fontWeight: 700,
            color: "#111",
            letterSpacing: "-0.045em",
            lineHeight: 1.08,
          }}
        >
          Everything you need<br />to know
        </h1>
      </section>

      {/* Chat-style FAQ */}
      <FAQSection />

      <Footer />
    </div>
  );
}
