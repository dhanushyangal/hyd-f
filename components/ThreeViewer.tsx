"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { StudioOrb } from "@/components/workspace/StudioOrb";
import {
  DEFAULT_PART_MATERIAL,
  DEFAULT_VIEWER_LOOK,
  resolveViewerLook,
  type PartMaterial,
  type PartMaterialMap,
  type ResolvedViewerLook,
  type ViewerLook,
  type ViewerMaterialType,
} from "@/lib/viewer/look";
import { SELECTION_HIGHLIGHT } from "@/lib/viewer/highlight";

type Props = {
  glbUrl: string;
  look?: ViewerLook;
  /** Per-mesh overrides; meshes not listed keep their authored material. */
  partMaterials?: PartMaterialMap;
  /** Authored material per mesh name, reported once the GLB has loaded. */
  onParts?: (parts: PartMaterialMap) => void;
  selectedPart?: string | null;
  /** Part clicked in the canvas (null = empty space). */
  onPick?: (name: string | null) => void;
};

// Default neutral matcap texture (baked sphere lighting)
function createDefaultMatcapTexture(): THREE.Texture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();
  const gradient = ctx.createRadialGradient(size * 0.4, size * 0.35, 0, size * 0.5, size * 0.5, size * 0.6);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.4, "#b0b0b0");
  gradient.addColorStop(0.7, "#707070");
  gradient.addColorStop(1, "#404040");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

let defaultMatcapTexture: THREE.Texture | null = null;
function getDefaultMatcap(): THREE.Texture {
  if (!defaultMatcapTexture) defaultMatcapTexture = createDefaultMatcapTexture();
  return defaultMatcapTexture;
}

// Gradient map for MeshToonMaterial (discrete steps for cel/toon shading)
function createToonGradientMap(): THREE.Texture {
  const width = 4; // 4 shading steps
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = 1;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Texture();
  const imageData = ctx.createImageData(width, 1);
  const data = imageData.data;
  const steps = [
    [0.15, 0.15, 0.2],   // shadow
    [0.45, 0.45, 0.5],   // mid-dark
    [0.75, 0.75, 0.8],   // mid-light
    [1.0, 1.0, 1.0],     // highlight
  ];
  for (let i = 0; i < width; i++) {
    const [r, g, b] = steps[i];
    data[i * 4] = Math.floor(r * 255);
    data[i * 4 + 1] = Math.floor(g * 255);
    data[i * 4 + 2] = Math.floor(b * 255);
    data[i * 4 + 3] = 255;
  }
  ctx.putImageData(imageData, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.needsUpdate = true;
  return tex;
}
let toonGradientMap: THREE.Texture | null = null;
function getToonGradientMap(): THREE.Texture {
  if (!toonGradientMap) toonGradientMap = createToonGradientMap();
  return toonGradientMap;
}

const NO_PARTS: PartMaterialMap = {};

type ViewerCamera = THREE.PerspectiveCamera | THREE.OrthographicCamera;

function materialList(material: THREE.Material | THREE.Material[]): THREE.Material[] {
  return Array.isArray(material) ? material : [material];
}

function readPartMaterial(mat: THREE.Material): PartMaterial {
  const color = "color" in mat && mat.color instanceof THREE.Color ? `#${mat.color.getHexString()}` : null;
  return {
    color: color ?? DEFAULT_PART_MATERIAL.color,
    roughness: mat instanceof THREE.MeshStandardMaterial ? mat.roughness : DEFAULT_PART_MATERIAL.roughness,
    metalness: mat instanceof THREE.MeshStandardMaterial ? mat.metalness : DEFAULT_PART_MATERIAL.metalness,
  };
}

function writePartMaterial(mat: THREE.Material, part: PartMaterial) {
  if ("color" in mat && mat.color instanceof THREE.Color) mat.color.set(part.color);
  if (mat instanceof THREE.MeshStandardMaterial) {
    mat.roughness = part.roughness;
    mat.metalness = part.metalness;
  }
}

/** Per-mesh material for the chosen shading mode; never mutates the GLB source material. */
function deriveMaterial(source: THREE.Material, type: ViewerMaterialType, roughness: number): THREE.Material {
  const color =
    "color" in source && source.color instanceof THREE.Color ? source.color.clone() : new THREE.Color(0xcccccc);
  const map = "map" in source && source.map instanceof THREE.Texture ? source.map : undefined;
  let mat: THREE.Material;
  switch (type) {
    case "matcap":
      mat = new THREE.MeshMatcapMaterial({ matcap: getDefaultMatcap(), color });
      break;
    case "toon":
      mat = new THREE.MeshToonMaterial({ color, gradientMap: getToonGradientMap(), map });
      break;
    case "lambert":
      mat = new THREE.MeshLambertMaterial({ color, map });
      break;
    case "normal":
      mat = new THREE.MeshNormalMaterial();
      break;
    default:
      if (source instanceof THREE.MeshStandardMaterial) {
        const clone = source.clone();
        clone.roughness = roughness;
        clone.envMapIntensity = 0.8;
        mat = clone;
      } else {
        mat = new THREE.MeshStandardMaterial({ color, map, roughness, metalness: 0.1, envMapIntensity: 0.8 });
      }
  }
  mat.userData.base = readPartMaterial(mat);
  return mat;
}

function createHighlightMaterials() {
  const spec = SELECTION_HIGHLIGHT;
  return {
    rim: new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(spec.color) },
        uRim: { value: spec.rimStrength },
        uFill: { value: spec.fill },
        uTime: { value: 0 },
        uPeriod: { value: spec.pulsePeriod },
      },
      vertexShader: spec.vertexShader,
      fragmentShader: spec.fragmentShader,
      transparent: true,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -1,
      polygonOffsetUnits: -1,
      toneMapped: false,
    }),
    edge: new THREE.LineBasicMaterial({
      color: spec.color,
      transparent: true,
      opacity: spec.edgeOpacity,
      depthWrite: false,
      toneMapped: false,
    }),
  };
}

