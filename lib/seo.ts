import type { Metadata } from "next";

import { HERO_POSTER_URL } from "./cloudinary";
import { FAQ_ITEMS } from "./faq";
import { PRICING } from "./pricing";
import { TEAM_MEMBERS } from "./team";
import {
  ABOUT_META,
  BLUEFOX_LEDE,
  BLUEFOX_META,
  BRAND_SENTENCE,
  CONTACT_EMAIL,
  DEFAULT_DESCRIPTION,
  ENTITY_IDS,
  FEATURES_META,
  FOUNDER_ROLES,
  HOME_TITLE,
  MODEL_FAMILY,
  MODEL_NAME,
  MODEL_PAGE_TITLE,
  PRODUCT_NAME,
  RESEARCH_LAB,
  RESEARCH_LEDE,
  SITE_NAME,
  SITE_URL,
  SOCIAL_PROFILES,
  TWITTER_HANDLE,
} from "./brand";

export {
  ABOUT_META,
  BLUEFOX_LEDE,
  BLUEFOX_META,
  BRAND_SENTENCE,
  CONTACT_EMAIL,
  DEFAULT_DESCRIPTION,
  FEATURES_META,
  HOME_TITLE,
  MODEL_FAMILY,
  MODEL_NAME,
  MODEL_PAGE_TITLE,
  PRODUCT_NAME,
  RESEARCH_LAB,
  RESEARCH_LEDE,
  SITE_NAME,
  SITE_URL,
  SOCIAL_PROFILES,
  TWITTER_HANDLE,
};

export const DEFAULT_OG_IMAGE = HERO_POSTER_URL;

