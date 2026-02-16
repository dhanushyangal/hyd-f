"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth, SignInButton, SignedIn } from "@clerk/nextjs";
import PremiumUserButton from "../../components/PremiumUserButton";
import EarlyAccessCard from "../../components/sections/EarlyAccessCard";
import Link from "next/link";
import { submitTextTo3D, submitImageTo3D, generatePreviewImage, registerJobWithPreview, editImage, fetchHistory, fetchStatus, fetchQueueInfo, BackendJob, Job, QueueInfo, getGlbUrl, getProxyGlbUrl, updateJobName, notifyGpuOffline, fetchChats, fetchChat, createChat, getOrCreateActiveChat, Chat, deleteChat, updateChatName, Workspace, fetchWorkspaces, createWorkspaceApi, deleteWorkspaceApi } from "../../lib/api";
import { setCurrentWorkspaceId } from "../../lib/utils";
import { ThreeViewer } from "../../components/ThreeViewer";
import { PromptBox } from "../../components/PromptBox";
import { Menu } from "../../components/Menu";
import { HamburgerMenu } from "../../components/HamburgerMenu";
import { ImageGeneration } from "../../components/ui/ai-chat-image-generation-1";

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
  const [editingImage, setEditingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelGenerationProgress, setModelGenerationProgress] = useState(0);
  
  // Auto-scroll removed - chat is now manually scrollable
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

  // Chat states
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingChatName, setEditingChatName] = useState("");
  const [libraryImages, setLibraryImages] = useState<BackendJob[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  
  // History states (for backward compatibility - jobs in current chat)
  const [history, setHistory] = useState<BackendJob[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [currentGenerating, setCurrentGenerating] = useState<GeneratingModel | null>(null);
  
  // Menu state
  const [showMenu, setShowMenu] = useState(false);
  
  // Sidebar state (for desktop)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Search state for library
  const [searchQuery, setSearchQuery] = useState("");

  // Workspace states (for sidebar list)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspacesLoading, setWorkspacesLoading] = useState(false);
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState("");

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

  // Fetch chats on mount
  useEffect(() => {
    const loadChats = async () => {
      if (!userIsSignedIn) return;
      setChatsLoading(true);
      try {
        const tokenGetter = async () => await getToken();
        const loadedChats = await fetchChats(tokenGetter);
        console.log("Loaded chats with preview data:", loadedChats.map(c => ({
          id: c.id,
          name: c.name,
          hasPreviewImage: !!c.firstJobPreviewImageUrl,
          previewImageUrl: c.firstJobPreviewImageUrl,
          hasPrompt: !!c.firstJobPrompt,
          prompt: c.firstJobPrompt
        })));
        setChats(loadedChats);
        
        if (loadedChats.length > 0) {
          // Auto-open most recent chat so refresh shows last conversation
          setCurrentChatId(loadedChats[0].id);
          try {
            const chatData = await fetchChat(loadedChats[0].id, tokenGetter);
            setHistory(chatData.jobs);
            const messages: ChatMessage[] = [];
            const ts = Date.now();
            chatData.jobs.forEach((job, i) => {
              if (job.resultGlbUrl) {
                messages.push({
                  id: `msg-${ts}-${i}-3d`,
                  type: "3d",
                  glbUrl: getProxyGlbUrl(job.id),
                  status: "completed",
                  jobId: job.id,
                  timestamp: ts + i,
                });
              } else if (job.previewImageUrl) {
                if (job.prompt) {
                  messages.push({
                    id: `msg-${ts}-${i}-user`,
                    type: "user",
                    content: job.prompt,
                    jobId: job.id,
                    timestamp: ts + i,
                  });
                }
                messages.push({
                  id: `msg-${ts}-${i}-preview`,
                  type: "preview",
                  imageUrl: job.previewImageUrl,
                  canRegenerate: false,
                  canGenerate3D: !job.resultGlbUrl,
                  status: "completed",
                  jobId: job.id,
                  timestamp: ts + i + 0.5,
                });
              } else {
                if (job.prompt) {
                  messages.push({
                    id: `msg-${ts}-${i}-user`,
                    type: "user",
                    content: job.prompt,
                    jobId: job.id,
                    timestamp: ts + i,
                  });
                }
                messages.push({
                  id: `msg-${ts}-${i}-status`,
                  type: "status",
                  content: job.prompt || "Job in progress...",
                  status: job.status === "DONE" ? "completed" : "generating",
                  jobId: job.id,
                  timestamp: ts + i + 0.5,
                });
              }
            });
            setChatMessages(messages);
          } catch (loadErr: any) {
            console.warn("Failed to load first chat:", loadErr?.message);
            setHistory([]);
            setChatMessages([]);
          }
        } else {
          setCurrentChatId(null);
          setHistory([]);
          setChatMessages([]);
        }
        setHistoryLoading(false);
      } catch (err: any) {
        // Log error but don't show to user - chat loading failure is non-critical
        console.warn("Failed to load chats:", err.message || err);
        // Set empty chats so app continues to work
        setChats([]);
        setHistory([]);
      } finally {
        setChatsLoading(false);
        setHistoryLoading(false);
      }
    };
    loadChats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIsSignedIn]);

  // Fetch workspaces on mount
  useEffect(() => {
    if (!userIsSignedIn) return;
    loadWorkspaces();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIsSignedIn]);

  // Fetch library images (recent jobs with images)
  useEffect(() => {
    const loadLibraryImages = async () => {
      if (!userIsSignedIn) return;
      setLibraryLoading(true);
      try {
        const tokenGetter = async () => await getToken();
        const jobs = await fetchHistory(tokenGetter);
        // Get jobs with preview images, limit to 6 most recent
        const jobsWithImages = jobs
          .filter(job => job.previewImageUrl || job.imageUrl)
          .slice(0, 6);
        setLibraryImages(jobsWithImages);
      } catch (err: any) {
        console.warn("Failed to load library images:", err.message || err);
        setLibraryImages([]);
      } finally {
        setLibraryLoading(false);
      }
    };
    loadLibraryImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userIsSignedIn]);

  // Poll for current generating job
  useEffect(() => {
    if (!currentGenerating || currentGenerating.status !== "generating") return;
    
    let consecutiveFailures = 0;
    const MAX_FAILURES = 3;

    const pollStatus = async () => {
      try {
        const status = await fetchStatus(currentGenerating.jobId);
        consecutiveFailures = 0; // Reset on success
        
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
          if (currentChatId) {
            const chatData = await fetchChat(currentChatId, tokenGetter);
            setHistory(chatData.jobs);
          }
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
      } catch (err: any) {
        consecutiveFailures++;
        console.error("Failed to poll status:", err);
        
        // Check if it's a GPU offline or network error
        const isNetworkError = err.name === "TypeError" && 
                              (err.message?.includes("fetch") || 
                               err.message?.includes("Failed to fetch") ||
                               err.message?.includes("NetworkError") ||
                               err.message?.includes("GPU is currently offline"));
        
        // Stop polling if API is offline or too many failures
        if (isNetworkError || consecutiveFailures >= MAX_FAILURES) {
          console.warn("Stopping status polling: API appears to be offline");
          if (modelProgressIntervalRef.current) {
            clearInterval(modelProgressIntervalRef.current);
            modelProgressIntervalRef.current = null;
          }
          
          // Add error message to chat
          setChatMessages((prev) => {
            const filtered = prev.filter((msg) => 
              !(msg.type === "error" && msg.content?.includes("GPU is currently offline"))
            );
            filtered.push({
              id: `error-${Date.now()}`,
              type: "error",
              content: err.message || "GPU is currently offline. Please try again after some time.",
              timestamp: Date.now(),
            });
            return filtered;
          });
          
          setLoading(false);
          setUploading(false);
          return; // Stop polling
        }
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
  
  const loadWorkspaces = async () => {
    setWorkspacesLoading(true);
    try {
      const tokenGetter = async () => await getToken();
      const ws = await fetchWorkspaces(tokenGetter);
      setWorkspaces(ws);
    } catch { /* ignore */ }
    setWorkspacesLoading(false);
  };

  const handleCreateNewWorkspace = async () => {
    try {
      const tokenGetter = async () => await getToken();
      const ws = await createWorkspaceApi(undefined, tokenGetter);
      // Navigate to the new workspace (URL stays /workspace)
      setCurrentWorkspaceId(ws.id);
      window.location.href = "/workspace";
    } catch (err: any) {
      console.error("Failed to create workspace:", err);
    }
  };

  const handleOpenWorkspace = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId);
    window.location.href = "/workspace";
  };

  const handleDeleteWorkspace = async (e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation();
    if (!confirm("Delete this workspace? Jobs inside it will not be deleted.")) return;
    try {
      const tokenGetter = async () => await getToken();
      await deleteWorkspaceApi(workspaceId, tokenGetter);
      setWorkspaces((prev) => prev.filter((ws) => ws.id !== workspaceId));
    } catch (err: any) {
      console.error("Failed to delete workspace:", err);
    }
  };

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(workspaceSearchQuery.toLowerCase())
  );

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
      const promptText = prompt.trim();
      
      // If no chat is selected, create a new one
      let chatIdToUse = currentChatId;
      if (!chatIdToUse) {
        try {
          const tokenGetter = async () => await getToken();
          const newChat = await createChat("New Chat", tokenGetter);
          setChats((prev) => [newChat, ...prev]);
          setCurrentChatId(newChat.id);
          chatIdToUse = newChat.id; // Use the new chat ID directly
          setHistory([]);
          setChatMessages([]);
        } catch (err: any) {
          console.error("Failed to create chat:", err);
          addChatMessage({
            type: "error",
            content: err.message || "Failed to create chat",
          });
          return;
        }
      }
      
      // Update chat name immediately with the prompt
      if (chatIdToUse) {
        try {
          const tokenGetter = async () => await getToken();
          await updateChatName(chatIdToUse, promptText, tokenGetter);
          // Update chats list immediately to show new name
          setChats((prev) => prev.map((chat) => 
            chat.id === chatIdToUse 
              ? { ...chat, name: promptText, firstJobPrompt: promptText }
              : chat
          ));
        } catch (err) {
          console.error("Failed to update chat name:", err);
          // Continue anyway - non-critical
        }
      }
      
      // Add user message to chat
      addChatMessage({
        type: "user",
        content: promptText,
      });
      
      // Clear prompt text immediately
      setPrompt("");
      
      // Auto-generate preview with the chat ID
      await handleGeneratePreview(chatIdToUse);
    } else if (mode === "image" && imagePreview) {
      const promptText = prompt.trim();
      const hasEditPrompt = promptText.length > 0;

      // If no chat is selected, create a new one
      let chatIdToUse = currentChatId;
      if (!chatIdToUse) {
        try {
          const tokenGetter = async () => await getToken();
          const newChat = await createChat("New Chat", tokenGetter);
          setChats((prev) => [newChat, ...prev]);
          setCurrentChatId(newChat.id);
          chatIdToUse = newChat.id;
          setHistory([]);
          setChatMessages([]);
        } catch (err: any) {
          console.error("Failed to create chat:", err);
          addChatMessage({
            type: "error",
            content: err.message || "Failed to create chat",
          });
          return;
        }
      }

      if (hasEditPrompt) {
        // Image + prompt: edit image with prompt, then show result with "Generate 3D" option
        addChatMessage({ type: "user", content: promptText });
        const statusId = addChatMessage({
          type: "status",
          content: "Editing image...",
          status: "generating",
          progress: 50,
        });
        setEditingImage(true);
        try {
          const tokenGetter = async () => await getToken();
          const result = await editImage(promptText, uploadedFile, imageUrl || undefined, tokenGetter);
          updateChatMessage(statusId, { content: "Edit complete.", status: "completed", progress: 100 });
          setPreviewImageUrl(result.image_url);
          setPreviewId(null);
          addChatMessage({
            type: "preview",
            imageUrl: result.image_url,
            canGenerate3D: true,
            canRegenerate: false,
          });
          if (chatIdToUse && result.image_url) {
            setChats((prev) => prev.map((c) =>
              c.id === chatIdToUse ? { ...c, firstJobPreviewImageUrl: result.image_url } : c
            ));
          }
          setPrompt("");
          setUploadedFile(null);
          setImagePreview(null);
          setImageUrl("");
          if (fileInputRef.current) fileInputRef.current.value = "";
        } catch (err: any) {
          updateChatMessage(statusId, { type: "error", content: err.message || "Failed to edit image" });
          addChatMessage({
            type: "error",
            content: err.message || "Failed to edit image",
          });
        } finally {
          setEditingImage(false);
        }
        return;
      }

      // No prompt: proceed directly to 3D generation from uploaded image
      const previewToAdd = imagePreview;
      const fileToUse = uploadedFile;
      if (chatIdToUse && previewToAdd) {
        setChats((prev) => prev.map((chat) =>
          chat.id === chatIdToUse ? { ...chat, firstJobPreviewImageUrl: previewToAdd } : chat
        ));
      }
      setUploadedFile(null);
      setImagePreview(null);
      setImageUrl("");
      setMode("text");
      if (fileInputRef.current) fileInputRef.current.value = "";
      addChatMessage({
        type: "preview",
        imageUrl: previewToAdd,
        canGenerate3D: false,
      });
      await handleImageTo3D(previewToAdd, fileToUse, chatIdToUse);
    }
  };
  
  // Handle image to 3D generation with optional stored preview
  const handleImageTo3D = async (storedPreview?: string, storedFile?: File | null, overrideChatId?: string | null) => {
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
    } catch (err: any) {
      // If queue info fetch fails, it means API is offline - show error immediately
      if (err.message?.includes("GPU is currently offline")) {
        // Send notification to founders (non-blocking)
        const tokenGetter = async () => await getToken();
        notifyGpuOffline(err.message || "GPU is currently offline", tokenGetter);
        
        addChatMessage({
          type: "error",
          content: err.message || "GPU is currently offline. Please try again after some time.",
        });
        setLoading(false);
        setUploading(false);
        return;
      }
      // Silently continue with defaults for other errors
    }
    
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

      // Use overrideChatId if provided, otherwise currentChatId
      const chatIdForJob = overrideChatId !== undefined ? overrideChatId : currentChatId;
      
      if (fileToUse) {
        setUploading(true);
        try {
          result = await submitImageTo3D(null, fileToUse, tokenGetter, null, chatIdForJob);
        } finally {
          setUploading(false);
        }
      } else if (imageUrl.trim()) {
        result = await submitImageTo3D(imageUrl.trim(), null, tokenGetter, null, chatIdForJob);
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
  const handleGeneratePreview = async (overrideChatId?: string | null) => {
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
    } catch (err: any) {
      // If queue info fetch fails, it means API is offline - show error immediately
      if (err.message?.includes("GPU is currently offline")) {
        // Send notification to founders (non-blocking)
        const tokenGetter = async () => await getToken();
        notifyGpuOffline(err.message || "GPU is currently offline", tokenGetter);
        
        addChatMessage({
          type: "error",
          content: err.message || "GPU is currently offline. Please try again after some time.",
        });
        setGeneratingPreview(false);
        return;
      }
      // Silently continue with defaults for other errors
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
      
      // Register job with preview image - use overrideChatId if provided, otherwise currentChatId
      const chatIdForJob = overrideChatId !== undefined ? overrideChatId : currentChatId;
      try {
        await registerJobWithPreview(
          result.preview_id,
          result.image_url,
          prompt.trim(),
          tokenGetter,
          chatIdForJob
        );
        
        // Refresh current chat to show the new job - use overrideChatId if provided
        const chatIdToRefresh = overrideChatId !== undefined ? overrideChatId : currentChatId;
        if (chatIdToRefresh) {
          const chatData = await fetchChat(chatIdToRefresh, tokenGetter);
          setHistory(chatData.jobs);
        }
      } catch (err) {
        console.error("Failed to register preview job:", err);
      }
      
      // Update chat preview image immediately
      const chatIdForPreview = overrideChatId !== undefined ? overrideChatId : currentChatId;
      if (chatIdForPreview && result.image_url) {
        setChats((prev) => prev.map((chat) => 
          chat.id === chatIdForPreview 
            ? { ...chat, firstJobPreviewImageUrl: result.image_url }
            : chat
        ));
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
  const handleGenerate3D = async (overridePreviewJobId?: string | null) => {
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
    } catch (err: any) {
      // If queue info fetch fails, it means API is offline - show error immediately
      if (err.message?.includes("GPU is currently offline")) {
        // Send notification to founders (non-blocking)
        const tokenGetter = async () => await getToken();
        notifyGpuOffline(err.message || "GPU is currently offline", tokenGetter);
        
        addChatMessage({
          type: "error",
          content: err.message || "GPU is currently offline. Please try again after some time.",
        });
        setLoading(false);
        setUploading(false);
        return;
      }
      // Silently continue with defaults for other errors
    }

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
      // Use overridePreviewJobId if provided, otherwise use state previewId
      const previewJobIdToUse = overridePreviewJobId !== undefined ? overridePreviewJobId : (previewId || null);
      // Note: handleGenerate3D is called from existing chats, so we use currentChatId here
      const result = await submitImageTo3D(previewImageUrl, null, tokenGetter, previewJobIdToUse, currentChatId);
      
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

  // View a chat (load all jobs in that chat)
  const viewChat = async (chat: Chat) => {
    setCurrentChatId(chat.id);
    setHistoryLoading(true);
    try {
      const tokenGetter = async () => await getToken();
      const chatData = await fetchChat(chat.id, tokenGetter);
      setHistory(chatData.jobs);
      
      // Clear chat messages and load all jobs from this chat
      setChatMessages([]);
      chatData.jobs.forEach((job) => {
        // Then add the job result message
        if (job.resultGlbUrl) {
          // For 3D objects, don't show the prompt - just show the 3D model
          addChatMessage({
            type: "3d",
            glbUrl: getProxyGlbUrl(job.id),
            status: "completed",
            jobId: job.id,
          });
        } else if (job.previewImageUrl) {
          // For preview images, show the prompt first, then the image
          if (job.prompt) {
            addChatMessage({
              type: "user",
              content: job.prompt,
              jobId: job.id,
            });
          }
          addChatMessage({
            type: "preview",
            imageUrl: job.previewImageUrl,
            canRegenerate: false,
            canGenerate3D: !job.resultGlbUrl,
            status: "completed",
            jobId: job.id,
          });
        } else {
          // For status messages, show the prompt
          if (job.prompt) {
            addChatMessage({
              type: "user",
              content: job.prompt,
              jobId: job.id,
            });
          }
          addChatMessage({
            type: "status",
            content: job.prompt || "Job in progress...",
            status: job.status === "DONE" ? "completed" : "generating",
            jobId: job.id,
          });
        }
      });
    } catch (err: any) {
      console.error("Failed to load chat:", err);
      setError(err.message || "Failed to load chat");
    } finally {
      setHistoryLoading(false);
    }
    setShowMenu(false);
  };

  // Create a new chat
  const handleNewChat = async () => {
    try {
      const tokenGetter = async () => await getToken();
      const newChat = await createChat("New Chat", tokenGetter);
      setChats((prev) => [newChat, ...prev]);
      setCurrentChatId(newChat.id);
      setHistory([]);
      setChatMessages([]);
    } catch (err: any) {
      console.error("Failed to create chat:", err);
      setError(err.message || "Failed to create chat");
    }
  };

  // Handle chat rename
  const handleRenameChat = async (chatId: string, newName: string) => {
    if (!newName.trim()) return;
    try {
      const tokenGetter = async () => await getToken();
      await updateChatName(chatId, newName.trim(), tokenGetter);
      setChats((prev) => prev.map(chat => 
        chat.id === chatId ? { ...chat, name: newName.trim() } : chat
      ));
      setEditingChatId(null);
      setEditingChatName("");
    } catch (err: any) {
      console.error("Failed to rename chat:", err);
      setError(err.message || "Failed to rename chat");
    }
  };

  // Handle chat delete
  const handleDeleteChat = async (chatId: string) => {
    if (!confirm("Are you sure you want to delete this chat?")) return;
    try {
      const tokenGetter = async () => await getToken();
      await deleteChat(chatId, tokenGetter);
      setChats((prev) => prev.filter(chat => chat.id !== chatId));
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setHistory([]);
        setChatMessages([]);
      }
    } catch (err: any) {
      console.error("Failed to delete chat:", err);
      setError(err.message || "Failed to delete chat");
    }
  };

  // Start editing chat name
  const startEditingChat = (chat: Chat) => {
    setEditingChatId(chat.id);
    setEditingChatName(chat.firstJobPrompt || chat.name);
  };

  // View a model from history (for backward compatibility)
  const viewHistoryModel = (job: BackendJob) => {
    // If 3D model exists, only show that (don't show preview image separately)
    if (job.resultGlbUrl) {
      addChatMessage({
        type: "3d",
        glbUrl: getProxyGlbUrl(job.id), // Use proxy URL to avoid CORS issues
        status: "completed",
        jobId: job.id,
      });
    } 
    // Otherwise, show preview image if it exists
    else if (job.previewImageUrl) {
      addChatMessage({
        type: "preview",
        imageUrl: job.previewImageUrl,
        canRegenerate: false,
        canGenerate3D: !job.resultGlbUrl, // Can generate 3D if no 3D model exists yet
        status: "completed",
        jobId: job.id,
      });
    }
    // If job has neither preview nor 3D, still show it (might be in progress)
    else {
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

  // Filter chats based on search
  const filteredChats = chats.filter((chat: Chat) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const chatName = chat.name?.toLowerCase() || '';
    const chatPrompt = chat.firstJobPrompt?.toLowerCase() || '';
    return chatName.includes(query) || chatPrompt.includes(query);
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
            <div className="max-w-[300px]">
              <ImageGeneration
                progress={100}
                loadingState="completed"
              >
                {message.imageUrl && (
                  <img 
                    src={message.imageUrl} 
                    alt="Preview" 
                    className="w-full max-h-[300px] object-contain"
                  />
                )}
              </ImageGeneration>
              {/* Only show buttons for generated preview images, not uploaded images */}
              {(message.canRegenerate || message.canGenerate3D) && (
                <div className="p-3 flex gap-2 bg-white rounded-b-2xl border-x border-b border-neutral-200">
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
                          // Pass jobId directly to avoid async state update issue
                          handleGenerate3D(message.jobId || null);
                        } else {
                          handleImageTo3D();
                        }
                      }}
                      disabled={loading || generatingPreview || editingImage}
                      className="flex-1 px-3 py-2 text-sm bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
                    >
                      Generate 3D
                    </button>
                  )}
                </div>
              )}
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
      
      case "status": {
        const handleStatusClick = async () => {
          // Create a new chat and continue with this prompt
          try {
            const tokenGetter = async () => await getToken();
            const newChat = await createChat("New Chat", tokenGetter);
            setChats((prev) => [newChat, ...prev]);
            setCurrentChatId(newChat.id);
            setHistory([]);
            setChatMessages([]);
            
            // Set the prompt from the message content
            if (message.content && message.content !== "Job in progress..." && message.content !== "Generating preview image...") {
              setPrompt(message.content);
              setMode("text");
            }
          } catch (err: any) {
            console.error("Failed to create new chat:", err);
            setError(err.message || "Failed to create new chat");
          }
        };
        
        const formatTime = (seconds: number) => {
          if (seconds < 60) {
            return `~${Math.ceil(seconds)}s`;
          }
          const minutes = Math.floor(seconds / 60);
          const secs = Math.ceil(seconds % 60);
          return `~${minutes}m ${secs}s`;
        };
        
        // Use ImageGeneration for preview image generation status
        if (message.content === "Generating preview image...") {
          return (
            <div key={message.id} className="flex justify-start mb-4">
              <div className="max-w-[300px]">
                <ImageGeneration
                  progress={message.progress || 0}
                  loadingState={message.status === "generating" ? "generating" : message.status === "completed" ? "completed" : "starting"}
                  duration={(message.estimatedSeconds || 20) * 1000}
                >
                  <div className="w-full h-[300px] bg-neutral-50 flex items-center justify-center rounded-xl">
                    <div className="text-center px-4">
                      <div className="w-8 h-8 spinner mx-auto mb-3"></div>
                      <p className="text-sm text-black font-medium mb-1">{message.content}</p>
                      {message.estimatedSeconds && (
                        <p className="text-xs text-neutral-500">
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
                </ImageGeneration>
              </div>
            </div>
          );
        }
        
        // Only make clickable if it's a prompt (not "Job in progress..." or "Generating preview image...")
        const isClickable = message.content && 
          message.content !== "Job in progress..." && 
          message.content !== "Generating preview image...";
        
        return (
          <div key={message.id} className="flex justify-start mb-4">
            <div 
              className={`max-w-[80%] bg-white rounded-2xl rounded-tl-sm border border-neutral-200 p-4 shadow-sm ${
                isClickable ? 'cursor-pointer hover:bg-neutral-50 transition-colors' : ''
              }`}
              onClick={isClickable ? handleStatusClick : undefined}
              title={isClickable ? "Click to create a new chat and continue with this prompt" : undefined}
            >
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
      }
      
      case "error":
        // Parse error message
        const renderErrorContent = (content: string | undefined) => {
          if (!content) return null;
          
          // Check if message contains the GPU offline error
          if (content.includes("GPU is currently offline")) {
            return (
              <div>
                <p>{content}</p>
                <p className="text-xs text-red-700 mt-2">
                  We've been automatically notified. The GPU should be back online soon.
                </p>
              </div>
            );
          }
          
          return content;
        };
        
        return (
          <div key={message.id} className="flex justify-start mb-4">
            <div className="max-w-[80%] bg-red-50 border border-red-200 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="text-sm text-red-800">{renderErrorContent(message.content)}</div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-neutral-50 flex overflow-hidden">
      {/* Mobile Menu */}
      <Menu isOpen={showMenu} onClose={() => setShowMenu(false)}>
        <div className="space-y-4">
          {/* Logo */}
          <Link href="/" className="flex items-center mb-2" onClick={() => setShowMenu(false)}>
            <span 
              className="text-xl font-bold text-black tracking-tight font-dm-sans"
            >
              Hydrilla
            </span>
          </Link>
          
          {/* Early Access Card - shows when user has pass */}
          <EarlyAccessCard showWhenHasAccess={true} compact={true} />
          
          {/* My Library Section */}
          <div className="mb-4">
            <Link 
              href="/library"
              className="flex items-center justify-between mb-3 group"
              onClick={() => setShowMenu(false)}
            >
              <h3 className="text-sm font-semibold text-black">My Library</h3>
              <svg className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            {libraryLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-4 h-4 spinner"></div>
              </div>
            ) : libraryImages.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 -mx-2 px-2">
                {libraryImages.map((job: BackendJob) => (
                  <Link
                    key={job.id}
                    href={`/viewer?jobId=${job.id}`}
                    onClick={() => setShowMenu(false)}
                    className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-neutral-200 hover:border-black transition-colors"
                  >
                    {job.previewImageUrl || job.imageUrl ? (
                      <img 
                        src={job.previewImageUrl || job.imageUrl || ''} 
                        alt="Library image"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 text-center py-4">No images yet</p>
            )}
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

          {/* Chats Section */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-black mb-3">Chats</h3>
            <button
              onClick={() => {
                handleNewChat();
                setShowMenu(false);
              }}
              className="w-full mb-4 px-3 py-2 text-sm bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              + New Chat
            </button>
            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black/10 transition-all"
            />
          </div>

          {/* Chats */}
          {chatsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 spinner"></div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-400 text-sm">
                {searchQuery ? "No results found" : "No chats yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredChats.slice(0, 10).map((chat: Chat) => (
                <div
                  key={chat.id}
                  className="bg-neutral-50 rounded-xl p-3 border border-neutral-100 hover:border-neutral-300 transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        viewChat(chat);
                        setShowMenu(false);
                      }}
                    >
                      <div className="flex-shrink-0">
                        {chat.firstJobPreviewImageUrl ? (
                          <img 
                            src={chat.firstJobPreviewImageUrl} 
                            alt="Chat preview"
                            className="w-14 h-14 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-neutral-200 flex items-center justify-center">
                            <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingChatId === chat.id ? (
                          <input
                            type="text"
                            value={editingChatName}
                            onChange={(e) => setEditingChatName(e.target.value)}
                            onBlur={() => {
                              if (editingChatName.trim()) {
                                handleRenameChat(chat.id, editingChatName);
                              } else {
                                setEditingChatId(null);
                                setEditingChatName("");
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                if (editingChatName.trim()) {
                                  handleRenameChat(chat.id, editingChatName);
                                }
                              } else if (e.key === 'Escape') {
                                setEditingChatId(null);
                                setEditingChatName("");
                              }
                            }}
                            className="w-full text-sm font-medium text-black bg-white border border-black rounded px-2 py-1 focus:outline-none"
                            placeholder="Enter chat name"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <p className="text-sm text-black truncate font-medium" title={chat.firstJobPrompt || chat.name}>
                            {chat.firstJobPrompt || chat.name}
                          </p>
                        )}
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {new Date(chat.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditingChat(chat);
                        }}
                        className="p-1.5 hover:bg-neutral-200 rounded-lg transition-colors"
                        title="Rename chat"
                      >
                        <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChat(chat.id);
                        }}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete chat"
                      >
                        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Menu>
      
      {/* Left Panel - Library/History (Desktop Only) */}
      <div className={`hidden lg:flex lg:flex-col bg-white border-r border-neutral-100 flex-shrink-0 transition-all duration-300 ease-in-out ${
        sidebarOpen ? 'w-[280px]' : 'w-0 overflow-hidden'
      }`}>
        <div className={`p-4 border-b border-neutral-100 ${!sidebarOpen ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
          {/* Logo and Close Button */}
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center">
              <span 
                className="text-xl sm:text-2xl font-bold text-black tracking-tight font-dm-sans"
              >
                Hydrilla
              </span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
              aria-label="Close sidebar"
            >
              <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${!sidebarOpen ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}>
          {/* Early Access Card - shows when user has pass */}
          <EarlyAccessCard showWhenHasAccess={true} compact={true} />
          
          {/* My Library Section */}
          <div className="mb-4">
            <Link 
              href="/library"
              className="flex items-center justify-between mb-3 group"
            >
              <h3 className="text-sm font-semibold text-black">My Library</h3>
              <svg className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            {libraryLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-4 h-4 spinner"></div>
              </div>
            ) : libraryImages.length > 0 ? (
              <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2 -mx-2 px-2">
                {libraryImages.map((job: BackendJob) => (
                  <Link
                    key={job.id}
                    href={`/viewer?jobId=${job.id}`}
                    className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-neutral-200 hover:border-black transition-colors"
                  >
                    {job.previewImageUrl || job.imageUrl ? (
                      <img 
                        src={job.previewImageUrl || job.imageUrl || ''} 
                        alt="Library image"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
                        <svg className="w-6 h-6 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-400 text-center py-4">No images yet</p>
            )}
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

          {/* Chats Section */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-black">Chats</h2>
              <button
                onClick={handleNewChat}
                className="px-3 py-1.5 text-sm bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                + New
              </button>
            </div>
            {/* Search Bar */}
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full mb-3 bg-neutral-50 border border-neutral-200 rounded-xl px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black/10 transition-all"
            />
          </div>

          {/* Chats */}
          {chatsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 spinner"></div>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-neutral-400 text-sm">
                {searchQuery ? "No results found" : "No chats yet"}
              </p>
            </div>
          ) : (
            filteredChats.map((chat: Chat) => (
              <div
                key={chat.id}
                className={`bg-neutral-50 rounded-xl border overflow-hidden hover:border-neutral-300 transition-all ${
                  currentChatId === chat.id ? 'border-black' : 'border-neutral-100'
                }`}
              >
                <div className="flex gap-3 p-3 group">
                  <div 
                    className="flex gap-3 flex-1 min-w-0 cursor-pointer"
                    onClick={() => viewChat(chat)}
                  >
                    <div className="flex-shrink-0">
                      {chat.firstJobPreviewImageUrl ? (
                        <img 
                          src={chat.firstJobPreviewImageUrl} 
                          alt="Chat preview"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-neutral-200 flex items-center justify-center">
                          <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {editingChatId === chat.id ? (
                        <input
                          type="text"
                          value={editingChatName}
                          onChange={(e) => setEditingChatName(e.target.value)}
                          onBlur={() => {
                            if (editingChatName.trim()) {
                              handleRenameChat(chat.id, editingChatName);
                            } else {
                              setEditingChatId(null);
                              setEditingChatName("");
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              if (editingChatName.trim()) {
                                handleRenameChat(chat.id, editingChatName);
                              }
                            } else if (e.key === 'Escape') {
                              setEditingChatId(null);
                              setEditingChatName("");
                            }
                          }}
                            className="w-full text-xs font-medium text-black bg-white border border-black rounded px-2 py-1 focus:outline-none"
                            placeholder="Enter chat name"
                            autoFocus
                            onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <p 
                          className="text-sm text-black truncate font-medium"
                          title={chat.firstJobPrompt || chat.name}
                        >
                          {chat.firstJobPrompt || chat.name}
                        </p>
                      )}
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {new Date(chat.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditingChat(chat);
                      }}
                      className="p-1.5 hover:bg-neutral-200 rounded-lg transition-colors"
                      title="Rename chat"
                    >
                      <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat.id);
                      }}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete chat"
                    >
                      <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Workspaces Section */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-black">Workspaces</h2>
              <button
                onClick={handleCreateNewWorkspace}
                className="px-3 py-1.5 text-sm bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                + New
              </button>
            </div>
            {workspacesLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
              </div>
            ) : workspaces.length === 0 ? (
              <p className="text-neutral-400 text-sm text-center py-4">No workspaces yet</p>
            ) : (
              workspaces.slice(0, 10).map((ws) => (
                <div
                  key={ws.id}
                  className="bg-neutral-50 rounded-xl border border-neutral-100 overflow-hidden hover:border-neutral-300 transition-all mb-2"
                >
                  <div className="flex gap-3 p-3 group">
                    <div
                      className="flex gap-3 flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleOpenWorkspace(ws.id)}
                    >
                      <div className="flex-shrink-0">
                        {ws.firstJobPreviewImageUrl ? (
                          <img src={ws.firstJobPreviewImageUrl} alt="" className="w-12 h-12 rounded-lg object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-neutral-200 flex items-center justify-center">
                            <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-black truncate font-medium">{ws.name}</p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {ws.jobCount ? `${ws.jobCount} items` : "Empty"} · {new Date(ws.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleDeleteWorkspace(e, ws.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete workspace"
                      >
                        <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Chat Interface - Centered */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Top Bar - Logo and Profile */}
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-white/95 backdrop-blur-sm border-b border-neutral-100 lg:bg-transparent lg:border-b-0 pointer-events-none">
          {/* Left: Hamburger Menu, Toggle Button, and Logo (when sidebar closed) */}
          <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
            {/* Mobile Menu Button */}
            <HamburgerMenu 
              onClick={() => setShowMenu(true)}
              className="lg:hidden"
            />
            
            {/* Desktop: Show Hydrilla logo and toggle button when sidebar is closed */}
            {!sidebarOpen && (
              <>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="hidden lg:flex items-center"
                >
                  <span 
                    className="text-xl sm:text-2xl font-bold text-black tracking-tight font-dm-sans"
                  >
                    Hydrilla
                  </span>
                </button>
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg hover:bg-neutral-100 transition-colors"
                  aria-label="Open sidebar"
                >
                  <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Right: My Library and Profile */}
          <div className="flex items-center gap-3 sm:gap-4 pointer-events-auto">
            <Link 
              href="/library"
              className="text-sm sm:text-base font-medium text-black hover:text-neutral-600 transition-colors"
            >
              My Library
            </Link>
            <PremiumUserButton />
          </div>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0 max-w-4xl mx-auto w-full pt-14 sm:pt-16">
           {chatMessages.length === 0 ? (
             /* Empty State - Centered Prompt Box */
             <div className="flex-1 flex items-center justify-center px-4 py-8">
               <div className="w-full max-w-3xl">
                 <PromptBox
                   value={prompt}
                   onChange={(value) => setPrompt(value)}
                   onImageUpload={handleImageUpload}
                   onSubmit={handlePromptSubmit}
                   imagePreview={imagePreview}
                   mode={mode === "text" ? "text" : "image"}
                   disabled={loading || generatingPreview || uploading || editingImage}
                   placeholder={mode === "text" ? "Describe what you want to generate…" : imagePreview ? "Add a prompt to edit the image, or click Create to generate 3D model..." : "Upload an image to generate a 3D model or edit with a prompt..."}
                   isAtBottom={false}
                 />
               </div>
             </div>
           ) : (
             /* Chat Messages View */
             <div className="flex-1 flex flex-col min-h-0">
               {/* Chat Messages Area - Scrollable */}
               <div className="flex-1 overflow-y-auto px-4 py-6 min-h-0">
                 <div className="space-y-4 w-full">
                   {chatMessages.map((message) => renderChatMessage(message))}
                   <div ref={chatEndRef} />
                 </div>
               </div>

               {/* Prompt Box */}
               <div className="pb-6 px-4">
                 <PromptBox
                   value={prompt}
                   onChange={(value) => setPrompt(value)}
                   onImageUpload={handleImageUpload}
                   onSubmit={handlePromptSubmit}
                   imagePreview={imagePreview}
                   mode={mode === "text" ? "text" : "image"}
                   disabled={loading || generatingPreview || uploading || editingImage}
                   placeholder={mode === "text" ? "Describe what you want to generate…" : imagePreview ? "Add a prompt to edit the image, or click Create to generate 3D model..." : "Upload an image to generate a 3D model or edit with a prompt..."}
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
