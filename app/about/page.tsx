import Link from "next/link";
import {
  PickleArticlePage,
  PickleVisualThumb,
  type PickleRelatedItem,
} from "@/components/layout/PicklePage";
import { BRAND_SENTENCE, RESEARCH_LAB } from "@/lib/brand";
import { WHY_HYDRILLA_MEDIA } from "@/lib/cloudinary";

const RELATED: PickleRelatedItem[] = [
  {
    title: "Hawan Research Labs",
    subtitle: "The research lab that builds the generative 3D models behind Hydrilla.",
    href: "/research",
    date: "Aug 19, 2026",
    author: "Hawan Research Labs",
    thumbVariant: "pipeline-arch",
  },
  {
    title: "BlueFox 3D",
    subtitle: "Text and reference images to segmented production meshes with PBR maps.",
    href: "/bluefox3d",
    date: "Aug 19, 2026",
    author: "Hawan Research Labs",
    thumbVariant: "critter-rig",
  },
];

export default function AboutPage() {
  return (
    <PickleArticlePage
      kicker="Company"
      title="About Hydrilla"
      subtitle="Hydrilla is the product. Hawan Research Labs is the lab. BlueFox 3D is the model family."
      date="Oct 2026"
      author="Hydrilla Team"
      heroVideoSrc={WHY_HYDRILLA_MEDIA.bluefox.video}
      heroPosterSrc={WHY_HYDRILLA_MEDIA.bluefox.poster}
      ctaLabel="Meet the team"
      ctaHref="/team"
      footnote={
        <>
          Questions about the lab or studio partnerships?{" "}
          <Link href="/contact">Contact the founders</Link> or read{" "}
          <Link href="/research">{RESEARCH_LAB}</Link>.
        </>
      }
      relatedItems={RELATED}
    >
      <div className="pickle-text">
        <p>{BRAND_SENTENCE}</p>
        <p>
          Hydrilla is the product: a studio for text-to-3D and image-to-3D,
          in-browser preview, team workspaces, and exports into real pipelines.
          It is built for 3D artists, technical artists, and the teams who work
          with them.
        </p>
        <p>
          Hawan Research Labs is the research lab that builds the models behind
          Hydrilla. The first public model family is BlueFox 3D. The model you
          run in Hydrilla today is BlueFox 1.
        </p>
      </div>

      <section className="pickle-section">
        <div className="pickle-head-block">
          <h2 className="pickle-h2">Lab, model, and studio</h2>
          <div className="pickle-text">
            <p>
              BlueFox 1 turns a prompt or a reference image into a segmented mesh
              with PBR materials, then Hydrilla lets you preview and export GLB,
              FBX, OBJ, and USDZ for Unity, Unreal, Blender, and other tools.
            </p>
            <p>
              We do not treat generated meshes as a replacement for art direction.
              Hydrilla is how you get to a clean, editable base faster, then finish
              the work in your own pipeline.
            </p>
          </div>
        </div>

        <figure className="pickle-figure">
          <div className="pickle-player-frame" data-variant="light">
            <div className="pickle-player-media">
              <PickleVisualThumb variant="pipeline-arch" />
            </div>
          </div>
          <figcaption className="pickle-caption">
            How Hawan Research Labs, BlueFox 1, and Hydrilla Studio fit together in production.
          </figcaption>
        </figure>
      </section>

      <section className="pickle-head-block">
        <h2 className="pickle-h2">Keep reading</h2>
        <div className="pickle-text">
          <p>
            <Link href="/team">Meet the team</Link>
            {" · "}
            <Link href="/research">Research</Link>
            {" · "}
            <Link href="/bluefox3d">BlueFox 3D</Link>
            {" · "}
            <Link href="/careers">Careers</Link>
            {" · "}
            <Link href="/contact">Contact</Link>
          </p>
        </div>
      </section>
    </PickleArticlePage>
  );
}
