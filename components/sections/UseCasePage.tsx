"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useAuth, SignUpButton } from "@clerk/nextjs";
import {
  ChevronDown,
  Check,
  Boxes,
  Layers,
  Workflow,
  Download,
  Users,
  type LucideIcon,
} from "lucide-react";

import { USE_CASE_NAV, type UseCaseId } from "@/lib/usecases";
import { cn } from "@/lib/utils";

export interface UseCaseFeature {
  title: string;
  body: string;
  icon?: LucideIcon;
}

export interface UseCaseWho {
  role: string;
  description: string;
}

export interface UseCaseData {
  id: UseCaseId;
  headline: string;
  tagline: string;
  features: UseCaseFeature[];
  who: UseCaseWho[];
  heroImage?: string;
  heroImages?: string[];
  cardVertical?: boolean;
  /** Short SEO-friendly capability heading */
  capabilitiesHeading?: string;
  /** One concrete example so verticals do not read as clones. */
  example?: string;
}

const CAL_DEMO_URL = "https://cal.com/hydrilla";

const DEFAULT_FEATURE_ICONS: LucideIcon[] = [Boxes, Layers, Workflow, Download, Users];

function UseCaseSwitcher({ currentId }: { currentId: UseCaseId }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const current = USE_CASE_NAV.find((u) => u.id === currentId)!;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative z-30 inline-flex flex-col items-start">
      <div className="inline-flex items-stretch overflow-hidden border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <span className="inline-flex items-center bg-[#c8e05a] px-3.5 py-2.5 text-[13px] font-semibold tracking-tight text-neutral-950 sm:px-4">
          Hydrilla for
        </span>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 border-l border-neutral-200 bg-white px-3.5 py-2.5 text-[13px] font-semibold tracking-tight text-neutral-900 hover:bg-neutral-50 transition-colors sm:px-4"
        >
          {current.label}
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-neutral-500 transition-transform duration-200",
              open && "rotate-180"
            )}
            strokeWidth={2.25}
          />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] as const }}
            role="listbox"
            aria-label="Use cases"
            className="absolute left-0 top-[calc(100%+6px)] w-[min(100vw-2rem,320px)] border border-neutral-200 bg-white p-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.18)]"
          >
            {USE_CASE_NAV.map((item) => {
              const active = item.id === currentId;
              const Icon = item.Icon;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  role="option"
                  aria-selected={active}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-start gap-3 px-3 py-2.5 transition-colors",
                    active
                      ? "bg-neutral-950 text-white"
                      : "text-neutral-800 hover:bg-neutral-50"
                  )}
                >
                  <Icon
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      active ? "text-white/80" : "text-neutral-400"
                    )}
                    strokeWidth={1.75}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="text-[13px] font-semibold tracking-tight">
                        {item.label}
                      </span>
                      {active && <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5 block text-[12px] leading-snug",
                        active ? "text-white/65" : "text-neutral-500"
                      )}
                    >
                      {item.blurb}
                    </span>
                  </span>
                </Link>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PrimaryCta({
  isSignedIn,
  className,
}: {
  isSignedIn: boolean | undefined;
  className?: string;
}) {
  const base =
    "inline-flex h-12 items-center justify-center px-6 text-[14px] font-semibold tracking-tight transition-colors " +
    (className ?? "");

  if (isSignedIn) {
    return (
      <Link href="/app/studio" className={cn(base, "bg-neutral-950 text-white hover:bg-neutral-800")}>
        Start for free
      </Link>
    );
  }

  return (
    <SignUpButton mode="modal" forceRedirectUrl="/app/studio">
      <button
        type="button"
        className={cn(base, "bg-neutral-950 text-white hover:bg-neutral-800 border-0 cursor-pointer")}
      >
        Start for free
      </button>
    </SignUpButton>
  );
}

