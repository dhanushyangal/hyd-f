import * as THREE from "three";
import { remapClipToSkeleton } from "./mixer";

/**
 * Retarget animation clips to a target skeleton by remapping bone names.
 * Uses the alias-aware remapping from mixer.ts.
 */
export function retargetClips(
  clips: THREE.AnimationClip[],
  validBoneNames: Set<string>,
): THREE.AnimationClip[] {
  const out: THREE.AnimationClip[] = [];

  for (const clip of clips) {
    const remapped = remapClipToSkeleton(clip, validBoneNames);
    if (remapped.tracks.length > 0) {
      if (remapped.name === clip.name) {
        remapped.name = clip.name + "_retargeted";
      }
      out.push(remapped);
    }
  }

  return out;
}
