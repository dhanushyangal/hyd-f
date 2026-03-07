"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Sparkles,
  Layers,
  Building2,
  Check,
  ChevronRight,
  Info,
} from "lucide-react";

/** Inline toggle (replaces shadcn Switch where not installed) */
function YearlySwitch({
  id,
  checked,
  onCheckedChange,
}: {
  id: string;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      id={id}
      onClick={() => onCheckedChange(!checked)}
      style={{
        width: "2.5rem",
        height: "1.25rem",
        borderRadius: "9999px",
        border: "none",
        cursor: "pointer",
        backgroundColor: checked ? "#22c55e" : "rgba(17,17,17,0.12)",
        padding: "2px",
        transition: "background-color 0.2s ease",
        flexShrink: 0,
      }}
    >
      <span
        style={{
          display: "block",
          width: "1rem",
          height: "1rem",
          borderRadius: "50%",
          backgroundColor: "#fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          transform: checked ? "translateX(1.25rem)" : "translateX(0)",
          transition: "transform 0.2s ease",
        }}
      />
    </button>
  );
}

interface PlanFeature {
  text: string;
  highlight?: boolean;
}

interface Plan {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  name: string;
  monthlyPrice: string;
  yearlyPrice: string;
  tagline: string;
  credits: string;
  models: string;
  popular?: boolean;
  enterprise?: boolean;
  cta: string;
  ctaHref: string;
  features: PlanFeature[];
  hasYearlyToggle?: boolean;
}

const CREDIT_LEGEND = [
  { label: "Standard model", credits: "10 credits" },
  { label: "HD model", credits: "20 credits" },
  { label: "Ultra model", credits: "40 credits" },
];

const PLANS: Plan[] = [
  {
    id: "free",
    icon: <Zap size={18} strokeWidth={2} />,
    iconBg: "rgba(17,17,17,0.06)",
    name: "Free",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    tagline: "For individuals just getting started.",
    credits: "200 credits / month",
    models: "20 Standard · 10 HD",
    cta: "Get Started",
    ctaHref: "/generate",
    features: [
      { text: "Text-to-3D and Image-to-3D" },
      { text: "GLB export" },
      { text: "1 task in queue" },
      { text: "Low queue priority" },
      { text: "Assets under CC BY 4.0 license" },
      { text: "Community support via Discord" },
    ],
  },
  {
    id: "creator",
    icon: <Sparkles size={18} strokeWidth={2} />,
    iconBg: "rgba(59,142,232,0.1)",
    name: "Creator",
    monthlyPrice: "$8.99",
    yearlyPrice: "$7.25",
    tagline: "For creators who need more volume and quality.",
    credits: "1,000 credits / month",
    models: "100 Standard · 50 HD · 25 Ultra",
    popular: true,
    hasYearlyToggle: true,
    cta: "Subscribe Now",
    ctaHref: "/sign-in?redirect_url=%2Fapp%2Fpricing%3Fplan%3Dcreator",
    features: [
      { text: "Everything in Free, plus:", highlight: true },
      { text: "High-quality textured 3D models" },
      { text: "Export as GLB, FBX, OBJ, USDZ" },
      { text: "Private & creator-owned assets" },
      { text: "Unlimited downloads" },
      { text: "10 tasks in queue" },
      { text: "High queue priority" },
      { text: "4 free retries per task" },
      { text: "Blender add-on + Unity package" },
      { text: "Email support — 24hr response" },
    ],
  },
  {
    id: "studio",
    icon: <Layers size={18} strokeWidth={2} />,
    iconBg: "rgba(17,17,17,0.06)",
    name: "Studio",
    monthlyPrice: "$27.99",
    yearlyPrice: "$21.59",
    tagline: "Best for studios and teams.",
    credits: "4,000 credits / month",
    models: "400 Standard · 200 HD · 100 Ultra",
    hasYearlyToggle: true,
    cta: "Subscribe Now",
    ctaHref: "/sign-in?redirect_url=%2Fapp%2Fpricing%3Fplan%3Dstudio",
    features: [
      { text: "Everything in Creator, plus:", highlight: true },
      { text: "Ultra-quality 3D models with LODs" },
      { text: "20 tasks in queue" },
      { text: "Higher queue priority" },
      { text: "8 free retries per task" },
      { text: "Team workspace — 5 seats with roles" },
      { text: "Shared team credit pool" },
      { text: "REST API — 10,000 calls/month" },
      { text: "Priority support — 4hr response" },
    ],
  },
  {
    id: "enterprise",
    icon: <Building2 size={18} strokeWidth={2} />,
    iconBg: "rgba(17,17,17,0.06)",
    name: "Enterprise",
    monthlyPrice: "Custom",
    yearlyPrice: "Custom",
    tagline: "For organisations needing volume, custom pipelines, and dedicated support.",
    credits: "Unlimited",
    models: "Unlimited",
    enterprise: true,
    cta: "Contact Us",
    ctaHref: "/contact",
    features: [
      { text: "Everything in Studio, plus:", highlight: true },
      { text: "Unlimited credit top-ups anytime" },
      { text: "50+ tasks in queue" },
      { text: "Highest queue priority" },
      { text: "Unlimited free retries" },
      { text: "Multiple team workspaces" },
      { text: "Full API + forever asset retention" },
      { text: "Dedicated account manager" },
      { text: "Custom SLA agreement" },
      { text: "SAML SSO support" },
    ],
  },
];

