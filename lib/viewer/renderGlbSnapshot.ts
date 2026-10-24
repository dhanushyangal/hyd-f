import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

export interface GlbSnapshotResult {
  blob: Blob;
  dataUrl: string;
  file: File;
}

export interface MultiViewSnapshotResult {
  views: GlbSnapshotResult[];
  composite: GlbSnapshotResult;
}

const ARBITRARY_CAMERA_ANGLES = [
  { angleIndex: 1, theta: 0, phi: 20 },
  { angleIndex: 2, theta: 90, phi: 25 },
  { angleIndex: 3, theta: 180, phi: 20 },
  { angleIndex: 4, theta: 270, phi: 25 },
] as const;

function sphericalToVector3(distance: number, thetaDeg: number, phiDeg: number): THREE.Vector3 {
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const phiRad = (phiDeg * Math.PI) / 180;
  return new THREE.Vector3(
    distance * Math.cos(phiRad) * Math.sin(thetaRad),
    distance * Math.sin(phiRad),
    distance * Math.cos(phiRad) * Math.cos(thetaRad)
  );
}

function disposeScene(scene: THREE.Scene, renderer: THREE.WebGLRenderer): void {
  renderer.dispose();
  scene.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry?.dispose();
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => {
          m.dispose();
        });
      } else if (obj.material) {
        obj.material.dispose();
      }
    }
  });
}

async function loadModel(
  url: string,
  isObj: boolean,
  headers?: Record<string, string>
): Promise<THREE.Group | THREE.Object3D> {
  if (isObj) {
    const objLoader = new OBJLoader();
    return new Promise((resolve, reject) => {
      objLoader.load(url, resolve, undefined, reject);
    });
  }
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
  if (headers) loader.setRequestHeader(headers);
  const gltf = await new Promise<any>((resolve, reject) => {
    loader.load(url, resolve, undefined, reject);
  });
  return gltf.scene;
}

async function createCompositeGrid(
  snapshots: GlbSnapshotResult[],
  cellWidth = 512,
  cellHeight = 512,
  baseName = "model"
): Promise<GlbSnapshotResult> {
  const canvas = document.createElement("canvas");
  const cols = snapshots.length <= 4 ? 2 : 3;
  const rows = Math.ceil(snapshots.length / cols);
  canvas.width = cellWidth * cols;
  canvas.height = cellHeight * rows;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2d context for composite canvas");
  }
  ctx.fillStyle = "#f8f9fa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const images = await Promise.all(
    snapshots.map((snap) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve(img);
        };
        img.onerror = reject;
        img.src = snap.dataUrl;
      });
    })
  );

  images.forEach((img, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    ctx.drawImage(img, col * cellWidth, row * cellHeight, cellWidth, cellHeight);
  });

  const dataUrl = canvas.toDataURL("image/png");
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => {
      if (b) {
        resolve(b);
      } else {
        reject(new Error("Failed to create composite blob"));
      }
    }, "image/png");
  });

  const file = new File([blob], `${baseName}-multiview-composite.png`, { type: "image/png" });
  return { blob, dataUrl, file };
}

/**
 * Captures exactly 4 camera angle snapshots around a 3D model (.glb / .gltf / .obj).
 * Used exclusively by Edit Studio to generate comprehensive geometric reference imagery
 * across all sides (Angle 1 through 4) without requiring manual positioning.
 */
