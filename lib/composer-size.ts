/**
 * Composer feature flag. Change this one word.
 * "small" = the compact composer.
 * "medium" = the default, between small and large.
 * "large" = the original wide composer.
 */
export type ComposerSizeName = "small" | "medium" | "large";

export const COMPOSER_SIZE = "medium" as ComposerSizeName;
