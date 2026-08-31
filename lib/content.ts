import fs from "node:fs";
import path from "node:path";
import { markdownToHtml, parseFrontmatter } from "./markdown";

export type ArticleCollection = "compare";

export type Article = {
  slug: string;
  collection: ArticleCollection;
  path: string;
  title: string;
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  cluster: string;
  markdown: string;
  html: string;
};

const CONTENT_ROOT = path.join(process.cwd(), "content");

function readCollection(collection: ArticleCollection): Article[] {
  const dir = path.join(CONTENT_ROOT, collection);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .map((file) => {
      const slug = file.replace(/\.md$/, "");
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const { data, content } = parseFrontmatter(raw);
      return {
        slug,
        collection,
        path: `/${collection}/${slug}`,
        title: data.title || slug,
        headline: data.headline || data.title || slug,
        description: data.description || "",
        datePublished: data.date || data.datePublished || "2026-08-19",
        dateModified: data.updated || data.dateModified,
        cluster: data.cluster || "Compare",
        markdown: content,
        html: markdownToHtml(content),
      };
    })
    .sort((a, b) => b.datePublished.localeCompare(a.datePublished));
}

let cache: Article[] | null = null;

export function getAllArticles(): Article[] {
  if (cache) return cache;
  cache = readCollection("compare");
  return cache;
}

export function getArticles(collection: ArticleCollection): Article[] {
  return getAllArticles().filter((article) => article.collection === collection);
}

export function getArticle(
  collection: ArticleCollection,
  slug: string
): Article | undefined {
  return getAllArticles().find(
    (article) => article.collection === collection && article.slug === slug
  );
}

export function getRelatedArticles(article: Article, limit = 3): Article[] {
  const pool = getAllArticles().filter((item) => item.path !== article.path);
  const sameCluster = pool.filter((item) => item.cluster === article.cluster);
  const rest = pool.filter((item) => item.cluster !== article.cluster);
  return [...sameCluster, ...rest].slice(0, limit);
}

const CLUSTER_ORDER = ["Compare"];

export function groupArticlesByCluster(
  articles: Article[]
): { cluster: string; articles: Article[] }[] {
  const map = new Map<string, Article[]>();
  for (const article of articles) {
    const list = map.get(article.cluster) ?? [];
    list.push(article);
    map.set(article.cluster, list);
  }
  const keys = [
    ...CLUSTER_ORDER.filter((key) => map.has(key)),
    ...[...map.keys()].filter((key) => !CLUSTER_ORDER.includes(key)),
  ];
  return keys.map((cluster) => ({ cluster, articles: map.get(cluster)! }));
}
