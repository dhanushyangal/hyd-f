/**
 * Library bar feature flag. Change this one word.
 * "expandable" = four previews; right-click expands into the full library.
 * "options" = All, 3D, and Image on top, with a scrollable list under them.
 * Only one bar is shown.
 */
export type LibraryBarName = "expandable" | "options";

export const LIBRARY_BAR = "options" as LibraryBarName;