/** Public marketing pages included in the sitemap. */
export const PUBLIC_ROUTES: Array<{
  path: string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/pricing", changeFrequency: "weekly", priority: 0.9 },
  { path: "/features", changeFrequency: "weekly", priority: 0.9 },
  { path: "/bluefox3d", changeFrequency: "monthly", priority: 0.9 },
  { path: "/usecase", changeFrequency: "monthly", priority: 0.8 },
  { path: "/usecase/gamedev", changeFrequency: "monthly", priority: 0.7 },
  { path: "/usecase/filmproduction", changeFrequency: "monthly", priority: 0.7 },
  { path: "/usecase/architecture", changeFrequency: "monthly", priority: 0.7 },
  { path: "/usecase/arvr", changeFrequency: "monthly", priority: 0.7 },
  { path: "/usecase/productdesign", changeFrequency: "monthly", priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.8 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.8 },
  { path: "/docs", changeFrequency: "monthly", priority: 0.8 },
  { path: "/api", changeFrequency: "monthly", priority: 0.7 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/research", changeFrequency: "monthly", priority: 0.8 },
  { path: "/enterprise", changeFrequency: "monthly", priority: 0.7 },
  { path: "/security", changeFrequency: "monthly", priority: 0.6 },
  { path: "/changelog", changeFrequency: "weekly", priority: 0.6 },
  { path: "/blog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/compare", changeFrequency: "monthly", priority: 0.8 },
  { path: "/team", changeFrequency: "monthly", priority: 0.6 },
  { path: "/careers", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms-and-conditions", changeFrequency: "yearly", priority: 0.3 },
  { path: "/cookie-policy", changeFrequency: "yearly", priority: 0.3 },
];

type PageMetadataOptions = {
  title: string;
  description?: string;
  path: string;
  /** Use for the homepage and sitelink titles to avoid the title template suffix. */
  absoluteTitle?: boolean;
  noIndex?: boolean;
  keywords?: string[];
  ogImage?: string;
};

export function absoluteUrl(path: string): string {
  if (path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function markdownUrl(path: string): string {
  if (path === "/") return `${SITE_URL}/index.md`;
  return `${absoluteUrl(path)}.md`;
}

export function createPageMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  absoluteTitle = false,
  noIndex = false,
  keywords,
  ogImage,
}: PageMetadataOptions): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = absoluteTitle ? title : `${title} | ${SITE_NAME}`;
  const image = ogImage || DEFAULT_OG_IMAGE;

  return {
    title: absoluteTitle ? { absolute: fullTitle } : title,
    description,
    keywords: keywords?.length ? keywords : undefined,
    alternates: noIndex
      ? { canonical: url }
      : {
          canonical: url,
          types: { "text/markdown": markdownUrl(path) },
        },
    openGraph: {
      type: "website",
      locale: "en_US",
      url,
      siteName: SITE_NAME,
      title: fullTitle,
      description,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: fullTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: TWITTER_HANDLE,
      creator: TWITTER_HANDLE,
      title: fullTitle,
      description,
      images: [image],
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

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function getWebPageJsonLd(opts: {
  name: string;
  description: string;
  path: string;
  crumbs?: Array<{ name: string; path: string }>;
}) {
  const url = absoluteUrl(opts.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: opts.name,
        description: opts.description,
        isPartOf: { "@id": ENTITY_IDS.website },
        about: { "@id": ENTITY_IDS.hydrilla },
      },
      breadcrumbJsonLd(
        opts.crumbs ?? [
          { name: "Home", path: "/" },
          { name: opts.name, path: opts.path },
        ]
      ),
    ],
  };
}

function founderNodes() {
  return TEAM_MEMBERS.filter((member) => FOUNDER_ROLES.has(member.role)).map(
    (member) => ({
      "@type": "Person" as const,
      name: member.name,
      jobTitle: member.role,
      url: member.connect,
      image: absoluteUrl(member.image),
      worksFor: { "@id": ENTITY_IDS.hydrilla },
    })
  );
}

export function getHomepageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ResearchOrganization",
        "@id": ENTITY_IDS.hawan,
        name: RESEARCH_LAB,
        url: absoluteUrl("/research"),
        description: RESEARCH_LEDE,
        subOrganization: { "@id": ENTITY_IDS.hydrilla },
      },
      {
        "@type": "Organization",
        "@id": ENTITY_IDS.hydrilla,
        name: SITE_NAME,
        legalName: SITE_NAME,
        alternateName: ["Hydrilla AI", "Hydrilla.ai"],
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: absoluteUrl("/hyd01.png"),
          width: 512,
          height: 512,
        },
        description: DEFAULT_DESCRIPTION,
        email: CONTACT_EMAIL,
        sameAs: [...SOCIAL_PROFILES],
        parentOrganization: { "@id": ENTITY_IDS.hawan },
        founder: founderNodes(),
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: CONTACT_EMAIL,
          url: absoluteUrl("/contact"),
        },
      },
      {
        "@type": "WebSite",
        "@id": ENTITY_IDS.website,
        url: SITE_URL,
        name: SITE_NAME,
        description: DEFAULT_DESCRIPTION,
        publisher: { "@id": ENTITY_IDS.hydrilla },
        inLanguage: "en-US",
      },
      {
        "@type": "SoftwareApplication",
        "@id": ENTITY_IDS.product,
        name: PRODUCT_NAME,
        alternateName: ["Hydrilla AI"],
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        description: DEFAULT_DESCRIPTION,
        publisher: { "@id": ENTITY_IDS.hydrilla },
        isRelatedTo: { "@id": ENTITY_IDS.bluefox },
        softwareHelp: {
          "@type": "CreativeWork",
          url: absoluteUrl("/docs"),
        },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          url: absoluteUrl("/pricing"),
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": ENTITY_IDS.bluefox,
        name: MODEL_NAME,
        alternateName: [MODEL_PAGE_TITLE, MODEL_FAMILY],
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        url: absoluteUrl("/bluefox3d"),
        description: BLUEFOX_LEDE,
        provider: { "@id": ENTITY_IDS.hawan },
        isRelatedTo: { "@id": ENTITY_IDS.product },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          url: absoluteUrl("/pricing"),
        },
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        url: SITE_URL,
        name: HOME_TITLE,
        isPartOf: { "@id": ENTITY_IDS.website },
        about: { "@id": ENTITY_IDS.hydrilla },
        description: DEFAULT_DESCRIPTION,
        inLanguage: "en-US",
      },
    ],
  };
}

export function getUseCaseJsonLd(opts: {
  name: string;
  description: string;
  path: string;
}) {
  const url = absoluteUrl(opts.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": ENTITY_IDS.product,
        name: PRODUCT_NAME,
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        description: DEFAULT_DESCRIPTION,
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          url: absoluteUrl("/pricing"),
        },
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: `${opts.name} | ${SITE_NAME}`,
        description: opts.description,
        isPartOf: { "@id": ENTITY_IDS.website },
        about: { "@id": ENTITY_IDS.product },
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Use cases", path: "/usecase" },
        { name: opts.name, path: opts.path },
      ]),
    ],
  };
}

export function getFaqJsonLd() {
  const url = absoluteUrl("/faq");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        url,
        name: `FAQ | ${SITE_NAME}`,
        mainEntity: FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "FAQ", path: "/faq" },
      ]),
    ],
  };
}

