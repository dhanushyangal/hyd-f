"use client";

import dynamic from "next/dynamic";
import { Suspense, useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import PremiumUserButton from "../../components/PremiumUserButton";
import {
  submitImageTo3D,
  generatePreviewImage,
  registerJobWithPreview,
  editImage,
  combinedEdit,
  uploadImageViaApi,
  fetchHistory,
  fetchWorkspace,
  fetchWorkspaceJobs,
  updateWorkspaceNameApi,
  createWorkspaceApi,
  fetchStatus,
  fetchQueueInfo,
  fetchJobLineage,
  getGlbUrl,
  getProxyGlbUrl,
  notifyGpuOffline,
  BackendJob,
  QueueInfo,
  LineageItem,
} from "../../lib/api";
import { setCurrentWorkspaceId, getCurrentWorkspaceId } from "../../lib/utils";

// Lazy-load ThreeViewer (Three.js is heavy; load only when 3D is shown)
const ThreeViewer = dynamic(() => import("../../components/ThreeViewer").then((m) => ({ default: m.ThreeViewer })), {
  ssr: false,
  loading: () => (
    <div className="flex-1 min-h-0 flex items-center justify-center bg-neutral-100/50">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
        <p className="text-sm text-neutral-500">Loading 3D viewer…</p>
      </div>
    </div>
  ),
});

type InputMode = "text" | "text_1img" | "text_2img";

// Per-mode state so each mode remembers its own prompt and images
interface ModeState {
  prompt: string;
  image1: string | null;
  image2: string | null;
  file1: File | null;
  file2: File | null;
  jobId1: string | null; // Workspace job ID for image1 (null if uploaded from disk)
  jobId2: string | null; // Workspace job ID for image2 (null if uploaded from disk)
}

const defaultModeStates: Record<InputMode, ModeState> = {
  text: { prompt: "", image1: null, image2: null, file1: null, file2: null, jobId1: null, jobId2: null },
  text_1img: { prompt: "", image1: null, image2: null, file1: null, file2: null, jobId1: null, jobId2: null },
  text_2img: { prompt: "", image1: null, image2: null, file1: null, file2: null, jobId1: null, jobId2: null },
};

type CenterView =
  | { type: "empty" }
  | { type: "preview"; imageUrl: string; previewId?: string }
  | { type: "generating"; progress: number; message: string }
  | { type: "3d"; glbUrl: string; jobId: string }
  | { type: "error"; message: string };

interface GeneratingJob {
  jobId: string;
  status: "generating" | "completed" | "failed";
  progress: number;
  glbUrl?: string;
  estimatedTotalSeconds?: number;
  startTime?: number;
  queueInfo?: QueueInfo;
}

export default function WorkspacePageWrapper() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-8 h-8 border-3 border-neutral-300 border-t-black rounded-full animate-spin" />
      </div>
    }>
      <WorkspacePage />
    </Suspense>
  );
}

