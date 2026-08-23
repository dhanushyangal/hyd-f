"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { useAuth } from "@clerk/nextjs";
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Minus,
} from "lucide-react";

import { BlurReveal } from "@/components/ui/BlurReveal";
import { PRICING_IMAGES } from "@/lib/cloudinary";
import { track } from "@/lib/analytics";
import {
  YEARLY_DISCOUNT_PERCENT,
  checkoutHref,
  formatUsd,
  PRICING,
} from "@/lib/pricing";
import { cn } from "@/lib/utils";

const FONT = "var(--font-dm-sans), 'DM Sans', sans-serif";
const FONT_DISPLAY =
  "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://hydrilla-backend.vercel.app"
).replace(/\/+$/, "");

type PlanId = "free" | "creator" | "studio";
type UserPlan = PlanId | null;
type FeatureValue = boolean | string;

interface Plan {
  id: PlanId;
  name: string;
  description: string;
  image: string;
  monthlyPrice: string;
  yearlyPrice: string;
  credits: string;
  cta: string;
  featured?: boolean;
  mobileFeatures: string[];
}

interface Feature {
  name: string;
  values: [FeatureValue, FeatureValue, FeatureValue];
}

const PLANS: Plan[] = [
  {
    id: "free",
    name: PRICING.free.label,
    description: "Start generating and export your first production mesh.",
    image: PRICING_IMAGES.free,
    monthlyPrice: formatUsd(PRICING.free.monthly),
    yearlyPrice: formatUsd(PRICING.free.yearlyMonthlyEquivalent),
    credits: PRICING.free.creditsLabel,
    cta: "Start creating",
    mobileFeatures: ["GLB export", "1 queued task", "Community support"],
  },
  {
    id: "creator",
    name: PRICING.creator.label,
    description: "Volume, every format, and a faster queue for independent work.",
    image: PRICING_IMAGES.creator,
    monthlyPrice: formatUsd(PRICING.creator.monthly),
    yearlyPrice: formatUsd(PRICING.creator.yearlyMonthlyEquivalent),
    credits: PRICING.creator.creditsLabel,
    cta: "Choose Creator",
    featured: true,
    mobileFeatures: [
      "GLB, FBX, OBJ, USDZ",
      "10 queued tasks",
      "Email support within 24h",
    ],
  },
  {
    id: "studio",
    name: PRICING.studio.label,
    description: "Seats, API access, and capacity for teams that ship weekly.",
    image: PRICING_IMAGES.studio,
    monthlyPrice: formatUsd(PRICING.studio.monthly),
    yearlyPrice: formatUsd(PRICING.studio.yearlyMonthlyEquivalent),
    credits: PRICING.studio.creditsLabel,
    cta: "Choose Studio",
    mobileFeatures: [
      "5 team seats",
      "20 queued tasks",
      "10,000 API calls / month",
    ],
  },
];

const FEATURES: Feature[] = [
  { name: "Text-to-3D and Image-to-3D", values: [true, true, true] },
  {
    name: "Export formats",
    values: ["GLB", "GLB, FBX, OBJ, USDZ", "GLB, FBX, OBJ, USDZ"],
  },
  { name: "Concurrent queued tasks", values: ["1", "10", "20"] },
  { name: "Queue priority", values: ["Standard", "High", "Highest"] },
  { name: "Free retries per task", values: ["—", "4", "8"] },
  { name: "Private assets", values: [false, true, true] },
  { name: "Team workspace", values: [false, false, "5 seats"] },
  { name: "REST API", values: [false, false, "10,000 calls / month"] },
  { name: "Support", values: ["Community", "Email · 24h", "Priority · 4h"] },
];

interface CtaState {
  label: string;
  disabled: boolean;
  current: boolean;
}

function getCtaState(
  plan: Plan,
  userPlan: UserPlan,
  loading: boolean,
  signedIn: boolean
): CtaState {
  const current =
    signedIn &&
    !loading &&
    ((userPlan === null && plan.id === "free") || userPlan === plan.id);

  if (current) return { label: "Current plan", disabled: true, current: true };
  if (!loading && userPlan === "creator" && plan.id === "studio") {
    return { label: "Upgrade to Studio", disabled: false, current: false };
  }
  if (!loading && userPlan === "studio" && plan.id !== "studio") {
    return {
      label: plan.id === "creator" ? "Included with Studio" : plan.cta,
      disabled: true,
      current: false,
    };
  }
  return { label: plan.cta, disabled: false, current: false };
}

