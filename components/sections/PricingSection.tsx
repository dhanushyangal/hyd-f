"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  animate,
  motion,
  useInView,
  useReducedMotion,
} from "motion/react";
import { useAuth } from "@clerk/nextjs";
import {
  Box,
  BriefcaseBusiness,
  Check,
  Layers3,
  X,
  type LucideIcon,
} from "lucide-react";

import { BlurReveal } from "@/components/ui/BlurReveal";
import { track } from "@/lib/analytics";
import {
  checkoutHref,
  normalizePlanId,
  PRICING,
} from "@/lib/pricing";
import { DISPLAY_FONT as DISPLAY, SANS_FONT as SANS } from "@/lib/glyphic";
import { cn } from "@/lib/utils";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://hydrilla-backend.vercel.app"
).replace(/\/+$/, "");

/* Design tokens — shared with HowItWorks */
const INK = "#000c1f";
const INK_SECONDARY = "rgba(0, 12, 31, 0.65)";
const INK_TERTIARY = "rgba(0, 12, 31, 0.45)";
const CARD_SURFACE = "#f2f5f8";
const CARD_BORDER = "rgba(0, 12, 31, 0.07)";
const SKY = "#7dd3fc";
const EASE_OUT_QUINT: [number, number, number, number] = [0.22, 1, 0.36, 1];

type PlanId = "free" | "starter" | "pro";
type UserPlan = PlanId | null;

interface Plan {
  id: PlanId;
  name: string;
  tagline: string;
  price: number;
  credits: number;
  models: number;
  commercial: boolean;
  cta: string;
}

/** Credits and model counts mirror docs/pricing-and-models.md (uploaded-image path). */
const PLANS: Plan[] = [
  {
    id: "free",
    name: PRICING.free.label,
    tagline: "For trying Hydrilla",
    price: PRICING.free.monthly,
    credits: 100,
    models: 3,
    commercial: false,
    cta: "Get started",
  },
  {
    id: "starter",
    name: PRICING.starter.label,
    tagline: "For individuals & creators",
    price: PRICING.starter.monthly,
    credits: 900,
    models: 30,
    commercial: true,
    cta: "Choose Starter",
  },
  {
    id: "pro",
    name: PRICING.pro.label,
    tagline: "For studios & small teams",
    price: PRICING.pro.monthly,
    credits: 3000,
    models: 100,
    commercial: true,
    cta: "Choose Pro",
  },
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
  if (!loading && userPlan === "starter" && plan.id === "pro") {
    return { label: "Upgrade to Pro", disabled: false, current: false };
  }
  if (!loading && userPlan === "pro" && plan.id !== "pro") {
    return {
      label: plan.id === "starter" ? "Included with Pro" : plan.cta,
      disabled: true,
      current: false,
    };
  }
  return { label: plan.cta, disabled: false, current: false };
}

/** Counts up from 0 once the number scrolls into view. */
function CountUp({
  value,
  delay = 0,
  prefix = "",
}: {
  value: number;
  delay?: number;
  prefix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduceMotion = useReducedMotion();
  const inView = useInView(ref, { once: true, margin: "0px 0px -12% 0px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduceMotion) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.4,
      delay,
      ease: EASE_OUT_QUINT,
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });
    return () => controls.stop();
  }, [inView, reduceMotion, value, delay]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {display.toLocaleString("en-US")}
    </span>
  );
}

const ROLL_EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";

function RollLabel({
  label,
}: {
  label: string;
}) {
  const line = (
    <span className="flex h-[1.5em] items-center justify-center whitespace-nowrap">
      {label}
    </span>
  );

  return (
    <span className="relative block h-[1.5em] overflow-hidden leading-[1.5em]">
      <span
        className={cn(
          "flex flex-col transition-transform duration-300 motion-reduce:transition-none",
          ROLL_EASE,
          "group-hover:-translate-y-1/2 group-focus-visible:-translate-y-1/2"
        )}
      >
        {line}
        <span aria-hidden>{line}</span>
      </span>
    </span>
  );
}

