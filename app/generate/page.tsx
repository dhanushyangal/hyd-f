"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth, SignInButton, UserButton, SignedIn } from "@clerk/nextjs";
import Link from "next/link";
import { submitTextTo3D, submitImageTo3D, generatePreviewImage, registerJobWithPreview, fetchHistory, fetchStatus, fetchQueueInfo, BackendJob, Job, QueueInfo, getGlbUrl, getProxyGlbUrl, updateJobName } from "../../lib/api";
import { ThreeViewer } from "../../components/ThreeViewer";
import { PromptBox } from "../../components/PromptBox";
import { Menu } from "../../components/Menu";
import { HamburgerMenu } from "../../components/HamburgerMenu";

type Mode = "text" | "image";

interface ChatMessage {
  id: string;
  type: "user" | "preview" | "3d" | "status" | "error";
  content?: string;
  imageUrl?: string;
  glbUrl?: string;
  status?: "generating" | "completed" | "failed";
  progress?: number;
  jobId?: string;
  timestamp: number;
  canRegenerate?: boolean;
  canGenerate3D?: boolean;
  estimatedSeconds?: number;
  queueInfo?: QueueInfo;
  jobsAhead?: number;
}

interface GeneratingModel {
  jobId: string;
  prompt?: string;
  imageUrl?: string;
  status: "generating" | "completed" | "failed";
  progress: number;
  glbUrl?: string;
  queueInfo?: QueueInfo;
  estimatedTotalSeconds?: number;
  startTime?: number;
}

