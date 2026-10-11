/** Backend-facing section; drives which existing generate handler runs. */
export type WorkspaceSection = "agent" | "image" | "model" | "edit";

/** What the user picks in the composer. Edit is implied by attaching a 3D model in 3D mode. */
export type ComposerMode = "image" | "3d" | "agent";

/** 3D source: an image (image → 3D) or a text prompt (text → image → 3D). */
export type Model3DInput = "image" | "prompt";

/** The 3D tab's input switch; "edit" changes an existing model instead of making a new one. */
export type Model3DSource = Model3DInput | "edit";

export function composerModeForSection(section: WorkspaceSection): ComposerMode {
  if (section === "agent") return "agent";
  if (section === "image") return "image";
  return "3d";
}
