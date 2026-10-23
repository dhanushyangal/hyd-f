"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Eye,
  EyeOff,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  Search,
  RefreshCw,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  filterModelsByQuery,
  isPinnedModel,
  resolveEnabledModelIds,
  setModelEnabled,
} from "@/lib/waterModels";
import {
  deleteUserApiKey,
  fetchUserApiKeys,
  fetchWaterModels,
  getCredits,
  getCreditRewardsHistory,
  providerKeyAvailable,
  saveUserApiKey,
  saveUserModelPrefs,
  verifyUserApiKey,
  type ConnectorPublic,
  type CreditRewardRow,
  type CreditsInfo,
  type UserApiKeyMeta,
  type UserModelPrefs,
  type WaterModelGroup,
} from "@/lib/api";
import { FALLBACK_CONNECTORS } from "@/lib/connectors";
import { migrateCodeModelId, type ApiKeyProvider, type ModelId } from "@/lib/models";
import { checkoutHref, planDisplayLabel, PRICING, SLOT_PRICING, type CheckoutPlanId } from "@/lib/pricing";
import { SlotHours } from "@/components/app/SlotHours";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SettingsPage() {
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const searchParams = useSearchParams();
  const [keys, setKeys] = useState<UserApiKeyMeta[]>([]);
  const [sharedKeys, setSharedKeys] = useState<UserApiKeyMeta[]>([]);
  const [connectors, setConnectors] = useState<ConnectorPublic[]>([]);
  const [prefs, setPrefs] = useState<UserModelPrefs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [section, setSection] = useState<"models" | "billing">(() =>
    searchParams.get("tab") === "billing" ? "billing" : "models",
  );

  useEffect(() => {
    if (searchParams.get("tab") === "billing") {
      setSection("billing");
    }
  }, [searchParams]);

  useEffect(() => {
    const asked = new URLSearchParams(window.location.search).get("section");
    if (asked === "billing") setSection("billing");
  }, []);

  const load = async () => {
    if (!isSignedIn) return;
    setLoading(true);
    setError(null);
    try {
      const tokenGetter = async () => (await getToken()) ?? null;
      const data = await fetchUserApiKeys(tokenGetter);
      setKeys(data.keys);
      setSharedKeys(data.sharedKeys ?? []);
      setConnectors(data.connectors?.length ? data.connectors : FALLBACK_CONNECTORS);
      setPrefs(data.prefs);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    void load();
  }, [isLoaded, isSignedIn]);

  return (
    <div className="app-content-page font-dm-sans bg-[var(--app-canvas)]">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <header>
          <p className="text-[11px] sm:text-xs font-medium text-neutral-400 tracking-[0.14em] uppercase">
            Account
          </p>
          <h1 className="mt-1.5 text-[28px] sm:text-[32px] font-semibold text-neutral-900 tracking-[-0.03em]">
            Settings
          </h1>
          <p className="mt-2 text-sm text-neutral-500">
            {section === "billing" ? "Plan and payments for this account." : "Keys and models for Water."}
          </p>
        </header>

        <div className="inline-flex rounded-full border border-neutral-200 bg-white p-1">
          {([
            ["models", "Models"],
            ["billing", "Billing"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              className={cn(
                "h-9 rounded-full px-4 text-sm font-medium transition-colors",
                section === id ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {section === "billing" ? (
          <BillingSection />
        ) : (
          <>
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-12 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="space-y-3">
              <div className="flex items-end justify-between gap-3 px-0.5">
                <h2 className="text-sm font-semibold text-neutral-900">API keys</h2>
                <Link
                  href="/app/studio"
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
                >
                  Back to Studio
                </Link>
              </div>
              {(connectors.length ? connectors : FALLBACK_CONNECTORS).map((p) => (
                <ApiKeyCard
                  key={p.id}
                  connector={p}
                  meta={keys.find((k) => (k.provider === "gemini" ? "google" : k.provider) === p.id)}
                  shared={sharedKeys.find((k) => (k.provider === "gemini" ? "google" : k.provider) === p.id)}
                  onChanged={load}
                />
              ))}
            </section>

            <WaterModelSlots
              keys={keys}
              sharedKeys={sharedKeys}
              connectors={connectors.length ? connectors : FALLBACK_CONNECTORS}
              defaultCodeModel={(migrateCodeModelId(prefs?.defaultCodeModel) as ModelId) || null}
              serverEnabled={prefs?.enabledCodeModels}
              onDefaultSaved={async (id) => {
                const tokenGetter = async () => (await getToken()) ?? null;
                const next = await saveUserModelPrefs(
                  { defaultCodeModel: migrateCodeModelId(id) || id },
                  tokenGetter
                );
                setPrefs(next);
              }}
              onEnabledSaved={async (ids) => {
                const tokenGetter = async () => (await getToken()) ?? null;
                try {
                  const next = await saveUserModelPrefs({ enabledCodeModels: ids }, tokenGetter);
                  setPrefs(next);
                } catch {
                  // localStorage already updated; SQL 008 may not be applied yet
                }
              }}
            />

            <LimitsCard />
          </>
        )}
        </>
        )}
      </div>
    </div>
  );
}

const BACKEND_URL = (process.env.NEXT_PUBLIC_BACKEND_URL || "https://hydrilla-backend.vercel.app").replace(/\/+$/, "");

type BillingPayment = {
  id: string;
  createdAt: string;
  amount: number;
  currency: string;
  status: string;
  plan: string | null;
  paymentId: string;
};

function receiptPlan(plan: string | null): string {
  if (plan === "starter") return "Starter";
  if (plan === "pro") return "Pro";
  if (plan === "slot" || plan === "hourly") return "Hourly";
  if (plan === "slot_pro" || plan === "hourly_pro") return "Hourly Pro";
  if (plan === "creator") return "Starter";
  if (plan === "studio") return "Pro";
  return "Subscription";
}

function receiptStatus(status: string): string {
  if (status === "succeeded") return "Paid";
  if (status === "failed") return "Failed";
  if (status === "refunded") return "Refunded";
  return status;
}

function formatCharge(amount: number, currency: string): string {
  const code = (currency || "USD").toUpperCase();
  const major = amount / 100;
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: code }).format(major);
  } catch {
    return `${major.toFixed(2)} ${code}`;
  }
}

function rewardSourceLabel(source: string): string {
  if (source === "claim_link") {
    return "Reward link";
  }
  if (source === "admin_grant") {
    return "Bonus";
  }
  return "System";
}

type CompactPlanOption = {
  id: CheckoutPlanId;
  name: string;
  priceLabel: string;
  description: string;
  cta: string;
  href: string;
};

function resolveCanonicalPlan(plan: string | null): "free" | CheckoutPlanId {
  const raw = (plan ?? "").toLowerCase();
  if (raw === "starter" || raw === "creator") {
    return "starter";
  }
  if (raw === "pro" || raw === "studio") {
    return "pro";
  }
  if (raw === "slot") {
    return "slot";
  }
  if (raw === "slot_pro" || raw === "slot-pro") {
    return "slot_pro";
  }
  return "free";
}

function getCurrentPlanDetails(canonical: "free" | CheckoutPlanId): {
  name: string;
  priceLabel: string;
  description: string;
  quotaTitle: string;
} {
  switch (canonical) {
    case "starter":
      return {
        name: PRICING.starter.label,
        priceLabel: `$${PRICING.starter.monthly} /mo.`,
        description:
          "30 model generations each month (900 credits), premium plugins included, and 24/7 generation.",
        quotaTitle: "30 Model Generations · 900 Credits",
      };
    case "pro":
      return {
        name: PRICING.pro.label,
        priceLabel: `$${PRICING.pro.monthly} /mo.`,
        description:
          "100 model generations per month (3,000 credits), full plugin suite, and priority studio access.",
        quotaTitle: "100 Model Generations · 3,000 Credits",
      };
    case "slot":
      return {
        name: SLOT_PRICING.slot.label,
        priceLabel: `$${SLOT_PRICING.slot.monthly} /mo.`,
        description:
          "30 model generations each month (900 credits) and premium plugins with a 1-hour daily generation window.",
        quotaTitle: "30 Models · 1h Daily Window",
      };
    case "slot_pro":
      return {
        name: SLOT_PRICING.slot_pro.label,
        priceLabel: `$${SLOT_PRICING.slot_pro.monthly} /mo.`,
        description:
          "100 model generations per month (3,000 credits) and full plugin suite with a 2-hour daily generation window.",
        quotaTitle: "100 Models · 2h Daily Window",
      };
    default:
      return {
        name: PRICING.free.label,
        priceLabel: `$${PRICING.free.monthly} /mo.`,
        description:
          "Free access with 100 monthly credits (3 model generations) for exploring image and 3D generation.",
        quotaTitle: "100 Monthly Credits Included",
      };
  }
}

function getUpgradeOptions(canonical: "free" | CheckoutPlanId): CompactPlanOption[] {
  const proCard: CompactPlanOption = {
    id: "pro",
    name: PRICING.pro.label,
    priceLabel: `$${PRICING.pro.monthly} /mo.`,
    description:
      "100 model generations per month (3,000 credits), full plugin suite, and 14-day free trial.",
    cta: "Upgrade to Pro",
    href: checkoutHref("pro"),
  };
  const starterCard: CompactPlanOption = {
    id: "starter",
    name: PRICING.starter.label,
    priceLabel: `$${PRICING.starter.monthly} /mo.`,
    description:
      "30 model generations each month (900 credits), premium plugins included, and 14-day free trial.",
    cta: canonical === "pro" || canonical === "slot_pro" ? "Switch to Starter" : "Upgrade to Starter",
    href: checkoutHref("starter"),
  };
  const slotProCard: CompactPlanOption = {
    id: "slot_pro",
    name: SLOT_PRICING.slot_pro.label,
    priceLabel: `$${SLOT_PRICING.slot_pro.monthly} /mo.`,
    description:
      "100 model generations per month, full plugin suite, and a 2-hour daily generation window.",
    cta: canonical === "pro" ? "Switch to Hourly Pro" : "Upgrade to Hourly Pro",
    href: checkoutHref("slot_pro"),
  };

  if (canonical === "starter") {
    return [proCard, slotProCard];
  }
  if (canonical === "slot") {
    return [starterCard, slotProCard];
  }
  if (canonical === "slot_pro") {
    return [proCard, starterCard];
  }
  if (canonical === "pro") {
    return [starterCard, slotProCard];
  }
  return [starterCard, proCard];
}

function BillingSection() {
  const { getToken, isSignedIn } = useAuth();
  const [plan, setPlan] = useState<string | null>(null);
  const [renewsAt, setRenewsAt] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [accessUntil, setAccessUntil] = useState<string | null>(null);
  const [isTrial, setIsTrial] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [pastPlan, setPastPlan] = useState<string | null>(null);
  const [payments, setPayments] = useState<BillingPayment[]>([]);
  const [credits, setCredits] = useState<CreditsInfo | null>(null);
  const [rewards, setRewards] = useState<CreditRewardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const tokenGetter = async () => (await getToken()) ?? null;
      const token = await tokenGetter();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const [billingRes, creditsInfo, rewardsHistory] = await Promise.all([
        fetch(`${BACKEND_URL}/api/payments/billing`, { headers }),
        getCredits(tokenGetter),
        getCreditRewardsHistory(tokenGetter),
      ]);
      const body = await billingRes.json().catch(() => ({}));
      if (!billingRes.ok) {
        throw new Error(body.error || "Failed to load billing");
      }
      setPlan(body.plan ?? null);
      setRenewsAt(body.renewsAt ?? null);
      setCancelAtPeriodEnd(Boolean(body.cancelAtPeriodEnd));
      setAccessUntil(body.accessUntil ?? null);
      setIsTrial(Boolean(body.isTrial));
      setTrialEndsAt(body.trialEndsAt ?? null);
      setPastPlan(body.pastPlan ?? null);
      setPayments(Array.isArray(body.payments) ? body.payments : []);
      setCredits(creditsInfo);
      setRewards(rewardsHistory);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load billing");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [isSignedIn]);

  const renewLabel = renewsAt
    ? new Date(renewsAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : null;
  const accessLabel = accessUntil
    ? new Date(accessUntil).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
    : renewLabel;

  const cancelRenewal = async () => {
    if (!plan || cancelAtPeriodEnd || cancelling) {
      return;
    }
    const until = accessLabel ? ` You keep ${planDisplayLabel(plan)} until ${accessLabel}.` : "";
    const confirmMsg = isTrial
      ? `Cancel your 14-day free trial? You keep full access until ${accessLabel || "the trial ends"}, and you will not be charged.`
      : `Cancel renewal?${until} It will not charge again after that.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }
    setCancelling(true);
    setError(null);
    try {
      const token = await getToken();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(`${BACKEND_URL}/api/payments/cancel`, {
        method: "POST",
        headers,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.error || "Failed to cancel renewal");
      }
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to cancel renewal");
    } finally {
      setCancelling(false);
    }
  };

  const canonicalPlan = resolveCanonicalPlan(plan);
  const currentPlanMeta = getCurrentPlanDetails(canonicalPlan);
  const upgradeOptions = getUpgradeOptions(canonicalPlan);

  return (
    <div className="space-y-4">
      <SlotHours getToken={getToken} active={plan === "slot" || plan === "slot_pro"} />

      <Card>
        <CardHeader className="px-5 pt-5 pb-0">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">Payment history</p>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-3">
          {error && (
            <p className="mb-3 text-sm text-red-700">{error}</p>
          )}
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading payments…
            </div>
          ) : payments.length === 0 ? (
            <p className="py-6 text-sm text-neutral-500">No payments on this account yet.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-[11px] uppercase tracking-wider text-neutral-400">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Date</th>
                    <th className="px-3 py-2 font-semibold">Plan</th>
                    <th className="px-3 py-2 font-semibold">Amount</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {payments.map((payment) => (
                    <tr key={payment.id}>
                      <td className="px-3 py-2.5">
                        {new Date(payment.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-neutral-900">{receiptPlan(payment.plan)}</td>
                      <td className="px-3 py-2.5 tabular-nums">{formatCharge(payment.amount, payment.currency)}</td>
                      <td className="px-3 py-2.5">
                        <span className={cn(payment.status === "failed" ? "text-red-700" : "text-neutral-700")}>
                          {receiptStatus(payment.status)}
                        </span>
                        <p className="mt-0.5 text-[11px] text-neutral-400">{payment.paymentId}</p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="px-5 pt-5 pb-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">Rewards & grants</h2>
        </CardHeader>
        <CardContent className="px-5 pb-5 pt-3">
          {loading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading rewards…
            </div>
          ) : rewards.length === 0 ? (
            <p className="py-6 text-sm text-neutral-500">No claimed rewards yet.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-neutral-200">
              <table className="w-full text-left text-sm">
                <thead className="bg-neutral-50 text-[11px] uppercase tracking-wider text-neutral-400">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Date</th>
                    <th className="px-3 py-2 font-semibold">Type</th>
                    <th className="px-3 py-2 font-semibold">Reason</th>
                    <th className="px-3 py-2 font-semibold">Credits</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-neutral-700">
                  {rewards.map((reward) => (
                    <tr key={reward.id}>
                      <td className="px-3 py-2.5">
                        {new Date(reward.createdAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-3 py-2.5 font-medium text-neutral-900">
                        {rewardSourceLabel(reward.source)}
                      </td>
                      <td className="px-3 py-2.5 text-neutral-600">
                        {reward.reason || "—"}
                      </td>
                      <td className="px-3 py-2.5 tabular-nums font-medium text-emerald-700">
                        +{reward.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Compact plan & upgrade cards at the end of billing */}
      {!loading && (
        <section className="space-y-3 pt-1" aria-label="Plan options">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {upgradeOptions.map((option) => (
              <div
                key={option.id}
                className="flex flex-col justify-between rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
              >
                <div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-neutral-900">
                      {option.name}
                    </h3>
                    <span className="text-[13px] font-medium text-neutral-400 tabular-nums">
                      {option.priceLabel}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">
                    {option.description}
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href={option.href}
                    className="inline-flex h-8 items-center rounded-lg bg-neutral-900 px-3.5 text-[12px] font-medium text-white transition-colors hover:bg-neutral-800"
                  >
                    {option.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] sm:grid-cols-2 sm:items-stretch">
            <div className="flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[16px] font-semibold tracking-[-0.02em] text-neutral-900">
                    {currentPlanMeta.name}
                  </h3>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 text-[11px] font-medium",
                      isTrial
                        ? "bg-amber-500/10 text-amber-700 border border-amber-500/20"
                        : plan && cancelAtPeriodEnd
                        ? "bg-amber-50 text-amber-700 border border-amber-200"
                        : "bg-neutral-100 text-neutral-600"
                    )}
                  >
                    {isTrial ? (cancelAtPeriodEnd ? "Trial Ending" : "14-Day Free Trial") : plan && cancelAtPeriodEnd ? "Ending" : "Current"}
                  </span>
                  <span className="text-[13px] font-medium text-neutral-400 tabular-nums">
                    {currentPlanMeta.priceLabel}
                  </span>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-neutral-500">
                  {isTrial && cancelAtPeriodEnd
                    ? `Your 14-day free trial will end on ${accessLabel || "the end of the trial period"}. You will not be charged.`
                    : isTrial
                    ? `You are currently on a 14-day free trial. Your first billing of ${currentPlanMeta.priceLabel} begins on ${renewLabel || "the end of the trial period"}. Cancel anytime before then at no charge.`
                    : plan && cancelAtPeriodEnd
                    ? `You keep ${planDisplayLabel(plan)} until ${accessLabel || "the end of this period"}. It will not renew.`
                    : !plan && pastPlan
                    ? `Your previous ${planDisplayLabel(pastPlan)} plan ended. You are currently on the Free plan with 100 monthly credits.`
                    : currentPlanMeta.description}
                </p>
              </div>

              <div className="mt-6 pt-1">
                {plan && !cancelAtPeriodEnd ? (
                  <button
                    type="button"
                    onClick={() => void cancelRenewal()}
                    disabled={cancelling}
                    className="inline-flex h-8 items-center rounded-lg border border-neutral-200 bg-white px-3 text-[12px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900 disabled:opacity-50"
                  >
                    {cancelling ? "Cancelling…" : isTrial ? "Cancel Free Trial" : "Adjust Plan"}
                  </button>
                ) : !plan ? (
                  <Link
                    href="/app/pricing"
                    className="inline-flex h-8 items-center rounded-lg border border-neutral-200 bg-white px-3 text-[12px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
                  >
                    Adjust Plan
                  </Link>
                ) : (
                  <span className="inline-flex h-8 items-center rounded-lg border border-amber-200 bg-amber-50/70 px-3 text-[12px] font-medium text-amber-800">
                    Cancellation scheduled
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-xl border border-neutral-200/70 bg-neutral-50/70 p-4">
              <div>
                <p className="text-[14px] font-semibold tracking-[-0.01em] text-neutral-900">
                  {currentPlanMeta.quotaTitle}
                </p>
                <div
                  aria-hidden
                  className="my-2.5 border-b border-dotted border-neutral-300"
                />
                <p className="text-[12px] leading-relaxed text-neutral-500">
                  {plan && !cancelAtPeriodEnd && renewLabel
                    ? `Renews ${renewLabel} · View your credit breakdown and Water BYOK usage`
                    : plan && cancelAtPeriodEnd && accessLabel
                    ? `Active until ${accessLabel} · Will not renew`
                    : "Go beyond or monitor your plan's included quota in the usage dashboard"}
                </p>
              </div>
              <div className="mt-4">
                <Link
                  href="/app/usage"
                  className="inline-flex h-8 items-center rounded-lg bg-neutral-900 px-3.5 text-[12px] font-medium text-white transition-colors hover:bg-neutral-800"
                >
                  View Usage
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function LimitsCard() {
  return (
    <Card>
      <CardHeader className="px-5 pt-5 pb-0">
        <h2 className="text-[15px] font-semibold tracking-tight text-neutral-900">
          Limits & credits
        </h2>
      </CardHeader>
      <CardContent className="px-5 pb-5 pt-3">
        <div className="overflow-hidden rounded-xl border border-neutral-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-50 text-[11px] uppercase tracking-wider text-neutral-400">
              <tr>
                <th className="px-3 py-2 font-semibold">Engine</th>
                <th className="px-3 py-2 font-semibold">Cost</th>
                <th className="px-3 py-2 font-semibold">Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-700">
              <tr>
                <td className="px-3 py-2.5 font-medium text-neutral-900">Hydrilla cloud</td>
                <td className="px-3 py-2.5">2–10 Hydrilla credits</td>
                <td className="px-3 py-2.5">Your plan balance</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-medium text-neutral-900">Water</td>
                <td className="px-3 py-2.5">0 Hydrilla credits</td>
                <td className="px-3 py-2.5">Your provider key</td>
              </tr>
              <tr>
                <td className="px-3 py-2.5 font-medium text-neutral-900">OpenRouter free</td>
                <td className="px-3 py-2.5">$0 · your key</td>
                <td className="px-3 py-2.5">~50/day · ~20/min</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[12px] text-neutral-500 leading-relaxed">
          One Water build uses 2 provider requests (up to 4 if a quality gate retries).
          After a one-time $10 OpenRouter credit purchase, free-model daily limit rises to ~1,000.
        </p>
      </CardContent>
    </Card>
  );
}

function ApiKeyCard({
  connector,
  meta,
  shared,
  onChanged,
}: {
  connector: ConnectorPublic;
  meta?: UserApiKeyMeta;
  shared?: UserApiKeyMeta;
  onChanged: () => Promise<void>;
}) {
  const provider = connector.id as ApiKeyProvider;
  const placeholder = connector.keyPlaceholder;
  const docs = connector.docsUrl;
  const { getToken } = useAuth();
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState<"save" | "verify" | "remove" | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const status = meta?.status ?? "unchecked";
  const configured = Boolean(meta?.configured);
  const tokenGetter = async () => (await getToken()) ?? null;

  const handleSave = async () => {
    if (!value.trim()) return;
    setBusy("save");
    setLocalError(null);
    try {
      await saveUserApiKey(provider, value.trim(), tokenGetter);
      setValue("");
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1600);
      await onChanged();
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(null);
    }
  };

  const handleVerify = async () => {
    setBusy("verify");
    setLocalError(null);
    try {
      await verifyUserApiKey(provider, tokenGetter);
      await onChanged();
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Verify failed");
    } finally {
      setBusy(null);
    }
  };

  const handleRemove = async () => {
    setBusy("remove");
    setLocalError(null);
    try {
      await deleteUserApiKey(provider, tokenGetter);
      await onChanged();
    } catch (err: unknown) {
      setLocalError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-[15px] font-semibold tracking-tight text-neutral-900">
                {connector.name}
              </h3>
              {docs && (
                <a
                  href={docs}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-neutral-400 hover:text-neutral-800"
                >
                  Get key
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            {connector.product ? (
              <p className="mt-0.5 text-[12px] text-neutral-500">{connector.product}</p>
            ) : null}
            {!configured && shared?.configured && shared.status !== "invalid" ? (
              <p className="mt-1 text-[12px] text-neutral-500">Hydrilla key available until you add your own.</p>
            ) : null}
          </div>
          <StatusPill configured={configured} status={status} last4={meta?.last4} />
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              type={show ? "text" : "password"}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={configured ? `••••••••${meta?.last4 || ""}` : placeholder}
              className="h-10 rounded-xl pr-10"
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSave();
              }}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
              aria-label={show ? "Hide key" : "Show key"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={!value.trim() || busy !== null}
            className="h-10 rounded-xl px-4"
          >
            {busy === "save" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : savedFlash ? (
              <Check className="h-4 w-4" />
            ) : (
              "Save"
            )}
          </Button>
        </div>

        {(configured || localError || (meta?.lastError && status === "invalid")) && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {configured && (
              <>
                <button
                  type="button"
                  onClick={() => void handleVerify()}
                  disabled={busy !== null}
                  className="text-xs font-medium text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
                >
                  {busy === "verify" ? "Verifying…" : "Verify"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleRemove()}
                  disabled={busy !== null}
                  className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                >
                  {busy === "remove" ? "Removing…" : "Remove"}
                </button>
              </>
            )}
            {meta?.lastError && status === "invalid" && (
              <p className="w-full text-[11px] text-red-600 flex items-start gap-1">
                <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                {meta.lastError}
              </p>
            )}
            {localError && <p className="w-full text-[11px] text-red-600">{localError}</p>}
          </div>
        )}
        {provider === "anthropic" && (
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            Create a Console key at{" "}
            <a
              href="https://platform.claude.com/settings/keys"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-neutral-700 underline-offset-2 hover:underline"
            >
              platform.claude.com/settings/keys
            </a>
            , ensure billing/credits are active, then Save and Verify.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function StatusPill({
  configured,
  status,
  last4,
}: {
  configured: boolean;
  status: string;
  last4?: string | null;
}) {
  if (!configured) {
    return (
      <span className="rounded-md bg-neutral-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
        Not set
      </span>
    );
  }
  if (status === "valid") {
    return (
      <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">
        Valid{last4 ? ` · ${last4}` : ""}
      </span>
    );
  }
  if (status === "invalid") {
    return (
      <span className="rounded-md bg-red-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-red-700">
        Invalid
      </span>
    );
  }
  return (
    <span className="rounded-md bg-amber-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
      Unchecked
    </span>
  );
}

function WaterModelSlots({
  keys,
  sharedKeys,
  connectors,
  defaultCodeModel,
  serverEnabled,
  onDefaultSaved,
  onEnabledSaved,
}: {
  keys: UserApiKeyMeta[];
  sharedKeys: UserApiKeyMeta[];
  connectors: ConnectorPublic[];
  defaultCodeModel: ModelId | null;
  serverEnabled?: string[] | null;
  onDefaultSaved: (id: ModelId) => Promise<void>;
  onEnabledSaved: (ids: string[]) => Promise<void>;
}) {
  const { getToken } = useAuth();
  const [groups, setGroups] = useState<WaterModelGroup[]>([]);
  const [enabled, setEnabled] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const keyFingerprint = [...keys, ...sharedKeys]
    .map((k) => `${k.provider}:${k.configured}:${k.status}`)
    .sort()
    .join("|");

  const loadModels = async () => {
    setSyncing(true);
    try {
      const data = await fetchWaterModels(async () => (await getToken()) ?? null);
      setGroups(data.groups);
      setEnabled(resolveEnabledModelIds(data.groups, serverEnabled));
      setLoadError(null);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Could not load models");
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    void loadModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyFingerprint]);

  const hasAccess = connectors.some((c) => providerKeyAvailable(c.id, keys, sharedKeys));

  if (!hasAccess && !groups.length && !syncing) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-[15px] text-neutral-500">
          Save a key above. Models for that provider will show up here.
        </CardContent>
      </Card>
    );
  }

  const toggle = (id: string, on: boolean) => {
    const next = setModelEnabled(id, on, enabled, groups);
    setEnabled(next);
    void onEnabledSaved(next);
    if (on && !defaultCodeModel) {
      void onDefaultSaved(id);
    }
    if (!on && defaultCodeModel === id) {
      const fallback = next[0];
      if (fallback) void onDefaultSaved(fallback);
    }
  };

  return (
    <section className="space-y-3">
      <h2 className="px-0.5 text-sm font-semibold text-neutral-900">Models</h2>
      <Card className="overflow-hidden">
        <div className="flex items-center gap-2 border-b border-neutral-200 bg-white px-3 py-3">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Add or search model"
              className="h-12 rounded-xl border-neutral-200 pl-10 text-[15px]"
            />
          </div>
          <button
            type="button"
            onClick={() => void loadModels()}
            disabled={syncing}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50 disabled:opacity-50"
            aria-label="Refresh models"
          >
            <RefreshCw className={cn("h-4 w-4", syncing && "animate-spin")} />
          </button>
        </div>

        {loadError && (
          <p className="border-b border-amber-100 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">{loadError}</p>
        )}

        <div className="max-h-[min(28rem,60vh)] overflow-y-auto">
          {groups.map((g) => {
            const models = filterModelsByQuery(g.models, query);
            if (!models.length) return null;
            return (
              <div key={g.provider}>
                <div className="sticky top-0 z-[1] bg-neutral-50 px-4 py-2 text-[13px] font-medium text-neutral-500">
                  {g.name}
                </div>
                {models.map((m) => {
                  const on = enabled.includes(m.id);
                  const pinned = isPinnedModel(m.id, enabled, groups);
                  return (
                    <div
                      key={m.id}
                      className="flex min-h-[3.5rem] items-center justify-between gap-4 border-t border-neutral-100 px-4 py-3"
                    >
                      <span className="min-w-0 truncate text-[16px] font-medium leading-snug text-neutral-900">
                        {m.name}
                      </span>
                      <Switch
                        checked={on}
                        disabled={pinned && on}
                        onCheckedChange={(next) => toggle(m.id, next)}
                        className="h-6 w-11 shrink-0 data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-neutral-200 [&>span]:h-5 [&>span]:w-5 data-[state=checked]:[&>span]:translate-x-5"
                        aria-label={`Show ${m.name} in Engine`}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
