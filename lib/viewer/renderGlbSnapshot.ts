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

async function loadModel(url: string, isObj: boolean): Promise<THREE.Group | THREE.Object3D> {
  if (isObj) {
    const objLoader = new OBJLoader();
    return new Promise((resolve, reject) => {
      objLoader.load(url, resolve, undefined, reject);
    });
  }
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);
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
  height = 768
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

    // Position camera for 3/4 isometric angle
    const newBox = new THREE.Box3().setFromObject(model);
    const newSize = newBox.getSize(new THREE.Vector3());
    const distance = Math.max(newSize.x, newSize.y, newSize.z) * 1.8;
    camera.position.set(distance * 0.75, distance * 0.65, distance * 0.95);
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);

    const dataUrl = canvas.toDataURL("image/png");
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => {
        if (b) {
          resolve(b);
        } else {
          reject(new Error("Failed to create snapshot blob from canvas"));
        }
      }, "image/png");
    });

    const file = new File([blob], `${baseName}-render.png`, { type: "image/png" });
    disposeScene(scene, renderer);

    return { blob, dataUrl, file };
  } finally {
    if (isFile) {
      URL.revokeObjectURL(url);
    }
  }
}
