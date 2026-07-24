"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  LayoutDashboard,
  FolderOpen,
  ImageIcon,
  BarChart3,
  CreditCard,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { track } from "../../lib/analytics";
import { useAppLayout } from "../../context/AppLayoutContext";

const RAW_BACKEND = process.env.NEXT_PUBLIC_BACKEND_URL || "https://hydrilla-backend.vercel.app";
const BACKEND_URL = RAW_BACKEND.replace(/\/+$/, "");

const navItems = [
  { href: "/app/studio", label: "Studio", icon: LayoutDashboard },
  { href: "/app/assets", label: "Assets", icon: FolderOpen },
  { href: "/app/image", label: "Image", icon: ImageIcon },
  { href: "/app/usage", label: "Usage", icon: BarChart3 },
  { href: "/app/pricing", label: "Pricing", icon: CreditCard },
];

/** Credits usage card – wired to /api/payments/credits. Plan badge + progress. */
function CreditsCard() {
  const { getToken, isSignedIn } = useAuth();
  const { closeMobileSidebar } = useAppLayout();
  const [used, setUsed] = useState(0);
  const [total, setTotal] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) { setLoading(false); return; }

    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${BACKEND_URL}/api/payments/credits`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const { credits } = await res.json();
          const nextUsed = credits.used ?? 0;
          const nextTotal = credits.total ?? 0;
          setUsed(nextUsed);
          setTotal(nextTotal);
          setRemaining(
            typeof credits.remaining === "number"
              ? credits.remaining
              : Math.max(0, nextTotal - nextUsed)
          );
          setPlan(credits.plan ?? null);
        } else {
          console.error("[Credits] Backend returned", res.status, res.statusText, "from", BACKEND_URL);
        }
      } catch (err) {
        console.error("[Credits] Fetch failed:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [isSignedIn, getToken]);

  const pctUsed = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const pctLeft = Math.max(0, 100 - pctUsed);
  const planLabel = plan
    ? `${plan.charAt(0).toUpperCase() + plan.slice(1)}`
    : "Free";
  const isLow = !loading && total > 0 && pctLeft <= 15;

  return (
    <Link
      href="/app/pricing"
      prefetch
      onClick={closeMobileSidebar}
      className="group block rounded-2xl p-3.5 font-dm-sans transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
      style={{
        background:
          "linear-gradient(165deg, #ffffff 0%, #f7f7f8 55%, #f2f2f4 100%)",
        border: "1px solid rgba(17,17,17,0.06)",
        boxShadow:
          "0 1px 2px rgba(17,17,17,0.04), 0 8px 24px -12px rgba(17,17,17,0.12)",
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-3">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-900/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-neutral-700">
          <Sparkles className="w-2.5 h-2.5 text-neutral-500" strokeWidth={2.25} />
          {planLabel}
        </span>
        <span
          className={cn(
            "text-[10px] font-medium tabular-nums tracking-tight",
            isLow ? "text-amber-600" : "text-neutral-400"
          )}
        >
          {loading ? "…" : `${pctLeft}% left`}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2 mb-2.5">
        <div className="min-w-0">
          <p className="text-[22px] leading-none font-semibold tracking-tight text-neutral-900 tabular-nums">
            {loading ? "—" : remaining.toLocaleString()}
          </p>
          <p className="mt-1 text-[11px] text-neutral-500 font-medium">
            credits remaining
          </p>
        </div>
        <p className="text-[10px] text-neutral-400 tabular-nums shrink-0 pb-0.5">
          {loading ? "" : `${used.toLocaleString()} / ${total.toLocaleString()}`}
        </p>
      </div>

      <div
        className="h-1 w-full rounded-full overflow-hidden bg-neutral-200/80"
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

      <p className="mt-2.5 text-[11px] font-medium text-neutral-500 group-hover:text-neutral-800 transition-colors">
        Manage plan →
      </p>
    </Link>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const { getToken, isSignedIn } = useAuth();
  const { mobileSidebarOpen, closeMobileSidebar } = useAppLayout();

  // Warm every app route so sidebar clicks feel instant.
  useEffect(() => {
    for (const { href } of navItems) {
      router.prefetch(href);
    }
  }, [router]);

  useEffect(() => {
    if (!isSignedIn) { setHasActiveSubscription(false); return; }
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${BACKEND_URL}/api/payments/subscription`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const { subscription } = await res.json();
          setHasActiveSubscription(!!subscription && (subscription.status === "active" || subscription.status === "on_hold"));
        }
      } catch {
        setHasActiveSubscription(false);
      }
    })();
  }, [isSignedIn, getToken]);

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
            href="/app/studio"
            prefetch
            onClick={closeMobileSidebar}
            className={cn(
              "flex items-center min-w-0 flex-1 font-dm-sans text-[22px] font-semibold tracking-[-0.04em] text-neutral-900 hover:opacity-80 transition-opacity",
              collapsed && "md:w-0 md:overflow-hidden md:min-w-0"
            )}
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
              (href !== "/app/studio" && pathname?.startsWith(href));
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
                  color: isActive ? "#111" : "hsl(var(--sidebar-fg-muted))",
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
        </nav>

        {/* Credits – hide when collapsed on desktop */}
        {!collapsed && (
          <div
            className="shrink-0 pb-3"
            style={{
              paddingLeft: "var(--sidebar-spacing)",
              paddingRight: "var(--sidebar-spacing)",
            }}
          >
            <CreditsCard />
          </div>
        )}

        {/* Upgrade */}
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
