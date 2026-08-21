import Image from "next/image";
import Link from "next/link";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { MarketingArticle, ProseHeading } from "@/components/content/MarkdownBody";
import { BLUEFOX_LEDE } from "@/lib/brand";
import { WHY_HYDRILLA_MEDIA } from "@/lib/cloudinary";

export default function BlueFoxPage() {
  return (
    <MarketingPage
      eyebrow="Model"
      title="BlueFox 3D"
      description={BLUEFOX_LEDE}
      related={[
        { label: "Research", href: "/research", hint: "Hawan Research Labs" },
        { label: "Features", href: "/features", hint: "Preview and export" },
        { label: "How BlueFox works", href: "/blog/how-bluefox-works", hint: "The generation loop" },
      ]}
    >
      <MarketingArticle>
        <div className="relative aspect-[16/9] overflow-hidden border border-neutral-200 bg-neutral-950">
          <Image
            src={WHY_HYDRILLA_MEDIA.bluefox.poster}
            alt="BlueFox 1 generating a production-ready 3D asset"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>

        <section className="mt-12 space-y-5 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          <p>{BLUEFOX_LEDE}</p>
          <p>
            BlueFox 1 generates production-oriented meshes from a text prompt or
            a reference image. Meshes arrive segmented into logical parts, with
            PBR maps (base color, metalness, roughness, normals) you can preview
            in Hydrilla and export as GLB, FBX, OBJ, or USDZ.
          </p>
          <p>
            Use it for game props and environments, film and animation concept
            assets, architectural visualization, XR objects, and product viz.
            Then refine in Unity, Unreal, Blender, Maya, or your DCC.
          </p>
          <p>
            BlueFox 1 is not a CAD system and not a replacement for a hero-asset
            artist. It is the fast path to a clean, editable 3D base.
          </p>
          <p>
            Hydrilla is how you run BlueFox 1: workspaces, credits, preview, team
            delivery, and export.
          </p>
        </section>

        <ProseHeading>Next</ProseHeading>
        <p className="mt-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          <Link href="/" className="font-semibold text-neutral-950 underline underline-offset-2">
            Start on Hydrilla
          </Link>
          {" · "}
          <Link href="/research" className="font-semibold text-neutral-950 underline underline-offset-2">
            Hawan Research Labs
          </Link>
          {" · "}
          <Link href="/features" className="font-semibold text-neutral-950 underline underline-offset-2">
            Features
          </Link>
        </p>
      </MarketingArticle>
    </MarketingPage>
  );
}
