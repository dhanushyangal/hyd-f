/**
 * Canonical Hydrilla plan pricing — keep UI and checkout in sync.
 * Paid plans are monthly only.
 */

export type PaidPlanId = "starter" | "pro";
export type SlotPlanId = "slot" | "slot_pro";
export type CheckoutPlanId = PaidPlanId | SlotPlanId;
export type PlanId = "free" | PaidPlanId;

export const GENERATION_CREDITS = {
  promptImage: 15,
  modelFromImage: 30,
  highQualityPromptImage: 30,
  highQualityModelFromImage: 40,
} as const;

export const PRICING = {
  free: {
    id: "free" as const,
    label: "Free",
    monthly: 0,
    credits: 100,
    creditsLabel: "100 credits / month",
    audience: "Explore the workflow",
    accessLabel: "Generate any time",
    exports: "GLB",
  },
  starter: {
    id: "starter" as const,
    label: "Starter",
    monthly: 5,
    credits: 900,
    creditsLabel: "900 credits / month",
    audience: "Individual creators",
    accessLabel: "Generate any time",
    exports: "GLB, FBX, OBJ, USDZ",
  },
  pro: {
    id: "pro" as const,
    label: "Pro",
    monthly: 12,
    credits: 3000,
    creditsLabel: "3,000 credits / month",
    audience: "Studios and small teams",
    accessLabel: "Generate any time",
    exports: "GLB, FBX, OBJ, USDZ",
  },
} as const;

/** Hourly plans grant the same monthly credits as Starter and Pro within a daily generation window. */
export const SLOT_PRICING = {
  slot: {
    id: "slot" as const,
    label: "Hourly",
    monthly: 3,
    hours: 1,
    credits: 900,
    detail: "Billed for 1 hr / day",
    audience: "Focused daily production",
    exports: "GLB, FBX, OBJ, USDZ",
    summary: "30 model generations each month (900 credits) · 1 hour daily window · 14-day free trial.",
  },
  slot_pro: {
    id: "slot_pro" as const,
    label: "Hourly Pro",
    monthly: 8,
    hours: 2,
    credits: 3000,
    detail: "Billed for 2 hrs / day",
    audience: "High-volume hourly production",
    exports: "GLB, FBX, OBJ, USDZ",
    summary: "100 model generations per month (3,000 credits) · Full plugin suite · 2 hours daily.",
  },
} as const;

export const CREDIT_MATH = {
  textDefault: GENERATION_CREDITS.promptImage + GENERATION_CREDITS.modelFromImage,
  imageDefault: GENERATION_CREDITS.modelFromImage,
  copy:
    "A default model costs 30 credits from an uploaded image. A text prompt also creates the source image, bringing the default total to 45 credits. These are whole-model estimates. Unused period credits do not roll into the next month — each billing period refreshes to the plan allotment (100 free / 900 Starter / 3,000 Pro). Bonus or promo credits carry across renewals until spent.",
} as const;

export type PricingCatalogId = PlanId | SlotPlanId;
export type PricingCatalogKind = "anytime" | "slot";

export type PricingCatalogRow = {
  id: PricingCatalogId;
  label: string;
  monthly: number;
  credits: number;
  access: string;
  exports: string;
  audience: string;
  kind: PricingCatalogKind;
  cta: string;
  trialDays?: number;
};

export const PRICING_CATALOG: PricingCatalogRow[] = [
  {
    id: PRICING.free.id,
    label: PRICING.free.label,
    monthly: PRICING.free.monthly,
    credits: PRICING.free.credits,
    access: PRICING.free.accessLabel,
    exports: PRICING.free.exports,
    audience: PRICING.free.audience,
    kind: "anytime",
    cta: "Start for free",
  },
  {
    id: PRICING.starter.id,
    label: PRICING.starter.label,
    monthly: PRICING.starter.monthly,
    credits: PRICING.starter.credits,
    access: PRICING.starter.accessLabel,
    exports: PRICING.starter.exports,
    audience: PRICING.starter.audience,
    kind: "anytime",
    cta: "Get started",
    trialDays: 14,
  },
  {
    id: PRICING.pro.id,
    label: PRICING.pro.label,
    monthly: PRICING.pro.monthly,
    credits: PRICING.pro.credits,
    access: PRICING.pro.accessLabel,
    exports: PRICING.pro.exports,
    audience: PRICING.pro.audience,
    kind: "anytime",
    cta: "Get started",
    trialDays: 14,
  },
  {
    id: SLOT_PRICING.slot.id,
    label: SLOT_PRICING.slot.label,
    monthly: SLOT_PRICING.slot.monthly,
    credits: SLOT_PRICING.slot.credits,
    access: SLOT_PRICING.slot.detail,
    exports: SLOT_PRICING.slot.exports,
    audience: SLOT_PRICING.slot.audience,
    kind: "slot",
    cta: "Get started",
    trialDays: 14,
  },
  {
    id: SLOT_PRICING.slot_pro.id,
    label: SLOT_PRICING.slot_pro.label,
    monthly: SLOT_PRICING.slot_pro.monthly,
    credits: SLOT_PRICING.slot_pro.credits,
    access: SLOT_PRICING.slot_pro.detail,
    exports: SLOT_PRICING.slot_pro.exports,
    audience: SLOT_PRICING.slot_pro.audience,
    kind: "slot",
    cta: "Get started",
    trialDays: 14,
  },
];

