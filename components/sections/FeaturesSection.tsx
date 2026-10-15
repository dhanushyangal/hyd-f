"use client";

import Image from "next/image";
import Link from "next/link";
import { SignUpButton, useAuth } from "@clerk/nextjs";
import { BlurReveal } from "@/components/ui/BlurReveal";
import { SANS_FONT as DISPLAY, GEIST_FONT as SANS } from "@/lib/fonts";
import { FEATURES_SECTION } from "@/lib/features-section";

type FeatureCard = {
  id: string;
  title: string;
  description: string;
  ctaLabel: string;
  /** Studio routes use auth gate; other paths are plain links. */
  ctaHref: string;
  ctaAuth: boolean;
  image: string;
  imageAlt: string;
  /** Desktop only — image on the left */
  imageLeft: boolean;
  /** Prefer contain for logo / diagram art that should not crop */
  imageContain?: boolean;
};

/** Original six cards — keep for rollback via FEATURES_SECTION = "classic". */
const CLASSIC_CARDS: FeatureCard[] = [
  {
    id: "01",
    title: "Text and image to production 3D",
    description:
      "Describe the asset or drop a reference. Hydrilla turns prompts and images into clean meshes you can refine, export, and ship.",
    ctaLabel: "Start for free today →",
    ctaHref: "/app/studio",
    ctaAuth: true,
    image: "/features/3d1.png",
    imageAlt: "Hydrilla text and image to 3D generation workspace",
    imageLeft: false,
  },
  {
    id: "02",
    title: "Intelligent segmentation that stays editable",
    description:
      "Meshes arrive already split into logical parts—so materials, cleanup, and iteration stay precise instead of starting from a solid blob.",
    ctaLabel: "Start for free today →",
    ctaHref: "/app/studio",
    ctaAuth: true,
    image: "/features/3d2.png",
    imageAlt: "Hydrilla intelligent mesh segmentation into editable parts",
    imageLeft: true,
  },
  {
    id: "03",
    title: "PBR materials that hold up in production",
    description:
      "Base color, metalness, roughness, and normals tuned for real lighting. Preview in-browser, then export maps ready for your pipeline.",
    ctaLabel: "Start for free today →",
    ctaHref: "/app/studio",
    ctaAuth: true,
    image: "/features/3d3.png",
    imageAlt: "Hydrilla PBR materials and texture maps preview",
    imageLeft: false,
  },
  {
    id: "05",
    title: "Export for Unity, Unreal, Blender, and more",
    description:
      "GLB, FBX, OBJ, and USDZ with topology and UVs that drop into game engines, DCC tools, and AR viewers without a rebuild.",
    ctaLabel: "Start for free today →",
    ctaHref: "/app/studio",
    ctaAuth: true,
    image: "/features/3d5.png",
    imageAlt: "Hydrilla multi-format 3D export for production pipelines",
    imageLeft: true,
  },
  {
    id: "06",
    title: "Real-time 3D preview while you work",
    description:
      "Orbit, inspect materials, and catch issues before download. Review assets in the browser so the handoff stays fast and clear.",
    ctaLabel: "Start for free today →",
    ctaHref: "/app/studio",
    ctaAuth: true,
    image: "/features/3d6.png",
    imageAlt: "Hydrilla real-time in-browser 3D preview",
    imageLeft: false,
  },
  {
    id: "07",
    title: "Team workspaces built for shared delivery",
    description:
      "Organize generations, keep versions together, and move from first draft to client-ready assets without scattering files across tools.",
    ctaLabel: "Start for free today →",
    ctaHref: "/app/studio",
    ctaAuth: true,
    image: "/features/3d7.png",
    imageAlt: "Hydrilla collaborative team workspace for 3D assets",
    imageLeft: true,
  },
];

