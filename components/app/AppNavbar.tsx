"use client";

import { UserButton } from "@clerk/nextjs";
import { Bell, Menu } from "lucide-react";
import { useAppLayout } from "../../context/AppLayoutContext";

export function AppNavbar() {
  const { openMobileSidebar } = useAppLayout();

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-4 md:px-6 bg-[#fafafa] border-b border-neutral-200/60 font-dm-sans">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={openMobileSidebar}
          className="md:hidden flex items-center justify-center rounded-full text-neutral-600 hover:text-neutral-900 hover:bg-white border border-transparent hover:border-neutral-200/70 transition-colors h-9 w-9 shrink-0"
          aria-label="Open menu"
          title="Menu"
        >
          <Menu className="w-5 h-5" strokeWidth={2} />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          className="hidden sm:flex items-center justify-center rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-white border border-transparent hover:border-neutral-200/70 transition-colors h-9 w-9 shrink-0"
          aria-label="Notifications"
          title="Notifications"
        >
          <Bell className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
        </button>
        <div className="flex items-center justify-center h-9 w-9 shrink-0">
          <UserButton
            afterSignOutUrl="/"
            appearance={{
              elements: {
                avatarBox: "w-8 h-8 ring-0",
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