function CreditsBox({
  plan,
  yearly,
}: {
  plan: Plan;
  yearly: boolean;
}) {
  const [showLegend, setShowLegend] = useState(false);

  return (
    <div
      onMouseEnter={() => setShowLegend(true)}
      onMouseLeave={() => setShowLegend(false)}
      style={{
        position: "relative",
        padding: "0.875rem 1rem",
        paddingTop: plan.hasYearlyToggle && yearly ? "1.5rem" : "0.875rem",
        borderRadius: "0.75rem",
        backgroundColor: plan.popular
          ? "rgba(59,142,232,0.07)"
          : "rgba(17,17,17,0.04)",
        border: plan.popular
          ? "1px solid rgba(59,142,232,0.18)"
          : "1px solid rgba(17,17,17,0.07)",
        cursor: "default",
        userSelect: "none",
      }}
    >
      {/* Yearly badge - top right, only when yearly; leaves room for content */}
      {plan.hasYearlyToggle && yearly && (
        <span
          style={{
            position: "absolute",
            top: "0.5rem",
            right: "0.75rem",
            padding: "0.2rem 0.5rem",
            borderRadius: "100px",
            backgroundColor: "rgba(59,142,232,0.12)",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "0.5625rem",
            fontWeight: 700,
            color: "#3b8ee8",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Billed Yearly
        </span>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", marginBottom: "0.25rem" }}>
        <p
          style={{
            margin: 0,
            fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
            fontSize: "0.875rem",
            fontWeight: 600,
            color: plan.popular ? "#3b8ee8" : "#111",
            letterSpacing: "-0.01em",
          }}
        >
          {plan.credits}
        </p>
        <Info
          size={13}
          strokeWidth={2}
          style={{ color: plan.popular ? "#3b8ee8" : "#aaa", flexShrink: 0 }}
        />
      </div>
      <p
        style={{
          margin: 0,
          fontFamily: "'DM Sans', Arial, sans-serif",
          fontSize: "0.8125rem",
          color: "#777",
          lineHeight: 1.5,
        }}
      >
        {plan.models}
      </p>

      {/* Credit legend tooltip */}
      <AnimatePresence>
        {showLegend && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: "absolute",
              bottom: "calc(100% + 10px)",
              left: 0,
              width: "100%",
              minWidth: "220px",
              padding: "0.875rem 1rem",
              borderRadius: "0.875rem",
              backgroundColor: "#111",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
              zIndex: 40,
              boxSizing: "border-box",
            }}
          >
            <p
              style={{
                margin: "0 0 0.625rem",
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "0.625rem",
                fontWeight: 700,
                color: "rgba(255,255,255,0.35)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Credit breakdown
            </p>
            {CREDIT_LEGEND.map((c) => (
              <div
                key={c.label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.3rem 0",
                }}
              >
                <span
                  style={{
                    fontFamily: "'DM Sans', Arial, sans-serif",
                    fontSize: "0.8125rem",
                    color: "rgba(255,255,255,0.65)",
                  }}
                >
                  1 {c.label}
                </span>
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    color: "#6cbcf5",
                    fontSize: "0.8125rem",
                  }}
                >
                  {c.credits}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const [yearly, setYearly] = useState(false);
  const [hovered, setHovered] = useState(false);

  const displayPrice =
    plan.enterprise
      ? plan.monthlyPrice
      : yearly
      ? plan.yearlyPrice
      : plan.monthlyPrice;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.48 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="min-w-0"
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        padding: "1.375rem",
        boxSizing: "border-box",
        width: "100%",
        borderRadius: "1.25rem",
        border: plan.popular
          ? `1.5px solid ${hovered ? "rgba(59,142,232,0.6)" : "rgba(59,142,232,0.35)"}`
          : `1px solid ${hovered ? "rgba(17,17,17,0.14)" : "rgba(17,17,17,0.08)"}`,
        backgroundColor: "#ffffff",
        boxShadow: hovered
          ? "0 8px 32px rgba(17,17,17,0.1), 0 2px 6px rgba(17,17,17,0.06)"
          : "0 1px 3px rgba(17,17,17,0.08), 0 1px 1px rgba(17,17,17,0.04)",
        gap: "1.25rem",
        overflow: "visible",
        transition: "box-shadow 0.28s cubic-bezier(0.4,0,0.2,1), border-color 0.28s cubic-bezier(0.4,0,0.2,1), transform 0.24s cubic-bezier(0.4,0,0.2,1)",
        transform: hovered ? "translateY(-3px)" : "translateY(0px)",
      }}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div
          style={{
            position: "absolute",
            top: "-13px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "0.25rem 1rem",
            borderRadius: "100px",
            backgroundColor: "#3b8ee8",
            color: "#fff",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "0.625rem",
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 10px rgba(59,142,232,0.4)",
          }}
        >
          Most Popular
        </div>
      )}

      {/* Icon + name + yearly switch (if applicable) */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "9px",
              backgroundColor: plan.iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: plan.popular ? "#3b8ee8" : "#444",
              flexShrink: 0,
            }}
          >
            {plan.icon}
          </span>
          <span
            style={{
              fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#111",
              letterSpacing: "-0.025em",
            }}
          >
            {plan.name}
          </span>
        </div>

        {/* Per-card yearly switch */}
        {plan.hasYearlyToggle && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.375rem", flexShrink: 0 }}>
            <label
              htmlFor={`yearly-${plan.id}`}
              style={{
                fontFamily: "'DM Sans', Arial, sans-serif",
                fontSize: "0.6875rem",
                fontWeight: yearly ? 600 : 400,
                color: yearly ? "#3b8ee8" : "#aaa",
                cursor: "pointer",
                transition: "color 0.18s",
                userSelect: "none",
              }}
            >
              Yearly
            </label>
            <YearlySwitch
              id={`yearly-${plan.id}`}
              checked={yearly}
              onCheckedChange={setYearly}
            />
          </div>
        )}
      </div>

      {/* Price */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "0.25rem" }}>
          <span
            style={{
              fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
              fontSize: plan.enterprise ? "1.875rem" : "2.375rem",
              fontWeight: 800,
              color: "#111",
              letterSpacing: "-0.045em",
              lineHeight: 1,
              transition: "all 0.2s ease",
            }}
          >
            {displayPrice}
          </span>
          {!plan.enterprise && (
            <span
              style={{
                fontFamily: "'DM Sans', Arial, sans-serif",
                fontSize: "0.8125rem",
                color: "#999",
                fontWeight: 400,
              }}
            >
              /month
            </span>
          )}
        </div>
        {plan.hasYearlyToggle && !yearly && (
          <p
            style={{
              margin: "0.3rem 0 0",
              fontFamily: "'DM Sans', Arial, sans-serif",
              fontSize: "0.75rem",
              color: "#3b8ee8",
              fontWeight: 500,
            }}
          >
            Save with yearly · {plan.yearlyPrice}/month
          </p>
        )}
        <p
          style={{
            margin: "0.5rem 0 0",
            fontFamily: "'DM Sans', Arial, sans-serif",
            fontSize: "0.875rem",
            color: "#6b6966",
            lineHeight: 1.55,
          }}
        >
          {plan.tagline}
        </p>
      </div>

      {/* Credits box */}
      <CreditsBox plan={plan} yearly={yearly} />

      {/* Features */}
      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: "0.625rem",
          flex: 1,
          width: "100%",
        }}
      >
        {plan.features.map((f, i) => (
          <li
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "0.5rem",
            }}
          >
            <div style={{ marginTop: "2px", flexShrink: 0 }}>
              <Check
                size={14}
                strokeWidth={2.5}
                style={{ color: f.highlight ? "#3b8ee8" : "#bbb" }}
              />
            </div>
            <span
              style={{
                fontFamily: "'DM Sans', Arial, sans-serif",
                fontSize: "0.875rem",
                color: f.highlight ? "#111" : "#5e5c5a",
                fontWeight: f.highlight ? 600 : 400,
                letterSpacing: "-0.01em",
                lineHeight: 1.5,
              }}
            >
              {f.text}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <div style={{ paddingTop: "0.25rem" }}>
        <Link
          href={plan.ctaHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.375rem",
            width: "100%",
            padding: "0.875rem 1.5rem",
            borderRadius: "0.875rem",
            backgroundColor: plan.popular ? "#111" : "transparent",
            border: plan.popular ? "none" : "1.5px solid rgba(17,17,17,0.15)",
            color: plan.popular ? "#fff" : "#111",
            fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
            fontSize: "0.9375rem",
            fontWeight: 600,
            textDecoration: "none",
            letterSpacing: "-0.01em",
            minHeight: "48px",
            boxSizing: "border-box",
            transition: "background-color 0.2s ease, opacity 0.2s ease, transform 0.18s ease",
          }}
          className="pricing-cta-btn"
        >
          {plan.cta}
          <ChevronRight size={15} strokeWidth={2.5} />
        </Link>
      </div>
    </motion.div>
  );
}