function PlanAction({
  plan,
  state,
  yearly,
}: {
  plan: Plan;
  state: CtaState;
  yearly: boolean;
}) {
  const featured = Boolean(plan.featured);

  if (state.disabled) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-[14px] font-semibold tracking-[-0.01em]",
          state.current
            ? featured
              ? "bg-white text-neutral-950"
              : "bg-neutral-950 text-white"
            : featured
              ? "cursor-not-allowed bg-white/10 text-white/40"
              : "cursor-not-allowed bg-neutral-100 text-neutral-400"
        )}
        style={{ fontFamily: FONT }}
      >
        {state.current && <CheckCircle2 className="h-4 w-4" />}
        {state.label}
      </button>
    );
  }

  const href =
    plan.id === "free"
      ? "/generate"
      : checkoutHref(plan.id, yearly ? "yearly" : "monthly");

  return (
    <Link
      href={href}
      onClick={() =>
        track("plan_cta_clicked", {
          plan: plan.id,
          cta_label: state.label,
          featured: plan.featured,
          billing: yearly ? "yearly" : "monthly",
        })
      }
      className={cn(
        "inline-flex h-11 w-full items-center justify-center gap-1 rounded-full text-[14px] font-semibold tracking-[-0.01em] transition-colors",
        featured
          ? "bg-white text-neutral-950 shadow-[0_8px_24px_-8px_rgba(255,255,255,0.45)] hover:bg-neutral-100"
          : "bg-neutral-950 text-white hover:bg-neutral-800"
      )}
      style={{ fontFamily: FONT }}
    >
      {state.label}
      <ChevronRight className="h-4 w-4" />
    </Link>
  );
}

