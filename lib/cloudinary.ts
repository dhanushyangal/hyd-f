/** Cloudinary delivery helpers — f_webp for explicit WebP delivery. */

export const CLOUDINARY_CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "dqizbxc9e";

export const CLOUDINARY_IMAGE_BASE = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;
export const CLOUDINARY_VIDEO_BASE = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/video/upload`;

const VERSION = "v1";

export function cloudinaryImage(
  publicId: string,
  transform = "f_webp,q_auto"
): string {
  return `${CLOUDINARY_IMAGE_BASE}/${transform}/${VERSION}/${publicId}`;
}

export function cloudinaryVideo(
  publicId: string,
  transform = "q_auto"
): string {
  return `${CLOUDINARY_VIDEO_BASE}/${transform}/${VERSION}/${publicId}`;
}

/** Full-viewport hero poster (WebP). */
export const HERO_POSTER_URL = cloudinaryImage(
  "hydrilla-landing/hero/poster",
  "f_webp,q_auto:eco,c_fill,w_1600,h_900"
);

/** Preload-sized hero poster for faster LCP (eco quality, capped width). */
export const HERO_POSTER_PRELOAD_URL = cloudinaryImage(
  "hydrilla-landing/hero/poster",
  "f_webp,q_auto:eco,c_fill,w_1280,h_720"
);

/** Hero background video — deferred after idle in Hero.tsx. */
export const HERO_VIDEO_URL = cloudinaryVideo("hydrilla-landing/hero/backdrop");

/** Use-case hero card images (WebP). */
export function usecaseHeroImage(
  id: string,
  transform = "f_webp,q_auto,c_fit,w_840,h_1050"
): string {
  return cloudinaryImage(`hydrilla-landing/usecase/${id}`, transform);
}

export const USECASE_HERO = {
  games: usecaseHeroImage("games"),
  films: usecaseHeroImage("films"),
  archi: usecaseHeroImage("archi"),
  prod: usecaseHeroImage("prod"),
  arvr3: usecaseHeroImage("arvr3"),
  arvrxr: usecaseHeroImage("arvrxr"),
  arvrxr2: usecaseHeroImage("arvrxr2"),
} as const;

/** Why Hydrilla bento media (WebP posters + optimized video). */
const WHY_FOLDER = "hydrilla-landing/why-hydrilla";

export function whyHydrillaImage(
  id: string,
  transform = "f_webp,q_auto,c_fill,w_1200"
): string {
  return cloudinaryImage(`${WHY_FOLDER}/${id}`, transform);
}

export function whyHydrillaVideo(
  id: string,
  transform = "q_auto,vc_auto"
): string {
  return cloudinaryVideo(`${WHY_FOLDER}/${id}`, transform);
}

/** First-frame WebP poster from a Why Hydrilla video. */
export function whyHydrillaVideoPoster(
  id: string,
  transform = "so_0,f_webp,q_auto,c_fill,w_1200"
): string {
  return `${CLOUDINARY_VIDEO_BASE}/${transform}/${VERSION}/${WHY_FOLDER}/${id}`;
}

export const WHY_HYDRILLA_MEDIA = {
  bluefox: {
    video: whyHydrillaVideo("bluefox-why"),
    poster: whyHydrillaVideoPoster("bluefox-why", "so_0,f_webp,q_auto,c_fill,w_1600"),
  },
  fast: {
    video: whyHydrillaVideo("fast-why"),
    poster: whyHydrillaVideoPoster("fast-why"),
  },
  threeD: {
    video: whyHydrillaVideo("3d-why"),
    poster: whyHydrillaVideoPoster("3d-why"),
  },
  multi: {
    video: whyHydrillaVideo("multi-why"),
    poster: whyHydrillaVideoPoster("multi-why"),
  },
  rockey: {
    video: whyHydrillaVideo("rockey-why"),
    poster: whyHydrillaVideoPoster("rockey-why"),
  },
  tenX: {
    video: whyHydrillaVideo("10x-why"),
    poster: whyHydrillaVideoPoster("10x-why"),
  },
  assets: {
    video: whyHydrillaVideo("3d-assets-why"),
    poster: whyHydrillaVideoPoster("3d-assets-why"),
  },
  blender: {
    video: whyHydrillaVideo("blender-why"),
    poster: whyHydrillaVideoPoster("blender-why"),
  },
  disc: {
    video: whyHydrillaVideo("disc-why"),
    poster: whyHydrillaVideoPoster("disc-why"),
  },
  mesh: {
    video: whyHydrillaVideo("mesh-why"),
    poster: whyHydrillaVideoPoster("mesh-why"),
  },
  model: {
    video: whyHydrillaVideo("model-why"),
    poster: whyHydrillaVideoPoster("model-why"),
  },
  texture: {
    video: whyHydrillaVideo("texture-why-model"),
    poster: whyHydrillaVideoPoster("texture-why-model"),
  },
  bike: whyHydrillaImage("bike-why", "f_webp,q_auto,c_fill,w_1000"),
  fish: whyHydrillaImage("fish-why", "f_webp,q_auto,c_fill,w_1000"),
  cta: whyHydrillaImage("cta-photo", "f_webp,q_auto,c_fill,w_1000"),
} as const;

/** Pricing plan card images (WebP). */
export function pricingPlanImage(
  id: "pricing-1" | "pricing-2" | "pricing-3",
  transform = "f_webp,q_auto,c_fill,w_960"
): string {
  return cloudinaryImage(`hydrilla-landing/pricing/${id}`, transform);
}

export const PRICING_IMAGES = {
  free: pricingPlanImage("pricing-3"),
  creator: pricingPlanImage("pricing-1"),
  studio: pricingPlanImage("pricing-2"),
} as const;
