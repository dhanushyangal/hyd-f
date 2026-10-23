import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  PickleArticlePage,
  type PickleRelatedItem,
  type PickleThumbVariant,
} from "@/components/layout/PicklePage";
import { getArticle, getArticles, getRelatedArticles } from "@/lib/content";
import { createPageMetadata, getArticleJsonLd } from "@/lib/seo";
import { WHY_HYDRILLA_MEDIA } from "@/lib/cloudinary";

type Props = { params: Promise<{ slug: string }> };

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

export function generateStaticParams() {
  return getArticles("compare").map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = getArticle("compare", slug);
  if (!article) return {};
  return createPageMetadata({
    title: article.title,
    description: article.description,
    path: article.path,
    absoluteTitle: true,
  });
}

export default async function CompareArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle("compare", slug);
  if (!article) notFound();

  const related: PickleRelatedItem[] = getRelatedArticles(article, 2).map((item) => ({
    title: item.title,
    subtitle: item.description,
    href: item.path,
    date: FORMAT_DATE(item.datePublished),
    author: "Hydrilla Team",
    thumbVariant: THUMB_BY_SLUG[item.slug] || "pipeline-arch",
  }));

  const isVideoHero = slug === "best-ai-3d-generators" || slug === "hydrilla-vs-tripo";

  return (
    <>
      <JsonLd
        data={getArticleJsonLd({
          headline: article.title,
          description: article.description,
          path: article.path,
          datePublished: article.datePublished,
          dateModified: article.dateModified,
        })}
      />
      <PickleArticlePage
        kicker="Compare"
        kickerHref="/compare"
        title={article.headline}
        subtitle={article.description}
        date={FORMAT_DATE(article.datePublished)}
        author="Hydrilla Team"
        heroVideoSrc={isVideoHero ? WHY_HYDRILLA_MEDIA.bluefox.video : undefined}
        heroPosterSrc={isVideoHero ? WHY_HYDRILLA_MEDIA.bluefox.poster : undefined}
        heroThumbVariant={!isVideoHero ? (THUMB_BY_SLUG[slug] || "pipeline-arch") : undefined}
        ctaLabel="Open Studio"
        ctaHref="/app/studio"
        footnote="All third-party product names and trademarks belong to their respective owners. Feature lists and pricing change over time; verify directly on each vendor’s website before running an internal bake-off."
        relatedItems={related}
        relatedHeading="More comparisons"
      >
        <div
          className="pickle-prose"
          dangerouslySetInnerHTML={{ __html: article.html }}
        />
      </PickleArticlePage>
    </>
  );
}
