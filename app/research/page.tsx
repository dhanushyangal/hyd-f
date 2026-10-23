import Link from "next/link";
import {
  PickleResearchPage,
  PickleVideoPlayer,
  type PickleRelatedItem,
} from "@/components/layout/PicklePage";
import { MODEL_NAME, RESEARCH_LAB, RESEARCH_LEDE } from "@/lib/brand";
import { WHY_HYDRILLA_MEDIA } from "@/lib/cloudinary";

const RESEARCH_NOTES: PickleRelatedItem[] = [
  {
    title: "How your Hydrilla workspace protects your assets",
    subtitle:
      "The keys to your account, how generated meshes and PBR maps stay scoped to your workspace, and how exports leave our servers.",
    href: "/security",
    date: "Oct 1, 2026",
    author: "Hydrilla Team",
    thumbVariant: "privacy-enclave",
  },
  {
    title: "How BlueFox 1 synthesizes segmented 3D in real pipelines",
    subtitle:
      "Turning a text prompt or reference frame into a segmented production mesh with four PBR channels ready for Unreal, Unity, and Blender.",
    href: "/blog/how-bluefox-works",
    date: "Aug 19, 2026",
    author: "Hawan Research Labs",
    thumbVariant: "critter-rig",
  },
  {
    title: "BlueFox 3D: The model family behind Hydrilla",
    subtitle:
      "Why we generate segmented geometry and PBR maps instead of baked single-shell blobs, and how studio teams evaluate output.",
    href: "/bluefox3d",
    date: "Aug 19, 2026",
    author: "Hawan Research Labs",
    thumbVariant: "pipeline-arch",
  },
  {
    title: "Production 3D benchmarks: Hydrilla vs Meshy, Tripo, and Luma",
    subtitle:
      "Comparing polygonal meshes, part segmentation, PBR channels, and multi-format engine handoff across AI 3D generators.",
    href: "/compare",
    date: "Aug 19, 2026",
    author: "Hydrilla Team",
    thumbVariant: "compare-tripo",
  },
];

export default function ResearchPage() {
  return (
    <PickleResearchPage
      title="Research"
      description="Notes from Hawan Research Labs and the Hydrilla team on building generative 3D that understands structure, exports cleanly into your engine, and keeps your studio assets private."
      items={RESEARCH_NOTES}
    >
      <div className="pickle-article-column" style={{ marginTop: "96px" }}>
        <section className="pickle-section">
          <div className="pickle-head-block">
            <h2 className="pickle-h2">{RESEARCH_LAB}</h2>
            <div className="pickle-text">
              <p>{RESEARCH_LEDE}</p>
              <p>
                What we work on: generative 3D from text and images,
                production-oriented meshes, PBR materials, and exports that land
                in game, film, architecture, and XR pipelines.
              </p>
            </div>
          </div>

          <PickleVideoPlayer
            src={WHY_HYDRILLA_MEDIA.bluefox.video}
            poster={WHY_HYDRILLA_MEDIA.bluefox.poster}
            variant="inline"
          />
        </section>

        <section className="pickle-section">
          <div className="pickle-head-block">
            <h2 className="pickle-h2">BlueFox 1 model card</h2>
            <div className="pickle-text">
              <p>
                Every model shipped into Hydrilla Studio is documented against what
                production 3D pipelines require: inputs, part segmentation, PBR
                map channels, and explicit non-goals.
              </p>
            </div>
          </div>

          <figure className="pickle-figure">
            <div className="pickle-card-surface">
              <table className="pickle-table">
                <tbody>
                  {[
                    ["Model", MODEL_NAME],
                    ["Family", "BlueFox 3D"],
                    ["Research Lab", RESEARCH_LAB],
                    ["Product", "Hydrilla"],
                    ["Inputs", "Text prompt, reference image"],
                    [
                      "Outputs",
                      "Segmented mesh, PBR maps (base color, metalness, roughness, normals)",
                    ],
                    ["Exports (via Hydrilla)", "GLB, FBX, OBJ, USDZ"],
                    [
                      "Intended use",
                      "Props, environments, visualization, concept-to-production assets",
                    ],
                    [
                      "Not intended",
                      "CAD, manufacturing drawings, print-ready engineering, finished film/game heroes with no artist pass",
                    ],
                  ].map(([key, value]) => (
                    <tr key={key}>
                      <th>{key}</th>
                      <td>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <figcaption className="pickle-caption">
              BlueFox 1 system card and production handoff specification.
            </figcaption>
          </figure>

          <div className="pickle-text">
            <p>
              {MODEL_NAME} is available to creators and studios through{" "}
              <Link href="/">Hydrilla</Link>. Read the product model overview at{" "}
              <Link href="/bluefox3d">BlueFox 3D</Link>.
            </p>
          </div>
        </section>
      </div>
    </PickleResearchPage>
  );
}