function PlanCard({
  plan,
  state,
  yearly,
}: {
  plan: Plan;
  state: CtaState;
  yearly: boolean;
}) {
  const price = yearly ? plan.yearlyPrice : plan.monthlyPrice;
  const featured = Boolean(plan.featured);
  const yearlyTotal =
    plan.id === "creator"
      ? PRICING.creator.yearlyTotal
      : plan.id === "studio"
        ? PRICING.studio.yearlyTotal
        : 0;

  return (
    <article
      className={cn(
        "relative flex h-full flex-col overflow-hidden rounded-[28px] transition-transform duration-300",
        featured
          ? "bg-neutral-950 text-white shadow-[0_28px_60px_-28px_rgba(15,23,42,0.55)] sm:-translate-y-3"
          : "bg-white text-neutral-950 ring-1 ring-neutral-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(0,0,0,0.18)]"
      )}
    >
      {featured && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-teal-300/80 to-transparent"
        />
      )}

      <div className="flex items-start justify-between gap-4 px-6 pt-6 sm:px-7 sm:pt-7">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={cn(
              "relative h-12 w-12 shrink-0 overflow-hidden rounded-2xl",
              featured ? "ring-1 ring-white/15" : "ring-1 ring-neutral-200"
            )}
          >
            <Image
              src={plan.image}
              alt=""
              fill
              sizes="48px"
              className="object-cover"
              unoptimized
            />
          </div>
          <div className="min-w-0">
            <p
              className="text-[1.35rem] font-bold leading-none tracking-[-0.04em]"
              style={{ fontFamily: FONT_DISPLAY }}
            >
              {plan.name}
            </p>
            <p
              className={cn(
                "mt-1.5 text-[12px] font-medium tabular-nums",
                featured ? "text-teal-200/90" : "text-neutral-500"
              )}
            >
              {plan.credits}
            </p>
          </div>
        </div>
        {featured && (
          <span
            className="shrink-0 rounded-full bg-teal-300/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-200"
            style={{ fontFamily: FONT }}
          >
            Popular
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6 pt-7 sm:px-7 sm:pb-7">
        <p
          className={cn(
            "min-h-[48px] text-[14px] leading-6",
            featured ? "text-white/65" : "text-neutral-500"
          )}
          style={{ fontFamily: FONT }}
        >
          {plan.description}
        </p>

        <div className="mt-7 flex items-end gap-2">
          <span
            className="text-[3rem] font-bold leading-none tracking-[-0.06em]"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            {price}
          </span>
          <span
            className={cn(
              "pb-1.5 text-[13px] font-medium",
              featured ? "text-white/45" : "text-neutral-400"
            )}
          >
            / month
          </span>
        </div>
        {yearly && plan.id !== "free" ? (
          <p
            className={cn(
              "mt-2 min-h-4 text-[12px] font-medium tabular-nums",
              featured ? "text-white/40" : "text-neutral-400"
            )}
          >
            ${yearlyTotal} billed yearly
          </p>
        ) : (
          <div className="mt-2 min-h-4" aria-hidden />
        )}

        <ul
          className={cn(
            "mt-7 space-y-2.5 border-t pt-6",
            featured ? "border-white/10" : "border-neutral-100"
          )}
        >
          {plan.mobileFeatures.map((feature) => (
            <li
              key={feature}
              className={cn(
                "flex items-center gap-2.5 text-[13.5px] font-medium",
                featured ? "text-white/85" : "text-neutral-700"
              )}
              style={{ fontFamily: FONT }}
            >
              <span
                className={cn(
                  "inline-flex h-5 w-5 items-center justify-center rounded-full",
                  featured ? "bg-teal-300/15 text-teal-200" : "bg-neutral-950 text-white"
                )}
              >
                <Check className="h-3 w-3" strokeWidth={2.75} />
              </span>
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-8">
          <PlanAction plan={plan} state={state} yearly={yearly} />
        </div>
      </div>
    </article>
  );
}

function FeatureValueCell({ value }: { value: FeatureValue }) {
  if (value === true) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-950 text-white">
        <Check className="h-3 w-3" strokeWidth={2.75} />
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-neutral-300">
        <Minus className="h-3 w-3" />
      </span>
    );
  }

  return (
    <span
      className="text-[13px] font-medium leading-5 tracking-[-0.01em] text-neutral-700"
      style={{ fontFamily: FONT }}
    >
      {value}
    </span>
  );
}

export default function PricingSection({
  compact = false,
  pageHeading = false,
}: {
  compact?: boolean;
  pageHeading?: boolean;
}) {
  const { getToken, isSignedIn } = useAuth();
  const [userPlan, setUserPlan] = useState<UserPlan>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [yearly, setYearly] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setPlanLoading(false);
      return;
    }

    void (async () => {
      try {
        const token = await getToken();
        const response = await fetch(
          `${BACKEND_URL}/api/payments/subscription`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        if (response.ok) {
          const { subscription } = await response.json();
          setUserPlan((subscription?.plan as UserPlan) ?? null);
        }
      } catch {
        // Pricing remains usable when subscription status cannot be loaded.
      } finally {
        setPlanLoading(false);
      }
    })();
  }, [getToken, isSignedIn]);

  const plans = useMemo(
    () =>
      PLANS.map((plan) => ({
        plan,
        state: getCtaState(plan, userPlan, planLoading, Boolean(isSignedIn)),
      })),
    [isSignedIn, planLoading, userPlan]
  );

  return (
    <section
      id="pricing-section"
      className={cn(
        "relative overflow-hidden",
        compact
          ? "bg-transparent px-0 py-0"
          : "bg-[#f7f6f3] px-3 py-16 sm:px-4 sm:py-20 md:px-5 lg:px-6 lg:py-24 xl:px-8"
      )}
      style={{ fontFamily: FONT }}
    >
      {!compact && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(15,118,110,0.08), transparent 55%)",
          }}
        />
      )}

      <div
        className={cn(
          "relative w-full",
          compact ? "mx-auto max-w-6xl" : "mx-auto max-w-[1180px]"
        )}
      >
        <header
          className={cn(
            "flex flex-col gap-6",
            compact
              ? "sm:flex-row sm:items-end sm:justify-between"
              : "items-center text-center"
          )}
        >
          <div className={cn(compact ? "min-w-0 text-left" : "max-w-2xl")}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Pricing
            </p>
            <BlurReveal
              as={pageHeading ? "h1" : "h2"}
              className={cn(
                "mt-3 font-bold tracking-[-0.04em] leading-[1.05] text-neutral-950",
                compact
                  ? "text-[clamp(1.75rem,3vw,2.25rem)]"
                  : "text-[clamp(2rem,4.4vw,3.25rem)]"
              )}
              style={{ fontFamily: FONT_DISPLAY }}
            >
              {compact ? "Plans" : "Simple rates. Production output."}
            </BlurReveal>
            <p
              className={cn(
                "text-neutral-500",
                compact
                  ? "mt-2 max-w-md text-[15px] leading-6"
                  : "mx-auto mt-4 max-w-lg text-[15px] leading-7 sm:text-base"
              )}
            >
              {compact
                ? "Credits refresh monthly. Upgrade anytime."
                : "Same generation loop on every tier. Pay for credits, formats, and queue — not extra tools."}
            </p>

            {isSignedIn && userPlan && !planLoading && (
              <div
                className={cn(
                  "mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-neutral-700 ring-1 ring-neutral-200/80",
                  !compact && "mx-auto"
                )}
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-neutral-950" />
                Current plan:{" "}
                <span className="font-semibold capitalize text-neutral-950">
                  {userPlan}
                </span>
              </div>
            )}
          </div>

          <div
            className={cn(
              "relative inline-flex h-11 items-center rounded-full bg-white p-1 ring-1 ring-neutral-200/90",
              !compact && "mt-1"
            )}
            role="group"
            aria-label="Billing frequency"
          >
            <button
              type="button"
              aria-pressed={!yearly}
              onClick={() => setYearly(false)}
              className={cn(
                "relative z-10 h-9 min-w-[96px] rounded-full px-4 text-[13px] font-semibold tracking-[-0.01em] transition-colors",
                !yearly ? "text-white" : "text-neutral-500 hover:text-neutral-800"
              )}
            >
              {!yearly && (
                <motion.span
                  layoutId="pricing-billing-pill"
                  className="absolute inset-0 rounded-full bg-neutral-950"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative">Monthly</span>
            </button>
            <button
              type="button"
              aria-pressed={yearly}
              onClick={() => setYearly(true)}
              className={cn(
                "relative z-10 h-9 min-w-[118px] rounded-full px-4 text-[13px] font-semibold tracking-[-0.01em] transition-colors",
                yearly ? "text-white" : "text-neutral-500 hover:text-neutral-800"
              )}
            >
              {yearly && (
                <motion.span
                  layoutId="pricing-billing-pill"
                  className="absolute inset-0 rounded-full bg-neutral-950"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative">
                Yearly
                <span
                  className={cn(
                    "ml-1.5 text-[10px] font-bold",
                    yearly ? "text-teal-200" : "text-teal-700"
                  )}
                >
                  −{YEARLY_DISCOUNT_PERCENT}%
                </span>
              </span>
            </button>
          </div>
        </header>

        <div
          className={cn(
            "grid grid-cols-1 items-stretch gap-4 sm:grid-cols-3 sm:gap-4 lg:gap-5",
            compact ? "mt-8" : "mt-12 lg:mt-14"
          )}
        >
          {plans.map(({ plan, state }, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.45,
                delay: index * 0.06,
                ease: [0.22, 1, 0.36, 1] as const,
              }}
              className="h-full"
            >
              <PlanCard plan={plan} state={state} yearly={yearly} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] as const }}
          className={cn(
            "hidden overflow-hidden rounded-[24px] bg-white ring-1 ring-neutral-200/80 sm:block",
            compact ? "mt-8" : "mt-10 lg:mt-12"
          )}
        >
          <div className="grid grid-cols-[1.4fr_repeat(3,1fr)] border-b border-neutral-100 bg-[#f7f6f3]">
            <div className="px-6 py-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
              Compare
            </div>
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "px-5 py-4 text-[14px] font-bold tracking-[-0.02em] text-neutral-950",
                  plan.featured && "bg-neutral-950 text-white"
                )}
                style={{ fontFamily: FONT_DISPLAY }}
              >
                {plan.name}
                {plan.featured && (
                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-teal-200">
                    Popular
                  </span>
                )}
              </div>
            ))}
          </div>

          {FEATURES.map((feature, rowIndex) => (
            <div
              key={feature.name}
              className={cn(
                "grid grid-cols-[1.4fr_repeat(3,1fr)]",
                rowIndex !== FEATURES.length - 1 && "border-b border-neutral-100"
              )}
            >
              <div className="px-6 py-3.5 text-[13px] font-medium text-neutral-600">
                {feature.name}
              </div>
              {feature.values.map((value, columnIndex) => (
                <div
                  key={`${feature.name}-${columnIndex}`}
                  className={cn(
                    "flex items-center px-5 py-3.5",
                    columnIndex === 1 && "bg-neutral-950/[0.03]"
                  )}
                >
                  <FeatureValueCell value={value} />
                </div>
              ))}
            </div>
          ))}
        </motion.div>

        <div
          className={cn(
            "flex flex-col gap-5 overflow-hidden rounded-[24px] bg-white px-6 py-5 ring-1 ring-neutral-200/80 sm:flex-row sm:items-center sm:justify-between sm:px-7",
            compact ? "mt-8" : "mt-6"
          )}
        >
          <div className="flex min-w-0 items-center gap-4">
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-950 text-white">
              <Building2 className="h-5 w-5" strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <p
                className="text-[16px] font-bold tracking-[-0.03em] text-neutral-950"
                style={{ fontFamily: FONT_DISPLAY }}
              >
                Enterprise
              </p>
              <p className="mt-0.5 text-[13px] leading-5 text-neutral-500">
                Volume, security review, and a named contact for procurement.
              </p>
            </div>
          </div>
          <Link
            href="/contact"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-1 rounded-full bg-neutral-950 px-5 text-[14px] font-semibold tracking-[-0.01em] text-white transition-colors hover:bg-neutral-800"
          >
            Contact sales
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
