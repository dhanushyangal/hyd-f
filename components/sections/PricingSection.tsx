"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Check } from "lucide-react";

import { track } from "@/lib/analytics";
import { faqByQuestions } from "@/lib/faq";
import {
  checkoutHref,
  estimateMonthlyModels,
  isPaidPlan,
  normalizePlanId,
  planDisplayLabel,
  planFeatureLines,
  PRICING_CATALOG,
  PRICING_FAQ_QUESTIONS,
  PRICING_PAGE,
  SLOT_SAVE_PERCENT,
  type PlanId,
  type PricingCatalogRow,
} from "@/lib/pricing";

const BACKEND_URL = (
  process.env.NEXT_PUBLIC_BACKEND_URL || "https://hydrilla-backend.vercel.app"
).replace(/\/+$/, "");

type UserPlan = PlanId | null;

type CtaState = {
  label: string;
  disabled: boolean;
  current: boolean;
  href?: string;
};

function getCtaState(
  row: PricingCatalogRow,
  userPlan: UserPlan,
  catalogPlan: string | null,
  loading: boolean,
  signedIn: boolean
): CtaState {
  const holdsSlot = catalogPlan === "slot" || catalogPlan === "slot_pro";
  const current =
    signedIn &&
    !loading &&
    ((row.kind === "slot" && catalogPlan === row.id) ||
      (!holdsSlot &&
        ((userPlan === null && row.id === "free") || userPlan === row.id)));

  if (current) return { label: "Current plan", disabled: true, current: true };

  if (holdsSlot && row.kind !== "slot" && row.id !== "free") {
    return {
      label: "Manage in billing",
      disabled: false,
      current: false,
      href: "/app/settings?section=billing",
    };
  }

  if (signedIn && isPaidPlan(catalogPlan) && row.kind === "slot" && catalogPlan !== row.id) {
    return {
      label: "Manage in billing",
      disabled: false,
      current: false,
      href: "/app/settings?section=billing",
    };
  }

  if (!loading && userPlan === "starter" && row.id === "pro") {
    return { label: "Upgrade to Pro", disabled: false, current: false };
  }

  if (!loading && userPlan === "pro" && row.id === "starter") {
    return { label: "Included with Pro", disabled: true, current: false };
  }

  return { label: row.cta, disabled: false, current: false };
}

function planHref(row: PricingCatalogRow, state: CtaState): string {
  if (state.href) return state.href;
  if (row.id === "free") return "/app/studio";
  return checkoutHref(row.id);
}

function PlanCta({ row, state }: { row: PricingCatalogRow; state: CtaState }) {
  const className = "mob-pricing-cta";
  const tone = state.current ? "current" : state.disabled ? "muted" : undefined;

  if (state.disabled) {
    return (
      <button type="button" disabled className={className} data-tone={tone}>
        {state.current ? (
          <>
            <Check className="mr-2 h-4 w-4" strokeWidth={2} aria-hidden />
            {state.label}
          </>
        ) : (
          state.label
        )}
      </button>
    );
  }

  const href = planHref(row, state);

  return (
    <Link
      href={href}
      className={className}
      onClick={() =>
        track("plan_cta_clicked", {
          plan: row.id,
          cta_label: state.label,
          billing: "monthly",
        })
      }
    >
      {state.label}
    </Link>
  );
}

