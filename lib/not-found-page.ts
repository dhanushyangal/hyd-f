/**
 * 404 page feature flag. Change this one word.
 * "desktop" = clean Hydrilla desktop editorial 404 page (instant, zero WebGL).
 * "grass3d" = full-screen interactive 3D grass field loaded from Cloudinary.
 */
export type NotFoundPageVariant = "desktop" | "grass3d";

export const NOT_FOUND_PAGE = "desktop" as NotFoundPageVariant;
