export type BlogListPost = {
  slug: string;
  title: string;
  headline: string;
  excerpt: string;
  coverImage: string | null;
  category: string;
  author: string;
  publishedAt: string | null;
  updatedAt: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoImage: string | null;
};

export type BlogPost = BlogListPost & {
  content: string;
};

export type BlogListResponse = {
  posts: BlogListPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ContinueItem = {
  slug: string;
  title: string;
  category: string;
};

const BLOG_REVALIDATE = 3600;

function backendBase(): string {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");
}

async function fetchJson<T>(path: string, revalidate = BLOG_REVALIDATE): Promise<T> {
  const res = await fetch(`${backendBase()}${path}`, {
    next: { revalidate },
  });
  if (!res.ok) {
    throw new Error(`Blog API error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchBlogPosts(opts?: {
  page?: number;
  limit?: number;
  category?: string;
}): Promise<BlogListResponse> {
  const params = new URLSearchParams();
  if (opts?.page) params.set("page", String(opts.page));
  if (opts?.limit) params.set("limit", String(opts.limit));
  if (opts?.category) params.set("category", opts.category);
  const qs = params.toString();
  return fetchJson<BlogListResponse>(`/api/blog/posts${qs ? `?${qs}` : ""}`);
}

export async function fetchBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const data = await fetchJson<{ post: BlogPost }>(`/api/blog/posts/${encodeURIComponent(slug)}`);
    return data.post;
  } catch {
    return null;
  }
}

export async function fetchBlogSlugs(): Promise<Array<{ slug: string; updatedAt: string }>> {
  try {
    const data = await fetchJson<{ slugs: Array<{ slug: string; updatedAt: string }> }>(
      "/api/blog/slugs"
    );
    return data.slugs;
  } catch {
    return [];
  }
}

export async function fetchBlogCategories(): Promise<string[]> {
  try {
    const data = await fetchJson<{ categories: string[] }>("/api/blog/categories");
    return data.categories;
  } catch {
    return [];
  }
}

export async function fetchBlogContinue(excludeSlug?: string): Promise<ContinueItem[]> {
  try {
    const qs = excludeSlug ? `?exclude=${encodeURIComponent(excludeSlug)}` : "";
    const data = await fetchJson<{ items: ContinueItem[] }>(`/api/blog/continue${qs}`);
    return data.items;
  } catch {
    return [];
  }
}

export function groupPostsByCategory(
  posts: BlogListPost[]
): { category: string; posts: BlogListPost[] }[] {
  const CLUSTER_ORDER = ["BlueFox", "Pipeline", "Plans", "General"];
  const map = new Map<string, BlogListPost[]>();
  for (const post of posts) {
    const list = map.get(post.category) ?? [];
    list.push(post);
    map.set(post.category, list);
  }
  const keys = [
    ...CLUSTER_ORDER.filter((key) => map.has(key)),
    ...[...map.keys()].filter((key) => !CLUSTER_ORDER.includes(key)),
  ];
  return keys.map((category) => ({ category, posts: map.get(category)! }));
}

export function formatBlogDate(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso.slice(0, 10);
  }
}

export function blogPostPath(slug: string): string {
  return `/blog/${slug}`;
}

export type ContinueLink = {
  label: string;
  href: string;
  hint?: string;
};

export function continueItemsToLinks(items: ContinueItem[]): ContinueLink[] {
  return items.map((item) => ({
    label: item.title,
    href: blogPostPath(item.slug),
    hint: item.category,
  }));
}

/** Continue nav for article pages — lightweight /continue API. */
export async function getBlogContinueLinks(excludeSlug?: string): Promise<ContinueLink[]> {
  const items = await fetchBlogContinue(excludeSlug);
  return continueItemsToLinks(items);
}

/** Simple HTML → markdown for GEO .md mirrors */
export function htmlToMarkdownLite(html: string): string {
  let md = html;
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");
  md = md.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  md = md.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");
  md = md.replace(/<code[^>]*>(.*?)<\/code>/gi, "`$1`");
  md = md.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");
  md = md.replace(/<li[^>]*>(.*?)<\/li>/gi, "- $1\n");
  md = md.replace(/<\/ul>/gi, "\n");
  md = md.replace(/<\/ol>/gi, "\n");
  md = md.replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, "> $1\n\n");
  md = md.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");
  md = md.replace(/<br\s*\/?>/gi, "\n");
  md = md.replace(/<[^>]+>/g, "");
  md = md.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
  return md.trim();
}
