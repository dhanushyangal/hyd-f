import Link from "next/link";
import { BRAND_SENTENCE } from "@/lib/brand";

const DISPLAY =
  "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif";
const BODY = "var(--font-dm-sans), 'DM Sans', sans-serif";

const STEPS = [
  "Describe the asset or drop a reference image.",
  "BlueFox 1 generates a segmented mesh with PBR maps (base color, metalness, roughness, normals).",
  "Preview in the browser. Inspect materials and parts before you download.",
  "Export GLB, FBX, OBJ, or USDZ and drop into your engine or DCC.",
];

/**
 * Server-rendered homepage copy so crawlers and LLM fetchers that skip JS
 * still see the brand sentence, the three entities, and the four-step loop.
 */
export default function HomeEntityIntro() {
  return (
    <section
      className="w-full border-t border-neutral-200 bg-white px-5 py-16 sm:px-6 sm:py-20 md:py-24"
      style={{ fontFamily: BODY }}
    >
      <div className="mx-auto max-w-3xl">
        <p className="text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          {BRAND_SENTENCE} Generate from a text prompt or a reference image,
          preview in the browser, and export GLB, FBX, OBJ, or USDZ into Unity,
          Unreal, Blender, and other pipelines.
        </p>

        <ul className="mt-8 space-y-3 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          <li>
            <strong className="font-semibold text-neutral-950">Hydrilla</strong>{" "}
            is the product: studio, workspaces, credits, preview, and export.
          </li>
          <li>
            <Link
              href="/bluefox3d"
              className="font-semibold text-neutral-950 underline underline-offset-2"
            >
              BlueFox 3D
            </Link>{" "}
            is the model family.{" "}
            <strong className="font-semibold text-neutral-950">BlueFox 1</strong>{" "}
            is the model that runs generation today.
          </li>
          <li>
            <Link
              href="/research"
              className="font-semibold text-neutral-950 underline underline-offset-2"
            >
              Hawan Research Labs
            </Link>{" "}
            builds BlueFox.
          </li>
        </ul>

        <h2
          className="mt-14 text-[22px] font-semibold tracking-[-0.03em] text-neutral-950 sm:text-[26px]"
          style={{ fontFamily: DISPLAY }}
        >
          How it works
        </h2>
        <ol className="mt-5 list-decimal space-y-3 pl-5 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          {STEPS.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>

        <h2
          className="mt-14 text-[22px] font-semibold tracking-[-0.03em] text-neutral-950 sm:text-[26px]"
          style={{ fontFamily: DISPLAY }}
        >
          Who it is for
        </h2>
        <p className="mt-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          3D artists, technical artists, indie teams, and studios filling props,
          environments, visualization, and concept meshes.
        </p>
        <p className="mt-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          Hydrilla is for production-ready generated assets you can refine. It
          is not CAD, not print-ready engineering, and not a finished hero with
          no artist pass.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/sign-up"
            className="inline-flex items-center rounded-xl bg-[#111] px-5 py-3 text-[15px] font-semibold text-white hover:bg-neutral-800"
          >
            Start for free
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center rounded-xl border border-neutral-300 px-5 py-3 text-[15px] font-semibold text-neutral-950 hover:bg-neutral-50"
          >
            Book a demo
          </Link>
        </div>
      </div>
    </section>
  );
}
