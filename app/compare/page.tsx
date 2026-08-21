import { JsonLd } from "@/components/seo/JsonLd";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { ArticleIndex } from "@/components/content/ArticleIndex";
import { getArticles, groupArticlesByCluster } from "@/lib/content";
import { createPageMetadata, getWebPageJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Hydrilla vs Meshy, Luma, Tripo — AI 3D Comparisons",
  description:
    "Side-by-side notes on Hydrilla and BlueFox 1 versus Meshy, Luma, and Tripo for production 3D generation.",
  path: "/compare",
  absoluteTitle: true,
});

export default function CompareIndexPage() {
  const groups = groupArticlesByCluster(getArticles("compare"));

  return (
    <>
      <JsonLd
        data={getWebPageJsonLd({
          name: "Hydrilla vs Meshy, Luma, Tripo — AI 3D Comparisons",
          description: metadata.description as string,
          path: "/compare",
        })}
      />
      <MarketingPage
        eyebrow="Compare"
        title="Hydrilla vs other 3D generators"
        description="Honest tables. Hydrilla is built for production exports, not a longer feature list."
        related={[
          { label: "BlueFox 3D", href: "/bluefox3d", hint: "What the model produces" },
          { label: "Features", href: "/features", hint: "Generate, preview, export" },
          { label: "Blog", href: "/blog", hint: "Pipeline notes" },
        ]}
      >
        <ArticleIndex groups={groups} />
      </MarketingPage>
    </>
  );
}
