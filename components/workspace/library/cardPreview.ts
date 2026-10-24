import type { BackendJob } from "@/lib/api";

/**
 * What a library card should show.
 * A cloud mesh stores the input photo — often with the background removed — as
 * previewImageUrl. That URL is not a render of the model. Only a snapshot we
 * took of the GLB (a data URL) belongs on the 3D card.
 */
export function libraryCardPreview(job: BackendJob, kind: "3d" | "image"): string | null {
  if (kind === "image") return job.previewImageUrl || job.imageUrl || null;
  const preview = job.previewImageUrl;
  if (job.resultGlbUrl) {
    return preview?.startsWith("data:") ? preview : null;
  }
  if (preview?.startsWith("data:")) return preview;
  if (preview && preview !== job.imageUrl) return preview;
  return null;
}
