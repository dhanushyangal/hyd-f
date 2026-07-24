/**
 * Canonical Hydrilla plan pricing — keep UI and checkout in sync.
 * Yearly is billed annually at ~20% off, shown as a monthly equivalent.
 */

export type PaidPlanId = "creator" | "studio";
export type BillingInterval = "monthly" | "yearly";

export const PRICING = {
  free: {
    id: "free" as const,
    label: "Free",
    monthly: 0,
    yearlyMonthlyEquivalent: 0,
    creditsLabel: "200 credits / month",
  },
  creator: {
    id: "creator" as const,
    label: "Creator",
    /** USD per month when billed monthly */
    monthly: 9,
    /** USD per month equivalent when billed yearly (−20%) */
    yearlyMonthlyEquivalent: 7,
    /** Total charged yearly */
    yearlyTotal: 84,
    creditsLabel: "1,000 credits / month",
  },
  studio: {
    id: "studio" as const,
    label: "Studio",
    monthly: 25,
    yearlyMonthlyEquivalent: 20,
    yearlyTotal: 240,
    creditsLabel: "4,000 credits / month",
  },
} as const;

export const YEARLY_DISCOUNT_PERCENT = 20;

export function formatUsd(amount: number): string {
  return `$${amount}`;
}

export function planPriceLabel(
  planId: PaidPlanId,
  billing: BillingInterval
): string {
  const plan = PRICING[planId];
  if (billing === "yearly") {
    return `${formatUsd(plan.yearlyMonthlyEquivalent)}/mo · billed yearly`;
  }
  return `${formatUsd(plan.monthly)}/month`;
}

export function checkoutHref(
  planId: PaidPlanId,
  billing: BillingInterval = "monthly"
): string {
  const params = new URLSearchParams({ plan: planId });
  if (billing === "yearly") params.set("billing", "yearly");
  return `/checkout?${params.toString()}`;
}
