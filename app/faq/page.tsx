import FAQSection from "../../components/sections/FAQSection";
import {
  PickleArticlePage,
  type PickleRelatedItem,
} from "@/components/layout/PicklePage";

const RELATED: PickleRelatedItem[] = [
  {
    title: "Documentation",
    subtitle: "From first prompt in the studio to a production GLB, FBX, OBJ, or USDZ export.",
    href: "/docs",
    date: "Aug 19, 2026",
    author: "Hydrilla Team",
    thumbVariant: "docs-flow",
  },
  {
    title: "Compare AI 3D Generators",
    subtitle: "Side-by-side workflow tables on Hydrilla and BlueFox 1 versus Meshy, Luma, and Tripo.",
    href: "/compare",
    date: "Aug 19, 2026",
    author: "Hydrilla Team",
    thumbVariant: "compare-field",
  },
];

export default function FAQPage() {
  return (
    <PickleArticlePage
      kicker="Resources"
      kickerHref="/docs"
      title="Frequently asked questions"
      subtitle="Short answers for creators and studios evaluating Hydrilla: plans, formats, engines, and who builds the model."
      date="Oct 2026"
      author="Hydrilla Team"
      ctaLabel="Open Studio"
      ctaHref="/app/studio"
      relatedItems={RELATED}
    >
      <div style={{ width: "100%" }}>
        <FAQSection hideHeader />
      </div>
    </PickleArticlePage>
  );
}
