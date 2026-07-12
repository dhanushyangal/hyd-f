"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";

import {
  TEMPLATES,
  type JointDef,
  type SkeletonTemplate,
} from "@/lib/rigging/templates";
import { createRigMixer, updateMixer, remapClipToSkeleton } from "@/lib/rigging/animation/mixer";
import { frameToTime } from "@/lib/rigging/animation/timeline";
import { KeyframeStore } from "@/lib/rigging/animation/keyframe";
import { createIdleClip, createWalkClip, createRunClip, FADE_DURATION } from "@/lib/rigging/animation/actions";
import { retargetClips } from "@/lib/rigging/animation/retarget";
import { loadRobotAnimations, ROBOT_CLIP_MAP, buildRobotActionsForSkeleton } from "@/lib/rigging/animation/robotAnimations";

/* ────────────────────────────────────────────────────────────────────────── */
/*  Types                                                                    */
/* ────────────────────────────────────────────────────────────────────────── */

type PositionSnapshot = { name: string; x: number; y: number; z: number }[];

/* ────────────────────────────────────────────────────────────────────────── */
/*  Constants                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

const JOINT_RADIUS = 0.028;
const JOINT_COLOR = 0xff3333;
const JOINT_SELECTED_COLOR = 0x33ff88;
const BONE_COLOR = 0xffaa22;

/** Ghost mesh while editing skeleton — joints stay visible inside / behind the surface. */
const SKELETON_EDIT_MESH_OPACITY = 0.38;
const JOINT_HELPER_RENDER_ORDER = 2000;

function applySkeletonEditMeshTransparency(root: THREE.Object3D | null): void {
  if (!root) return;
  root.traverse((child) => {
    if (!(child as THREE.Mesh).isMesh) return;
    const m = child as THREE.Mesh;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats) {
      if (!mat) continue;
      mat.transparent = true;
      mat.opacity = SKELETON_EDIT_MESH_OPACITY;
      mat.depthWrite = false;
      mat.needsUpdate = true;
    }
    m.renderOrder = 0;
  });
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Component                                                                */
/* ────────────────────────────────────────────────────────────────────────── */

