/** Convert timeline frame index to seconds. */
export function frameToTime(frame: number, fps: number): number {
  return frame / fps;
}

/** Convert seconds to nearest frame index (clamped). */
export function timeToFrame(time: number, fps: number, maxFrame: number): number {
  return Math.max(0, Math.min(maxFrame, Math.round(time * fps)));
}
