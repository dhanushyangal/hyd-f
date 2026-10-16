"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  LayoutDashboard,
  FolderOpen,
  BarChart3,
  CreditCard,
  Settings,
  Key,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  HelpCircle,
  Clock,
  ChevronRight,
  Coins,
  X,
} from "lucide-react";
import { useSlotStatus } from "../../hooks/useSlotStatus";
import { cn } from "../../lib/utils";
import { track } from "../../lib/analytics";
import { isPaidPlan, planDisplayLabel } from "../../lib/pricing";
import { useAppLayout } from "../../context/AppLayoutContext";
import { useSupport } from "@/context/SupportContext";

const RAW_BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "https://hydrilla-backend.vercel.app";
const BACKEND_URL = RAW_BACKEND.replace(/\/+$/, "");

const baseNavItems = [
  { href: "/app/studio", label: "Studio", icon: LayoutDashboard },
  { href: "/app/assets", label: "Assets", icon: FolderOpen },
  { href: "/app/usage", label: "Usage", icon: BarChart3 },
  { href: "/app/api-keys", label: "API Keys", icon: Key },
  { href: "/app/settings", label: "Settings", icon: Settings },
  { href: "/app/pricing", label: "Pricing", icon: CreditCard, hideWhenPaid: true },
];

type CreditsState = {
  used: number;
  total: number;
  remaining: number;
  plan: string | null;
  resetAt: string | null;
  loading: boolean;
};

function formatShortReset(iso: string | null): string | null {
  if (!iso) {
    return null;
  }
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      return null;
    }
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return null;
  }
}

function SlotCard({ collapsed }: { collapsed: boolean }) {
  const { getToken, isSignedIn } = useAuth();
  const { closeMobileSidebar } = useAppLayout();
  const slot = useSlotStatus(getToken, Boolean(isSignedIn), { tick: true });

  if (!slot.enrolled) {
    return null;
  }

  if (slot.needsHour) {
    if (collapsed) {
      return (
        <Link
          href="/app/settings?section=billing"
          prefetch
          onClick={closeMobileSidebar}
          title="Select your hour"
          aria-label="Select your hour"
          className="mx-auto mb-2 hidden h-10 w-10 items-center justify-center rounded-full bg-neutral-900 text-white md:flex"
        >
          <Clock className="h-4 w-4" strokeWidth={1.75} />
        </Link>
      );
    }
    return (
      <Link
        href="/app/settings?section=billing"
        prefetch
        onClick={closeMobileSidebar}
        className="mb-2 block rounded-2xl border border-neutral-200/80 bg-white p-3.5 font-dm-sans shadow-[0_1px_2px_rgba(17,17,17,0.04),0_8px_24px_-12px_rgba(17,17,17,0.12)] transition-colors hover:border-neutral-300"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
          <Clock className="h-2.5 w-2.5" strokeWidth={2.25} />
          Slot
        </span>
        <p className="mt-2.5 text-[15px] font-semibold tracking-[-0.02em] text-neutral-900">
          Select your hour
        </p>
        <p className="mt-1 text-[12px] leading-5 text-neutral-500">
          Choose the hour you can generate images and models.
        </p>
      </Link>
    );
  }

  const phrase = slot.open
    ? `${slot.remainingLabel} left in ${slot.label}`
    : `Opens in ${slot.remainingLabel}. Your hours are ${slot.label}.`;

  if (collapsed) {
    return (
      <div
        className="mx-auto mb-2 hidden h-10 w-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-900 md:flex"
        title={phrase}
        role="status"
      >
        <Clock className="h-4 w-4" strokeWidth={1.75} />
      </div>
    );
  }

  return (
    <div
      className="mb-2 rounded-2xl border border-neutral-200/80 bg-white p-3.5 font-dm-sans shadow-[0_1px_2px_rgba(17,17,17,0.04),0_8px_24px_-12px_rgba(17,17,17,0.12)]"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-700">
          <Clock className="h-2.5 w-2.5 text-neutral-500" strokeWidth={2.25} />
          {slot.open ? "Open" : "Closed"}
        </span>
      </div>
      <p className="mt-2.5 text-[22px] leading-none font-semibold tracking-tight text-neutral-900 tabular-nums">
        {slot.remainingLabel}
      </p>
      <p className="mt-1 text-[12px] leading-5 text-neutral-500">
        {slot.open ? `left · ${slot.label}` : `until ${slot.label}`}
      </p>
    </div>
  );
}

