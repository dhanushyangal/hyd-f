export type BlogPost = {
  slug: string;
  title: string;
  headline: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  category: string;
  author: string;
  publishedAt: string | null;
  updatedAt: string;
  seoTitle: string | null;
  seoDescription: string | null;
  seoImage: string | null;
};

export type BlogListResponse = {
  posts: BlogPost[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

function backendBase(): string {
  return (process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000").replace(/\/+$/, "");
}

async function fetchJson<T>(path: string, revalidate = 60): Promise<T> {
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

const CLUSTER_ORDER = ["BlueFox", "Pipeline", "Plans", "General"];

export function groupPostsByCategory(
  posts: BlogPost[]
): { category: string; posts: BlogPost[] }[] {
  const map = new Map<string, BlogPost[]>();
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

/** Continue nav: one latest post per category (newest first from API). */
export async function getBlogContinueLinks(excludeSlug?: string): Promise<ContinueLink[]> {
  try {
    const { posts } = await fetchBlogPosts({ limit: 100 });
    const latestByCategory = new Map<string, BlogPost>();

    for (const post of posts) {
      if (excludeSlug && post.slug === excludeSlug) continue;
      if (!latestByCategory.has(post.category)) {
        latestByCategory.set(post.category, post);
      }
    }

    const keys = [
      ...CLUSTER_ORDER.filter((key) => latestByCategory.has(key)),
      ...[...latestByCategory.keys()].filter((key) => !CLUSTER_ORDER.includes(key)),
    ];

    return keys.map((category) => {
      const item = latestByCategory.get(category)!;
      return {
        label: item.title,
        href: blogPostPath(item.slug),
        hint: category,
      };
    });
  } catch {
    return [];
  }
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