export default function UseCasePage({ data }: { data: UseCaseData }) {
  const { isSignedIn } = useAuth();
  const heroSources = data.heroImages?.length
    ? data.heroImages
    : data.heroImage
      ? [data.heroImage]
      : [];
  const [cyclingIndex, setCyclingIndex] = useState(0);

  useEffect(() => {
    if (heroSources.length <= 1) return;
    const t = setInterval(() => {
      setCyclingIndex((i) => (i + 1) % heroSources.length);
    }, 4500);
    return () => clearInterval(t);
  }, [heroSources.length]);

  const displayHeroSrc = heroSources[cyclingIndex] ?? heroSources[0];
  const hasHero = Boolean(displayHeroSrc);

  return (
    <main className="w-full bg-white font-dm-sans antialiased">
      {/* Hero — Clay-style: switcher + headline + CTA + image */}
      <section className="relative overflow-hidden border-b border-neutral-200/80 bg-[#fafafa]">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 pb-14 pt-28 sm:px-6 sm:pb-16 sm:pt-32 lg:grid-cols-[minmax(0,1fr)_minmax(280px,480px)] lg:items-end lg:gap-12 lg:pb-20 lg:pt-36">
          <div className="flex min-w-0 flex-col items-start gap-6">
            <UseCaseSwitcher currentId={data.id} />

            <div className="max-w-xl">
              <h1 className="text-[36px] font-semibold leading-[1.08] tracking-[-0.035em] text-neutral-950 sm:text-[44px] lg:text-[52px]">
                {data.headline}
              </h1>
              <p className="mt-4 max-w-lg text-[16px] leading-7 text-neutral-600 sm:text-[17px]">
                {data.tagline}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <PrimaryCta isSignedIn={isSignedIn} />
              <a
                href={CAL_DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-12 items-center justify-center border border-neutral-300 bg-white px-6 text-[14px] font-semibold tracking-tight text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                Book a demo
              </a>
            </div>
          </div>

          {hasHero && displayHeroSrc && (
            <div
              className={cn(
                "relative w-full overflow-hidden border border-neutral-200/80 bg-neutral-100 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.25)]",
                data.cardVertical ? "aspect-[3/4] max-h-[520px]" : "aspect-[4/5] max-h-[480px] lg:aspect-[5/6]"
              )}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={displayHeroSrc}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={displayHeroSrc}
                    alt=""
                    fill
                    sizes="(max-width: 1024px) 100vw, 480px"
                    className="object-cover object-center"
                    priority
                    unoptimized
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </section>

      {/* Capabilities */}
      <section className="border-b border-neutral-200/80 bg-white px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
              Capabilities
            </p>
            <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-neutral-950 sm:text-[32px]">
              {data.capabilitiesHeading ?? "Built for your pipeline"}
            </h2>
            {data.example ? (
              <p className="mt-4 text-[16px] leading-7 text-neutral-600">
                {data.example}
              </p>
            ) : null}
          </div>

          <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden border border-neutral-200 bg-neutral-200 sm:grid-cols-2">
            {data.features.map((feature, idx) => {
              const Icon = feature.icon ?? DEFAULT_FEATURE_ICONS[idx % DEFAULT_FEATURE_ICONS.length];
              return (
                <div
                  key={feature.title}
                  className="flex gap-4 bg-white p-6 sm:p-7"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 bg-neutral-50 text-neutral-800">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-[15px] font-semibold tracking-tight text-neutral-950">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 text-[14px] leading-6 text-neutral-600">
                      {feature.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Who */}
      <section className="border-b border-neutral-200/80 bg-[#fafafa] px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">
              Teams
            </p>
            <h2 className="mt-2 text-[28px] font-semibold tracking-[-0.03em] text-neutral-950 sm:text-[32px]">
              Who uses Hydrilla
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {data.who.map((item) => (
              <div
                key={item.role}
                className="border border-neutral-200 bg-white p-5"
              >
                <p className="text-[14px] font-semibold tracking-tight text-neutral-950">
                  {item.role}
                </p>
                <p className="mt-2 text-[13px] leading-6 text-neutral-600">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-neutral-950 px-5 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto flex max-w-3xl flex-col items-start gap-6 sm:items-center sm:text-center">
          <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-white sm:text-[36px]">
            Start generating today
          </h2>
          <p className="max-w-md text-[15px] leading-7 text-neutral-400">
            Production-ready 3D from text or image. Export GLB, FBX, OBJ, and USDZ.
          </p>
          <div className="flex flex-wrap gap-3 sm:justify-center">
            <PrimaryCta
              isSignedIn={isSignedIn}
              className="!bg-white !text-neutral-950 hover:!bg-neutral-100"
            />
            <a
              href={CAL_DEMO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center border border-white/25 px-6 text-[14px] font-semibold tracking-tight text-white hover:bg-white/5 transition-colors"
            >
              Book a demo
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
