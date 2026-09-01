import { notFound } from "next/navigation";
import { BlogIndexPageView } from "@/components/blog/BlogIndexPageView";
import { fetchBlogCategories } from "@/lib/blog";
import { categoryToSlug } from "@/lib/blog-routes";

export const revalidate = 3600;

type Props = { params: Promise<{ category: string }> };

export async function generateStaticParams() {
  try {
    const categories = await fetchBlogCategories();
    return categories.map((category) => ({ category: categoryToSlug(category) }));
  } catch {
    return [];
  }
}

export default async function BlogCategoryPage({ params }: Props) {
  const { category } = await params;

  try {
    const categories = await fetchBlogCategories();
    const exists = categories.some((cat) => categoryToSlug(cat) === category.toLowerCase());
    if (!exists) notFound();
  } catch {
    // Backend unavailable at build time — render page; grid shows empty state.
  }

  return <BlogIndexPageView categorySlug={category} />;
}
