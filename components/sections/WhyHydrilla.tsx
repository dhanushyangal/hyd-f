"use client";

import React from "react";
import { motion } from "framer-motion";
import { Check, X, Layers, LayoutGrid, Scan, Workflow } from "lucide-react";

const ROWS = [
  { feature: "Structured segmentation", hydrilla: true, others: false },
  { feature: "Automatic UV mapping", hydrilla: true, others: false },
  { feature: "Production mesh topology", hydrilla: true, others: false },
  { feature: "Controlled asset iteration", hydrilla: true, others: false },
  { feature: "Pipeline export formats", hydrilla: true, others: true },
  { feature: "API workflow integration", hydrilla: true, others: true },
];

const CHECK_NODE = (
  <span className="inline-flex h-10 w-10 max-sm:h-8 max-sm:w-8 shrink-0 items-center justify-center rounded-full bg-[#d8ecfd] text-[#0c84ed]">
    <Check className="h-5 w-5 max-sm:h-4 max-sm:w-4 stroke-[2.5]" aria-hidden />
  </span>
);

const CROSS_NODE = (
  <span className="inline-flex h-10 w-10 max-sm:h-8 max-sm:w-8 shrink-0 items-center justify-center rounded-full bg-[#ebebeb] text-[#737373]">
    <X className="h-5 w-5 max-sm:h-4 max-sm:w-4 stroke-[2]" aria-hidden />
  </span>
);

const PILLS = [
  { label: "Production-ready topology", Icon: Layers },
  { label: "Automatic UV maps", Icon: LayoutGrid },
  { label: "AI segmentation", Icon: Scan },
  { label: "Team pipeline API", Icon: Workflow },
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.52, ease: [0.215, 0.61, 0.355, 1] } },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

