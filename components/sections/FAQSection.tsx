"use client";

import React, { useState } from "react";
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
  return (
    <div className="faq-chat-item">
      <div className="faq-question-row">
        <button
          type="button"
          onClick={onToggle}
          aria-label={isOpen ? "Collapse answer" : "Expand answer"}
          aria-expanded={isOpen}
          className="faq-toggle"
        >
          {isOpen ? <Minus size={16} strokeWidth={1.8} /> : <Plus size={16} strokeWidth={1.8} />}
        </button>
        <button type="button" className="faq-question-bubble" onClick={onToggle}>
          {question}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key={`answer-${index}`}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="faq-answer-row"
          >
            <div className="faq-avatar">
              <Image
                src="/hyd01.png"
                alt="Hydrilla"
                fill
                style={{ objectFit: "contain", padding: "4px" }}
                sizes="34px"
              />
            </div>
            <p className="faq-answer-bubble">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="faq-section">
      <style>{`
        .faq-section {
          width: 100%;
          background: linear-gradient(180deg, #f7fafc 0%, #fff 24%, #fff 74%, #f8fafc 100%);
          padding: 6.5rem 1.5rem 7.5rem;
          box-sizing: border-box;
          -webkit-font-smoothing: antialiased;
        }
        .faq-shell {
          max-width: 46rem;
          margin: 0 auto;
        }
        .faq-header {
          text-align: center;
          margin-bottom: 3.75rem;
        }
        .faq-kicker {
          margin: 0 0 0.875rem;
          font-family: 'DM Sans', Arial, sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: #64748b;
        }
        .faq-title {
          margin: 0;
          font-family: 'Space Grotesk', 'DM Sans', Arial, sans-serif;
          font-size: clamp(2rem, 4.5vw, 3.25rem);
          font-weight: 700;
          color: #111827;
          letter-spacing: -0.04em;
          line-height: 1.15;
        }
        .faq-chat {
          display: flex;
          flex-direction: column;
          gap: 1.45rem;
          padding: 2rem;
          border: 1px solid rgba(148, 163, 184, 0.28);
          border-radius: 1.25rem;
          background: rgba(255, 255, 255, 0.74);
          box-shadow: 0 24px 70px rgba(15, 23, 42, 0.07), inset 0 1px 0 rgba(255,255,255,0.9);
          backdrop-filter: blur(18px);
        }
        .faq-chat-item {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          padding-block: 0.75rem;
          border-left: 1px dashed rgba(148, 163, 184, 0.45);
          border-right: 1px dashed rgba(148, 163, 184, 0.22);
        }
        .faq-question-row {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 0.625rem;
        }
        .faq-toggle {
          width: 2.25rem;
          height: 2.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          background: #111827;
          color: #fff;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(15, 23, 42, 0.14);
          transition: transform 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
        }
        .faq-toggle:hover {
          transform: translateY(-1px);
          background: #0f172a;
          box-shadow: 0 14px 30px rgba(15, 23, 42, 0.18);
        }
        .faq-question-bubble {
          padding: 1rem 1.25rem;
          border-radius: 1.45rem 1.45rem 0.25rem 1.45rem;
          background: linear-gradient(135deg, #111827, #1f2937);
          color: #fff;
          font-family: 'DM Sans', Arial, sans-serif;
          font-size: 1rem;
          font-weight: 500;
          line-height: 1.55;
          margin: 0;
          max-width: 500px;
          cursor: pointer;
          text-align: left;
          border: 0;
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.13);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .faq-question-bubble:hover {
          transform: translateY(-1px);
          box-shadow: 0 16px 36px rgba(15, 23, 42, 0.16);
        }
        .faq-answer-row {
          display: flex;
          align-items: flex-end;
          gap: 0.625rem;
          max-width: 500px;
          margin-right: auto;
          width: 100%;
          transform-origin: top left;
        }
        .faq-avatar {
          position: relative;
          flex-shrink: 0;
          width: 2.125rem;
          height: 2.125rem;
          border-radius: 50%;
          border: 2px solid #fff;
          box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
          overflow: hidden;
          background: #f8fafc;
        }
        .faq-answer-bubble {
          padding: 1.15rem 1.35rem;
          border-radius: 1.45rem 1.45rem 1.45rem 0.375rem;
          background: #fff;
          border: 1px solid rgba(148, 163, 184, 0.24);
          box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
          font-family: 'DM Sans', Arial, sans-serif;
          font-size: 0.98rem;
          color: #334155;
          line-height: 1.7;
          margin: 0;
          flex: 1;
        }
        @media (max-width: 640px) {
          .faq-section {
            padding: 3.25rem 1rem 3.75rem;
          }
          .faq-header {
            margin-bottom: 2rem;
          }
          .faq-chat {
            gap: 1.15rem;
            padding: 1.15rem;
            border-radius: 1rem;
          }
          .faq-chat-item {
            gap: 0.85rem;
            padding-block: 0.5rem;
          }
          .faq-question-row {
            gap: 0.5rem;
          }
          .faq-toggle {
            width: 2rem;
            height: 2rem;
          }
          .faq-question-bubble {
            padding: 0.875rem 1rem;
            font-size: 0.92rem;
            line-height: 1.5;
          }
          .faq-answer-bubble {
            padding: 1rem;
            font-size: 0.9rem;
            line-height: 1.65;
          }
        }
      `}</style>

      <div className="faq-shell">
        <div className="faq-header">
          <p className="faq-kicker">FAQ</p>
          <h2 className="faq-title">Questions &amp; answers</h2>
        </div>

        <div className="faq-chat">
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
