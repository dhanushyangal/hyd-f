"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const [used, setUsed] = useState(0);
  const [total, setTotal] = useState(0);
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
          setUsed(credits.used ?? 0);
          setTotal(credits.total ?? 0);
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

  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  const planLabel = plan ? `${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan` : "Free";

  return (
    <div
      className="rounded-xl border bg-white p-3 font-dm-sans"
      style={{
        borderColor: "rgba(17,17,17,0.08)",
        boxShadow: "0 1px 2px rgba(17,17,17,0.04)",
      }}
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-neutral-800 tracking-tight">
          {planLabel}
        </span>
        <span className="text-xs font-medium text-neutral-500 tabular-nums">
          {loading ? "–" : `${pct}%`}
        </span>
      </div>
      <div
        className="h-1.5 w-full rounded-full overflow-hidden bg-neutral-100"
        role="progressbar"
        aria-label="Credits usage"
        aria-valuenow={loading ? 0 : used}
        aria-valuemin={0}
        aria-valuemax={total > 0 ? total : 100}
      >
        <div
          className="h-full rounded-full bg-blue-500 transition-all duration-300"
          style={{ width: loading ? "0%" : `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-neutral-600 tabular-nums font-medium">
        {loading ? "Loading…" : `${used} / ${total} credits`}
      </p>
    </div>
  );
}

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const { getToken, isSignedIn } = useAuth();
  const { mobileSidebarOpen, closeMobileSidebar } = useAppLayout();

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
          "max-md:fixed max-md:left-0 max-md:top-0 max-md:bottom-0 max-md:z-50 max-md:w-[260px] max-md:translate-x-[-100%] max-md:shadow-xl",
          mobileSidebarOpen && "max-md:translate-x-0",
          "md:relative md:translate-x-0 md:shadow-none",
          !collapsed && "md:w-[212px]",
          collapsed && "md:w-[52px]"
        )}
        style={{
          backgroundColor: "var(--sidebar-bg)",
          color: sidebarFg,
          borderColor: sidebarBorder,
        }}
      >
        {/* Logo row – mobile: logo + close (X); desktop: logo + collapse toggle */}
        <div
          className="flex items-center justify-between shrink-0 border-b py-4 px-3 transition-[padding] duration-200"
          style={{ borderColor: sidebarBorder }}
        >
          <Link
            href="/app"
            onClick={closeMobileSidebar}
            className={cn(
              "flex items-center min-w-0 flex-1 font-dm-sans text-xl font-bold tracking-tight text-neutral-900",
              collapsed && "md:w-0 md:overflow-hidden md:min-w-0"
            )}
          >
            <span className={cn("truncate", collapsed && "md:hidden")}>Hydrilla</span>
          </Link>
          <button
            type="button"
            onClick={closeMobileSidebar}
            className="sidebar-toggle flex md:hidden items-center justify-center rounded-[var(--sidebar-radius)] shrink-0 w-8 h-8 opacity-80 hover:opacity-100"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className={cn(
              "sidebar-toggle hidden md:flex items-center justify-center rounded-[var(--sidebar-radius)] shrink-0 transition-[var(--sidebar-transition)] opacity-80 hover:opacity-100 w-8 h-8",
              collapsed && "mx-auto"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeft className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
          </button>
        </div>

        {/* Nav – always show labels on mobile overlay */}
        <nav
          className="flex-1 overflow-y-auto py-3 flex flex-col"
          style={{
            paddingLeft: "var(--sidebar-spacing)",
            paddingRight: "var(--sidebar-spacing)",
            gap: "var(--sidebar-spacing)",
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
                onClick={closeMobileSidebar}
                className={cn(
                  "sidebar-item flex items-center font-medium text-sm rounded-[999px] pl-3 pr-3 max-md:flex",
                  collapsed && "md:justify-center md:px-0",
                  isActive && "active"
                )}
                style={{
                  minHeight: "var(--sidebar-item-height)",
                  gap: "var(--sidebar-spacing)",
                  color: isActive ? undefined : "hsl(var(--sidebar-fg-muted))",
                }}
              >
                <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
                <span className={cn("truncate", collapsed && "md:hidden")}>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Credits – hide when collapsed on desktop */}
        {!collapsed && (
          <div
            className="shrink-0 px-2 pb-2"
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
                onClick={closeMobileSidebar}
                className="sidebar-upgrade-btn flex items-center justify-center w-9 h-9 mx-auto rounded-lg bg-blue-600 text-white font-medium text-xs hover:bg-blue-700"
                title="Upgrade"
              >
                <Sparkles className="w-4 h-4" />
              </Link>
            ) : (
              <Link
                href="/app/pricing"
                onClick={closeMobileSidebar}
                className="sidebar-upgrade-btn flex items-center justify-center gap-2 w-full h-9 rounded-lg bg-blue-600 text-white font-medium text-xs px-3 font-dm-sans hover:bg-blue-700"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Upgrade</span>
              </Link>
            )}
          </div>
        )}
      </aside>
    </>
  );
}