/** Platform cards — text-to-3D through Water Agent. Active when FEATURES_SECTION = "v2". */
const V2_CARDS: FeatureCard[] = [
  {
    id: "01",
    title: "Text to 3D and image to 3D with BlueFox",
    description:
      "Start from a text prompt or a reference image. BlueFox returns a 3D model you can preview, refine, and ship into game, film, and product pipelines.",
    ctaLabel: "Generate with BlueFox →",
    ctaHref: "/app/studio",
    ctaAuth: true,
    image: "/new-features/3df1.png",
    imageAlt:
      "Text prompt and reference image generating an ornate fantasy dragon-knight helmet with BlueFox",
    imageLeft: false,
  },
  {
    id: "02",
    title: "Ship assets with production PBR maps",
    description:
      "Get base color, roughness, metalness, and normals with every mesh. Preview under lighting in Hydrilla, then export maps ready for real-time engines.",
    ctaLabel: "Explore PBR texturing →",
    ctaHref: "/app/studio",
    ctaAuth: true,
    image: "/new-features/3df2.png",
    imageAlt:
      "Fantasy dragon-knight helmet with PBR maps: base color, roughness, metalness, and normals",
    imageLeft: true,
  },
  {
    id: "03",
    title: "Edit logical parts in Hydrilla Studio",
    description:
      "Meshes arrive split into selectable components. Isolate parts, adjust materials, and refine structure without rebuilding the whole asset.",
    ctaLabel: "Open Hydrilla Studio →",
    ctaHref: "/app/studio",
    ctaAuth: true,
    image: "/new-features/3df3.png",
    imageAlt:
      "Exploded segmented fantasy helmet in Hydrilla Studio with selectable parts list",
    imageLeft: false,
  },
  {
    id: "04",
    title: "Run BlueFox generation in your stack",
    description:
      "Call text-to-3D and image-to-3D from your apps, tools, and pipelines. Same BlueFox model, delivered over REST for production workflows.",
    ctaLabel: "Explore the API →",
    ctaHref: "/api",
    ctaAuth: false,
    image: "/new-features/3df4.png",
    imageAlt:
      "Hydrilla API request and response generating a fantasy helmet GLB for your application",
    imageLeft: true,
  },
  {
    id: "05",
    title: "Generate inside your Blender scene",
    description:
      "Run BlueFox from Blender and import results into the viewport. Stay in your DCC while you generate, edit, and assemble assets.",
    ctaLabel: "Get the Blender plugin →",
    ctaHref: "/docs",
    ctaAuth: false,
    image: "/new-features/3df5.png",
    imageAlt: "Hydrilla connected to Blender for AI 3D generation in your scene",
    imageLeft: false,
    imageContain: true,
  },
  {
    id: "06",
    title: "Export for Unity, Unreal, and Blender",
    description:
      "Download GLB, FBX, OBJ, or USDZ and drop assets into the engines and DCCs your team already uses—including AR workflows with USDZ.",
    ctaLabel: "Explore export formats →",
    ctaHref: "/docs",
    ctaAuth: false,
    image: "/new-features/3df6.png",
    imageAlt:
      "Fantasy helmet exported as GLB, FBX, OBJ, and USDZ to Unity, Unreal Engine, Blender, and Houdini",
    imageLeft: true,
  },
  {
    id: "07",
    title: "Build asset kits with Water Agent",
    description:
      "Describe a prop set in conversation and iterate with Water Agent. Bring your own key and pick the model that powers each run.",
    ctaLabel: "Build with Water Agent →",
    ctaHref: "/app/studio",
    ctaAuth: true,
    image: "/new-features/3df7.png",
    imageAlt:
      "Water Agent chat building a fantasy prop kit with helmet, rune dagger, and supply crate",
    imageLeft: false,
  },
];

const FEATURE_CARDS =
  FEATURES_SECTION === "classic" ? CLASSIC_CARDS : V2_CARDS;

const IS_V3 = FEATURES_SECTION === "v3";

