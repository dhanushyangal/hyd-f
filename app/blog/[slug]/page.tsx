import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { MarkdownBody } from "@/components/content/MarkdownBody";
import { getArticle, getArticles, getRelatedArticles } from "@/lib/content";
import { createPageMetadata, getArticleJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getArticles("blog").map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = getArticle("blog", slug);
  if (!article) return {};
  return createPageMetadata({
    title: article.title,
    description: article.description,
    path: article.path,
    absoluteTitle: true,
  });
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticle("blog", slug);
  if (!article) notFound();
  const related = getRelatedArticles(article).map((item) => ({
    label: item.title,
    href: item.path,
    hint: item.cluster,
  }));

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
      <MarketingPage
        eyebrow="Blog"
        title={article.headline}
        description={article.description}
        meta={article.datePublished}
        related={related}
      >
        <MarkdownBody html={article.html} />
      </MarketingPage>
    </>
  );
}