export default function GeneratePage() {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  
  // Cache auth state to prevent flashing
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
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Chat messages state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Add message to chat
  const addChatMessage = (message: Omit<ChatMessage, "id" | "timestamp">) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, newMessage]);
    return newMessage.id;
  };

  // Update chat message
  const updateChatMessage = (id: string, updates: Partial<ChatMessage>) => {
    setChatMessages((prev) =>
      prev.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg))
    );
  };
  
  // Text-to-3D preview states
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [estimatedPreviewSeconds, setEstimatedPreviewSeconds] = useState(20);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelGenerationProgress, setModelGenerationProgress] = useState(0);
  
  // Scroll to bottom when new messages arrive or progress updates
  useEffect(() => {
    if (chatEndRef.current) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [chatMessages]);
  
  // Also scroll on progress updates
  useEffect(() => {
    if (chatEndRef.current && (generatingPreview || loading)) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [previewProgress, modelGenerationProgress, generatingPreview, loading]);
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
  
  // Menu state
  const [showMenu, setShowMenu] = useState(false);
  
  // Sidebar state (for desktop)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Search state for library
  const [searchQuery, setSearchQuery] = useState("");

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

  const userIsSignedIn = isLoaded ? isSignedIn : (isMounted ? cachedAuthState : null);

  // Fetch history on mount and restore generating jobs
  useEffect(() => {
    const loadHistory = async () => {
      if (!userIsSignedIn) return;
      setHistoryLoading(true);
      try {
        const tokenGetter = async () => await getToken();
        const jobs = await fetchHistory(tokenGetter);
        setHistory(jobs);
        
        // Check if there's a generating job that should be restored
        const generatingJob = jobs.find(job => job.status === "WAIT" || job.status === "RUN");
        if (generatingJob) {
          // Only restore if we don't already have this job as currentGenerating
          const shouldRestore = !currentGenerating || currentGenerating.jobId !== generatingJob.id;
          if (shouldRestore) {
          // Restore generating state with correct start time
          const createdAt = generatingJob.createdAt ? new Date(generatingJob.createdAt).getTime() : Date.now();
          
          // Fetch current status to get queue info
          try {
            const status = await fetchStatus(generatingJob.id);
            const estimatedTotalSeconds = status.queue?.estimated_total_seconds || 130;
            
            // Calculate initial progress based on elapsed time
            let initialProgress = 0;
            if (status.created_at) {
              const now = Date.now();
              const elapsed = now - status.created_at;
              const elapsedSeconds = elapsed / 1000;
              
              if (status.queue) {
                if (status.queue.position > 0) {
                  const waitProgress = Math.min(45, (elapsedSeconds / status.queue.estimated_wait_seconds) * 45);
                  initialProgress = waitProgress;
                } else {
                  const processingElapsed = Math.max(0, elapsedSeconds - (status.queue.estimated_wait_seconds || 0));
                  const processingProgress = 50 + (processingElapsed / (estimatedTotalSeconds - (status.queue.estimated_wait_seconds || 0))) * 45;
                  initialProgress = Math.min(95, processingProgress);
                }
              } else {
                initialProgress = Math.min(95, (elapsedSeconds / estimatedTotalSeconds) * 100);
              }
            }
            
            setModelGenerationProgress(Math.max(0, Math.min(95, initialProgress)));
            
            setCurrentGenerating({
              jobId: generatingJob.id,
              prompt: generatingJob.prompt || undefined,
              imageUrl: generatingJob.previewImageUrl || undefined,
              status: "generating",
              progress: initialProgress,
              queueInfo: status.queue,
              estimatedTotalSeconds: estimatedTotalSeconds,
              startTime: status.created_at || createdAt,
            });
          } catch (err) {
            console.error("Failed to fetch status for restoring job:", err);
          }
          }
        }
      } catch (err) {
        console.error("Failed to load history:", err);
      } finally {
        setHistoryLoading(false);
      }
    };
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIsSignedIn, getToken]);

  // Poll for current generating job
  useEffect(() => {
    if (!currentGenerating || currentGenerating.status !== "generating") return;
    
    const pollStatus = async () => {
      try {
        const status = await fetchStatus(currentGenerating.jobId);
        
        if (status.queue) {
          const estimatedTotalSeconds = status.queue.estimated_total_seconds || currentGenerating.estimatedTotalSeconds || 130;
          
          setCurrentGenerating(prev => prev ? {
            ...prev,
            queueInfo: status.queue,
            estimatedTotalSeconds: estimatedTotalSeconds
          } : null);
          
          // Use actual created_at from status if available, otherwise use stored startTime
          const startTime = status.created_at || currentGenerating.startTime || Date.now();
          const now = Date.now();
          const elapsed = now - startTime;
          const elapsedSeconds = elapsed / 1000;
          
          if (status.queue.position > 0) {
            // Still waiting in queue
            const waitProgress = Math.min(45, (elapsedSeconds / status.queue.estimated_wait_seconds) * 45);
            setModelGenerationProgress(waitProgress);
          } else if (status.queue.position === 0) {
            // Processing - calculate progress based on elapsed time minus wait time
            const waitTime = status.queue.estimated_wait_seconds || 0;
            const processingElapsed = Math.max(0, elapsedSeconds - waitTime);
            const processingDuration = estimatedTotalSeconds - waitTime;
            const processingProgress = 50 + (processingElapsed / processingDuration) * 45;
            setModelGenerationProgress(Math.max(50, Math.min(95, processingProgress)));
          }
        } else if (status.created_at) {
          // No queue info, but we have created_at - estimate based on elapsed time
          const estimatedTotalSeconds = currentGenerating.estimatedTotalSeconds || 130;
          const now = Date.now();
          const elapsed = now - status.created_at;
          const elapsedSeconds = elapsed / 1000;
          const progress = Math.min(95, (elapsedSeconds / estimatedTotalSeconds) * 100);
          setModelGenerationProgress(Math.max(0, progress));
        }
        
        if (status.status === "completed") {
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
          
          // Remove status message and add 3D model message to chat
          setChatMessages((prev) => {
            // Remove any status messages for this job
            const filtered = prev.filter((msg) => 
              !(msg.type === "status" && msg.status === "generating")
            );
            // Add 3D model message
            if (glbUrl) {
              filtered.push({
                id: `3d-${currentGenerating.jobId}-${Date.now()}`,
                type: "3d",
                glbUrl: glbUrl,
              status: "completed",
                jobId: currentGenerating.jobId,
                timestamp: Date.now(),
              });
            }
            return filtered;
          });
          
            setLoading(false);
          setUploading(false);
          
          // Clear progress interval
          if (modelProgressIntervalRef.current) {
            clearInterval(modelProgressIntervalRef.current);
            modelProgressIntervalRef.current = null;
          }
          
          const tokenGetter = async () => await getToken();
          const jobs = await fetchHistory(tokenGetter);
          setHistory(jobs);
        } else if (status.status === "failed") {
          if (modelProgressIntervalRef.current) {
            clearInterval(modelProgressIntervalRef.current);
            modelProgressIntervalRef.current = null;
          }
          setCurrentGenerating(prev => prev ? {
            ...prev,
            status: "failed",
            progress: status.progress
          } : null);
          setLoading(false);
          setUploading(false);
        }
      } catch (err) {
        console.error("Failed to poll status:", err);
      }
    };

    const interval = setInterval(pollStatus, 3000);
    return () => clearInterval(interval);
  }, [currentGenerating, getToken]);

  // Handle image upload from PromptBox - Store locally, don't show in chat yet
  const handleImageUpload = (file: File) => {
    if (!file || file.size === 0) {
      setUploadedFile(null);
      setImagePreview(null);
      setImageUrl("");
      setMode("text");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    if (!file.type.startsWith("image/")) {
      addChatMessage({
        type: "error",
        content: "Please select an image file",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      addChatMessage({
        type: "error",
        content: "File size must be less than 10MB",
      });
      return;
    }

    setUploadedFile(file);
    setImageUrl("");
    setMode("image");
    // Clear text when image is uploaded
    setPrompt("");

    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      setImagePreview(preview);
      // Don't add to chat yet - wait for Create button click
    };
    reader.readAsDataURL(file);
  };
  
  // Handle prompt box submit - Auto-generate preview for text
  const handlePromptSubmit = async () => {
    if (!userIsSignedIn) {
      addChatMessage({
        type: "error",
        content: "Please sign in to generate 3D models",
      });
      return;
    }

    if (mode === "text" && prompt.trim()) {
      // Add user message to chat
      addChatMessage({
        type: "user",
        content: prompt,
      });
      
      // Clear prompt text immediately
      setPrompt("");
      
      // Auto-generate preview
      await handleGeneratePreview();
    } else if (mode === "image" && imagePreview) {
      // Store image preview and file before clearing
      const previewToAdd = imagePreview;
      const fileToUse = uploadedFile;
      
      // Clear image from PromptBox immediately so it disappears
      setUploadedFile(null);
      setImagePreview(null);
      setImageUrl("");
      setMode("text");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Add image to chat, then proceed to 3D generation
      addChatMessage({
        type: "preview",
        imageUrl: previewToAdd,
        canGenerate3D: false, // Don't show generate button since we're auto-generating
      });
      
      // Proceed directly to 3D generation (use stored file and preview)
      await handleImageTo3D(previewToAdd, fileToUse);
    }
  };
  
  // Handle image to 3D generation with optional stored preview
  const handleImageTo3D = async (storedPreview?: string, storedFile?: File | null) => {
    const fileToUse = storedFile !== undefined ? storedFile : uploadedFile;
    const previewToUse = storedPreview || imagePreview;
    
    if (!fileToUse && !imageUrl.trim()) return;
    
    setLoading(true);
    setModelGenerationProgress(0);
    
    let estimatedTotalSeconds = 130;
    let queueInfo: QueueInfo | null = null;
    try {
      queueInfo = await fetchQueueInfo();
      if (queueInfo) {
        estimatedTotalSeconds = queueInfo.estimated_total_seconds;
      }
    } catch {}
    
    // Add status message with time estimate
    const statusId = addChatMessage({
      type: "status",
      content: "Generating 3D model...",
      status: "generating",
      progress: 0,
      estimatedSeconds: estimatedTotalSeconds,
      queueInfo: queueInfo || undefined,
      jobsAhead: queueInfo?.jobs_ahead || 0,
    });

    const startTime = Date.now();
    const modelDuration = estimatedTotalSeconds * 1000;
    const updateInterval = 500;
    const progressStep = (99 / modelDuration) * updateInterval;

    if (modelProgressIntervalRef.current) {
      clearInterval(modelProgressIntervalRef.current);
    }

    modelProgressIntervalRef.current = setInterval(() => {
      setModelGenerationProgress((prev) => {
        const newProgress = Math.min(prev + progressStep, 99);
        // Update queue info from currentGenerating if available
        const currentQueueInfo = currentGenerating?.queueInfo || queueInfo;
        const currentJobsAhead = currentQueueInfo?.jobs_ahead || queueInfo?.jobs_ahead || 0;
        const currentEstimated = currentGenerating?.estimatedTotalSeconds || estimatedTotalSeconds;
        
        updateChatMessage(statusId, { 
          progress: newProgress,
          estimatedSeconds: currentEstimated,
          queueInfo: currentQueueInfo || undefined,
          jobsAhead: currentJobsAhead,
        });
        return newProgress;
      });
    }, updateInterval);

    try {
      let result;
      const tokenGetter = async () => await getToken();

      if (fileToUse) {
        setUploading(true);
        try {
          result = await submitImageTo3D(null, fileToUse, tokenGetter);
        } finally {
          setUploading(false);
        }
      } else if (imageUrl.trim()) {
        result = await submitImageTo3D(imageUrl.trim(), null, tokenGetter);
      } else {
        // Remove status message and show error
        setChatMessages((prev) => prev.filter((msg) => msg.id !== statusId));
        addChatMessage({
          type: "error",
          content: "Please upload an image file",
        });
        setLoading(false);
        return;
      }

      setCurrentGenerating({
        jobId: result.job_id,
        imageUrl: previewToUse || imageUrl,
        status: "generating",
        progress: 0,
        queueInfo: queueInfo || undefined,
        estimatedTotalSeconds: estimatedTotalSeconds,
        startTime: startTime,
      });

      // Clear form
      setUploadedFile(null);
      setImagePreview(null);
      setImageUrl("");
      setPrompt("");
      setMode("text");
    } catch (err: any) {
      // Remove status message and show error
      setChatMessages((prev) => prev.filter((msg) => msg.id !== statusId));
      addChatMessage({
        type: "error",
        content: err.message || "Failed to generate 3D model",
      });
      setModelGenerationProgress(0);
      if (modelProgressIntervalRef.current) {
        clearInterval(modelProgressIntervalRef.current);
        modelProgressIntervalRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  // Generate preview image for text-to-3D
  const handleGeneratePreview = async () => {
    if (!prompt.trim()) {
      addChatMessage({
        type: "error",
        content: "Please enter a prompt",
      });
      return;
    }

    setGeneratingPreview(true);
    setPreviewProgress(0);
    setPreviewImageUrl(null);
    setPreviewId(null);
    
    let estimatedPreviewTime = 20;
    let queueInfo: QueueInfo | null = null;
    try {
      queueInfo = await fetchQueueInfo();
      if (queueInfo) {
        // For preview, estimate: wait time + ~20s for generation
        const waitTime = queueInfo.estimated_wait_seconds ?? 0;
        const baseTime = 20; // Base preview generation time
        estimatedPreviewTime = waitTime + baseTime;
      }
    } catch {
      const hasQueue = history.some(job => job.status === "WAIT" || job.status === "RUN");
      estimatedPreviewTime = hasQueue ? 40 : 20;
    }
    
    setEstimatedPreviewSeconds(estimatedPreviewTime);
    
    // Add status message with time estimate
    const statusId = addChatMessage({
      type: "status",
      content: "Generating preview image...",
      status: "generating",
      progress: 0,
      estimatedSeconds: estimatedPreviewTime,
      queueInfo: queueInfo || undefined,
      jobsAhead: queueInfo?.jobs_ahead || 0,
    });

    const previewDuration = estimatedPreviewTime * 1000;
    const updateInterval = 100;
    const progressStep = (95 / previewDuration) * updateInterval;

    if (previewProgressIntervalRef.current) {
      clearInterval(previewProgressIntervalRef.current);
    }

    previewProgressIntervalRef.current = setInterval(() => {
      setPreviewProgress(prev => {
        const newProgress = prev >= 95 ? 95 : prev + progressStep;
        updateChatMessage(statusId, { 
          progress: newProgress,
          estimatedSeconds: estimatedPreviewTime,
          queueInfo: queueInfo || undefined,
          jobsAhead: queueInfo?.jobs_ahead || 0,
        });
        if (newProgress >= 95 && previewProgressIntervalRef.current) {
            clearInterval(previewProgressIntervalRef.current);
          }
        return newProgress;
      });
    }, updateInterval);

    try {
      const tokenGetter = async () => await getToken();
      const result = await generatePreviewImage(prompt.trim(), tokenGetter);
      
      let finalEstimatedTime = estimatedPreviewTime;
      if (result.queue) {
        finalEstimatedTime = result.queue.estimated_total_seconds ?? estimatedPreviewTime;
        setEstimatedPreviewSeconds(finalEstimatedTime);
        queueInfo = result.queue;
      }
      
      setPreviewImageUrl(result.image_url);
      setPreviewId(result.preview_id);
      setPreviewProgress(100);
      
      // Register job with preview image
      try {
        await registerJobWithPreview(
          result.preview_id,
          result.image_url,
          prompt.trim(),
          tokenGetter
        );
        
        // Refresh history to show the new job in the library
        const jobs = await fetchHistory(tokenGetter);
        setHistory(jobs);
      } catch (err) {
        console.error("Failed to register preview job:", err);
      }
      
      // Remove status message and add preview message with job ID
      setChatMessages((prev) => prev.filter((msg) => msg.id !== statusId));
      addChatMessage({
        type: "preview",
        imageUrl: result.image_url,
        canRegenerate: true,
        canGenerate3D: true,
        status: "completed",
        jobId: result.preview_id,
      });
    } catch (err: any) {
      // Remove status message and show error
      setChatMessages((prev) => prev.filter((msg) => msg.id !== statusId));
      addChatMessage({
        type: "error",
        content: err.message || "Failed to generate preview image",
      });
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
      addChatMessage({
        type: "error",
        content: "No preview image available",
      });
      return;
    }

    setLoading(true);
    setModelGenerationProgress(0);
    
    // Add status message
    const statusId = addChatMessage({
      type: "status",
      content: "Generating 3D model...",
      status: "generating",
      progress: 0,
    });

    let estimatedTotalSeconds = 130;
    let queueInfo: QueueInfo | null = null;
    try {
      queueInfo = await fetchQueueInfo();
      if (queueInfo) {
        estimatedTotalSeconds = queueInfo.estimated_total_seconds;
      }
    } catch {}

    const startTime = Date.now();
    const modelDuration = estimatedTotalSeconds * 1000;
    const updateInterval = 500;
    const progressStep = (99 / modelDuration) * updateInterval;

    if (modelProgressIntervalRef.current) {
      clearInterval(modelProgressIntervalRef.current);
    }

    modelProgressIntervalRef.current = setInterval(() => {
      setModelGenerationProgress(prev => {
        const newProgress = Math.min(prev + progressStep, 99);
        // Update queue info from currentGenerating if available
        const currentQueueInfo = currentGenerating?.queueInfo || queueInfo;
        const currentJobsAhead = currentQueueInfo?.jobs_ahead || queueInfo?.jobs_ahead || 0;
        const currentEstimated = currentGenerating?.estimatedTotalSeconds || estimatedTotalSeconds;
        
        updateChatMessage(statusId, { 
          progress: newProgress,
          estimatedSeconds: currentEstimated,
          queueInfo: currentQueueInfo || undefined,
          jobsAhead: currentJobsAhead,
        });
        return newProgress;
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

      // Don't clear preview - keep it visible in chat
      // The 3D model will be added as a new message when complete
      setError(null);
    } catch (err: any) {
      updateChatMessage(statusId, {
        type: "error",
        content: err.message || "Failed to generate 3D model",
        status: "failed",
      });
      setModelGenerationProgress(0);
      if (modelProgressIntervalRef.current) {
        clearInterval(modelProgressIntervalRef.current);
        modelProgressIntervalRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  };

  // View a model from history
  const viewHistoryModel = (job: BackendJob) => {
    // Always show preview image if it exists (even if no 3D model yet)
    if (job.previewImageUrl) {
      addChatMessage({
        type: "preview",
        imageUrl: job.previewImageUrl,
        canRegenerate: false,
        canGenerate3D: !job.resultGlbUrl, // Can generate 3D if no 3D model exists yet
        status: "completed",
        jobId: job.id,
      });
    }
    
    // Then add 3D model if it exists
    if (job.resultGlbUrl) {
      addChatMessage({
        type: "3d",
        glbUrl: getProxyGlbUrl(job.id), // Use proxy URL to avoid CORS issues
        status: "completed",
        jobId: job.id,
      });
    }
    
    // If job has neither preview nor 3D, still show it (might be in progress)
    if (!job.previewImageUrl && !job.resultGlbUrl) {
      addChatMessage({
        type: "status",
        content: job.prompt || "Job in progress...",
        status: job.status === "DONE" ? "completed" : "generating",
        jobId: job.id,
      });
    }
    
    setShowMenu(false);
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
  
  // Get status text for history items
  const getStatusText = (job: BackendJob) => {
    // If job has preview but no 3D result and status is DONE, it's a completed preview
    if (job.previewImageUrl && !job.resultGlbUrl && job.status === "DONE") {
      return "Done";
    }
    // If job is generating 3D (has preview and status is WAIT/RUN), show pending
    if (job.previewImageUrl && (job.status === "WAIT" || job.status === "RUN")) {
      return "Pending";
    }
    // Otherwise use standard status mapping
    switch (job.status) {
      case "DONE": return "Done";
      case "WAIT": return "Pending";
      case "RUN": return "Processing";
      case "FAIL": return "Failed";
      default: return job.status;
    }
  };

  // Editing state for library items
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>("");

  // Filter history based on search
  const filteredHistory = history.filter((job) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const nameMatch = (job.name || "").toLowerCase().includes(query);
    const promptMatch = (job.prompt || "").toLowerCase().includes(query);
    return nameMatch || promptMatch;
  });

  // Handle name editing
  const handleStartEdit = (job: BackendJob) => {
    setEditingJobId(job.id);
    setEditingName(job.name || job.prompt || "Untitled");
  };

  const handleSaveName = async (jobId: string) => {
    if (!editingName.trim()) {
      setEditingJobId(null);
      return;
    }

    try {
      const tokenGetter = async () => await getToken();
      await updateJobName(jobId, editingName.trim(), tokenGetter);
      
      // Update local history
      setHistory((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, name: editingName.trim() } : job
        )
      );
      setEditingJobId(null);
      setEditingName("");
    } catch (err: any) {
      console.error("Failed to update job name:", err);
      addChatMessage({
        type: "error",
        content: err.message || "Failed to update name",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingJobId(null);
    setEditingName("");
  };

  // Show loading state while Clerk is checking auth
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

  // Show sign-in prompt if not authenticated
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

  // Render chat message component
  const renderChatMessage = (message: ChatMessage) => {
    switch (message.type) {
      case "user":
  return (
          <div key={message.id} className="flex justify-end mb-4">
            <div className="max-w-[80%] bg-black text-white rounded-2xl rounded-tr-sm px-4 py-3">
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        );
      
      case "preview":
        return (
          <div key={message.id} className="flex justify-start mb-4">
            <div className="max-w-[300px] bg-white rounded-2xl rounded-tl-sm border border-neutral-200 overflow-hidden shadow-sm">
              {message.imageUrl && (
                <img 
                  src={message.imageUrl} 
                  alt="Preview" 
                  className="w-full max-h-[300px] object-contain"
                />
              )}
              <div className="p-3 flex gap-2">
                {message.canRegenerate && (
                  <button
                    onClick={handleRegeneratePreview}
                    disabled={generatingPreview}
                    className="flex-1 px-3 py-2 text-sm bg-neutral-100 text-black rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
                  >
                    Regenerate
                  </button>
                )}
                {message.canGenerate3D && (
                  <button
                    onClick={() => {
                      if (message.imageUrl) {
                        // Use the image from the chat message
                        setPreviewImageUrl(message.imageUrl);
                        setPreviewId(message.jobId || null);
                        handleGenerate3D();
                      } else {
                        handleImageTo3D();
                      }
                    }}
                    disabled={loading || generatingPreview}
                    className="flex-1 px-3 py-2 text-sm bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
                  >
                    Generate 3D
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      
      case "3d":
        return (
          <div key={message.id} className="flex justify-start mb-4">
            <div className="max-w-[80%] w-full bg-white rounded-2xl rounded-tl-sm border border-neutral-200 overflow-hidden shadow-sm">
              {message.glbUrl && (
                <div className="w-full h-[400px]">
                  <ThreeViewer glbUrl={message.glbUrl} />
                </div>
              )}
              {message.glbUrl && (
                <div className="p-3 flex gap-2 border-t border-neutral-100">
                  <a
                    href={message.glbUrl}
                    download
                    className="flex-1 px-3 py-2 text-sm bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-center"
                  >
                    Download GLB
                  </a>
                  {message.jobId && (
                    <a
                      href={`/viewer?jobId=${message.jobId}`}
                      className="flex-1 px-3 py-2 text-sm bg-neutral-100 text-black rounded-lg hover:bg-neutral-200 transition-colors text-center"
                    >
                      Full View
                    </a>
                  )}
        </div>
              )}
            </div>
          </div>
        );
      
      case "status":
        const formatTime = (seconds: number) => {
          if (seconds < 60) {
            return `~${Math.ceil(seconds)}s`;
          }
          const minutes = Math.floor(seconds / 60);
          const secs = Math.ceil(seconds % 60);
          return `~${minutes}m ${secs}s`;
        };
        
        return (
          <div key={message.id} className="flex justify-start mb-4">
            <div className="max-w-[80%] bg-white rounded-2xl rounded-tl-sm border border-neutral-200 p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-5 h-5 spinner"></div>
                <div className="flex-1">
                  <p className="text-sm text-black font-medium">{message.content}</p>
                  {message.estimatedSeconds && (
                    <p className="text-xs text-neutral-500 mt-1">
                      {message.queueInfo && message.queueInfo.jobs_ahead > 0 ? (
                        <>
                          {message.jobsAhead} job{message.jobsAhead !== 1 ? 's' : ''} ahead • 
                          Wait: {formatTime(message.queueInfo.estimated_wait_seconds || 0)} • 
                          Total: {formatTime(message.estimatedSeconds)}
                        </>
                      ) : (
                        <>Estimated time: {formatTime(message.estimatedSeconds)}</>
                      )}
                    </p>
                  )}
                </div>
              </div>
              {message.progress !== undefined && (
                <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-inline-styles */}
                  <div 
                    className="h-full bg-black rounded-full transition-all duration-300"
                    style={{ width: `${message.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          </div>
        );
      
      case "error":
        // Parse error message and make email addresses clickable
        const renderErrorContent = (content: string | undefined) => {
          if (!content) return null;
          
          // Check if message contains the GPU offline error with email
          if (content.includes("founders@hydrilla.co")) {
            const parts = content.split("founders@hydrilla.co");
            return (
              <>
                {parts[0]}
                <a 
                  href="mailto:founders@hydrilla.co" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-red-900 underline hover:text-red-700 font-medium"
                >
                  founders@hydrilla.co
                </a>
                {parts[1]}
              </>
            );
          }
          
          return content;
        };
        
        return (
          <div key={message.id} className="flex justify-start mb-4">
            <div className="max-w-[80%] bg-red-50 border border-red-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <p className="text-sm text-red-800">{renderErrorContent(message.content)}</p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-neutral-50 flex overflow-hidden">
      {/* Left Panel - Library/History (Desktop Only) */}
      <div className={`hidden lg:flex lg:flex-col bg-white border-r border-neutral-100 flex-shrink-0 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'w-[280px]' : 'w-0 overflow-hidden'
      }`}>
        <div className={`p-4 border-b border-neutral-100 ${!sidebarOpen ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
          {/* Hydrilla Logo in Sidebar */}
          <Link href="/" className="flex items-center mb-4">
            <span 
              className="text-2xl font-bold text-black tracking-tight font-dm-sans"
            >
              Hydrilla
            </span>
          </Link>
          <h2 className="text-lg font-semibold text-black mb-3">My Generations</h2>
          {/* Search Bar */}
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black/10 transition-all"
                />
              </div>
              
        <div className={`flex-1 overflow-y-auto p-4 space-y-2 ${!sidebarOpen ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
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
                      {/* eslint-disable-next-line @next/next/no-inline-styles */}
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
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-400 text-sm">
                {searchQuery ? "No results found" : "No generations yet"}
              </p>
            </div>
          ) : (
            filteredHistory.map((job) => (
              <div
                key={job.id}
                onClick={() => viewHistoryModel(job)}
                className={`bg-neutral-50 rounded-xl border border-neutral-100 overflow-hidden hover:border-neutral-300 transition-all cursor-pointer ${job.resultGlbUrl ? '' : ''}`}
              >
                <div className="flex gap-3 p-3">
                  <div className="flex-shrink-0">
                    {job.previewImageUrl ? (
                      <img 
                        src={job.previewImageUrl} 
                        alt="" 
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-neutral-200 flex items-center justify-center">
                        <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    {editingJobId === job.id ? (
                      <div className="space-y-2">
                        <label htmlFor={`edit-name-${job.id}`} className="sr-only">Edit job name</label>
                        <input
                          id={`edit-name-${job.id}`}
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleSaveName(job.id);
                            } else if (e.key === "Escape") {
                              handleCancelEdit();
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-2 py-1 text-xs bg-white border border-neutral-300 rounded focus:border-black focus:outline-none"
                          placeholder="Enter name"
                          autoFocus
                        />
                        <div className="flex gap-1">
                  <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSaveName(job.id);
                            }}
                            className="px-2 py-0.5 text-[10px] bg-black text-white rounded hover:bg-neutral-800"
                          >
                            Save
                  </button>
                  <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCancelEdit();
                            }}
                            className="px-2 py-0.5 text-[10px] bg-neutral-200 text-black rounded hover:bg-neutral-300"
                          >
                            Cancel
                  </button>
                </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2">
                          <p 
                            className="text-xs text-black truncate font-medium flex-1 cursor-pointer"
                            onClick={() => viewHistoryModel(job)}
                            title={job.name || job.prompt || "Image to 3D"}
                          >
                            {job.name || job.prompt || "Image to 3D"}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(job);
                            }}
                            className="p-1 hover:bg-neutral-200 rounded transition-colors flex-shrink-0"
                            title="Edit name"
                          >
                            <svg className="w-3 h-3 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusColor(job.status)}`}></span>
                          <span className="text-xs text-neutral-400">
                            {getStatusText(job)}
                          </span>
                        </div>
                      </>
              )}
            </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Interface - Centered */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Top Bar - Logo and Profile */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-white/95 backdrop-blur-sm border-b border-neutral-100 lg:bg-transparent lg:border-b-0 pointer-events-none">
          {/* Left: Hamburger Menu, Logo, and Toggle Button */}
          <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
            {/* Mobile Menu Button */}
            <HamburgerMenu 
              onClick={() => setShowMenu(true)}
              className="lg:hidden"
            />
            
            {/* Sidebar Toggle Button (Desktop) */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-100 transition-colors"
              aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            >
              {sidebarOpen ? (
                <svg 
                  className="w-5 h-5 text-black" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg 
                  className="w-5 h-5 text-black" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            
            {/* Hydrilla Logo (shown on mobile and when sidebar closed on desktop) */}
            <Link href="/" className={`flex items-center ${!sidebarOpen ? '' : 'lg:hidden'}`}>
              <span 
                className="text-xl sm:text-2xl font-bold text-black tracking-tight font-dm-sans"
              >
                Hydrilla
              </span>
            </Link>
          </div>
          
          {/* Right: Library Button and Profile Icon */}
          <div className="pointer-events-auto flex items-center gap-2 sm:gap-3">
            <SignedIn>
              <Link
                href="/library"
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg bg-neutral-100 text-black text-xs sm:text-sm font-medium hover:bg-neutral-200 transition-colors"
                title="Library"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="hidden sm:inline">Library</span>
              </Link>
              <UserButton
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8 sm:w-9 sm:h-9 border-2 border-neutral-200",
                  },
                }}
              />
            </SignedIn>
          </div>
        </div>
        
        {/* Mobile Menu Button (old position - keeping for backward compatibility but hidden) */}
        <div className="lg:hidden absolute top-4 left-4 z-10 opacity-0 pointer-events-none">
          <HamburgerMenu 
            onClick={() => setShowMenu(true)}
          />
        </div>
        
        {/* Mobile Menu */}
        <Menu isOpen={showMenu} onClose={() => setShowMenu(false)}>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-black mb-3">My Generations</h3>
              {/* Search Bar */}
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black/10 transition-all"
                aria-label="Search generations"
                title="Search generations"
              />
            </div>
            
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
                        {/* eslint-disable-next-line @next/next/no-inline-styles */}
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
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-neutral-400 text-sm">
                  {searchQuery ? "No results found" : "No generations yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredHistory.slice(0, 10).map((job) => (
                  <div
                    key={job.id}
                    onClick={() => {
                      viewHistoryModel(job);
                      setShowMenu(false);
                    }}
                    className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 hover:border-neutral-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {job.previewImageUrl ? (
                          <img src={job.previewImageUrl} alt="" className="w-14 h-14 rounded-lg object-cover" />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-neutral-200 flex items-center justify-center">
                            <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingJobId === job.id ? (
                          <div className="space-y-2">
                            <label htmlFor={`edit-name-menu-${job.id}`} className="sr-only">Edit job name</label>
                            <input
                              id={`edit-name-menu-${job.id}`}
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  handleSaveName(job.id);
                                } else if (e.key === "Escape") {
                                  handleCancelEdit();
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full px-2 py-1 text-sm bg-white border border-neutral-300 rounded focus:border-black focus:outline-none"
                              placeholder="Enter name"
                              autoFocus
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSaveName(job.id);
                                }}
                                className="px-2 py-1 text-xs bg-black text-white rounded hover:bg-neutral-800"
                              >
                                Save
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCancelEdit();
                                }}
                                className="px-2 py-1 text-xs bg-neutral-200 text-black rounded hover:bg-neutral-300"
                              >
                                Cancel
                              </button>
                  </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between gap-2">
                              <p 
                                className="text-sm text-black truncate font-medium flex-1"
                                title={job.name || job.prompt || "Image to 3D"}
                              >
                                {job.name || job.prompt || "Image to 3D"}
                              </p>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStartEdit(job);
                                }}
                                className="p-1 hover:bg-neutral-200 rounded transition-colors flex-shrink-0"
                                title="Edit name"
                              >
                                <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`w-2 h-2 rounded-full ${getStatusColor(job.status)}`}></span>
                              <span className="text-xs text-neutral-500">
                                {job.previewImageUrl && !job.resultGlbUrl && job.status === "DONE" 
                                  ? "Done" 
                                  : job.status === "DONE" 
                                    ? "Completed" 
                                    : getStatusText(job)}
                              </span>
                            </div>
                          </>
                )}
              </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
          </div>
        </Menu>
        
         <div className="flex-1 flex flex-col min-h-0 max-w-4xl mx-auto w-full pt-14 sm:pt-16">
           {chatMessages.length === 0 ? (
             /* Empty State - Centered Prompt Box */
             <div className="flex-1 flex items-center justify-center px-4 py-8">
               <div className="w-full max-w-3xl">
                 <PromptBox
                   value={mode === "text" ? prompt : ""}
                   onChange={(value) => {
                     setPrompt(value);
                     // Clear image when text is typed
                     if (value.trim() && imagePreview) {
                       setImagePreview(null);
                       setUploadedFile(null);
                       setImageUrl("");
                       setMode("text");
                       if (fileInputRef.current) {
                         fileInputRef.current.value = "";
                       }
                     }
                   }}
                   onImageUpload={handleImageUpload}
                   onSubmit={handlePromptSubmit}
                   imagePreview={imagePreview}
                   mode={mode === "text" ? "text" : "image"}
                   disabled={loading || generatingPreview || uploading}
                   placeholder={mode === "text" ? "Describe your scene with visual references..." : imagePreview ? "Image uploaded. Click Create to generate 3D model..." : "Upload an image to generate a 3D model..."}
                   isAtBottom={false}
                 />
               </div>
             </div>
           ) : (
             /* Chat Messages View */
             <div className="flex-1 flex flex-col h-full">
               {/* Chat Messages Area - Scrollable */}
               <div className="flex-1 overflow-y-auto px-4 py-6 scroll-smooth">
                 <div className="space-y-4 w-full">
                   {chatMessages.map((message) => renderChatMessage(message))}
                   <div ref={chatEndRef} />
                 </div>
               </div>

               {/* Prompt Box */}
               <div className="pb-6 px-4">
                 <PromptBox
                   value={mode === "text" ? prompt : ""}
                   onChange={(value) => {
                     setPrompt(value);
                     // Clear image when text is typed
                     if (value.trim() && imagePreview) {
                       setImagePreview(null);
                       setUploadedFile(null);
                       setImageUrl("");
                       setMode("text");
                       if (fileInputRef.current) {
                         fileInputRef.current.value = "";
                       }
                     }
                   }}
                   onImageUpload={handleImageUpload}
                   onSubmit={handlePromptSubmit}
                   imagePreview={imagePreview}
                   mode={mode === "text" ? "text" : "image"}
                   disabled={loading || generatingPreview || uploading}
                   placeholder={mode === "text" ? "Describe your scene with visual references..." : imagePreview ? "Image uploaded. Click Create to generate 3D model..." : "Upload an image to generate a 3D model..."}
                   isAtBottom={true}
                 />
               </div>
             </div>
           )}
         </div>
        </div>
      </div>
  );
}