/** Credits usage card – links to /app/usage with clean balance & progress display. */
function CreditsCard({
  credits,
  collapsed,
}: {
  credits: CreditsState;
  collapsed: boolean;
}) {
  const { closeMobileSidebar } = useAppLayout();
  const { used, total, remaining, plan, resetAt, loading } = credits;

  const pctUsed = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const pctLeft = Math.max(0, 100 - pctUsed);
  const planLabel = planDisplayLabel(plan);
  const isLow = !loading && total > 0 && pctLeft <= 15;
  const resetLabel = formatShortReset(resetAt);

  if (collapsed) {
    return (
      <Link
        href="/app/usage"
        prefetch
        onClick={closeMobileSidebar}
        title={loading ? "Credits & usage" : `${remaining.toLocaleString()} credits left · View usage`}
        aria-label="View credit usage"
        className="mx-auto hidden h-10 w-10 items-center justify-center rounded-full border border-neutral-200/80 bg-white text-neutral-700 shadow-xs transition-colors hover:border-neutral-300 hover:text-neutral-900 md:flex"
      >
        <Coins className="h-4 w-4" strokeWidth={1.8} />
      </Link>
    );
  }

  return (
    <Link
      href="/app/usage"
      prefetch
      onClick={closeMobileSidebar}
      className="credits-card group block rounded-2xl border border-neutral-200/80 bg-white p-3.5 font-dm-sans shadow-[0_1px_2px_rgba(17,17,17,0.04),0_10px_26px_-12px_rgba(17,17,17,0.12)] transition-all duration-200 hover:border-neutral-300 hover:shadow-[0_2px_4px_rgba(17,17,17,0.05),0_14px_30px_-12px_rgba(17,17,17,0.16)] active:scale-[0.99]"
    >
      {/* Top row: Plan badge + Percentage remaining */}
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900/[0.06] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-700">
          <Sparkles className="h-2.5 w-2.5 text-neutral-500" strokeWidth={2.25} />
          {loading ? "…" : planLabel}
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[10px] font-semibold tabular-nums tracking-tight",
            isLow ? "text-amber-600" : "text-neutral-400"
          )}
        >
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              loading ? "bg-neutral-300" : isLow ? "bg-amber-500" : "bg-emerald-500"
            )}
          />
          {loading ? "…" : `${pctLeft}% left`}
        </span>
      </div>

      {/* Main balance */}
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5 min-w-0">
          <p className="text-[24px] leading-none font-semibold tracking-[-0.03em] text-neutral-900 tabular-nums">
            {loading ? "—" : remaining.toLocaleString()}
          </p>
          <span className="text-[11px] font-medium text-neutral-400 truncate">
            credits
          </span>
        </div>
        {!loading && total > 0 && (
          <p className="text-[10px] font-medium text-neutral-400 tabular-nums shrink-0">
            {used.toLocaleString()} / {total.toLocaleString()}
          </p>
        )}
      </div>

      {/* Progress bar */}
      <div
        className="mt-2.5 h-1.5 w-full rounded-full overflow-hidden bg-neutral-100"
        aria-label="Credits remaining"
      >
        <div
          className={cn(
            "h-full rounded-full transition-all duration-500 ease-out",
            isLow ? "bg-amber-500" : "bg-neutral-900"
          )}
          style={{ width: loading ? "0%" : `${pctLeft}%` }}
        />
      </div>

      {/* Footer link to usage */}
      <div className="mt-2.5 flex items-center justify-between gap-2 pt-0.5">
        <span className="text-[11px] font-medium text-neutral-500 group-hover:text-neutral-900 transition-colors">
          {resetLabel ? `Resets ${resetLabel}` : "View usage"}
        </span>
        <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-neutral-700 group-hover:text-neutral-950 transition-colors">
          Usage
          <ChevronRight className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [credits, setCredits] = useState<CreditsState>({
    used: 0,
    total: 0,
    remaining: 0,
    plan: null,
    resetAt: null,
    loading: true,
  });
  const { getToken, isSignedIn } = useAuth();
  const { mobileSidebarOpen, closeMobileSidebar } = useAppLayout();
  const { openSupport } = useSupport();

  useEffect(() => {
    if (!isSignedIn) {
      setHasActiveSubscription(false);
      setCredits((prev) => ({ ...prev, loading: false }));
      return;
    }

    const state = { cancelled: false };
    void (async () => {
      try {
        const token = await getToken();
        const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
        const [creditsRes, subRes] = await Promise.all([
          fetch(`${BACKEND_URL}/api/payments/credits`, { headers }),
          fetch(`${BACKEND_URL}/api/payments/subscription`, { headers }),
        ]);

        if (state.cancelled) {
          return;
        }

        const subJson = subRes.ok ? await subRes.json().catch(() => null) : null;
        const subscription = subJson?.subscription ?? null;
        const subPlan = subscription?.plan ?? null;
        const subActive =
          Boolean(subscription) &&
          (subscription.status === "active" ||
            subscription.status === "past_due" ||
            subscription.status === "on_hold");

        if (creditsRes.ok) {
          const { credits: c } = await creditsRes.json();
          const nextUsed = c?.used ?? 0;
          const nextTotal = c?.total ?? 0;
          const resolvedPlan = c?.plan || subPlan || null;
          const nextBonus = typeof c?.bonus === "number" ? c.bonus : 0;
          setCredits({
            used: nextUsed,
            total: nextTotal,
            remaining:
              typeof c?.remaining === "number"
                ? c.remaining
                : Math.max(0, nextTotal - nextUsed) + Math.max(0, nextBonus),
            plan: resolvedPlan,
            resetAt: c?.resetAt ?? null,
            loading: false,
          });
          setHasActiveSubscription(subActive || isPaidPlan(resolvedPlan));
        } else {
          setHasActiveSubscription(subActive || isPaidPlan(subPlan));
          setCredits((prev) => ({ ...prev, plan: subPlan, loading: false }));
        }
      } catch {
        if (!state.cancelled) {
          setHasActiveSubscription(false);
          setCredits((prev) => ({ ...prev, loading: false }));
        }
      }
    })();

    return () => {
      state.cancelled = true;
    };
  }, [isSignedIn, getToken]);

  const navItems = baseNavItems.filter(
    (item) => !(item.hideWhenPaid && hasActiveSubscription)
  );

  // Warm visible app routes so sidebar clicks feel instant.
  useEffect(() => {
    for (const { href } of navItems) {
      router.prefetch(href);
    }
  }, [router, hasActiveSubscription]);

  const sidebarFg = "hsl(var(--sidebar-fg))";
  const sidebarBorder = "hsl(var(--sidebar-border))";

  return (
    <>
      {/* Mobile backdrop – close on tap */}
      <div
        aria-hidden
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] md:hidden transition-opacity duration-200"
        style={{ opacity: mobileSidebarOpen ? 1 : 0, pointerEvents: mobileSidebarOpen ? "auto" : "none" }}
        onClick={closeMobileSidebar}
      />

      <aside
        className={cn(
          "app-sidebar-root flex flex-col shrink-0 h-screen transition-[width,transform] duration-200 ease-out border-r",
          "max-md:fixed max-md:left-0 max-md:top-0 max-md:bottom-0 max-md:z-50 max-md:w-[280px] max-md:translate-x-[-100%] max-md:shadow-xl",
          mobileSidebarOpen && "max-md:translate-x-0",
          "md:relative md:translate-x-0 md:shadow-none",
          !collapsed && "md:w-[232px]",
          collapsed && "md:w-[56px]"
        )}
        style={{
          backgroundColor: "var(--sidebar-bg)",
          color: sidebarFg,
          borderColor: sidebarBorder,
        }}
      >
        {/* Logo row – mobile: logo + close (X); desktop: logo + collapse toggle */}
        <div
          className="flex items-center justify-between shrink-0 border-b h-14 px-3.5 transition-[padding] duration-200"
          style={{ borderColor: sidebarBorder }}
        >
          <Link
            href="/"
            prefetch
            onClick={closeMobileSidebar}
            className={cn(
              "flex items-center min-w-0 flex-1 font-dm-sans text-[22px] font-semibold tracking-[-0.04em] text-neutral-900 hover:opacity-80 transition-opacity",
              collapsed && "md:w-0 md:overflow-hidden md:min-w-0"
            )}
            aria-label="Hydrilla home"
            title="Home"
          >
            <span className={cn("truncate", collapsed && "md:hidden")}>Hydrilla</span>
          </Link>
          <button
            type="button"
            onClick={closeMobileSidebar}
            className="sidebar-toggle flex md:hidden items-center justify-center rounded-full shrink-0 w-9 h-9 text-neutral-500"
            aria-label="Close menu"
          >
            <X className="w-[18px] h-[18px]" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "sidebar-toggle hidden md:flex items-center justify-center rounded-full shrink-0 w-9 h-9 text-neutral-500",
              collapsed && "mx-auto"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <PanelLeft className="w-[18px] h-[18px]" strokeWidth={1.75} />
            ) : (
              <PanelLeftClose className="w-[18px] h-[18px]" strokeWidth={1.75} />
            )}
          </button>
        </div>

        {/* Nav – always show labels on mobile overlay */}
        <nav
          className="flex-1 overflow-y-auto py-3.5 flex flex-col"
          style={{
            paddingLeft: "var(--sidebar-spacing)",
            paddingRight: "var(--sidebar-spacing)",
            gap: "4px",
          }}
        >
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href ||
              (href !== "/app/studio" && pathname?.startsWith(href)) ||
              (href === "/app/assets" && pathname?.startsWith("/app/image"));
            return (
              <Link
                key={href}
                href={href}
                prefetch
                onClick={closeMobileSidebar}
                onMouseEnter={() => router.prefetch(href)}
                className={cn(
                  "sidebar-item flex items-center text-[15px] font-medium tracking-[-0.015em] rounded-full pl-3.5 pr-3.5 max-md:flex",
                  collapsed && "md:justify-center md:px-0",
                  isActive && "active"
                )}
                style={{
                  minHeight: "var(--sidebar-item-height)",
                  gap: "12px",
                  color: isActive ? "hsl(var(--sidebar-fg))" : "hsl(var(--sidebar-fg-muted))",
                }}
              >
                <Icon
                  className="w-[18px] h-[18px] shrink-0"
                  strokeWidth={isActive ? 2.1 : 1.85}
                />
                <span className={cn("truncate", collapsed && "md:hidden")}>{label}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => {
              openSupport("issue");
              closeMobileSidebar();
            }}
            className={cn(
              "sidebar-item flex items-center text-[15px] font-medium tracking-[-0.015em] rounded-full pl-3.5 pr-3.5 max-md:flex w-full text-left transition-colors",
              collapsed && "md:justify-center md:px-0"
            )}
            style={{
              minHeight: "var(--sidebar-item-height)",
              gap: "12px",
              color: "hsl(var(--sidebar-fg-muted))",
            }}
            title="Help"
          >
            <HelpCircle className="w-[18px] h-[18px] shrink-0" strokeWidth={1.85} />
            <span className={cn("truncate", collapsed && "md:hidden")}>Help</span>
          </button>
        </nav>

        {/* Slot & Credits card */}
        <div
          className="shrink-0 pb-3 empty:hidden"
          style={{
            paddingLeft: "var(--sidebar-spacing)",
            paddingRight: "var(--sidebar-spacing)",
          }}
        >
          <SlotCard collapsed={collapsed} />
          <CreditsCard credits={credits} collapsed={collapsed} />
        </div>

        {/* Upgrade (only for non-paying users) */}
        {!hasActiveSubscription && (
          <div
            className="shrink-0 p-2 border-t"
            style={{
              borderColor: sidebarBorder,
              paddingLeft: "var(--sidebar-spacing)",
              paddingRight: "var(--sidebar-spacing)",
            }}
          >
            {collapsed ? (
              <Link
                href="/app/pricing"
                prefetch
                onClick={() => {
                  track("upgrade_clicked", { source: "app_sidebar", collapsed: true });
                  closeMobileSidebar();
                }}
                className="sidebar-upgrade-btn flex items-center justify-center w-10 h-10 mx-auto rounded-full bg-neutral-900 text-white font-medium text-xs hover:bg-neutral-800"
                title="Upgrade"
              >
                <Sparkles className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/app/pricing"
                prefetch
                onClick={() => {
                  track("upgrade_clicked", { source: "app_sidebar", collapsed: false });
                  closeMobileSidebar();
                }}
                className="sidebar-upgrade-btn flex items-center justify-center gap-2 w-full h-11 rounded-full bg-neutral-900 text-white font-medium text-sm px-3 font-dm-sans hover:bg-neutral-800 shadow-[0_1px_2px_rgba(0,0,0,0.08)]"
              >
                <Sparkles className="w-4 h-4 shrink-0" />
                <span>Upgrade</span>
              </Link>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
