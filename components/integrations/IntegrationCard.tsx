import Link from "next/link";
import type { Integration } from "@/lib/integrations";

const STATUS_LABEL: Record<Integration["status"], string> = {
  available: "Available",
  bridge: "Bridge",
  coming_soon: "Coming soon",
};

const STATUS_CLASS: Record<Integration["status"], string> = {
  available: "bg-emerald-50 text-emerald-800",
  bridge: "bg-sky-50 text-sky-800",
  coming_soon: "bg-neutral-100 text-neutral-600",
};

export function IntegrationCard({ item }: { item: Integration }) {
  return (
    <Link
      href={`/integrations/${item.slug}`}
      className="group block rounded-2xl border border-neutral-200/80 bg-white p-5 transition hover:border-neutral-300 hover:bg-neutral-50/80"
    >
      <div className="flex items-start justify-between gap-3">
        <h3
          className="text-[17px] font-semibold tracking-[-0.03em] text-neutral-950"
          style={{
            fontFamily:
              "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif",
          }}
        >
          {item.name}
        </h3>
        <span
          className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-[0.02em] ${STATUS_CLASS[item.status]}`}
        >
          {STATUS_LABEL[item.status]}
        </span>
      </div>
      <p className="mt-2.5 text-[14px] leading-6 text-neutral-600">{item.summary}</p>
      <span className="mt-3 inline-flex text-[13px] font-semibold text-neutral-950 transition group-hover:translate-x-0.5">
        Details →
      </span>
    </Link>
  );
}
