import { PRICING, SLOT_PRICING } from "@/lib/pricing";

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
const PRICING_POST_EXCERPT =
  `Free is $${PRICING.free.monthly} with ${PRICING.free.credits} credits. Starter is $${PRICING.starter.monthly}/month. Pro is $${PRICING.pro.monthly}/month. Slot and Slot Pro are $${SLOT_PRICING.slot.monthly} and $${SLOT_PRICING.slot_pro.monthly} for a chosen daily window.`;

function withCanonicalPricing(post: BlogPost): BlogPost {
  if (post.slug !== "hydrilla-pricing-explained") return post;

  return {
    ...post,
    title: "Hydrilla pricing explained",
    headline: "How do Hydrilla plans work?",
    excerpt: PRICING_POST_EXCERPT,
    seoTitle: "Hydrilla pricing explained: plans, credits, and model estimates",
    seoDescription: PRICING_POST_EXCERPT,
    updatedAt: "2026-10-15T00:00:00+00:00",
    content: `<p>Hydrilla has five monthly plans. Free is $${PRICING.free.monthly} with ${PRICING.free.credits.toLocaleString("en-US")} credits and GLB export. Starter is $${PRICING.starter.monthly}/month with ${PRICING.starter.credits.toLocaleString("en-US")} credits. Pro is $${PRICING.pro.monthly}/month with ${PRICING.pro.credits.toLocaleString("en-US")} credits, seats, and REST API access. Starter and Pro export GLB, FBX, OBJ, and USDZ, and generate at any hour.</p>
<p>Slot is $${SLOT_PRICING.slot.monthly}/month with the Starter credit budget and one daily generation hour. Slot Pro is $${SLOT_PRICING.slot_pro.monthly}/month with the Pro credit budget and two daily generation hours. You pick the window in Billing; the interface shows it in local time.</p>
<h2>How many models do the credits cover?</h2>
<p>A default model costs 30 credits from an uploaded image. A text prompt also creates the source image, bringing the default total to 45 credits. At that rate, 100 credits covers about 2 models from text or 3 from uploaded images. 900 credits covers about 20 from text or 30 from images. 3,000 credits covers about 66 from text or 100 from images. Leftover credits stay on the account.</p>
<h2>Which plan fits which workflow?</h2>
<p>Use Free to try the workflow. Starter fits individual creators who generate at any hour. Pro fits studios and small teams that need more volume, seats, or API access. Slot and Slot Pro fit work that can run during a chosen daily window.</p>
<h2>Can I cancel?</h2>
<p>Yes. Plans are monthly and managed from account settings. Switching to or from a Slot plan requires cancelling the current paid plan first.</p>
<h2>Where are the official numbers?</h2>
<p>The current plan table lives on <a href="/pricing">Pricing</a>. Volume beyond Pro is handled through <a href="/enterprise">Enterprise</a>.</p>`,
  };
}

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
  const result = await fetchJson<BlogListResponse>(
    `/api/blog/posts${qs ? `?${qs}` : ""}`
  );
  return {
    ...result,
    posts: result.posts.map((post) =>
      post.slug === "hydrilla-pricing-explained"
        ? {
            ...post,
            title: "Hydrilla pricing explained",
            headline: "How do Hydrilla plans work?",
            excerpt: PRICING_POST_EXCERPT,
            seoTitle:
              "Hydrilla pricing explained: plans, credits, and model estimates",
            seoDescription: PRICING_POST_EXCERPT,
            updatedAt: "2026-10-15T00:00:00+00:00",
          }
        : post
    ),
  };
}

export async function fetchBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const data = await fetchJson<{ post: BlogPost }>(`/api/blog/posts/${encodeURIComponent(slug)}`);
    return withCanonicalPricing(data.post);
  } catch {
    return null;
  }
}

export async function fetchBlogSlugs(): Promise<Array<{ slug: string; updatedAt: string }>> {
  try {
    const data = await fetchJson<{ slugs: Array<{ slug: string; updatedAt: string }> }>(
      "/api/blog/slugs"
    );
    return data.slugs.map((item) =>
      item.slug === "hydrilla-pricing-explained"
        ? { ...item, updatedAt: "2026-10-15T00:00:00+00:00" }
        : item
    );
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
