import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { MarketingPage } from "@/components/layout/MarketingPage";
import { BlogFeaturedPost, BlogPostCard } from "@/components/content/BlogPostCard";
import { fetchBlogCategories, fetchBlogPosts, getBlogContinueLinks } from "@/lib/blog";
import { createPageMetadata, getWebPageJsonLd } from "@/lib/seo";

export const revalidate = 60;

export const metadata = createPageMetadata({
  title: "Hydrilla Blog — BlueFox, Pipelines, and 3D Generation",
  description:
    "Guides on text-to-3D, image-to-3D, Unity, Unreal, Blender, and how BlueFox 1 produces production meshes.",
  path: "/blog",
  absoluteTitle: true,
});

type Props = {
  searchParams: Promise<{ category?: string; page?: string }>;
};

export default async function BlogIndexPage({ searchParams }: Props) {
  const params = await searchParams;
  const category = params.category;
  const page = Number(params.page) || 1;

  let posts: Awaited<ReturnType<typeof fetchBlogPosts>>["posts"] = [];
  let totalPages = 1;
  let categories: string[] = [];

  try {
    const [list, cats] = await Promise.all([
      fetchBlogPosts({ page, limit: 12, category }),
      fetchBlogCategories(),
    ]);
    posts = list.posts;
    totalPages = list.totalPages;
    categories = cats;
  } catch {
    posts = [];
  }

  const featured = page === 1 && !category ? posts[0] : null;
  const gridPosts = featured ? posts.slice(1) : posts;

  const continueLinks = await getBlogContinueLinks();

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
        related={continueLinks}
        formats={false}
      >
        <div className="mx-auto max-w-5xl space-y-10 px-5 py-10 sm:px-6 sm:py-14">
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Link
                href="/blog"
                className={`rounded-full px-3 py-1 text-[13px] font-medium transition-colors ${
                  !category
                    ? "bg-neutral-950 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                All
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat}
                  href={`/blog?category=${encodeURIComponent(cat)}`}
                  className={`rounded-full px-3 py-1 text-[13px] font-medium transition-colors ${
                    category === cat
                      ? "bg-neutral-950 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {cat}
                </Link>
              ))}
            </div>
          )}

          {posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 px-6 py-16 text-center">
              <p className="text-[16px] font-medium text-neutral-950">No posts yet</p>
              <p className="mt-2 text-[14px] text-neutral-500">
                Check back soon for guides on BlueFox and production 3D.
              </p>
            </div>
          ) : (
            <>
              {featured ? <BlogFeaturedPost post={featured} /> : null}
              {gridPosts.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {gridPosts.map((post) => (
                    <BlogPostCard key={post.slug} post={post} />
                  ))}
                </div>
              ) : null}
            </>
          )}

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-4 pt-4" aria-label="Pagination">
              {page > 1 && (
                <Link
                  href={`/blog?${new URLSearchParams({
                    ...(category ? { category } : {}),
                    page: String(page - 1),
                  }).toString()}`}
                  className="text-[14px] font-medium text-neutral-600 hover:text-neutral-950"
                >
                  ← Previous
                </Link>
              )}
              <span className="text-[13px] tabular-nums text-neutral-400">
                Page {page} of {totalPages}
              </span>
              {page < totalPages && (
                <Link
                  href={`/blog?${new URLSearchParams({
                    ...(category ? { category } : {}),
                    page: String(page + 1),
                  }).toString()}`}
                  className="text-[14px] font-medium text-neutral-600 hover:text-neutral-950"
                >
                  Next →
                </Link>
              )}
            </nav>
          )}
        </div>
      </MarketingPage>
    </>
  );
}
