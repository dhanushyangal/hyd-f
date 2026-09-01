import { notFound } from "next/navigation";
import { BlogIndexPageView } from "@/components/blog/BlogIndexPageView";
import { fetchBlogCategories, fetchBlogPosts } from "@/lib/blog";
import { categoryToSlug, resolveCategorySlug } from "@/lib/blog-routes";

export const revalidate = 3600;

type Props = { params: Promise<{ category: string; page: string }> };

export async function generateStaticParams() {
  try {
    const categories = await fetchBlogCategories();
    return categories.flatMap((category) => [
      { category: categoryToSlug(category), page: "2" },
      { category: categoryToSlug(category), page: "3" },
    ]);
  } catch {
    return [];
  }
}

export default async function BlogCategoryPaginatedPage({ params }: Props) {
  const { category: categorySlug, page: pageStr } = await params;
  const page = Number(pageStr);
  if (!Number.isInteger(page) || page < 2) notFound();

  let categories: string[] = [];
  try {
    categories = await fetchBlogCategories();
  } catch {
    return <BlogIndexPageView page={page} categorySlug={categorySlug} />;
  }

  const category = resolveCategorySlug(categorySlug, categories);
  if (!category) notFound();

  try {
    const { totalPages } = await fetchBlogPosts({ page, limit: 12, category });
    if (page > totalPages) notFound();
  } catch {
    // Backend unavailable at build time — page still renders with empty fallback.
  }

  return <BlogIndexPageView page={page} categorySlug={categorySlug} />;
}