function WorkspacePage() {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  // Resolve workspace ID from URL or sessionStorage; keep URL as /workspace only.
  // In the same effect, start loading workspace + jobs so we don't wait an extra render.
  useEffect(() => {
    const idFromUrl = searchParams.get("id");
    const id = idFromUrl ?? getCurrentWorkspaceId();
    if (idFromUrl) {
      setCurrentWorkspaceId(idFromUrl);
      window.history.replaceState(null, "", "/workspace");
    }
    setWorkspaceId(id);

    if (!id || !isLoaded || !isSignedIn) return;
    const tokenGetter = async () => (await getToken()) ?? "";
    setLibraryLoading(true);
    Promise.all([
      fetchWorkspace(id, tokenGetter).then((ws) => ws?.name ?? ""),
      fetchWorkspaceJobs(id, tokenGetter),
    ])
      .then(([name, jobs]) => {
        setWorkspaceName(name);
        setLibraryImages(jobs.filter((j) => (j.previewImageUrl || j.imageUrl) && !j.resultGlbUrl).slice(0, 50));
        setLibrary3DAssets(jobs.filter((j) => j.resultGlbUrl).slice(0, 50));
      })
      .catch(() => {})
      .finally(() => setLibraryLoading(false));
  }, [searchParams, isLoaded, isSignedIn, getToken]);

  const [workspaceName, setWorkspaceName] = useState("");
  const workspaceNameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceCreating, setNewWorkspaceCreating] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [modeStates, setModeStates] = useState<Record<InputMode, ModeState>>(defaultModeStates);
  const [centerView, setCenterView] = useState<CenterView>({ type: "empty" });
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Library data
  const [libraryImages, setLibraryImages] = useState<BackendJob[]>([]);
  const [library3DAssets, setLibrary3DAssets] = useState<BackendJob[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  // Generation tracking (for 3D jobs)
  const [currentGenerating, setCurrentGenerating] = useState<GeneratingJob | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track the last generated preview so we can use it for 3D
  const [lastPreviewImageUrl, setLastPreviewImageUrl] = useState<string | null>(null);
  const [lastPreviewId, setLastPreviewId] = useState<string | null>(null);

  // Parent job for iterative prompting lineage
  const [currentParentJobId, setCurrentParentJobId] = useState<string | null>(null);

  // Generation Info panel state (header always visible when job selected; expanded = content open)
  const [selectedJobInfo, setSelectedJobInfo] = useState<BackendJob | null>(null);
  const [jobLineage, setJobLineage] = useState<LineageItem[]>([]);
  const [genInfoExpanded, setGenInfoExpanded] = useState(true);
  const [lineagePreviewItem, setLineagePreviewItem] = useState<LineageItem | null>(null);

  // AI Model selection for 3D generation (Trilles only selectable; Hunyuan 3D and Hanuman coming soon)
  type ModelId = "trilles" | "hunyuan3d" ;
  const [selectedModel, setSelectedModel] = useState<ModelId>("trilles");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const modelOptions: { id: ModelId; label: string; comingSoon?: boolean }[] = [
    { id: "trilles", label: "Trilles" },
    { id: "hunyuan3d", label: "Hunyuan 3D", comingSoon: true },
  ];

  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const libraryPanelRef = useRef<HTMLElement>(null);

  // Sliding & resizable side panels
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const [rightPanelWidth, setRightPanelWidth] = useState(320);
  const [resizingLeft, setResizingLeft] = useState(false);
  const [resizingRight, setResizingRight] = useState(false);
  const resizeStartRef = useRef({ x: 0, leftW: 0, rightW: 0 });

  const MIN_PANEL = 200;
  const MAX_LEFT = 500;
  const MAX_RIGHT = 480;

  useEffect(() => {
    if (!resizingLeft && !resizingRight) return;
    const onMove = (e: MouseEvent) => {
      if (resizingLeft) {
        const delta = e.clientX - resizeStartRef.current.x;
        setLeftPanelWidth((w) => Math.min(MAX_LEFT, Math.max(MIN_PANEL, resizeStartRef.current.leftW + delta)));
      }
      if (resizingRight) {
        const delta = resizeStartRef.current.x - e.clientX;
        setRightPanelWidth((w) => Math.min(MAX_RIGHT, Math.max(MIN_PANEL, resizeStartRef.current.rightW + delta)));
      }
    };
    const onUp = () => {
      setResizingLeft(false);
      setResizingRight(false);
    };
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [resizingLeft, resizingRight]);

  // Current mode's state
  const current = modeStates[inputMode];
  const prompt = current.prompt;
  const image1 = current.image1;
  const image2 = current.image2;
  const file1 = current.file1;
  const file2 = current.file2;
  const jobId1 = current.jobId1;
  const jobId2 = current.jobId2;

  // Helper to update the current mode's state
  const updateCurrentMode = useCallback(
    (updates: Partial<ModeState>) => {
      setModeStates((prev) => ({
        ...prev,
        [inputMode]: { ...prev[inputMode], ...updates },
      }));
    },
    [inputMode]
  );

  const setPrompt = useCallback(
    (value: string) => updateCurrentMode({ prompt: value }),
    [updateCurrentMode]
  );
  const setImage1 = useCallback(
    (url: string | null) => updateCurrentMode({ image1: url }),
    [updateCurrentMode]
  );
  const setImage2 = useCallback(
    (url: string | null) => updateCurrentMode({ image2: url }),
    [updateCurrentMode]
  );
  const setFile1 = useCallback(
    (f: File | null) => updateCurrentMode({ file1: f }),
    [updateCurrentMode]
  );
  const setFile2 = useCallback(
    (f: File | null) => updateCurrentMode({ file2: f }),
    [updateCurrentMode]
  );
  const setJobId1 = useCallback(
    (id: string | null) => updateCurrentMode({ jobId1: id }),
    [updateCurrentMode]
  );
  const setJobId2 = useCallback(
    (id: string | null) => updateCurrentMode({ jobId2: id }),
    [updateCurrentMode]
  );

  // Auto-save workspace name (debounced)
  const handleWorkspaceNameChange = useCallback(
    (newName: string) => {
      setWorkspaceName(newName);
      if (!workspaceId) return;
      if (workspaceNameTimeoutRef.current) clearTimeout(workspaceNameTimeoutRef.current);
      workspaceNameTimeoutRef.current = setTimeout(async () => {
        if (newName.trim()) {
          try {
            const tokenGetter = async () => await getToken();
            await updateWorkspaceNameApi(workspaceId, newName.trim(), tokenGetter);
          } catch { /* non-critical */ }
        }
      }, 800);
    },
    [workspaceId, getToken]
  );

  const handleCreateNewWorkspace = useCallback(async () => {
    const name = newWorkspaceName.trim();
    if (!name || newWorkspaceCreating) return;
    setNewWorkspaceCreating(true);
    try {
      const tokenGetter = async () => await getToken();
      const ws = await createWorkspaceApi(name, tokenGetter);
      setShowNewWorkspaceModal(false);
      setNewWorkspaceName("");
      setCurrentWorkspaceId(ws.id);
      router.push("/workspace");
    } catch (err) {
      console.error("Failed to create workspace:", err);
    } finally {
      setNewWorkspaceCreating(false);
    }
  }, [newWorkspaceName, newWorkspaceCreating, getToken, router]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (workspaceNameTimeoutRef.current) clearTimeout(workspaceNameTimeoutRef.current);
    };
  }, []);

  // ──────────── Refresh library helper ────────────
  // Only show images/3D assets that belong to this workspace (never show all user history here)
  const refreshLibrary = useCallback(async () => {
    try {
      if (!workspaceId) {
        setLibraryImages([]);
        setLibrary3DAssets([]);
        return;
      }
      const tokenGetter = async () => await getToken();
      const jobs = await fetchWorkspaceJobs(workspaceId, tokenGetter);
      setLibraryImages(jobs.filter((j) => (j.previewImageUrl || j.imageUrl) && !j.resultGlbUrl).slice(0, 50));
      setLibrary3DAssets(jobs.filter((j) => j.resultGlbUrl).slice(0, 50));
    } catch { /* ignore */ }
  }, [getToken, workspaceId]);

  // Workspace + jobs are loaded in the same effect that resolves workspaceId (above)
  // so we don't wait an extra render. refreshLibrary() is still used for manual refresh.

  // ──────────── Poll for generating 3D job ────────────
  useEffect(() => {
    if (!currentGenerating || currentGenerating.status !== "generating") return;

    let consecutiveFailures = 0;
    const MAX_FAILURES = 5;

    const pollStatus = async () => {
      try {
        const status = await fetchStatus(currentGenerating.jobId);
        consecutiveFailures = 0;

        if (status.queue) {
          const estimatedTotal = status.queue.estimated_total_seconds || currentGenerating.estimatedTotalSeconds || 130;
          setCurrentGenerating((prev) =>
            prev ? { ...prev, queueInfo: status.queue, estimatedTotalSeconds: estimatedTotal } : null
          );
          const startTime = status.created_at || currentGenerating.startTime || Date.now();
          const elapsedSeconds = (Date.now() - startTime) / 1000;

          if (status.queue.position > 0) {
            const waitProgress = Math.min(45, (elapsedSeconds / status.queue.estimated_wait_seconds) * 45);
            setCenterView({ type: "generating", progress: waitProgress, message: `Waiting in queue (position ${status.queue.position})...` });
          } else {
            const waitTime = status.queue.estimated_wait_seconds || 0;
            const processingElapsed = Math.max(0, elapsedSeconds - waitTime);
            const processingDuration = estimatedTotal - waitTime;
            const progress = 50 + (processingElapsed / processingDuration) * 45;
            setCenterView({ type: "generating", progress: Math.max(50, Math.min(95, progress)), message: "Generating 3D model..." });
          }
        }

        if (status.status === "completed") {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          const glbUrl = getGlbUrl(status);
          setCurrentGenerating((prev) =>
            prev ? { ...prev, status: "completed", progress: 100, glbUrl: glbUrl || undefined } : null
          );
          setCenterView({
            type: "3d",
            glbUrl: glbUrl || getProxyGlbUrl(currentGenerating.jobId),
            jobId: currentGenerating.jobId,
          });
          refreshLibrary();

          // Update generation info panel for the completed 3D job
          const completed3DJob: BackendJob = {
            id: currentGenerating.jobId,
            resultGlbUrl: glbUrl || getProxyGlbUrl(currentGenerating.jobId),
            previewImageUrl: lastPreviewImageUrl || null,
            prompt: selectedJobInfo?.prompt || null,
            status: "DONE" as const,
            generateType: "Hunyuan3D",
            parentJobId: lastPreviewId,
            createdAt: new Date().toISOString(),
            userId: null, imageUrl: null, faceCount: null, enablePBR: false, polygonType: null, errorCode: null, errorMessage: null, updatedAt: new Date().toISOString(),
          };
          loadJobInfo(completed3DJob);
        } else if (status.status === "failed") {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          setCurrentGenerating((prev) => (prev ? { ...prev, status: "failed" } : null));
          setCenterView({ type: "error", message: status.error || "Generation failed" });
        }
      } catch {
        consecutiveFailures++;
        if (consecutiveFailures >= MAX_FAILURES) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          setCurrentGenerating((prev) => (prev ? { ...prev, status: "failed" } : null));
          setCenterView({ type: "error", message: "Lost connection to server" });
        }
      }
    };

    const interval = setInterval(pollStatus, 3000);
    pollStatus();
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGenerating?.jobId, currentGenerating?.status]);

  // ──────────── File handling ────────────
  const handleDrop = useCallback(
    (e: React.DragEvent, slot: 1 | 2) => {
      e.preventDefault();
      setIsDragging(false);

      // Check if dragged from the library panel (has job-id data)
      const draggedJobId = e.dataTransfer.getData("application/job-id");
      const draggedImageUrl = e.dataTransfer.getData("text/uri-list");
      if (draggedJobId && draggedImageUrl) {
        // Dropped from library — use URL, track parent job ID, clear file
        if (slot === 1) { setImage1(draggedImageUrl); setFile1(null); setJobId1(draggedJobId); }
        else            { setImage2(draggedImageUrl); setFile2(null); setJobId2(draggedJobId); }
        return;
      }

      // Dropped from file system
      const file = e.dataTransfer.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      if (slot === 1) { setImage1(url); setFile1(file); setJobId1(null); }
      else            { setImage2(url); setFile2(file); setJobId2(null); }
    },
    [setImage1, setImage2, setFile1, setFile2, setJobId1, setJobId2]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent, slot: 1 | 2) => {
      const file = e.clipboardData.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      const url = URL.createObjectURL(file);
      if (slot === 1) { setImage1(url); setFile1(file); setJobId1(null); }
      else { setImage2(url); setFile2(file); setJobId2(null); }
    },
    [setImage1, setImage2, setFile1, setFile2, setJobId1, setJobId2]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, slot: 1 | 2) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      if (slot === 1) { setImage1(url); setFile1(file); setJobId1(null); }
      else { setImage2(url); setFile2(file); setJobId2(null); }
      e.target.value = "";
    },
    [setImage1, setImage2, setFile1, setFile2, setJobId1, setJobId2]
  );

  const handleClearImage = useCallback(
    (slot: 1 | 2) => {
      if (slot === 1) { setImage1(null); setFile1(null); setJobId1(null); }
      else { setImage2(null); setFile2(null); setJobId2(null); }
    },
    [setImage1, setImage2, setFile1, setFile2, setJobId1, setJobId2]
  );

  // Helper: start 3D generation from image URL (used after image gen or when we already have preview)
  const start3DFromImage = useCallback(
    async (imageUrl: string, previewId: string | null) => {
      const tokenGetter = async () => await getToken();
      setLoading(true);
      setCenterView({ type: "generating", progress: 0, message: "Generating 3D model..." });
      let queueInfo: QueueInfo | null = null;
      try {
        queueInfo = await fetchQueueInfo();
      } catch (err: unknown) {
        const msg = err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message) : "";
        if (msg?.includes("GPU is currently offline")) {
          notifyGpuOffline(msg, tokenGetter);
          setCenterView({ type: "error", message: msg });
        } else {
          setCenterView({ type: "error", message: "Failed to get queue info" });
        }
        setLoading(false);
        return;
      }
      const estimatedTotal = queueInfo?.estimated_total_seconds || 130;
      try {
        const result = await submitImageTo3D(imageUrl, null, tokenGetter, previewId, null, workspaceId, previewId);
        setCurrentGenerating({
          jobId: result.job_id,
          status: "generating",
          progress: 0,
          estimatedTotalSeconds: estimatedTotal,
          startTime: Date.now(),
          queueInfo: queueInfo || undefined,
        });
      } catch (err: unknown) {
        const msg = err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message) : "Failed to start 3D";
        setCenterView({ type: "error", message: msg });
      }
      setLoading(false);
    },
    [getToken, workspaceId]
  );

  // ──────────── STEP 1: Generate Image (optionally then 3D) ────────────
  const handleGenerateImage = async (thenGenerate3D?: boolean) => {
    if (loading || generatingPreview) return;
    setError(null);
    if (!thenGenerate3D) {
      setLastPreviewImageUrl(null);
      setLastPreviewId(null);
    }

    const tokenGetter = async () => await getToken();

    // ── Text-only: /text-to-image (generatePreviewImage) ──
    if (inputMode === "text") {
      if (!prompt.trim()) { setError("Please enter a prompt"); return; }

      setGeneratingPreview(true);
      setCenterView({ type: "generating", progress: 0, message: "Generating image from text..." });

      let queueInfo: QueueInfo | null = null;
      try { queueInfo = await fetchQueueInfo(); } catch (err: any) {
        if (err.message?.includes("GPU is currently offline")) {
          notifyGpuOffline(err.message, tokenGetter);
          setCenterView({ type: "error", message: err.message });
          setGeneratingPreview(false);
          return;
        }
      }

      const estimatedTime = (queueInfo?.estimated_wait_seconds || 0) + 20;
      const startTime = Date.now();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(90, (elapsed / estimatedTime) * 95);
        setCenterView({ type: "generating", progress, message: "Generating image from text..." });
      }, 200);

      try {
        const result = await generatePreviewImage(prompt.trim(), tokenGetter);
        if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }

        setLastPreviewImageUrl(result.image_url);
        setLastPreviewId(result.preview_id);
        setCurrentParentJobId(result.preview_id); // This new image becomes parent for next iteration
        setCenterView({ type: "preview", imageUrl: result.image_url, previewId: result.preview_id });
        setGeneratingPreview(false);

        // Auto-select the new image in the right panel for next action
        setInputMode("text_1img");
        setModeStates((prev) => ({
          ...prev,
          text_1img: {
            ...prev.text_1img,
            image1: result.image_url,
            file1: null,
            jobId1: result.preview_id,
            prompt: prev.text_1img.prompt ?? "", // Keep prompt; new image is selected
          },
        }));

        // Text-only: no parent (root job)
        try { await registerJobWithPreview(result.preview_id, result.image_url, prompt.trim(), tokenGetter, null, null, workspaceId, null); } catch { /* non-critical */ }
        refreshLibrary();

        // Update generation info panel
        const newJob = { id: result.preview_id, previewImageUrl: result.image_url, prompt: prompt.trim(), status: "DONE" as const, generateType: "TextToImage", createdAt: new Date().toISOString(), userId: null, imageUrl: null, faceCount: null, enablePBR: false, polygonType: null, resultGlbUrl: null, errorCode: null, errorMessage: null, updatedAt: new Date().toISOString() } satisfies BackendJob;
        loadJobInfo(newJob);

        if (thenGenerate3D) await start3DFromImage(result.image_url, result.preview_id);
      } catch (err: any) {
        if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }
        setCenterView({ type: "error", message: err.message || "Failed to generate image" });
        setGeneratingPreview(false);
      }
      return;
    }

    // ── Text + 1 image: /edit-image (image-to-image), or image-to-3D when no prompt ──
    if (inputMode === "text_1img") {
      if (!file1 && !image1) { setError("Please upload an image"); return; }

      // No prompt: use this image directly for 3D (set as preview, then start 3D if requested)
      if (!prompt.trim()) {
        setError(null);
        try {
          const srcUrl = file1
            ? await uploadImageViaApi(file1, tokenGetter)
            : (image1 ?? null);
          if (!srcUrl) return;
          setLastPreviewImageUrl(srcUrl);
          setLastPreviewId(jobId1 || null);
          setCurrentParentJobId(jobId1 || null);
          setCenterView({ type: "preview", imageUrl: srcUrl, previewId: jobId1 || undefined });
          if (thenGenerate3D) {
            await start3DFromImage(srcUrl, jobId1 || null);
          }
        } catch (err: any) {
          setCenterView({ type: "error", message: err.message || "Failed to use image for 3D" });
        }
        return;
      }

      setGeneratingPreview(true);
      setCenterView({ type: "generating", progress: 0, message: "Editing image..." });

      const estimatedTime = 30;
      const startTime = Date.now();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(90, (elapsed / estimatedTime) * 95);
        setCenterView({ type: "generating", progress, message: "Editing image..." });
      }, 200);

      try {
        // Resolve source image URL via gateway API → S3 (so source_images is never blob URL)
        const srcUrl = file1
          ? await uploadImageViaApi(file1, tokenGetter)
          : (image1 ?? null);
        const editSrcImages = srcUrl ? [srcUrl] : [];

        const result = await editImage(prompt.trim(), file1, image1, tokenGetter);
        if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }

        const editParent = jobId1 || currentParentJobId; // The image being edited is the parent
        const editParentIds = editParent ? [editParent] : [];

        setLastPreviewImageUrl(result.image_url);
        setLastPreviewId(result.edit_id);
        setCurrentParentJobId(result.edit_id); // This new edit becomes parent for next iteration
        setCenterView({ type: "preview", imageUrl: result.image_url, previewId: result.edit_id });
        setGeneratingPreview(false);

        // Auto-select the new image in the right panel for next action
        setInputMode("text_1img");
        setModeStates((prev) => ({
          ...prev,
          text_1img: {
            ...prev.text_1img,
            image1: result.image_url,
            file1: null,
            jobId1: result.edit_id,
            prompt: prev.text_1img.prompt ?? "",
          },
        }));

        try { await registerJobWithPreview(result.edit_id, result.image_url, prompt.trim(), tokenGetter, null, "EditImage", workspaceId, editParent, editParentIds, editSrcImages); } catch { /* non-critical */ }
        refreshLibrary();

        // Update generation info panel
        const editedJob = { id: result.edit_id, previewImageUrl: result.image_url, prompt: prompt.trim(), status: "DONE" as const, generateType: "EditImage", parentJobId: editParent, parentJobIds: editParentIds, sourceImages: editSrcImages, createdAt: new Date().toISOString(), userId: null, imageUrl: null, faceCount: null, enablePBR: false, polygonType: null, resultGlbUrl: null, errorCode: null, errorMessage: null, updatedAt: new Date().toISOString() } satisfies BackendJob;
        loadJobInfo(editedJob);

        if (thenGenerate3D) await start3DFromImage(result.image_url, result.edit_id);
      } catch (err: any) {
        if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }
        setCenterView({ type: "error", message: err.message || "Failed to edit image" });
        setGeneratingPreview(false);
      }
      return;
    }

    // ── Text + 2 images: /combined-edit ──
    if (inputMode === "text_2img") {
      // Need either a file or a URL for each slot
      const hasImage1 = file1 || image1;
      const hasImage2 = file2 || image2;
      if (!hasImage1 || !hasImage2) { setError("Please provide both images"); return; }
      if (!prompt.trim()) { setError("Please enter a prompt"); return; }

      setGeneratingPreview(true);
      setCenterView({ type: "generating", progress: 0, message: "Combining images..." });

      const estimatedTime = 40;
      const startTime = Date.now();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(90, (elapsed / estimatedTime) * 95);
        setCenterView({ type: "generating", progress, message: "Combining images..." });
      }, 200);

      try {
        // Resolve source image URLs via gateway API → S3 (so source_images are always S3 URLs, not localhost)
        let url1: string;
        let url2: string;
        if (file1) {
          url1 = await uploadImageViaApi(file1, tokenGetter);
        } else {
          url1 = image1!; // from library (already S3 or proxy URL)
        }
        if (file2) {
          url2 = await uploadImageViaApi(file2, tokenGetter);
        } else {
          url2 = image2!; // from library
        }
        const srcImages: string[] = [url1, url2];

        // Send files if available, otherwise URLs (from workspace library)
        const result = await combinedEdit(
          prompt.trim(),
          file1,
          file2,
          tokenGetter,
          file1 ? null : image1,  // URL for slot 1 if no file
          file2 ? null : image2   // URL for slot 2 if no file
        );
        if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }

        // Build multi-parent list from slot job IDs
        const parentIds: string[] = [];
        if (jobId1) parentIds.push(jobId1);
        if (jobId2) parentIds.push(jobId2);
        const primaryParent = jobId1 || jobId2 || currentParentJobId;

        setLastPreviewImageUrl(result.image_url);
        setLastPreviewId(result.combined_id);
        setCurrentParentJobId(result.combined_id); // This new combined image becomes parent for next iteration
        setCenterView({ type: "preview", imageUrl: result.image_url, previewId: result.combined_id });
        setGeneratingPreview(false);

        // Auto-select the new image in the right panel for next action
        setInputMode("text_1img");
        setModeStates((prev) => ({
          ...prev,
          text_1img: {
            ...prev.text_1img,
            image1: result.image_url,
            file1: null,
            jobId1: result.combined_id,
            prompt: prev.text_1img.prompt ?? "",
          },
        }));

        try {
          await registerJobWithPreview(
            result.combined_id, result.image_url, prompt.trim(), tokenGetter,
            null, "Combined", workspaceId,
            primaryParent,       // single parent (backward-compat)
            parentIds,           // multi-parent IDs
            srcImages            // actual source image URLs
          );
        } catch { /* non-critical */ }
        refreshLibrary();

        // Update generation info panel
        const combinedJob = {
          id: result.combined_id, previewImageUrl: result.image_url, prompt: prompt.trim(),
          status: "DONE" as const, generateType: "Combined",
          parentJobId: primaryParent, parentJobIds: parentIds, sourceImages: srcImages,
          createdAt: new Date().toISOString(), userId: null, imageUrl: null,
          faceCount: null, enablePBR: false, polygonType: null, resultGlbUrl: null,
          errorCode: null, errorMessage: null, updatedAt: new Date().toISOString(),
        } satisfies BackendJob;
        loadJobInfo(combinedJob);

        if (thenGenerate3D) await start3DFromImage(result.image_url, result.combined_id);
      } catch (err: any) {
        if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }
        setCenterView({ type: "error", message: err.message || "Failed to combine images" });
        setGeneratingPreview(false);
      }
    }
  };

  // ──────────── Generate 3D: from current preview, or generate image first then 3D ────────────
  const handleGenerate3D = async () => {
    setError(null);
    if (lastPreviewImageUrl) {
      await start3DFromImage(lastPreviewImageUrl, lastPreviewId);
      return;
    }
    // No preview: generate image first (using current mode), then 3D
    await handleGenerateImage(true);
  };

  // ──────────── Generation Info helpers ────────────
  const loadJobInfo = useCallback(async (job: BackendJob) => {
    setSelectedJobInfo(job);
    setGenInfoExpanded(true);
    // Fetch lineage in background
    try {
      const lineage = await fetchJobLineage(job.id, getToken);
      setJobLineage(lineage);
    } catch {
      setJobLineage([]);
    }
  }, [getToken]);

  // ──────────── Library click handlers ────────────
  const handleImageClick = (job: BackendJob) => {
    const imageUrl = job.previewImageUrl || job.imageUrl;
    if (!imageUrl) return;

    // If we're in text_2img mode, fill the next empty slot instead of switching modes
    if (inputMode === "text_2img") {
      setModeStates((prev) => {
        const cur = prev.text_2img;
        if (!cur.image1) {
          return { ...prev, text_2img: { ...cur, image1: imageUrl, file1: null, jobId1: job.id } };
        } else if (!cur.image2) {
          return { ...prev, text_2img: { ...cur, image2: imageUrl, file2: null, jobId2: job.id } };
        } else {
          // Both slots full — replace slot 1
          return { ...prev, text_2img: { ...cur, image1: imageUrl, file1: null, jobId1: job.id } };
        }
      });
      // Show preview and set parent
      setLastPreviewImageUrl(imageUrl);
      setLastPreviewId(job.id);
      setCurrentParentJobId(job.id);
      setCenterView({ type: "preview", imageUrl, previewId: job.id });
      loadJobInfo(job);
      return;
    }

    // Default behavior: switch to text_1img mode
    setLastPreviewImageUrl(imageUrl);
    setLastPreviewId(job.id);
    setCurrentParentJobId(job.id); // This library image becomes parent for next edit/3D
    setCenterView({ type: "preview", imageUrl, previewId: job.id });
    setInputMode("text_1img");
    setModeStates((prev) => ({
      ...prev,
      text_1img: {
        ...prev.text_1img,
        image1: imageUrl,
        file1: null,
        jobId1: job.id,
        prompt: prev.text_1img.prompt ?? "", // Keep current prompt; only select the image
      },
    }));
    // Load generation info for this job
    loadJobInfo(job);
  };

  const handle3DClick = (job: BackendJob) => {
    if (job.resultGlbUrl) {
      setCenterView({ type: "3d", glbUrl: getProxyGlbUrl(job.id), jobId: job.id });
      // Load generation info for this 3D job
      loadJobInfo(job);
    }
  };

  /** Build minimal BackendJob from LineageItem for loadJobInfo / handle3DClick */
  const lineageItemToJob = useCallback((item: LineageItem): BackendJob => ({
    id: item.id,
    userId: null,
    status: (item.status as BackendJob["status"]) || "DONE",
    prompt: item.prompt ?? null,
    imageUrl: null,
    generateType: item.generateType || "Normal",
    faceCount: null,
    enablePBR: false,
    polygonType: null,
    resultGlbUrl: item.resultGlbUrl ?? null,
    previewImageUrl: item.previewImageUrl ?? null,
    errorCode: null,
    errorMessage: null,
    createdAt: item.createdAt,
    updatedAt: item.createdAt,
    parentJobId: item.parentJobId ?? null,
    parentJobIds: item.parentJobIds ?? [],
    sourceImages: item.sourceImages ?? null,
  }), []);

  /** Click a lineage step: show in center (3D or preview) and allow "continue from here" */
  const handleLineageStepClick = useCallback((item: LineageItem) => {
    const job = lineageItemToJob(item);
    if (item.resultGlbUrl) {
      handle3DClick(job);
      return;
    }
    const imageUrl = item.previewImageUrl ?? (item as { imageUrl?: string }).imageUrl;
    if (imageUrl) {
      setLastPreviewImageUrl(imageUrl);
      setLastPreviewId(item.id);
      setCurrentParentJobId(item.id);
      setCenterView({ type: "preview", imageUrl, previewId: item.id });
      setInputMode("text_1img");
      setModeStates((prev) => ({
        ...prev,
        text_1img: {
          ...prev.text_1img,
          image1: imageUrl,
          file1: null,
          jobId1: item.id,
          prompt: prev.text_1img.prompt ?? "", // Keep current prompt; only select the image
        },
      }));
    }
    loadJobInfo(job);
  }, [lineageItemToJob, loadJobInfo]);

  // ──────────── Filtered library ────────────
  const filteredImages = libraryImages.filter((a) =>
    (a.prompt || a.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filtered3DAssets = library3DAssets.filter((a) =>
    (a.prompt || a.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isGenerating = loading || generatingPreview || (currentGenerating?.status === "generating");
  const showGenerate3DButton = centerView.type === "preview" && lastPreviewImageUrl && !isGenerating;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-neutral-50 text-black">
      {/* Top bar */}
      <header className="flex-shrink-0 z-20 flex items-center justify-between px-4 py-3 bg-white border-b border-neutral-100">
        <div className="flex-1 min-w-0 flex items-center">
          <Link href="/" className="text-xl font-bold text-black tracking-tight">Hydrilla</Link>
        </div>
        <div className="flex-1 flex justify-center min-w-0 px-4">
          <input
            type="text"
            value={workspaceName}
            onChange={(e) => handleWorkspaceNameChange(e.target.value)}
            placeholder="Name your workspace"
            className="w-full max-w-md text-center text-lg font-semibold text-black bg-transparent border-none outline-none placeholder:text-neutral-400 focus:ring-0"
          />
        </div>
        <div className="flex-1 flex items-center justify-end gap-4 min-w-0">
          <button
            type="button"
            onClick={() => {
              setNewWorkspaceName("");
              setShowNewWorkspaceModal(true);
            }}
            className="text-sm font-medium text-black hover:text-neutral-600 shrink-0"
          >
            New Workspace
          </button>
          <Link href="/library" className="text-sm font-medium text-black hover:text-neutral-600 shrink-0">My Library</Link>
          <PremiumUserButton />
        </div>
      </header>

      {/* New Workspace name modal */}
      {showNewWorkspaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => !newWorkspaceCreating && setShowNewWorkspaceModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold text-black mb-2">New Workspace</h2>
            <p className="text-sm text-neutral-500 mb-4">Give your workspace a name to get started.</p>
            <input
              type="text"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="e.g. My Project, Character Pack"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-black placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black/10 mb-4"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newWorkspaceName.trim()) handleCreateNewWorkspace();
                }
                if (e.key === "Escape") setShowNewWorkspaceModal(false);
              }}
              autoFocus
              disabled={newWorkspaceCreating}
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => !newWorkspaceCreating && setShowNewWorkspaceModal(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-black transition-colors"
                disabled={newWorkspaceCreating}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewWorkspace}
                disabled={!newWorkspaceName.trim() || newWorkspaceCreating}
                className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-neutral-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {newWorkspaceCreating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lineage item preview popup — click Creation Lineage step to preview; Select shows in main view */}
      {lineagePreviewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setLineagePreviewItem(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 border-b border-neutral-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-black">
                {lineagePreviewItem.generateType?.replace(/_/g, " ") || "Image"}
                {lineagePreviewItem.resultGlbUrl && " (3D)"}
              </span>
              <button
                type="button"
                onClick={() => setLineagePreviewItem(null)}
                className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-auto p-4 flex flex-col items-center">
              {lineagePreviewItem.previewImageUrl ? (
                <img
                  src={lineagePreviewItem.previewImageUrl}
                  alt="Preview"
                  className="max-w-full max-h-[50vh] w-auto h-auto object-contain rounded-lg border border-neutral-200 bg-neutral-50"
                />
              ) : lineagePreviewItem.resultGlbUrl && lineagePreviewItem.sourceImages?.[0] ? (
                <img
                  src={lineagePreviewItem.sourceImages[0]}
                  alt="Source"
                  className="max-w-full max-h-[50vh] w-auto h-auto object-contain rounded-lg border border-neutral-200 bg-neutral-50"
                />
              ) : (
                <div className="w-48 h-48 rounded-lg border border-neutral-200 bg-neutral-100 flex items-center justify-center">
                  <svg className="w-12 h-12 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
                </div>
              )}
              {lineagePreviewItem.prompt && (
                <p className="text-xs text-neutral-500 mt-3 text-center line-clamp-2 w-full" title={lineagePreviewItem.prompt}>{lineagePreviewItem.prompt}</p>
              )}
            </div>
            <div className="p-4 border-t border-neutral-100 flex gap-3">
              <button
                type="button"
                onClick={() => setLineagePreviewItem(null)}
                className="flex-1 py-2.5 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleLineageStepClick(lineagePreviewItem);
                  setLineagePreviewItem(null);
                }}
                className="flex-1 py-2.5 text-sm font-semibold text-white bg-black rounded-xl hover:bg-neutral-800 transition-colors"
              >
                Select
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3-panel layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Left panel toggle tab when collapsed */}
        {!leftPanelOpen && (
          <button
            type="button"
            onClick={() => setLeftPanelOpen(true)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-6 h-14 flex items-center justify-center bg-white border border-r-0 border-neutral-200 rounded-r-lg shadow-sm hover:bg-neutral-50 transition-colors"
            title="Open library"
            aria-label="Open library panel"
          >
            <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        )}

        {/* Left Panel - Library (sliding & resizable) */}
        <aside
          ref={libraryPanelRef}
          style={{ width: leftPanelOpen ? leftPanelWidth : 0, minWidth: leftPanelOpen ? leftPanelWidth : 0 }}
          className="flex-shrink-0 flex flex-col bg-white border-r border-neutral-200 overflow-hidden transition-[width] duration-200 ease-out"
        >
          <div className="flex h-full min-w-0">
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="p-3 border-b border-neutral-100 flex items-center gap-2">
            <button type="button" onClick={() => setLeftPanelOpen(false)} className="p-1 rounded hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors shrink-0" title="Close library" aria-label="Close library panel">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div className="relative flex-1 min-w-0">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search my generation"
                className="w-full pl-9 pr-3 py-2 rounded-lg bg-neutral-50 border border-neutral-200 text-black placeholder:text-neutral-400 text-sm focus:border-black focus:ring-1 focus:ring-black/10"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-6">
            {/* Images */}
            <div>
              <Link href="/library" className="flex items-center justify-between group mb-2">
                <h3 className="text-sm font-semibold text-black">Images</h3>
                <svg className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 hide-scrollbar">
                {libraryLoading ? (
                  <div className="flex items-center justify-center w-full min-h-[100px]"><div className="w-5 h-5 border-2 border-neutral-300 border-t-black rounded-full animate-spin" /></div>
                ) : filteredImages.length === 0 ? (
                  <div className="flex items-center justify-center w-full min-h-[100px] rounded-lg bg-neutral-50 border border-dashed border-neutral-200 text-neutral-400 text-sm">No images yet</div>
                ) : (
                  filteredImages.map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => {
                        const imgUrl = item.previewImageUrl || item.imageUrl || "";
                        e.dataTransfer.setData("application/job-id", item.id);
                        e.dataTransfer.setData("text/uri-list", imgUrl);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      onClick={() => handleImageClick(item)}
                      className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-neutral-200 hover:border-black/30 transition-colors cursor-pointer bg-neutral-100 flex items-center justify-center"
                    >
                      {(item.previewImageUrl || item.imageUrl) ? (
                        <img src={item.previewImageUrl || item.imageUrl || ""} alt={item.prompt || "Image"} className="w-full h-full object-cover pointer-events-none" />
                      ) : (
                        <span className="text-neutral-500 text-xs text-center px-1 truncate max-w-full">{item.prompt || "Image"}</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
            {/* 3D Assets */}
            <div>
              <Link href="/library" className="flex items-center justify-between group mb-2">
                <h3 className="text-sm font-semibold text-black">3D Assets</h3>
                <svg className="w-4 h-4 text-neutral-400 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 hide-scrollbar">
                {libraryLoading ? (
                  <div className="flex items-center justify-center w-full min-h-[100px]"><div className="w-5 h-5 border-2 border-neutral-300 border-t-black rounded-full animate-spin" /></div>
                ) : filtered3DAssets.length === 0 ? (
                  <div className="flex items-center justify-center w-full min-h-[100px] rounded-lg bg-neutral-50 border border-dashed border-neutral-200 text-neutral-400 text-sm">No 3D assets yet</div>
                ) : (
                  filtered3DAssets.map((item) => (
                    <div key={item.id} onClick={() => handle3DClick(item)} className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-neutral-200 hover:border-black/30 transition-colors cursor-pointer bg-neutral-100 flex items-center justify-center">
                      {item.previewImageUrl ? (
                        <img src={item.previewImageUrl} alt={item.prompt || "3D Asset"} className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-neutral-400">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                          <span className="text-[10px] mt-0.5">3D</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
            </div>
            {/* Left resize handle */}
            {leftPanelOpen && (
              <div
                role="separator"
                aria-orientation="vertical"
                onMouseDown={(e) => {
                  e.preventDefault();
                  resizeStartRef.current = { x: e.clientX, leftW: leftPanelWidth, rightW: rightPanelWidth };
                  setResizingLeft(true);
                }}
                className={`w-1 flex-shrink-0 bg-transparent hover:bg-neutral-200 active:bg-black/20 cursor-col-resize transition-colors ${resizingLeft ? "bg-black/20" : ""}`}
              />
            )}
          </div>
        </aside>

        {/* Center - Preview / 3D / generating */}
        <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-neutral-50 overflow-y-auto">
          {centerView.type === "empty" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-24 h-24 mb-6 grid grid-cols-2 gap-1 text-black/70">
                <div className="rounded-sm bg-current opacity-60 [clip-path:polygon(50%_0%,100%_100%,0%_100%)]" />
                <div className="rounded-sm bg-current opacity-60" />
                <div className="rounded-full bg-current opacity-60" />
                <div className="rounded-sm bg-current opacity-60 rotate-45" />
              </div>
              <h2 className="text-xl font-semibold text-black mb-2">What will you create today?</h2>
              <p className="text-neutral-500 max-w-sm mb-6">Start with a text prompt, or pick an image from the library to edit or turn into 3D.</p>
              <div className="flex flex-wrap gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => promptTextareaRef.current?.focus()}
                  className="px-4 py-2.5 text-sm font-medium text-black bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Write a prompt
                </button>
              </div>
            </div>
          )}

          {centerView.type === "preview" && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 min-h-0 flex items-center justify-center p-4 bg-neutral-100/50">
                <div className="relative w-full max-w-full h-full max-h-full rounded-xl overflow-hidden border border-neutral-200 shadow-lg bg-white flex items-center justify-center">
                  <img src={centerView.imageUrl} alt="Preview" className="max-w-full max-h-full w-auto h-auto object-contain" />
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 p-3 border-t border-neutral-100 bg-white">
                {showGenerate3DButton ? (
                  <button
                    type="button"
                    onClick={handleGenerate3D}
                    className="px-6 py-2.5 rounded-xl font-semibold text-white bg-black hover:bg-neutral-800 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Generate 3D Model
                  </button>
                ) : (
                  <span className="text-sm text-neutral-500">Image preview</span>
                )}
              </div>
            </div>
          )}

          {centerView.type === "generating" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 mb-4 border-4 border-neutral-200 border-t-black rounded-full animate-spin" />
              <p className="text-sm font-medium text-black mb-3">{centerView.message}</p>
              <div className="w-64 h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div className="h-full bg-black rounded-full transition-all duration-500" style={{ width: `${Math.min(centerView.progress, 100)}%` }} />
              </div>
              <p className="text-xs text-neutral-500 mt-2">{Math.round(centerView.progress)}%</p>
            </div>
          )}

          {centerView.type === "3d" && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 min-h-0"><ThreeViewer glbUrl={centerView.glbUrl} /></div>
              <div className="flex items-center justify-center gap-3 p-3 border-t border-neutral-100 bg-white flex-wrap">
                <a href={centerView.glbUrl} download className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors">Download GLB</a>
                <Link href={`/viewer?jobId=${centerView.jobId}`} className="px-4 py-2 text-sm bg-neutral-100 text-black rounded-lg hover:bg-neutral-200 transition-colors">Full View</Link>
                {selectedJobInfo?.sourceImages?.[0] && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        const src = selectedJobInfo!.sourceImages![0];
                        setLastPreviewImageUrl(src);
                        setLastPreviewId(null);
                        setCenterView({ type: "preview", imageUrl: src });
                      }}
                      className="px-4 py-2 text-sm bg-neutral-100 text-black rounded-lg hover:bg-neutral-200 transition-colors"
                    >
                      Create another 3D
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const src = selectedJobInfo!.sourceImages![0];
                        setLastPreviewImageUrl(src);
                        setLastPreviewId(null);
                        setCenterView({ type: "preview", imageUrl: src });
                        setInputMode("text_1img");
                        setModeStates((prev) => ({
                          ...prev,
                          text_1img: {
                            ...prev.text_1img,
                            image1: src,
                            file1: null,
                            jobId1: null,
                            prompt: prev.text_1img.prompt || "",
                          },
                        }));
                      }}
                      className="px-4 py-2 text-sm bg-neutral-100 text-black rounded-lg hover:bg-neutral-200 transition-colors"
                    >
                      Edit this image
                    </button>
                  </>
                )}
              </div>
            </div>
          )}

          {centerView.type === "error" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-red-50 flex items-center justify-center">
                <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-sm text-red-600 mb-4">{centerView.message}</p>
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  if (lastPreviewImageUrl && lastPreviewId) {
                    setCenterView({ type: "preview", imageUrl: lastPreviewImageUrl, previewId: lastPreviewId });
                  } else {
                    setCenterView({ type: "empty" });
                  }
                }}
                className="px-4 py-2 text-sm bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* ──────────── Creation Lineage Panel (main content when job selected) ──────────── */}
          {selectedJobInfo && centerView.type !== "empty" && (
            <div className="flex-shrink-0 border-t border-neutral-200 bg-white min-h-[44px]">
              {/* Header: Creation Lineage (main); Reuse prompt; expand/collapse */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-neutral-100">
                <button
                  type="button"
                  onClick={() => setGenInfoExpanded((v) => !v)}
                  className="flex-1 flex items-center justify-between min-w-0 hover:bg-neutral-50 -mx-2 px-2 py-1 rounded transition-colors"
                >
                  <span className="text-sm font-semibold text-black truncate">
                    Creation Lineage
                    {jobLineage.length >= 1 && (
                      <span className="ml-1.5 font-normal text-neutral-500">
                        ({jobLineage.length} step{jobLineage.length !== 1 ? "s" : ""})
                      </span>
                    )}
                  </span>
                  <svg className={`w-5 h-5 text-neutral-400 shrink-0 transition-transform ${genInfoExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {selectedJobInfo.prompt && (
                  <button
                    type="button"
                    onClick={() => updateCurrentMode({ prompt: selectedJobInfo.prompt ?? "" })}
                    className="shrink-0 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-neutral-600 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors"
                    title="Use this job's prompt in the prompt field"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" /></svg>
                    Reuse prompt
                  </button>
                )}
              </div>

              {/* Collapsible content — lineage only */}
              {genInfoExpanded && (
              <div className="px-4 pb-4 max-h-[280px] overflow-y-auto">
                {jobLineage.length >= 1 && (
                  <div className="relative pl-4">
                      {/* Vertical line */}
                      <div className="absolute left-[7px] top-1 bottom-1 w-px bg-neutral-200" />
                      {jobLineage.map((item, idx) => {
                        const isCurrent = item.id === selectedJobInfo.id;
                        const parentCount = (item.parentJobIds && item.parentJobIds.length > 0) ? item.parentJobIds.length : (item.parentJobId ? 1 : 0);
                        const sourceCount = item.sourceImages?.length ?? 0;
                        // Combined with 2 sources: show merge UI whether 2 parents (both from library) or 1/0 parents (one/both from laptop)
                        const isMerge = parentCount > 1 || (item.generateType === "Combined" && sourceCount >= 2);
                        const showSourceImages = isMerge && sourceCount > 0;
                        // 3D step with one source image: show "Source image" thumbnail
                        const show3DSourceImage = item.resultGlbUrl && sourceCount >= 1 && item.sourceImages?.[0];
                        const mergeLabel = parentCount > 1 ? `${parentCount} parents` : sourceCount >= 2 ? "2 sources" : null;
                        const isSingleCombined = jobLineage.length === 1 && item.generateType === "Combined";
                        const stepLabel = isSingleCombined ? "Step 1" : idx === 0 ? "Origin" : `Step ${idx}`;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setLineagePreviewItem(item)}
                            className={`relative flex items-start gap-2.5 pb-2.5 last:pb-0 w-full text-left cursor-pointer rounded px-1 -mx-1 hover:bg-neutral-50 transition-colors ${isCurrent ? "opacity-100" : "opacity-70"}`}
                          >
                            {/* Dot — diamond for merge nodes, circle for single-parent */}
                            {isMerge ? (
                              <div className={`absolute -left-[18px] top-0 w-3.5 h-3.5 rotate-45 border-2 flex-shrink-0 ${isCurrent ? "border-black bg-black" : "border-neutral-400 bg-white"}`} />
                            ) : (
                              <div className={`absolute -left-4 top-0.5 w-3 h-3 rounded-full border-2 flex-shrink-0 ${isCurrent ? "border-black bg-black" : "border-neutral-300 bg-white"}`} />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`text-[10px] font-semibold ${isCurrent ? "text-black" : "text-neutral-500"}`}>
                                  {stepLabel}
                                </span>
                                <span className="text-[10px] text-neutral-400 capitalize">{item.generateType?.replace(/_/g, " ") || "image"}</span>
                                {mergeLabel && <span className="text-[10px] px-1 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{mergeLabel}</span>}
                                {item.resultGlbUrl && <span className="text-[10px] px-1 py-0.5 rounded bg-neutral-100 text-neutral-500">3D</span>}
                              </div>
                              {item.prompt && (
                                <p className="text-[10px] text-neutral-500 truncate mt-0.5" title={item.prompt}>{item.prompt}</p>
                              )}
                              {/* Show source images for Combined (2 sources) */}
                              {showSourceImages && item.sourceImages && (
                                <div className="flex gap-1 mt-1">
                                  {item.sourceImages.map((src, i) => (
                                    <img key={i} src={src} alt={`Source ${i + 1}`} className="w-5 h-5 rounded object-cover border border-neutral-200" />
                                  ))}
                                </div>
                              )}
                              {/* 3D step: show single source image thumbnail when available */}
                              {show3DSourceImage && (
                                <div className="flex items-center gap-1 mt-1">
                                  <span className="text-[10px] text-neutral-400">Source image</span>
                                  <img src={item.sourceImages![0]} alt="Source" className="w-5 h-5 rounded object-cover border border-neutral-200" />
                                </div>
                              )}
                            </div>
                            {/* Thumbnail */}
                            {item.previewImageUrl ? (
                              <img src={item.previewImageUrl} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0 border border-neutral-200" />
                            ) : item.resultGlbUrl ? (
                              <div className="w-7 h-7 rounded flex-shrink-0 border border-neutral-200 bg-neutral-100 flex items-center justify-center">
                                <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                              </div>
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                )}

                {jobLineage.length === 0 && (
                  <p className="text-sm text-neutral-400 italic">No iterative history — this is an original generation.</p>
                )}
              </div>
              )}
            </div>
          )}
        </main>

        {/* Right panel toggle tab when collapsed */}
        {!rightPanelOpen && (
          <button
            type="button"
            onClick={() => setRightPanelOpen(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-6 h-14 flex items-center justify-center bg-white border border-l-0 border-neutral-200 rounded-l-lg shadow-sm hover:bg-neutral-50 transition-colors"
            title="Open input panel"
            aria-label="Open input panel"
          >
            <svg className="w-4 h-4 text-neutral-500 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </button>
        )}

        {/* Right resize handle (between main and right panel) */}
        {rightPanelOpen && (
          <div
            role="separator"
            aria-orientation="vertical"
            onMouseDown={(e) => {
              e.preventDefault();
              resizeStartRef.current = { x: e.clientX, leftW: leftPanelWidth, rightW: rightPanelWidth };
              setResizingRight(true);
            }}
            className={`w-1 flex-shrink-0 bg-transparent hover:bg-neutral-200 active:bg-black/20 cursor-col-resize transition-colors ${resizingRight ? "bg-black/20" : ""}`}
          />
        )}

        {/* Right Panel - Input & generation (sliding & resizable) */}
        <aside
          style={{ width: rightPanelOpen ? rightPanelWidth : 0, minWidth: rightPanelOpen ? rightPanelWidth : 0 }}
          className="flex-shrink-0 flex flex-col bg-white border-l border-neutral-200 overflow-hidden transition-[width] duration-200 ease-out"
        >
          <div className="h-full overflow-y-auto min-w-0">
          <div className="p-4 space-y-4">
            <div className="flex justify-end -mt-1 -mr-1">
              <button type="button" onClick={() => setRightPanelOpen(false)} className="p-1 rounded hover:bg-neutral-100 text-neutral-500 hover:text-black transition-colors" title="Close panel" aria-label="Close input panel">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19l7-7-7-7" /></svg>
              </button>
            </div>

            {/* 3 input mode buttons with labels */}
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <button type="button" onClick={() => setInputMode("text")} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${inputMode === "text" ? "bg-black border-black text-white" : "bg-neutral-50 border-neutral-200 text-neutral-500 hover:border-neutral-300"}`} title="Text prompt only">
                  <span className="text-xl font-bold opacity-80">T</span>
                  <span className="text-[10px] font-medium mt-1 opacity-90">Text</span>
                </button>
                <button type="button" onClick={() => setInputMode("text_1img")} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${inputMode === "text_1img" ? "bg-black border-black text-white" : "bg-neutral-50 border-neutral-200 text-neutral-500 hover:border-neutral-300"}`} title="Text + 1 image">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
                  <span className="text-[10px] font-medium mt-1 opacity-90">Edit image</span>
                </button>
                <button type="button" onClick={() => setInputMode("text_2img")} className={`flex-1 flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${inputMode === "text_2img" ? "bg-black border-black text-white" : "bg-neutral-50 border-neutral-200 text-neutral-500 hover:border-neutral-300"}`} title="Text + 2 images">
                  <div className="flex -space-x-1"><div className="w-3 h-3 rounded-sm bg-current opacity-80" /><div className="w-3 h-3 rounded-sm bg-current opacity-80" /></div>
                  <span className="text-[10px] font-medium mt-1 opacity-90">Combine</span>
                </button>
              </div>
              <p className="text-[10px] text-neutral-400 text-center">Start from text, edit one image, or combine two — then generate 3D.</p>
            </div>

            {/* Image slots */}
            {(inputMode === "text_1img" || inputMode === "text_2img") && (
              <div>
                <label className="text-sm text-neutral-600 mb-1 block">{inputMode === "text_2img" ? "Image 1 & 2" : "Image"}</label>
                <div className="flex gap-2">
                  <div className={inputMode === "text_2img" ? "flex-1 min-w-0" : "flex-1"}>
                    {inputMode === "text_2img" && <span className="text-[10px] text-neutral-400 block mb-0.5">Image 1</span>}
                    <ImageDropzone slot={1} image={image1} onDrop={(e) => handleDrop(e, 1)} onPaste={(e) => handlePaste(e, 1)} onFileSelect={(e) => handleFileSelect(e, 1)} onClear={() => handleClearImage(1)} isDragging={isDragging} onDragOver={() => setIsDragging(true)} onDragLeave={() => setIsDragging(false)} />
                  </div>
                  {inputMode === "text_2img" && (
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-neutral-400 block mb-0.5">Image 2</span>
                      <ImageDropzone slot={2} image={image2} onDrop={(e) => handleDrop(e, 2)} onPaste={(e) => handlePaste(e, 2)} onFileSelect={(e) => handleFileSelect(e, 2)} onClear={() => handleClearImage(2)} isDragging={isDragging} onDragOver={() => setIsDragging(true)} onDragLeave={() => setIsDragging(false)} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prompt */}
            <div>
              <label className="block text-sm text-neutral-600 mb-1">Prompt</label>
              <textarea
                ref={promptTextareaRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={inputMode === "text" ? "Describe what you want to create..." : inputMode === "text_1img" ? "Describe how to edit this image..." : "Describe how to combine these images..."}
                className="w-full h-20 px-3 py-2 rounded-lg bg-white border border-neutral-200 text-black placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black/10 resize-none"
                rows={3}
              />
            </div>

            {/* Error */}
            {error && (
              <div className="px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg border border-red-200">{error}</div>
            )}

            {/* Generate Image - same for all 3 modes */}
            <button
              type="button"
              onClick={() => handleGenerateImage()}
              disabled={isGenerating}
              className={`w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2 transition-colors ${isGenerating ? "bg-neutral-400 cursor-not-allowed" : "bg-black hover:bg-neutral-800"}`}
            >
              {isGenerating ? (
                <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</>
              ) : (
                <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>Generate Image</>
              )}
            </button>

            {/* AI Model selection — between image and 3D generation */}
            <div className="space-y-1.5">
              <label className="flex items-center gap-1.5 text-sm font-medium text-neutral-600">
                AI Model
                <span title="3D generation model">
                  <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setModelDropdownOpen((o) => !o)}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-neutral-50 border border-neutral-200 text-left text-sm text-black hover:border-neutral-300 transition-colors"
                >
                  <span>{modelOptions.find((m) => m.id === selectedModel)?.label ?? selectedModel}</span>
                  <svg className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform ${modelDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {modelDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setModelDropdownOpen(false)} aria-hidden />
                    <div className="absolute top-full left-0 right-0 mt-1 z-20 py-1 rounded-lg bg-white border border-neutral-200 shadow-lg">
                      {modelOptions.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={opt.comingSoon}
                          onClick={() => {
                            if (!opt.comingSoon) {
                              setSelectedModel(opt.id);
                              setModelDropdownOpen(false);
                            }
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors ${opt.comingSoon ? "text-neutral-400 cursor-not-allowed" : "text-black hover:bg-neutral-50"}`}
                        >
                          <span className="flex items-center gap-2">
                            {opt.label}
                            {opt.comingSoon && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium">Coming soon</span>
                            )}
                          </span>
                          {!opt.comingSoon && selectedModel === opt.id && (
                            <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Generate 3D Model - always shown; with preview runs 3D, without preview generates image then 3D */}
            <div>
              <button
                type="button"
                onClick={handleGenerate3D}
                disabled={isGenerating}
                title={lastPreviewImageUrl ? "Turn this image into a 3D model." : "Generate an image from your prompt (or edit/combine), then create a 3D model."}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors border ${!isGenerating ? "bg-neutral-100 text-black border-neutral-200 hover:bg-neutral-200" : "bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed"}`}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                Generate 3D Model
              </button>
              <p className="text-[10px] text-neutral-400 mt-1 text-center">
                {lastPreviewImageUrl ? "Turn this image into a 3D model." : "Generate an image from your prompt (or edit/combine), then create a 3D model."}
              </p>
            </div>
          </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function ImageDropzone({ slot, image, onDrop, onPaste, onFileSelect, onClear, isDragging, onDragOver, onDragLeave }: {
  slot: 1 | 2; image: string | null; onDrop: (e: React.DragEvent) => void; onPaste: (e: React.ClipboardEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void; onClear: () => void; isDragging: boolean; onDragOver: () => void; onDragLeave: () => void;
}) {
  const inputId = `workspace-image-upload-${slot}`;
  return (
    <div
      className={`flex-1 min-h-[120px] rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-3 transition-colors ${isDragging ? "border-black bg-neutral-100" : "border-neutral-300 bg-neutral-50 hover:border-neutral-400"}`}
      onDrop={onDrop} onDragOver={(e) => { e.preventDefault(); onDragOver(); }} onDragLeave={onDragLeave} onPaste={onPaste}
    >
      <input type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" id={inputId} onChange={onFileSelect} />
      {image ? (
        <div className="relative w-full h-full min-h-[100px] rounded-lg overflow-hidden group">
          <img src={image} alt="Upload" className="w-full h-full object-cover" />
          <button type="button" onClick={onClear} className="absolute top-1 right-1 p-1 rounded-full bg-black/60 hover:bg-black text-white transition-colors" aria-label="Clear image">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
      ) : (
        <label htmlFor={inputId} className="cursor-pointer text-center">
          <svg className="w-8 h-8 mx-auto text-neutral-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
          <p className="text-xs font-medium text-neutral-500">Click / Drop / Paste</p>
          <p className="text-[10px] text-neutral-400 mt-0.5">Or drag from library</p>
        </label>
      )}
    </div>
  );
}