export default function RiggingApp() {
  /* ── state ──────────────────────────────────────────────────────────── */
  const [status, setStatus] = useState("Upload a 3D model to begin.");
  const [modelLoaded, setModelLoaded] = useState(false);
  const [templateKey, setTemplateKey] = useState<"human" | "animal">("human");
  const [skeletonVisible, setSkeletonVisible] = useState(false);
  const [selectedJoint, setSelectedJointState] = useState<string | null>(null);
  const [jointNames, setJointNames] = useState<string[]>([]);
  const [skinned, setSkinned] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [transformMode, setTransformMode] = useState<"translate" | "rotate">("translate");
  const [timelineFrame, setTimelineFrame] = useState(0);
  const [timelinePlaying, setTimelinePlaying] = useState(false);
  const [keyedFrames, setKeyedFrames] = useState<number[]>([]);
  const [importedClipNames, setImportedClipNames] = useState<string[]>([]);
  const [activeClipName, setActiveClipName] = useState<string | null>(null);
  const [robotClipNames, setRobotClipNames] = useState<string[]>([]);
  const timelineFps = 30;
  const timelineMaxFrame = 100;

  /* ── refs (Three.js objects — never trigger re-render) ─────────────── */
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const orbitRef = useRef<OrbitControls | null>(null);
  const transformRef = useRef<TransformControls | null>(null);
  const animIdRef = useRef(0);
  const clockRef = useRef<THREE.Clock | null>(null);

  const modelGroupRef = useRef<THREE.Group | null>(null);
  const jointsGroupRef = useRef<THREE.Group | null>(null);
  const jointMeshMapRef = useRef<Map<string, THREE.Mesh>>(new Map());
  const jointDataRef = useRef<JointDef[]>([]);
  const boneLinesRef = useRef<THREE.LineSegments | null>(null);
  const updateBoneLinesRef = useRef<() => void>(() => {});
  const selectedJointRef = useRef<string | null>(null);

  const exportGroupRef = useRef<THREE.Group | null>(null);
  const skinnedMeshRef = useRef<THREE.SkinnedMesh | null>(null);
  const boneByNameRef = useRef<Map<string, THREE.Bone>>(new Map());
  const bonePickMeshesRef = useRef<THREE.Mesh[]>([]);
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const userClipRef = useRef<THREE.AnimationClip | null>(null);
  const proceduralClipsRef = useRef<{ idle: THREE.AnimationClip; walk: THREE.AnimationClip; run: THREE.AnimationClip } | null>(null);
  const clipsForExportRef = useRef<THREE.AnimationClip[]>([]);
  const importedClipsRef = useRef<THREE.AnimationClip[]>([]);
  const keyframeStoreRef = useRef(new KeyframeStore());
  // RobotExpressive integration: { "Idle": AnimationClip, "Walking": AnimationClip, ... }
  const robotActionsRef = useRef<Record<string, THREE.AnimationClip>>({});

  const undoStackRef = useRef<PositionSnapshot[]>([]);
  const redoStackRef = useRef<PositionSnapshot[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const animFileInputRef = useRef<HTMLInputElement>(null);

  /* ── helpers (stable via refs — no stale closures) ─────────────────── */

  const snapshotPositions = useCallback((): PositionSnapshot => {
    return Array.from(jointMeshMapRef.current.entries()).map(([name, mesh]) => ({
      name,
      x: mesh.position.x,
      y: mesh.position.y,
      z: mesh.position.z,
    }));
  }, []);

  const restorePositions = useCallback((snap: PositionSnapshot) => {
    for (const s of snap) {
      const m = jointMeshMapRef.current.get(s.name);
      if (m) m.position.set(s.x, s.y, s.z);
    }
  }, []);

  const pushUndo = useCallback(() => {
    if (jointMeshMapRef.current.size === 0) return;
    undoStackRef.current.push(snapshotPositions());
    redoStackRef.current = [];
    setCanUndo(true);
    setCanRedo(false);
  }, [snapshotPositions]);

  const updateBoneLines = useCallback(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const joints = jointDataRef.current;
    if (joints.length === 0) return;

    const positions: number[] = [];
    const v = new THREE.Vector3();

    if (skinnedMeshRef.current && boneByNameRef.current.size > 0) {
      const sm = skinnedMeshRef.current;
      if (sm) sm.updateMatrixWorld(true);
      for (const j of joints) {
        if (!j.parent) continue;
        const cb = boneByNameRef.current.get(j.name);
        const pb = boneByNameRef.current.get(j.parent);
        if (!cb || !pb) continue;
        cb.getWorldPosition(v);
        positions.push(v.x, v.y, v.z);
        pb.getWorldPosition(v);
        positions.push(v.x, v.y, v.z);
      }
    } else {
      const meshMap = jointMeshMapRef.current;
      for (const j of joints) {
        if (!j.parent) continue;
        const child = meshMap.get(j.name);
        const parent = meshMap.get(j.parent);
        if (!child || !parent) continue;
        positions.push(child.position.x, child.position.y, child.position.z);
        positions.push(parent.position.x, parent.position.y, parent.position.z);
      }
    }

    if (boneLinesRef.current) {
      const attr = boneLinesRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
      if (attr && attr.array.length === positions.length) {
        (attr.array as Float32Array).set(positions);
        attr.needsUpdate = true;
        return;
      }
      scene.remove(boneLinesRef.current);
      boneLinesRef.current.geometry.dispose();
      (boneLinesRef.current.material as THREE.Material).dispose();
      boneLinesRef.current = null;
    }

    if (positions.length === 0) return;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const mat = new THREE.LineBasicMaterial({ color: BONE_COLOR, linewidth: 2, depthTest: false });
    const lines = new THREE.LineSegments(geo, mat);
    lines.renderOrder = 999;
    scene.add(lines);
    boneLinesRef.current = lines;
  }, []);

  updateBoneLinesRef.current = updateBoneLines;

  /* ── scene init (runs once) ────────────────────────────────────────── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setClearColor(0xf0f0f0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.01, 200);
    camera.position.set(2.5, 2, 3);
    cameraRef.current = camera;

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const dir = new THREE.DirectionalLight(0xffffff, 0.9);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    const grid = new THREE.GridHelper(12, 24, 0xcccccc, 0xe0e0e0);
    scene.add(grid);

    const orbit = new OrbitControls(camera, renderer.domElement);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.08;
    orbit.target.set(0, 0.8, 0);
    orbitRef.current = orbit;

    const tc = new TransformControls(camera, renderer.domElement);
    tc.setMode("translate");
    tc.setSize(0.55);
    scene.add(tc);
    transformRef.current = tc;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tc.addEventListener("dragging-changed", ((e: any) => {
      orbit.enabled = !e.value;
      if (!e.value) {
        updateBoneLines();
        if (!skinnedMeshRef.current) {
          undoStackRef.current.push(snapshotPositions());
          redoStackRef.current = [];
          setCanUndo(true);
          setCanRedo(false);
        }
      }
    }) as THREE.EventListener<{}, "dragging-changed", TransformControls>);

    tc.addEventListener("change", (() => {
      updateBoneLines();
    }) as THREE.EventListener<{}, "change", TransformControls>);

    const jointsGroup = new THREE.Group();
    jointsGroup.name = "__joints__";
    scene.add(jointsGroup);
    jointsGroupRef.current = jointsGroup;

    clockRef.current = new THREE.Clock();

    // Preload RobotExpressive animations in the background so they're warm
    // by the time the user binds a skeleton.
    loadRobotAnimations().catch((err) => {
      console.warn("[Rigging] RobotExpressive preload failed:", err);
    });

    /* animation loop */
    const animate = () => {
      animIdRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current?.getDelta() ?? 0;
      updateMixer(mixerRef.current, delta);
      // Keep bone-line overlay in sync with animated bones (mixer only updates
      // the mesh + bones; LineSegments need their positions refreshed each frame).
      if (skinnedMeshRef.current) {
        updateBoneLinesRef.current();
      }
      orbit.update();
      renderer.render(scene, camera);
    };
    animate();

    /* resize */
    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(container);

    /* click → raycasting joint selection */
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const picks = bonePickMeshesRef.current;
      if (skinnedMeshRef.current && picks.length > 0) {
        const hits = raycaster.intersectObjects(picks, false);
        if (hits.length > 0) {
          const name = (hits[0].object as THREE.Mesh).userData.jointName as string;
          selectJoint(name);
        } else {
          selectJoint(null);
        }
      } else {
        const meshes = Array.from(jointMeshMapRef.current.values());
        const hits = raycaster.intersectObjects(meshes, false);
        if (hits.length > 0) {
          const name = (hits[0].object as THREE.Mesh).userData.jointName as string;
          selectJoint(name);
        } else {
          selectJoint(null);
        }
      }
    };
    renderer.domElement.addEventListener("pointerdown", onClick);

    /* keyboard shortcuts */
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        e.shiftKey ? doRedo() : doUndo();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      cancelAnimationFrame(animIdRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey);
      renderer.domElement.removeEventListener("pointerdown", onClick);
      ro.disconnect();
      tc.dispose();
      orbit.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── joint selection (uses refs, not state) ────────────────────────── */
  const selectJoint = useCallback((name: string | null) => {
    const tc = transformRef.current;
    if (!tc) return;

    const boneMode = skinnedMeshRef.current !== null && boneByNameRef.current.size > 0;
    const prev = selectedJointRef.current;
    if (prev) {
      if (boneMode) {
        const bone = boneByNameRef.current.get(prev);
        const pick = bone?.userData.__pickMesh as THREE.Mesh | undefined;
        if (pick) {
          (pick.material as THREE.MeshStandardMaterial).color.setHex(0xff4444);
          (pick.material as THREE.MeshStandardMaterial).emissive.setHex(0x000000);
        }
      } else {
        const m = jointMeshMapRef.current.get(prev);
        if (m) {
          (m.material as THREE.MeshStandardMaterial).color.setHex(JOINT_COLOR);
          (m.material as THREE.MeshStandardMaterial).emissive.setHex(0x441111);
        }
      }
    }

    if (name && (boneMode ? boneByNameRef.current.has(name) : jointMeshMapRef.current.has(name))) {
      if (boneMode) {
        const bone = boneByNameRef.current.get(name)!;
        const pick = bone.userData.__pickMesh as THREE.Mesh | undefined;
        if (pick) {
          (pick.material as THREE.MeshStandardMaterial).color.setHex(JOINT_SELECTED_COLOR);
          (pick.material as THREE.MeshStandardMaterial).emissive.setHex(0x113322);
        }
        tc.attach(bone);
      } else {
        const mesh = jointMeshMapRef.current.get(name)!;
        (mesh.material as THREE.MeshStandardMaterial).color.setHex(JOINT_SELECTED_COLOR);
        (mesh.material as THREE.MeshStandardMaterial).emissive.setHex(0x114422);
        tc.attach(mesh);
      }
      selectedJointRef.current = name;
      setSelectedJointState(name);
    } else {
      tc.detach();
      selectedJointRef.current = null;
      setSelectedJointState(null);
    }
  }, []);

  /* ── reset rig (animation + skinning state, joint helpers) ─────────────
   *
   * If `removeExportGroup` is true, the exportGroup mesh is also removed from
   * the scene. Pass `false` when re-applying a template on top of a pre-rigged
   * model so the user's uploaded mesh stays visible.
   */
  const resetRigState = useCallback((removeExportGroup: boolean) => {
    const scene = sceneRef.current;

    mixerRef.current?.stopAllAction();
    mixerRef.current = null;
    currentActionRef.current = null;
    userClipRef.current = null;
    proceduralClipsRef.current = null;
    clipsForExportRef.current = [];
    importedClipsRef.current = [];
    robotActionsRef.current = {};
    keyframeStoreRef.current.clear();
    skinnedMeshRef.current = null;
    boneByNameRef.current.clear();

    for (const pick of bonePickMeshesRef.current) {
      pick.parent?.remove(pick);
      pick.geometry.dispose();
      (pick.material as THREE.Material).dispose();
    }
    bonePickMeshesRef.current = [];

    if (removeExportGroup && exportGroupRef.current && scene) {
      scene.remove(exportGroupRef.current);
      exportGroupRef.current.traverse((c) => {
        if ((c as THREE.Mesh).geometry) (c as THREE.Mesh).geometry.dispose();
        if ((c as THREE.Mesh).material) {
          const mat = (c as THREE.Mesh).material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else if (mat) (mat as THREE.Material).dispose();
        }
      });
      exportGroupRef.current = null;
    }

    if (modelGroupRef.current) modelGroupRef.current.visible = true;
    if (jointsGroupRef.current) jointsGroupRef.current.visible = true;

    const group = jointsGroupRef.current;
    if (group) {
      while (group.children.length > 0) {
        const c = group.children[0];
        group.remove(c);
        if ((c as THREE.Mesh).geometry) (c as THREE.Mesh).geometry.dispose();
        if ((c as THREE.Mesh).material) ((c as THREE.Mesh).material as THREE.Material).dispose();
      }
    }
    jointMeshMapRef.current.clear();
    jointDataRef.current = [];

    if (boneLinesRef.current && sceneRef.current) {
      sceneRef.current.remove(boneLinesRef.current);
      boneLinesRef.current.geometry.dispose();
      (boneLinesRef.current.material as THREE.Material).dispose();
      boneLinesRef.current = null;
    }

    transformRef.current?.detach();
    selectedJointRef.current = null;
    setSelectedJointState(null);
    setJointNames([]);
    setSkeletonVisible(false);
    setSkinned(false);
    setTimelinePlaying(false);
    setTimelineFrame(0);
    setImportedClipNames([]);
    setActiveClipName(null);
    setRobotClipNames([]);
    setKeyedFrames([]);
    undoStackRef.current = [];
    redoStackRef.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  // Full reset — used when loading a brand-new model
  const clearJoints = useCallback(() => {
    resetRigState(true);
  }, [resetRigState]);

  // Soft reset — used when re-applying a skeleton template on a model that's
  // already loaded (and possibly already rigged). Keeps the uploaded mesh in scene.
  const resetForTemplate = useCallback(() => {
    resetRigState(false);
  }, [resetRigState]);

  /**
   * Shared helper: given a group containing at least one SkinnedMesh,
   * wire up picker spheres, mixer, procedural clips, bone map, etc.
   * Also accepts optional embedded GLTF animations to import immediately.
   */
  const activateRigFromGroup = useCallback(
    (group: THREE.Group, embeddedClips?: THREE.AnimationClip[]) => {
      let rigMesh: THREE.SkinnedMesh | null = null;
      group.traverse((c) => {
        if (!rigMesh && (c as THREE.SkinnedMesh).isSkinnedMesh) rigMesh = c as THREE.SkinnedMesh;
      });

      if (rigMesh) {
        const sm = rigMesh as THREE.SkinnedMesh;
        skinnedMeshRef.current = sm;
        boneByNameRef.current.clear();
        for (const b of sm.skeleton.bones) {
          boneByNameRef.current.set(b.name, b);
        }

        sm.updateMatrixWorld(true);
        const boneNames = sm.skeleton.bones.map((b: THREE.Bone) => b.name);
        jointDataRef.current = boneNames.map((name: string) => {
          const bone = boneByNameRef.current.get(name)!;
          const wp = new THREE.Vector3();
          bone.getWorldPosition(wp);
          const parentBone = bone.parent && (bone.parent as THREE.Bone).isBone ? (bone.parent as THREE.Bone) : null;
          return { name, position: [wp.x, wp.y, wp.z] as [number, number, number], parent: parentBone?.name ?? null };
        });
        setJointNames(boneNames);

        for (const bone of sm.skeleton.bones) {
          const pickGeo = new THREE.SphereGeometry(0.045, 10, 10);
          const pickMat = new THREE.MeshStandardMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 0.14,
            depthWrite: false,
            metalness: 0,
            roughness: 1,
          });
          const pick = new THREE.Mesh(pickGeo, pickMat);
          pick.userData.jointName = bone.name;
          bone.userData.__pickMesh = pick;
          bone.add(pick);
          bonePickMeshesRef.current.push(pick);
        }

        mixerRef.current?.stopAllAction();
        // Mixer root = the group so PropertyBinding.findNode can locate bones by name
        mixerRef.current = createRigMixer(group);
        currentActionRef.current = null;

        const boneNameSet = new Set(boneByNameRef.current.keys());

        // Remap procedural clips to match actual bone names in this skeleton
        const idle = remapClipToSkeleton(createIdleClip(), boneNameSet);
        const walk = remapClipToSkeleton(createWalkClip(), boneNameSet);
        const run = remapClipToSkeleton(createRunClip(), boneNameSet);
        proceduralClipsRef.current = { idle, walk, run };
        clipsForExportRef.current = [idle, walk, run];

        if (embeddedClips && embeddedClips.length > 0) {
          // Try retargeting (strips mixamorig: prefix, matches to our bones)
          const retargeted = retargetClips(embeddedClips, boneNameSet);
          if (retargeted.length > 0) {
            importedClipsRef.current.push(...retargeted);
            clipsForExportRef.current.push(...retargeted);
          }
          // Also keep clips whose tracks already match bone names directly
          for (const ec of embeddedClips) {
            const remapped = remapClipToSkeleton(ec, boneNameSet);
            const hasMatch = remapped.tracks.length > 0;
            if (hasMatch && !clipsForExportRef.current.some((e) => e.name === remapped.name)) {
              importedClipsRef.current.push(remapped);
              clipsForExportRef.current.push(remapped);
            }
          }
        }

        keyframeStoreRef.current.clear();
        userClipRef.current = null;
        setKeyedFrames([]);
        setImportedClipNames(importedClipsRef.current.map((c) => c.name));
        sm.skeleton.pose();
        sm.updateMatrixWorld(true);

        // Load RobotExpressive animations and build retargeted actions for this skeleton.
        loadRobotAnimations()
          .then((robotClips) => {
            if (skinnedMeshRef.current !== sm) return; // rig changed while loading
            const actions = buildRobotActionsForSkeleton(robotClips, boneNameSet);
            robotActionsRef.current = actions;
            const names = Object.keys(actions);
            setRobotClipNames(names);
            if (typeof window !== "undefined") {
              console.log("[Rigging] Robot actions ready:", names);
            }
          })
          .catch((err) => {
            console.warn("[Rigging] Failed to load RobotExpressive.glb:", err);
            robotActionsRef.current = {};
            setRobotClipNames([]);
          });
      }

      updateBoneLines();
      transformRef.current?.detach();
      selectedJointRef.current = null;
      setSelectedJointState(null);

      setSkinned(true);
      setSkeletonVisible(true);
      setTimelineFrame(0);
      setTimelinePlaying(false);
      setActiveClipName(null);
      setStatus(
        rigMesh
          ? "Rig activated. Use Animations + timeline, or export animated .glb."
          : "No skinned mesh found in the group.",
      );
    },
    [updateBoneLines],
  );

  /* ── model loading ─────────────────────────────────────────────────── */
  const loadModel = useCallback(
    async (file: File) => {
      const scene = sceneRef.current;
      if (!scene) return;

      if (modelGroupRef.current) {
        scene.remove(modelGroupRef.current);
        modelGroupRef.current.traverse((c) => {
          if ((c as THREE.Mesh).geometry) (c as THREE.Mesh).geometry.dispose();
          if ((c as THREE.Mesh).material) {
            const mat = (c as THREE.Mesh).material;
            if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
            else if (mat) (mat as THREE.Material).dispose();
          }
        });
        modelGroupRef.current = null;
      }
      clearJoints();
      setModelLoaded(false);
      setStatus("Loading model…");

      try {
        const loader = new GLTFLoader();
        const buf = await file.arrayBuffer();
        const gltf = await new Promise<{ scene: THREE.Group; animations?: THREE.AnimationClip[] }>((res, rej) =>
          loader.parse(buf, "", (g) => res(g as unknown as { scene: THREE.Group; animations?: THREE.AnimationClip[] }), rej),
        );

        const model = gltf.scene;

        // Auto-scale & center
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = maxDim > 0 ? 2 / maxDim : 1;
        model.scale.setScalar(scale);
        box.setFromObject(model);
        const newCenter = box.getCenter(new THREE.Vector3());
        model.position.x -= newCenter.x;
        model.position.z -= newCenter.z;
        model.position.y -= box.min.y;

        // Detect if the model already has a skeleton (SkinnedMesh + bones)
        let existingSkinned: THREE.SkinnedMesh | null = null;
        let boneCount = 0;
        model.traverse((child) => {
          if ((child as THREE.SkinnedMesh).isSkinnedMesh && !existingSkinned) {
            existingSkinned = child as THREE.SkinnedMesh;
            boneCount = existingSkinned.skeleton?.bones?.length ?? 0;
          }
        });

        const alreadyRigged = existingSkinned !== null && boneCount > 0;

        if (alreadyRigged) {
          // Wrap in export group, preserving the auto-scale/center transform
          const exportGroup = new THREE.Group();
          exportGroup.name = "RiggedModel";
          exportGroup.visible = true;
          exportGroup.position.copy(model.position);
          exportGroup.quaternion.copy(model.quaternion);
          exportGroup.scale.copy(model.scale);

          // Move children into exportGroup (preserves their local transforms)
          model.position.set(0, 0, 0);
          model.quaternion.identity();
          model.scale.set(1, 1, 1);
          while (model.children.length > 0) {
            exportGroup.add(model.children[0]);
          }
          scene.add(exportGroup);
          exportGroupRef.current = exportGroup;
          modelGroupRef.current = null;

          setModelLoaded(true);
          activateRigFromGroup(exportGroup, gltf.animations);
          const embCount = gltf.animations?.length ?? 0;
          setStatus(
            `Pre-rigged model loaded (${boneCount} bones${embCount > 0 ? `, ${embCount} animation(s)` : ""}). Ready to animate or export.`,
          );
        } else {
          // Not rigged — ghost mesh so joint helpers stay visible when overlapping
          applySkeletonEditMeshTransparency(model);

          scene.add(model);
          modelGroupRef.current = model;
          setModelLoaded(true);
          setStatus("Model loaded. Select a template and click Apply Skeleton.");
        }
      } catch (err) {
        setStatus("Failed to load model: " + (err instanceof Error ? err.message : String(err)));
      }
    },
    [clearJoints, activateRigFromGroup],
  );

  /* ── apply skeleton template ───────────────────────────────────────── */
  const applyTemplate = useCallback(() => {
    const scene = sceneRef.current;
    const group = jointsGroupRef.current;
    if (!scene || !group) return;

    // Soft reset — preserves the user's uploaded model (whether pre-rigged
    // or unrigged) in the scene; only clears prior joint helpers / mixer.
    resetForTemplate();

    // Light ghost on all visible meshes so joint spheres show through (even
    // when geometrically inside the hull). depthWrite=false is critical.
    applySkeletonEditMeshTransparency(modelGroupRef.current);
    applySkeletonEditMeshTransparency(exportGroupRef.current);

    const template: SkeletonTemplate = TEMPLATES[templateKey];
    jointDataRef.current = template.joints.map((j) => ({ ...j }));

    const sharedGeo = new THREE.SphereGeometry(JOINT_RADIUS, 16, 16);

    for (const joint of template.joints) {
      const mat = new THREE.MeshStandardMaterial({
        color: JOINT_COLOR,
        emissive: 0x441111,
        roughness: 0.4,
        metalness: 0.1,
      });
      const mesh = new THREE.Mesh(sharedGeo, mat);
      mesh.position.set(...joint.position);
      mesh.userData.jointName = joint.name;
      mesh.renderOrder = JOINT_HELPER_RENDER_ORDER;
      group.add(mesh);
      jointMeshMapRef.current.set(joint.name, mesh);
    }

    updateBoneLines();
    setJointNames(template.joints.map((j) => j.name));
    setSkeletonVisible(true);
    setSkinned(false);
    pushUndo();

    // Ensure joint helpers render after the model in the scene graph so they
    // composite on top of the ghost mesh (model is usually added before __joints__).
    const jg = jointsGroupRef.current;
    if (scene && jg) scene.add(jg);

    setStatus("Skeleton applied. Click joints to select and drag to reposition.");
  }, [templateKey, resetForTemplate, updateBoneLines, pushUndo]);

  /* ── undo / redo ───────────────────────────────────────────────────── */
  const doUndo = useCallback(() => {
    const stack = undoStackRef.current;
    if (stack.length < 2) return;
    const current = stack.pop()!;
    redoStackRef.current.push(current);
    const prev = stack[stack.length - 1];
    restorePositions(prev);
    updateBoneLines();
    setCanUndo(stack.length > 1);
    setCanRedo(true);
  }, [restorePositions, updateBoneLines]);

  const doRedo = useCallback(() => {
    const stack = redoStackRef.current;
    if (stack.length === 0) return;
    const next = stack.pop()!;
    undoStackRef.current.push(next);
    restorePositions(next);
    updateBoneLines();
    setCanUndo(true);
    setCanRedo(stack.length > 0);
  }, [restorePositions, updateBoneLines]);

  /* ── skinning (nearest-joint weight assignment) ────────────────────── */
  const performSkinning = useCallback(() => {
    const scene = sceneRef.current;
    const modelGroup = modelGroupRef.current;
    if (!scene || !modelGroup) return;

    const joints = jointDataRef.current;
    const meshMap = jointMeshMapRef.current;
    if (joints.length === 0) return;

    // Collect all meshes from model
    const originalMeshes: THREE.Mesh[] = [];
    modelGroup.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) originalMeshes.push(c as THREE.Mesh);
    });
    if (originalMeshes.length === 0) {
      setStatus("No meshes found in model.");
      return;
    }

    setStatus("Binding skeleton…");

    // World positions of joints (from helper meshes)
    const jointWorldPos = joints.map((j) => {
      const m = meshMap.get(j.name);
      return m ? m.position.clone() : new THREE.Vector3(...j.position);
    });

    // Build THREE.Bone hierarchy
    const boneMap = new Map<string, THREE.Bone>();
    const allBones: THREE.Bone[] = [];
    const rootBones: THREE.Bone[] = [];

    for (const j of joints) {
      const bone = new THREE.Bone();
      bone.name = j.name;
      boneMap.set(j.name, bone);
      allBones.push(bone);
    }

    for (let i = 0; i < joints.length; i++) {
      const j = joints[i];
      const bone = allBones[i];
      const wp = jointWorldPos[i];

      if (j.parent && boneMap.has(j.parent)) {
        const parentBone = boneMap.get(j.parent)!;
        parentBone.add(bone);
        const pi = joints.findIndex((jj) => jj.name === j.parent);
        const pp = jointWorldPos[pi];
        bone.position.set(wp.x - pp.x, wp.y - pp.y, wp.z - pp.z);
      } else {
        bone.position.copy(wp);
        rootBones.push(bone);
      }
    }

    // Build export group (clean copy for GLTFExporter)
    if (exportGroupRef.current) {
      scene.remove(exportGroupRef.current);
      exportGroupRef.current = null;
    }
    const exportGroup = new THREE.Group();
    exportGroup.name = "RiggedModel";
    exportGroup.visible = true;
    scene.add(exportGroup);
    exportGroupRef.current = exportGroup;

    for (const origMesh of originalMeshes) {
      origMesh.updateWorldMatrix(true, false);
      const geo = origMesh.geometry.clone();
      geo.applyMatrix4(origMesh.matrixWorld);

      const vtxCount = geo.attributes.position.count;
      const skinIdx = new Uint16Array(vtxCount * 4);
      const skinWt = new Float32Array(vtxCount * 4);
      const posArr = geo.attributes.position;
      const v = new THREE.Vector3();

      for (let vi = 0; vi < vtxCount; vi++) {
        v.set(posArr.getX(vi), posArr.getY(vi), posArr.getZ(vi));

        const dists: { idx: number; d: number }[] = [];
        for (let bi = 0; bi < jointWorldPos.length; bi++) {
          dists.push({ idx: bi, d: v.distanceTo(jointWorldPos[bi]) });
        }
        dists.sort((a, b) => a.d - b.d);
        const nearest = dists.slice(0, 4);
        const eps = 1e-6;
        const total = nearest.reduce((s, n) => s + 1 / (n.d + eps), 0);

        for (let k = 0; k < 4; k++) {
          if (k < nearest.length) {
            skinIdx[vi * 4 + k] = nearest[k].idx;
            skinWt[vi * 4 + k] = 1 / (nearest[k].d + eps) / total;
          } else {
            skinIdx[vi * 4 + k] = 0;
            skinWt[vi * 4 + k] = 0;
          }
        }
      }

      geo.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(skinIdx, 4));
      geo.setAttribute("skinWeight", new THREE.Float32BufferAttribute(skinWt, 4));

      // Reset transform — geometry is already in world space
      geo.computeBoundingBox();

      const mat = Array.isArray(origMesh.material)
        ? origMesh.material.map((m) => m.clone())
        : origMesh.material.clone();
      if (Array.isArray(mat)) mat.forEach((m) => { m.transparent = false; m.opacity = 1; });
      else { (mat as THREE.Material & { transparent: boolean; opacity: number }).transparent = false; (mat as THREE.Material & { transparent: boolean; opacity: number }).opacity = 1; }

      const sm = new THREE.SkinnedMesh(geo, mat);
      sm.name = origMesh.name || "SkinnedMesh";

      for (const rb of rootBones) {
        sm.add(rb.clone(true));
      }

      const clonedBones: THREE.Bone[] = [];
      sm.traverse((c) => { if ((c as THREE.Bone).isBone) clonedBones.push(c as THREE.Bone); });
      const clonedSkel = new THREE.Skeleton(clonedBones);
      sm.bind(clonedSkel);

      exportGroup.add(sm);
    }

    modelGroup.visible = false;
    if (jointsGroupRef.current) jointsGroupRef.current.visible = false;

    activateRigFromGroup(exportGroup);
  }, [updateBoneLines, activateRigFromGroup]);

  const rebuildUserClipAndExportList = useCallback(() => {
    const duration = timelineMaxFrame / timelineFps;
    const clip = keyframeStoreRef.current.buildClip("UserAnimation", duration, timelineFps);
    userClipRef.current = clip;
    const proc = proceduralClipsRef.current;
    const base = proc ? [proc.idle, proc.walk, proc.run] : [];
    const list: THREE.AnimationClip[] = [...base];
    if (clip) list.push(clip);
    list.push(...importedClipsRef.current);
    clipsForExportRef.current = list;
    return clip;
  }, [timelineFps, timelineMaxFrame]);

  const stopAllAnimations = useCallback(() => {
    const mixer = mixerRef.current;
    if (mixer) {
      // Fade out gracefully then hard-stop on the next tick
      mixer.timeScale = 1;
      mixer.stopAllAction();
    }
    currentActionRef.current = null;
    const sm = skinnedMeshRef.current;
    if (sm) {
      sm.skeleton.pose();
      sm.updateMatrixWorld(true);
    }
    updateBoneLines();
    setTimelinePlaying(false);
    setActiveClipName(null);
  }, [updateBoneLines]);

  /**
   * Play any AnimationClip on the current rig with smooth crossfade.
   * Used by both procedural clips and RobotExpressive clips.
   */
  const playAnimationClip = useCallback(
    (clip: THREE.AnimationClip, label?: string) => {
      const mixer = mixerRef.current;
      const sm = skinnedMeshRef.current;
      if (!mixer || !sm) return;

      const prev = currentActionRef.current;
      const next = mixer.clipAction(clip);
      next.setLoop(THREE.LoopRepeat, Infinity);
      next.enabled = true;
      next.setEffectiveTimeScale(1);
      next.setEffectiveWeight(1);
      next.reset();

      if (prev && prev !== next && prev.isRunning()) {
        prev.crossFadeTo(next, FADE_DURATION, false);
        next.play();
      } else {
        if (prev && prev !== next) prev.stop();
        next.fadeIn(FADE_DURATION).play();
      }

      currentActionRef.current = next;
      setTimelinePlaying(false);
      setActiveClipName(label ?? clip.name);
    },
    [],
  );

  /**
   * Play a RobotExpressive animation by UI label (Idle / Walk / Run / Dance / ...).
   * Maps to the actual clip name (e.g. Walk → "Walking") and plays it on the user's rig.
   */
  const playAnimation = useCallback(
    (label: string) => {
      const clipName = ROBOT_CLIP_MAP[label] ?? label;
      const actions = robotActionsRef.current;
      const clip = actions[clipName];
      if (!clip) {
        setStatus(`Animation "${label}" not available for this skeleton.`);
        return;
      }
      playAnimationClip(clip, label);
    },
    [playAnimationClip],
  );

  const playClip = useCallback(
    (clip: THREE.AnimationClip) => {
      playAnimationClip(clip);
    },
    [playAnimationClip],
  );

  const applyTimelineScrub = useCallback(
    (frame: number) => {
      const mixer = mixerRef.current;
      if (!mixer || !skinnedMeshRef.current) return;
      const clip = rebuildUserClipAndExportList();
      if (!clip || !keyframeStoreRef.current.hasAnyKeyframes()) return;
      mixer.stopAllAction();
      const action = mixer.clipAction(clip);
      action.setLoop(THREE.LoopRepeat, 1);
      action.reset();
      action.time = frameToTime(frame, timelineFps);
      action.play();
      action.paused = true;
      mixer.update(0.0001);
      currentActionRef.current = action;
      setTimelinePlaying(false);
    },
    [rebuildUserClipAndExportList, timelineFps],
  );

  const toggleTimelinePlay = useCallback(() => {
    const mixer = mixerRef.current;
    if (!mixer || !skinnedMeshRef.current) return;
    const clip = rebuildUserClipAndExportList();
    if (!clip || !keyframeStoreRef.current.hasAnyKeyframes()) {
      setStatus("Add at least one keyframe to play the timeline.");
      return;
    }
    const prev = currentActionRef.current;
    if (prev && prev.getClip() === clip) {
      prev.paused = !prev.paused;
      setTimelinePlaying(!prev.paused);
      return;
    }
    mixer.stopAllAction();
    const action = mixer.clipAction(clip);
    action.setLoop(THREE.LoopRepeat, Infinity);
    action.reset();
    action.time = frameToTime(timelineFrame, timelineFps);
    action.fadeIn(FADE_DURATION).play();
    currentActionRef.current = action;
    setTimelinePlaying(true);
  }, [rebuildUserClipAndExportList, timelineFrame, timelineFps]);

  const addKeyframeAtCurrentFrame = useCallback(() => {
    if (!skinnedMeshRef.current || !selectedJointRef.current) {
      setStatus("Select a bone (click pick sphere or list), then add a keyframe.");
      return;
    }
    const bone = boneByNameRef.current.get(selectedJointRef.current);
    if (!bone) return;
    bone.updateMatrixWorld(true);
    keyframeStoreRef.current.setBoneKeyframe(
      timelineFrame,
      bone.name,
      bone.position.clone(),
      bone.quaternion.clone(),
    );
    setKeyedFrames(keyframeStoreRef.current.getKeyedFrames());
    rebuildUserClipAndExportList();
    setStatus(`Keyframe at frame ${timelineFrame} for ${bone.name}.`);
  }, [rebuildUserClipAndExportList, timelineFrame]);

  const onAnimationLibraryFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f || !skinnedMeshRef.current) return;
      setStatus("Loading animation library…");
      try {
        const loader = new GLTFLoader();
        const buf = await f.arrayBuffer();
        const gltf = await new Promise<{ animations?: THREE.AnimationClip[] }>((res, rej) =>
          loader.parse(buf, "", (g) => res(g as { animations?: THREE.AnimationClip[] }), rej),
        );
        const source = gltf.animations ?? [];
        if (source.length === 0) {
          setStatus("No animation clips found in the file.");
          return;
        }
        const valid = new Set(boneByNameRef.current.keys());
        let added = 0;
        for (const clip of source) {
          const remapped = remapClipToSkeleton(clip, valid);
          if (remapped.tracks.length > 0) {
            importedClipsRef.current.push(remapped);
            added++;
          }
        }
        if (added === 0) {
          const retargeted = retargetClips(source, valid);
          for (const rt of retargeted) {
            importedClipsRef.current.push(rt);
            added++;
          }
        }
        if (added === 0) {
          setStatus("No compatible bone tracks found (try a Mixamo humanoid .glb).");
          return;
        }
        rebuildUserClipAndExportList();
        setImportedClipNames(importedClipsRef.current.map((c) => c.name));
        setStatus(`Imported ${added} clip(s). Use Play or export.`);
      } catch (err) {
        setStatus("Animation import failed: " + (err instanceof Error ? err.message : String(err)));
      }
    },
    [rebuildUserClipAndExportList],
  );

  useEffect(() => {
    transformRef.current?.setMode(transformMode);
  }, [transformMode]);

  /* ── export GLB ────────────────────────────────────────────────────── */
  const exportGLB = useCallback(async () => {
    const group = exportGroupRef.current;
    if (!group) {
      setStatus("Nothing to export. Bind skeleton first.");
      return;
    }
    setStatus("Exporting .glb…");

    rebuildUserClipAndExportList();

    try {
      group.visible = true;
      const exporter = new GLTFExporter();
      const anims = clipsForExportRef.current.filter(Boolean);
      const result = await exporter.parseAsync(group, {
        binary: true,
        trs: anims.length > 0,
        animations: anims,
      });
      group.visible = true;

      const blob = result instanceof ArrayBuffer ? new Blob([result], { type: "model/gltf-binary" }) : new Blob([JSON.stringify(result)], { type: "model/gltf+json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "rigged_animated.glb";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Exported rigged_animated.glb (mesh + animations).");
    } catch (err) {
      setStatus("Export failed: " + (err instanceof Error ? err.message : String(err)));
    }
  }, [rebuildUserClipAndExportList]);

  /* ── file input handler ────────────────────────────────────────────── */
  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) loadModel(f);
      e.target.value = "";
    },
    [loadModel],
  );

  /* ── render ────────────────────────────────────────────────────────── */
  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-neutral-100 text-neutral-900">
      <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* ─── sidebar toggle (mobile / collapsed) ─── */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed left-0 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-1 py-3 px-2 bg-black text-white rounded-r-lg hover:bg-neutral-800 transition-colors"
          title="Open panel"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[10px] font-semibold uppercase tracking-wider">Tools</span>
        </button>
      )}

      {/* ─── left sidebar ─── */}
      <aside
        className={`flex flex-col bg-white border-r border-neutral-200 transition-all duration-200 ease-out overflow-hidden shrink-0 ${sidebarOpen ? "w-72 min-w-[18rem]" : "w-0 min-w-0"}`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/workspace"
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors shrink-0"
              title="Back to Workspace"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg font-bold tracking-tight truncate">3D Rigging</h1>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors shrink-0"
            title="Collapse"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M18 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {/* upload */}
          <section className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500">Upload Model</label>
            <input ref={fileInputRef} type="file" accept=".glb,.gltf" onChange={onFileChange} className="hidden" title="Upload 3D model" aria-label="Upload 3D model" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-neutral-300 text-sm font-medium text-neutral-600 hover:border-neutral-400 hover:bg-neutral-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload .glb / .gltf
            </button>
          </section>

          {/* template */}
          <section className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500">Skeleton Template</label>
            <select
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value as "human" | "animal")}
              title="Skeleton template"
              aria-label="Skeleton template"
              className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-sm font-medium focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200 focus:outline-none transition-colors"
            >
              <option value="human">Human</option>
              <option value="animal">Animal (Quadruped)</option>
            </select>
          </section>

          {/* actions */}
          <section className="space-y-2">
            <button
              type="button"
              onClick={applyTemplate}
              disabled={!modelLoaded}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-black hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Apply Skeleton
            </button>
            <button
              type="button"
              onClick={performSkinning}
              disabled={!skeletonVisible}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Bind Skeleton
            </button>
            <button
              type="button"
              onClick={exportGLB}
              disabled={!skinned}
              className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Export Rigged .glb
            </button>
          </section>

          {/* undo/redo */}
          {skeletonVisible && (
            <section className="flex gap-2">
              <button
                type="button"
                onClick={doUndo}
                disabled={!canUndo}
                className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold border border-neutral-200 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Undo (Ctrl+Z)"
              >
                ↩ Undo
              </button>
              <button
                type="button"
                onClick={doRedo}
                disabled={!canRedo}
                className="flex-1 rounded-xl px-3 py-2 text-xs font-semibold border border-neutral-200 hover:bg-neutral-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                title="Redo (Ctrl+Shift+Z)"
              >
                ↪ Redo
              </button>
            </section>
          )}

          {/* joint list */}
          {jointNames.length > 0 && (
            <section className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500">
                Joints ({jointNames.length})
              </label>
              <div className="max-h-56 overflow-y-auto rounded-xl border border-neutral-200 divide-y divide-neutral-100">
                {jointNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => selectJoint(name)}
                    className={`w-full text-left px-3 py-2 text-xs font-medium transition-colors ${
                      selectedJoint === name
                        ? "bg-emerald-50 text-emerald-700 font-semibold"
                        : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* selected joint info */}
          {selectedJoint && (
            <section className="rounded-xl bg-neutral-50 border border-neutral-200 p-3 space-y-1">
              <p className="text-xs font-bold text-neutral-500 uppercase tracking-widest">Selected</p>
              <p className="text-sm font-semibold">{selectedJoint}</p>
              <p className="text-[11px] text-neutral-400">
                {skinned ? "Pose with gizmo, then keyframe the timeline." : "Drag the gizmo to reposition joint helpers."}
              </p>
            </section>
          )}

          {skinned && (
            <>
              <section className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500">Transform</label>
                <div className="flex rounded-xl bg-neutral-100 p-1 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setTransformMode("translate")}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${transformMode === "translate" ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500 hover:text-neutral-700"}`}
                  >
                    Move
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransformMode("rotate")}
                    className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${transformMode === "rotate" ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500 hover:text-neutral-700"}`}
                  >
                    Rotate
                  </button>
                </div>
              </section>

              <section className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-widest text-neutral-500">Animation Library</label>

                {/* RobotExpressive presets — Idle / Walk / Run / Stop */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Robot Presets
                    {robotClipNames.length === 0 && (
                      <span className="text-[9px] font-normal text-neutral-400 normal-case ml-auto">loading…</span>
                    )}
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(["Idle", "Walk", "Run"] as const).map((label) => {
                      const clipName = ROBOT_CLIP_MAP[label];
                      const available = robotClipNames.includes(clipName);
                      const isActive = activeClipName === label;
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => playAnimation(label)}
                          disabled={!available}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                            isActive
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200"
                          }`}
                        >
                          {isActive ? "▶ " : ""}{label}
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      onClick={stopAllAnimations}
                      disabled={robotClipNames.length === 0 && activeClipName === null}
                      className="col-span-2 px-3 py-2 rounded-lg text-xs font-semibold bg-neutral-200 text-neutral-800 hover:bg-neutral-300 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      ⏹ Stop
                    </button>
                  </div>

                  {/* Extra robot clips (Dance, Jump, Wave, etc.) */}
                  {robotClipNames.length > 3 && (
                    <details className="group">
                      <summary className="cursor-pointer list-none flex items-center justify-between text-[10px] font-semibold text-neutral-500 hover:text-neutral-700 px-1 py-1">
                        <span>More robot actions ({robotClipNames.length - 3})</span>
                        <span className="transition-transform group-open:rotate-90">▸</span>
                      </summary>
                      <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                        {robotClipNames
                          .filter((n) => !["Idle", "Walking", "Running"].includes(n))
                          .map((clipName) => {
                            const isActive = activeClipName === clipName;
                            return (
                              <button
                                key={clipName}
                                type="button"
                                onClick={() => {
                                  const clip = robotActionsRef.current[clipName];
                                  if (clip) playAnimationClip(clip, clipName);
                                }}
                                className={`px-2 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                                  isActive
                                    ? "bg-emerald-600 text-white"
                                    : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                                }`}
                              >
                                {clipName}
                              </button>
                            );
                          })}
                      </div>
                    </details>
                  )}
                </div>

                {/* Built-in procedural clips */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Built-in</p>
                  {proceduralClipsRef.current && (
                    <div className="space-y-1">
                      {(["idle", "walk", "run"] as const).map((key) => {
                        const clip = proceduralClipsRef.current![key];
                        const isActive = activeClipName === clip.name;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => playClip(clip)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              isActive
                                ? "bg-violet-100 text-violet-800 ring-1 ring-violet-300"
                                : "text-neutral-700 hover:bg-neutral-100"
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              isActive ? "bg-violet-600 text-white" : "bg-neutral-200 text-neutral-500"
                            }`}>
                              {isActive ? "▶" : key[0].toUpperCase()}
                            </span>
                            <span className="flex-1 text-left truncate capitalize">{clip.name}</span>
                            <span className="text-[10px] text-neutral-400">{clip.duration.toFixed(1)}s</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Imported / embedded clips */}
                {importedClipNames.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">Imported ({importedClipNames.length})</p>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {importedClipsRef.current.map((clip, idx) => {
                        const isActive = activeClipName === clip.name;
                        return (
                          <button
                            key={`${clip.name}-${idx}`}
                            type="button"
                            onClick={() => playClip(clip)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                              isActive
                                ? "bg-indigo-100 text-indigo-800 ring-1 ring-indigo-300"
                                : "text-neutral-700 hover:bg-neutral-100"
                            }`}
                          >
                            <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                              isActive ? "bg-indigo-600 text-white" : "bg-neutral-200 text-neutral-500"
                            }`}>
                              {isActive ? "▶" : "♫"}
                            </span>
                            <span className="flex-1 text-left truncate">{clip.name}</span>
                            <span className="text-[10px] text-neutral-400">{clip.duration.toFixed(1)}s</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Import custom motion */}
                <input ref={animFileInputRef} type="file" accept=".glb,.gltf" className="hidden" title="Import animation GLB" aria-label="Import animation GLB" onChange={onAnimationLibraryFile} />
                <button
                  type="button"
                  onClick={() => animFileInputRef.current?.click()}
                  className="w-full rounded-xl px-3 py-2 text-xs font-semibold border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  + Import custom .glb motion
                </button>
              </section>
            </>
          )}
        </div>

        {/* status bar */}
        <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50/50">
          <p className="text-[11px] text-neutral-500 leading-snug">{status}</p>
        </div>
      </aside>

      {/* ─── canvas ─── */}
      <div ref={containerRef} className="flex-1 relative min-w-0 min-h-0">
        {!modelLoaded && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="text-center px-6 py-8 rounded-2xl bg-white/80 backdrop-blur-sm border border-neutral-200 shadow-lg max-w-sm">
              <svg className="w-12 h-12 mx-auto text-neutral-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <p className="text-sm font-semibold text-neutral-600">Upload a .glb or .gltf model</p>
              <p className="text-xs text-neutral-400 mt-1">Use the sidebar to load your 3D model and apply a skeleton.</p>
            </div>
          </div>
        )}
      </div>
      </div>

      {skinned && (
        <div className="shrink-0 border-t border-neutral-200 bg-white px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-20">
          <div className="flex flex-wrap items-center gap-3 max-w-5xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-widest text-neutral-500">Timeline</span>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={toggleTimelinePlay} className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-black text-white hover:bg-neutral-800 transition-colors">
                Play / Pause
              </button>
              <button
                type="button"
                onClick={() => {
                  stopAllAnimations();
                  setTimelineFrame(0);
                  applyTimelineScrub(0);
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-semibold border border-neutral-200 hover:bg-neutral-50 transition-colors"
              >
                Stop
              </button>
              <button type="button" onClick={addKeyframeAtCurrentFrame} className="rounded-lg px-3 py-1.5 text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors">
                Add Keyframe
              </button>
            </div>
            <div className="flex flex-1 min-w-[200px] items-center gap-3">
              <span className="text-xs font-mono text-neutral-600 tabular-nums w-14">F {timelineFrame}</span>
              <div className="flex-1 relative h-8 flex items-center">
                <input
                  type="range"
                  min={0}
                  max={timelineMaxFrame}
                  value={timelineFrame}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setTimelineFrame(v);
                    applyTimelineScrub(v);
                  }}
                  className="w-full accent-black h-2"
                  title="Frame scrub"
                  aria-label="Timeline frame"
                />
                {/* keyframe tick marks */}
                <div className="pointer-events-none absolute left-0 right-0 top-0 h-full flex items-start justify-between px-0.5">
                  {keyedFrames.map((kf) => (
                    <div
                      key={kf}
                      className="absolute top-0 w-0.5 h-2 bg-emerald-500 rounded-full -translate-x-1/2"
                      style={{ left: `${(kf / timelineMaxFrame) * 100}%` }}
                      title={`Keyframe ${kf}`}
                    />
                  ))}
                </div>
              </div>
              <span className="text-[10px] text-neutral-400 whitespace-nowrap">0–{timelineMaxFrame} @ {timelineFps}fps</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