function PlanAction({ plan, state }: { plan: Plan; state: CtaState }) {
  const base =
    "group inline-flex h-14 w-full items-center justify-center rounded-full text-[15px] font-semibold tracking-[-0.01em] outline-none transition-opacity duration-150 active:opacity-85 motion-reduce:transition-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2";

  if (state.disabled) {
    return (
      <button
        type="button"
        disabled
        className={cn(
          base,
          "cursor-default focus-visible:ring-0",
          state.current ? "text-white" : "text-[rgba(0,12,31,0.4)]"
        )}
        style={{
          fontFamily: SANS,
          backgroundColor: state.current ? INK : "rgba(0, 12, 31, 0.06)",
        }}
      >
        {state.current && (
          <Check className="mr-2 h-4 w-4" strokeWidth={2} aria-hidden />
        )}
        {state.label}
      </button>
    );
  }

  const href = plan.id === "free" ? "/generate" : checkoutHref(plan.id);

  return (
    <Link
      href={href}
      onClick={() =>
        track("plan_cta_clicked", {
          plan: plan.id,
          cta_label: state.label,
          billing: "monthly",
        })
      }
      className={base}
      style={{
        fontFamily: SANS,
        color: INK,
        backgroundColor: SKY,
      }}
    >
      <RollLabel label={state.label} />
    </Link>
  );
}

function FeatureRow({
  children,
  glyph: Glyph,
  included,
  muted = false,
}: {
  children: React.ReactNode;
  glyph: LucideIcon;
  included?: boolean;
  muted?: boolean;
}) {
  return (
    <li
      className="grid min-h-10 grid-cols-[2rem_minmax(0,1fr)_1.25rem] items-center gap-3 text-[15px] leading-5 tracking-[-0.01em]"
      style={{ color: muted ? INK_TERTIARY : INK, fontFamily: SANS }}
    >
      <span
        aria-hidden
        className="inline-flex h-8 w-8 items-center justify-center rounded-[10px] border bg-white"
        style={{
          borderColor: CARD_BORDER,
          color: muted ? INK_TERTIARY : INK_SECONDARY,
        }}
      >
        <Glyph className="h-4 w-4" strokeWidth={1.65} />
      </span>
      <span className={cn("min-w-0", muted && "line-through")}>
        {children}
      </span>
      {included === true && (
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-700"
        >
          <Check aria-hidden className="h-3 w-3" strokeWidth={2.25} />
          <span className="sr-only">Included</span>
        </span>
      )}
      {included === false && (
        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-slate-200/80 text-slate-500"
        >
          <X aria-hidden className="h-3 w-3" strokeWidth={2} />
          <span className="sr-only">Not included</span>
        </span>
      )}
      {included === undefined && (
        <span aria-hidden className="h-5 w-5" />
      )}
    </li>
  );
}

