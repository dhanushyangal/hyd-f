import { Suspense } from "react";
import Image from "next/image";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { ArticleBody } from "@/components/content/ArticleBody";
import { BlogContinueSection } from "@/components/blog/BlogContinueSection";
import { blogPostPath, fetchBlogPost, fetchBlogPosts, formatBlogDate } from "@/lib/blog";
import { createPageMetadata, getArticleJsonLd } from "@/lib/seo";
import { DEFAULT_OG_IMAGE } from "@/lib/seo";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    const { posts } = await fetchBlogPosts({ limit: 100 });
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = await fetchBlogPost(slug);
  if (!post) return {};
  return createPageMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    path: blogPostPath(slug),
    absoluteTitle: true,
    ogImage: post.seoImage || post.coverImage || DEFAULT_OG_IMAGE,
  });
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await fetchBlogPost(slug);
  if (!post) notFound();

  const dateLabel = formatBlogDate(post.publishedAt);
  const metaParts = [post.category, dateLabel, post.author].filter(Boolean).join(" · ");

  return (
    <>
      <JsonLd
        data={getArticleJsonLd({
          headline: post.headline,
          description: post.seoDescription || post.excerpt,
          path: blogPostPath(slug),
          datePublished: post.publishedAt || post.updatedAt,
          dateModified: post.updatedAt,
        })}
      />
      <MarketingPage
        eyebrow="Blog"
        eyebrowHref="/blog"
        title={post.headline}
        description={post.excerpt}
        meta={metaParts}
        formats={false}
        useBodyFontForTitle
        relatedContent={
          <Suspense fallback={null}>
            <BlogContinueSection excludeSlug={slug} />
          </Suspense>
        }
      >
        {post.coverImage ? (
          <div className="relative mx-auto aspect-[2/1] max-w-3xl overflow-hidden rounded-xl border border-neutral-200">
            <Image
              src={post.coverImage}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 768px"
              priority
            />
          </div>
        ) : null}
        <ArticleBody html={post.content} />
      </MarketingPage>
    </>
  );
}
