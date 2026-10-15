import Link from "next/link";
import { blogPostPath, fetchBlogCategories, fetchBlogPosts, formatBlogDate } from "@/lib/blog";
import { blogIndexPath, categoryToSlug, resolveCategorySlug } from "@/lib/blog-routes";
import { ArticleColumn } from "@/components/layout/ArticlePage";

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
      <ArticleColumn className="article-empty">
        <p className="article-body">That category is not on the blog.</p>
        <p className="article-body mt-4">
          <Link href="/blog" className="article-inline">
            Back to blog
          </Link>
        </p>
      </ArticleColumn>
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
        <ArticleColumn>
          <nav className="article-cats" aria-label="Blog categories">
            <Link href="/blog" aria-current={!activeCategory ? "page" : undefined}>
              All
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat}
                href={`/blog/category/${categoryToSlug(cat)}`}
                aria-current={activeCategory === cat ? "page" : undefined}
              >
                {cat}
              </Link>
            ))}
          </nav>
        </ArticleColumn>
      ) : null}

      {posts.length === 0 ? (
        <ArticleColumn className="article-empty">
          <p className="article-body">No posts yet.</p>
          <p className="article-body mt-4">
            Check back for notes on BlueFox and production 3D.
          </p>
        </ArticleColumn>
      ) : (
        <div className="article-list">
          {posts.map((post) => {
            const dateLabel = formatBlogDate(post.publishedAt);
            return (
              <article key={post.slug} className="article-list-item">
                <Link href={blogPostPath(post.slug)}>
                  <h2 className="article-h2">{post.title}</h2>
                  {post.excerpt ? <p className="article-body">{post.excerpt}</p> : null}
                  <p className="article-meta">
                    {post.category ? <span>{post.category}</span> : null}
                    {post.category && dateLabel ? (
                      <span className="article-meta-divider" aria-hidden />
                    ) : null}
                    {dateLabel ? <time dateTime={post.publishedAt ?? undefined}>{dateLabel}</time> : null}
                  </p>
                </Link>
              </article>
            );
          })}
        </div>
      )}

      {totalPages > 1 ? (
        <ArticleColumn>
          <nav className="article-pager" aria-label="Pagination">
            {page > 1 ? (
              <Link href={blogIndexPath({ page: page - 1, category: activeCategory })}>
                Previous
              </Link>
            ) : (
              <span />
            )}
            <span>
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={blogIndexPath({ page: page + 1, category: activeCategory })}>
                Next
              </Link>
            ) : (
              <span />
            )}
          </nav>
        </ArticleColumn>
      ) : null}
    </>
  );
}