function PlanCard({
  plan,
  state,
  index,
}: {
  plan: Plan;
  state: CtaState;
  index: number;
}) {
  const delay = index * 0.08;

  return (
    <article
      className="flex h-full min-h-[390px] flex-col overflow-hidden rounded-[30px] border p-1.5"
      style={{ backgroundColor: CARD_SURFACE, borderColor: CARD_BORDER }}
    >
      <div
        className="flex min-h-[218px] flex-col rounded-[24px] border bg-white p-6 sm:p-7 lg:p-6 xl:p-7"
        style={{ borderColor: CARD_BORDER }}
      >
        <div className="grid min-h-[76px] grid-cols-[minmax(0,1fr)_auto] items-start gap-4">
          <div className="min-w-0 pt-0.5">
            <h3
              className="m-0 text-[1.375rem] font-semibold leading-tight"
              style={{ fontFamily: SANS, color: INK, letterSpacing: "-0.03em" }}
            >
              {plan.name}
            </h3>
            <p
              className="m-0 mt-1.5 max-w-[10rem] text-[14px] leading-5"
              style={{
                fontFamily: SANS,
                color: INK_SECONDARY,
                letterSpacing: "-0.01em",
                textWrap: "balance",
              }}
            >
              {plan.tagline}
            </p>
          </div>

          <p
            className="m-0 flex shrink-0 items-baseline gap-1"
            style={{ fontFamily: SANS, color: INK }}
          >
            <span
              className="text-[clamp(2.625rem,2.25rem+1vw,3.25rem)] font-semibold leading-none"
              style={{ letterSpacing: "-0.05em" }}
            >
              <CountUp value={plan.price} prefix="$" delay={delay} />
            </span>
            <span
              className="text-[13px] font-medium"
              style={{ color: INK_TERTIARY }}
            >
              /month
            </span>
          </p>
        </div>

        <div className="mt-auto pt-6">
          <PlanAction plan={plan} state={state} />
        </div>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-6 pt-5 sm:px-7 sm:pb-7 lg:px-6 lg:pb-6 xl:px-7 xl:pb-7">
        <p
          className="m-0 text-[12px] font-medium uppercase tracking-[0.08em]"
          style={{ fontFamily: SANS, color: INK_TERTIARY }}
        >
          Included features
        </p>
        <ul className="m-0 mt-3 flex list-none flex-col gap-1 p-0">
          <FeatureRow glyph={Layers3}>
            <span>
              <CountUp value={plan.credits} delay={delay + 0.1} /> credits per
              month
            </span>
          </FeatureRow>
          <FeatureRow glyph={Box}>
            <span>
              ≈ <CountUp value={plan.models} delay={delay + 0.2} /> models /
              month
            </span>
          </FeatureRow>
          <FeatureRow
            glyph={BriefcaseBusiness}
            included={plan.commercial}
            muted={!plan.commercial}
          >
            Commercial use
          </FeatureRow>
        </ul>
      </div>
    </article>
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
  const reduceMotion = useReducedMotion();
  const [userPlan, setUserPlan] = useState<UserPlan>(null);
  const [planLoading, setPlanLoading] = useState(true);

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
          setUserPlan(normalizePlanId(subscription?.plan ?? null));
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
      aria-labelledby="pricing-heading"
      className="w-full bg-white"
      style={{
        padding: compact
          ? "clamp(1rem, 0.5rem + 2vw, 2rem) 0"
          : "clamp(4.5rem, 3rem + 6vw, 9rem) 0",
        fontFamily: SANS,
        WebkitFontSmoothing: "antialiased",
      }}
    >
      <div
        className="mx-auto flex flex-col items-center"
        style={{
          width: "min(100% - 2rem, 72rem)",
          gap: compact
            ? "clamp(2rem, 1.5rem + 2vw, 3rem)"
            : "clamp(2.5rem, 2rem + 3vw, 4.5rem)",
        }}
      >
        <header className="flex flex-col items-center gap-3 px-2 text-center">
          <p
            className="m-0 text-xs font-medium uppercase"
            style={{
              color: INK_TERTIARY,
              letterSpacing: "0.1em",
              fontFamily: SANS,
            }}
          >
            Pricing
          </p>
          <BlurReveal
            as={pageHeading ? "h1" : "h2"}
            id="pricing-heading"
            style={{
              margin: 0,
              fontFamily: DISPLAY,
              fontSize: compact
                ? "clamp(1.75rem, 1.4rem + 1.4vw, 2.5rem)"
                : "clamp(2.25rem, 1.7rem + 2.4vw, 3.75rem)",
              fontWeight: 400,
              color: INK,
              letterSpacing: "-0.035em",
              lineHeight: 1.05,
            }}
          >
            {compact ? "Plans" : "Simple pricing."}
          </BlurReveal>

          {isSignedIn && userPlan && !planLoading && (
            <p
              className="m-0 mt-1 text-[14px]"
              style={{ color: INK_SECONDARY, fontFamily: SANS }}
            >
              Current plan:{" "}
              <span className="font-medium capitalize" style={{ color: INK }}>
                {userPlan}
              </span>
            </p>
          )}
        </header>

        <div className="mx-auto grid w-full max-w-[34rem] grid-cols-1 items-stretch gap-4 lg:max-w-none lg:grid-cols-3 lg:gap-4">
          {plans.map(({ plan, state }, index) => (
            <motion.div
              key={plan.id}
              initial={reduceMotion ? false : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.7,
                delay: index * 0.08,
                ease: EASE_OUT_QUINT,
              }}
              className="h-full"
            >
              <PlanCard plan={plan} state={state} index={index} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
