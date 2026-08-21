import Link from "next/link";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { MarketingArticle, ProseHeading } from "@/components/content/MarkdownBody";
import { BRAND_SENTENCE } from "@/lib/brand";

export default function AboutPage() {
  return (
    <MarketingPage
      eyebrow="Company"
      title="About Hydrilla"
      description="Hydrilla is the product. Hawan Research Labs is the lab. BlueFox 3D is the model family."
      formats={false}
      related={[
        { label: "Meet the team", href: "/team", hint: "People building it" },
        { label: "Research", href: "/research", hint: "Hawan Research Labs" },
        { label: "BlueFox 3D", href: "/bluefox3d", hint: "The model family" },
        { label: "Contact", href: "/contact", hint: "Talk to the founders" },
      ]}
    >
      <MarketingArticle>
        <p className="text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          {BRAND_SENTENCE}
        </p>
        <p className="mt-5 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          Hydrilla is the product: a studio for text-to-3D and image-to-3D,
          in-browser preview, team workspaces, and exports into real pipelines.
          It is built for 3D artists, technical artists, and the teams who work
          with them.
        </p>
        <p className="mt-5 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          Hawan Research Labs is the research lab that builds the models behind
          Hydrilla. The first public model family is BlueFox 3D. The model you
          run in Hydrilla today is BlueFox 1.
        </p>
        <p className="mt-5 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          BlueFox 1 turns a prompt or a reference image into a segmented mesh
          with PBR materials, then Hydrilla lets you preview and export GLB,
          FBX, OBJ, and USDZ for Unity, Unreal, Blender, and other tools.
        </p>
        <p className="mt-5 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          We do not treat generated meshes as a replacement for art direction.
          Hydrilla is how you get to a clean, editable base faster, then finish
          the work in your own pipeline.
        </p>

        <ProseHeading>Keep reading</ProseHeading>
        <p className="mt-4 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          <Link href="/team" className="font-semibold text-neutral-950 underline underline-offset-2">
            Meet the team
          </Link>
          {" · "}
          <Link href="/research" className="font-semibold text-neutral-950 underline underline-offset-2">
            Research
          </Link>
          {" · "}
          <Link href="/bluefox3d" className="font-semibold text-neutral-950 underline underline-offset-2">
            BlueFox 3D
          </Link>
          {" · "}
          <Link href="/contact" className="font-semibold text-neutral-950 underline underline-offset-2">
            Contact
          </Link>
        </p>
      </MarketingArticle>
    </MarketingPage>
  );
}