export default function WhyHydrilla() {
  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "#fcfcfc",
        padding: "6rem 1.5rem 7rem",
        boxSizing: "border-box",
        WebkitFontSmoothing: "antialiased",
      }}
      className="max-sm:px-4 max-sm:py-12 max-sm:pb-14"
    >
      <div
        style={{
          maxWidth: "72rem",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          gap: "3.5rem",
        }}
        className="max-sm:gap-8"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center" }}
        >
          <p
            style={{
              margin: "0 0 0.75rem",
              fontFamily: "'DM Sans', Arial, sans-serif",
              fontSize: "0.8125rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#737373",
            }}
          >
            Why Choose Us
          </p>
          <h2
            style={{
              margin: "0 0 1.25rem",
              fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
              fontSize: "clamp(2.25rem, 4.5vw, 3.5rem)",
              fontWeight: 700,
              color: "#141414",
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
            }}
          >
            Why Hydrilla
          </h2>
          <p
            style={{
              margin: "0 auto",
              fontFamily: "'DM Sans', Arial, sans-serif",
              fontSize: "1.125rem",
              color: "#565656",
              lineHeight: 1.65,
              maxWidth: "36rem",
            }}
          >
            Most generators give you a mesh. Hydrilla gives you a production asset.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55 }}
          style={{
            borderRadius: "1.5rem",
            overflow: "hidden",
            border: "1px solid #e5e5e5",
            background: "#fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
          }}
          className="max-sm:hidden"
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 180px 180px",
              padding: "1.5rem 2.5rem",
              borderBottom: "1px solid #ebebeb",
              backgroundColor: "#f8f8f8",
            }}
            className="max-sm:grid-cols-[minmax(0,1fr)_minmax(72px,auto)_minmax(72px,auto)] max-sm:px-3 max-sm:py-2.5 max-sm:gap-2 max-sm:text-xs"
          >
            <span
              style={{
                fontFamily: "'DM Sans', Arial, sans-serif",
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "#565656",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
              className="max-sm:text-[0.7rem]"
            >
              Feature
            </span>
            <span
              style={{
                textAlign: "center",
                fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
                fontSize: "1rem",
                fontWeight: 700,
                color: "#0c84ed",
                letterSpacing: "-0.01em",
              }}
              className="max-sm:text-[0.75rem] max-sm:font-semibold max-sm:min-w-0 max-sm:break-words"
            >
              Hydrilla
            </span>
            <span
              style={{
                textAlign: "center",
                fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
                fontSize: "1rem",
                fontWeight: 600,
                color: "#737373",
                letterSpacing: "-0.01em",
              }}
              className="max-sm:text-[0.75rem] max-sm:min-w-0 max-sm:break-words"
            >
              Others
            </span>
          </div>

          <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true }}>
            {ROWS.map((row, i) => (
              <motion.div
                key={row.feature}
                variants={fadeUp}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 180px 180px",
                  padding: "1.5rem 2.5rem",
                  borderBottom: i < ROWS.length - 1 ? "1px solid #ebebeb" : "none",
                  backgroundColor: i % 2 === 0 ? "#fff" : "#fcfcfc",
                  alignItems: "center",
                }}
                className="max-sm:grid-cols-[minmax(0,1fr)_minmax(72px,auto)_minmax(72px,auto)] max-sm:px-3 max-sm:py-2.5 max-sm:gap-2 max-sm:text-xs"
              >
                <span
                  style={{
                    fontFamily: "'DM Sans', Arial, sans-serif",
                    fontSize: "1.0625rem",
                    fontWeight: 500,
                    color: "#333",
                    letterSpacing: "-0.01em",
                  }}
                  className="max-sm:text-[0.8125rem] max-sm:min-w-0"
                >
                  {row.feature}
                </span>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  {row.hydrilla ? CHECK_NODE : CROSS_NODE}
                </div>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  {row.others ? CHECK_NODE : CROSS_NODE}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="hidden max-sm:grid gap-3"
        >
          {ROWS.map((row) => (
            <motion.div
              key={row.feature}
              variants={fadeUp}
              className="rounded-xl border border-[#e8e8e8] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]"
            >
              <h3
                className="mb-4 text-[0.95rem] font-semibold leading-snug text-[#242424]"
                style={{ fontFamily: "'DM Sans', Arial, sans-serif" }}
              >
                {row.feature}
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex min-h-16 flex-col items-center justify-center gap-2 rounded-lg border border-[#d8ecfd] bg-[#f3f9ff] px-2 py-3 text-center">
                  <span
                    className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#0c84ed]"
                    style={{ fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif" }}
                  >
                    Hydrilla
                  </span>
                  {row.hydrilla ? CHECK_NODE : CROSS_NODE}
                </div>
                <div className="flex min-h-16 flex-col items-center justify-center gap-2 rounded-lg border border-[#ececec] bg-[#fafafa] px-2 py-3 text-center">
                  <span
                    className="text-[0.72rem] font-bold uppercase tracking-[0.08em] text-[#737373]"
                    style={{ fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif" }}
                  >
                    Others
                  </span>
                  {row.others ? CHECK_NODE : CROSS_NODE}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45, delay: 0.15 }}
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "0.875rem",
            justifyContent: "center",
          }}
          className="max-sm:gap-2 max-sm:px-1"
        >
          {PILLS.map(({ label, Icon }) => (
            <div
              key={label}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.625rem",
                padding: "0.625rem 1.375rem",
                borderRadius: "100px",
                border: "1px solid #e5e5e5",
                backgroundColor: "#fff",
                fontFamily: "'DM Sans', Arial, sans-serif",
                fontSize: "0.9375rem",
                fontWeight: 500,
                color: "#565656",
                letterSpacing: "-0.01em",
              }}
              className="max-sm:w-full max-sm:justify-start max-sm:rounded-xl max-sm:px-3.5 max-sm:py-3 max-sm:text-sm"
            >
              <Icon className="h-5 w-5 shrink-0 text-[#0c84ed]" aria-hidden />
              {label}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
