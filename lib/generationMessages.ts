/** User-facing copy for generation overlays — stage text only, same UI. */

export function threeDStageMessage(progress: number): string {
  if (progress < 12) {
    return "Preparing your image…";
  }
  if (progress < 35) {
    return "Building geometry…";
  }
  if (progress < 65) {
    return "Adding detail & texture…";
  }
  if (progress < 90) {
    return "Finalizing your mesh…";
  }
  return "Almost ready…";
}

export function threeDQueueMessage(jobsAhead: number, waitMin: number): string {
  if (jobsAhead <= 0) {
    return "Starting soon…";
  }
  if (waitMin > 0) {
    return `You're in the queue · ${jobsAhead} ahead · ~${waitMin} min`;
  }
  return `You're in the queue · ${jobsAhead} ahead`;
}

export const GEN_MSG = {
  imageFromText: "Creating your image…",
  editingImage: "Updating your image…",
  conceptArt: "Creating concept art…",
  editingBaseImage: "Updating the base image…",
  starting3d: "Preparing your 3D model…",
  modifying3d: "Updating your 3D model…",
  applying3d: "Applying your changes…",
  queued3d: "You're in the queue…",
  fallback3d: "Building your 3D model…",
} as const;
