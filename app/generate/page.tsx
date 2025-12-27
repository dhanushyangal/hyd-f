"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { submitTextTo3D, submitImageTo3D, generatePreviewImage, fetchHistory, fetchStatus, fetchQueueInfo, BackendJob, Job, QueueInfo, getGlbUrl } from "../../lib/api";
import { ThreeViewer } from "../../components/ThreeViewer";

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
  
  // Cache auth state to prevent flashing (initialize as null for SSR)
  const [cachedAuthState, setCachedAuthState] = useState<boolean | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Load cached auth state only on client after mount
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
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Text-to-3D preview states
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [estimatedPreviewSeconds, setEstimatedPreviewSeconds] = useState(20); // Default 20s
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelGenerationProgress, setModelGenerationProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Refs for progress intervals
  const previewProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const modelProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup intervals on unmount
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
  
  // History states
  const [history, setHistory] = useState<BackendJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [currentGenerating, setCurrentGenerating] = useState<GeneratingModel | null>(null);
  
  // Mobile history popup
  const [showHistoryPopup, setShowHistoryPopup] = useState(false);

  // Update cached auth state when Clerk loads
  useEffect(() => {
    if (isLoaded && isSignedIn !== undefined) {
      const authState = !!isSignedIn;
      setCachedAuthState(authState);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("auth_signed_in", String(authState));
      }
    }
  }, [isLoaded, isSignedIn]);

  // Use cached state if Clerk is still loading and we have a cached value, otherwise use actual state
  // Only use cached state after component has mounted to avoid hydration mismatch
  const userIsSignedIn = isLoaded ? isSignedIn : (isMounted ? cachedAuthState : null);

  // Fetch history on mount
  useEffect(() => {
    const loadHistory = async () => {
      if (!userIsSignedIn) return;
      setHistoryLoading(true);
      try {
        const tokenGetter = async () => await getToken();
        const jobs = await fetchHistory(tokenGetter);
        setHistory(jobs);
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
  }, [userIsSignedIn, getToken]);

  // Poll for current generating job
  useEffect(() => {
    if (!currentGenerating || currentGenerating.status !== "generating") return;
    
    const pollStatus = async () => {
      try {
        const status = await fetchStatus(currentGenerating.jobId);
        
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
        }
        
        if (status.status === "completed") {
          // Clear progress simulation interval
          if (modelProgressIntervalRef.current) {
            clearInterval(modelProgressIntervalRef.current);
            modelProgressIntervalRef.current = null;
          }
          setModelGenerationProgress(100);
          
          const glbUrl = getGlbUrl(status);
          setCurrentGenerating(prev => prev ? {
            ...prev,
            status: "completed",
            progress: 100,
            glbUrl: glbUrl || undefined
          } : null);
          // Refresh history
          const tokenGetter = async () => await getToken();
          const jobs = await fetchHistory(tokenGetter);
          setHistory(jobs);
        } else if (status.status === "failed") {
          // Clear progress simulation interval
          if (modelProgressIntervalRef.current) {
            clearInterval(modelProgressIntervalRef.current);
            modelProgressIntervalRef.current = null;
          }
          setCurrentGenerating(prev => prev ? {
            ...prev,
            status: "failed",
            progress: status.progress
          } : null);
        }
      } catch (err) {
        console.error("Failed to poll status:", err);
      }
    };

    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [currentGenerating, getToken]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setUploadedFile(file);
    setImageUrl("");
    setError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Generate preview image for text-to-3D
  const handleGeneratePreview = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setGeneratingPreview(true);
    setPreviewProgress(0);
    setError(null);
    setPreviewImageUrl(null);
    setPreviewId(null);

    // Fetch queue info first to get accurate time estimate
    let estimatedPreviewTime = 20; // Default: ~20s
    try {
      const queueInfo = await fetchQueueInfo();
      if (queueInfo) {
        // Calculate total time: wait time + base preview time
        const waitTime = queueInfo.estimated_wait_for_preview_seconds ?? 0;
        const baseTime = queueInfo.estimated_preview_time_seconds ?? 20;
        estimatedPreviewTime = waitTime + baseTime;
      }
    } catch {
      // Fallback: check history for queue
      const hasQueue = history.some(job => job.status === "WAIT" || job.status === "RUN");
      estimatedPreviewTime = hasQueue ? 40 : 20;
    }
    
    // Store estimated time for UI display
    setEstimatedPreviewSeconds(estimatedPreviewTime);

    const previewDuration = estimatedPreviewTime * 1000; // Convert to ms
    const updateInterval = 100; // Update every 100ms
    const progressStep = (95 / previewDuration) * updateInterval; // Progress to 95%

    // Clear any existing interval
    if (previewProgressIntervalRef.current) {
      clearInterval(previewProgressIntervalRef.current);
    }

    // Start progress simulation
    previewProgressIntervalRef.current = setInterval(() => {
      setPreviewProgress(prev => {
        if (prev >= 95) {
          // Stop at 95% until actual completion
          if (previewProgressIntervalRef.current) {
            clearInterval(previewProgressIntervalRef.current);
          }
          return 95;
        }
        return prev + progressStep;
      });
    }, updateInterval);

    try {
      const tokenGetter = async () => await getToken();
      const result = await generatePreviewImage(prompt.trim(), tokenGetter);
      
      // Update estimated time if queue info is in response (more accurate than pre-fetch)
      if (result.queue) {
        // Use the queue info from the response - it's more accurate since it was calculated
        // right when the preview was added to the queue
        const updatedTime = result.queue.estimated_total_seconds ?? estimatedPreviewTime;
        setEstimatedPreviewSeconds(updatedTime);
        
        // Also update the progress duration if needed
        if (updatedTime !== estimatedPreviewTime) {
          // Recalculate progress step if time changed
          const newDuration = updatedTime * 1000;
          const newProgressStep = (95 / newDuration) * 100;
          // Note: We can't easily update the interval, but the progress will catch up
        }
      }
      
      setPreviewImageUrl(result.image_url);
      setPreviewId(result.preview_id);
      setPreviewProgress(100);
    } catch (err: any) {
      setError(err.message || "Failed to generate preview image");
      setPreviewProgress(0);
    } finally {
      if (previewProgressIntervalRef.current) {
        clearInterval(previewProgressIntervalRef.current);
        previewProgressIntervalRef.current = null;
      }
      setGeneratingPreview(false);
    }
  };

  // Regenerate preview with same prompt
  const handleRegeneratePreview = async () => {
    await handleGeneratePreview();
  };

  // Generate 3D model from preview image
  const handleGenerate3D = async () => {
    if (!previewImageUrl) {
      setError("No preview image available");
      return;
    }

    setLoading(true);
    setModelGenerationProgress(0);
    setError(null);

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
      const tokenGetter = async () => await getToken();
      const result = await submitImageTo3D(previewImageUrl, null, tokenGetter);
      
      setCurrentGenerating({
        jobId: result.job_id,
        prompt: prompt,
        status: "generating",
        progress: 0,
        queueInfo: queueInfo || undefined,
        estimatedTotalSeconds: estimatedTotalSeconds,
        startTime: startTime
      });
      
      // Clear preview after starting 3D generation
      setPreviewImageUrl(null);
      setPreviewId(null);
      setPrompt("");
      // Keep progress simulation running - don't reset it
    } catch (err: any) {
      setError(err.message || "Failed to generate 3D model");
      setModelGenerationProgress(0);
      if (modelProgressIntervalRef.current) {
        clearInterval(modelProgressIntervalRef.current);
        modelProgressIntervalRef.current = null;
      }
    } finally {
      setLoading(false);
      // Don't clear the interval here - let it run for the full duration
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userIsSignedIn) {
      setError("Please sign in to generate 3D models");
      return;
    }

    if (mode === "text") {
      // For text mode, generate preview first
      await handleGeneratePreview();
    } else {
      // For image mode, proceed directly to 3D generation
      setLoading(true);
      setModelGenerationProgress(0);
      setError(null);

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
        let result;
        const tokenGetter = async () => await getToken();

        if (uploadedFile) {
          setUploading(true);
          try {
            result = await submitImageTo3D(null, uploadedFile, tokenGetter);
          } catch (uploadErr: any) {
            setError(uploadErr.message || "Failed to submit image");
            setLoading(false);
            setUploading(false);
            setModelGenerationProgress(0);
            if (modelProgressIntervalRef.current) {
              clearInterval(modelProgressIntervalRef.current);
              modelProgressIntervalRef.current = null;
            }
            return;
          } finally {
            setUploading(false);
          }
        } else if (imageUrl.trim()) {
          result = await submitImageTo3D(imageUrl.trim(), null, tokenGetter);
        } else {
          setError("Please upload an image file or enter an image URL");
          setLoading(false);
          setModelGenerationProgress(0);
          if (modelProgressIntervalRef.current) {
            clearInterval(modelProgressIntervalRef.current);
            modelProgressIntervalRef.current = null;
          }
          return;
        }

        setCurrentGenerating({
          jobId: result.job_id,
          imageUrl: imagePreview || imageUrl,
          status: "generating",
          progress: 0,
          queueInfo: queueInfo || undefined,
          estimatedTotalSeconds: estimatedTotalSeconds,
          startTime: startTime
        });
        
        // Clear form
        setUploadedFile(null);
        setImagePreview(null);
        setImageUrl("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        // Keep progress simulation running - don't reset it
      } catch (err: any) {
        setError(err.message || "Failed to submit job");
        setModelGenerationProgress(0);
        if (modelProgressIntervalRef.current) {
          clearInterval(modelProgressIntervalRef.current);
          modelProgressIntervalRef.current = null;
        }
      } finally {
        setLoading(false);
        // Don't clear the interval here - let it run for the full duration
      }
    }
  };

  // View a model from history
  const viewHistoryModel = (job: BackendJob) => {
    if (job.resultGlbUrl) {
      // Use direct S3 URL (bucket is public with CORS)
      setCurrentGenerating({
        jobId: job.id,
        prompt: job.prompt || undefined,
        status: "completed",
        progress: 100,
        glbUrl: job.resultGlbUrl
      });
      setShowHistoryPopup(false);
    }
  };

  // Get status color for history items
  const getStatusColor = (status: string) => {
    switch (status) {
      case "DONE": return "bg-black";
      case "RUN": case "WAIT": return "bg-neutral-400";
      case "FAIL": return "bg-neutral-300";
      default: return "bg-neutral-300";
    }
  };

  // Show loading state while Clerk is checking auth (only show if no cached state and not mounted yet)
  if (!isLoaded && !isMounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4">
            <div className="w-10 h-10 spinner"></div>
          </div>
          <div className="text-black text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated (only after Clerk has loaded)
  if (isLoaded && userIsSignedIn === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center space-y-8 p-12 max-w-md w-full">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-black flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-3xl font-semibold text-black mb-3">Sign In Required</h2>
            <p className="text-neutral-500">Create an account or sign in to start generating 3D models.</p>
          </div>
          <SignInButton mode="modal">
            <button className="w-full px-8 py-4 text-lg font-medium bg-black text-white rounded-xl hover:bg-neutral-800 transition-colors">
              Sign In to Continue
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Mobile History Popup */}
      {showHistoryPopup && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/10" onClick={() => setShowHistoryPopup(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white border-l border-neutral-200 overflow-y-auto shadow-2xl animate-in">
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-black">My Generations</h2>
              <button 
                onClick={() => setShowHistoryPopup(false)} 
                aria-label="Close history panel"
                className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
              >
                <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 space-y-3">
              {historyLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 spinner"></div>
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-neutral-400">
                  No generations yet
                </div>
              ) : (
                history.slice(0, 10).map((job) => (
                  <div
                    key={job.id}
                    className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 cursor-pointer hover:border-neutral-300 transition-all"
                    onClick={() => viewHistoryModel(job)}
                  >
                    <div className="flex items-center gap-3">
                      {job.previewImageUrl ? (
                        <img src={job.previewImageUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
                      ) : (
                        <div className="w-14 h-14 rounded-lg bg-neutral-200 flex items-center justify-center">
                          <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-black truncate font-medium">{job.prompt || "Image to 3D"}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`w-2 h-2 rounded-full ${getStatusColor(job.status)}`}></span>
                          <span className="text-xs text-neutral-500">{job.status === "DONE" ? "Completed" : job.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Left Panel - Generation Options */}
        <div className="w-full lg:w-[360px] bg-white border-r border-neutral-100 p-6 flex-shrink-0">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-xl font-semibold text-black">New Model</h1>
            <button 
              onClick={() => setShowHistoryPopup(true)}
              aria-label="View generation history"
              className="lg:hidden p-2.5 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors"
            >
              <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>

          {/* Mode Selection Tabs */}
          <div className="flex gap-1 p-1 bg-neutral-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setMode("text");
                setImageUrl("");
                setError(null);
                setPreviewImageUrl(null);
                setPreviewId(null);
                setUploadedFile(null);
                setImagePreview(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all text-sm ${
                mode === "text"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-500 hover:text-black"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Text to 3D
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("image");
                setPrompt("");
                setError(null);
                setPreviewImageUrl(null);
                setPreviewId(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all text-sm ${
                mode === "image"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-500 hover:text-black"
              }`}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Image to 3D
            </button>
          </div>

          {/* Form */}
          <form onSubmit={onSubmit} className="space-y-5">
            {mode === "text" ? (
              <>
                {/* Prompt Input */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Prompt</label>
                  <div className="relative">
                    <textarea
                      className="w-full rounded-xl bg-neutral-50 border border-neutral-200 p-4 text-black placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black/10 transition-all resize-none"
                      rows={3}
                      value={prompt}
                      onChange={(e) => {
                        setPrompt(e.target.value);
                        if (previewImageUrl) {
                          setPreviewImageUrl(null);
                          setPreviewId(null);
                        }
                      }}
                      placeholder="A detailed fantasy sword with glowing runes..."
                      disabled={generatingPreview}
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-neutral-400">
                      {prompt.length}/800
                    </div>
                  </div>
                </div>

                {/* Preview Image Section */}
                {(generatingPreview || previewImageUrl) && (
                  <div className="rounded-xl bg-neutral-50 border border-neutral-200 overflow-hidden">
                    {generatingPreview && !previewImageUrl ? (
                      <div className="aspect-square flex flex-col items-center justify-center p-8">
                        <div className="w-12 h-12 mb-4">
                          <div className="w-12 h-12 spinner"></div>
                        </div>
                        <p className="text-sm text-black font-medium mb-1">Generating preview...</p>
                        <p className="text-lg font-semibold text-black">{Math.round(previewProgress)}%</p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {estimatedPreviewSeconds > 20 
                            ? `~${Math.ceil(estimatedPreviewSeconds)} seconds (queue)` 
                            : `~${Math.ceil(estimatedPreviewSeconds)} seconds`}
                        </p>
                      </div>
                    ) : previewImageUrl ? (
                      <div>
                        <div className="relative">
                          <img 
                            src={previewImageUrl} 
                            alt="Preview" 
                            className={`w-full aspect-square object-cover ${generatingPreview ? 'opacity-30' : ''}`}
                          />
                          {generatingPreview && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="w-10 h-10 spinner"></div>
                            </div>
                          )}
                        </div>
                        <div className="p-3 bg-white border-t border-neutral-100">
                          <button
                            type="button"
                            onClick={handleRegeneratePreview}
                            disabled={generatingPreview}
                            className="w-full px-3 py-2 text-sm bg-neutral-100 text-black rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Regenerate
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-black mb-2">Upload Image</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="image-upload"
                  />
                  
                  {!uploadedFile && !imagePreview ? (
                    <label
                      htmlFor="image-upload"
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-8 cursor-pointer hover:border-neutral-400 transition-all group"
                    >
                      <div className="w-12 h-12 rounded-xl bg-white border border-neutral-200 flex items-center justify-center mb-3 group-hover:border-neutral-400 transition-all">
                        <svg className="w-6 h-6 text-neutral-400 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-neutral-600">Click to upload</span>
                      <span className="text-xs text-neutral-400 mt-1">JPEG, PNG, WebP (max 10MB)</span>
                    </label>
                  ) : (
                    <div className="rounded-xl bg-neutral-50 border border-neutral-200 overflow-hidden">
                      {imagePreview && (
                        <img src={imagePreview} alt="Preview" className="w-full aspect-square object-cover" />
                      )}
                      <div className="p-3 bg-white border-t border-neutral-100 flex items-center justify-between">
                        <span className="text-sm text-neutral-600 truncate">{uploadedFile?.name}</span>
                        <button
                          type="button"
                          onClick={removeUploadedFile}
                          aria-label="Remove uploaded file"
                          className="p-2 text-neutral-400 hover:text-black transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* URL Input */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-200"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 bg-white text-xs text-neutral-400">or enter URL</span>
                  </div>
                </div>

                <input
                  type="url"
                  className="w-full rounded-xl bg-neutral-50 border border-neutral-200 p-4 text-black placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black/10 transition-all"
                  value={imageUrl}
                  onChange={(e) => {
                    setImageUrl(e.target.value);
                    if (e.target.value.trim()) {
                      setUploadedFile(null);
                      setImagePreview(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }
                  }}
                  placeholder="https://example.com/image.jpg"
                />
              </>
            )}

            {/* Error Message */}
            {error && (
              <div className="rounded-xl bg-neutral-100 border border-neutral-200 px-4 py-3 text-sm text-black flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            {/* Generate Button */}
            {mode === "text" ? (
              <>
                {!previewImageUrl ? (
                  <button
                    type="submit"
                    disabled={generatingPreview || !prompt.trim()}
                    className="w-full rounded-xl bg-black text-white px-6 py-4 font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {generatingPreview ? (
                      <>
                        <div className="w-5 h-5 spinner border-white"></div>
                        Generating Preview...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Generate Preview
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerate3D}
                    disabled={loading}
                    className="w-full rounded-xl bg-black text-white px-6 py-4 font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 spinner border-white"></div>
                        {modelGenerationProgress > 0 ? (
                          <>
                            <span>Generating... {Math.round(modelGenerationProgress)}%</span>
                            {currentGenerating?.queueInfo?.jobs_ahead ? (
                              <span className="text-xs opacity-75 ml-2">({currentGenerating.queueInfo.jobs_ahead} in queue)</span>
                            ) : (
                              <span className="text-xs opacity-75 ml-2">(~{Math.ceil((currentGenerating?.estimatedTotalSeconds || 130) / 60)}m)</span>
                            )}
                          </>
                        ) : (
                          "Starting..."
                        )}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Generate 3D Model
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <button
                type="submit"
                disabled={loading || uploading || (!uploadedFile && !imageUrl.trim())}
                className="w-full rounded-xl bg-black text-white px-6 py-4 font-medium hover:bg-neutral-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-5 h-5 spinner border-white"></div>
                    Uploading...
                  </>
                ) : loading ? (
                  <>
                    <div className="w-5 h-5 spinner border-white"></div>
                    {modelGenerationProgress > 0 ? (
                      <>
                        <span>Generating... {Math.round(modelGenerationProgress)}%</span>
                        {currentGenerating?.queueInfo?.jobs_ahead ? (
                          <span className="text-xs opacity-75 ml-2">({currentGenerating.queueInfo.jobs_ahead} in queue)</span>
                        ) : (
                          <span className="text-xs opacity-75 ml-2">(~{Math.ceil((currentGenerating?.estimatedTotalSeconds || 130) / 60)}m)</span>
                        )}
                      </>
                    ) : (
                      "Starting..."
                    )}
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate
                  </>
                )}
              </button>
            )}
          </form>

          {/* Generation Info */}
          <div className="mt-6 flex items-center justify-between text-xs text-neutral-400">
            <span>⏱️ ~1-2 min</span>
            <span>🎯 20 credits</span>
          </div>
        </div>

        {/* Center - 3D Viewer Area */}
        <div className="flex-1 flex flex-col min-h-[50vh] lg:min-h-0 bg-neutral-50">
          {currentGenerating ? (
            <div className="flex-1 flex flex-col">
              {currentGenerating.status === "generating" ? (
                <div className="flex-1 flex items-center justify-center p-8">
                  <div className="w-full max-w-md">
                    <div className="text-center mb-6">
                      {/* Show queue position if waiting */}
                      {currentGenerating.queueInfo && currentGenerating.queueInfo.jobs_ahead > 0 ? (
                        <>
                          <h3 className="text-xl font-semibold text-black mb-2">Waiting in queue...</h3>
                          <p className="text-lg text-neutral-600 mb-1">
                            {currentGenerating.queueInfo.jobs_ahead} job{currentGenerating.queueInfo.jobs_ahead > 1 ? 's' : ''} ahead
                          </p>
                          <p className="text-3xl font-bold text-black mb-1">{Math.round(modelGenerationProgress)}%</p>
                          <p className="text-sm text-neutral-400">
                            Estimated wait: ~{Math.ceil((currentGenerating.queueInfo.estimated_wait_seconds || 0) / 60)}m
                            {' + '}~{Math.ceil(130 / 60)}m for generation
                          </p>
                        </>
                      ) : (
                        <>
                          <h3 className="text-xl font-semibold text-black mb-2">Generating your 3D model...</h3>
                          <p className="text-3xl font-bold text-black mb-1">{Math.round(modelGenerationProgress)}%</p>
                          <p className="text-sm text-neutral-400">
                            Estimated time: ~{Math.ceil((currentGenerating.estimatedTotalSeconds || 130) / 60)}m {Math.round((currentGenerating.estimatedTotalSeconds || 130) % 60)}s
                          </p>
                        </>
                      )}
                    </div>
                    
                    {/* Linear Progress Bar */}
                    <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden mb-4">
                      <div 
                        className="h-full bg-black rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${modelGenerationProgress}%` }}
                      ></div>
                    </div>
                    
                    {/* Progress Steps */}
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span className={currentGenerating.queueInfo && currentGenerating.queueInfo.jobs_ahead > 0 ? "text-black font-medium" : ""}>
                        {currentGenerating.queueInfo && currentGenerating.queueInfo.jobs_ahead > 0 ? "⏳ Queued" : "✓ Queued"}
                      </span>
                      <span className={modelGenerationProgress >= 50 ? "text-black font-medium" : ""}>
                        {modelGenerationProgress >= 50 ? "⚡ Processing" : "Processing"}
                      </span>
                      <span className={modelGenerationProgress >= 95 ? "text-black font-medium" : ""}>
                        {modelGenerationProgress >= 95 ? "📦 Finalizing" : "Finalizing"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : currentGenerating.status === "completed" && currentGenerating.glbUrl ? (
                <div className="flex-1 flex flex-col">
                  {/* 3D Viewer - Full area */}
                  <div className="flex-1">
                    <ThreeViewer glbUrl={currentGenerating.glbUrl} />
                  </div>
                  {/* Download Button - Below */}
                  <div className="p-4 bg-white border-t border-neutral-100 flex items-center justify-center gap-4">
                    <a
                      href={currentGenerating.glbUrl}
                      download
                      className="px-6 py-3 bg-black text-white font-medium rounded-xl hover:bg-neutral-800 transition-colors flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download GLB
                    </a>
                    <a
                      href={`/viewer?jobId=${currentGenerating.jobId}`}
                      className="px-6 py-3 bg-neutral-100 text-black font-medium rounded-xl hover:bg-neutral-200 transition-colors"
                    >
                      Full View
                    </a>
                  </div>
                </div>
              ) : currentGenerating.status === "failed" ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-neutral-100 flex items-center justify-center">
                      <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <p className="text-black font-medium mb-4">Generation failed</p>
                    <button
                      onClick={() => setCurrentGenerating(null)}
                      className="px-6 py-3 bg-black text-white font-medium rounded-xl hover:bg-neutral-800 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md px-6">
                <div className="flex justify-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-black transform rotate-12"></div>
                  <div className="w-10 h-10 rounded-full bg-neutral-300 -mt-2"></div>
                  <div className="w-10 h-10 bg-neutral-800 transform rotate-45 mt-3"></div>
                </div>
                <h2 className="text-2xl font-semibold text-black mb-3">What will you create?</h2>
                <p className="text-neutral-500">
                  Enter a text prompt or upload an image to generate a 3D model.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - History (Desktop Only) */}
        <div className="hidden lg:flex lg:flex-col w-[280px] bg-white border-l border-neutral-100 flex-shrink-0">
          <div className="p-4 border-b border-neutral-100">
            <input
              type="text"
              placeholder="Search..."
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black/10 transition-all"
            />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {/* Current Generating */}
            {currentGenerating && currentGenerating.status === "generating" && (
              <div className="mb-4 bg-neutral-50 rounded-xl p-3 border border-neutral-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center border border-neutral-200">
                    <div className="w-5 h-5 spinner"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-black truncate font-medium">{currentGenerating.prompt || "Image to 3D"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1 bg-neutral-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-black rounded-full transition-all duration-500"
                          style={{ width: `${currentGenerating.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-neutral-500">{currentGenerating.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* History */}
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 spinner"></div>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-400 text-sm">No generations yet</p>
              </div>
            ) : (
              history.map((job) => (
                <div
                  key={job.id}
                  onClick={() => viewHistoryModel(job)}
                  className={`bg-neutral-50 rounded-xl border border-neutral-100 overflow-hidden cursor-pointer hover:border-neutral-300 transition-all ${job.resultGlbUrl ? '' : 'opacity-50'}`}
                >
                  <div className="flex gap-3 p-3">
                    {job.previewImageUrl ? (
                      <img 
                        src={job.previewImageUrl} 
                        alt="" 
                        className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-neutral-200 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-black truncate font-medium">{job.prompt || "Image to 3D"}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(job.status)}`}></span>
                        <span className="text-xs text-neutral-400">
                          {job.status === "DONE" ? "Done" : job.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
