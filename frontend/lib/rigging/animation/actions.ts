import * as THREE from "three";

const _e = new THREE.Euler(0, 0, 0, "XYZ");
const _q = new THREE.Quaternion();

function quatTrack(bone: string, times: number[], eulerKeyframes: [number, number, number][]): THREE.QuaternionKeyframeTrack {
  const values: number[] = [];
  for (const [rx, ry, rz] of eulerKeyframes) {
    _e.set(rx, ry, rz);
    _q.setFromEuler(_e);
    values.push(_q.x, _q.y, _q.z, _q.w);
  }
  return new THREE.QuaternionKeyframeTrack(`${bone}.quaternion`, times, values);
}

/**
 * Subtle breathing / sway — rotation only, no position displacement.
 * Targets human template bone names; remapClipToSkeleton adapts them.
 */
export function createIdleClip(duration = 3.0): THREE.AnimationClip {
  const t = [0, duration * 0.5, duration];
  const tracks: THREE.KeyframeTrack[] = [];

  tracks.push(quatTrack("Spine", t, [
    [0.02, 0, 0],
    [-0.015, 0, 0],
    [0.02, 0, 0],
  ]));
  tracks.push(quatTrack("Chest", t, [
    [0.015, 0, 0],
    [-0.01, 0, 0],
    [0.015, 0, 0],
  ]));
  tracks.push(quatTrack("Head", t, [
    [0.02, 0.02, 0],
    [-0.015, -0.02, 0],
    [0.02, 0.02, 0],
  ]));
  tracks.push(quatTrack("L_UpperArm", t, [
    [0, 0, -0.02],
    [0, 0, 0.01],
    [0, 0, -0.02],
  ]));
  tracks.push(quatTrack("R_UpperArm", t, [
    [0, 0, 0.02],
    [0, 0, -0.01],
    [0, 0, 0.02],
  ]));

  return new THREE.AnimationClip("Idle", duration, tracks);
}

/**
 * Walk cycle — rotation-only on legs, arms, spine. No position tracks.
 */
export function createWalkClip(duration = 1.0): THREE.AnimationClip {
  const q = duration * 0.25;
  const h = duration * 0.5;
  const tq = duration * 0.75;
  const t4 = [0, q, h, tq, duration];
  const t2 = [0, h, duration];
  const tracks: THREE.KeyframeTrack[] = [];

  // Hips sway (rotation only — no position offset!)
  tracks.push(quatTrack("Hips", t4, [
    [0, 0, 0.015],
    [0, 0, 0],
    [0, 0, -0.015],
    [0, 0, 0],
    [0, 0, 0.015],
  ]));

  // Legs — alternating forward/back swing
  tracks.push(quatTrack("L_UpperLeg", t2, [
    [-0.35, 0, 0],
    [0.25, 0, 0],
    [-0.35, 0, 0],
  ]));
  tracks.push(quatTrack("R_UpperLeg", t2, [
    [0.25, 0, 0],
    [-0.35, 0, 0],
    [0.25, 0, 0],
  ]));
  tracks.push(quatTrack("L_LowerLeg", t2, [
    [-0.1, 0, 0],
    [-0.6, 0, 0],
    [-0.1, 0, 0],
  ]));
  tracks.push(quatTrack("R_LowerLeg", t2, [
    [-0.6, 0, 0],
    [-0.1, 0, 0],
    [-0.6, 0, 0],
  ]));

  // Arms — opposite swing to legs
  tracks.push(quatTrack("L_UpperArm", t2, [
    [0.2, 0, 0],
    [-0.15, 0, 0],
    [0.2, 0, 0],
  ]));
  tracks.push(quatTrack("R_UpperArm", t2, [
    [-0.15, 0, 0],
    [0.2, 0, 0],
    [-0.15, 0, 0],
  ]));

  // Spine counter-rotation for natural look
  tracks.push(quatTrack("Spine", t2, [
    [0.03, 0.03, 0],
    [0.03, -0.03, 0],
    [0.03, 0.03, 0],
  ]));
  tracks.push(quatTrack("Chest", t2, [
    [0.02, -0.02, 0],
    [0.02, 0.02, 0],
    [0.02, -0.02, 0],
  ]));

  return new THREE.AnimationClip("Walk", duration, tracks);
}

/**
 * Run cycle — faster, larger rotations than walk, still rotation-only.
 */
export function createRunClip(duration = 0.6): THREE.AnimationClip {
  const h = duration * 0.5;
  const t = [0, h, duration];
  const tracks: THREE.KeyframeTrack[] = [];

  tracks.push(quatTrack("Hips", t, [
    [0.04, 0, 0.02],
    [-0.02, 0, -0.02],
    [0.04, 0, 0.02],
  ]));

  tracks.push(quatTrack("L_UpperLeg", t, [
    [-0.55, 0, 0],
    [0.4, 0, 0],
    [-0.55, 0, 0],
  ]));
  tracks.push(quatTrack("R_UpperLeg", t, [
    [0.4, 0, 0],
    [-0.55, 0, 0],
    [0.4, 0, 0],
  ]));
  tracks.push(quatTrack("L_LowerLeg", t, [
    [-0.15, 0, 0],
    [-0.85, 0, 0],
    [-0.15, 0, 0],
  ]));
  tracks.push(quatTrack("R_LowerLeg", t, [
    [-0.85, 0, 0],
    [-0.15, 0, 0],
    [-0.85, 0, 0],
  ]));

  tracks.push(quatTrack("L_UpperArm", t, [
    [0.35, 0, 0],
    [-0.25, 0, 0],
    [0.35, 0, 0],
  ]));
  tracks.push(quatTrack("R_UpperArm", t, [
    [-0.25, 0, 0],
    [0.35, 0, 0],
    [-0.25, 0, 0],
  ]));
  tracks.push(quatTrack("L_LowerArm", t, [
    [-0.5, 0, 0],
    [-0.2, 0, 0],
    [-0.5, 0, 0],
  ]));
  tracks.push(quatTrack("R_LowerArm", t, [
    [-0.2, 0, 0],
    [-0.5, 0, 0],
    [-0.2, 0, 0],
  ]));

  tracks.push(quatTrack("Spine", t, [
    [0.06, 0.04, 0],
    [0.06, -0.04, 0],
    [0.06, 0.04, 0],
  ]));
  tracks.push(quatTrack("Chest", t, [
    [0.04, -0.03, 0],
    [0.04, 0.03, 0],
    [0.04, -0.03, 0],
  ]));

  return new THREE.AnimationClip("Run", duration, tracks);
}

export const FADE_DURATION = 0.25;
