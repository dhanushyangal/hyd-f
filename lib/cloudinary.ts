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
  "f_webp,q_auto,c_fill,w_1920,h_1080"
);

/** Preload-sized hero poster for faster first paint. */
export const HERO_POSTER_PRELOAD_URL = cloudinaryImage(
  "hydrilla-landing/hero/poster",
  "f_webp,q_auto,c_fill,w_1280,h_720"
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
