"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import type {
  Group,
  Material,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  Texture,
  WebGLRenderer,
} from "three";
import { NOT_FOUND_GRASS_URL } from "@/lib/cloudinary";
import { GEIST_FONT, SANS_FONT } from "@/lib/fonts";

const PITCH_MIN = 0.08;
const PITCH_MAX = 1.42;
const DAMPING = 0.14;

let grassBufferPromise: Promise<ArrayBuffer> | null = null;

function loadGrassBuffer(): Promise<ArrayBuffer> {
  if (!grassBufferPromise) {
    grassBufferPromise = fetch(NOT_FOUND_GRASS_URL, {
      mode: "cors",
      cache: "force-cache",
    }).then((response) => {
      if (!response.ok) {
        grassBufferPromise = null;
        throw new Error(`Grass model failed (${response.status})`);
      }
      return response.arrayBuffer();
    });
  }
  return grassBufferPromise;
}

function disposeObject(root: Object3D) {
  root.traverse((node) => {
    const mesh = node as Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      const mat = material as Material & Record<string, Texture | null | undefined>;
      for (const value of Object.values(mat)) {
        if (value && value.isTexture) value.dispose();
      }
      material.dispose();
    }
  });
}

export function NotFoundGrass() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const sync = () => {
      document.body.classList.toggle("not-found-scrolled", window.scrollY > 8);
    };
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => {
      window.removeEventListener("scroll", sync);
      document.body.classList.remove("not-found-scrolled");
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let renderer: WebGLRenderer | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let root: Group | null = null;
    const target = { yaw: 0.45, pitch: 0.54 };
    const current = { yaw: 0.45, pitch: 0.54 };
    let pointer: { id: number; x: number; y: number; rotating: boolean } | null = null;
    let releaseInput = () => {};

    const boot = async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const { MeshoptDecoder } = await import("three/examples/jsm/libs/meshopt_decoder.module.js");
      await MeshoptDecoder.ready;
      if (disposed) return;

      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(72, 1, 0.01, 40);
      camera.position.set(2.0, 0.125, 0.36);
      camera.rotation.order = "YXZ";

      const applyLook = () => {
        camera.rotation.order = "YXZ";
        camera.rotation.y = current.yaw;
        camera.rotation.x = current.pitch;
        camera.rotation.z = 0;
      };
      applyLook();

      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !coarse,
        alpha: true,
        stencil: false,
        powerPreference: "high-performance",
        precision: coarse ? "mediump" : "highp",
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));

      scene.add(new THREE.HemisphereLight(0xdff0ff, 0x3b682e, 1.55));
      const sun = new THREE.DirectionalLight(0xfff7e8, 2.55);
      sun.position.set(4.2, 8.4, 2.1);
      scene.add(sun);
      const fill = new THREE.DirectionalLight(0xc5ddff, 0.95);
      fill.position.set(-3.2, 4.4, -2.2);
      scene.add(fill);

      const resize = () => {
        if (!renderer) return;
        const width = canvas.clientWidth || window.innerWidth;
        const height = canvas.clientHeight || window.innerHeight;
        if (width < 2 || height < 2) return;
        const aspect = width / height;
        camera.aspect = aspect;
        const horizontal = (80 * Math.PI) / 180;
        const vertical = 2 * Math.atan(Math.tan(horizontal / 2) / Math.max(aspect, 0.55));
        camera.fov = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(vertical), 52, 96);
        camera.updateProjectionMatrix();
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
        renderer.setSize(width, height, false);
      };
      resize();
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(canvas);

      const onPointerDown = (event: PointerEvent) => {
        if (event.button !== 0 || pointer) return;
        pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, rotating: false };
      };
      const onPointerMove = (event: PointerEvent) => {
        if (!pointer || event.pointerId !== pointer.id) return;
        const dx = event.clientX - pointer.x;
        const dy = event.clientY - pointer.y;
        if (!pointer.rotating) {
          if (Math.hypot(dx, dy) < 3) return;
          if (coarse && Math.abs(dy) > Math.abs(dx)) {
            pointer = null;
            return;
          }
          pointer.rotating = true;
          canvas.setPointerCapture(event.pointerId);
        }
        target.yaw -= dx * 0.0052;
        target.pitch = Math.min(PITCH_MAX, Math.max(PITCH_MIN, target.pitch - dy * 0.0052));
        pointer.x = event.clientX;
        pointer.y = event.clientY;
      };
      const onPointerUp = (event: PointerEvent) => {
        if (!pointer || event.pointerId !== pointer.id) return;
        pointer = null;
      };
      releaseInput = () => {
        canvas.removeEventListener("pointerdown", onPointerDown);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("pointerup", onPointerUp);
        window.removeEventListener("pointercancel", onPointerUp);
      };
      canvas.addEventListener("pointerdown", onPointerDown);
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
      window.addEventListener("pointercancel", onPointerUp);

      const loop = () => {
        if (disposed || !renderer) return;
        current.yaw += (target.yaw - current.yaw) * DAMPING;
        current.pitch += (target.pitch - current.pitch) * DAMPING;
        applyLook();
        renderer.render(scene, camera);
      };
      renderer.setAnimationLoop(loop);

      const buffer = await loadGrassBuffer();
      if (disposed) return;

      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);

      const gltf = await new Promise<{ scene: Group }>((resolve, reject) => {
        loader.parse(buffer, "", resolve, reject);
      });
      if (disposed || !renderer) {
        disposeObject(gltf.scene);
        return;
      }

      root = gltf.scene;
      let heroClump: Mesh | null = null;
      root.traverse((node) => {
        const mesh = node as Mesh;
        if (!mesh.isMesh) return;
        if (mesh.name.includes("rostlinka_07_ground")) {
          heroClump = mesh;
        }
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const material of materials) {
          const mat = material as MeshStandardMaterial;
          mat.side = THREE.DoubleSide;
          mat.metalness = 0;
          if (mat.alphaTest > 0 || mat.transparent) {
            mat.alphaTest = 0.35;
            mat.transparent = false;
            mat.depthWrite = true;
          }
          mat.needsUpdate = true;
        }
      });

      if (heroClump) {
        const source = heroClump as Mesh;
        const surround = new THREE.Mesh(source.geometry, source.material);
        surround.position.set(2.0, -0.012, 0.36);
        surround.scale.setScalar(1.25);
        root.add(surround);
      }

      root.traverse((node) => {
        node.updateMatrix();
        node.matrixAutoUpdate = false;
      });
      root.updateMatrixWorld(true);

      scene.add(root);
      await renderer.compileAsync(root, camera, scene);
      if (disposed || !renderer) return;
      renderer.render(scene, camera);
    };

    void boot().catch((error: unknown) => {
      if (disposed) return;
      console.error("Failed to load 404 grass model:", error);
    });

    return () => {
      disposed = true;
      releaseInput();
      resizeObserver?.disconnect();
      renderer?.setAnimationLoop(null);
      if (root) disposeObject(root);
      renderer?.dispose();
      renderer = null;
    };
  }, []);

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 z-0 bg-[linear-gradient(180deg,#6ea8e6_0%,#c5dff6_48%,#e7f3e4_100%)]"
        aria-hidden
      />
      <div className="fixed inset-0 z-0">
        <canvas ref={canvasRef} className="block h-full w-full cursor-grab active:cursor-grabbing touch-pan-y" />
      </div>
      <div className="not-found-grass pointer-events-none relative z-10 flex min-h-dvh items-start justify-center px-6 pt-[18vh] sm:pt-[20vh]">
        <h1
          className="flex flex-col items-center gap-2 text-center select-none sm:flex-row sm:items-baseline sm:gap-3.5"
          style={{
            fontFamily: SANS_FONT,
            textShadow: "0 1px 2px rgba(6, 20, 38, 0.18), 0 12px 32px rgba(6, 20, 38, 0.14)",
          }}
        >
          <span className="text-[clamp(2.25rem,5vw,3.75rem)] font-medium leading-[1.02] tracking-[-0.035em] text-white">
            You are lost
          </span>
          <span
            className="text-[clamp(1rem,1.8vw,1.25rem)] font-medium tracking-[0.14em] text-white/80 uppercase"
            style={{ fontFamily: GEIST_FONT }}
          >
            404
          </span>
        </h1>
      </div>
    </>
  );
}
