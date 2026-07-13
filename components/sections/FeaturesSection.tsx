"use client";

import Image from "next/image";
import Link from "next/link";
import { SignUpButton, useAuth } from "@clerk/nextjs";
import { BlurReveal } from "@/components/ui/BlurReveal";

type FeatureCard = {
  id: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  /** Desktop only — image on the left */
  imageLeft: boolean;
};

const FEATURE_CARDS: FeatureCard[] = [
  {
    id: "01",
    title: "Text and image to production 3D",
    description:
      "Describe the asset or drop a reference. Hydrilla turns prompts and images into clean meshes you can refine, export, and ship.",
    image: "/features/3d1.png",
    imageAlt: "Hydrilla text and image to 3D generation workspace",
    imageLeft: false,
  },
  {
    id: "02",
    title: "Intelligent segmentation that stays editable",
    description:
      "Meshes arrive already split into logical parts—so materials, cleanup, and iteration stay precise instead of starting from a solid blob.",
    image: "/features/3d2.png",
    imageAlt: "Hydrilla intelligent mesh segmentation into editable parts",
    imageLeft: true,
  },
  {
    id: "03",
    title: "PBR materials that hold up in production",
    description:
      "Base color, metalness, roughness, and normals tuned for real lighting. Preview in-browser, then export maps ready for your pipeline.",
    image: "/features/3d3.png",
    imageAlt: "Hydrilla PBR materials and texture maps preview",
    imageLeft: false,
  },
  {
    id: "05",
    title: "Export for Unity, Unreal, Blender, and more",
    description:
      "GLB, FBX, OBJ, and USDZ with topology and UVs that drop into game engines, DCC tools, and AR viewers without a rebuild.",
    image: "/features/3d5.png",
    imageAlt: "Hydrilla multi-format 3D export for production pipelines",
    imageLeft: true,
  },
  {
    id: "06",
    title: "Real-time 3D preview while you work",
    description:
      "Orbit, inspect materials, and catch issues before download. Review assets in the browser so the handoff stays fast and clear.",
    image: "/features/3d6.png",
    imageAlt: "Hydrilla real-time in-browser 3D preview",
    imageLeft: false,
  },
  {
    id: "07",
    title: "Team workspaces built for shared delivery",
    description:
      "Organize generations, keep versions together, and move from first draft to client-ready assets without scattering files across tools.",
    image: "/features/3d7.png",
    imageAlt: "Hydrilla collaborative team workspace for 3D assets",
    imageLeft: true,
  },
];

const DISPLAY =
  "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif";
const BODY = "var(--font-dm-sans), 'DM Sans', sans-serif";

function CtaButton() {
  const { isSignedIn } = useAuth();

  const className =
    "inline-flex w-fit items-center justify-center rounded-full bg-[#1d1c1a] px-[1.25em] py-[0.75em] text-[1rem] font-normal leading-[1.3] text-white transition-opacity hover:opacity-90";

  if (isSignedIn) {
    return (
      <Link href="/app/studio" className={className} style={{ fontFamily: BODY }}>
        Start for free today →
      </Link>
    );
  }

  return (
    <SignUpButton mode="modal" forceRedirectUrl="/app/studio" signInForceRedirectUrl="/app/studio">
      <button type="button" className={className} style={{ fontFamily: BODY }}>
        Start for free today →
      </button>
    </SignUpButton>
  );
}

function FeatureRow({ card }: { card: FeatureCard }) {
  return (
    <article
      className="mx-auto flex w-[92%] max-w-[80rem] flex-col overflow-hidden rounded-[30px] bg-white px-8 py-5 sm:px-10 sm:py-6 lg:w-[94%] lg:flex-row lg:items-stretch lg:gap-4 lg:px-5 lg:py-5"
      style={{ fontFamily: BODY }}
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
        <h3
          className="text-[1.85rem] font-semibold leading-[1.1] tracking-[-0.03em] text-[#1d1c1a] sm:text-[2.1rem] lg:text-[2.4rem] xl:text-[2.6rem]"
          style={{ fontFamily: DISPLAY }}
        >
          {card.title}
        </h3>
        <p
          className="mt-5 max-w-[32rem] text-[1.05rem] font-normal leading-[1.5] text-[#1d1c1a] sm:text-[1.125rem] lg:text-[1.2rem]"
          style={{ fontFamily: BODY }}
        >
          {card.description}
        </p>
        <div className="mt-8 sm:mt-9 lg:mt-11">
          <CtaButton />
        </div>
      </div>

      <div
        className={[
          "relative mt-2 w-full overflow-hidden rounded-[1.5rem] sm:rounded-[1.75rem]",
          "aspect-[5/4] sm:aspect-[4/3]",
          "lg:mt-0 lg:aspect-auto lg:min-h-[480px] lg:flex-1 lg:rounded-[1.75rem] xl:min-h-[520px]",
          card.imageLeft ? "lg:order-1" : "lg:order-2",
        ].join(" ")}
      >
        <Image
          src={card.image}
          alt={card.imageAlt}
          fill
          className="object-cover object-center"
          sizes="(max-width: 1024px) 92vw, 48rem"
          priority={card.id === "01"}
        />
      </div>
    </article>
  );
}

export default function FeaturesSection() {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="relative overflow-hidden bg-[#f9f8f6] py-16 sm:py-20 lg:py-24"
      style={{ fontFamily: BODY }}
    >
      <div className="relative mx-auto w-full">
        <header className="mx-auto mb-12 w-[92%] max-w-[80rem] text-center sm:mb-14 lg:mb-16 lg:w-[94%]">
          <p
            className="mb-3 text-[0.75rem] font-medium uppercase tracking-[0.1em] text-[#55534e]"
            style={{ fontFamily: DISPLAY }}
          >
            Platform capabilities
          </p>
          <BlurReveal
            as="h2"
            id="features-heading"
            className="text-[2rem] font-semibold leading-[1.05] tracking-[-0.04em] text-[#1d1c1a] sm:text-[2.5rem] lg:text-[3rem]"
            style={{ fontFamily: DISPLAY }}
          >
            From first prompt to production.
          </BlurReveal>
          <p className="mx-auto mt-4 max-w-2xl text-[1.05rem] leading-[1.5] text-[#55534e] sm:text-[1.125rem]">
            One connected workflow for generating, refining, and delivering production-ready 3D
            assets.
          </p>
        </header>

        {/* Clay-like stack: ~1.5–2rem between cards — continuous scroll, not slide gaps */}
        <div className="flex flex-col gap-6 sm:gap-7 lg:gap-8">
          {FEATURE_CARDS.map((card) => (
            <FeatureRow key={card.id} card={card} />
          ))}
        </div>
      </div>
    </section>
  );
}