function PlanCard({
  row,
  state,
}: {
  row: PricingCatalogRow;
  state: CtaState;
}) {
  const popular = row.id === "pro" || row.id === "slot_pro";
  const features = planFeatureLines(row);

  return (
    <article className="mob-pricing-card">
      <h3 className="mob-pricing-card-name">
        {row.label}
        {popular ? <span className="mob-pricing-badge">Popular</span> : null}
      </h3>
      <p className="mob-pricing-audience">{row.audience}</p>
      <p className="mob-pricing-price">
        <span className="mob-pricing-price-value">${row.monthly}</span>
        <span className="mob-pricing-price-period">per month</span>
      </p>
      <PlanCta row={row} state={state} />
      <p className="mob-pricing-access">{row.access}</p>
      <ul className="mob-pricing-features">
        {features.map((line) => (
          <li key={line}>
            <Check size={16} strokeWidth={1.8} aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
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
  const [userPlan, setUserPlan] = useState<UserPlan>(null);
  const [catalogPlan, setCatalogPlan] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(true);
  const [slotMode, setSlotMode] = useState(false);
  const [toggleTouched, setToggleTouched] = useState(false);
  const faq = useMemo(() => faqByQuestions([...PRICING_FAQ_QUESTIONS]), []);
  const Heading = pageHeading ? "h1" : "h2";

  useEffect(() => {
    if (!isSignedIn) {
      setPlanLoading(false);
      return;
    }

    void (async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${BACKEND_URL}/api/payments/subscription`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (response.ok) {
          const { subscription } = await response.json();
          const raw = typeof subscription?.plan === "string" ? subscription.plan : null;
          setCatalogPlan(raw);
          setUserPlan(
            raw === "slot" || raw === "slot_pro" ? null : raw ? normalizePlanId(raw) : null
          );
        }
      } catch {
        // Pricing remains usable when subscription status cannot be loaded.
      } finally {
        setPlanLoading(false);
      }
    })();
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (toggleTouched) return;
    if (catalogPlan === "slot" || catalogPlan === "slot_pro") setSlotMode(true);
  }, [catalogPlan, toggleTouched]);

  const rows = useMemo(
    () =>
      PRICING_CATALOG.map((row) => ({
        row,
        state: getCtaState(row, userPlan, catalogPlan, planLoading, Boolean(isSignedIn)),
      })),
    [catalogPlan, isSignedIn, planLoading, userPlan]
  );

  const visible = rows.filter(({ row }) => (slotMode ? row.kind === "slot" : row.kind === "anytime"));

  const setMode = (next: boolean) => {
    setToggleTouched(true);
    setSlotMode(next);
  };

  return (
    <section
      className="mob-pricing"
      data-pad={pageHeading ? "page" : compact ? "compact" : "section"}
      aria-labelledby="pricing-heading"
    >
      <div className="mob-pricing-inner">
        <header className="mob-pricing-hero">
          <Heading id="pricing-heading" className="mob-pricing-title">
            {PRICING_PAGE.title}
          </Heading>
          {compact ? null : <p className="mob-pricing-subtitle">{PRICING_PAGE.subtitle}</p>}

          <div
            className="mob-pricing-switch"
            data-slot={slotMode ? "true" : "false"}
            role="radiogroup"
            aria-label="Plan type"
          >
            <span className="mob-pricing-switch-thumb" aria-hidden />
            <button
              type="button"
              role="radio"
              aria-checked={!slotMode}
              onClick={() => setMode(false)}
            >
              {PRICING_PAGE.toggleMonthly}
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={slotMode}
              onClick={() => setMode(true)}
            >
              {PRICING_PAGE.toggleSlot}
            </button>
          </div>
          <p className="mob-pricing-save">
            <strong>{SLOT_SAVE_PERCENT}% off</strong> on Slot
          </p>
        </header>

        <div className="mob-pricing-grid" data-count={visible.length}>
          {visible.map(({ row, state }) => (
            <PlanCard key={row.id} row={row} state={state} />
          ))}
        </div>

        {isSignedIn && !planLoading ? (
          <p className="mob-pricing-meta">
            Current plan: {planDisplayLabel(catalogPlan)} · Monthly · USD
          </p>
        ) : (
          <p className="mob-pricing-meta">Monthly · USD · Cancel anytime</p>
        )}

        {pageHeading ? (
          <>
            <div className="mob-pricing-compare">
              <table>
                <thead>
                  <tr>
                    <th>Plan</th>
                    <th>Price</th>
                    <th>Credits</th>
                    <th>From text</th>
                    <th>From an image</th>
                    <th>Access</th>
                  </tr>
                </thead>
                <tbody>
                  {PRICING_CATALOG.map((row) => (
                    <tr key={row.id}>
                      <th scope="row">{row.label}</th>
                      <td className="tabular-nums">${row.monthly}/mo</td>
                      <td className="tabular-nums">{row.credits.toLocaleString("en-US")}</td>
                      <td>{estimateMonthlyModels(row.credits, "text")}</td>
                      <td>{estimateMonthlyModels(row.credits, "image")}</td>
                      <td>{row.access}</td>
                    </tr>
                  ))}
                </tbody>
                <caption>{PRICING_PAGE.tableCaption}</caption>
              </table>
            </div>

            <div className="mob-pricing-faq">
              <h2>Frequently asked questions</h2>
              <dl>
                {faq.map((item) => (
                  <div key={item.question}>
                    <dt>{item.question}</dt>
                    <dd>{item.answer}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="mob-pricing-foot">
              <Link href="/enterprise">{PRICING_PAGE.enterpriseHint}</Link>
              {" for studios beyond the public Pro plan."}
            </p>
          </>
        ) : null}
      </div>
    </section>
  );
}
