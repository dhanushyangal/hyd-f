import Link from "next/link";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { MarketingArticle, ProseHeading } from "@/components/content/MarkdownBody";
import { MODEL_NAME, RESEARCH_LAB, RESEARCH_LEDE } from "@/lib/brand";

export default function ResearchPage() {
  return (
    <MarketingPage
      eyebrow="Research"
      title={RESEARCH_LAB}
      description={RESEARCH_LEDE}
      related={[
        { label: "BlueFox 3D", href: "/bluefox3d", hint: "Product page for the model" },
        { label: "How BlueFox works", href: "/blog/how-bluefox-works", hint: "The generation loop" },
        { label: "About Hydrilla", href: "/about", hint: "Lab, product, model" },
      ]}
    >
      <MarketingArticle>
        <p className="text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          {RESEARCH_LEDE}
        </p>
        <p className="mt-5 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          What we work on: generative 3D from text and images, production-oriented
          meshes, PBR materials, and exports that land in game, film,
          architecture, and XR pipelines.
        </p>

        <ProseHeading>BlueFox 1 model card</ProseHeading>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full border-collapse text-left text-[15px] leading-6 text-neutral-700">
            <tbody>
              {[
                ["Model", MODEL_NAME],
                ["Family", "BlueFox 3D"],
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
                <tr key={key} className="border-b border-neutral-200">
                  <th className="w-[11rem] py-3 pr-4 align-top font-semibold text-neutral-950">
                    {key}
                  </th>
                  <td className="py-3">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-8 text-[16px] leading-7 text-neutral-700 sm:text-[17px]">
          {MODEL_NAME} is available to creators and studios through{" "}
          <Link href="/" className="font-semibold text-neutral-950 underline underline-offset-2">
            Hydrilla
          </Link>
          . Read the product model page at{" "}
          <Link href="/bluefox3d" className="font-semibold text-neutral-950 underline underline-offset-2">
            BlueFox 3D
          </Link>
          .
        </p>
      </MarketingArticle>
    </MarketingPage>
  );
}
