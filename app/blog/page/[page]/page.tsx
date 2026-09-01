import { notFound } from "next/navigation";
import { BlogIndexPageView } from "@/components/blog/BlogIndexPageView";
import { fetchBlogCategories } from "@/lib/blog";

export const revalidate = 3600;

type Props = { params: Promise<{ page: string }> };

export async function generateStaticParams() {
  return [{ page: "2" }, { page: "3" }];
}

export default async function BlogPaginatedPage({ params }: Props) {
  const { page: pageStr } = await params;
  const page = Number(pageStr);
  if (!Number.isInteger(page) || page < 2) notFound();

  try {
    const { fetchBlogPosts } = await import("@/lib/blog");
    const { totalPages } = await fetchBlogPosts({ page, limit: 12 });
    if (page > totalPages) notFound();
  } catch {
    // Backend unavailable at build time — page still renders with empty fallback.
  }

  return <BlogIndexPageView page={page} />;
}
