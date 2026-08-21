import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo";

const DISALLOW = [
  "/app/",
  "/workspace/",
  "/generate/",
  "/generations/",
  "/library/",
  "/checkout/",
  "/rigging/",
  "/sign-in/",
  "/sign-up/",
  "/viewer/",
  "/earlyaccess/",
  "/md/",
  "/brand",
];

const AI_CRAWLERS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Bingbot",
  "Applebot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOW,
      },
      ...AI_CRAWLERS.map((userAgent) => ({
        userAgent,
        allow: "/",
        disallow: DISALLOW,
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
