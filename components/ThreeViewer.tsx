"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

type Props = { glbUrl: string };

export function ThreeViewer({ glbUrl }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);

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
    setLoadProgress(0);

    const scene = new THREE.Scene();
    // Light gray background for premium look
    scene.background = new THREE.Color("#fafafa");
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
    controls.update();
    controlsRef.current = controls;

    // Enhanced lighting for dark theme
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    // Key light (main light source)
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.0);
    keyLight.position.set(5, 10, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    scene.add(keyLight);

    // Fill light (softer, from opposite side)
    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);

    // Rim light (back light for depth)
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.2);
    rimLight.position.set(0, 3, -8);
    scene.add(rimLight);

    // Hemisphere light for ambient fill
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x000000, 0.5);
    hemisphereLight.position.set(0, 20, 0);
    scene.add(hemisphereLight);

    // Grid helper with light gray colors
    const gridHelper = new THREE.GridHelper(10, 20, 0xd4d4d4, 0xe5e5e5);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);

    // Load GLB model
    const loader = new GLTFLoader();
    
    // Start showing progress immediately
    setLoadProgress(1);

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

          // Enable shadows and enhance materials
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              // Enhance material for better appearance
              if (child.material) {
                if (Array.isArray(child.material)) {
                  child.material.forEach(mat => {
                    if (mat instanceof THREE.MeshStandardMaterial) {
                      mat.envMapIntensity = 0.8;
                    }
                  });
                } else if (child.material instanceof THREE.MeshStandardMaterial) {
                  child.material.envMapIntensity = 0.8;
                }
              }
            }
          });

          scene.add(model);
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
          setError(`Failed to process model: ${err.message}`);
          setLoading(false);
        }
      },
      (progress) => {
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
        let errorMessage = "Unknown error";

        if (err instanceof Error) {
          errorMessage = err.message;
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
    <div className="relative h-full min-h-[400px]">
      <div ref={containerRef} className="h-full w-full" />
      
      {/* Controls hint */}
      <div className="absolute bottom-4 left-4 text-xs text-neutral-500 bg-white/80 px-3 py-1.5 rounded-lg">
        Drag to rotate • Scroll to zoom
      </div>
      
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white">
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