function CtaButton({
  label,
  href,
  auth,
  variant = "solid",
}: {
  label: string;
  href: string;
  auth: boolean;
  variant?: "solid" | "v3";
}) {
  const { isSignedIn } = useAuth();

  const className =
    variant === "v3"
      ? "inline-flex min-h-11 w-full items-center justify-center rounded-full border border-[#1d1c1a]/15 bg-transparent px-[1.25em] py-[0.75em] text-[1rem] font-normal leading-[1.3] text-[#1d1c1a] transition-[background-color,border-color,transform] duration-200 ease-out hover:border-[#1d1c1a]/30 hover:bg-[#1d1c1a]/[0.03] active:scale-[0.98] sm:w-fit"
      : "inline-flex w-fit items-center justify-center rounded-full bg-[#1d1c1a] px-[1.25em] py-[0.75em] text-[1rem] font-normal leading-[1.3] text-white transition-opacity hover:opacity-90";

  if (!auth || isSignedIn) {
    return (
      <Link href={href} className={className} style={{ fontFamily: DISPLAY }}>
        {label}
      </Link>
    );
  }

  return (
    <SignUpButton
      mode="modal"
      forceRedirectUrl={href}
      signInForceRedirectUrl={href}
    >
      <button type="button" className={className} style={{ fontFamily: DISPLAY }}>
        {label}
      </button>
    </SignUpButton>
  );
}

function FeatureRow({
  card,
  heading: Heading = "h3",
}: {
  card: FeatureCard;
  heading?: "h2" | "h3";
}) {
  if (IS_V3) {
    return (
      <article
        className="mx-auto flex w-full max-w-[80rem] flex-col gap-5 px-5 py-9 sm:gap-6 sm:px-6 sm:py-12 md:px-8 lg:w-[94%] lg:flex-row lg:items-center lg:gap-14 lg:px-0 lg:py-16 xl:gap-16"
        style={{ fontFamily: SANS }}
      >
        {/* contents on mobile → title / image / body reorder; flex column on desktop */}
        <div
          className={[
            "contents lg:flex lg:w-[46%] lg:shrink-0 lg:flex-col lg:justify-center lg:gap-5",
            card.imageLeft ? "lg:order-2" : "lg:order-1",
          ].join(" ")}
        >
          <Heading
            className="order-1 w-full text-left text-[clamp(2.25rem,8vw,2.85rem)] font-normal leading-[1.08] tracking-[-0.035em] text-balance text-[#1d1c1a] md:text-[2.75rem] lg:max-w-[18ch] lg:text-[2.5rem]"
            style={{ fontFamily: DISPLAY }}
          >
            {card.title}
          </Heading>

          <div className="order-3 flex w-full flex-col">
            <p
              className="w-full max-w-none text-[1.0625rem] font-normal leading-[1.55] text-[#3a3834] sm:text-[1.125rem] lg:max-w-[34rem] lg:text-[1.1875rem]"
              style={{ fontFamily: SANS }}
            >
              {card.description}
            </p>
            <div className="mt-6 w-full sm:mt-7 sm:w-auto lg:mt-8">
              <CtaButton
                label={card.ctaLabel}
                href={card.ctaHref}
                auth={card.ctaAuth}
                variant="v3"
              />
            </div>
          </div>
        </div>

        <div
          className={[
            "relative order-2 aspect-[16/10] w-full overflow-hidden rounded-[1.25rem] bg-[#f4f3f0] sm:rounded-[1.5rem] md:aspect-[16/9] lg:aspect-auto lg:min-h-[420px] lg:flex-1 xl:min-h-[460px]",
            card.imageLeft ? "lg:order-1" : "lg:order-2",
          ].join(" ")}
        >
          <Image
            src={card.image}
            alt={card.imageAlt}
            fill
            className={
              card.imageContain
                ? "object-contain object-center p-4 sm:p-6 lg:p-7"
                : "object-cover object-center"
            }
            sizes="(max-width: 1024px) 100vw, 40rem"
            priority={card.id === "01"}
          />
        </div>
      </article>
    );
  }

  return (
    <article
      className="mx-auto flex w-[92%] max-w-[80rem] flex-col overflow-hidden rounded-[30px] bg-white px-8 py-5 sm:px-10 sm:py-6 lg:w-[94%] lg:flex-row lg:items-stretch lg:gap-4 lg:px-5 lg:py-5"
      style={{ fontFamily: SANS }}
    >
      <div
        className={[
          "flex w-full flex-col justify-center pt-6 pb-5 sm:pt-8 sm:pb-6",
          "lg:w-[46%] lg:shrink-0 lg:py-12",
          card.imageLeft
            ? "lg:order-2 lg:pl-8 lg:pr-12 xl:pl-10 xl:pr-16"
            : "lg:order-1 lg:pr-8 lg:pl-12 xl:pr-10 xl:pl-16",
        ].join(" ")}
      >
        <Heading
          className="text-[1.85rem] font-normal leading-[1.1] tracking-[-0.03em] text-[#1d1c1a] sm:text-[2.1rem] lg:text-[2.4rem] xl:text-[2.6rem]"
          style={{ fontFamily: DISPLAY }}
        >
          {card.title}
        </Heading>
        <p
          className="mt-5 max-w-[32rem] text-[1.05rem] font-normal leading-[1.5] text-[#1d1c1a] sm:text-[1.125rem] lg:text-[1.2rem]"
          style={{ fontFamily: SANS }}
        >
          {card.description}
        </p>
        <div className="mt-8 sm:mt-9 lg:mt-11">
          <CtaButton
            label={card.ctaLabel}
            href={card.ctaHref}
            auth={card.ctaAuth}
          />
        </div>
      </div>

      <div
        className={[
          "relative mt-2 w-full overflow-hidden rounded-[1.5rem] sm:rounded-[1.75rem]",
          "aspect-[5/4] sm:aspect-[4/3]",
          "lg:mt-0 lg:aspect-auto lg:min-h-[480px] lg:flex-1 lg:rounded-[1.75rem] xl:min-h-[520px]",
          card.imageContain ? "bg-[#f5f5f5]" : "",
          card.imageLeft ? "lg:order-1" : "lg:order-2",
        ].join(" ")}
      >
        <Image
          src={card.image}
          alt={card.imageAlt}
          fill
          className={
            card.imageContain
              ? "object-contain object-center p-6 sm:p-8"
              : "object-cover object-center"
          }
          sizes="(max-width: 1024px) 92vw, 48rem"
          priority={card.id === "01"}
        />
      </div>
    </article>
  );
}

