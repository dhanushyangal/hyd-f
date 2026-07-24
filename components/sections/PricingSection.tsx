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
    description: "Try Hydrilla and ship your first production-ready assets.",
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
    description: "Higher volume, more formats, and priority for independent work.",
    image: PRICING_IMAGES.creator,
    monthlyPrice: formatUsd(PRICING.creator.monthly),
    yearlyPrice: formatUsd(PRICING.creator.yearlyMonthlyEquivalent),
    credits: PRICING.creator.creditsLabel,
    cta: "Choose Creator",
    featured: true,
    mobileFeatures: [
      "All export formats",
      "10 queued tasks",
      "Email support within 24h",
    ],
  },
  {
    id: "studio",
    name: PRICING.studio.label,
    description: "Seats, API access, and capacity for teams shipping every week.",
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
  if (state.disabled) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          "inline-flex h-12 w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold tracking-[-0.01em] transition-colors",
          state.current
            ? "bg-neutral-950 text-white"
            : "cursor-not-allowed bg-[#f3f2ed] text-neutral-400"
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
        "inline-flex h-12 w-full items-center justify-center gap-1 rounded-full text-[15px] font-semibold tracking-[-0.01em] transition-colors",
        plan.featured
          ? "bg-neutral-950 text-white shadow-[0_1px_2px_rgba(0,0,0,0.08),0_12px_28px_-10px_rgba(0,0,0,0.35)] hover:bg-neutral-800"
          : "bg-[#f3f2ed] text-neutral-950 hover:bg-[#ebe8e0]"
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

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-[28px] sm:rounded-[32px] transition-all duration-300",
        plan.featured
          ? "bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04),0_24px_56px_-24px_rgba(0,0,0,0.32)] ring-1 ring-neutral-950/90 sm:-translate-y-2"
          : "bg-white ring-1 ring-neutral-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_16px_40px_-20px_rgba(0,0,0,0.16)] hover:ring-neutral-300"
      )}
    >
      {plan.featured && (
        <div className="absolute top-4 right-4 z-10">
          <span
            className="inline-flex items-center rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-950 shadow-sm backdrop-blur-md ring-1 ring-white/70"
            style={{ fontFamily: FONT }}
          >
            Most popular
          </span>
        </div>
      )}

      <div className="relative mx-2.5 mt-2.5 h-44 overflow-hidden rounded-[22px] sm:mx-3 sm:mt-3 sm:h-52 sm:rounded-[24px] lg:h-56">
        <Image
          src={plan.image}
          alt=""
          fill
          sizes="(max-width: 639px) calc(100vw - 32px), 420px"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          priority={plan.featured}
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
          <p
            className="text-[clamp(1.75rem,3vw,2.25rem)] font-bold leading-none tracking-[-0.04em] text-white"
            style={{
              fontFamily: FONT_DISPLAY,
              textShadow: "0 1px 1px rgba(0,0,0,0.45), 0 2px 14px rgba(0,0,0,0.35)",
            }}
          >
            {plan.name}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col px-5 pb-6 pt-6 sm:px-7 sm:pb-7 sm:pt-7">
        <p
          className="min-h-[52px] text-[15px] leading-6 text-neutral-500"
          style={{ fontFamily: FONT }}
        >
          {plan.description}
        </p>

        <div className="mt-6 flex flex-wrap items-end gap-x-2.5 gap-y-1">
          <span
            className="text-[clamp(2.75rem,5vw,3.5rem)] font-bold leading-none tracking-[-0.05em] text-neutral-950"
            style={{ fontFamily: FONT_DISPLAY }}
          >
            {price}
          </span>
          <span
            className="pb-2 text-[14px] font-medium text-neutral-500"
            style={{ fontFamily: FONT }}
          >
            / mo
          </span>
        </div>

        <p
          className="mt-3 text-[13px] font-semibold tabular-nums tracking-[-0.01em] text-neutral-600"
          style={{ fontFamily: FONT }}
        >
          {plan.credits}
          {yearly && plan.id !== "free" && (
            <span className="ml-1.5 font-medium text-neutral-400">
              · ${plan.id === "creator" ? PRICING.creator.yearlyTotal : PRICING.studio.yearlyTotal}/yr
            </span>
          )}
        </p>

        <ul className="mt-6 space-y-3 border-t border-neutral-100 pt-6 sm:hidden">
          {plan.mobileFeatures.map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-3 text-[14px] font-medium text-neutral-700"
              style={{ fontFamily: FONT }}
            >
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-neutral-950"
                strokeWidth={2.5}
              />
              {feature}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-7">
          <PlanAction plan={plan} state={state} yearly={yearly} />
        </div>
      </div>
    </article>
  );
}

function FeatureValueCell({ value }: { value: FeatureValue }) {
  if (value === true) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-neutral-950 text-white">
        <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#f3f2ed] text-neutral-300">
        <Minus className="h-3.5 w-3.5" />
      </span>
    );
  }

  return (
    <span
      className="text-[14px] font-medium leading-5 tracking-[-0.01em] text-neutral-700"
      style={{ fontFamily: FONT }}
    >
      {value}
    </span>
  );
}

