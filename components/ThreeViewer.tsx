"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
// Removed getProxiedGlbUrl - using direct URLs from S3

type Props = { glbUrl: string };

export function ThreeViewer({ glbUrl }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    setLoading(true);
    setError(null);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#f8fafc");
    sceneRef.current = scene;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 500;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(2, 2, 3);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 0.5;
    controls.maxDistance = 10;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight1.position.set(5, 10, 5);
    directionalLight1.castShadow = true;
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight2.position.set(-5, 5, -5);
    scene.add(directionalLight2);

    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemisphereLight.position.set(0, 20, 0);
    scene.add(hemisphereLight);

    // Grid helper
    const gridHelper = new THREE.GridHelper(10, 20, 0xcccccc, 0xeeeeee);
    scene.add(gridHelper);

    // Axes helper (optional, for debugging)
    // const axesHelper = new THREE.AxesHelper(2);
    // scene.add(axesHelper);

    // Load GLB model
    // URL may be proxied through backend to avoid CORS issues
    const loader = new GLTFLoader();
    let modelLoaded = false;

    console.log("Loading GLB from:", glbUrl);

    // Configure loader with better error handling
    loader.setRequestHeader({});
    
    loader.load(
      glbUrl,
      (gltf) => {
        try {
          const model = gltf.scene;

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

          // Enable shadows if available
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });

          scene.add(model);
          modelLoaded = true;
          setLoading(false);

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
          console.error("Error processing GLB:", err);
          setError(`Failed to process model: ${err.message}`);
          setLoading(false);
        }
      },
      (progress) => {
        // Loading progress
        if (progress.total > 0) {
          const percent = (progress.loaded / progress.total) * 100;
          console.log(`Loading: ${percent.toFixed(1)}%`);
        }
      },
      (err) => {
        console.error("Failed to load GLB:", err);
        let errorMessage = "Unknown error";
        
        if (err instanceof Error) {
          errorMessage = err.message;
          // Check for CORS or network errors
          if (err.message.includes("CORS") || err.message.includes("Failed to fetch")) {
            errorMessage = "CORS error: Unable to load model. The file may be blocked by browser security.";
          }
        } else if (err instanceof ProgressEvent) {
          errorMessage = "Network error: Failed to download model file";
        }
        
        setError(`Failed to load model: ${errorMessage}`);
        setLoading(false);
      }
    );

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

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !camera) return;
      const { clientWidth, clientHeight } = containerRef.current;
      if (clientWidth === 0 || clientHeight === 0) return;

      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      rendererRef.current.setSize(clientWidth, clientHeight);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
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
    };
  }, [glbUrl]);

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[500px] w-full rounded-lg border bg-white shadow-sm" />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-center">
            <div className="mb-2 text-sm font-medium text-slate-700">Loading 3D model...</div>
            <div className="h-1 w-32 animate-pulse rounded bg-blue-200"></div>
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="rounded bg-red-50 p-4 text-center">
            <div className="text-sm font-medium text-red-700">Error loading model</div>
            <div className="mt-1 text-xs text-red-600">{error}</div>
            <div className="mt-2 text-xs text-slate-500">Check browser console for details</div>
          </div>
        </div>
      )}
    </div>
  );
}

