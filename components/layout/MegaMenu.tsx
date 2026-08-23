import Link from "next/link";
import type { NavFeatured, NavGroup } from "@/lib/nav";
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
}: {
  featured: NavFeatured;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={featured.href}
      onClick={onNavigate}
      className="group relative hidden min-h-55 w-60 shrink-0 flex-col justify-between overflow-hidden rounded-[22px] bg-[linear-gradient(160deg,#0F3F3A_0%,#16756C_52%,#1FA89A_100%)] p-5 text-white xl:flex xl:w-[280px]"
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
      </div>
    </Link>
  );
}

export function MegaMenu({
  group,
  onNavigate,
}: {
  group: NavGroup;
  onNavigate?: () => void;
}) {
  if (!group.columns?.length) return null;

  return (
    <div
      className="overflow-hidden rounded-[28px] border border-black/[0.06] bg-white shadow-[0_28px_80px_-32px_rgba(0,0,0,0.42)]"
      role="region"
      aria-label={`${group.label} menu`}
    >
      <div className="flex items-stretch gap-6 p-6 md:gap-8 md:px-8 md:py-7">
        <div className="flex min-w-0 flex-1 justify-between gap-6 md:gap-8">
          {group.columns.map((column) => (
            <div key={column.heading} className="min-w-0 flex-1">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                {column.heading}
              </p>
              <ul className="space-y-0.5">
                {column.items.map((item) => (
                  <li key={`${column.heading}-${item.href}-${item.label}`}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className="flex items-center gap-3 rounded-xl px-1.5 py-2 text-[14px] font-medium tracking-[-0.018em] text-neutral-900 transition-colors hover:bg-neutral-50"
                      style={{ fontFamily: DISPLAY }}
                    >
                      {item.icon ? <NavIcon name={item.icon} /> : null}
                      <span>{item.label}</span>
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
