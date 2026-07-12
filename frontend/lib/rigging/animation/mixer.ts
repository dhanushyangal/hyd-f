import * as THREE from "three";

const MAX_DELTA = 0.1;

export function createRigMixer(root: THREE.Object3D): THREE.AnimationMixer {
  return new THREE.AnimationMixer(root);
}

export function updateMixer(mixer: THREE.AnimationMixer | null, delta: number): void {
  if (!mixer) return;
  mixer.update(Math.min(delta, MAX_DELTA));
}

/**
 * Canonical aliases: maps common variant names to our template names.
 * Used bidirectionally — we can map FROM our names TO skeleton names and vice versa.
 */
const BONE_ALIASES: Record<string, string[]> = {
  Hips:        ["hips", "pelvis", "hip", "rootnode", "root"],
  Spine:       ["spine", "spine1"],
  Chest:       ["chest", "spine2", "spine1"],
  Neck:        ["neck"],
  Head:        ["head"],
  L_UpperArm:  ["leftupperarm", "leftshoulder", "l_upperarm", "leftarm", "l_arm", "upperleftarm"],
  R_UpperArm:  ["rightupperarm", "rightshoulder", "r_upperarm", "rightarm", "r_arm", "upperrightarm"],
  L_LowerArm:  ["leftlowerarm", "leftforearm", "l_lowerarm", "l_forearm", "lowerleftarm"],
  R_LowerArm:  ["rightlowerarm", "rightforearm", "r_lowerarm", "r_forearm", "lowerrightarm"],
  L_Hand:      ["lefthand", "l_hand", "lefthandslot"],
  R_Hand:      ["righthand", "r_hand", "righthandslot"],
  L_UpperLeg:  ["leftupleg", "leftupperleg", "l_upperleg", "l_thigh", "leftthigh", "upperleftleg", "leftleg"],
  R_UpperLeg:  ["rightupleg", "rightupperleg", "r_upperleg", "r_thigh", "rightthigh", "upperrightleg", "rightleg"],
  L_LowerLeg:  ["leftlowerleg", "l_lowerleg", "l_shin", "leftshin", "lowerleftleg", "leftlegback"],
  R_LowerLeg:  ["rightlowerleg", "r_lowerleg", "r_shin", "rightshin", "lowerrightleg", "rightlegback"],
  L_Foot:      ["leftfoot", "l_foot"],
  R_Foot:      ["rightfoot", "r_foot"],
};

function buildLookup(): Map<string, string> {
  const m = new Map<string, string>();
  for (const [canonical, aliases] of Object.entries(BONE_ALIASES)) {
    m.set(canonical.toLowerCase(), canonical);
    for (const a of aliases) m.set(a.toLowerCase(), canonical);
  }
  return m;
}
const ALIAS_LOOKUP = buildLookup();

/**
 * Remap clip track names so they target bones that actually exist in the skeleton.
 *
 * Strategy:
 *  1. If the track's node name is already in the bone set → keep as-is.
 *  2. Strip common prefixes (mixamorig:, mixamorig) and try again.
 *  3. Normalize both names through the alias table to find a match.
 *  4. Skip tracks that can't be resolved (no match = track dropped).
 */
export function remapClipToSkeleton(
  clip: THREE.AnimationClip,
  boneNames: Set<string>,
): THREE.AnimationClip {
  const lowerToBone = new Map<string, string>();
  for (const bn of Array.from(boneNames)) {
    lowerToBone.set(bn.toLowerCase(), bn);
    const stripped = bn.replace(/^mixamorig:/i, "").replace(/^mixamorig/i, "");
    lowerToBone.set(stripped.toLowerCase(), bn);
    const canonical = ALIAS_LOOKUP.get(stripped.toLowerCase());
    if (canonical) lowerToBone.set(canonical.toLowerCase(), bn);
  }

  const tracks: THREE.KeyframeTrack[] = [];
  let changed = false;

  for (const track of clip.tracks) {
    const dot = track.name.indexOf(".");
    const nodeName = dot >= 0 ? track.name.slice(0, dot) : track.name;
    const prop = dot >= 0 ? track.name.slice(dot) : "";

    if (boneNames.has(nodeName)) {
      tracks.push(track);
      continue;
    }

    const stripped = nodeName.replace(/^mixamorig:/i, "").replace(/^mixamorig/i, "");
    let mapped = lowerToBone.get(stripped.toLowerCase());
    if (!mapped) {
      const canonical = ALIAS_LOOKUP.get(stripped.toLowerCase());
      if (canonical) mapped = lowerToBone.get(canonical.toLowerCase());
    }
    if (!mapped) {
      mapped = lowerToBone.get(nodeName.toLowerCase());
    }

    if (mapped) {
      if (mapped === nodeName) {
        tracks.push(track);
      } else {
        const clone = track.clone();
        clone.name = `${mapped}${prop}`;
        tracks.push(clone);
        changed = true;
      }
    }
  }

  if (!changed && tracks.length === clip.tracks.length) return clip;
  return new THREE.AnimationClip(clip.name, clip.duration, tracks);
}
