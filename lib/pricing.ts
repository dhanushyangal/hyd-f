/**
 * Canonical Hydrilla plan pricing — keep UI and checkout in sync.
 * Paid plans are monthly only.
 */

export type PaidPlanId = "starter" | "pro";
export type PlanId = "free" | PaidPlanId;

export const PRICING = {
  free: {
    id: "free" as const,
    label: "Free",
    monthly: 0,
    creditsLabel: "100 credits / month",
  },
  starter: {
    id: "starter" as const,
    label: "Starter",
    monthly: 5,
    creditsLabel: "900 credits / month",
  },
  pro: {
    id: "pro" as const,
    label: "Pro",
    monthly: 12,
    creditsLabel: "3,000 credits / month",
  },
} as const;

export function formatUsd(amount: number): string {
  return `$${amount}`;
}

export function normalizePlanId(plan: string | null | undefined): PlanId {
  const raw = (plan ?? "").toLowerCase();
  if (raw === "starter") return "starter";
  if (raw === "pro") return "pro";
  return "free";
}

export function parsePaidPlanParam(plan: string | null | undefined): PaidPlanId | null {
  const raw = (plan ?? "").toLowerCase();
  if (raw === "starter" || raw === "creator") return "starter";
  if (raw === "pro" || raw === "studio") return "pro";
  return null;
}

export function planDisplayLabel(plan: string | null | undefined): string {
  return PRICING[normalizePlanId(plan)].label;
}

export function planPriceLabel(planId: PaidPlanId): string {
  return `${formatUsd(PRICING[planId].monthly)}/month`;
}

export function checkoutHref(planId: PaidPlanId): string {
  return `/checkout?plan=${planId}`;
}
