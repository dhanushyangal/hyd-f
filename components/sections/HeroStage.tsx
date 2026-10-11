"use client";

import { useEffect, useRef } from "react";
import type { Group, Material, Mesh, Object3D, Texture, WebGLRenderer } from "three";
import { HERO_STAGE_MODELS } from "@/lib/cloudinary";

const MODELS = HERO_STAGE_MODELS;

/** Swap only after the stage has been still this long. */
const IDLE_SWAP_MS = 6000;

type Turntable = {
  dispose: () => void;
  update: () => void;
  target: { set: (x: number, y: number, z: number) => void };
  autoRotate: boolean;
  autoRotateSpeed: number;
  enablePan: boolean;
  enableZoom: boolean;
  enableDamping: boolean;
  dampingFactor: number;
  rotateSpeed: number;
  minPolarAngle: number;
  maxPolarAngle: number;
  addEventListener: (type: "start" | "end", listener: () => void) => void;
  listenToKeyEvents: (domElement: HTMLElement) => void;
};

function disposeObject(root: Object3D) {
  root.traverse((node) => {
    const mesh = node as Mesh;
    if (!mesh.isMesh) return;
    mesh.geometry?.dispose();
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    for (const material of materials) {
      const mat = material as Material & Record<string, Texture | null | undefined>;
      for (const value of Object.values(mat)) {
        if (value && (value as Texture).isTexture) (value as Texture).dispose();
      }
      material.dispose();
    }
  });
}

function freeze(root: Object3D) {
  root.traverse((node) => {
    node.updateMatrix();
    node.matrixAutoUpdate = false;
  });
  root.updateMatrixWorld(true);
}

/**
 * Hero stage: the rounded 3D viewer card. The prompt sits on top of it.
 * The mesh is framed in the open area under the prompt.
 * It turntable-spins until a drag starts, then follows the pointer.
 * The next model is shown only after the stage sits untouched.
 */
