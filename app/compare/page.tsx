import { JsonLd } from "@/components/seo/JsonLd";
import {
  PickleResearchPage,
  PickleResearchCard,
  type PickleRelatedItem,
  type PickleThumbVariant,
} from "@/components/layout/PicklePage";
import { getArticles } from "@/lib/content";
import { createPageMetadata, getWebPageJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Hydrilla vs Meshy, Luma, Tripo — AI 3D Comparisons",
  description:
    "Side-by-side notes on Hydrilla and BlueFox 1 versus Meshy, Luma, and Tripo for production 3D generation.",
  path: "/compare",
  absoluteTitle: true,
});

const THUMB_BY_SLUG: Record<string, PickleThumbVariant> = {
  "hydrilla-vs-meshy": "compare-meshy",
  "hydrilla-vs-tripo": "compare-tripo",
  "hydrilla-vs-luma": "compare-luma",
  "best-ai-3d-generators": "compare-field",
};

const FORMAT_DATE = (iso: string) => {
  try {
    return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return iso;
  }
};

export default function CompareIndexPage() {
  const articles = getArticles("compare");

  const items: PickleRelatedItem[] = articles.map((article) => ({
    title: article.title,
    subtitle: article.description,
    href: article.path,
    date: FORMAT_DATE(article.datePublished),
    author: "Hydrilla Team",
    thumbVariant: THUMB_BY_SLUG[article.slug] || "pipeline-arch",
  }));

  const continueItems: PickleRelatedItem[] = [
    {
      title: "BlueFox 3D",
      subtitle: "How Hawan Research Labs builds the generative 3D model behind Hydrilla.",
      href: "/bluefox3d",
      date: "Aug 19, 2026",
      author: "Hawan Research Labs",
      thumbVariant: "critter-rig",
    },
    {
      title: "Documentation",
      subtitle: "From first prompt to a production GLB, FBX, OBJ, or USDZ export.",
      href: "/docs",
      date: "Aug 19, 2026",
      author: "Hydrilla Team",
      thumbVariant: "docs-flow",
    },
  ];

  return (
    <>
      <JsonLd
        data={getWebPageJsonLd({
          name: "Hydrilla vs Meshy, Luma, Tripo — AI 3D Comparisons",
          description: metadata.description as string,
          path: "/compare",
        })}
      />
      <PickleResearchPage
        title="Compare"
        description="Side-by-side notes from the Hydrilla team on BlueFox 1 versus Meshy, Tripo, and Luma for production 3D pipelines."
        items={items}
      >
        <section className="pickle-research-container" style={{ marginTop: "96px" }}>
          <h2 className="pickle-h2" style={{ width: "100%", marginBottom: "28px" }}>
            Continue exploring
          </h2>
          <ul className="pickle-research-grid" style={{ width: "100%", marginTop: 0 }}>
            {continueItems.map((item) => (
              <PickleResearchCard key={item.href} item={item} />
            ))}
          </ul>
        </section>
      </PickleResearchPage>
    </>
  );
}
