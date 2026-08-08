"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export type ViewerEnvLighting = "studio" | "outdoor" | "neutral";
export type ViewerMaterialType = "standard" | "matcap" | "toon" | "lambert" | "normal";
export type ViewerMaterialRoughness = "smooth" | "medium" | "rough";

type Props = {
  glbUrl: string;
  background?: boolean;
  grid?: boolean;
  shadow?: boolean;
  autoRotate?: boolean;
  lighting?: ViewerEnvLighting;
  lightIntensity?: number;
  brightness?: number;
  materialType?: ViewerMaterialType;
  materialRoughness?: ViewerMaterialRoughness;
  /** When provided, wireframe is controlled from parent (e.g. workspace top bar) */
  wireframeMode?: boolean;
  onWireframeChange?: (on: boolean) => void;
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

// Gradient background texture (Blender-style soft backdrop when background is on)
function createGradientBackgroundTexture(): THREE.CanvasTexture {
  const w = 256;
  const h = 256;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.CanvasTexture(canvas);
  const gradient = ctx.createLinearGradient(0, 0, 0, h);
  gradient.addColorStop(0, "#f5f5f5");
  gradient.addColorStop(0.5, "#fafafa");
  gradient.addColorStop(1, "#ebebeb");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
let gradientBackgroundTexture: THREE.CanvasTexture | null = null;
function getGradientBackgroundTexture(): THREE.CanvasTexture {
  if (!gradientBackgroundTexture) gradientBackgroundTexture = createGradientBackgroundTexture();
  return gradientBackgroundTexture;
}

export function ThreeViewer({
  glbUrl,
  background = true,
  grid: showGrid = false,
  shadow: showShadow = true,
  autoRotate = false,
  lighting = "neutral",
  lightIntensity = 1,
  brightness = 1,
  materialType = "standard",
  materialRoughness = "medium",
  wireframeMode: wireframeModeProp,
  onWireframeChange,
}: Props) {
  const { getToken } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const modelRef = useRef<THREE.Group | null>(null); // Store reference to the actual model
  const wireframeOverlayRef = useRef<THREE.Group | null>(null); // Store reference to wireframe overlay
  const sceneRefForWireframe = useRef<THREE.Scene | null>(null); // Store scene reference for wireframe toggle
  const gridHelperRef = useRef<THREE.GridHelper | null>(null);
  const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
  const keyLightRef = useRef<THREE.DirectionalLight | null>(null);
  const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
  const rimLightRef = useRef<THREE.DirectionalLight | null>(null);
  const hemisphereLightRef = useRef<THREE.HemisphereLight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [internalWireframeMode, setInternalWireframeMode] = useState(false);
  const [modelReady, setModelReady] = useState(false); // Triggers material sync when model has loaded

  const isControlledWireframe = wireframeModeProp !== undefined;
  const wireframeMode = isControlledWireframe ? wireframeModeProp : internalWireframeMode;

  // Apply or remove wireframe overlay (used by both controlled and uncontrolled)
  const applyWireframe = useCallback((show: boolean) => {
    if (!modelRef.current || !sceneRefForWireframe.current) return;
    if (show) {
      if (wireframeOverlayRef.current) return; // already on
      const wireframeGroup = modelRef.current.clone();
      wireframeGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.geometry) {
          const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            wireframe: true,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
          });
          child.material = wireframeMaterial;
        }
      });
      wireframeOverlayRef.current = wireframeGroup;
      sceneRefForWireframe.current.add(wireframeGroup);
    } else {
      if (!wireframeOverlayRef.current || !sceneRefForWireframe.current) return;
      wireframeOverlayRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
          else child.material.dispose();
        }
      });
      sceneRefForWireframe.current.remove(wireframeOverlayRef.current);
      wireframeOverlayRef.current = null;
    }
  }, []);

  // Sync overlay when controlled wireframeMode or model readiness changes
  useEffect(() => {
    if (modelRef.current && sceneRefForWireframe.current) applyWireframe(wireframeMode);
  }, [wireframeMode, modelReady, applyWireframe]);

  const toggleWireframe = useCallback(() => {
    const next = !wireframeMode;
    if (isControlledWireframe) onWireframeChange?.(next);
    else setInternalWireframeMode(next);
  }, [wireframeMode, isControlledWireframe, onWireframeChange]);

  useEffect(() => {
    if (!containerRef.current || !glbUrl) return;

    // Cleanup previous scene
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    // Reset wireframe state and overlay when model changes
    setInternalWireframeMode(false);
    if (wireframeOverlayRef.current && sceneRef.current) {
      // Cleanup wireframe overlay (materials only, geometries are shared)
      wireframeOverlayRef.current.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // Don't dispose geometry - it's shared with the original model
          if (child.material) {
            if (Array.isArray(child.material)) {
              child.material.forEach((mat) => mat.dispose());
            } else {
              child.material.dispose();
            }
          }
        }
      });
      sceneRef.current.remove(wireframeOverlayRef.current);
      wireframeOverlayRef.current = null;
    }
    modelRef.current = null;
    setModelReady(false);

    setLoading(true);
    setError(null);
    setLoadProgress(0);

    const scene = new THREE.Scene();
    scene.background = background ? getGradientBackgroundTexture() : null;
    sceneRef.current = scene;
    sceneRefForWireframe.current = scene; // Store scene reference for wireframe toggle

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(2, 2, 3);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = showShadow;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.5;
    controls.maxDistance = 10;
    controls.target.set(0, 0, 0);
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.0;
    controls.update();
    controlsRef.current = controls;

    // Lighting (presets: neutral, studio, outdoor)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    ambientLightRef.current = ambientLight;

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(5, 10, 5);
    keyLight.castShadow = showShadow;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);
    keyLightRef.current = keyLight;

    // Fill light (softer, from opposite side)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);
    fillLightRef.current = fillLight;

    // Rim light (back light for depth)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
    rimLight.position.set(0, 3, -8);
    scene.add(rimLight);
    rimLightRef.current = rimLight;

    // Hemisphere light for ambient fill
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.5);
    hemisphereLight.position.set(0, 20, 0);
    scene.add(hemisphereLight);
    hemisphereLightRef.current = hemisphereLight;

    // Grid helper with light gray colors
    const gridHelper = new THREE.GridHelper(10, 20, 0xd4d4d4, 0xe5e5e5);
    gridHelper.position.y = -0.5;
    gridHelper.visible = showGrid;
    gridHelperRef.current = gridHelper;
    scene.add(gridHelper);

    // Animation loop
    const animate = () => {
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      if (rendererRef.current && sceneRef.current && camera) {
        rendererRef.current.render(sceneRef.current, camera);
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    animate();

    // Handle resize (window + container so we react to layout changes e.g. full view)
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !camera) return;
      const { clientWidth, clientHeight } = containerRef.current;
      if (clientWidth === 0 || clientHeight === 0) return;

      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
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
            modelRef.current = model; // Store reference to the actual model

            // Center and scale the model
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Calculate scale to fit in view
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = maxDim > 0 ? 2 / maxDim : 1;
            model.scale.multiplyScalar(scale);

            // Center the model
            model.position.x = -center.x * scale;
            model.position.y = -center.y * scale;
            model.position.z = -center.z * scale;

            // Enable shadows; store original material ref for material-type switching
            model.traverse((child) => {
              if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                (child as THREE.Mesh & { userData: { originalMaterial?: THREE.Material } }).userData.originalMaterial = child.material;
                if (child.material) {
                  if (Array.isArray(child.material)) {
                    child.material.forEach((mat: THREE.Material) => {
                      if (mat instanceof THREE.MeshStandardMaterial) mat.envMapIntensity = 0.8;
                    });
                  } else if (child.material instanceof THREE.MeshStandardMaterial) {
                    child.material.envMapIntensity = 0.8;
                  }
                }
              }
            });

            scene.add(model);
            setLoading(false);
            setModelReady(true); // So material sync effect runs and applies materialType/roughness

            // Adjust camera to view the model
            const newBox = new THREE.Box3().setFromObject(model);
            const newSize = newBox.getSize(new THREE.Vector3());
            const maxSize = Math.max(newSize.x, newSize.y, newSize.z);
            const distance = maxSize * 2;
            camera.position.set(distance * 0.7, distance * 0.7, distance * 0.7);
            camera.lookAt(0, 0, 0);
            controls.target.set(0, 0, 0);
            controls.update();
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

    // Cleanup
    return () => {
      cancelled = true;
      if (containerEl) ro.unobserve(containerEl);
      window.removeEventListener("resize", handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (containerRef.current && rendererRef.current.domElement.parentNode === containerRef.current) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      }
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh) {
            object.geometry?.dispose();
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material?.dispose();
            }
          }
        });
        sceneRef.current.clear();
      }
      // Cleanup wireframe overlay (materials only, geometries are shared)
      if (wireframeOverlayRef.current) {
        wireframeOverlayRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Don't dispose geometry - it's shared with the original model
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach((mat) => mat.dispose());
              } else {
                child.material.dispose();
              }
            }
          }
        });
        if (sceneRef.current && wireframeOverlayRef.current.parent === sceneRef.current) {
          sceneRef.current.remove(wireframeOverlayRef.current);
        }
        wireframeOverlayRef.current = null;
      }
    };
  }, [glbUrl, getToken]);

  // Sync viewer options when they change (background, grid, autoRotate, lighting, material, brightness)
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = background ? getGradientBackgroundTexture() : null;
    }
    if (gridHelperRef.current) {
      gridHelperRef.current.visible = showGrid;
    }
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
    if (rendererRef.current) {
      rendererRef.current.toneMappingExposure = brightness;
      rendererRef.current.shadowMap.enabled = showShadow;
    }
    if (keyLightRef.current) keyLightRef.current.castShadow = showShadow;
    const lightingPresets: Record<ViewerEnvLighting, { ambient: number; key: number; fill: number; rim: number; hemi: number }> = {
      neutral: { ambient: 0.4, key: 1.0, fill: 0.3, rim: 0.2, hemi: 0.5 },
      studio: { ambient: 0.6, key: 1.2, fill: 0.35, rim: 0.25, hemi: 0.55 },
      outdoor: { ambient: 0.7, key: 1.4, fill: 0.4, rim: 0.3, hemi: 0.6 },
    };
    const preset = lightingPresets[lighting];
    const scale = Math.max(0.3, Math.min(2, lightIntensity));
    if (ambientLightRef.current) ambientLightRef.current.intensity = preset.ambient * scale;
    if (keyLightRef.current) keyLightRef.current.intensity = preset.key * scale;
    if (fillLightRef.current) fillLightRef.current.intensity = preset.fill * scale;
    if (rimLightRef.current) rimLightRef.current.intensity = preset.rim * scale;
    if (hemisphereLightRef.current) hemisphereLightRef.current.intensity = preset.hemi * scale;

    const model = modelRef.current;
    if (!model) return;

    const roughnessMap: Record<ViewerMaterialRoughness, number> = {
      smooth: 0.2,
      medium: 0.5,
      rough: 0.9,
    };
    const r = roughnessMap[materialRoughness];
    const matcapTex = getDefaultMatcap();

    // Defer heavy material updates to next frame so UI (material/wireframe buttons) feels instant like wireframe
    const rafId = requestAnimationFrame(() => {
      if (!modelRef.current) return;
      const m = modelRef.current;
      m.traverse((child) => {
        if (!(child instanceof THREE.Mesh) || !child.geometry) return;
        const mesh = child;
        const orig = (mesh.userData as { originalMaterial?: THREE.Material }).originalMaterial;
        if (!orig) return;

          const current = mesh.material;
        const currentSingle = Array.isArray(current) ? current[0] : current;
        const isReplacement =
          current !== orig && !(Array.isArray(orig) && (orig as THREE.Material[]).includes(currentSingle as THREE.Material));

        const alreadyStandard = currentSingle instanceof THREE.MeshStandardMaterial && (current === orig || (Array.isArray(orig) && orig.includes(currentSingle)));
        const alreadyMatcap = currentSingle instanceof THREE.MeshMatcapMaterial;
        const alreadyToon = currentSingle instanceof THREE.MeshToonMaterial;
        const alreadyLambert = currentSingle instanceof THREE.MeshLambertMaterial;
        const alreadyNormal = currentSingle instanceof THREE.MeshNormalMaterial;

        if (materialType === "standard") {
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          const allStandard = mats.every((m) => m instanceof THREE.MeshStandardMaterial);
          const sameAsOrig =
            current === orig || (Array.isArray(current) && Array.isArray(orig) && (current as THREE.Material[]).length === orig.length);
          if (allStandard && sameAsOrig) {
            mats.forEach((m) => {
              if (m instanceof THREE.MeshStandardMaterial) {
                m.roughness = r;
                m.envMapIntensity = 0.8;
              }
            });
            return;
          }
          if (isReplacement && current) {
            if (Array.isArray(current)) current.forEach((m) => m.dispose());
            else (current as THREE.Material).dispose();
          }
          if (Array.isArray(orig)) {
            const clones = orig.map((o) => (o as THREE.Material).clone());
            mesh.material = clones.length === 1 ? clones[0] : clones;
            (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => {
              if (m instanceof THREE.MeshStandardMaterial) {
                m.roughness = r;
                m.envMapIntensity = 0.8;
              }
            });
          } else {
            const origMat = orig as THREE.Material;
            if (origMat instanceof THREE.MeshStandardMaterial) {
              const base = origMat.clone();
              mesh.material = base;
              base.roughness = r;
              base.envMapIntensity = 0.8;
            } else {
              // GLB may use MeshBasicMaterial or other; use MeshStandardMaterial for PBR
              const color = origMat instanceof THREE.MeshBasicMaterial ? (origMat as THREE.MeshBasicMaterial).color.clone() : new THREE.Color(0xcccccc);
              if ("color" in origMat && origMat.color) color.copy((origMat as { color: THREE.Color }).color);
              mesh.material = new THREE.MeshStandardMaterial({ color, roughness: r, metalness: 0.1, envMapIntensity: 0.8 });
            }
          }
          return;
        }

        if (materialType === "matcap") {
          if (alreadyMatcap) return;
          if (isReplacement && current) {
            if (Array.isArray(current)) current.forEach((m) => m.dispose());
            else (current as THREE.Material).dispose();
          }
          const color = new THREE.Color(0xcccccc);
          if (Array.isArray(orig) && orig[0] && "color" in orig[0]) color.copy((orig[0] as { color: THREE.Color }).color);
          else if (orig && "color" in orig) color.copy((orig as { color: THREE.Color }).color);
          mesh.material = new THREE.MeshMatcapMaterial({ matcap: matcapTex, color });
          return;
        }

        if (materialType === "toon") {
          if (alreadyToon) return;
          if (isReplacement && current) {
            if (Array.isArray(current)) current.forEach((m) => m.dispose());
            else (current as THREE.Material).dispose();
          }
          const colorToon = new THREE.Color(0xcccccc);
          if (Array.isArray(orig) && orig[0] && "color" in orig[0]) colorToon.copy((orig[0] as { color: THREE.Color }).color);
          else if (orig && "color" in orig) colorToon.copy((orig as { color: THREE.Color }).color);
          const gradientMap = getToonGradientMap();
          const origMat = Array.isArray(orig) ? orig[0] : orig;
          const map = origMat && "map" in origMat && origMat.map ? (origMat as { map: THREE.Texture }).map : null;
          mesh.material = new THREE.MeshToonMaterial({
            color: colorToon,
            gradientMap,
            map: map || undefined,
          });
          return;
        }

        if (materialType === "lambert") {
          if (alreadyLambert) return;
          if (isReplacement && current) {
            if (Array.isArray(current)) current.forEach((m) => m.dispose());
            else (current as THREE.Material).dispose();
          }
          const colorLambert = new THREE.Color(0xcccccc);
          if (Array.isArray(orig) && orig[0] && "color" in orig[0]) colorLambert.copy((orig[0] as { color: THREE.Color }).color);
          else if (orig && "color" in orig) colorLambert.copy((orig as { color: THREE.Color }).color);
          const origMat = Array.isArray(orig) ? orig[0] : orig;
          const map = origMat && "map" in origMat && origMat.map ? (origMat as { map: THREE.Texture }).map : null;
          mesh.material = new THREE.MeshLambertMaterial({ color: colorLambert, map: map || undefined });
          return;
        }

        if (materialType === "normal") {
          if (alreadyNormal) return;
          if (isReplacement && current) {
            if (Array.isArray(current)) current.forEach((m) => m.dispose());
            else (current as THREE.Material).dispose();
          }
          mesh.material = new THREE.MeshNormalMaterial({ flatShading: false });
          return;
        }
      });
    });

    return () => cancelAnimationFrame(rafId);
  }, [background, showGrid, showShadow, autoRotate, lighting, lightIntensity, brightness, materialType, materialRoughness, modelReady]);

  return (
    <div className="relative h-full min-h-[400px] isolate">
      <div ref={containerRef} className="h-full w-full relative z-0" />
      
      {/* Wireframe Toggle Button - only when not controlled by parent (e.g. workspace has its own in top bar) */}
      {!loading && !error && modelRef.current && !isControlledWireframe && (
        <button
          onClick={toggleWireframe}
          className={`absolute top-4 right-4 z-10 p-2.5 rounded-lg transition-all duration-200 ${
            wireframeMode 
              ? "bg-black text-white hover:bg-neutral-900 border border-neutral-800 shadow-md" 
              : "bg-white/95 hover:bg-white text-neutral-700 hover:text-black border border-neutral-200/80 shadow-sm hover:shadow-md"
          } backdrop-blur-sm`}
          title={wireframeMode ? "Wireframe - On" : "Wireframe - Off"}
        >
          <svg 
            className={`w-5 h-5 transition-all duration-200 ${
              wireframeMode ? "opacity-100" : "opacity-70"
            }`}
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            strokeWidth={wireframeMode ? 2.5 : 2}
          >
            {/* Globe with wireframe/grid lines icon */}
            <circle cx="12" cy="12" r="10" stroke="currentColor" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
          </svg>
        </button>
      )}
      
      {/* Controls hint — z-10 so it stays above canvas when model is loaded */}
      <div className="absolute bottom-4 left-4 z-10 text-xs text-neutral-500 bg-white/80 px-3 py-1.5 rounded-lg pointer-events-none">
        Drag to rotate • Scroll to zoom
      </div>
      
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-white">
          <div className="text-center">
            <div className="w-10 h-10 mx-auto mb-4">
              <div className="w-10 h-10 spinner"></div>
            </div>
            <div className="text-black text-sm">Loading model...</div>
            {loadProgress > 0 ? (
              <>
                <div className="text-xs text-neutral-400 mt-1">{loadProgress}%</div>
                <div className="w-48 h-1 bg-neutral-200 rounded-full overflow-hidden mt-2 mx-auto">
                  <div 
                    className="h-full bg-black rounded-full transition-all duration-300"
                    style={{ width: `${loadProgress}%` }}
                  ></div>
                </div>
              </>
            ) : (
              <div className="text-xs text-neutral-400 mt-1">Preparing...</div>
            )}
          </div>
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