/** Hourly vs Starter: $3 vs $5 is 40% off. */
export const SLOT_SAVE_PERCENT = Math.round(
  (1 - SLOT_PRICING.slot.monthly / PRICING.starter.monthly) * 100
);

export const PRICING_PAGE = {
  title: "Pricing",
  subtitle:
    "Monthly credits for 3D generation. Save 40% when you generate in a daily selected hour.",
  toggleMonthly: "Monthly",
  toggleSlot: "Hourly",
  toggleSave: `${SLOT_SAVE_PERCENT}% off on Hourly`,
  tableCaption: "Default quality. Text is 45 credits per model. An uploaded image is 30.",
  enterpriseHint: "Volume, seats, and API",
} as const;

export const PRICING_FAQ_QUESTIONS = [
  "Is there a free plan available?",
  "How many 3D models can I generate each month?",
  "What are Hourly and Hourly Pro?",
  "Can I change or cancel my plan anytime?",
  "What formats does Hydrilla export?",
] as const;

export const PRICING_META_DESCRIPTION =
  "Hydrilla pricing: Free $0, Starter $5, Pro $12, Hourly $3, Hourly Pro $8. Includes a 14-day free trial, monthly model generations, and full plugin suite.";

export function estimateMonthlyModels(
  credits: number,
  source: "text" | "image",
  quality: "default" | "high" = "default"
): number {
  const imageCost =
    source === "text"
      ? quality === "high"
        ? GENERATION_CREDITS.highQualityPromptImage
        : GENERATION_CREDITS.promptImage
      : 0;
  const modelCost =
    quality === "high"
      ? GENERATION_CREDITS.highQualityModelFromImage
      : GENERATION_CREDITS.modelFromImage;

  return Math.floor(credits / (imageCost + modelCost));
}

export function formatUsd(amount: number): string {
  return `$${amount}`;
}

export function normalizePlanId(plan: string | null | undefined): PlanId {
  const raw = (plan ?? "").toLowerCase();
  if (raw === "starter" || raw === "creator") return "starter";
  if (raw === "pro" || raw === "studio") return "pro";
  return "free";
}

export function isPaidPlan(plan: string | null | undefined): boolean {
  const raw = (plan ?? "").toLowerCase();
  return (
    raw === "starter" ||
    raw === "pro" ||
    raw === "slot" ||
    raw === "slot_pro" ||
    raw === "slot-pro" ||
    raw === "hourly" ||
    raw === "hourly_pro" ||
    raw === "hourly-pro" ||
    raw === "creator" ||
    raw === "studio"
  );
}

export function parsePaidPlanParam(plan: string | null | undefined): PaidPlanId | null {
  const raw = (plan ?? "").toLowerCase();
  if (raw === "starter" || raw === "creator") return "starter";
  if (raw === "pro" || raw === "studio") return "pro";
  return null;
}

export function parseCheckoutPlanParam(plan: string | null | undefined): CheckoutPlanId | null {
  const raw = (plan ?? "").toLowerCase();
  if (raw === "slot" || raw === "hourly") return "slot";
  if (raw === "slot_pro" || raw === "slot-pro" || raw === "hourly_pro" || raw === "hourly-pro") return "slot_pro";
  return parsePaidPlanParam(raw);
}

export function planDisplayLabel(plan: string | null | undefined): string {
  if (plan === "slot" || plan === "hourly") return SLOT_PRICING.slot.label;
  if (plan === "slot_pro" || plan === "hourly_pro") return SLOT_PRICING.slot_pro.label;
  return PRICING[normalizePlanId(plan)].label;
}

export function planPriceLabel(planId: CheckoutPlanId): string {
  if (planId === "slot" || planId === "slot_pro") return `${formatUsd(SLOT_PRICING[planId].monthly)}/month`;
  return `${formatUsd(PRICING[planId].monthly)}/month`;
}

export function checkoutHref(planId: CheckoutPlanId): string {
  return `/checkout?plan=${planId}`;
}

export function planFeatureLines(row: PricingCatalogRow): string[] {
  const credits = `${row.credits.toLocaleString("en-US")} credits / month`;
  const generations = `≈ ${estimateMonthlyModels(row.credits, "image")} generations / month`;
  const access = row.kind === "slot" ? "Generate in select hour" : "Generate any time";

  return [
    credits,
    generations,
    "Commercial use",
    access,
  ];
}