export default function PricingSection() {
  return (
    <section
      style={{
        width: "100%",
        backgroundColor: "#faf9f7",
        boxSizing: "border-box",
        WebkitFontSmoothing: "antialiased",
      }}
      className="px-6 py-24 pb-28 max-md:px-4 max-md:pt-10 max-md:pb-12 max-sm:px-4 max-sm:pt-6 max-sm:pb-8"
    >
      <style>{`
        .pricing-cta-btn:hover {
          opacity: 0.88;
          transform: scale(1.01);
        }
        .pricing-cta-btn:active {
          transform: scale(0.985);
        }
      `}</style>

      <div style={{ maxWidth: "80rem", margin: "0 auto" }} className="max-sm:px-0 max-sm:w-full w-full min-w-0">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: "center", marginBottom: "3.5rem" }}
          className="max-md:mb-8 max-sm:mb-6"
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
            Our Pricing
          </p>
          <h2
            style={{
              margin: "0 0 1.25rem",
              fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
              fontSize: "clamp(2rem, 4.5vw, 3.25rem)",
              fontWeight: 700,
              color: "#111",
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
            }}
          >
            Flexible plans that grow with you
          </h2>
          <p
            style={{
              margin: "0 auto",
              fontFamily: "'DM Sans', Arial, sans-serif",
              fontSize: "1.0625rem",
              color: "#6b6966",
              lineHeight: 1.65,
            }}
          >
            Start for free, upgrade when you&apos;re ready.
          </p>
        </motion.div>

        {/* Plan cards — desktop 4 cols; tablet/mobile single column (flex-like, same as landing) */}
        <div
          className="w-full grid grid-cols-4 max-lg:grid-cols-2 max-md:grid-cols-1 items-stretch gap-[18px] pt-6 max-md:gap-4 max-md:pt-4 max-sm:gap-4 max-sm:px-0 max-sm:pt-4 min-w-0"
          style={{ boxSizing: "border-box" }}
        >
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>

      </div>
    </section>
  );
}
