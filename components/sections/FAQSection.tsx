"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus } from "lucide-react";

const FAQ_ITEMS = [
  {
    question: "Who is Hydrilla designed for?",
    answer:
      "Hydrilla is built for creators, studios, and teams who need fast generation of production-ready 3D assets for games, film, architecture, and digital products.",
  },
  {
    question: "How much time can Hydrilla save in asset creation?",
    answer:
      "Hydrilla can generate structured 3D assets in minutes, helping teams reduce the time spent on early modeling and concept asset production.",
  },
  {
    question: "Is there a free plan available?",
    answer:
      "Yes. Hydrilla offers a free plan so users can explore the platform and generate a limited number of models before upgrading.",
  },
  {
    question: "Can I change or cancel my plan anytime?",
    answer:
      "Yes. Plans can be upgraded, downgraded, or cancelled at any time directly from your account settings.",
  },
  {
    question: "Is Hydrilla difficult to learn?",
    answer:
      "No. Hydrilla is designed to be simple to start with, while still supporting advanced workflows for professional teams.",
  },
  {
    question: "What inputs does Hydrilla support?",
    answer:
      "Hydrilla supports both text prompts and reference images, allowing users to generate 3D assets from descriptions or visual input.",
  },
  {
    question: "Can Hydrilla integrate with my pipeline?",
    answer:
      "Yes. Assets can be exported in GLB, FBX, OBJ, and USDZ, and API access allows integration with existing production workflows.",
  },
];

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}

function FAQChatItem({ question, answer, isOpen, onToggle, index }: FAQItemProps) {
  const answerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        paddingBlock: "1rem",
        borderLeft: "1px dashed transparent",
        borderRight: "1px dashed transparent",
        borderImage: "repeating-linear-gradient(#d5d5d5 0 10px,transparent 10px 20px) 1",
      }}
    >
      {/* Question bubble – right side (user) */}
      <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: "0.625rem" }}>
        <button
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? "Collapse answer" : "Expand answer"}
          style={{
            width: "2.25rem",
            height: "2.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            backgroundColor: "#161616",
            color: "#fff",
            borderRadius: "50%",
            border: "none",
            cursor: "pointer",
            transition: "transform 0.28s cubic-bezier(0.4,0,0.2,1)",
            transform: isOpen ? "rotate(-12deg) scale(1.05)" : "rotate(0deg) scale(1)",
          }}
        >
          {isOpen ? <Minus size={16} strokeWidth={1.5} /> : <Plus size={16} strokeWidth={1.5} />}
        </button>
        <p
          style={{
            padding: "1rem 1.25rem",
            borderRadius: "1.5rem 1.5rem 0 1.5rem",
            backgroundColor: "#161616",
            color: "#fff",
            fontFamily: "'DM Sans', Arial, sans-serif",
            fontSize: "1rem",
            fontWeight: 500,
            lineHeight: 1.55,
            margin: 0,
            maxWidth: "480px",
            cursor: "pointer",
            userSelect: "none",
          }}
          onClick={onToggle}
        >
          {question}
        </p>
      </div>

      {/* Answer bubble – left side (Hydrilla) */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key={`answer-${index}`}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.28, ease: [0.215, 0.61, 0.355, 1] }}
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "0.625rem",
              maxWidth: "480px",
              marginRight: "auto",
              width: "100%",
              transformOrigin: "top left",
            }}
          >
            {/* Hydrilla logo avatar */}
            <div
              style={{
                position: "relative",
                flexShrink: 0,
                width: "2.125rem",
                height: "2.125rem",
                borderRadius: "50%",
                border: "2px solid #fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
                overflow: "hidden",
                backgroundColor: "#f5f5f5",
              }}
            >
              <Image
                src="/hyd01.png"
                alt="Hydrilla"
                fill
                style={{ objectFit: "contain", padding: "4px" }}
                sizes="34px"
              />
            </div>
            <p
              style={{
                padding: "1.25rem 1.5rem",
                borderRadius: "1.5rem 1.5rem 1.5rem 0.375rem",
                backgroundColor: "#fff",
                border: "1px solid rgba(17,17,17,0.07)",
                boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
                fontFamily: "'DM Sans', Arial, sans-serif",
                fontSize: "1rem",
                color: "#222",
                lineHeight: 1.7,
                margin: 0,
                flex: 1,
              }}
            >
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "#fff",
        padding: "7rem 1.5rem 8rem",
        boxSizing: "border-box",
        WebkitFontSmoothing: "antialiased",
      }}
      className="max-sm:px-4 max-sm:py-12 max-sm:pb-14"
    >
      <div style={{ maxWidth: "44rem", margin: "0 auto" }} className="max-sm:px-0">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <p
            style={{
              margin: "0 0 0.875rem",
              fontFamily: "'DM Sans', Arial, sans-serif",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#666",
            }}
          >
            FAQ
          </p>
          <h2
            style={{
              margin: 0,
              fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
              fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
              fontWeight: 700,
              color: "#111",
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
            }}
          >
            Questions &amp; answers
          </h2>
        </div>

        {/* Chat-style FAQ — clear border and spacing; mobile: tighter padding */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1.75rem",
            padding: "2.5rem 2rem",
            border: "1px solid rgba(17,17,17,0.1)",
            borderRadius: "1rem",
            backgroundColor: "rgba(17,17,17,0.02)",
          }}
          className="max-sm:px-4 max-sm:py-5 max-sm:gap-5"
        >
          {FAQ_ITEMS.map((item, i) => (
            <FAQChatItem
              key={i}
              index={i}
              question={item.question}
              answer={item.answer}
              isOpen={openIndex === i}
              onToggle={() => setOpenIndex(openIndex === i ? null : i)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
