"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
} from "@clerk/nextjs";
import { NAV_PRIMARY, type NavGroup } from "@/lib/nav";
import { NAVBAR } from "@/lib/nav-chrome";
import { NavIcon } from "./NavIcons";

const MENU_EASE = [0.22, 1, 0.36, 1] as const;
const DISPLAY =
  "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif";

function Chevron({ open, dim }: { open: boolean; dim: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      className={`h-3.5 w-3.5 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        open ? "rotate-180" : ""
      } ${dim}`}
      fill="none"
      aria-hidden
    >
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MobileSection({
  item,
  open,
  onToggle,
  onNavigate,
  onDark,
}: {
  item: NavGroup;
  open: boolean;
  onToggle: () => void;
  onNavigate: () => void;
  onDark: boolean;
}) {
  const v2 = NAVBAR !== "wide";
  const hover = v2
    ? "hover:bg-black/[0.04]"
    : onDark
      ? "hover:bg-white/8"
      : "hover:bg-black/[0.04]";
  const muted = v2
    ? "text-[#667085]"
    : onDark
      ? "text-white/35"
      : "text-black/30";
  const heading = v2
    ? "text-[#4b5568]"
    : onDark
      ? "text-white/40"
      : "text-neutral-400";
  const childHover = v2
    ? "text-[#141414] hover:bg-[#eef1f4]"
    : onDark
      ? "text-white/88 hover:bg-white/8 hover:text-white"
      : "text-neutral-800 hover:bg-black/[0.04] hover:text-neutral-950";

  if (!item.columns?.length) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={
          v2
            ? `flex min-h-11 cursor-pointer items-center justify-between rounded-[14px] px-3.5 py-3 text-[16px] font-medium tracking-[-0.022em] text-[#141414] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141414]/25 ${hover}`
            : `flex items-center justify-between rounded-[14px] px-3.5 py-3 text-[16px] font-medium tracking-[-0.022em] transition-colors ${hover}`
        }
        style={{ fontFamily: DISPLAY }}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={
          v2
            ? `flex min-h-11 w-full cursor-pointer items-center justify-between rounded-[14px] px-3.5 py-3 text-left text-[16px] font-medium tracking-[-0.022em] text-[#141414] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141414]/25 ${hover}`
            : `flex w-full items-center justify-between rounded-[14px] px-3.5 py-3 text-left text-[16px] font-medium tracking-[-0.022em] transition-colors ${hover}`
        }
        style={{ fontFamily: DISPLAY }}
      >
        {item.label}
        <Chevron open={open} dim={muted} />
      </button>

      <div
        className="grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      >
        <div className="overflow-hidden">
          <div className={v2 ? "space-y-2 px-2 pb-2" : `mx-3 mb-2 ml-4 border-l pl-2 ${onDark ? "border-white/12" : "border-black/8"}`}>
            {item.columns.map((column) => (
              <div
                key={column.heading}
                className={v2 ? "rounded-xl bg-black/[0.03] px-1.5 py-1.5" : "mb-3 last:mb-0"}
              >
                <div className={v2 ? "mb-1 flex items-center gap-2 px-2.5 pt-1" : ""}>
                  <p
                    className={
                      v2
                        ? `text-[11px] font-semibold uppercase tracking-[0.16em] ${heading}`
                        : `px-3.5 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${heading}`
                    }
                  >
                    {column.heading}
                  </p>
                  {v2 ? <span aria-hidden className="h-px min-w-4 flex-1 bg-black/10" /> : null}
                </div>
                <ul>
                  {column.items.map((child) => (
                    <li key={`${column.heading}-${child.href}-${child.label}`}>
                      <Link
                        href={child.href}
                        onClick={onNavigate}
                        className={
                          v2
                            ? `flex min-h-11 cursor-pointer items-start gap-3 rounded-[12px] px-2.5 py-2.5 text-[14px] font-medium tracking-[-0.015em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141414]/25 ${childHover}`
                            : `flex items-center gap-3 rounded-[12px] px-3 py-2 text-[14px] font-medium tracking-[-0.018em] transition-colors ${childHover}`
                        }
                        style={{ fontFamily: DISPLAY }}
                      >
                        {child.icon && NAVBAR !== "v2" ? (
                          <NavIcon name={child.icon} className={`${v2 ? "mt-0.5 h-5 w-5" : "h-6 w-6"} shrink-0`} />
                        ) : null}
                        {v2 ? (
                          <span className="min-w-0">
                            <span className="block text-[14px] leading-5 tracking-[-0.015em]">
                              {child.label}
                            </span>
                            {child.description ? (
                              <span className="mt-0.5 block text-pretty text-[13px] font-normal leading-[1.45] text-[#3e4c5e]">
                                {child.description}
                              </span>
                            ) : null}
                          </span>
                        ) : (
                          child.label
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MobileNav({
  open,
  onDark,
  reduceMotion,
  onClose,
}: {
  open: boolean;
  onDark: boolean;
  reduceMotion: boolean;
  onClose: () => void;
}) {
  const [openLabel, setOpenLabel] = useState<string | null>(null);
  const v2 = NAVBAR !== "wide";
  const sheetDark = onDark && !v2;

  useEffect(() => {
    if (!open) setOpenLabel(null);
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
    <motion.div
      role="navigation"
      aria-label="Mobile"
      initial={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, y: -10, scale: 0.98, filter: "blur(10px)" }
      }
      animate={
        reduceMotion
          ? { opacity: 1 }
          : { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
      }
      exit={
        reduceMotion
          ? { opacity: 0 }
          : { opacity: 0, y: -8, scale: 0.985, filter: "blur(8px)" }
      }
      transition={{ duration: reduceMotion ? 0.12 : 0.32, ease: MENU_EASE }}
      className={`lg:hidden absolute top-full left-0 right-0 mt-2 overflow-y-auto overflow-x-hidden border backdrop-blur-2xl ${
        v2
          ? "max-h-[min(82vh,760px)] rounded-2xl border-black/[0.08] bg-white/96 text-[#141414] shadow-[0_24px_70px_-28px_rgba(3,3,2,0.28)]"
          : `max-h-[min(78vh,640px)] rounded-[22px] ${
              sheetDark
                ? "border-white/12 bg-black/55 text-white shadow-[0_28px_80px_-24px_rgba(0,0,0,0.65)]"
                : "border-black/8 bg-white/92 text-neutral-950 shadow-[0_28px_80px_-28px_rgba(0,0,0,0.28)]"
            }`
      }`}
      style={{ transformOrigin: "top center" }}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-8 top-0 h-px ${
          sheetDark
            ? "bg-gradient-to-r from-transparent via-white/35 to-transparent"
            : "bg-gradient-to-r from-transparent via-black/15 to-transparent"
        }`}
      />

      <nav className="px-2 pt-3 pb-1">
        {NAV_PRIMARY.map((item, index) => (
          <motion.div
            key={item.label}
            initial={
              reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10, rotateX: 12 }
            }
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.28,
              ease: MENU_EASE,
              delay: reduceMotion ? 0 : 0.04 + index * 0.03,
            }}
            style={{ transformOrigin: "top center" }}
          >
            <MobileSection
              item={item}
              open={openLabel === item.label}
              onToggle={() =>
                setOpenLabel((current) =>
                  current === item.label ? null : item.label
                )
              }
              onNavigate={onClose}
              onDark={onDark}
            />
          </motion.div>
        ))}
      </nav>

      <div className={`mx-5 h-px ${sheetDark ? "bg-white/10" : "bg-black/8"}`} />

      <div className="px-3 py-3">
        <SignedIn>
          <Link
            href="/app/studio"
            onClick={onClose}
            className={`flex min-h-11 cursor-pointer items-center justify-center rounded-full px-4 py-3 text-[14px] font-semibold tracking-[-0.02em] transition-transform duration-300 active:scale-[0.98] ${
              sheetDark ? "bg-white text-black" : "bg-[#141414] text-white"
            }`}
          >
            App
          </Link>
        </SignedIn>
        <SignedOut>
          <div className={`flex flex-col ${v2 ? "gap-2" : "gap-1.5"}`}>
            <SignInButton mode="modal">
              <button
                type="button"
                onClick={onClose}
                className={`rounded-full px-4 text-[14px] font-medium tracking-[-0.02em] transition-colors ${
                  v2
                    ? "min-h-11 cursor-pointer text-[#3e4c5e] hover:bg-black/[0.04] hover:text-[#141414]"
                    : onDark
                      ? "py-2.5 text-white/80 hover:bg-white/8 hover:text-white"
                      : "py-2.5 text-neutral-600 hover:bg-black/[0.04] hover:text-neutral-950"
                }`}
              >
                Log in
              </button>
            </SignInButton>
            <a
              href="https://cal.com/hydrilla"
              onClick={onClose}
              className={`cursor-pointer rounded-full px-4 py-3 text-center text-[14px] font-semibold tracking-[-0.02em] transition-transform duration-300 active:scale-[0.98] ${
                v2
                  ? "min-h-11 border border-black/10 bg-white text-[#141414] hover:bg-[#f6f7f8]"
                  : sheetDark
                    ? "bg-white text-black"
                    : "bg-neutral-950 text-white"
              }`}
            >
              Book demo
            </a>
            <SignUpButton mode="modal">
              <button
                type="button"
                onClick={onClose}
                className={`cursor-pointer rounded-full px-4 py-3 text-[14px] font-semibold tracking-[-0.02em] transition-transform duration-300 active:scale-[0.98] ${
                  v2 ? "min-h-11 bg-[#141414] text-white hover:bg-[#2a2a2a]" : ""
                } ${
                  !v2 && sheetDark
                    ? "bg-white text-black"
                    : !v2
                      ? "bg-neutral-950 text-white"
                      : ""
                }`}
              >
                Get started
              </button>
            </SignUpButton>
          </div>
        </SignedOut>
      </div>
    </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
