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
  const hover = onDark ? "hover:bg-white/8" : "hover:bg-black/[0.04]";
  const muted = onDark ? "text-white/35" : "text-black/30";
  const heading = onDark ? "text-white/40" : "text-neutral-400";
  const childHover = onDark
    ? "text-white/88 hover:bg-white/8 hover:text-white"
    : "text-neutral-800 hover:bg-black/[0.04] hover:text-neutral-950";

  if (!item.columns?.length) {
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`flex items-center justify-between rounded-[14px] px-3.5 py-3 text-[16px] font-medium tracking-[-0.022em] transition-colors ${hover}`}
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
        className={`flex w-full items-center justify-between rounded-[14px] px-3.5 py-3 text-left text-[16px] font-medium tracking-[-0.022em] transition-colors ${hover}`}
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
          <div className={`mx-3 mb-2 ml-4 border-l pl-2 ${onDark ? "border-white/12" : "border-black/8"}`}>
            {item.columns.map((column) => (
              <div key={column.heading} className="mb-3 last:mb-0">
                <p
                  className={`px-3.5 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] ${heading}`}
                >
                  {column.heading}
                </p>
                <ul>
                  {column.items.map((child) => (
                    <li key={`${column.heading}-${child.href}-${child.label}`}>
                      <Link
                        href={child.href}
                        onClick={onNavigate}
                        className={`flex items-center gap-3 rounded-[12px] px-3 py-2 text-[14px] font-medium tracking-[-0.018em] transition-colors ${childHover}`}
                        style={{ fontFamily: DISPLAY }}
                      >
                        {child.icon ? (
                          <NavIcon name={child.icon} className="h-6 w-6 shrink-0" />
                        ) : null}
                        {child.label}
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
      className={`lg:hidden absolute top-full left-0 right-0 mt-2 max-h-[min(78vh,640px)] overflow-y-auto overflow-x-hidden rounded-[22px] border ${
        onDark
          ? "border-white/12 bg-black/55 text-white shadow-[0_28px_80px_-24px_rgba(0,0,0,0.65)]"
          : "border-black/8 bg-white/92 text-neutral-950 shadow-[0_28px_80px_-28px_rgba(0,0,0,0.28)]"
      } backdrop-blur-2xl`}
      style={{ transformOrigin: "top center" }}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-x-8 top-0 h-px ${
          onDark
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

      <div className={`mx-5 h-px ${onDark ? "bg-white/10" : "bg-black/8"}`} />

      <div className="px-3 py-3">
        <SignedIn>
          <Link
            href="/generate"
            onClick={onClose}
            className={`flex items-center justify-center rounded-full px-4 py-3 text-[14px] font-semibold tracking-[-0.02em] transition-transform duration-300 active:scale-[0.98] ${
              onDark ? "bg-white text-black" : "bg-neutral-950 text-white"
            }`}
          >
            Generate
          </Link>
        </SignedIn>
        <SignedOut>
          <div className="flex flex-col gap-1.5">
            <SignInButton mode="modal">
              <button
                type="button"
                onClick={onClose}
                className={`rounded-full px-4 py-2.5 text-[14px] font-medium tracking-[-0.02em] transition-colors ${
                  onDark
                    ? "text-white/80 hover:bg-white/8 hover:text-white"
                    : "text-neutral-600 hover:bg-black/[0.04] hover:text-neutral-950"
                }`}
              >
                Log in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button
                type="button"
                onClick={onClose}
                className={`rounded-full px-4 py-3 text-[14px] font-semibold tracking-[-0.02em] transition-transform duration-300 active:scale-[0.98] ${
                  onDark ? "bg-white text-black" : "bg-neutral-950 text-white"
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