type HighlightMaterials = ReturnType<typeof createHighlightMaterials>;

/** Overlays live outside the model and follow their mesh's world matrix each frame. */
function followMesh<T extends THREE.Object3D>(overlay: T, mesh: THREE.Object3D): T {
  overlay.matrixAutoUpdate = false;
  overlay.matrix.copy(mesh.matrixWorld);
  overlay.userData.follow = mesh;
  overlay.renderOrder = 2;
  overlay.raycast = () => {};
  return overlay;
}

function clearHighlight(group: THREE.Group) {
  for (const child of group.children) {
    if (child instanceof THREE.LineSegments) child.geometry.dispose();
  }
  group.clear();
}

function applyCameraProjection(camera: ViewerCamera, width: number, height: number, spec: ResolvedViewerLook["camera"]) {
  const aspect = width / Math.max(height, 1);
  if (camera instanceof THREE.OrthographicCamera) {
    camera.left = -spec.frustum * aspect;
    camera.right = spec.frustum * aspect;
    camera.top = spec.frustum;
    camera.bottom = -spec.frustum;
  } else {
    camera.fov = spec.fov;
    camera.aspect = aspect;
  }
  camera.updateProjectionMatrix();
}

export function ThreeViewer({
  glbUrl,
  look = DEFAULT_VIEWER_LOOK,
  partMaterials = NO_PARTS,
  onParts,
  selectedPart = null,
  onPick,
}: Props) {
  const { getToken } = useAuth();
  const resolved = useMemo(() => resolveViewerLook(look), [look]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const groundRef = useRef<THREE.Mesh | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemisphereLightRef = useRef<THREE.HemisphereLight | null>(null);
  const cameraRef = useRef<ViewerCamera | null>(null);
  const highlightGroupRef = useRef<THREE.Group | null>(null);
  const highlightMatsRef = useRef<HighlightMaterials | null>(null);
  const resolvedRef = useRef(resolved);
  resolvedRef.current = resolved;
  const partMaterialsRef = useRef(partMaterials);
  partMaterialsRef.current = partMaterials;
  const onPartsRef = useRef(onParts);
  onPartsRef.current = onParts;
  const onPickRef = useRef(onPick);
  onPickRef.current = onPick;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [modelReady, setModelReady] = useState(false);
  const [materialsVersion, setMaterialsVersion] = useState(0);

  useEffect(() => {
    if (!containerRef.current || !glbUrl) return;

    if (rendererRef.current) rendererRef.current.dispose();
    containerRef.current.innerHTML = "";
    modelRef.current = null;
    setModelReady(false);
    setMaterialsVersion(0);
    setLoading(true);
    setError(null);
    setLoadProgress(0);

    const initial = resolvedRef.current;
    const scene = new THREE.Scene();
    scene.background = initial.background ? new THREE.Color(initial.background) : null;
    sceneRef.current = scene;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    const camera: ViewerCamera = initial.camera.ortho
      ? new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000)
      : new THREE.PerspectiveCamera(initial.camera.fov, width / height, 0.1, 1000);
    camera.position.set(2, 2, 3);
    camera.lookAt(0, 0, 0);
    applyCameraProjection(camera, width, height, initial.camera);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = initial.exposure;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const room = new RoomEnvironment();
    scene.environment = pmrem.fromScene(room, 0.04).texture;
    room.dispose();
    pmrem.dispose();

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.5;
    controls.maxDistance = 10;
    controls.target.set(0, 0, 0);
    controls.autoRotate = initial.autoRotate;
    controls.autoRotateSpeed = 1.0;
    controls.update();
    controlsRef.current = controls;

    const ambientLight = new THREE.AmbientLight(0xffffff, initial.lights.ambient);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const keyLight = new THREE.DirectionalLight(0xffffff, initial.lights.key);
    keyLight.position.set(5, 10, 5);
    keyLight.castShadow = initial.shadow;
    keyLight.shadow.mapSize.set(2048, 2048);
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    const fillLight = new THREE.DirectionalLight(0xffffff, initial.lights.fill);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    const rimLight = new THREE.DirectionalLight(0xffffff, initial.lights.rim);
    rimLight.position.set(0, 3, -8);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xf4f4f5, initial.lights.hemi);
    hemisphereLight.position.set(0, 20, 0);
    scene.add(hemisphereLight);
    hemisphereLightRef.current = hemisphereLight;

    const gridHelper = new THREE.GridHelper(10, 20, 0xd4d4d4, 0xe5e5e5);
    gridHelper.position.y = -1;
    gridHelper.visible = initial.grid;
    gridHelperRef.current = gridHelper;
    scene.add(gridHelper);

    const ground = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.ShadowMaterial({ opacity: 0.16 }));
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    ground.receiveShadow = true;
    ground.visible = initial.shadow;
    groundRef.current = ground;
    scene.add(ground);

    const highlight = new THREE.Group();
    scene.add(highlight);
    highlightGroupRef.current = highlight;
    const highlightMats = createHighlightMaterials();
    highlightMatsRef.current = highlightMats;

    renderer.setAnimationLoop((time) => {
      controlsRef.current?.update();
      highlightMats.rim.uniforms.uTime.value = time / 1000;
      for (const overlay of highlight.children) {
        overlay.matrix.copy((overlay.userData.follow as THREE.Object3D).matrixWorld);
      }
      const cam = cameraRef.current;
      if (rendererRef.current && sceneRef.current && cam) rendererRef.current.render(sceneRef.current, cam);
    });

    // Select on click only — orbit drags must not change the selected part.
    const raycaster = new THREE.Raycaster();
    let pointerDownAt: [number, number] | null = null;
    const onPointerDown = (ev: PointerEvent) => {
      pointerDownAt = [ev.clientX, ev.clientY];
    };
    const onPointerUp = (ev: PointerEvent) => {
      const start = pointerDownAt;
      pointerDownAt = null;
      const model = modelRef.current;
      const cam = cameraRef.current;
      if (!start || !model || !cam || !onPickRef.current) return;
      if (Math.hypot(ev.clientX - start[0], ev.clientY - start[1]) > 4) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const pointer = new THREE.Vector2(
        ((ev.clientX - rect.left) / rect.width) * 2 - 1,
        -((ev.clientY - rect.top) / rect.height) * 2 + 1
      );
      raycaster.setFromCamera(pointer, cam);
      const hit = raycaster.intersectObject(model, true).find((h) => h.object instanceof THREE.Mesh);
      onPickRef.current(hit?.object.name || null);
    };
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      if (clientWidth === 0 || clientHeight === 0) return;
      applyCameraProjection(cameraRef.current, clientWidth, clientHeight, resolvedRef.current.camera);
      rendererRef.current.setSize(clientWidth, clientHeight);
    };
    window.addEventListener("resize", handleResize);
    const containerEl = containerRef.current;
    const ro = new ResizeObserver(handleResize);
    if (containerEl) ro.observe(containerEl);

    let cancelled = false;

    // Load GLB with Clerk Bearer — GLTFLoader cannot send auth on its own
    (async () => {
      setLoadProgress(1);
      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      loader.setWithCredentials(true);
      try {
        const token = await getToken();
        if (cancelled) return;
        if (token) {
          loader.setRequestHeader({ Authorization: `Bearer ${token}` });
        }
      } catch {
        // proceed without token; server will 401 if required
      }

      if (cancelled) return;

      loader.load(
        glbUrl,
        (gltf) => {
          if (cancelled) return;
          try {
            const model = gltf.scene;
            modelRef.current = model;

            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = maxDim > 0 ? 2 / maxDim : 1;
            model.scale.multiplyScalar(scale);
            model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

            const authored: PartMaterialMap = {};
            let unnamed = 0;
            model.traverse((child) => {
              if (!(child instanceof THREE.Mesh)) return;
              child.castShadow = true;
              child.receiveShadow = true;
              if (!child.name) child.name = `Part ${++unnamed}`;
              child.userData.sourceMaterial = child.material;
              const first = materialList(child.material)[0];
              if (first && !authored[child.name]) authored[child.name] = readPartMaterial(first);
            });
            onPartsRef.current?.(authored);

            scene.add(model);

            const newBox = new THREE.Box3().setFromObject(model);
            ground.position.y = newBox.min.y - 0.001;
            gridHelper.position.y = newBox.min.y;
            const newSize = newBox.getSize(new THREE.Vector3());
            const distance = Math.max(newSize.x, newSize.y, newSize.z) * 2;
            camera.position.set(distance * 0.7, distance * 0.7, distance * 0.7);
            camera.lookAt(0, 0, 0);
            controls.target.set(0, 0, 0);
            controls.update();

            setLoading(false);
            setModelReady(true);
          } catch (err: any) {
            setError(`Failed to process model: ${err.message}`);
            setLoading(false);
          }
        },
        (progress) => {
          if (cancelled) return;
          if (progress.total > 0) {
            const percent = Math.round((progress.loaded / progress.total) * 100);
            setLoadProgress(Math.max(1, Math.min(99, percent))); // Clamp between 1-99%
          } else if (progress.loaded > 0) {
            // If total is unknown but we have loaded bytes, show progress based on loaded size
            // Estimate: assume typical GLB is 1-5MB, show progress accordingly
            const estimatedTotal = 3000000; // 3MB estimate
            const percent = Math.min(95, Math.round((progress.loaded / estimatedTotal) * 100));
            setLoadProgress(Math.max(1, percent));
          } else {
            // Show minimal progress if no data yet
            setLoadProgress(1);
          }
        },
        (err) => {
          if (cancelled) return;
          let errorMessage = "Unknown error";

          if (err instanceof Error) {
            errorMessage = err.message;
            if (err.message.includes("CORS") || err.message.includes("Failed to fetch")) {
              errorMessage = "CORS error: Unable to load model. The file may be blocked by browser security.";
            } else if (err.message.includes("401") || err.message.includes("Unauthorized")) {
              errorMessage = "Unauthorized: sign in again to load this model.";
            }
          } else if (err instanceof ProgressEvent) {
            errorMessage = "Network error: Failed to download model file";
          }
          setError(`Failed to load model: ${errorMessage}`);
          setLoading(false);
        }
      );
    })();

    return () => {
      cancelled = true;
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      clearHighlight(highlight);
      highlightMats.rim.dispose();
      highlightMats.edge.dispose();
      highlightGroupRef.current = null;
      highlightMatsRef.current = null;
      if (containerEl) ro.unobserve(containerEl);
      window.removeEventListener("resize", handleResize);
      controlsRef.current?.dispose();
      if (rendererRef.current) {
        rendererRef.current.setAnimationLoop(null);
        rendererRef.current.dispose();
        if (containerRef.current && rendererRef.current.domElement.parentNode === containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      }
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          object.geometry?.dispose();
          materialList(object.material).forEach((m) => m?.dispose());
          const source = object.userData.sourceMaterial as THREE.Material | THREE.Material[] | undefined;
          if (source) materialList(source).forEach((m) => m?.dispose());
        });
        sceneRef.current.clear();
      }
    };
  }, [glbUrl, getToken]);

  useEffect(() => {
    const container = containerRef.current;
    const controls = controlsRef.current;
    const current = cameraRef.current;
    if (!container || !controls || !current) return;
    const spec = resolved.camera;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;
    if (spec.ortho !== current instanceof THREE.OrthographicCamera) {
      const next: ViewerCamera = spec.ortho
        ? new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000)
        : new THREE.PerspectiveCamera(spec.fov, 1, 0.1, 1000);
      next.position.copy(current.position);
      next.quaternion.copy(current.quaternion);
      next.up.copy(current.up);
      applyCameraProjection(next, width, height, spec);
      next.lookAt(controls.target);
      cameraRef.current = next;
      controls.object = next;
      controls.update();
      return;
    }
    applyCameraProjection(current, width, height, spec);
  }, [resolved.camera]);

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = resolved.background ? new THREE.Color(resolved.background) : null;
    }
    if (gridHelperRef.current) gridHelperRef.current.visible = resolved.grid;
    if (groundRef.current) groundRef.current.visible = resolved.shadow;
    if (keyLightRef.current) {
      keyLightRef.current.castShadow = resolved.shadow;
      keyLightRef.current.intensity = resolved.lights.key;
    }
    if (controlsRef.current) controlsRef.current.autoRotate = resolved.autoRotate;
    if (rendererRef.current) rendererRef.current.toneMappingExposure = resolved.exposure;
    if (ambientLightRef.current) ambientLightRef.current.intensity = resolved.lights.ambient;
    if (fillLightRef.current) fillLightRef.current.intensity = resolved.lights.fill;
    if (rimLightRef.current) rimLightRef.current.intensity = resolved.lights.rim;
    if (hemisphereLightRef.current) hemisphereLightRef.current.intensity = resolved.lights.hemi;
  }, [resolved]);

  // Rebuild per-mesh materials when the shading mode changes (deferred a frame so the UI stays instant).
  useEffect(() => {
    if (!modelReady) return;
    const { materialType, roughness } = resolved;
    const rafId = requestAnimationFrame(() => {
      modelRef.current?.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        const source = child.userData.sourceMaterial as THREE.Material | THREE.Material[] | undefined;
        if (!source) return;
        const sources = materialList(source);
        if (child.material !== source) materialList(child.material).forEach((m) => m?.dispose());
        const derived = sources.map((m) => deriveMaterial(m, materialType, roughness));
        child.material = Array.isArray(source) ? derived : derived[0];
      });
      setMaterialsVersion((v) => v + 1);
    });
    return () => cancelAnimationFrame(rafId);
  }, [resolved.materialType, resolved.roughness, modelReady]);

  // Part overrides + wireframe sit on top of the derived materials.
  useEffect(() => {
    if (!materialsVersion) return;
    modelRef.current?.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      const override = partMaterials[child.name];
      for (const mat of materialList(child.material)) {
        if (!mat) continue;
        const target = override ?? (mat.userData.base as PartMaterial | undefined);
        if (target) writePartMaterial(mat, target);
        if ("wireframe" in mat) mat.wireframe = resolved.wireframe;
      }
    });
  }, [partMaterials, resolved.wireframe, materialsVersion]);

  useEffect(() => {
    const group = highlightGroupRef.current;
    const mats = highlightMatsRef.current;
    if (!group || !mats) return;
    clearHighlight(group);
    const model = modelRef.current;
    if (!model || !selectedPart || !modelReady) return;
    model.updateMatrixWorld(true);
    model.traverse((child) => {
      if (!(child instanceof THREE.Mesh) || child instanceof THREE.SkinnedMesh || child.name !== selectedPart) return;
      group.add(followMesh(new THREE.Mesh(child.geometry, mats.rim), child));
      group.add(
        followMesh(
          new THREE.LineSegments(new THREE.EdgesGeometry(child.geometry, SELECTION_HIGHLIGHT.edgeThreshold), mats.edge),
          child
        )
      );
    });
  }, [selectedPart, modelReady]);

  return (
    <div className="relative h-full w-full isolate">
      <div ref={containerRef} className="h-full w-full relative z-0" />

      {loading && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
          <StudioOrb state="searching" size={64} />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
          <div className="text-center p-6 max-w-md">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-sm text-black mb-2">Unable to load model</div>
            <div className="text-xs text-neutral-500 mb-2">{error}</div>
            <div className="text-xs text-neutral-400 break-all mt-2">URL: {glbUrl}</div>
          </div>
        </div>
      )}
    </div>
  );
}