export default function PricingSection({
  compact = false,
}: {
  compact?: boolean;
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
          : "bg-white px-3 py-16 sm:px-4 sm:py-20 md:px-5 lg:px-6 lg:py-24 xl:px-8"
      )}
      style={{ fontFamily: FONT }}
    >
      {!compact && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-b from-transparent to-white"
        />
      )}

      <div
        className={cn(
          "relative w-full",
          compact ? "mx-auto max-w-6xl" : "mx-auto max-w-[1400px]"
        )}
      >
        <header
          className={cn(
            "flex flex-col gap-6",
            compact
              ? "sm:flex-row sm:items-end sm:justify-between"
              : "mx-auto max-w-3xl items-center text-center"
          )}
        >
          <div className={cn(compact ? "min-w-0 text-left" : "")}>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              Pricing
            </p>
            <BlurReveal
              as="h2"
              className={cn(
                "mt-3 font-bold tracking-[-0.035em] leading-[1.08] text-[#111]",
                compact
                  ? "text-[clamp(1.75rem,3vw,2.25rem)]"
                  : "text-[clamp(1.75rem,4vw,2.75rem)]"
              )}
              style={{ fontFamily: FONT_DISPLAY }}
            >
              {compact ? "Plans" : "Pick a plan. Ship more 3D."}
            </BlurReveal>
            <p
              className={cn(
                "text-neutral-500",
                compact
                  ? "mt-2 max-w-md text-[15px] leading-6"
                  : "mx-auto mt-4 max-w-xl text-[15px] leading-7 sm:text-base"
              )}
            >
              {compact
                ? "Credits refresh monthly. Upgrade anytime."
                : "Same workflow on every tier. More credits, formats, and queue when you need them."}
            </p>

            {isSignedIn && userPlan && !planLoading && (
              <div
                className={cn(
                  "mt-5 inline-flex items-center gap-2 rounded-full bg-[#f3f2ed] px-4 py-2 text-[13px] font-medium text-neutral-700",
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
              "inline-flex h-12 items-center gap-1 rounded-full bg-[#f3f2ed] p-1.5",
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
                "h-9 min-w-[100px] rounded-full px-5 text-[14px] font-semibold tracking-[-0.01em] transition-colors",
                !yearly
                  ? "bg-neutral-950 text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800"
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              aria-pressed={yearly}
              onClick={() => setYearly(true)}
              className={cn(
                "h-9 min-w-[100px] rounded-full px-5 text-[14px] font-semibold tracking-[-0.01em] transition-colors",
                yearly
                  ? "bg-neutral-950 text-white shadow-sm"
                  : "text-neutral-500 hover:text-neutral-800"
              )}
            >
              Yearly
              <span
                className={cn(
                  "ml-1.5 text-[11px] font-bold",
                  yearly ? "text-white/75" : "text-neutral-400"
                )}
              >
                −{YEARLY_DISCOUNT_PERCENT}%
              </span>
            </button>
          </div>
        </header>

        <div
          className={cn(
            "grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-4 lg:gap-5",
            compact ? "mt-8" : "mt-12 lg:mt-14"
          )}
        >
          {plans.map(({ plan, state }, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.45,
                delay: index * 0.05,
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
            "hidden overflow-hidden rounded-[28px] bg-white ring-1 ring-neutral-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:block sm:rounded-[32px]",
            compact ? "mt-8" : "mt-10 lg:mt-12"
          )}
        >
          <div className="grid grid-cols-[1.5fr_repeat(3,1fr)] border-b border-neutral-100 bg-[#f9f8f6]">
            <div className="px-7 py-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
              Compare
            </div>
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={cn(
                  "px-5 py-5 text-[15px] font-bold tracking-[-0.02em] text-neutral-950",
                  plan.featured && "bg-white"
                )}
                style={{ fontFamily: FONT_DISPLAY }}
              >
                {plan.name}
                {plan.featured && (
                  <span className="ml-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400">
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
                "grid grid-cols-[1.5fr_repeat(3,1fr)]",
                rowIndex !== FEATURES.length - 1 && "border-b border-neutral-100"
              )}
            >
              <div className="px-7 py-4 text-[14px] font-medium text-neutral-700">
                {feature.name}
              </div>
              {feature.values.map((value, columnIndex) => (
                <div
                  key={`${feature.name}-${columnIndex}`}
                  className={cn(
                    "flex items-center px-5 py-4",
                    columnIndex === 1 && "bg-[#fafafa]"
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
            "overflow-hidden rounded-[28px] bg-neutral-950 text-white sm:rounded-[32px]",
            compact ? "mt-8" : "mt-8 lg:mt-10"
          )}
        >
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8 lg:p-9">
            <div className="flex min-w-0 items-start gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-white">
                <Building2 className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                  Enterprise
                </p>
                <h3
                  className="mt-1.5 text-[clamp(1.25rem,2.5vw,1.75rem)] font-bold tracking-[-0.03em] text-white"
                  style={{ fontFamily: FONT_DISPLAY }}
                >
                  Custom capacity & procurement
                </h3>
                <p className="mt-2 max-w-xl text-[14px] leading-6 text-neutral-400 sm:text-[15px]">
                  Volume licensing, security review, and dedicated support for
                  organizations.
                </p>
              </div>
            </div>
            <Link
              href="/contact"
              className="inline-flex h-12 shrink-0 items-center justify-center gap-1 rounded-full bg-white px-6 text-[15px] font-semibold tracking-[-0.01em] text-neutral-950 transition-colors hover:bg-neutral-100"
            >
              Contact sales
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
