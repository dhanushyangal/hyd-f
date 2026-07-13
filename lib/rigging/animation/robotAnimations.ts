import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { remapClipToSkeleton } from "./mixer";

const ROBOT_GLB_URL = "/assets/animations/RobotExpressive.glb";

let cachedClips: THREE.AnimationClip[] | null = null;
let inflight: Promise<THREE.AnimationClip[]> | null = null;

/**
 * Loads RobotExpressive.glb once and returns its animation clips.
 * Subsequent calls return the cached array.
 */
export async function loadRobotAnimations(): Promise<THREE.AnimationClip[]> {
  if (cachedClips) return cachedClips;
  if (inflight) return inflight;

  inflight = (async () => {
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(ROBOT_GLB_URL);
    const clips = gltf.animations ?? [];
    cachedClips = clips;
    if (typeof window !== "undefined") {
      console.log("[Rigging] RobotExpressive animations loaded:", clips.map((c) => c.name));
    }
    return clips;
  })();

  return inflight;
}

/**
 * UI label → RobotExpressive clip name.
 * Robot ships with: Idle, Walking, Running, Dance, Death, Sitting, Standing,
 *                   Jump, Yes, No, Wave, Punch, ThumbsUp
 */
export const ROBOT_CLIP_MAP: Record<string, string> = {
  Idle: "Idle",
  Walk: "Walking",
  Run: "Running",
  Dance: "Dance",
  Jump: "Jump",
  Wave: "Wave",
  Punch: "Punch",
  Yes: "Yes",
  No: "No",
  ThumbsUp: "ThumbsUp",
};

/**
 * Find a clip by its robot name (case-insensitive).
 */
export function findRobotClip(
  clips: THREE.AnimationClip[],
  name: string,
): THREE.AnimationClip | null {
  const lower = name.toLowerCase();
  return clips.find((c) => c.name.toLowerCase() === lower) ?? null;
}

/**
 * Build retargeted versions of robot clips for a given target skeleton.
 * Returns a dictionary: { "Idle": AnimationClip, "Walking": AnimationClip, ... }
 * Only clips that have at least one matching bone after remapping are included.
 */
export function buildRobotActionsForSkeleton(
  clips: THREE.AnimationClip[],
  targetBoneNames: Set<string>,
): Record<string, THREE.AnimationClip> {
  const out: Record<string, THREE.AnimationClip> = {};
  for (const clip of clips) {
    const remapped = remapClipToSkeleton(clip, targetBoneNames);
    if (remapped.tracks.length > 0) {
      remapped.name = clip.name;
      out[clip.name] = remapped;
    }
  }
  return out;
}
