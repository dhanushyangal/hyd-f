import Link from "next/link";
import { BlogFeaturedPost, BlogPostCard } from "@/components/content/BlogPostCard";
import { fetchBlogCategories, fetchBlogPosts } from "@/lib/blog";
import { blogIndexPath, categoryToSlug, resolveCategorySlug } from "@/lib/blog-routes";

type BlogIndexGridProps = {
  page?: number;
  categorySlug?: string;
};

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
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-6">
        <div className="rounded-xl border border-dashed border-neutral-200 px-6 py-16 text-center">
          <p className="text-[16px] font-medium text-neutral-950">Category not found</p>
          <Link href="/blog" className="mt-3 inline-block text-[14px] font-medium text-neutral-600 hover:text-neutral-950">
            Back to blog
          </Link>
        </div>
      </div>
    );
  }

  try {
    list = await fetchBlogPosts({ page, limit: 12, category: category ?? undefined });
  } catch {
    list = { posts: [], total: 0, page, limit: 12, totalPages: 1 };
  }

  const featured = page === 1 && !category ? list.posts[0] : null;
  const gridPosts = featured ? list.posts.slice(1) : list.posts;

  return (
    <BlogIndexBody
      categories={categories}
      activeCategory={category ?? undefined}
      page={page}
      totalPages={list.totalPages}
      posts={list.posts}
      featured={featured}
      gridPosts={gridPosts}
    />
  );
}

type BlogIndexBodyProps = {
  categories: string[];
  activeCategory?: string;
  page: number;
  totalPages: number;
  posts: Awaited<ReturnType<typeof fetchBlogPosts>>["posts"];
  featured: Awaited<ReturnType<typeof fetchBlogPosts>>["posts"][0] | null;
  gridPosts: Awaited<ReturnType<typeof fetchBlogPosts>>["posts"];
};

function BlogIndexBody({
  categories,
  activeCategory,
  page,
  totalPages,
  posts,
  featured,
  gridPosts,
}: BlogIndexBodyProps) {
  return (
    <div className="mx-auto max-w-5xl space-y-10 px-5 py-10 sm:px-6 sm:py-14">
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link
            href="/blog"
            className={`rounded-full px-3 py-1 text-[13px] font-medium transition-colors ${
              !activeCategory
                ? "bg-neutral-950 text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            All
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/blog/category/${categoryToSlug(cat)}`}
              className={`rounded-full px-3 py-1 text-[13px] font-medium transition-colors ${
                activeCategory === cat
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
              href={blogIndexPath({ page: page - 1, category: activeCategory })}
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
              href={blogIndexPath({ page: page + 1, category: activeCategory })}
              className="text-[14px] font-medium text-neutral-600 hover:text-neutral-950"
            >
              Next →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
