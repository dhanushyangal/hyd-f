import Link from "next/link";
import Footer from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <>
      <main className="flex min-h-[70vh] w-full flex-col items-center justify-center bg-white px-6 pt-28 pb-16 text-center font-dm-sans">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
          404
        </p>
        <h1
          className="mt-4 text-[36px] font-semibold leading-[1.08] tracking-[-0.035em] text-neutral-950 sm:text-[48px]"
          style={{
            fontFamily:
              "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif",
          }}
        >
          Page not found
        </h1>
        <p className="mt-4 max-w-md text-[16px] leading-7 text-neutral-600">
          That URL is not on Hydrilla. Head home, or open Features, Pricing, or Docs.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center rounded-xl bg-[#111] px-5 py-3 text-[15px] font-semibold text-white hover:bg-neutral-800"
          >
            Back to Home
          </Link>
          <Link
            href="/docs"
            className="inline-flex items-center rounded-xl border border-neutral-300 px-5 py-3 text-[15px] font-semibold text-neutral-950 hover:bg-neutral-50"
          >
            Docs
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
