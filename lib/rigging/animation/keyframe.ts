import * as THREE from "three";

/** One key for a single bone at a given frame. */
export interface BoneKeyframe {
  frame: number;
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
}

/**
 * Sparse keyframes per bone name. Used to build THREE.AnimationClip tracks
 * relative to an AnimationMixer root (e.g. SkinnedMesh) with uniquely named bones.
 */
export class KeyframeStore {
  /** boneName -> sorted keyframes by frame */
  private byBone = new Map<string, BoneKeyframe[]>();
  /** All frames that have at least one key (for UI markers). */
  private allFrames = new Set<number>();

  clear(): void {
    this.byBone.clear();
    this.allFrames.clear();
  }

  /** Record pose for one bone at `frame` (replaces existing key at same frame for that bone). */
  setBoneKeyframe(frame: number, boneName: string, position: THREE.Vector3, quaternion: THREE.Quaternion): void {
    const list = this.byBone.get(boneName) ?? [];
    const idx = list.findIndex((k) => k.frame === frame);
    const entry: BoneKeyframe = {
      frame,
      position: position.clone(),
      quaternion: quaternion.clone(),
    };
    if (idx >= 0) list[idx] = entry;
    else {
      list.push(entry);
      list.sort((a, b) => a.frame - b.frame);
    }
    this.byBone.set(boneName, list);
    this.allFrames.add(frame);
  }

  getKeyedFrames(): number[] {
    return Array.from(this.allFrames).sort((a, b) => a - b);
  }

  hasAnyKeyframes(): boolean {
    return this.allFrames.size > 0;
  }

  /**
   * Build an AnimationClip from stored keyframes.
   * @param durationSec clip length in seconds (timeline length)
   * @param fps frames per second used to convert frame indices to times
   */
  buildClip(name: string, durationSec: number, fps: number): THREE.AnimationClip | null {
    const tracks: THREE.KeyframeTrack[] = [];

    for (const [boneName, keys] of Array.from(this.byBone.entries())) {
      if (keys.length === 0) continue;

      const posTimes: number[] = [];
      const posValues: number[] = [];
      const quatTimes: number[] = [];
      const quatValues: number[] = [];

      for (const k of keys) {
        const t = k.frame / fps;
        posTimes.push(t);
        posValues.push(k.position.x, k.position.y, k.position.z);
        quatTimes.push(t);
        quatValues.push(k.quaternion.x, k.quaternion.y, k.quaternion.z, k.quaternion.w);
      }

      if (posTimes.length > 0) {
        tracks.push(new THREE.VectorKeyframeTrack(`${boneName}.position`, posTimes, posValues));
      }
      if (quatTimes.length > 0) {
        tracks.push(new THREE.QuaternionKeyframeTrack(`${boneName}.quaternion`, quatTimes, quatValues));
      }
    }

    if (tracks.length === 0) return null;
    return new THREE.AnimationClip(name, durationSec, tracks);
  }
}
