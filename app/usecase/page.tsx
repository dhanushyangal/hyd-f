"use client";

import Link from "next/link";
import Footer from "../../components/layout/Footer";
import { USE_CASE_NAV } from "@/lib/usecases";
import { ArrowRight } from "lucide-react";

export default function UseCasesPage() {
  return (
    <>
      <main className="w-full bg-white font-dm-sans antialiased">
        <section className="border-b border-neutral-200/80 bg-[#fafafa] px-5 pb-16 pt-28 sm:px-6 sm:pb-20 sm:pt-36">
          <div className="mx-auto max-w-3xl">
            <div className="inline-flex overflow-hidden border border-neutral-200 bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              <span className="inline-flex items-center bg-[#c8e05a] px-3.5 py-2.5 text-[13px] font-semibold tracking-tight text-neutral-950">
                Hydrilla for
              </span>
              <span className="inline-flex items-center border-l border-neutral-200 px-3.5 py-2.5 text-[13px] font-semibold tracking-tight text-neutral-900">
                every pipeline
              </span>
            </div>

            <h1 className="mt-6 text-[36px] font-semibold leading-[1.08] tracking-[-0.035em] text-neutral-950 sm:text-[48px] lg:text-[52px]">
              Use cases built for production
            </h1>
            <p className="mt-4 max-w-xl text-[16px] leading-7 text-neutral-600 sm:text-[17px]">
              Game, film, architecture, XR, and product teams—same workflow, industry-ready exports.
            </p>
          </div>
        </section>

        <section className="px-5 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASE_NAV.map((uc) => {
              const Icon = uc.Icon;
              return (
                <Link
                  key={uc.href}
                  href={uc.href}
                  className="group flex flex-col gap-4 border border-neutral-200 bg-white p-6 transition-colors hover:border-neutral-400 hover:bg-neutral-50/50"
                >
                  <span className="flex h-10 w-10 items-center justify-center border border-neutral-200 bg-neutral-50 text-neutral-800">
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-[16px] font-semibold tracking-tight text-neutral-950">
                      {uc.title}
                    </h2>
                    <p className="mt-1.5 text-[14px] leading-6 text-neutral-600">
                      {uc.blurb}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold tracking-tight text-neutral-950">
                    Explore
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
