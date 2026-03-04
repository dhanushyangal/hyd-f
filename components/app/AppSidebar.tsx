"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  ImageIcon,
  BarChart3,
  CreditCard,
  PanelLeftClose,
  PanelLeft,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";

const navItems = [
  { href: "/app/studio", label: "Studio", icon: LayoutDashboard },
  { href: "/app/assets", label: "Assets", icon: FolderOpen },
  { href: "/app/image", label: "Image", icon: ImageIcon },
  { href: "/app/usage", label: "Usage", icon: BarChart3 },
  { href: "/app/pricing", label: "Pricing", icon: CreditCard },
];

export function AppSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarFg = "hsl(var(--sidebar-fg))";
  const sidebarBorder = "hsl(var(--sidebar-border))";

  return (
    <aside
      className={cn(
        "app-sidebar-root flex flex-col shrink-0 h-screen transition-[width] duration-200 ease-out border-r",
        collapsed ? "w-[52px]" : "w-[212px]"
      )}
      style={{
        backgroundColor: "var(--sidebar-bg)",
        color: sidebarFg,
        borderColor: sidebarBorder,
      }}
    >
      {/* Logo row – breathing space, professional */}
      <div
        className="flex items-center justify-between shrink-0 border-b py-4 px-3 transition-[padding] duration-200"
        style={{ borderColor: sidebarBorder }}
      >
        {!collapsed && (
          <Link
            href="/app"
            className="flex items-center min-w-0 flex-1 font-dm-sans text-xl sm:text-2xl font-bold tracking-tight text-neutral-900"
          >
            <span className="truncate">Hydrilla</span>
          </Link>
        )}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "sidebar-toggle flex items-center justify-center rounded-[var(--sidebar-radius)] shrink-0 transition-[var(--sidebar-transition)] opacity-80 hover:opacity-100 w-8 h-8",
            collapsed && "mx-auto"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Nav */}
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
              className={cn(
                "sidebar-item flex items-center font-medium text-sm rounded-[999px]",
                collapsed ? "justify-center px-0" : "pl-3 pr-3",
                isActive && "active"
              )}
              style={{
                minHeight: "var(--sidebar-item-height)",
                gap: "var(--sidebar-spacing)",
                color: isActive ? undefined : "hsl(var(--sidebar-fg-muted))",
              }}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              {!collapsed && <span className="truncate">{label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Upgrade button – bottom of sidebar */}
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
            className="sidebar-upgrade-btn flex items-center justify-center w-9 h-9 mx-auto rounded-lg bg-blue-600 text-white font-medium text-xs hover:bg-blue-700"
            title="Upgrade"
          >
            <Sparkles className="w-4 h-4" />
          </Link>
        ) : (
          <Link
            href="/app/pricing"
            className="sidebar-upgrade-btn flex items-center justify-center gap-2 w-full h-9 rounded-lg bg-blue-600 text-white font-medium text-xs px-3 font-dm-sans hover:bg-blue-700"
          >
            <Sparkles className="w-3.5 h-3.5 shrink-0" />
            <span>Upgrade</span>
          </Link>
        )}
      </div>
    </aside>
  );
}
