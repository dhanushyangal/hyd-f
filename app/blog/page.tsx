import { JsonLd } from "@/components/seo/JsonLd";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { ArticleIndex } from "@/components/content/ArticleIndex";
import { getArticles, groupArticlesByCluster } from "@/lib/content";
import { createPageMetadata, getWebPageJsonLd } from "@/lib/seo";

export const metadata = createPageMetadata({
  title: "Hydrilla Blog — BlueFox, Pipelines, and 3D Generation",
  description:
    "Guides on text-to-3D, image-to-3D, Unity, Unreal, Blender, and how BlueFox 1 produces production meshes.",
  path: "/blog",
  absoluteTitle: true,
});

export default function BlogIndexPage() {
  const groups = groupArticlesByCluster(getArticles("blog"));

  return (
    <>
      <JsonLd
        data={getWebPageJsonLd({
          name: "Hydrilla Blog — BlueFox, Pipelines, and 3D Generation",
          description: metadata.description as string,
          path: "/blog",
        })}
      />
      <MarketingPage
        eyebrow="Resources"
        title="Blog"
        description="Answer-first notes on BlueFox, exports, and production 3D. Written so a person or a model can quote them."
        related={[
          { label: "Compare", href: "/compare", hint: "Hydrilla vs Meshy, Luma, Tripo" },
          { label: "Docs", href: "/docs", hint: "Getting started" },
          { label: "Changelog", href: "/changelog", hint: "What shipped" },
        ]}
      >
        <ArticleIndex groups={groups} />
      </MarketingPage>
    </>
  );
}
