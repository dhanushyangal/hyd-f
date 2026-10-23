import Link from "next/link";
import type { NavFeatured, NavGroup } from "@/lib/nav";
import { NAVBAR } from "@/lib/nav-chrome";
import { NavIcon } from "./NavIcons";

const DISPLAY =
  "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif";

function FeaturedVisual({ visual }: { visual: NavFeatured["visual"] }) {
  if (visual === "formats") {
    return (
      <div className="flex items-center gap-1.5 rounded-full bg-white/92 px-2.5 py-1.5 shadow-sm">
        {["GLB", "FBX", "OBJ", "USDZ"].map((format) => (
          <span
            key={format}
            className="inline-flex h-8 min-w-8 items-center justify-center rounded-full bg-neutral-100 px-2 text-[10px] font-bold tracking-[0.04em] text-neutral-800"
          >
            {format}
          </span>
        ))}
      </div>
    );
  }

  if (visual === "game") {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
        <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden>
          <rect x="6" y="16" width="36" height="20" rx="10" fill="white" />
          <path d="M16 22v8M12 26h8" stroke="#0F766E" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="30" cy="24" r="2" fill="#F43F5E" />
          <circle cx="35" cy="28" r="2" fill="#F59E0B" />
        </svg>
      </div>
    );
  }

  if (visual === "docs") {
    return (
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
        <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden>
          <path d="M14 8h14l8 8v24H14a4 4 0 01-4-4V12a4 4 0 014-4z" fill="white" />
          <path d="M28 8v8h8" fill="#99F6E4" />
          <path d="M18 24h14M18 30h10" stroke="#0F766E" strokeWidth="2.2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
      <svg viewBox="0 0 48 48" className="h-10 w-10" fill="none" aria-hidden>
        <circle cx="22" cy="22" r="11" stroke="white" strokeWidth="3" />
        <path d="M30 30l8 8" stroke="white" strokeWidth="3" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function FeaturedCard({
  featured,
  onNavigate,
  variant = "v1",
}: {
  featured: NavFeatured;
  onNavigate?: () => void;
  variant?: "v1" | "v2";
}) {
  if (variant === "v2") {
    return (
      <Link
        href={featured.href}
        onClick={onNavigate}
        className="group hidden w-[248px] shrink-0 flex-col justify-between rounded-xl bg-[linear-gradient(165deg,#000c1f_0%,#002664_62%,#1a4d9e_100%)] p-4 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141414]/30 focus-visible:ring-offset-2 xl:flex"
      >
        <FeaturedVisual visual={featured.visual} />
        <div className="mt-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
            {featured.eyebrow}
          </p>
          <p
            className="mt-2 text-pretty text-[15px] font-semibold leading-snug tracking-[-0.02em]"
            style={{ fontFamily: DISPLAY }}
          >
            {featured.title}
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-white/85 transition-transform duration-300 group-hover:translate-x-0.5">
            Explore
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={featured.href}
      onClick={onNavigate}
      className="group relative hidden min-h-55 w-60 shrink-0 flex-col justify-between overflow-hidden rounded-[22px] bg-[linear-gradient(165deg,#000c1f_0%,#002664_62%,#1a4d9e_100%)] p-5 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.16)] xl:flex xl:w-[280px]"
    >
      <FeaturedVisual visual={featured.visual} />
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
          {featured.eyebrow}
        </p>
        <p
          className="mt-2 text-[17px] font-semibold leading-snug tracking-[-0.03em]"
          style={{ fontFamily: DISPLAY }}
        >
          {featured.title}
        </p>
        <span className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-white/80 transition-transform duration-300 group-hover:translate-x-0.5">
          Explore
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
    </Link>
  );
}

function MegaMenuV2({
  group,
  onNavigate,
}: {
  group: NavGroup;
  onNavigate?: () => void;
}) {
  if (!group.columns?.length) return null;

  return (
    <div
      className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white/96 shadow-[0_24px_70px_-28px_rgba(3,3,2,0.32)] backdrop-blur-xl"
      role="region"
      aria-label={`${group.label} menu`}
    >
      <div className="flex items-center justify-between gap-4 border-b border-black/[0.06] px-5 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4b5568]">
          {group.label}
        </p>
        <Link
          href={group.href}
          onClick={onNavigate}
          className="inline-flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-[13px] font-medium tracking-[-0.01em] text-[#141414] transition-colors hover:bg-black/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141414]/25"
          style={{ fontFamily: DISPLAY }}
        >
          Overview
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
            <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>

      <div className="flex items-stretch gap-3 p-3">
        <div
          className="grid min-w-0 flex-1"
          style={{
            gridTemplateColumns: `repeat(${group.columns.length}, minmax(0, 1fr))`,
          }}
        >
          {group.columns.map((column) => (
            <section
              key={column.heading}
              className="min-w-0 border-l border-black/[0.06] px-3 py-2 first:border-l-0 first:pl-2"
            >
              <div className="mb-2 flex items-center gap-3 px-2">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4b5568]">
                  {column.heading}
                </p>
                <span aria-hidden className="h-px min-w-4 flex-1 bg-black/[0.08]" />
              </div>
              <ul className="space-y-0.5">
                {column.items.map((item) => (
                  <li key={`${column.heading}-${item.href}-${item.label}`}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className="group flex cursor-pointer items-start gap-3 rounded-xl px-2 py-2.5 transition-colors duration-200 hover:bg-[#f4f6f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#141414]/25"
                    >
                      {item.icon ? (
                        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f3f5f7] ring-1 ring-black/[0.05]">
                          <NavIcon name={item.icon} className="h-5 w-5" />
                        </span>
                      ) : null}
                      <span className="min-w-0 pt-0.5">
                        <span
                          className="block text-[14px] font-medium leading-5 tracking-[-0.015em] text-[#121212]"
                          style={{ fontFamily: DISPLAY }}
                        >
                          {item.label}
                        </span>
                        {item.description ? (
                          <span className="mt-0.5 block text-pretty text-[13px] leading-[1.45] text-[#3e4c5e]">
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        {group.featured ? (
          <FeaturedCard featured={group.featured} onNavigate={onNavigate} variant="v2" />
        ) : null}
      </div>
    </div>
  );
}

function MegaMenuAligned({
  group,
  onNavigate,
}: {
  group: NavGroup;
  onNavigate?: () => void;
}) {
  if (!group.columns?.length) return null;

  return (
    <div
      className="overflow-hidden rounded-[20px] bg-white text-[#000c1f] shadow-[0_28px_70px_-32px_rgba(0,12,31,0.45)]"
      role="region"
      aria-label={`${group.label} menu`}
    >
      <div className="flex items-baseline justify-between gap-6 px-6 pt-5 pb-1">
        <p className="text-[20px] font-medium leading-none tracking-[-0.03em]" style={{ fontFamily: DISPLAY }}>
          {group.label}
        </p>
        <Link
          href={group.href}
          onClick={onNavigate}
          className="inline-flex cursor-pointer items-center gap-1.5 text-[14px] font-medium tracking-[-0.01em] text-[#000c1f] underline decoration-[#000c1f]/25 underline-offset-4 transition-colors hover:decoration-[#000c1f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000c1f]/25"
          style={{ fontFamily: DISPLAY }}
        >
          Overview
        </Link>
      </div>

      <div className="flex items-stretch gap-2 px-3 pt-3 pb-3">
        <div
          className="grid min-w-0 flex-1 gap-1"
          style={{
            gridTemplateColumns: `repeat(${group.columns.length}, minmax(0, 1fr))`,
          }}
        >
          {group.columns.map((column) => (
            <section key={column.heading} className="min-w-0 px-2 py-2">
              <p className="px-2 pb-1.5 text-[13px] font-medium tracking-[-0.01em] text-[#000c1f]/55">
                {column.heading}
              </p>
              <ul className="space-y-0.5">
                {column.items.map((item) => (
                  <li key={`${column.heading}-${item.href}-${item.label}`}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className="flex cursor-pointer flex-col rounded-lg px-2 py-2 transition-colors duration-200 hover:bg-[#000c1f]/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000c1f]/25"
                    >
                      <span
                        className="block text-[15px] font-medium leading-5 tracking-[-0.02em] text-[#000c1f]"
                        style={{ fontFamily: DISPLAY }}
                      >
                        {item.label}
                      </span>
                      {item.description ? (
                        <span className="mt-0.5 block text-pretty text-[13px] leading-5 text-[#000c1f]/65">
                          {item.description}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
        {group.featured ? (
          <Link
            href={group.featured.href}
            onClick={onNavigate}
            className="group hidden w-[220px] shrink-0 flex-col justify-between rounded-2xl bg-[#000c1f] p-5 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000c1f]/30 focus-visible:ring-offset-2 xl:flex"
          >
            <p className="text-[15px] font-medium leading-snug tracking-[-0.02em]" style={{ fontFamily: DISPLAY }}>
              {group.featured.title}
            </p>
            <span className="mt-6 text-[14px] text-white/75">
              {group.featured.eyebrow}
            </span>
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function MegaMenu({
  group,
  onNavigate,
}: {
  group: NavGroup;
  onNavigate?: () => void;
}) {
  if (NAVBAR === "v2") {
    return <MegaMenuAligned group={group} onNavigate={onNavigate} />;
  }

  if (NAVBAR !== "wide") {
    return <MegaMenuV2 group={group} onNavigate={onNavigate} />;
  }

  if (!group.columns?.length) return null;

  return (
    <div
      className="overflow-hidden rounded-[28px] border border-[#000c1f]/8 bg-white/95 shadow-[0_24px_70px_-28px_rgba(0,12,31,0.38)] backdrop-blur-xl"
      role="region"
      aria-label={`${group.label} menu`}
    >
      <div className="flex items-stretch gap-6 p-5 md:gap-7 md:px-7 md:py-6">
        <div className="flex min-w-0 flex-1 justify-between gap-5 md:gap-6">
          {group.columns.map((column) => (
            <div key={column.heading} className="min-w-0 flex-1">
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#000c1f]/40">
                {column.heading}
              </p>
              <ul className="space-y-0.5">
                {column.items.map((item) => (
                  <li key={`${column.heading}-${item.href}-${item.label}`}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className="group flex items-start gap-3 rounded-2xl px-2 py-2 transition-colors duration-200 hover:bg-[#f1f5fb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000c1f]/20"
                    >
                      {item.icon ? (
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f4f7fb] ring-1 ring-[#000c1f]/6 transition-colors duration-200 group-hover:bg-white">
                          <NavIcon name={item.icon} className="h-6 w-6" />
                        </span>
                      ) : null}
                      <span className="min-w-0 pt-0.5">
                        <span
                          className="block text-[14px] font-medium leading-tight tracking-[-0.02em] text-[#000c1f]"
                          style={{ fontFamily: DISPLAY }}
                        >
                          {item.label}
                        </span>
                        {item.description ? (
                          <span className="mt-1 block text-[12.5px] leading-snug text-[#000c1f]/55">
                            {item.description}
                          </span>
                        ) : null}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {group.featured ? (
          <FeaturedCard featured={group.featured} onNavigate={onNavigate} />
        ) : null}
      </div>
    </div>
  );
}
