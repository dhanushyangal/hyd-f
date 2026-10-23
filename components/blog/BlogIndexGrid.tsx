import Link from "next/link";
import { blogPostPath, fetchBlogCategories, fetchBlogPosts, formatBlogDate } from "@/lib/blog";
import { blogIndexPath, categoryToSlug, resolveCategorySlug } from "@/lib/blog-routes";
import {
  PickleResearchCard,
  type PickleThumbVariant,
} from "@/components/layout/PicklePage";

type BlogIndexGridProps = {
  page?: number;
  categorySlug?: string;
};

const THUMB_VARIANTS: PickleThumbVariant[] = [
  "pipeline-arch",
  "critter-rig",
  "docs-flow",
  "compare-tripo",
  "privacy-enclave",
  "unity-engine",
  "api-stream",
  "unreal-engine",
];

function pickThumbVariant(slug: string, index: number): PickleThumbVariant {
  if (slug.includes("bluefox")) return "critter-rig";
  if (slug.includes("privacy") || slug.includes("security")) return "privacy-enclave";
  if (slug.includes("export")) return "docs-flow";
  if (slug.includes("unity")) return "unity-engine";
  if (slug.includes("unreal")) return "unreal-engine";
  if (slug.includes("blender")) return "pipeline-arch";
  if (slug.includes("pricing")) return "api-stream";
  return THUMB_VARIANTS[index % THUMB_VARIANTS.length];
}

export async function BlogIndexGrid({ page = 1, categorySlug }: BlogIndexGridProps) {
  let categories: string[] = [];
  let list: Awaited<ReturnType<typeof fetchBlogPosts>> = {
    posts: [],
    total: 0,
    page,
    limit: 12,
    totalPages: 1,
  };

  try {
    categories = await fetchBlogCategories();
  } catch {
    categories = [];
  }

  const category = categorySlug ? resolveCategorySlug(categorySlug, categories) : undefined;

  if (categorySlug && !category) {
    return (
      <div className="pickle-research-container" style={{ marginTop: "48px" }}>
        <p className="pickle-text">That category is not on the blog.</p>
        <p className="pickle-text" style={{ marginTop: "16px" }}>
          <Link href="/blog">Back to blog</Link>
        </p>
      </div>
    );
  }

  try {
    list = await fetchBlogPosts({ page, limit: 12, category: category ?? undefined });
  } catch {
    list = { posts: [], total: 0, page, limit: 12, totalPages: 1 };
  }

  return (
    <BlogIndexBody
      categories={categories}
      activeCategory={category ?? undefined}
      page={page}
      totalPages={list.totalPages}
      posts={list.posts}
    />
  );
}

function BlogIndexBody({
  categories,
  activeCategory,
  page,
  totalPages,
  posts,
}: {
  categories: string[];
  activeCategory?: string;
  page: number;
  totalPages: number;
  posts: Awaited<ReturnType<typeof fetchBlogPosts>>["posts"];
}) {
  return (
    <>
      {categories.length > 0 ? (
        <div className="pickle-research-container" style={{ marginTop: "32px" }}>
          <nav
            aria-label="Blog categories"
            className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[16px] font-medium"
          >
            <Link
              href="/blog"
              aria-current={!activeCategory ? "page" : undefined}
              className={
                !activeCategory
                  ? "text-black underline underline-offset-4"
                  : "text-black/45 transition-opacity hover:text-black/80"
              }
            >
              All
            </Link>
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <Link
                  key={cat}
                  href={`/blog/category/${categoryToSlug(cat)}`}
                  aria-current={active ? "page" : undefined}
                  className={
                    active
                      ? "text-black underline underline-offset-4"
                      : "text-black/45 transition-opacity hover:text-black/80"
                  }
                >
                  {cat}
                </Link>
              );
            })}
          </nav>
        </div>
      ) : null}

      {posts.length === 0 ? (
        <div className="pickle-research-container" style={{ marginTop: "48px" }}>
          <p className="pickle-text">No posts yet.</p>
          <p className="pickle-text" style={{ marginTop: "16px" }}>
            Check back for notes on BlueFox and production 3D.
          </p>
        </div>
      ) : (
        <ul className="pickle-research-grid">
          {posts.map((post, idx) => {
            const dateLabel = formatBlogDate(post.publishedAt) || "Aug 19, 2026";
            return (
              <PickleResearchCard
                key={post.slug}
                item={{
                  title: post.title,
                  subtitle: post.excerpt,
                  href: blogPostPath(post.slug),
                  date: dateLabel,
                  author: post.author ? `${post.author} Team` : "Hydrilla Team",
                  imageSrc: post.coverImage,
                  thumbVariant: pickThumbVariant(post.slug, idx),
                }}
              />
            );
          })}
        </ul>
      )}

      {totalPages > 1 ? (
        <div className="pickle-research-container" style={{ marginTop: "64px" }}>
          <nav
            aria-label="Pagination"
            className="flex items-center justify-between text-[16px] font-medium text-black"
          >
            {page > 1 ? (
              <Link
                href={blogIndexPath({ page: page - 1, category: activeCategory })}
                className="underline underline-offset-4 hover:opacity-60"
              >
                Previous
              </Link>
            ) : (
              <span />
            )}
            <span className="text-black/45 tabular-nums">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={blogIndexPath({ page: page + 1, category: activeCategory })}
                className="underline underline-offset-4 hover:opacity-60"
              >
                Next
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </div>
      ) : null}
    </>
  );
}