export function HeroStage({
  reduceMotion,
  children,
}: {
  reduceMotion: boolean;
  children: React.ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const reduceRef = useRef(reduceMotion);
  reduceRef.current = reduceMotion;

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    let disposed = false;
    let renderer: WebGLRenderer | null = null;
    let orbit: Turntable | null = null;
    let resizeObserver: ResizeObserver | null = null;
    let intersectionObserver: IntersectionObserver | null = null;
    let idleTimer = 0;
    let idleCallback = 0;
    let focusStage: (() => void) | null = null;
    const roots: Group[] = [];
    let active = 0;
    let dragging = false;

    const boot = async () => {
      const THREE = await import("three");
      const { GLTFLoader } = await import("three/examples/jsm/loaders/GLTFLoader.js");
      const { OrbitControls } = await import("three/examples/jsm/controls/OrbitControls.js");
      const { MeshoptDecoder } = await import("three/examples/jsm/libs/meshopt_decoder.module.js");
      await MeshoptDecoder.ready;
      if (disposed) return;

      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#f1f5fb");

      const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 100);
      renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !coarse,
        alpha: false,
        stencil: false,
        powerPreference: "high-performance",
        precision: coarse ? "mediump" : "highp",
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1 : 2));

      scene.add(new THREE.HemisphereLight(0xffffff, 0xd5e2f4, 1.05));
      const key = new THREE.DirectionalLight(0xfff8f2, 2.85);
      key.position.set(3.2, 7.2, 4.2);
      scene.add(key);
      const fill = new THREE.DirectionalLight(0xc5d7f0, 0.72);
      fill.position.set(-6, 2.2, 2.4);
      scene.add(fill);
      const rim = new THREE.DirectionalLight(0xffffff, 1.05);
      rim.position.set(-0.6, 3.4, -6);
      scene.add(rim);

      const resize = () => {
        if (!renderer) return;
        const width = stage.clientWidth;
        const height = stage.clientHeight;
        if (width < 2 || height < 2) return;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };
      resize();
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(stage);

      const centered = new WeakSet<Object3D>();
      const fit = (root: Object3D) => {
        if (!orbit) return;
        if (!centered.has(root)) {
          const box = new THREE.Box3().setFromObject(root);
          root.position.sub(box.getCenter(new THREE.Vector3()));
          freeze(root);
          centered.add(root);
        }
        const box = new THREE.Box3().setFromObject(root);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const fov = (camera.fov * Math.PI) / 180;
        const dist = ((maxDim / 2) / Math.tan(fov / 2)) * 1.26;
        const targetY = maxDim * 0.09;
        camera.position.set(dist * 0.28, targetY + maxDim * 0.08, dist);
        camera.near = Math.max(dist / 100, 0.01);
        camera.far = dist * 12;
        camera.updateProjectionMatrix();
        orbit.target.set(0, targetY, 0);
        camera.lookAt(0, targetY, 0);
        orbit.update();
      };

      const controls = new OrbitControls(camera, canvas);
      orbit = controls;
      controls.enablePan = false;
      controls.enableZoom = false;
      controls.enableDamping = !coarse;
      controls.dampingFactor = 0.08;
      controls.rotateSpeed = coarse ? 1 : 0.85;
      controls.autoRotate = !reduceRef.current;
      controls.autoRotateSpeed = 0.85;
      controls.minPolarAngle = Math.PI / 3.2;
      controls.maxPolarAngle = Math.PI / 1.7;
      controls.listenToKeyEvents(stage);
      canvas.style.touchAction = "none";
      focusStage = () => stage.focus({ preventScroll: true });
      canvas.addEventListener("pointerdown", focusStage);

      const clearSwap = () => window.clearTimeout(idleTimer);

      const scheduleSwap = () => {
        clearSwap();
        if (reduceRef.current || dragging || !roots[0] || !roots[1]) return;
        idleTimer = window.setTimeout(() => {
          if (disposed || dragging) return;
          const next = active === 0 ? 1 : 0;
          if (!roots[next]) return;
          void show(next).then(scheduleSwap);
        }, IDLE_SWAP_MS);
      };

      controls.addEventListener("start", () => {
        dragging = true;
        controls.autoRotate = false;
        clearSwap();
      });
      controls.addEventListener("end", () => {
        dragging = false;
        if (!reduceRef.current) controls.autoRotate = true;
        scheduleSwap();
      });

      let visible = true;
      const loop = () => {
        if (disposed || !renderer || !orbit) return;
        if (reduceRef.current) orbit.autoRotate = false;
        if (!visible || !roots[active]) return;
        orbit.update();
        renderer.render(scene, camera);
      };
      renderer.setAnimationLoop(loop);

      intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          renderer?.setAnimationLoop(visible ? loop : null);
        },
        { threshold: 0.08 }
      );
      intersectionObserver.observe(stage);

      const loader = new GLTFLoader();
      loader.setMeshoptDecoder(MeshoptDecoder);
      const loadBuffer = async (url: string) => {
        const response = await fetch(url, { cache: "force-cache" });
        if (!response.ok) throw new Error(`Hero model failed (${response.status})`);
        return response.arrayBuffer();
      };
      const parse = (buffer: ArrayBuffer) =>
        new Promise<Group>((resolve, reject) => {
          loader.parse(buffer, "", (gltf) => resolve(gltf.scene), reject);
        });

      const show = async (index: number) => {
        const root = roots[index];
        if (!root || !renderer || disposed) return;
        for (const item of roots) {
          if (item?.parent) scene.remove(item);
        }
        scene.add(root);
        fit(root);
        await renderer.compileAsync(root, camera, scene);
        if (disposed) return;
        active = index;
        renderer.render(scene, camera);
      };

      const whenIdle = (work: () => void) => {
        const host = window as Window & {
          requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
          cancelIdleCallback?: (handle: number) => void;
        };
        if (host.requestIdleCallback) {
          idleCallback = host.requestIdleCallback(work, { timeout: 1500 });
          return;
        }
        idleCallback = window.setTimeout(work, 400);
      };

      try {
        const first = await parse(await loadBuffer(MODELS[0]));
        if (disposed || !renderer) {
          disposeObject(first);
          return;
        }
        roots[0] = first;
        await show(0);

        const saveData = (
          navigator as Navigator & { connection?: { saveData?: boolean } }
        ).connection?.saveData;
        if (reduceRef.current || saveData) return;

        const secondBuffer = await loadBuffer(MODELS[1]);
        if (disposed) return;

        const mountSecond = () => {
          if (disposed) return;
          if (dragging) {
            window.setTimeout(mountSecond, 700);
            return;
          }
          whenIdle(() => {
            if (disposed) return;
            if (dragging) {
              window.setTimeout(mountSecond, 700);
              return;
            }
            try {
              loader.parse(
                secondBuffer,
                "",
                (gltf) => {
                  if (disposed || !renderer) {
                    disposeObject(gltf.scene);
                    return;
                  }
                  roots[1] = gltf.scene;
                  void renderer.compileAsync(gltf.scene, camera, scene).then(() => {
                    if (!disposed) scheduleSwap();
                  });
                },
                (error) => {
                  console.error("Hero model failed to load", error);
                }
              );
            } catch (error) {
              console.error("Hero model failed to load", error);
            }
          });
        };
        mountSecond();
      } catch (error) {
        console.error("Hero model failed to load", error);
      }
    };

    void boot();

    return () => {
      disposed = true;
      window.clearTimeout(idleTimer);
      const host = window as Window & { cancelIdleCallback?: (handle: number) => void };
      if (idleCallback) {
        host.cancelIdleCallback?.(idleCallback);
        window.clearTimeout(idleCallback);
      }
      renderer?.setAnimationLoop(null);
      if (focusStage) canvas.removeEventListener("pointerdown", focusStage);
      orbit?.dispose();
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      for (const root of roots) disposeObject(root);
      renderer?.dispose();
      renderer?.forceContextLoss();
    };
  }, []);

  return (
    <div
      className="relative isolate w-full overflow-hidden rounded-[40px] bg-[#f1f5fb] shadow-[0_10px_28px_rgba(1,14,36,0.07)] ring-1 ring-[#000c1f]/6 sm:rounded-[40px] md:rounded-[48px] md:shadow-[0_18px_44px_rgba(1,14,36,0.09)] lg:rounded-[64px]"
    >
      <div
        ref={stageRef}
        tabIndex={0}
        role="img"
        aria-label="Hero stage. Drag to rotate the model, or use the arrow keys."
        className="relative h-[min(58dvh,520px)] min-h-[360px] outline-none focus-visible:ring-2 focus-visible:ring-[#000c1f]/25 sm:h-[460px] md:h-[440px] lg:h-[500px] xl:h-[540px]"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full cursor-grab touch-none overscroll-none active:cursor-grabbing"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-3 pt-3 sm:px-4 sm:pt-4 md:px-5 md:pt-5 lg:px-6 lg:pt-6">
          <div className="pointer-events-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
