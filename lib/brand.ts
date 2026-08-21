/**
 * Canonical naming — OpenAI / ChatGPT, Anthropic / Claude style.
 *
 * Hawan Research Labs  research lab
 * Hydrilla             product (the platform people use)
 * BlueFox              model family
 * BlueFox 1            current model
 *
 * Public copy never uses: Bluefox3D-v1, "Hydrilla AI Organization",
 * internal ids (trilles), or backend hosts as canonical URLs.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://hydrilla.ai";

/** Product name — used in titles, schema, and UI. */
export const SITE_NAME = "Hydrilla";

export const PRODUCT_NAME = "Hydrilla";

export const RESEARCH_LAB = "Hawan Research Labs";

export const MODEL_FAMILY = "BlueFox";

/** Current generation model. */
export const MODEL_NAME = "BlueFox 1";

/** Marketing page title / sitelink label for the model. */
export const MODEL_PAGE_TITLE = "BlueFox 3D";

export const CONTACT_EMAIL = "founders@hydrilla.ai";

export const DEMO_URL = "https://cal.com/hydrilla";

export const TWITTER_HANDLE = "@hydrillaai";

/**
 * One sentence used on the homepage description, About, footer, and JSON-LD.
 * Keep these in lockstep so crawlers and LLMs see a single entity claim.
 */
export const BRAND_SENTENCE =
  "Hydrilla is built for creators, studios, and teams who need fast generation of production-ready 3D assets for games, film, architecture, and digital products.";

export const DEFAULT_DESCRIPTION = BRAND_SENTENCE;

export const HOME_TITLE =
  "Hydrilla | Production-Ready 3D Assets, Generated Fast";

/** Research page lede — JSON-LD ResearchOrganization description. */
export const RESEARCH_LEDE =
  "Hawan Research Labs is the research lab that builds the generative 3D models behind Hydrilla. Our first public model family is BlueFox 3D. The current model is BlueFox 1.";

/** BlueFox 3D page opening — JSON-LD SoftwareApplication description. */
export const BLUEFOX_LEDE =
  "BlueFox 3D is the generative 3D model family built by Hawan Research Labs. BlueFox 1 is the current model. It runs inside Hydrilla, the product used by creators, studios, and teams.";

export const BLUEFOX_META =
  "BlueFox 3D is Hawan Research Labs’ generative 3D model family. BlueFox 1 turns text or images into segmented meshes with PBR, exported from Hydrilla.";

export const ABOUT_META =
  "Hydrilla is the product. Hawan Research Labs is the lab. BlueFox 3D is the model family. Built for creators and studios who need production-ready 3D, fast.";

export const FEATURES_META =
  "Text-to-3D and image-to-3D, segmented meshes, PBR materials, in-browser preview, and GLB, FBX, OBJ, and USDZ exports for Unity, Unreal, and Blender.";

export const SOCIAL_PROFILES = [
  "https://x.com/hydrillaai",
  "https://www.linkedin.com/company/hydrilla-ai",
  "https://www.reddit.com/r/hydrilla",
  "https://www.instagram.com/hydrilla.ai",
] as const;

export const ENTITY_IDS = {
  hydrilla: `${SITE_URL}/#organization`,
  website: `${SITE_URL}/#website`,
  product: `${SITE_URL}/#software`,
  hawan: `${SITE_URL}/research#organization`,
  bluefox: `${SITE_URL}/bluefox3d#software`,
} as const;

export const FOUNDER_ROLES = new Set([
  "Co-Founder",
  "Co-Founder & CTO",
  "Co-Founder & CGO",
]);
