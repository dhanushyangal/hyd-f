"use client";

import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Bell, Plus, Menu } from "lucide-react";
import { useAppLayout } from "../../context/AppLayoutContext";

export function AppNavbar() {
  const router = useRouter();
  const { openMobileSidebar } = useAppLayout();

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-4 md:px-6 bg-white border-b border-neutral-200/80 font-dm-sans">
      {/* Mobile: menu (hamburger) to open sidebar */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={openMobileSidebar}
          className="md:hidden flex items-center justify-center rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors h-9 w-9 shrink-0"
          aria-label="Open menu"
          title="Menu"
        >
          <Menu className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>
      {/* Right: Create, Notifications, Profile – Profile emphasized on mobile */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => router.push("/app/studio")}
          className="hidden sm:flex items-center justify-center gap-2 rounded-lg text-sm font-medium text-neutral-800 bg-neutral-100 hover:bg-neutral-200/80 border border-neutral-200/60 transition-colors h-[36px] min-w-[36px] px-3"
          title="Create"
        >
          <Plus className="w-5 h-5 shrink-0" strokeWidth={2} />
          <span className="ml-0.5">Create</span>
        </button>
        <button
          type="button"
          className="hidden sm:flex items-center justify-center rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors h-[36px] w-[36px] shrink-0"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="w-5 h-5 shrink-0" strokeWidth={2} />
        </button>
        <div className="flex items-center justify-center h-9 w-9 shrink-0 pl-0.5">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-8 h-8 sm:w-8 sm:h-8 ring-0",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