export function getPricingJsonLd() {
  const url = absoluteUrl("/pricing");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": ENTITY_IDS.product,
        name: PRODUCT_NAME,
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        url: SITE_URL,
        description: DEFAULT_DESCRIPTION,
        publisher: { "@id": ENTITY_IDS.hydrilla },
        offers: [
          {
            "@type": "Offer",
            name: PRICING.free.label,
            price: String(PRICING.free.monthly),
            priceCurrency: "USD",
            url,
          },
          {
            "@type": "Offer",
            name: PRICING.creator.label,
            price: String(PRICING.creator.monthly),
            priceCurrency: "USD",
            url,
          },
          {
            "@type": "Offer",
            name: PRICING.studio.label,
            price: String(PRICING.studio.monthly),
            priceCurrency: "USD",
            url,
          },
        ],
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: `Pricing | ${SITE_NAME}`,
        description:
          "Free, Creator, and Studio plans for production-ready 3D generation.",
        isPartOf: { "@id": ENTITY_IDS.website },
        about: { "@id": ENTITY_IDS.product },
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Pricing", path: "/pricing" },
      ]),
    ],
  };
}

export function getAboutJsonLd() {
  const url = absoluteUrl("/about");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "AboutPage",
        "@id": `${url}#webpage`,
        url,
        name: `About Hydrilla, Hawan Research Labs, and BlueFox | ${SITE_NAME}`,
        description: ABOUT_META,
        isPartOf: { "@id": ENTITY_IDS.website },
        about: { "@id": ENTITY_IDS.hydrilla },
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "About", path: "/about" },
      ]),
    ],
  };
}

export function getResearchJsonLd() {
  const url = absoluteUrl("/research");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ResearchOrganization",
        "@id": ENTITY_IDS.hawan,
        name: RESEARCH_LAB,
        url,
        description: RESEARCH_LEDE,
        subOrganization: { "@id": ENTITY_IDS.hydrilla },
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: `${RESEARCH_LAB} | BlueFox 3D research`,
        description: RESEARCH_LEDE,
        isPartOf: { "@id": ENTITY_IDS.website },
        about: { "@id": ENTITY_IDS.hawan },
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Research", path: "/research" },
      ]),
    ],
  };
}

export function getDocsJsonLd() {
  const url = absoluteUrl("/docs");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        "@id": `${url}#article`,
        url,
        headline: `Docs | Get started with Hydrilla`,
        name: `Docs | Get started with Hydrilla`,
        description:
          "Get started with Hydrilla: text-to-3D, image-to-3D, preview, exports, workspaces, and credits.",
        author: { "@id": ENTITY_IDS.hydrilla },
        publisher: { "@id": ENTITY_IDS.hydrilla },
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Docs", path: "/docs" },
      ]),
    ],
  };
}

export function getBlueFoxJsonLd() {
  const url = absoluteUrl("/bluefox3d");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        "@id": ENTITY_IDS.bluefox,
        name: MODEL_NAME,
        alternateName: [MODEL_PAGE_TITLE, MODEL_FAMILY],
        applicationCategory: "DesignApplication",
        operatingSystem: "Web",
        url,
        description: BLUEFOX_LEDE,
        provider: { "@id": ENTITY_IDS.hawan },
        isRelatedTo: { "@id": ENTITY_IDS.product },
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          url: absoluteUrl("/pricing"),
        },
      },
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: `BlueFox 3D | BlueFox 1 generative 3D model`,
        isPartOf: { "@id": ENTITY_IDS.website },
        about: { "@id": ENTITY_IDS.bluefox },
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: MODEL_PAGE_TITLE, path: "/bluefox3d" },
      ]),
    ],
  };
}

export function getTeamJsonLd() {
  const url = absoluteUrl("/team");
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#webpage`,
        url,
        name: `Team | ${SITE_NAME}`,
        isPartOf: { "@id": ENTITY_IDS.website },
        about: { "@id": ENTITY_IDS.hydrilla },
      },
      ...TEAM_MEMBERS.map((member) => ({
        "@type": "Person",
        name: member.name,
        jobTitle: member.role,
        image: absoluteUrl(member.image),
        url: `${url}#${member.id}`,
        worksFor: { "@id": ENTITY_IDS.hydrilla },
        sameAs: member.connect ? [member.connect] : undefined,
      })),
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: "Team", path: "/team" },
      ]),
    ],
  };
}

export function getArticleJsonLd(opts: {
  headline: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
}) {
  const url = absoluteUrl(opts.path);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${url}#article`,
        headline: opts.headline,
        description: opts.description,
        url,
        datePublished: opts.datePublished,
        dateModified: opts.dateModified || opts.datePublished,
        author: { "@id": ENTITY_IDS.hydrilla },
        publisher: {
          "@type": "Organization",
          "@id": ENTITY_IDS.hydrilla,
          name: SITE_NAME,
        },
        mainEntityOfPage: url,
      },
      breadcrumbJsonLd([
        { name: "Home", path: "/" },
        { name: opts.path.startsWith("/compare") ? "Compare" : "Blog", path: opts.path.startsWith("/compare") ? "/compare" : "/blog" },
        { name: opts.headline, path: opts.path },
      ]),
    ],
  };
}
