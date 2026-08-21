import { MarketingPage } from "@/components/layout/MarketingPage";
import { MarketingArticle } from "@/components/content/MarkdownBody";

const ENTRIES = [
  {
    date: "2026-08",
    title: "BlueFox 1 in the studio",
    body: "Text to 3D and image to 3D with segmented meshes, PBR maps, in-browser preview, and GLB, FBX, OBJ, and USDZ export. Free, Creator, and Studio plans.",
  },
  {
    date: "2026-08",
    title: "Studio API (partner access)",
    body: "Job-based generation for studios that already have a pipeline. Submit a prompt or reference, poll status, then download the same production formats as the studio.",
  },
  {
    date: "2026-08",
    title: "Docs, FAQ, and pipeline notes",
    body: "Public getting-started docs, buyer FAQ, research model card, and comparison notes versus Meshy, Luma, and Tripo.",
  },
];

export default function ChangelogPage() {
  return (
    <MarketingPage
      eyebrow="Product"
      title="Changelog"
      description="What shipped in Hydrilla and BlueFox 1: generation, exports, studio, and API."
      related={[
        { label: "Docs", href: "/docs", hint: "First prompt to export" },
        { label: "BlueFox 3D", href: "/bluefox3d", hint: "What the model produces" },
        { label: "Blog", href: "/blog", hint: "Pipeline notes" },
      ]}
    >
      <MarketingArticle>
        <ol className="space-y-8">
          {ENTRIES.map((entry) => (
            <li key={entry.title} className="border-b border-neutral-200 pb-8 last:border-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
                {entry.date}
              </p>
              <h2 className="mt-2 text-[20px] font-semibold tracking-[-0.03em] text-neutral-950">
                {entry.title}
              </h2>
              <p className="mt-3 text-[16px] leading-7 text-neutral-700">{entry.body}</p>
            </li>
          ))}
        </ol>
      </MarketingArticle>
    </MarketingPage>
  );
}
