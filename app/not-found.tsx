import type { Metadata } from "next";
import Link from "next/link";
import { preload } from "react-dom";
import Footer from "@/components/layout/Footer";
import { NotFoundGrass } from "@/components/not-found/NotFoundGrass";
import { NOT_FOUND_GRASS_URL } from "@/lib/cloudinary";
import { GEIST_FONT, SANS_FONT } from "@/lib/fonts";
import { NOT_FOUND_PAGE } from "@/lib/not-found-page";

export const metadata: Metadata = {
  title: "404 — Page not found | Hydrilla",
};

function DesktopNotFound() {
  return (
    <>
      <main className="relative flex min-h-[calc(100dvh-4rem)] w-full flex-col items-center justify-center overflow-hidden bg-white px-6 pt-28 pb-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(215,228,248,0.9),transparent_58%)]" />
          <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(to_right,rgba(0,12,31,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,12,31,0.045)_1px,transparent_1px)] [background-size:80px_80px] [mask-image:radial-gradient(ellipse_at_center,black_18%,transparent_72%)]" />
          <div className="absolute top-16 left-1/2 h-[380px] w-[min(820px,90vw)] -translate-x-1/2 rounded-full bg-[#d5e4f8]/65 blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-2xl flex-col items-center text-center">
          <p
            aria-hidden
            className="font-medium text-[#000c1f] select-none"
            style={{
              fontFamily: SANS_FONT,
              fontSize: "clamp(5.25rem, calc(3.2rem + 9vw), 9.5rem)",
              lineHeight: 0.88,
              letterSpacing: "-0.045em",
            }}
          >
            404
          </p>

          <h1
            className="mt-4 text-balance font-medium text-[#000c1f]"
            style={{
              fontFamily: SANS_FONT,
              fontSize: "clamp(2rem, calc(1.45rem + 2.2vw), 3.25rem)",
              lineHeight: 1.04,
              letterSpacing: "-0.03em",
            }}
          >
            You are lost.
          </h1>

          <p
            className="mt-4 max-w-md text-pretty text-[1.0625rem] leading-[1.55] tracking-[-0.01em] text-[#000c1f]/65 sm:text-[1.1875rem]"
            style={{ fontFamily: GEIST_FONT }}
          >
            The page you’re looking for doesn’t exist or has been moved. Head back home or open the studio.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#000c1f] px-6 py-2.5 text-[0.95rem] font-medium text-white transition-opacity hover:opacity-90 active:scale-[0.98]"
              style={{ fontFamily: SANS_FONT }}
            >
              Back to Home →
            </Link>
            <Link
              href="/app/studio"
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-[#000c1f]/15 bg-white/80 px-6 py-2.5 text-[0.95rem] font-normal text-[#000c1f] backdrop-blur-sm transition-[background-color,border-color,transform] duration-200 ease-out hover:border-[#000c1f]/30 hover:bg-[#000c1f]/[0.03] active:scale-[0.98]"
              style={{ fontFamily: SANS_FONT }}
            >
              Open Studio
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function NotFound() {
  if (NOT_FOUND_PAGE === "grass3d") {
    preload(NOT_FOUND_GRASS_URL, {
      as: "fetch",
      crossOrigin: "anonymous",
      fetchPriority: "high",
    });

    return (
      <>
        <NotFoundGrass />
        <div className="relative z-10">
          <Footer />
        </div>
      </>
    );
  }

  return <DesktopNotFound />;
}