export default function FeaturesSection({
  hideHeader = false,
}: {
  hideHeader?: boolean;
}) {
  return (
    <section
      id="features"
      aria-labelledby={hideHeader ? undefined : "features-heading"}
      className={`relative overflow-hidden ${IS_V3 ? "bg-white" : "bg-[#f9f8f6]"} ${
        hideHeader
          ? IS_V3
            ? "py-8 sm:py-10 lg:py-12"
            : "py-10 sm:py-12 lg:py-14"
          : IS_V3
            ? "py-20 sm:py-24 lg:py-28"
            : "py-16 sm:py-20 lg:py-24"
      }`}
      style={{ fontFamily: SANS }}
    >
      <div className="relative mx-auto w-full">
        {hideHeader ? null : (
          <header
            className={`mx-auto w-[92%] max-w-[80rem] text-center lg:w-[94%] ${
              IS_V3 ? "mb-6 sm:mb-8 lg:mb-10" : "mb-12 sm:mb-14 lg:mb-16"
            }`}
          >
            <BlurReveal
              as="h2"
              id="features-heading"
              className="text-[2rem] font-normal leading-[1.05] tracking-[-0.04em] text-[#1d1c1a] sm:text-[2.5rem] lg:text-[3rem]"
              style={{ fontFamily: DISPLAY }}
            >
              From first prompt to production.
            </BlurReveal>
            <p
              className="mx-auto mt-4 max-w-2xl text-[1.05rem] leading-[1.5] text-[#55534e] sm:text-[1.125rem]"
              style={{ fontFamily: SANS }}
            >
              Generate, refine, and export production-ready 3D assets for games, film, architecture,
              and digital products.
            </p>
          </header>
        )}

        <div
          className={
            IS_V3
              ? "flex flex-col gap-2 sm:gap-3 lg:gap-0"
              : "flex flex-col gap-6 sm:gap-7 lg:gap-8"
          }
        >
          {FEATURE_CARDS.map((card) => (
            <FeatureRow
              key={card.id}
              card={card}
              heading={hideHeader ? "h2" : "h3"}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
