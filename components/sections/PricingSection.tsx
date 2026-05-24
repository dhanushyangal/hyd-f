"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import {
  Zap,
  Sparkles,
  Layers,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Info,
  Gauge,
  Gem,
  ShieldCheck,
} from "lucide-react";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://hydrilla-backend.vercel.app"
).replace(/\/+$/, "");

/** Inline toggle */
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
      aria-label="Toggle yearly billing"
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
  {
    label: "Standard model",
    detail: "Fast drafts and everyday assets",
    credits: "10",
    tone: "#4f8ef7",
    bg: "rgba(79,142,247,0.1)",
    Icon: Layers,
  },
  {
    label: "HD model",
    detail: "Sharper materials and cleaner detail",
    credits: "20",
    tone: "#14a78b",
    bg: "rgba(20,167,139,0.1)",
    Icon: Sparkles,
  },
  {
    label: "Ultra model",
    detail: "Final-quality detail for hero assets",
    credits: "40",
    tone: "#8b5cf6",
    bg: "rgba(139,92,246,0.1)",
    Icon: Gem,
  },
];

const CREDIT_HIGHLIGHTS = [
  { label: "Monthly reset", value: "Fresh credits every cycle", Icon: Gauge },
  { label: "Private assets", value: "Paid plans keep ownership with you", Icon: ShieldCheck },
  { label: "Quality tiers", value: "Spend more only when detail matters", Icon: Gem },
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
    ctaHref: "/checkout?plan=creator",
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
    ctaHref: "/checkout?plan=studio",
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

function CreditsBox({ plan, yearly }: { plan: Plan; yearly: boolean }) {
  return (
    <div
      style={{
        position: "relative",
        padding: "1rem",
        paddingTop: plan.hasYearlyToggle && yearly ? "1.65rem" : "1rem",
        borderRadius: "1rem",
        background: plan.popular
          ? "linear-gradient(135deg, rgba(59,142,232,0.11), rgba(255,255,255,0.9))"
          : "linear-gradient(135deg, rgba(17,17,17,0.045), rgba(255,255,255,0.92))",
        border: plan.popular ? "1px solid rgba(59,142,232,0.2)" : "1px solid rgba(17,17,17,0.08)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
        cursor: "default",
        userSelect: "none",
      }}
    >
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
        <Info size={13} strokeWidth={2} style={{ color: plan.popular ? "#3b8ee8" : "#aaa", flexShrink: 0 }} />
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
    </div>
  );
}

type UserPlan = "free" | "creator" | "studio" | null;

function PlanCard({ plan, userPlan, planLoading }: { plan: Plan; userPlan: UserPlan; planLoading: boolean }) {
  const [yearly, setYearly] = useState(false);
  const [hovered, setHovered] = useState(false);

  const displayPrice =
    plan.enterprise ? plan.monthlyPrice : yearly ? plan.yearlyPrice : plan.monthlyPrice;

  // Determine CTA state
  const isCurrentPlan = !planLoading && userPlan !== null && (
    plan.id === userPlan ||
    (plan.id === "free" && userPlan === null)
  );
  // Actually handle free separately — free is current only if signed in with no paid plan
  const isCurrentFreePlan = !planLoading && userPlan === null && plan.id === "free";
  const isCurrentPaidPlan = !planLoading && userPlan !== null && plan.id === userPlan;
  const isCurrentAny = isCurrentFreePlan || isCurrentPaidPlan;

  const canUpgrade = !planLoading && userPlan === "creator" && plan.id === "studio";
  // If on studio, creator is a downgrade — show as disabled with note
  const isLowerPlan = !planLoading && userPlan === "studio" && (plan.id === "creator" || plan.id === "free");

  let ctaLabel = plan.cta;
  let ctaEnabled = true;

  if (isCurrentAny) {
    ctaLabel = "Current Plan";
    ctaEnabled = false;
  } else if (canUpgrade) {
    ctaLabel = "Upgrade to Studio";
    ctaEnabled = true;
  } else if (isLowerPlan) {
    ctaLabel = plan.id === "creator" ? "On Studio Plan" : plan.cta;
    ctaEnabled = false;
  }

  const ctaBg = isCurrentAny ? "#16a34a" : "#111";
  const ctaColor = "#fff";
  const ctaBorder = "none";

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
        border: isCurrentPaidPlan
          ? "1.5px solid rgba(22,163,74,0.5)"
          : plan.popular
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
      {/* Current plan badge */}
      {isCurrentPaidPlan && (
        <div
          style={{
            position: "absolute",
            top: "-13px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "0.25rem 1rem",
            borderRadius: "100px",
            backgroundColor: "#16a34a",
            color: "#fff",
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "0.625rem",
            fontWeight: 700,
            letterSpacing: "0.07em",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            boxShadow: "0 2px 10px rgba(22,163,74,0.4)",
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
          }}
        >
          <CheckCircle2 size={10} strokeWidth={2.5} />
          Your Current Plan
        </div>
      )}

      {/* Popular badge (only if not current plan) */}
      {plan.popular && !isCurrentPaidPlan && (
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

      {/* Icon + name + yearly switch */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "9px",
              backgroundColor: isCurrentPaidPlan ? "rgba(22,163,74,0.1)" : plan.iconBg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isCurrentPaidPlan ? "#16a34a" : plan.popular ? "#3b8ee8" : "#444",
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

        {plan.hasYearlyToggle && !isCurrentAny && (
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
            <span style={{ fontFamily: "'DM Sans', Arial, sans-serif", fontSize: "0.8125rem", color: "#999", fontWeight: 400 }}>
              /month
            </span>
          )}
        </div>
        {plan.hasYearlyToggle && !yearly && !isCurrentAny && (
          <p style={{ margin: "0.3rem 0 0", fontFamily: "'DM Sans', Arial, sans-serif", fontSize: "0.75rem", color: "#3b8ee8", fontWeight: 500 }}>
            Save with yearly · {plan.yearlyPrice}/month
          </p>
        )}
        <p style={{ margin: "0.5rem 0 0", fontFamily: "'DM Sans', Arial, sans-serif", fontSize: "0.875rem", color: "#6b6966", lineHeight: 1.55 }}>
          {plan.tagline}
        </p>
      </div>

      {/* Credits box */}
      <CreditsBox plan={plan} yearly={yearly} />

      {/* Features */}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "0.625rem", flex: 1, width: "100%" }}>
        {plan.features.map((f, i) => (
          <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
            <div style={{ marginTop: "2px", flexShrink: 0 }}>
              <Check size={14} strokeWidth={2.5} style={{ color: f.highlight ? "#3b8ee8" : "#bbb" }} />
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
        {ctaEnabled ? (
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
              backgroundColor: ctaBg,
              border: ctaBorder,
              color: ctaColor,
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
            {ctaLabel}
            <ChevronRight size={15} strokeWidth={2.5} />
          </Link>
        ) : (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.375rem",
              width: "100%",
              padding: "0.875rem 1.5rem",
              borderRadius: "0.875rem",
              backgroundColor: isCurrentAny ? "#16a34a" : "rgba(17,17,17,0.05)",
              border: isCurrentAny ? "none" : "1.5px solid rgba(17,17,17,0.10)",
              color: isCurrentAny ? "#fff" : "#999",
              fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif",
              fontSize: "0.9375rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              minHeight: "48px",
              boxSizing: "border-box",
              cursor: "default",
            }}
          >
            {isCurrentAny && <CheckCircle2 size={15} strokeWidth={2.5} />}
            {ctaLabel}
          </div>
        )}

        {/* Upgrade hint for creator plan users on creator card */}
        {isCurrentPaidPlan && plan.id === "creator" && (
          <p
            style={{
              margin: "0.625rem 0 0",
              textAlign: "center",
              fontFamily: "'DM Sans', Arial, sans-serif",
              fontSize: "0.75rem",
              color: "#6b7280",
              lineHeight: 1.5,
            }}
          >
            Need more?{" "}
            <Link href="/checkout?plan=studio" style={{ color: "#3b8ee8", fontWeight: 600, textDecoration: "none" }}>
              Upgrade to Studio →
            </Link>
          </p>
        )}
      </div>
    </motion.div>
  );
}

function CreditBreakdownPanel() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: 0.08 }}
      className="mt-8 grid grid-cols-[0.9fr_1.5fr] gap-5 rounded-[1.65rem] border border-[#dfe7ef] bg-white/85 p-5 shadow-[0_26px_80px_rgba(15,23,42,0.09),inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl max-lg:grid-cols-1 max-sm:mt-6 max-sm:rounded-2xl max-sm:p-4"
    >
      <div className="relative isolate flex flex-col justify-between gap-6 overflow-hidden rounded-[1.2rem] bg-[#10141d] p-5 text-white max-sm:p-4">
        <div className="absolute inset-x-0 top-0 -z-10 h-32 bg-[radial-gradient(circle_at_30%_0%,rgba(79,142,247,0.42),transparent_55%),radial-gradient(circle_at_80%_10%,rgba(139,92,246,0.32),transparent_50%)]" />
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5">
            <Gauge size={14} strokeWidth={2.2} className="text-[#8ec5ff]" aria-hidden />
            <span
              className="text-[0.7rem] font-bold uppercase tracking-[0.11em] text-white/62"
              style={{ fontFamily: "'DM Sans', Arial, sans-serif" }}
            >
              Credit breakdown
            </span>
          </div>
          <h3
            className="text-2xl font-bold leading-tight tracking-tight max-sm:text-xl"
            style={{ fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif" }}
          >
            Use credits where quality matters most.
          </h3>
        </div>
        <p
          className="max-w-md text-sm leading-6 text-white/68"
          style={{ fontFamily: "'DM Sans', Arial, sans-serif" }}
        >
          Every model tier consumes a clear amount of credits, so creators can move fast on drafts and spend more on final assets.
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
          {CREDIT_LEGEND.map((item) => (
            <div
              key={item.label}
              className="group rounded-[1.125rem] border border-black/[0.06] bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]"
            >
              <div
                className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105"
                style={{ backgroundColor: item.bg, color: item.tone }}
              >
                <item.Icon size={18} strokeWidth={2.2} aria-hidden />
              </div>
              <p
                className="mb-1 text-sm font-semibold text-[#1f2937]"
                style={{ fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif" }}
              >
                {item.label}
              </p>
              <p className="mb-3 min-h-8 text-xs leading-4 text-neutral-500" style={{ fontFamily: "'DM Sans', Arial, sans-serif" }}>
                {item.detail}
              </p>
              <div className="flex items-end justify-between gap-2 border-t border-[#edf1f5] pt-3">
                <span className="text-[0.68rem] font-bold uppercase tracking-[0.08em] text-neutral-400">Cost</span>
                <div className="flex items-baseline gap-1">
                <span
                  className="text-3xl font-bold tracking-tight"
                  style={{ color: item.tone, fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif" }}
                >
                  {item.credits}
                </span>
                <span className="text-xs font-medium text-neutral-500">credits</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
          {CREDIT_HIGHLIGHTS.map(({ label, value, Icon }) => (
            <div key={label} className="flex items-start gap-3 rounded-2xl border border-[#e7edf3] bg-[#f8fbfd] p-3.5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-[#4f8ef7] shadow-[0_5px_18px_rgba(15,23,42,0.06)]">
                <Icon size={17} strokeWidth={2.2} aria-hidden />
              </span>
              <div>
                <p
                  className="text-sm font-semibold text-[#18212f]"
                  style={{ fontFamily: "'Space Grotesk', 'DM Sans', Arial, sans-serif" }}
                >
                  {label}
                </p>
                <p className="mt-0.5 text-xs leading-5 text-neutral-500" style={{ fontFamily: "'DM Sans', Arial, sans-serif" }}>
                  {value}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function PricingSection() {
  const { getToken, isSignedIn } = useAuth();
  const [userPlan, setUserPlan] = useState<UserPlan>(null);
  const [planLoading, setPlanLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      setPlanLoading(false);
      return;
    }
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${BACKEND_URL}/api/payments/subscription`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const { subscription } = await res.json();
          setUserPlan((subscription?.plan as UserPlan) ?? null);
        }
      } catch {
        // silent fail
      } finally {
        setPlanLoading(false);
      }
    })();
  }, [isSignedIn, getToken]);

  return (
    <section
      style={{
        width: "100%",
        background: "linear-gradient(180deg, #f7fafc 0%, #ffffff 58%, #f7fafc 100%)",
        boxSizing: "border-box",
        WebkitFontSmoothing: "antialiased",
      }}
      className="px-6 py-24 pb-24 max-md:px-4 max-md:pt-12 max-md:pb-14 max-sm:px-4 max-sm:pt-10 max-sm:pb-12"
    >
      <style>{`
        .pricing-cta-btn:hover { opacity: 0.88; transform: scale(1.01); }
        .pricing-cta-btn:active { transform: scale(0.985); }
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
              color: "#666",
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
          <p style={{ margin: "0 auto", maxWidth: "38rem", fontFamily: "'DM Sans', Arial, sans-serif", fontSize: "1.0625rem", color: "#5f6b7a", lineHeight: 1.65 }}>
            Start free, scale into production, and keep credits transparent across every model tier.
          </p>

          {/* Active plan banner */}
          {isSignedIn && userPlan && !planLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                marginTop: "1.25rem",
                padding: "0.5rem 1.25rem",
                borderRadius: "100px",
                backgroundColor: "rgba(22,163,74,0.08)",
                border: "1px solid rgba(22,163,74,0.2)",
                fontFamily: "'DM Sans', Arial, sans-serif",
                fontSize: "0.875rem",
                color: "#15803d",
                fontWeight: 500,
              }}
            >
              <CheckCircle2 size={15} strokeWidth={2} />
              You are on the <strong style={{ fontWeight: 700, textTransform: "capitalize" }}>{userPlan}</strong> plan
            </motion.div>
          )}
        </motion.div>

        {/* Plan cards */}
        <div
          className="w-full grid grid-cols-4 max-lg:grid-cols-2 max-md:grid-cols-1 items-stretch gap-[18px] pt-6 max-md:gap-4 max-md:pt-4 max-sm:gap-4 max-sm:px-0 max-sm:pt-4 min-w-0"
          style={{ boxSizing: "border-box" }}
        >
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} userPlan={isSignedIn ? userPlan : null} planLoading={planLoading} />
          ))}
        </div>

        <CreditBreakdownPanel />
      </div>
    </section>
  );
}
