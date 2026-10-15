import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Footer from "@/components/layout/Footer";
import { ArticlePage } from "@/components/layout/ArticlePage";
import { JsonLd } from "@/components/seo/JsonLd";
import { ArticleBody } from "@/components/content/ArticleBody";
import { BlogContinueSection } from "@/components/blog/BlogContinueSection";
import { blogPostPath, fetchBlogPost, fetchBlogPosts, formatBlogDate } from "@/lib/blog";
import { createPageMetadata, DEFAULT_OG_IMAGE, getArticleJsonLd } from "@/lib/seo";

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
  const title = post.headline || post.title;

  return (
    <>
      <JsonLd
        data={getArticleJsonLd({
          headline: title,
          description: post.seoDescription || post.excerpt,
          path: blogPostPath(slug),
          datePublished: post.publishedAt || post.updatedAt,
          dateModified: post.updatedAt,
        })}
      />
      <ArticlePage
        headingId="article-heading"
        title={title}
        subtitle={post.excerpt || undefined}
        wideTitle
        kicker={<Link href="/blog">Blog</Link>}
        meta={
          <div className="article-meta">
            {post.category ? <span>{post.category}</span> : null}
            {post.category && dateLabel ? <span className="article-meta-divider" aria-hidden /> : null}
            {dateLabel ? <time dateTime={post.publishedAt ?? undefined}>{dateLabel}</time> : null}
            {post.author ? (
              <>
                <span className="article-meta-divider" aria-hidden />
                <span>{post.author}</span>
              </>
            ) : null}
          </div>
        }
      >
        {post.coverImage ? (
          <div className="article-cover">
            <Image
              src={post.coverImage}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 900px) 100vw, 900px"
              priority
            />
          </div>
        ) : null}
        <ArticleBody html={post.content} />
        <Suspense fallback={null}>
          <BlogContinueSection excludeSlug={slug} />
        </Suspense>
      </ArticlePage>
      <Footer />
    </>
  );
}
