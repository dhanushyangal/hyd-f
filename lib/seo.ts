import type { Metadata } from "next";

import { HERO_POSTER_URL } from "./cloudinary";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://hydrilla.ai";

export const SITE_NAME = "Hydrilla AI";

export const DEFAULT_DESCRIPTION =
  "Hydrilla is built for creators, studios, and teams who need fast generation of production-ready 3D assets for games, film, architecture, and digital products.";

export const DEFAULT_OG_IMAGE = HERO_POSTER_URL;

export const SOCIAL_PROFILES = [
  "https://x.com/hydrillaai",
  "https://www.linkedin.com/company/hydrilla-ai",
  "https://www.reddit.com/r/hydrilla",
  "https://www.instagram.com/hydrilla.ai",
] as const;

/** Public marketing pages included in the sitemap. */
export const PUBLIC_ROUTES: Array<{
  path: string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
  { path: "/features", changeFrequency: "weekly", priority: 0.9 },
  { path: "/usecase", changeFrequency: "monthly", priority: 0.8 },
  { path: "/usecase/gamedev", changeFrequency: "monthly", priority: 0.7 },
  { path: "/usecase/filmproduction", changeFrequency: "monthly", priority: 0.7 },
  { path: "/usecase/architecture", changeFrequency: "monthly", priority: 0.7 },
  { path: "/usecase/arvr", changeFrequency: "monthly", priority: 0.7 },
  { path: "/usecase/productdesign", changeFrequency: "monthly", priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
  { path: "/docs", changeFrequency: "monthly", priority: 0.7 },
  { path: "/api", changeFrequency: "monthly", priority: 0.7 },
  { path: "/team", changeFrequency: "monthly", priority: 0.6 },
  { path: "/careers", changeFrequency: "monthly", priority: 0.6 },
  { path: "/3d-ai", changeFrequency: "monthly", priority: 0.6 },
  { path: "/case-study", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms-and-conditions", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cookie-policy", changeFrequency: "yearly", priority: 0.3 },
];

type PageMetadataOptions = {
  title: string;
  description?: string;
  path: string;
  /** Use for the homepage to avoid the title template suffix. */
  absoluteTitle?: boolean;
  noIndex?: boolean;
};

export function absoluteUrl(path: string): string {
  if (path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function createPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  absoluteTitle = false,
  noIndex = false,
}: PageMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;

  return {
    title: absoluteTitle ? { absolute: fullTitle } : title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [
        {
          url: DEFAULT_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@hydrillaai",
      creator: "@hydrillaai",
      title: fullTitle,
      description,
      images: [DEFAULT_OG_IMAGE],
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

export function getHomepageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: SITE_NAME,
        alternateName: ["Hydrilla", "Hydrilla.ai"],
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/hyd01.png"),
        },
        description: DEFAULT_DESCRIPTION,
        email: "founders@hydrilla.co",
        sameAs: [...SOCIAL_PROFILES],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: "founders@hydrilla.co",
          url: absoluteUrl("/contact"),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        publisher: { "@id": `${SITE_URL}/#organization` },
        inLanguage: "en-US",
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: `${SITE_NAME} | Production-Ready 3D Assets, Generated Fast`,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#organization` },
        description: DEFAULT_DESCRIPTION,
        inLanguage: "en-US",
      },
    ],
  };
}
