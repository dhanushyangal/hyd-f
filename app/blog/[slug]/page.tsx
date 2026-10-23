import { Suspense } from "react";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/seo/JsonLd";
import { BlogContinueSection } from "@/components/blog/BlogContinueSection";
import {
  PickleArticlePage,
  type PickleThumbVariant,
} from "@/components/layout/PicklePage";
import { blogPostPath, fetchBlogPost, fetchBlogPosts, formatBlogDate } from "@/lib/blog";
import { createPageMetadata, DEFAULT_OG_IMAGE, getArticleJsonLd } from "@/lib/seo";
import { WHY_HYDRILLA_MEDIA } from "@/lib/cloudinary";

export const revalidate = 3600;
export const dynamicParams = true;

type Props = { params: Promise<{ slug: string }> };

function pickHeroVariant(slug: string): PickleThumbVariant {
  if (slug.includes("bluefox")) return "critter-rig";
  if (slug.includes("export")) return "docs-flow";
  if (slug.includes("pricing")) return "api-stream";
  return "pipeline-arch";
}

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

  const dateLabel = formatBlogDate(post.publishedAt) || "Aug 19, 2026";
  const title = post.headline || post.title;
  const useVideoHero = slug === "how-bluefox-works" || slug === "text-to-3d";

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
      <PickleArticlePage
        kicker={post.category || "Blog"}
        kickerHref="/blog"
        title={title}
        subtitle={post.excerpt || undefined}
        date={dateLabel}
        author={post.author ? `${post.author} Team` : "Hydrilla Team"}
        wideTitle
        heroVideoSrc={useVideoHero ? WHY_HYDRILLA_MEDIA.bluefox.video : undefined}
        heroPosterSrc={
          post.coverImage ||
          (useVideoHero ? WHY_HYDRILLA_MEDIA.bluefox.poster : undefined)
        }
        heroThumbVariant={
          !post.coverImage && !useVideoHero ? pickHeroVariant(slug) : undefined
        }
        ctaLabel="Open Studio"
        ctaHref="/app/studio"
      >
        <div
          className="pickle-prose"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        <Suspense fallback={null}>
          <div style={{ width: "100%" }}>
            <BlogContinueSection excludeSlug={slug} />
          </div>
        </Suspense>
      </PickleArticlePage>
    </>
  );
}
