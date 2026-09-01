/** URL-safe category segment for /blog/category/[category] */
export function categoryToSlug(category: string): string {
  return category.toLowerCase().replace(/\s+/g, "-");
}

/** Match a URL segment to a real category name from the API list. */
export function resolveCategorySlug(segment: string, categories: string[]): string | null {
  const normalized = segment.toLowerCase();
  return categories.find((cat) => categoryToSlug(cat) === normalized) ?? null;
}

export function blogIndexPath(opts?: { page?: number; category?: string }): string {
  const page = opts?.page ?? 1;
  const category = opts?.category;

  if (category && page > 1) {
    return `/blog/category/${categoryToSlug(category)}/page/${page}`;
  }
  if (category) {
    return `/blog/category/${categoryToSlug(category)}`;
  }
  if (page > 1) {
    return `/blog/page/${page}`;
  }
  return "/blog";
}
