"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { submitTextTo3D, submitImageTo3D, generatePreviewImage, fetchHistory, fetchStatus, fetchQueueInfo, BackendJob, Job, QueueInfo, getGlbUrl } from "../../lib/api";
import { PromptBox } from "../../components/PromptBox";
import { GenerateNavbar } from "../../components/GenerateNavbar";
import { TopRightControls } from "../../components/TopRightControls";
import { ModelCanvas } from "../../components/ModelCanvas";
import { GenerateSidebar } from "../../components/GenerateSidebar";
import { Image as ImageIcon, Sparkles, RotateCcw, CheckCircle2 } from "lucide-react";

type Mode = "text" | "image";

interface GeneratingModel {
  jobId: string;
  prompt?: string;
  imageUrl?: string;
  status: "generating" | "completed" | "failed";
  progress: number;
  glbUrl?: string;
  queueInfo?: QueueInfo;  // Queue position and estimated time
  estimatedTotalSeconds?: number;  // Total estimated time including wait
  startTime?: number;  // When the job was submitted
}

export default function GeneratePage() {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  
  const [cachedAuthState, setCachedAuthState] = useState<boolean | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("auth_signed_in");
      if (cached === "true" || cached === "false") {
        setCachedAuthState(cached === "true");
      }
    }
  }, []);
  
  const [mode, setMode] = useState<Mode>("text");
  const [prompt, setPrompt] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelGenerationProgress, setModelGenerationProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const previewProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const modelProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const [currentGenerating, setCurrentGenerating] = useState<GeneratingModel | null>(null);
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [isPromptAtBottom, setIsPromptAtBottom] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [variations, setVariations] = useState<Array<{
    id: string;
    imageUrl: string;
    prompt?: string;
    createdAt?: Date;
  }>>([
    // Example variations - remove these in production or load from API
    {
      id: "example-1",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=400&fit=crop",
      prompt: "Cartoon boy with glasses and backpack",
      createdAt: new Date(Date.now() - 86400000),
    },
    {
      id: "example-2",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
      prompt: "3D character design",
      createdAt: new Date(Date.now() - 172800000),
    },
  ]);
  const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);
  
  useEffect(() => {
    return () => {
      if (previewProgressIntervalRef.current) {
        clearInterval(previewProgressIntervalRef.current);
      }
      if (modelProgressIntervalRef.current) {
        clearInterval(modelProgressIntervalRef.current);
      }
    };
  }, []);

  // Poll for current generating job status (like viewer page)
  useEffect(() => {
    if (!currentGenerating || currentGenerating.status !== "generating") return;
    
    let active = true;
    
    const fetchAndSchedule = async () => {
      if (!active) return;
      
      try {
        const status = await fetchStatus(currentGenerating.jobId);
        if (!active) return;
        
        console.log("Polling status:", status.status, "Job ID:", currentGenerating.jobId);
        
        if (status.status === "completed") {
          // Clear progress simulation interval
          if (modelProgressIntervalRef.current) {
            clearInterval(modelProgressIntervalRef.current);
            modelProgressIntervalRef.current = null;
          }
          setModelGenerationProgress(100);
          
          const url = getGlbUrl(status);
          console.log("Model completed! GLB URL:", url);
          console.log("Status result:", status.result);
          
          if (url) {
            setGlbUrl(url);
            setCurrentGenerating(prev => prev ? {
              ...prev,
              status: "completed",
              progress: 100,
              glbUrl: url
            } : null);
            setLoading(false);
          } else {
            console.warn("Model completed but no GLB URL found");
            setCurrentGenerating(prev => prev ? {
              ...prev,
              status: "completed",
              progress: 100
            } : null);
            setLoading(false);
            setError("Model generation completed but GLB file not available. Please check the job status.");
          }
        } else if (status.status === "failed") {
          // Clear progress simulation interval
          if (modelProgressIntervalRef.current) {
            clearInterval(modelProgressIntervalRef.current);
            modelProgressIntervalRef.current = null;
          }
          setError("Model generation failed");
          setCurrentGenerating(prev => prev ? {
            ...prev,
            status: "failed",
            progress: status.progress
          } : null);
          setLoading(false);
        } else if (status.status === "pending" || status.status === "processing") {
          // Update queue info from status response
          if (status.queue) {
            setCurrentGenerating(prev => prev ? {
              ...prev,
              queueInfo: status.queue,
              estimatedTotalSeconds: status.queue?.estimated_total_seconds
            } : null);
            
            // Update progress based on queue info
            if (status.queue.position > 0) {
              // Still waiting in queue
              const waitProgress = Math.min(45, (Date.now() - (currentGenerating.startTime || Date.now())) / (status.queue.estimated_wait_seconds * 1000) * 45);
              setModelGenerationProgress(waitProgress);
            } else if (status.queue.position === 0) {
              // Currently processing - progress between 50-95
              const processingTime = 130; // ~2m 10s for processing
              const elapsed = (Date.now() - (currentGenerating.startTime || Date.now())) / 1000 - (status.queue.estimated_wait_seconds || 0);
              const processingProgress = Math.min(95, 50 + (elapsed / processingTime) * 45);
              setModelGenerationProgress(Math.max(50, processingProgress));
            }
          } else if (status.progress !== undefined) {
            // Fallback to status progress if no queue info
            setModelGenerationProgress(status.progress);
          }
          // Schedule next poll
          setTimeout(fetchAndSchedule, 5000);
        }
      } catch (err: any) {
        if (!active) return;
        console.error("Failed to poll status:", err);
        setError(err.message || "Failed to fetch status");
        // Continue polling even on error (with longer delay)
        setTimeout(fetchAndSchedule, 10000);
      }
    };

    // Start polling
    fetchAndSchedule();
    
    return () => {
      active = false;
    };
  }, [currentGenerating, getToken]);

  useEffect(() => {
    if (isLoaded && isSignedIn !== undefined) {
      const authState = !!isSignedIn;
      setCachedAuthState(authState);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("auth_signed_in", String(authState));
      }
    }
  }, [isLoaded, isSignedIn]);

  const userIsSignedIn = isLoaded ? isSignedIn : (isMounted ? cachedAuthState : null);

  // Handle file upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setMode("image");
      setError(null);
      
      // Add uploaded image to variations
      const reader2 = new FileReader();
      reader2.onloadend = () => {
        const newVariation = {
          id: `upload-${Date.now()}`,
          imageUrl: reader2.result as string,
          prompt: "Image Upload",
          createdAt: new Date(),
        };
        setVariations(prev => [newVariation, ...prev]);
        setSelectedVariationId(newVariation.id);
      };
      reader2.readAsDataURL(file);
    }
  };

  // Generate preview for text-to-3D
  const handleGeneratePreview = async () => {
    if (!prompt.trim()) {
      setError("Please enter a description");
      return;
    }

    setGeneratingPreview(true);
    setError(null);
    setPreviewProgress(0);
    setPreviewImageUrl(null);
    setPreviewId(null);
    
    // Move prompt box to bottom when starting generation
    setIsPromptAtBottom(true);

    if (previewProgressIntervalRef.current) {
      clearInterval(previewProgressIntervalRef.current);
    }

    previewProgressIntervalRef.current = setInterval(() => {
      setPreviewProgress(prev => {
        if (prev >= 95) {
          if (previewProgressIntervalRef.current) {
            clearInterval(previewProgressIntervalRef.current);
          }
          return 95;
        }
        return prev + 2;
      });
    }, 200);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      const result = await generatePreviewImage(prompt.trim(), getToken);
      
      if (previewProgressIntervalRef.current) {
        clearInterval(previewProgressIntervalRef.current);
      }
      
      setPreviewProgress(100);
      setPreviewImageUrl(result.image_url);
      setPreviewId(result.preview_id);
      setGeneratingPreview(false);
      
      // Add to variations
      const newVariation = {
        id: result.preview_id || `preview-${Date.now()}`,
        imageUrl: result.image_url,
        prompt: prompt.trim(),
        createdAt: new Date(),
      };
      setVariations(prev => [newVariation, ...prev]);
      setSelectedVariationId(newVariation.id);
    } catch (err: any) {
      if (previewProgressIntervalRef.current) {
        clearInterval(previewProgressIntervalRef.current);
      }
      setError(err.message || "Failed to generate preview");
      setGeneratingPreview(false);
      setPreviewProgress(0);
    }
  };

  // Regenerate preview with same prompt
  const handleRegeneratePreview = async () => {
    await handleGeneratePreview();
  };

  // Generate 3D model from preview image (for text-to-3D flow)
  const handleGenerate3D = async () => {
    if (!previewImageUrl) {
      setError("No preview image available");
      return;
    }

    setLoading(true);
    setModelGenerationProgress(0);
    setError(null);
    setGlbUrl(null);

    // Fetch queue info to get accurate time estimate
    let estimatedTotalSeconds = 130; // Default: ~2m 10s
    let queueInfo: QueueInfo | null = null;
    try {
      queueInfo = await fetchQueueInfo();
      if (queueInfo) {
        estimatedTotalSeconds = queueInfo.estimated_total_seconds;
      }
    } catch {
      // Use default if queue info fetch fails
    }

    const startTime = Date.now();
    const modelDuration = estimatedTotalSeconds * 1000; // Convert to ms
    const updateInterval = 500; // Update every 500ms
    const progressStep = (99 / modelDuration) * updateInterval;

    // Clear any existing interval
    if (modelProgressIntervalRef.current) {
      clearInterval(modelProgressIntervalRef.current);
    }

    // Start progress simulation based on estimated time
    modelProgressIntervalRef.current = setInterval(() => {
      setModelGenerationProgress(prev => {
        if (prev >= 99) {
          // Stop at 99% - wait for actual completion
          if (modelProgressIntervalRef.current) {
            clearInterval(modelProgressIntervalRef.current);
            modelProgressIntervalRef.current = null;
          }
          return 99;
        }
        return Math.min(prev + progressStep, 99);
      });
    }, updateInterval);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      // Use submitImageTo3D with the preview image URL
      const result = await submitImageTo3D(previewImageUrl, null, getToken);
      
      setCurrentGenerating({
        jobId: result.job_id,
        prompt: prompt,
        imageUrl: previewImageUrl,
        status: "generating",
        progress: 0,
        queueInfo: queueInfo || undefined,
        estimatedTotalSeconds: estimatedTotalSeconds,
        startTime: startTime
      });

      // Clear preview when 3D generation starts so ModelCanvas shows loading state
      setPreviewImageUrl(null);
      setPreviewId(null);
      
      // Polling is now handled by useEffect hook above
    } catch (err: any) {
      if (modelProgressIntervalRef.current) {
        clearInterval(modelProgressIntervalRef.current);
        modelProgressIntervalRef.current = null;
      }
      setError(err.message || "Failed to generate 3D model");
      setLoading(false);
      setModelGenerationProgress(0);
    }
    // Don't set loading to false here - keep it true while job is generating
    // Loading will be set to false when polling detects completion or failure
  };

  // Create 3D model from image (for image-to-3D flow)
  const handleCreate3DModel = async () => {
    if (mode === "image" && !uploadedFile) {
      setError("Please upload an image");
      return;
    }

    // Move prompt box to bottom
    setIsPromptAtBottom(true);
    
    setLoading(true);
    setError(null);
    setModelGenerationProgress(0);
    setGlbUrl(null);

    // Fetch queue info to get accurate time estimate
    let estimatedTotalSeconds = 130; // Default: ~2m 10s
    let queueInfo: QueueInfo | null = null;
    try {
      queueInfo = await fetchQueueInfo();
      if (queueInfo) {
        estimatedTotalSeconds = queueInfo.estimated_total_seconds;
      }
    } catch {
      // Use default if queue info fetch fails
    }

    const startTime = Date.now();
    const modelDuration = estimatedTotalSeconds * 1000; // Convert to ms
    const updateInterval = 500; // Update every 500ms
    const progressStep = (99 / modelDuration) * updateInterval;

    // Clear any existing interval
    if (modelProgressIntervalRef.current) {
      clearInterval(modelProgressIntervalRef.current);
    }

    // Start progress simulation based on estimated time
    modelProgressIntervalRef.current = setInterval(() => {
      setModelGenerationProgress(prev => {
        if (prev >= 99) {
          // Stop at 99% - wait for actual completion
          if (modelProgressIntervalRef.current) {
            clearInterval(modelProgressIntervalRef.current);
            modelProgressIntervalRef.current = null;
          }
          return 99;
        }
        return Math.min(prev + progressStep, 99);
      });
    }, updateInterval);

    try {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");

      if (mode === "image" && uploadedFile) {
        const result = await submitImageTo3D(null, uploadedFile, getToken);
        
        setCurrentGenerating({
          jobId: result.job_id,
          imageUrl: imagePreview || undefined,
          status: "generating",
          progress: 0,
          queueInfo: queueInfo || undefined,
          estimatedTotalSeconds: estimatedTotalSeconds,
          startTime: startTime
        });
        
        // Polling is now handled by useEffect hook above
      } else {
        throw new Error("Invalid mode or missing data");
      }
    } catch (err: any) {
      if (modelProgressIntervalRef.current) {
        clearInterval(modelProgressIntervalRef.current);
        modelProgressIntervalRef.current = null;
      }
      setError(err.message || "Failed to create 3D model");
      setLoading(false);
      setModelGenerationProgress(0);
    }
    // Don't set loading to false here - keep it true while job is generating
  };

  // Reset to start new generation
  const handleReset = () => {
    setPrompt("");
    setUploadedFile(null);
    setImagePreview(null);
    setPreviewImageUrl(null);
    setPreviewId(null);
    setGlbUrl(null);
    setCurrentGenerating(null);
    setError(null);
    setMode("text");
    setGeneratingPreview(false);
    setLoading(false);
    setPreviewProgress(0);
    setModelGenerationProgress(0);
    setIsPromptAtBottom(false);
    if (previewProgressIntervalRef.current) {
      clearInterval(previewProgressIntervalRef.current);
      previewProgressIntervalRef.current = null;
    }
    if (modelProgressIntervalRef.current) {
      clearInterval(modelProgressIntervalRef.current);
      modelProgressIntervalRef.current = null;
    }
  };

  if (!isMounted) {
    return null;
  }

  if (userIsSignedIn === false) {
    return (
      <>
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6">
          <div className="text-center space-y-6 max-w-md">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white flex items-center justify-center">
              <Sparkles className="w-10 h-10 text-black" />
            </div>
            <h1 className="text-3xl font-bold text-white">Sign in to Generate</h1>
            <p className="text-gray-400 text-lg">
              Create amazing 3D models from text or images
            </p>
            <SignInButton mode="modal">
              <button className="px-8 py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-all">
                Sign In to Continue
              </button>
            </SignInButton>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-white relative overflow-hidden">
        {/* Left Sidebar */}
        <GenerateSidebar 
          variations={variations}
          onSelectVariation={(id) => {
            setSelectedVariationId(id);
            const variation = variations.find(v => v.id === id);
            if (variation) {
              setPreviewImageUrl(variation.imageUrl);
              if (variation.prompt) {
                setPrompt(variation.prompt);
              }
            }
          }}
          selectedVariationId={selectedVariationId}
        />

        {/* Top Left: Hydrilla Logo */}
        <div className="absolute top-5 left-[340px] z-50">
          <a href="/" className="flex items-center">
            <span className="text-3xl font-bold text-black" style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
              Hydrilla
            </span>
          </a>
        </div>

        {/* Navigation Components */}
        {(isPromptAtBottom || loading || glbUrl || generatingPreview) && (
          <GenerateNavbar zoom={zoom} onZoomChange={setZoom} />
        )}
        
        {/* Top Right Controls - Always visible */}
        <TopRightControls />

        {/* Main Content Area */}
        <div className="flex flex-col min-h-screen ml-80">
          {/* Canvas Area - Shows when generating, preview ready, or model ready */}
          {(isPromptAtBottom || loading || currentGenerating?.glbUrl || generatingPreview || previewImageUrl || currentGenerating) && (
            <div className="flex-1 relative bg-transparent min-h-[calc(100vh-200px)] flex flex-col pb-[180px]">
              <div className="flex-1 flex items-center justify-center">
                <ModelCanvas 
                  glbUrl={currentGenerating?.glbUrl || null} 
                  isLoading={loading || (currentGenerating?.status === "generating")} 
                  progress={loading || (currentGenerating?.status === "generating") ? modelGenerationProgress : (generatingPreview ? previewProgress : 0)}
                  zoom={zoom}
                  onZoomChange={setZoom}
                  previewImageUrl={previewImageUrl && !loading && !currentGenerating ? previewImageUrl : null}
                  isGeneratingPreview={generatingPreview && !loading && !currentGenerating}
                />
              </div>
              
              {/* Regenerate and Generate 3D buttons - Show when preview is ready and not loading model */}
              {previewImageUrl && !loading && !currentGenerating && !generatingPreview && (
                <div className="flex items-center justify-center gap-4 mt-6 mb-4">
                  <button
                    onClick={handleRegeneratePreview}
                    disabled={generatingPreview}
                    className="px-6 py-3 bg-white/90 backdrop-blur-sm border border-gray-200/50 text-gray-800 rounded-xl font-medium hover:bg-white hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm"
                    style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                  >
                    <RotateCcw size={18} />
                    Regenerate
                  </button>
                  <button
                    onClick={handleGenerate3D}
                    disabled={loading || generatingPreview}
                    className="px-6 py-3 bg-gradient-to-br from-gray-900 to-black text-white rounded-xl font-medium hover:from-gray-800 hover:to-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg"
                    style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                  >
                    <Sparkles size={18} />
                    Generate 3D Model
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Centered Prompt Box - Initially centered */}
          {!isPromptAtBottom && !loading && !currentGenerating && !generatingPreview && (
            <div className="flex flex-col items-center justify-center min-h-screen mx-auto px-4 w-full max-w-[700px]">
              <div className="w-full flex flex-col items-center justify-center" style={{ width: '100%', maxWidth: '700px' }}>
                <PromptBox
                  value={prompt}
                  onChange={(value) => {
                    setPrompt(value);
                    // Clear preview when prompt changes
                    if (previewImageUrl) {
                      setPreviewImageUrl(null);
                      setPreviewId(null);
                    }
                  }}
                  onImageUpload={(file) => {
                    if (!file || file.size === 0) {
                      // Image removal
                      setUploadedFile(null);
                      setImagePreview(null);
                      setMode("text");
                    } else {
                      setUploadedFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setImagePreview(reader.result as string);
                      };
                      reader.readAsDataURL(file);
                      setMode("image");
                      setError(null);
                    }
                  }}
                  onSubmit={() => {
                    if (mode === "text") {
                      // For text mode, always generate preview first
                      handleGeneratePreview();
                    } else if (mode === "image") {
                      // For image mode, generate 3D model directly
                      handleCreate3DModel();
                    }
                  }}
                  imagePreview={previewImageUrl || imagePreview}
                  mode={mode === "image" ? (imagePreview ? "reference" : "image") : "text"}
                  disabled={generatingPreview || loading}
                  isAtBottom={false}
                />

                {/* Error Message */}
                {error && (
                  <div className="mt-6 w-full max-w-[700px] p-4 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prompt Box at Bottom - When generating or model ready */}
          {(isPromptAtBottom || loading || currentGenerating || generatingPreview || previewImageUrl) && (
            <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-[700px] mx-auto" style={{ width: '100%', maxWidth: '700px' }}>
              <PromptBox
                value={prompt}
                onChange={(value) => {
                  setPrompt(value);
                  // Clear preview when prompt changes
                  if (previewImageUrl) {
                    setPreviewImageUrl(null);
                    setPreviewId(null);
                  }
                }}
                onImageUpload={(file) => {
                  if (!file || file.size === 0) {
                    // Image removal
                    setUploadedFile(null);
                    setImagePreview(null);
                    setMode("text");
                  } else {
                    setUploadedFile(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setImagePreview(reader.result as string);
                    };
                    reader.readAsDataURL(file);
                    setMode("image");
                    setError(null);
                  }
                }}
                onSubmit={() => {
                  if (mode === "text" && !previewImageUrl) {
                    handleGeneratePreview();
                  } else if (mode === "image" || previewImageUrl) {
                    handleCreate3DModel();
                  }
                }}
                imagePreview={previewImageUrl || imagePreview}
                mode={mode === "image" ? (imagePreview ? "reference" : "image") : "text"}
                disabled={generatingPreview || loading}
                isAtBottom={true}
              />
              {/* Error Message */}
              {error && (
                <div className="mt-4 w-full max-w-[700px] p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
