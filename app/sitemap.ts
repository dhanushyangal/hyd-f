import fs from "node:fs";
import path from "node:path";
import type { MetadataRoute } from "next";
import { getAllArticles } from "@/lib/content";
import { PUBLIC_ROUTES, absoluteUrl } from "@/lib/seo";

const APP_ROOT = path.join(process.cwd(), "app");
const CONTENT_ROOT = path.join(process.cwd(), "content");
const COMPONENTS_ROOT = path.join(process.cwd(), "components");

function mtimeIfExists(abs: string): Date | null {
  try {
    return fs.statSync(abs).mtime;
  } catch {
    return null;
  }
}

function routeLastModified(routePath: string): Date {
  if (routePath === "/") {
    return (
      mtimeIfExists(path.join(APP_ROOT, "page.tsx")) ||
      mtimeIfExists(
        path.join(COMPONENTS_ROOT, "sections", "HomeEntityIntro.tsx")
      ) ||
      new Date()
    );
  }

  const trimmed = routePath.replace(/^\//, "").replace(/\/+$/, "");
  return (
    mtimeIfExists(path.join(APP_ROOT, trimmed, "page.tsx")) ||
    mtimeIfExists(path.join(APP_ROOT, trimmed, "layout.tsx")) ||
    new Date()
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages = PUBLIC_ROUTES.map(({ path: routePath, changeFrequency, priority }) => ({
    url: absoluteUrl(routePath),
    lastModified: routeLastModified(routePath),
    changeFrequency,
    priority,
  }));

  const articles = getAllArticles().map((article) => {
    const contentFile = path.join(
      CONTENT_ROOT,
      article.collection,
      `${article.slug}.md`
    );
    return {
      url: absoluteUrl(article.path),
      lastModified: article.dateModified
        ? new Date(article.dateModified)
        : mtimeIfExists(contentFile) ?? new Date(article.datePublished),
      changeFrequency: "monthly" as const,
      priority: article.collection === "compare" ? 0.75 : 0.65,
    };
  });

  return [...pages, ...articles];
}