export async function renderGlbMultiViewSnapshots(
  fileOrUrl: File | string,
  width = 768,
  height = 768
): Promise<MultiViewSnapshotResult> {
  if (typeof window === "undefined") {
    throw new Error("renderGlbMultiViewSnapshots can only run in a browser environment");
  }

  const isFile = typeof fileOrUrl !== "string";
  const url = isFile ? URL.createObjectURL(fileOrUrl) : fileOrUrl;
  const isObj = (isFile && fileOrUrl.name.toLowerCase().endsWith(".obj")) ||
    (!isFile && fileOrUrl.toLowerCase().endsWith(".obj"));
  const baseName = isFile ? fileOrUrl.name.replace(/\.[^/.]+$/, "") : "model";

  try {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f8f9fa");

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    const cameraLight = new THREE.DirectionalLight(0xffffff, 2.2);
    cameraLight.position.set(0, 0, 1);
    camera.add(cameraLight);
    scene.add(camera);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xddeeff, 1.0);
    scene.add(hemisphereLight);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const model = await loadModel(url, isObj);
    scene.add(model);

    // Normalize and center the model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 2 / maxDim : 1;
    model.scale.multiplyScalar(scale);
    model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    const newBox = new THREE.Box3().setFromObject(model);
    const newSize = newBox.getSize(new THREE.Vector3());
    const distance = Math.max(newSize.x, newSize.y, newSize.z) * 1.9;

    const views: GlbSnapshotResult[] = [];

    for (const angle of ARBITRARY_CAMERA_ANGLES) {
      const pos = sphericalToVector3(distance, angle.theta, angle.phi);
      camera.position.copy(pos);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);

      const dataUrl = canvas.toDataURL("image/png");
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) {
            resolve(b);
          } else {
            reject(new Error(`Failed to create snapshot blob for angle ${angle.angleIndex}`));
          }
        }, "image/png");
      });

      const file = new File([blob], `${baseName}-angle-${angle.angleIndex}.png`, { type: "image/png" });
      views.push({ blob, dataUrl, file });
    }

    const composite = await createCompositeGrid(views, 512, 512, baseName);
    disposeScene(scene, renderer);

    return { views, composite };
  } finally {
    if (isFile) {
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * Renders an offscreen snapshot of a 3D model (.glb / .gltf / .obj) into a 2D PNG image.
 * This provides high-quality reference imagery for Edit Studio and Model Studio flows.
 */
export async function renderGlbSnapshot(
  fileOrUrl: File | string,
  width = 768,
  height = 768,
  options?: { headers?: Record<string, string>; format?: "image/png" | "image/jpeg"; quality?: number }
): Promise<GlbSnapshotResult> {
  if (typeof window === "undefined") {
    throw new Error("renderGlbSnapshot can only run in a browser environment");
  }

  const isFile = typeof fileOrUrl !== "string";
  const url = isFile ? URL.createObjectURL(fileOrUrl) : fileOrUrl;
  const isObj = (isFile && fileOrUrl.name.toLowerCase().endsWith(".obj")) ||
    (!isFile && fileOrUrl.toLowerCase().endsWith(".obj"));
  const baseName = isFile ? fileOrUrl.name.replace(/\.[^/.]+$/, "") : "model";

  try {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f8f9fa");

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(5, 10, 7);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xddeeff, 1.2);
    fillLight.position.set(-6, 4, -4);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 1.5);
    rimLight.position.set(0, -5, -6);
    scene.add(rimLight);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    const model = await loadModel(url, isObj, options?.headers);
    scene.add(model);

    // Normalize and center the model
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = maxDim > 0 ? 2 / maxDim : 1;
    model.scale.multiplyScalar(scale);
    model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    // Position camera for 3/4 isometric angle
    const newBox = new THREE.Box3().setFromObject(model);
    const newSize = newBox.getSize(new THREE.Vector3());
    const distance = Math.max(newSize.x, newSize.y, newSize.z) * 1.8;
    camera.position.set(distance * 0.75, distance * 0.65, distance * 0.95);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);

    const format = options?.format ?? "image/png";
    const quality = options?.quality ?? 0.86;
    const dataUrl = canvas.toDataURL(format, quality);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) {
          resolve(b);
        } else {
          reject(new Error("Failed to create snapshot blob from canvas"));
        }
      }, format, quality);
    });

    const ext = format === "image/jpeg" ? "jpg" : "png";
    const file = new File([blob], `${baseName}-render.${ext}`, { type: format });
    disposeScene(scene, renderer);

    return { blob, dataUrl, file };
  } finally {
    if (isFile) {
      URL.revokeObjectURL(url);
    }
  }
}

/**
 * Library card only. A close, straight-on front of the mesh, fitted to the frame.
 * Does not share a camera with the Edit Studio snapshot or the four-angle set.
 */
export async function renderLibraryMeshSnapshot(
  url: string,
  size = 384,
  options?: { headers?: Record<string, string> }
): Promise<GlbSnapshotResult> {
  if (typeof window === "undefined") {
    throw new Error("renderLibraryMeshSnapshot can only run in a browser environment");
  }

  const isObj = url.split("?")[0].toLowerCase().endsWith(".obj");
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#f4f4f5");

  const camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100);
  scene.add(new THREE.AmbientLight(0xffffff, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(2.2, 4.5, 6);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xe8eef8, 0.9);
  fill.position.set(-4, 2, 3);
  scene.add(fill);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    preserveDrawingBuffer: true,
    alpha: false,
  });
  renderer.setSize(size, size);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  try {
    const model = await loadModel(url, isObj, options?.headers);
    scene.add(model);

    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const dims = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(dims.x, dims.y, dims.z);
    const scale = maxDim > 0 ? 2 / maxDim : 1;
    model.scale.multiplyScalar(scale);
    model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

    const fitted = new THREE.Box3().setFromObject(model);
    const fittedSize = fitted.getSize(new THREE.Vector3());
    const fittedCenter = fitted.getCenter(new THREE.Vector3());
    const fov = (camera.fov * Math.PI) / 180;
    const halfY = Math.max(fittedSize.y, 0.001) / 2;
    const halfX = Math.max(fittedSize.x, 0.001) / 2;
    const distForHeight = halfY / Math.tan(fov / 2);
    const distForWidth = halfX / Math.tan(fov / 2);
    // 8% margin. The previous card sat the whole figure in the middle of a wide frame.
    const dist = Math.max(distForHeight, distForWidth) * 1.08;
    camera.position.set(fittedCenter.x, fittedCenter.y, fittedCenter.z + dist);
    camera.near = Math.max(0.01, dist / 80);
    camera.far = dist * 12;
    camera.lookAt(fittedCenter);
    camera.updateProjectionMatrix();

    renderer.render(scene, camera);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.88);
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Failed to create library thumbnail"))), "image/jpeg", 0.88);
    });
    const file = new File([blob], "library-mesh.jpg", { type: "image/jpeg" });
    disposeScene(scene, renderer);
    return { blob, dataUrl, file };
  } catch (err) {
    disposeScene(scene, renderer);
    throw err;
  }
}
