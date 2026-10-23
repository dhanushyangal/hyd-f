import Link from "next/link";
import {
  PickleArticlePage,
  PickleVisualThumb,
  type PickleRelatedItem,
} from "@/components/layout/PicklePage";
import { BLUEFOX_LEDE, MODEL_NAME, RESEARCH_LAB } from "@/lib/brand";
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
    title: "Compare AI 3D Generators",
    subtitle: "How BlueFox 1 and Hydrilla compare to Meshy, Tripo, and Luma.",
    href: "/compare",
    date: "Aug 19, 2026",
    author: "Hydrilla Team",
    thumbVariant: "compare-tripo",
  },
];

export default function BlueFoxPage() {
  return (
    <PickleArticlePage
      kicker="Model"
      kickerHref="/research"
      title="BlueFox 3D"
      subtitle={BLUEFOX_LEDE}
      date="Aug 19, 2026"
      author={RESEARCH_LAB}
      heroVideoSrc={WHY_HYDRILLA_MEDIA.bluefox.video}
      heroPosterSrc={WHY_HYDRILLA_MEDIA.bluefox.poster}
      ctaLabel="Start on Hydrilla"
      ctaHref="/app/studio"
      footnote={
        <>
          {MODEL_NAME} is built by <Link href="/research">{RESEARCH_LAB}</Link>{" "}
          and runs inside <Link href="/">Hydrilla</Link>.
        </>
      }
      relatedItems={RELATED}
    >
      <div className="pickle-text">
        <p>{BLUEFOX_LEDE}</p>
        <p>
          BlueFox 1 generates production-oriented meshes from a text prompt or a
          reference image. Meshes arrive segmented into logical parts, with PBR
          maps (base color, metalness, roughness, normals) you can preview in
          Hydrilla and export as GLB, FBX, OBJ, or USDZ.
        </p>
        <p>
          Use it for game props and environments, film and animation concept
          assets, architectural visualization, XR objects, and product
          visualization. Then refine in Unity, Unreal, Blender, Maya, or your
          DCC.
        </p>
      </div>

      <section className="pickle-section">
        <div className="pickle-head-block">
          <h2 className="pickle-h2">Why segmented geometry + PBR</h2>
          <div className="pickle-text">
            <p>
              BlueFox 1 is not a CAD system and not a replacement for a
              hero-asset artist. It is the fast path to a clean, editable 3D
              base where parts are separated and materials respond to scene
              lighting.
            </p>
            <p>
              Hydrilla is how you run BlueFox 1: workspaces, credits, preview,
              team delivery, and multi-format export.
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
            From text prompt or reference frame to segmented mesh and four PBR channels.
          </figcaption>
        </figure>
      </section>
    </PickleArticlePage>
  );
}
