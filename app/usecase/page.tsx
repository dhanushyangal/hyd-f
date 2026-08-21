import Link from "next/link";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { USE_CASE_NAV } from "@/lib/usecases";

export default function UseCasesPage() {
  return (
    <MarketingPage
      eyebrow="Solutions"
      title="Use cases built for production"
      description="Game, film, architecture, XR, and product teams. Same BlueFox 1 workflow, industry-ready exports."
      related={[
        { label: "Features", href: "/features", hint: "Generate, preview, export" },
        { label: "Docs", href: "/docs", hint: "First prompt to a file" },
        { label: "Enterprise", href: "/enterprise", hint: "Studio volume" },
      ]}
    >
      <section className="mx-auto max-w-[42rem] px-5 py-14 sm:px-6 sm:py-16">
        <ul className="grid gap-3">
          {USE_CASE_NAV.map((uc) => {
            const Icon = uc.Icon;
            return (
              <li key={uc.href}>
                <Link
                  href={uc.href}
                  className="group flex gap-4 border border-neutral-200 bg-white p-5 transition-colors hover:border-[#7eb8e8] hover:bg-[#f8fafc]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-neutral-200 bg-neutral-50 text-neutral-800">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[16px] font-semibold tracking-tight text-neutral-950">
                      {uc.title}
                    </span>
                    <span className="mt-1.5 block text-[14px] leading-6 text-neutral-600">
                      {uc.blurb}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </MarketingPage>
  );
}
