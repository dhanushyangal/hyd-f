"use client";

import dynamic from "next/dynamic";
import { Suspense, useState, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import { motion } from "motion/react";
import { Slider } from "../../components/ui/slider";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import { Input } from "../../components/ui/input";
import { Progress } from "../../components/ui/progress";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Switch } from "../../components/ui/switch";
import { Textarea } from "../../components/ui/textarea";
import {
  submitImageTo3D,
  submitWater,
  fetchWaterJob,
  saveWaterThumbnail,
  fetchUserApiKeys,
  fetchOpenRouterFreeModels,
  fetchCursorModels,
  saveUserModelPrefs,
  generatePreviewImage,
  registerJobWithPreview,
  editImage,
  combinedEdit,
  uploadImageViaApi,
  uploadImage,
  fetchHistory,
  fetchWorkspace,
  fetchWorkspaceJobs,
  fetchWorkspaces,
  updateWorkspaceNameApi,
  createWorkspaceApi,
  fetchStatus,
  fetchQueueInfo,
  fetchJobLineage,
  getGlbUrl,
  getProxyGlbUrl,
  getProxiedImageUrl,
  notifyGpuOffline,
  cancelJob,
  isPrimaryUp,
  onHealthChange,
  BackendJob,
  QueueInfo,
  LineageItem,
  UserApiKeyMeta,
} from "../../lib/api";
import { setCurrentWorkspaceId, getCurrentWorkspaceId, clearCurrentWorkspaceId, cn } from "../../lib/utils";
import { track, isPaywallError } from "../../lib/analytics";
import {
  consumeWorkspaceBootstrap,
  consumeWorkspacePrefill,
  peekPendingHeroPrompt,
} from "../../lib/pendingHeroPrompt";
import {
  MODEL_CATALOG,
  MODEL_GROUPS,
  getCatalogModel,
  isCodeModel,
  mergeFreeModels,
  mergeCursorModels,
  providerForModelId,
  type CatalogModel,
  type CursorLiveModel,
  type ModelId,
  type OpenRouterFreeModel,
} from "../../lib/models";
import { ENGINE, formatEngineLabel, isWaterJob, isWaterJobId } from "../../lib/engines";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://hydrilla-backend.vercel.app";
const CREDITS_IMAGE = 2;
const CREDITS_3D = 10;

const displayImageUrl = (url: string | null | undefined): string => getProxiedImageUrl(url) || url || "";

// Human labels for the Water pipeline passes (img2threejs-style transparency).
const SCULPT_PASS_LABELS: Record<string, string> = {
  intake: "Checking the brief…",
  assessment: "Mapping the parts…",
  spec: "Writing the build plan…",
  blockout: "Building the blockout in code…",
  review: "Checking structure…",
  done: "Blockout ready",
};

const SCULPT_PASS_STEPS = ["assessment", "spec", "blockout", "review", "done"] as const;

const sculptPassLabel = (pass?: string | null): string =>
  SCULPT_PASS_LABELS[pass || ""] || "Building…";

const sculptPassIndex = (pass?: string | null): number => {
  const i = SCULPT_PASS_STEPS.indexOf((pass as (typeof SCULPT_PASS_STEPS)[number]) || "assessment");
  return i >= 0 ? i : 0;
};

// Lazy-load ThreeViewer (Three.js is heavy; load only when 3D is shown)
const ThreeViewer = dynamic(() => import("../../components/ThreeViewer").then((m) => ({ default: m.ThreeViewer })), {
  ssr: false,
  loading: () => (
    <div className="flex-1 min-h-0 flex items-center justify-center bg-[#fafafa]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-9 h-9 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
        <p className="text-sm text-neutral-500">Loading 3D viewer…</p>
      </div>
    </div>
  ),
});

const WaterViewer = dynamic(
  () => import("../../components/WaterViewer").then((m) => ({ default: m.WaterViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 min-h-0 flex items-center justify-center bg-[#f4f4f5]">
        <div className="w-9 h-9 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
      </div>
    ),
  }
);

type InputMode = "text" | "image" | "text_1img" | "text_2img";

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
  image: { prompt: "", image1: null, image2: null, file1: null, file2: null, jobId1: null, jobId2: null },
  text_1img: { prompt: "", image1: null, image2: null, file1: null, file2: null, jobId1: null, jobId2: null },
  text_2img: { prompt: "", image1: null, image2: null, file1: null, file2: null, jobId1: null, jobId2: null },
};

type CenterView =
  | { type: "empty" }
  | { type: "preview"; imageUrl: string; previewId?: string }
  | { type: "generating"; progress: number; message: string }
  | { type: "3d"; glbUrl: string; jobId: string }
  | { type: "code"; factoryCode: string; jobId: string }
  | { type: "error"; message: string };

/** Show "GPU is unavailable" when both APIs have failed (fetch/network errors). */
function toUserFacingGpuError(msg: string | undefined): string {
  if (!msg) return "GPU is unavailable";
  if (/fetch failed|failed to fetch|networkerror|timeout|ECONNREFUSED|External service unavailable|GPU is unavailable/i.test(msg))
    return "GPU is unavailable";
  return msg;
}

/** Prefer gateway (S3 URL); fall back to backend upload when the gateway is unreachable (fixes raw "Failed to fetch" in local dev). */
async function uploadSourceImageWithFallback(
  file: File,
  getToken: () => Promise<string | null>
): Promise<string> {
  try {
    return await uploadImageViaApi(file, getToken);
  } catch {
    return await uploadImage(file, getToken);
  }
}

function isGpuOfflineFailure(rawMsg: string | undefined, userFacingMsg?: string): boolean {
  const m = `${rawMsg ?? ""} ${userFacingMsg ?? ""}`;
  return /GPU is (currently )?offline|GPU is unavailable/i.test(m);
}

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
      <div className="h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
      </div>
    }>
      <WorkspacePage />
    </Suspense>
  );
}

function WorkspacePage() {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [resolvingWorkspace, setResolvingWorkspace] = useState(true);
  const prefillAppliedRef = useRef(false);

  // If user is not authenticated, redirect to sign-in immediately.
  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) return;
    const redirect =
      peekPendingHeroPrompt() != null
        ? "/sign-in?redirect_url=" + encodeURIComponent("/app/studio")
        : "/sign-in";
    router.push(redirect);
  }, [isLoaded, isSignedIn, router]);

  // Hero prompt is owned by /app/studio (creates workspace). Hand off if we still have pending intent.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (!peekPendingHeroPrompt()) return;
    router.replace("/app/studio");
  }, [isLoaded, isSignedIn, router]);

  // Apply landing-page prompt once studio has created the workspace and navigated here.
  const applyWorkspacePrefill = useCallback(() => {
    if (prefillAppliedRef.current) return;
    const prefill = consumeWorkspacePrefill();
    if (!prefill) return;
    prefillAppliedRef.current = true;
    setInputMode("text");
    setModeStates((prev) => ({
      ...prev,
      text: { ...defaultModeStates.text, prompt: prefill },
    }));
    setForcedWorkspaceModal(false);
    setShowNewWorkspaceModal(false);
    requestAnimationFrame(() => {
      promptTextareaRef.current?.focus();
    });
  }, []);

  // Resolve workspace ID from path (/workspace/:id), fallback query/session, and keep URL canonical as /workspace/:id.
  // If user has no workspace, redirect to /app/studio.
  // Hero handoff: open instantly from bootstrap meta (no second round-trip before UI).
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    // Studio is creating the workspace from the hero prompt.
    if (peekPendingHeroPrompt()) return;

    const pathParts = pathname.split("/").filter(Boolean);
    const idFromPath = pathParts[0] === "workspace" && pathParts[1] ? pathParts[1] : null;
    const idFromUrl = searchParams.get("id");
    const storedId = getCurrentWorkspaceId();
    const resolvedId = idFromPath ?? idFromUrl ?? storedId;
    const tokenGetter = async () => (await getToken()) ?? "";

    // Instant path: studio just created this workspace and left name + prompt in sessionStorage.
    const bootstrap = consumeWorkspaceBootstrap(resolvedId);
    if (bootstrap) {
      setCurrentWorkspaceId(bootstrap.workspaceId);
      setWorkspaceId(bootstrap.workspaceId);
      setWorkspaceName(bootstrap.workspaceName);
      setLibraryImages([]);
      setLibrary3DAssets([]);
      applyWorkspacePrefill();
      setResolvingWorkspace(false);
      setLibraryLoading(false);
      if (pathname !== `/workspace/${bootstrap.workspaceId}`) {
        router.replace(`/workspace/${bootstrap.workspaceId}`);
      }
      // Refresh library in the background (empty for a brand-new workspace).
      void fetchWorkspaceJobs(bootstrap.workspaceId, tokenGetter)
        .then((jobs) => {
          setLibraryImages(jobs.filter(shouldShowInImageLibrary).slice(0, 50));
          setLibrary3DAssets(applyCodeThumbs(jobs.filter(shouldShowIn3DLibrary).slice(0, 50)));
        })
        .catch(() => {});
      return;
    }

    const hydrateWorkspace = async (id: string) => {
      setCurrentWorkspaceId(id);
      setWorkspaceId(id);
      if (pathname !== `/workspace/${id}`) router.replace(`/workspace/${id}`);

      setLibraryLoading(true);
      try {
        const [ws, jobs] = await Promise.all([
          fetchWorkspace(id, tokenGetter),
          fetchWorkspaceJobs(id, tokenGetter),
        ]);
        if (!ws) {
          clearCurrentWorkspaceId();
          setWorkspaceId(null);
          setWorkspaceName("");
          setLibraryImages([]);
          setLibrary3DAssets([]);
          router.replace("/app/studio");
          setResolvingWorkspace(false);
          return;
        }

        setWorkspaceName(ws.name ?? "");
        setLibraryImages(jobs.filter(shouldShowInImageLibrary).slice(0, 50));
        setLibrary3DAssets(applyCodeThumbs(jobs.filter(shouldShowIn3DLibrary).slice(0, 50)));
        applyWorkspacePrefill();
        setResolvingWorkspace(false);
      } finally {
        setLibraryLoading(false);
      }
    };

    if (resolvedId) {
      void hydrateWorkspace(resolvedId);
      return;
    }

    void (async () => {
      const workspaces = await fetchWorkspaces(tokenGetter);
      const firstWorkspaceId = workspaces[0]?.id ?? null;
      if (!firstWorkspaceId) {
        clearCurrentWorkspaceId();
        setWorkspaceId(null);
        setWorkspaceName("");
        setResolvingWorkspace(false);
        router.replace("/app/studio");
        return;
      }
      await hydrateWorkspace(firstWorkspaceId);
    })();
  }, [pathname, searchParams, isLoaded, isSignedIn, getToken, router, applyWorkspacePrefill]);

  const [workspaceName, setWorkspaceName] = useState("");
  const workspaceNameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showNewWorkspaceModal, setShowNewWorkspaceModal] = useState(false);
  const [forcedWorkspaceModal, setForcedWorkspaceModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceCreating, setNewWorkspaceCreating] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("text");
  const [modeStates, setModeStates] = useState<Record<InputMode, ModeState>>(defaultModeStates);
  const [centerView, setCenterView] = useState<CenterView>({ type: "empty" });

  // Primary API health — Edit & Combine require primary; when down only Text & Image-to-3D are available.
  // Initialize to true so server and client first paint match (avoids hydration error). Updated after mount.
  const [primaryApiUp, setPrimaryApiUp] = useState(true);
  useEffect(() => {
    setPrimaryApiUp(isPrimaryUp());
    return onHealthChange(setPrimaryApiUp);
  }, []);

  // When primary goes down, force back to "text" mode if on Edit/Combine
  useEffect(() => {
    if (!primaryApiUp && (inputMode === "text_1img" || inputMode === "text_2img")) {
      setInputMode("text");
    }
  }, [primaryApiUp, inputMode]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mustCreateWorkspace = isLoaded && isSignedIn && !resolvingWorkspace && !workspaceId;
  const hasWorkspaceContext = Boolean(workspaceId && workspaceName.trim());

  // If user lands on /workspace without a selected workspace, force workspace creation first.
  useEffect(() => {
    if (!mustCreateWorkspace) return;
    setForcedWorkspaceModal(true);
    setShowNewWorkspaceModal(true);
  }, [mustCreateWorkspace]);

  // If workspace exists but has no name, require a name before allowing any creation.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (!workspaceId) return;
    if (workspaceName.trim()) return;
    setForcedWorkspaceModal(true);
    setShowNewWorkspaceModal(true);
  }, [isLoaded, isSignedIn, workspaceId, workspaceName]);

  // If a workspace becomes available, close any forced modal opened during initial load.
  useEffect(() => {
    if (!workspaceId) return;
    if (!forcedWorkspaceModal) return;
    if (newWorkspaceCreating) return;
    setShowNewWorkspaceModal(false);
    setForcedWorkspaceModal(false);
    setNewWorkspaceName("");
  }, [workspaceId, forcedWorkspaceModal, newWorkspaceCreating]);

  // Library data
  const [libraryImages, setLibraryImages] = useState<BackendJob[]>([]);
  const [library3DAssets, setLibrary3DAssets] = useState<BackendJob[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  // Client-captured Water thumbnails (instant left-card preview before S3 round-trip).
  // Survives refreshLibrary overwrites until the server returns a real preview URL.
  const codeThumbCacheRef = useRef<Record<string, string>>({});

  const applyCodeThumbs = useCallback((jobs: BackendJob[]): BackendJob[] => {
    const cache = codeThumbCacheRef.current;
    return jobs.map((j) => {
      const cached = cache[j.id];
      if (!cached) return j;
      if (j.previewImageUrl && !j.previewImageUrl.startsWith("data:")) {
        delete cache[j.id];
        return j;
      }
      return { ...j, previewImageUrl: j.previewImageUrl || cached };
    });
  }, []);

  // Optimistic pending entries for immediate loader feedback in the left library.
  // Each pending has an id like `pending-<ts>-<rand>` and status "WAIT".
  // They are removed once the server returns a real RUN/WAIT/DONE job for the same generation.
  const [pendingJobs, setPendingJobs] = useState<BackendJob[]>([]);
  const makePendingId = useCallback(
    () => `pending-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    []
  );
  const addPendingJob = useCallback(
    (partial: Partial<BackendJob> & { generateType: string }): string => {
      const id = makePendingId();
      const nowIso = new Date().toISOString();
      const pending: BackendJob = {
        id,
        userId: null,
        status: "WAIT",
        prompt: partial.prompt ?? null,
        imageUrl: partial.imageUrl ?? null,
        generateType: partial.generateType,
        enablePBR: false,
        resultGlbUrl: null,
        previewImageUrl: partial.previewImageUrl ?? null,
        errorCode: null,
        errorMessage: null,
        workspaceId: partial.workspaceId ?? workspaceId ?? null,
        parentJobId: partial.parentJobId ?? null,
        parentJobIds: partial.parentJobIds ?? [],
        sourceImages: partial.sourceImages ?? null,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      setPendingJobs((prev) => [pending, ...prev].slice(0, 20));
      return id;
    },
    [makePendingId, workspaceId]
  );
  const removePendingJob = useCallback((id: string) => {
    setPendingJobs((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // Generation tracking (for 3D jobs)
  const [currentGenerating, setCurrentGenerating] = useState<GeneratingJob | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
  /** Bumps on each new Water run so stale polls cannot overwrite a newer job. */
  const waterPollGenRef = useRef(0);

  // Track the last generated preview so we can use it for 3D
  const [lastPreviewImageUrl, setLastPreviewImageUrl] = useState<string | null>(null);
  const [lastPreviewId, setLastPreviewId] = useState<string | null>(null);

  // Parent job for iterative prompting lineage
  const [currentParentJobId, setCurrentParentJobId] = useState<string | null>(null);

  // Generation Info panel state (header always visible when job selected; expanded = content open)
  const [selectedJobInfo, setSelectedJobInfo] = useState<BackendJob | null>(null);
  const [jobLineage, setJobLineage] = useState<LineageItem[]>([]);
  const [genInfoExpanded, setGenInfoExpanded] = useState(true);
  const [mobileGenInfoOpen, setMobileGenInfoOpen] = useState(false);
  const [mobileGeneratedToast, setMobileGeneratedToast] = useState(false);
  const [lineagePreviewItem, setLineagePreviewItem] = useState<LineageItem | null>(null);
  const mobileGeneratedToastRef = useRef<NodeJS.Timeout | null>(null);
  /** Mobile-only: timestamp when user-started generation began (for minimum GPU-offline overlay duration). */
  const mobileGenStartedAtRef = useRef<number | null>(null);

  const rememberCodeThumb = useCallback(
    (jobId: string, dataUrl: string, prompt?: string | null) => {
      codeThumbCacheRef.current[jobId] = dataUrl;
      setLibrary3DAssets((prev) => {
        const exists = prev.some((j) => j.id === jobId);
        if (exists) {
          return prev.map((j) =>
            j.id === jobId
              ? {
                  ...j,
                  previewImageUrl: dataUrl,
                  status: j.status === "FAIL" ? j.status : ("DONE" as const),
                  hasFactoryCode: true,
                }
              : j
          );
        }
        return [
          {
            id: jobId,
            userId: null,
            status: "DONE" as const,
            prompt: prompt ?? null,
            imageUrl: null,
            generateType: "Water",
            enablePBR: false,
            resultGlbUrl: null,
            previewImageUrl: dataUrl,
            errorCode: null,
            errorMessage: null,
            workspaceId: workspaceId ?? null,
            parentJobId: null,
            parentJobIds: [],
            sourceImages: [],
            engine: "water",
            resultKind: "three_factory",
            hasFactoryCode: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } satisfies BackendJob,
          ...prev,
        ].slice(0, 50);
      });
      setSelectedJobInfo((prev) =>
        prev && prev.id === jobId ? { ...prev, previewImageUrl: dataUrl, hasFactoryCode: true } : prev
      );
      setLeftLibraryTab("3d");
    },
    [workspaceId]
  );

  const markMobileGenerationStart = useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
      mobileGenStartedAtRef.current = Date.now();
    }
  }, []);

  const waitMobileGpuOfflineMinimum = useCallback(async (rawMsg: string | undefined, userFacingMsg: string) => {
    if (typeof window === "undefined" || window.innerWidth >= 768) return;
    if (!isGpuOfflineFailure(rawMsg, userFacingMsg)) return;
    const start = mobileGenStartedAtRef.current;
    if (start == null) return;
    const elapsed = Date.now() - start;
    if (elapsed < 4000) await new Promise((r) => setTimeout(r, 4000 - elapsed));
  }, []);

  // Credits (from /api/payments/credits) – header + cost line (image 2, 3D 10)
  const [creditsTotal, setCreditsTotal] = useState<number>(0);
  const [creditsUsed, setCreditsUsed] = useState<number>(0);
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [clientMounted, setClientMounted] = useState(false);
  useEffect(() => {
    setClientMounted(true);
  }, []);
  const refreshCredits = useCallback(async () => {
    if (!isSignedIn || !getToken) return;
    setCreditsLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${BACKEND_URL}/api/payments/credits`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) {
        const data = await res.json();
        const c = data.credits || {};
        setCreditsUsed(c.used ?? 0);
        setCreditsTotal(c.total ?? 0);
      }
    } catch {
      // ignore
    } finally {
      setCreditsLoading(false);
    }
  }, [isSignedIn, getToken]);

  // AI Model selection — Hydrilla mesh engines + Bring-your-own Water models
  const [selectedModel, setSelectedModel] = useState<ModelId>("trilles");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<UserApiKeyMeta[]>([]);
  const [liveFreeModels, setLiveFreeModels] = useState<OpenRouterFreeModel[]>([]);
  const [liveCursorModels, setLiveCursorModels] = useState<CursorLiveModel[]>([]);
  const [codeFactoryCode, setCodeFactoryCode] = useState<string | null>(null);
  const [codeSculptPass, setCodeSculptPass] = useState<string | null>(null);
  const freePickerModels = mergeFreeModels(liveFreeModels);
  const cursorPickerModels = mergeCursorModels(liveCursorModels);
  const selectedCatalog =
    getCatalogModel(selectedModel) ||
    freePickerModels.find((m) => m.id === selectedModel) ||
    cursorPickerModels.find((m) => m.id === selectedModel) ||
    undefined;
  const selectedProvider = providerForModelId(selectedModel);
  const selectedIsCode =
    selectedProvider !== null && selectedProvider !== "hydrilla";

  // Bring-your-own models are text → 3D only; the image tabs don't apply to them.
  useEffect(() => {
    if (selectedIsCode && inputMode !== "text") setInputMode("text");
  }, [selectedIsCode, inputMode]);

  // A failed mesh/GPU job must not remain as the active canvas when the user
  // switches to Water. It is unrelated to the Water engine.
  useEffect(() => {
    if (
      selectedIsCode &&
      centerView.type === "error" &&
      isGpuOfflineFailure(centerView.message)
    ) {
      setCenterView({ type: "empty" });
      setSelectedJobInfo(null);
      setCurrentGenerating(null);
      setError(null);
    }
  }, [selectedIsCode, centerView]);

  useEffect(() => {
    if (!isSignedIn) return;
    void (async () => {
      try {
        const tokenGetter = async () => (await getToken()) ?? null;
        const data = await fetchUserApiKeys(tokenGetter);
        setApiKeys(data.keys);
        // Prefer saved Water default when user already configured BYOK
        const preferred = data.prefs?.defaultCodeModel;
        if (preferred && isCodeModel(preferred)) {
          const provider = providerForModelId(preferred);
          const keyOk =
            !provider ||
            provider === "hydrilla" ||
            data.keys.some((k) => k.provider === provider && k.configured && k.status !== "invalid");
          if (keyOk) setSelectedModel(preferred as ModelId);
        }
        // Live-sync OpenRouter free models for the picker
        try {
          const free = await fetchOpenRouterFreeModels(tokenGetter);
          setLiveFreeModels(free.models);
        } catch {
          // Curated free list still works offline
        }
        // Live-sync Cursor Cloud Agents models when a key is configured
        const cursorOk = data.keys.some(
          (k) => k.provider === "cursor" && k.configured && k.status !== "invalid"
        );
        if (cursorOk) {
          try {
            const cursor = await fetchCursorModels(tokenGetter);
            setLiveCursorModels(cursor.models);
          } catch {
            // Cursor Auto still available without live list
          }
        }
      } catch {
        // Settings migration may not be deployed yet — picker still works for Trilles
      }
    })();
  }, [isSignedIn, getToken]);

  const providerKeyOk = useCallback(
    (provider: string) => {
      if (provider === "hydrilla") return true;
      const k = apiKeys.find((x) => x.provider === provider);
      return Boolean(k?.configured && k.status !== "invalid");
    },
    [apiKeys]
  );

  const pickerItemsForGroup = useCallback(
    (group: CatalogModel["group"]): CatalogModel[] => {
      const items =
        group === "OpenRouter Free"
          ? freePickerModels
          : group === "Cursor"
            ? cursorPickerModels
            : MODEL_CATALOG.filter((m) => m.group === group);
      // Unlocked models first within the group; locked / coming-soon below.
      return [...items].sort((a, b) => {
        const aUnlocked =
          !a.comingSoon && (a.provider === "hydrilla" || providerKeyOk(a.provider));
        const bUnlocked =
          !b.comingSoon && (b.provider === "hydrilla" || providerKeyOk(b.provider));
        if (aUnlocked !== bUnlocked) return aUnlocked ? -1 : 1;
        return 0;
      });
    },
    [freePickerModels, cursorPickerModels, providerKeyOk]
  );

  /** Hydrilla cloud first, then Water groups with a valid key, then locked groups. */
  const orderedModelGroups = useMemo(() => {
    const water = MODEL_GROUPS.filter((g) => g !== "Hydrilla");
    const unlocked: CatalogModel["group"][] = [];
    const locked: CatalogModel["group"][] = [];
    for (const group of water) {
      const items = pickerItemsForGroup(group);
      const anyUnlocked = items.some(
        (opt) => !opt.comingSoon && providerKeyOk(opt.provider)
      );
      if (anyUnlocked) unlocked.push(group);
      else locked.push(group);
    }
    return ["Hydrilla" as const, ...unlocked, ...locked];
  }, [pickerItemsForGroup, providerKeyOk]);

  const modelTypeLabel: Record<string, string> = Object.fromEntries([
    ...MODEL_CATALOG.map((m) => [m.id, m.label] as const),
    ...freePickerModels.map((m) => [m.id, m.label] as const),
    ...cursorPickerModels.map((m) => [m.id, m.label] as const),
  ]);
    const formatGenerationType = useCallback((value?: string | null): string => {
    return formatEngineLabel(value);
  }, []);
  const is3DGenerationType = useCallback((value?: string | null): boolean => {
    if (!value) return false;
    const normalized = value.replace(/_/g, " ").toLowerCase();
    return (
      normalized.includes("3d") ||
      normalized.includes("trellis") ||
      normalized.includes("trilles") ||
            normalized.includes("hunyuan") ||
      normalized.includes("water") ||
      normalized.includes("codesculpt") ||
      normalized.includes("code sculpt")
    );
  }, []);
    const isWaterJobFn = useCallback((job: BackendJob): boolean => {
    return isWaterJob(job);
  }, []);
  const hasRealFactoryCode = useCallback((job: BackendJob): boolean => {
    return Boolean(
      job.hasFactoryCode ||
        (job.factoryCode && job.factoryCode !== "__present__")
    );
  }, []);
  const shouldShowInImageLibrary = useCallback((job: BackendJob): boolean => {
    // Show completed 2D images and in-progress 2D jobs.
    // Exclude failed jobs and all 3D jobs from Images tab.
    if (job.status === "FAIL") return false;
    if (is3DGenerationType(job.generateType)) return false;
    if (job.status === "DONE") return Boolean(job.previewImageUrl || job.imageUrl);
    return job.status === "RUN" || job.status === "WAIT";
  }, [is3DGenerationType]);
  const shouldShowIn3DLibrary = useCallback((job: BackendJob): boolean => {
    // Show completed 3D outputs and in-progress 3D jobs (mesh + Water).
    if (job.status === "FAIL") return false;
    if (
      job.resultGlbUrl ||
      hasRealFactoryCode(job) ||
      isWaterJobFn(job) ||
      isWaterJobId(job.id)
    ) {
      return true;
    }
    if (!is3DGenerationType(job.generateType)) return false;
    return job.status === "RUN" || job.status === "WAIT";
  }, [is3DGenerationType, isWaterJobFn, hasRealFactoryCode]);

  // 3D viewer options (Environment, Material, lighting intensity/brightness)
  const [envLighting, setEnvLighting] = useState<"studio" | "outdoor" | "neutral">("studio");
  const [lightingDropdownOpen, setLightingDropdownOpen] = useState(false);
  const [roughnessDropdownOpen, setRoughnessDropdownOpen] = useState(false);
  const [wireframeMode, setWireframeMode] = useState(false);
  const [lightIntensity, setLightIntensity] = useState(1); // 0.3–2, default 1
  const [brightness, setBrightness] = useState(1);         // 0.5–2, tone mapping exposure
  const [envBackground, setEnvBackground] = useState(true);
  const [envGrid, setEnvGrid] = useState(false);
  const [envShadow, setEnvShadow] = useState(true);
  const [envAutoRotate, setEnvAutoRotate] = useState(false);
  const [materialType, setMaterialType] = useState<"standard" | "matcap" | "toon" | "lambert" | "normal">("standard");
  const [materialRoughness, setMaterialRoughness] = useState<"smooth" | "medium" | "rough">("medium");
  const [numGenerations, setNumGenerations] = useState(1);

  // Prompt history (localStorage); max 20 entries, newest first
  const PROMPT_HISTORY_KEY = "hydrilla-prompt-history";
  const [promptHistory, setPromptHistory] = useState<string[]>([]);
  const [historyDropdownOpen, setHistoryDropdownOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROMPT_HISTORY_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string")) {
          setPromptHistory(parsed.slice(0, 20));
        }
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (isSignedIn && workspaceId) refreshCredits();
  }, [isSignedIn, workspaceId, refreshCredits]);

  const savePromptToHistory = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setPromptHistory((prev) => {
      const next = [trimmed, ...prev.filter((p) => p !== trimmed)].slice(0, 20);
      try {
        localStorage.setItem(PROMPT_HISTORY_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // When lighting preset changes, set suggested intensity/brightness (HDRI-style defaults)
  useEffect(() => {
    const presets = { neutral: [1, 1], studio: [1.2, 1.15], outdoor: [1.4, 1.25] } as const;
    const [int, bri] = presets[envLighting];
    setLightIntensity(int);
    setBrightness(bri);
  }, [envLighting]);

  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const libraryPanelRef = useRef<HTMLElement>(null);

  // Sliding & resizable side panels
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [leftLibraryTab, setLeftLibraryTab] = useState<"images" | "3d">("images");
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [fullView, setFullView] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(300);
  const [resizingLeft, setResizingLeft] = useState(false);
  const resizeStartRef = useRef({ x: 0, leftW: 0 });

  // Compact (phone + tablet < lg): Canvas | Create tabs instead of 3-panel desktop
  const [mobileTab, setMobileTab] = useState<"canvas" | "create">("create");
  const [isCompact, setIsCompact] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 1023px)").matches : false
  );

  const MIN_PANEL = 200;
  const MAX_LEFT = 500;
  const RIGHT_PANEL_WIDTH = 320; // fixed width, not resizable; collapse gives more space to viewer

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const sync = () => setIsCompact(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!resizingLeft) return;
    const onMove = (e: MouseEvent) => {
      const delta = e.clientX - resizeStartRef.current.x;
      setLeftPanelWidth((w) => Math.min(MAX_LEFT, Math.max(MIN_PANEL, resizeStartRef.current.leftW + delta)));
    };
    const onUp = () => setResizingLeft(false);
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
  }, [resizingLeft]);

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
      // If we already have a workspaceId but it's unnamed, just set its name (do not create a new workspace).
      if (workspaceId && !workspaceName.trim()) {
        await updateWorkspaceNameApi(workspaceId, name, tokenGetter);
        setWorkspaceName(name);
        setShowNewWorkspaceModal(false);
        setForcedWorkspaceModal(false);
        setNewWorkspaceName("");
        return;
      }

      const ws = await createWorkspaceApi(name, tokenGetter);
      track("workspace_created", { source: "workspace_modal" });
      setShowNewWorkspaceModal(false);
      setForcedWorkspaceModal(false);
      setNewWorkspaceName("");
      setCurrentWorkspaceId(ws.id);
      setWorkspaceId(ws.id);
      setWorkspaceName(ws.name ?? name);
      router.push(`/workspace/${ws.id}`);
    } catch (err) {
      console.error("Failed to create workspace:", err);
    } finally {
      setNewWorkspaceCreating(false);
    }
  }, [newWorkspaceName, newWorkspaceCreating, getToken, router, workspaceId, workspaceName]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      if (workspaceNameTimeoutRef.current) clearTimeout(workspaceNameTimeoutRef.current);
    };
  }, []);

  // Intentionally do not restore "generating" UI from RUN jobs on refresh — only show
  // generating when the user starts a generation or clicks a RUN job in the library.
  const restoreRunning3DJobIfAny = useCallback((_jobs: BackendJob[]) => {
    // No-op: avoids showing "Generating 3D model..." when user did not trigger it.
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
      setLibraryImages(jobs.filter(shouldShowInImageLibrary).slice(0, 50));
      setLibrary3DAssets(applyCodeThumbs(jobs.filter(shouldShowIn3DLibrary).slice(0, 50)));
      restoreRunning3DJobIfAny(jobs);

      // Prune optimistic pending entries whose corresponding real job now exists on the server.
      // Heuristic: drop pending if a server job was created AFTER the pending's createdAt
      // and matches by category (3D vs 2D) + optional prompt/imageUrl/parentJobId.
      setPendingJobs((prev) => {
        if (prev.length === 0) return prev;
        const now = Date.now();
        return prev.filter((p) => {
          const pendingStarted = Date.parse(p.createdAt);
          const maxAgeMs = 60_000; // give up after 60s — a real job should exist by then
          if (Number.isFinite(pendingStarted) && now - pendingStarted > maxAgeMs) return false;
          const pendingIs3D = is3DGenerationType(p.generateType);
          const match = jobs.find((j) => {
            const jStarted = Date.parse(j.createdAt);
            if (!Number.isFinite(jStarted) || jStarted < pendingStarted - 2000) return false;
            const jIs3D = is3DGenerationType(j.generateType);
            if (pendingIs3D !== jIs3D) return false;
            if (p.parentJobId && j.parentJobId && p.parentJobId === j.parentJobId) return true;
            if (p.prompt && j.prompt && p.prompt === j.prompt) return true;
            if (p.imageUrl && j.imageUrl && p.imageUrl === j.imageUrl) return true;
            // Fallback: first same-category job created within 10s of pending start
            return Math.abs(jStarted - pendingStarted) < 10_000;
          });
          return !match;
        });
      });
    } catch { /* ignore */ }
  }, [getToken, workspaceId, restoreRunning3DJobIfAny, shouldShowInImageLibrary, shouldShowIn3DLibrary, is3DGenerationType, applyCodeThumbs]);

  // When workspace is created/changed, refresh credits + library immediately.
  useEffect(() => {
    if (!isSignedIn || !workspaceId) return;
    refreshCredits();
    refreshLibrary();
  }, [isSignedIn, workspaceId, refreshCredits, refreshLibrary]);

  // ──────────── Background library polling ────────────
  // Poll workspace jobs every 5s whenever there are active (RUN/WAIT) jobs or
  // optimistic pending entries, so the left library reflects progress across
  // tabs, browsers and devices without waiting for a user action.
  useEffect(() => {
    if (!isSignedIn || !workspaceId) return;
    const hasActive =
      pendingJobs.length > 0 ||
      libraryImages.some((j) => j.status === "RUN" || j.status === "WAIT") ||
      library3DAssets.some((j) => j.status === "RUN" || j.status === "WAIT");
    if (!hasActive) return;
    const interval = setInterval(() => {
      refreshLibrary();
    }, 5000);
    return () => clearInterval(interval);
  }, [isSignedIn, workspaceId, pendingJobs.length, libraryImages, library3DAssets, refreshLibrary]);

  // Refresh when the tab becomes visible again (so the loader state matches
  // the server when the user returns from another tab/device).
  useEffect(() => {
    if (!isSignedIn || !workspaceId) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") refreshLibrary();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isSignedIn, workspaceId, refreshLibrary]);

  // Workspace + jobs are loaded in the same effect that resolves workspaceId (above)
  // so we don't wait an extra render. refreshLibrary() is still used for manual refresh.

  // ──────────── Poll for generating 3D job ────────────
  useEffect(() => {
    if (!currentGenerating || currentGenerating.status !== "generating") return;
    // Water jobs poll via fetchWaterJob in runWater / handle3DClick — never use GPU/GLB status.
    if (
      isWaterJobId(currentGenerating.jobId) ||
      centerView.type === "code"
    ) {
      return;
    }

    let consecutiveFailures = 0;
    const MAX_FAILURES = 5;

    // Hard cap on how long we keep polling a single job. Trellis can take
    // 10–15 min on hard inputs, so we allow up to 25 min before giving up
    // on the UI. The backend will eventually mark the job failed itself,
    // but we don't want the user staring at a forever-spinning preview.
    const MAX_POLL_MS = 25 * 60 * 1000;
    const pollStartedAt = Date.now();

    const pollStatus = async () => {
      // Stop polling if we've exceeded the max client-side wait.
      if (Date.now() - pollStartedAt > MAX_POLL_MS) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        setCurrentGenerating(null);
        setLoading(false);
        setCenterView({
          type: "error",
          message:
            "3D generation is taking longer than expected. It may still complete in the background — check the library in a few minutes.",
        });
        return;
      }
      try {
        const status = await fetchStatus(currentGenerating.jobId);
        consecutiveFailures = 0;

        if (status.queue) {
          const estimatedTotal = status.queue.estimated_total_seconds || currentGenerating.estimatedTotalSeconds || 300;
          setCurrentGenerating((prev) =>
            prev ? { ...prev, queueInfo: status.queue, estimatedTotalSeconds: estimatedTotal } : null
          );
          const startTime = status.created_at || currentGenerating.startTime || Date.now();
          const elapsedSeconds = (Date.now() - startTime) / 1000;

          if (status.queue.position > 0 || (status.queue.jobs_ahead ?? 0) > 0) {
            const jobsAhead = status.queue.jobs_ahead ?? status.queue.position ?? 0;
            const waitSec = status.queue.estimated_wait_seconds ?? 0;
            const waitMin = Math.round(waitSec / 60);
            const waitProgress = waitSec > 0 ? Math.min(45, (elapsedSeconds / waitSec) * 45) : 20;
            const msg = jobsAhead > 0
              ? `Waiting in queue (${jobsAhead} user${jobsAhead !== 1 ? "s" : ""} ahead${waitMin > 0 ? `, ~${waitMin} min` : ""})...`
              : "Starting soon...";
            setCenterView((prev) => {
              // Do not hijack center view if user clicked another item in workspace.
              // Keep updating loading UI only when this generating job is currently in focus.
              const followsCurrentJob =
                prev.type === "generating" ||
                (prev.type === "preview" && prev.previewId === currentGenerating.jobId) ||
                (prev.type === "3d" && prev.jobId === currentGenerating.jobId);
              if (!followsCurrentJob) return prev;
              return { type: "generating", progress: waitProgress, message: msg };
            });
          } else {
            const waitTime = status.queue.estimated_wait_seconds || 0;
            const processingElapsed = Math.max(0, elapsedSeconds - waitTime);
            const processingDuration = estimatedTotal - waitTime;
            const progress = 50 + (processingElapsed / processingDuration) * 45;
            setCenterView((prev) => {
              // Do not hijack center view if user clicked another item in workspace.
              const followsCurrentJob =
                prev.type === "generating" ||
                (prev.type === "preview" && prev.previewId === currentGenerating.jobId) ||
                (prev.type === "3d" && prev.jobId === currentGenerating.jobId);
              if (!followsCurrentJob) return prev;
              return {
                type: "generating",
                progress: Math.max(50, Math.min(95, progress)),
                message: "Generating 3D model...",
              };
            });
          }
        }

        if (status.status === "completed") {
          // Belt-and-suspenders: Water DONE must never open the GLB viewer (404).
          if (isWaterJobId(currentGenerating.jobId)) {
            return;
          }
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          track("3d_generation_completed", {
            model: selectedModel,
          });
          const glbUrl = getGlbUrl(status);
          setCurrentGenerating(null);
          setLoading(false);
          setCenterView({
            type: "3d",
            glbUrl: glbUrl || getProxyGlbUrl(currentGenerating.jobId),
            jobId: currentGenerating.jobId,
          });
          setLeftLibraryTab("3d"); // Switch to 3D tab so new model appears in library below search
          setMobileTab("canvas"); // on mobile, switch to Canvas to show result
          setMobileGeneratedToast(true); // mobile: show "Generated" alert
          refreshLibrary();
          refreshCredits();

          // Update generation info panel for the completed 3D job
          const completed3DJob: BackendJob = {
            id: currentGenerating.jobId,
            resultGlbUrl: glbUrl || getProxyGlbUrl(currentGenerating.jobId),
            previewImageUrl: lastPreviewImageUrl || null,
            prompt: selectedJobInfo?.prompt || null,
            status: "DONE" as const,
            generateType: modelTypeLabel[selectedModel],
            parentJobId: lastPreviewId,
            createdAt: new Date().toISOString(),
            userId: null, imageUrl: null, enablePBR: false, errorCode: null, errorMessage: null, updatedAt: new Date().toISOString(),
          };
          loadJobInfo(completed3DJob);
        } else if (status.status === "failed") {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          track("3d_generation_failed", {
            stage: "processing",
            reason: "job_failed",
          });
          const userFacing = toUserFacingGpuError(status.error || "Generation failed");
          setCurrentGenerating(null);
          setLoading(false);
          void (async () => {
            await waitMobileGpuOfflineMinimum(status.error, userFacing);
            mobileGenStartedAtRef.current = null;
            setCenterView({ type: "error", message: userFacing });
          })();
        } else if (status.status === "cancelled") {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          track("3d_generation_failed", {
            stage: "processing",
            reason: "cancelled",
          });
          setCurrentGenerating(null);
          setLoading(false);
          setCenterView({ type: "error", message: "Job cancelled" });
        }
      } catch {
        consecutiveFailures++;
        if (consecutiveFailures >= MAX_FAILURES) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          track("3d_generation_failed", {
            stage: "polling",
            reason: "connection_lost",
          });
          setCurrentGenerating(null);
          setLoading(false);
          setCenterView({ type: "error", message: "Lost connection to server" });
        }
      }
    };

    const interval = setInterval(pollStatus, 3000);
    pollStatus();
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGenerating?.jobId, currentGenerating?.status]);

  // Mobile "Generated" toast: auto-dismiss after 2.5s
  useEffect(() => {
    if (!mobileGeneratedToast) return;
    if (mobileGeneratedToastRef.current) clearTimeout(mobileGeneratedToastRef.current);
    mobileGeneratedToastRef.current = setTimeout(() => {
      setMobileGeneratedToast(false);
      mobileGeneratedToastRef.current = null;
    }, 2500);
    return () => {
      if (mobileGeneratedToastRef.current) {
        clearTimeout(mobileGeneratedToastRef.current);
        mobileGeneratedToastRef.current = null;
      }
    };
  }, [mobileGeneratedToast]);

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

  // ──────────── Water (bring-your-own model): text → procedural Three.js ────────────
  // No GPU, no credits, no image required. The backend runs the img2threejs-style pipeline
  // (intake gate → spec → blockout codegen → code gate) and we just poll the pass names.
  const runWater = useCallback(
    async (options: { referenceImageUrl?: string | null; parentId?: string | null } = {}) => {
      if (!hasWorkspaceContext) {
        setForcedWorkspaceModal(true);
        setShowNewWorkspaceModal(true);
        setError("Please create a workspace first");
        return;
      }

      const provider = providerForModelId(selectedModel);
      if (!provider || provider === "hydrilla") {
        setError("Pick a bring-your-own model to generate code");
        return;
      }
      if (!providerKeyOk(provider)) {
        setError("Add and verify your API key in Settings → Models & API Keys");
        setCenterView({
          type: "error",
          message: "API key required. Open Settings to add your provider key, then try again.",
        });
        return;
      }

      const description = prompt.trim();
      if (!description) {
        setError("Describe the object you want to build");
        setCenterView({
          type: "error",
          message:
            "Code models build straight from text. Describe the object — e.g. \"a vintage folding camera\" — then Generate.",
        });
        return;
      }

      const referenceImageUrl =
        options.referenceImageUrl &&
        !options.referenceImageUrl.startsWith("blob:") &&
        !options.referenceImageUrl.startsWith("data:")
          ? options.referenceImageUrl
          : null;
      const parentId = options.parentId ?? null;
      const tokenGetter = async () => await getToken();

      track("water_started", {
        model: selectedModel,
        provider,
        mode: referenceImageUrl ? "image_to_code" : "text_to_code",
      });
      // Legacy event name kept for historical PostHog charts
      track("code_sculpt_started", {
        model: selectedModel,
        provider,
        mode: referenceImageUrl ? "image_to_code" : "text_to_code",
      });

      setError(null);
      setLeftLibraryTab("3d");
      markMobileGenerationStart();
      setLoading(true);
      setCodeFactoryCode(null);
      setCodeSculptPass("assessment");
      setCenterView({
        type: "generating",
        progress: 8,
        message: sculptPassLabel("assessment"),
      });

      const pendingId = addPendingJob({
        generateType: "Water",
        previewImageUrl: referenceImageUrl,
        imageUrl: referenceImageUrl,
        parentJobId: parentId,
        parentJobIds: parentId ? [parentId] : [],
      });

      // Invalidate any previous Water poll loop
      const pollGen = ++waterPollGenRef.current;

      try {
        const result = await submitWater({
          prompt: description,
          modelId: selectedModel,
          imageUrl: referenceImageUrl,
          workspaceId,
          parentJobId: parentId,
          getToken: tokenGetter,
        });

        if (pollGen !== waterPollGenRef.current) {
          setLoading(false);
          return;
        }

        mobileGenStartedAtRef.current = null;
        setCurrentGenerating({
          jobId: result.job_id,
          status: "generating",
          progress: 20,
          estimatedTotalSeconds: 120,
          startTime: Date.now(),
        });
        loadJobInfo({
          id: result.job_id,
          userId: null,
          status: "RUN",
          prompt: description,
          imageUrl: referenceImageUrl,
          generateType: "Water",
          enablePBR: false,
          resultGlbUrl: null,
          previewImageUrl: referenceImageUrl,
          errorCode: null,
          errorMessage: null,
          workspaceId: workspaceId ?? null,
          parentJobId: parentId,
          parentJobIds: parentId ? [parentId] : [],
          sourceImages: referenceImageUrl ? [referenceImageUrl] : [],
          engine: "water",
          resultKind: "three_factory",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        removePendingJob(pendingId);
        setLeftLibraryTab("3d");
        refreshLibrary();

        const poll = async () => {
          for (let i = 0; i < 150; i++) {
            if (pollGen !== waterPollGenRef.current) return;
            await new Promise((r) => setTimeout(r, 2000));
            if (pollGen !== waterPollGenRef.current) return;
            try {
              const job = await fetchWaterJob(result.job_id, tokenGetter);
              if (pollGen !== waterPollGenRef.current) return;

              if (job.status === "DONE" && job.factoryCode) {
                setCodeFactoryCode(job.factoryCode);
                setCodeSculptPass(job.sculptPass || "done");
                setCurrentGenerating(null);
                setCenterView({ type: "code", factoryCode: job.factoryCode, jobId: result.job_id });
                setMobileTab("canvas");
                setMobileGeneratedToast(true);
                setSelectedJobInfo((prev) =>
                  prev && prev.id === result.job_id
                    ? { ...prev, status: "DONE", sculptPass: job.sculptPass || "done", hasFactoryCode: true }
                    : prev
                );
                setLibrary3DAssets((prev) =>
                  applyCodeThumbs(
                    prev.map((j) =>
                      j.id === result.job_id
                        ? { ...j, status: "DONE" as const, hasFactoryCode: true, sculptPass: job.sculptPass || "done" }
                        : j
                    )
                  )
                );
                refreshLibrary();
                setLoading(false);
                return;
              }
              if (job.status === "FAIL") {
                setCurrentGenerating(null);
                setCenterView({
                  type: "error",
                  message: job.errorMessage || "Water failed",
                });
                setSelectedJobInfo((prev) =>
                  prev && prev.id === result.job_id ? { ...prev, status: "FAIL", errorMessage: job.errorMessage } : prev
                );
                setLibrary3DAssets((prev) =>
                  prev.map((j) => (j.id === result.job_id ? { ...j, status: "FAIL" as const } : j))
                );
                setLoading(false);
                return;
              }
              const progress = Math.min(92, 20 + i * 1.5);
              setCodeSculptPass(job.sculptPass || "assessment");
              setSelectedJobInfo((prev) =>
                prev && prev.id === result.job_id
                  ? { ...prev, status: "RUN", sculptPass: job.sculptPass || "assessment" }
                  : prev
              );
              setCurrentGenerating((prev) =>
                prev && prev.jobId === result.job_id
                  ? { ...prev, progress, status: "generating" }
                  : prev
              );
              setCenterView((prev) => {
                if (prev.type !== "generating") return prev;
                return {
                  type: "generating",
                  progress,
                  message: sculptPassLabel(job.sculptPass),
                };
              });
            } catch {
              // transient — keep polling
            }
          }
          if (pollGen !== waterPollGenRef.current) return;
          setCurrentGenerating(null);
          setCenterView({
            type: "error",
            message: "Water timed out. Open the job from the library later.",
          });
          setLoading(false);
        };
        void poll();
        // Keep loading=true while currentGenerating drives the button/spinner.
        // poll() clears both when DONE / FAIL / timeout.
      } catch (err: unknown) {
        const msg =
          err && typeof err === "object" && "message" in err
            ? String((err as { message?: string }).message)
            : "Water failed";
        removePendingJob(pendingId);
        mobileGenStartedAtRef.current = null;
        setCurrentGenerating(null);
        setCenterView({ type: "error", message: msg });
        setLoading(false);
      }
    },
    [
      hasWorkspaceContext,
      selectedModel,
      providerKeyOk,
      prompt,
      getToken,
      workspaceId,
      markMobileGenerationStart,
      addPendingJob,
      removePendingJob,
      refreshLibrary,
    ]
  );

  // Helper: start 3D generation from image URL (used after image gen or when we already have preview).
  // When `localFile` is set (user picked a file from disk), pass it straight into `submitImageTo3D` so
  // the client upload path matches /generate page — avoids relying on a separate pre-upload + URL that
  // can be wrong (gateway vs backend, blob quirks, or localhost URLs in dev).
  const start3DFromImage = useCallback(
    async (imageUrl: string, previewId: string | null, localFile: File | null = null) => {
      if (!hasWorkspaceContext) {
        setForcedWorkspaceModal(true);
        setShowNewWorkspaceModal(true);
        setError("Please create a workspace first");
        return;
      }

      // Water engine. The image is only ever an extra reference.
      if (isCodeModel(selectedModel)) {
        let reference: string | null = imageUrl || null;
        if (localFile) {
          try {
            reference = await uploadImage(localFile, async () => await getToken());
          } catch {
            reference = null;
          }
        }
        await runWater({ referenceImageUrl: reference, parentId: previewId });
        return;
      }

      track("image_to_3d_started", {
        model: selectedModel,
        has_local_file: !!localFile,
        has_preview_id: !!previewId,
      });
      const tokenGetter = async () => await getToken();
      setLeftLibraryTab("3d"); // Switch to 3D tab so result will show in 3D section below search
      markMobileGenerationStart();
      setLoading(true);
      setCenterView({ type: "generating", progress: 0, message: "Generating 3D model..." });

      // Optimistic pending entry so the 3D library shows a loader immediately
      // (before the API returns) and the user sees progress without delay.
      const pendingId = addPendingJob({
        generateType: "ImageTo3D",
        previewImageUrl: imageUrl,
        imageUrl,
        parentJobId: previewId ?? null,
        parentJobIds: previewId ? [previewId] : [],
      });
      loadJobInfo({
        id: pendingId,
        userId: null,
        status: "WAIT",
        prompt: prompt.trim() || null,
        imageUrl,
        generateType: "ImageTo3D",
        enablePBR: false,
        resultGlbUrl: null,
        previewImageUrl: imageUrl,
        errorCode: null,
        errorMessage: null,
        workspaceId: workspaceId ?? null,
        parentJobId: previewId ?? null,
        parentJobIds: previewId ? [previewId] : [],
        sourceImages: [imageUrl],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      let queueInfo: QueueInfo | null = null;
      try {
        queueInfo = await fetchQueueInfo();
      } catch (err: unknown) {
        const msg = err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message) : "";
        const userFacing = msg?.includes("GPU is currently offline")
          ? toUserFacingGpuError(msg)
          : toUserFacingGpuError("Failed to get queue info");
        if (msg?.includes("GPU is currently offline")) {
          notifyGpuOffline(msg, tokenGetter);
        }
        await waitMobileGpuOfflineMinimum(msg, userFacing);
        mobileGenStartedAtRef.current = null;
        setCenterView({ type: "error", message: userFacing });
        removePendingJob(pendingId);
        setLoading(false);
        track("3d_generation_failed", {
          stage: "queue_info",
          reason: msg?.includes("GPU is currently offline") ? "gpu_offline" : "queue_error",
        });
        return;
      }
      const estimatedTotal = queueInfo?.estimated_total_seconds || 300;
      try {
        const result = await submitImageTo3D(
          localFile ? null : imageUrl,
          localFile,
          tokenGetter,
          previewId,
          null,
          workspaceId,
          previewId,
          selectedModel
        );
        mobileGenStartedAtRef.current = null;
        setCurrentGenerating({
          jobId: result.job_id,
          status: "generating",
          progress: 0,
          estimatedTotalSeconds: estimatedTotal,
          startTime: Date.now(),
          queueInfo: queueInfo || undefined,
        });
        loadJobInfo({
          id: result.job_id,
          userId: null,
          status: "RUN",
          prompt: prompt.trim() || null,
          imageUrl,
          generateType: "ImageTo3D",
          enablePBR: false,
          resultGlbUrl: null,
          previewImageUrl: imageUrl,
          errorCode: null,
          errorMessage: null,
          workspaceId: workspaceId ?? null,
          parentJobId: previewId ?? null,
          parentJobIds: previewId ? [previewId] : [],
          sourceImages: [imageUrl],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        // Kick a library refresh so the newly-created server job shows up and replaces the pending.
        refreshLibrary();
      } catch (err: unknown) {
        const msg = err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message) : "Failed to start 3D";
        if (isPaywallError(msg)) {
          track("paywall_hit", { source: "image_to_3d", action: "generate_3d" });
        }
        track("3d_generation_failed", {
          stage: "submit",
          reason: isPaywallError(msg) ? "insufficient_credits" : "submit_error",
        });
        const userFacing = toUserFacingGpuError(msg);
        await waitMobileGpuOfflineMinimum(msg, userFacing);
        mobileGenStartedAtRef.current = null;
        setCenterView({ type: "error", message: userFacing });
        removePendingJob(pendingId);
      }
      setLoading(false);
    },
    [getToken, workspaceId, hasWorkspaceContext, markMobileGenerationStart, selectedModel, waitMobileGpuOfflineMinimum, addPendingJob, removePendingJob, refreshLibrary, runWater]
  );

  // ──────────── STEP 1: Generate Image (optionally then 3D) ────────────
  const handleGenerateImage = async (thenGenerate3D?: boolean) => {
    if (loading || generatingPreview) return;
    setError(null);

    // Architectural guard: no caller can accidentally send a bring-your-own
    // model through TextToImage, FLUX, Trellis, credits, or the GPU queue.
    if (selectedIsCode) {
      await runWater();
      return;
    }

    if (!hasWorkspaceContext) {
      setForcedWorkspaceModal(true);
      setShowNewWorkspaceModal(true);
      setError("Please create a workspace first");
      return;
    }
    if (prompt.trim()) savePromptToHistory(prompt);
    if (!thenGenerate3D) {
      setLastPreviewImageUrl(null);
      setLastPreviewId(null);
    }

    const tokenGetter = async () => await getToken();

    // ── Text-only: /text-to-image (generatePreviewImage) ──
    if (inputMode === "text") {
      if (!prompt.trim()) { setError("Please enter a prompt"); return; }

      track("text_to_image_started", { then_generate_3d: !!thenGenerate3D });
      setGeneratingPreview(true);
      markMobileGenerationStart();
      setCenterView({ type: "generating", progress: 0, message: "Generating image from text..." });

      // Optimistic pending entry so the image library shows a loader immediately.
      const pendingTextImageId = addPendingJob({
        generateType: "TextToImage",
        prompt: prompt.trim(),
      });
      loadJobInfo({
        id: pendingTextImageId,
        userId: null,
        status: "WAIT",
        prompt: prompt.trim(),
        imageUrl: null,
        generateType: "TextToImage",
        enablePBR: false,
        resultGlbUrl: null,
        previewImageUrl: null,
        errorCode: null,
        errorMessage: null,
        workspaceId: workspaceId ?? null,
        parentJobId: null,
        parentJobIds: [],
        sourceImages: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setLeftLibraryTab("images");

      let queueInfo: QueueInfo | null = null;
      try { queueInfo = await fetchQueueInfo(); } catch (err: any) {
        if (err.message?.includes("GPU is currently offline")) {
          notifyGpuOffline(err.message, tokenGetter);
          const userFacing = toUserFacingGpuError(err.message);
          await waitMobileGpuOfflineMinimum(err.message, userFacing);
          mobileGenStartedAtRef.current = null;
          setCenterView({ type: "error", message: userFacing });
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
        const result = await generatePreviewImage(prompt.trim(), tokenGetter, {
          workspaceId,
        });
        if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }

        setLastPreviewImageUrl(result.image_url);
        setLastPreviewId(result.preview_id);
        setCurrentParentJobId(result.preview_id); // This new image becomes parent for next iteration
        setLeftLibraryTab("images"); // Keep on Images tab when showing generated image
        setCenterView({ type: "preview", imageUrl: result.image_url, previewId: result.preview_id });
        setGeneratingPreview(false);
        mobileGenStartedAtRef.current = null;
        setMobileTab("canvas");
        setMobileGeneratedToast(true);

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
        removePendingJob(pendingTextImageId);
        refreshLibrary();

        // Update generation info panel
        const newJob = { id: result.preview_id, previewImageUrl: result.image_url, prompt: prompt.trim(), status: "DONE" as const, generateType: "TextToImage", createdAt: new Date().toISOString(), userId: null, imageUrl: null, enablePBR: false, resultGlbUrl: null, errorCode: null, errorMessage: null, updatedAt: new Date().toISOString() } satisfies BackendJob;
        loadJobInfo(newJob);

        if (thenGenerate3D) await start3DFromImage(result.image_url, result.preview_id);
      } catch (err: any) {
        if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }
        if (isPaywallError(err?.message)) {
          track("paywall_hit", { source: "text_to_image", action: "generate_image" });
        }
        const userFacing = toUserFacingGpuError(err.message || "Failed to generate image");
        await waitMobileGpuOfflineMinimum(err.message, userFacing);
        mobileGenStartedAtRef.current = null;
        setCenterView({ type: "error", message: userFacing });
        setGeneratingPreview(false);
        removePendingJob(pendingTextImageId);
      }
      return;
    }

    // ── Image only: upload or library image → 3D (no text-to-image, no edit API) ──
    if (inputMode === "image") {
      if (!file1 && !image1) {
        setError("Please upload an image");
        return;
      }
      setError(null);
      let imageUrl: string;
      if (file1) {
        try {
          imageUrl = await uploadSourceImageWithFallback(file1, tokenGetter);
        } catch (err: any) {
          setError(err?.message || "Failed to upload image");
          return;
        }
      } else {
        imageUrl = image1!;
      }
      setLastPreviewImageUrl(imageUrl);
      setLastPreviewId(jobId1);
      setCenterView({ type: "preview", imageUrl, previewId: jobId1 || undefined });
      await start3DFromImage(imageUrl, jobId1);
      return;
    }

    // ── Text + 1 image: /edit-image (image-to-image), or image-to-3D if no prompt ──
    if (inputMode === "text_1img") {
      if (!file1 && !image1) { setError("Please upload an image"); return; }

      // No prompt: send the image directly to 3D model generation
      if (!prompt.trim()) {
        setError(null);
        const tokenGetter = async () => await getToken();
        let imageUrl: string;
        if (file1) {
          try {
            imageUrl = await uploadSourceImageWithFallback(file1, tokenGetter);
          } catch (err: any) {
            setError(err?.message || "Failed to upload image");
            return;
          }
        } else {
          imageUrl = image1!;
        }
        setLastPreviewImageUrl(imageUrl);
        setLastPreviewId(jobId1);
        setCenterView({ type: "preview", imageUrl, previewId: jobId1 || undefined });
        await start3DFromImage(imageUrl, jobId1);
        return;
      }

      setGeneratingPreview(true);
      markMobileGenerationStart();
      setCenterView({ type: "generating", progress: 0, message: "Editing image..." });
      track("image_edit_started", { mode: "text_1img" });

      const pendingEditId = addPendingJob({
        generateType: "EditImage",
        prompt: prompt.trim(),
        previewImageUrl: image1 ?? null,
        imageUrl: image1 ?? null,
        parentJobId: jobId1 ?? currentParentJobId ?? null,
        parentJobIds: jobId1 ? [jobId1] : [],
      });
      loadJobInfo({
        id: pendingEditId,
        userId: null,
        status: "WAIT",
        prompt: prompt.trim(),
        imageUrl: image1 ?? null,
        generateType: "EditImage",
        enablePBR: false,
        resultGlbUrl: null,
        previewImageUrl: image1 ?? null,
        errorCode: null,
        errorMessage: null,
        workspaceId: workspaceId ?? null,
        parentJobId: jobId1 ?? currentParentJobId ?? null,
        parentJobIds: jobId1 ? [jobId1] : [],
        sourceImages: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setLeftLibraryTab("images");

      const estimatedTime = 30;
      const startTime = Date.now();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(90, (elapsed / estimatedTime) * 95);
        setCenterView({ type: "generating", progress, message: "Editing image..." });
      }, 200);

      try {
        // Resolve source image URL via gateway API → S3 (fallback: backend so uploads work when gateway is down)
        const srcUrl = file1
          ? await uploadSourceImageWithFallback(file1, tokenGetter)
          : (image1 ?? null);
        const editSrcImages = srcUrl ? [srcUrl] : [];

        const result = await editImage(prompt.trim(), file1, image1, tokenGetter, {
          workspaceId,
          parentJobId: jobId1 || currentParentJobId || null,
          parentJobIds: jobId1 ? [jobId1] : [],
          sourceImages: editSrcImages,
        });
        if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }

        const editParent = jobId1 || currentParentJobId; // The image being edited is the parent
        const editParentIds = editParent ? [editParent] : [];

        setLastPreviewImageUrl(result.image_url);
        setLastPreviewId(result.edit_id);
        setCurrentParentJobId(result.edit_id); // This new edit becomes parent for next iteration
        setLeftLibraryTab("images"); // Keep on Images tab when showing edited image
        setCenterView({ type: "preview", imageUrl: result.image_url, previewId: result.edit_id });
        setGeneratingPreview(false);
        mobileGenStartedAtRef.current = null;
        setMobileTab("canvas");
        setMobileGeneratedToast(true);

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
        removePendingJob(pendingEditId);
        refreshLibrary();

        // Update generation info panel
        const editedJob = { id: result.edit_id, previewImageUrl: result.image_url, prompt: prompt.trim(), status: "DONE" as const, generateType: "EditImage", parentJobId: editParent, parentJobIds: editParentIds, sourceImages: editSrcImages, createdAt: new Date().toISOString(), userId: null, imageUrl: null, enablePBR: false, resultGlbUrl: null, errorCode: null, errorMessage: null, updatedAt: new Date().toISOString() } satisfies BackendJob;
        loadJobInfo(editedJob);

        if (thenGenerate3D) await start3DFromImage(result.image_url, result.edit_id);
      } catch (err: any) {
        if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }
        if (isPaywallError(err?.message)) {
          track("paywall_hit", { source: "image_edit", action: "edit_image" });
        }
        const userFacing = toUserFacingGpuError(err.message || "Failed to edit image");
        await waitMobileGpuOfflineMinimum(err.message, userFacing);
        mobileGenStartedAtRef.current = null;
        setCenterView({ type: "error", message: userFacing });
        setGeneratingPreview(false);
        removePendingJob(pendingEditId);
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

      track("image_edit_started", { mode: "text_2img" });
      setGeneratingPreview(true);
      markMobileGenerationStart();
      setCenterView({ type: "generating", progress: 0, message: "Combining images..." });

      const combinedPendingParentIds: string[] = [];
      if (jobId1) combinedPendingParentIds.push(jobId1);
      if (jobId2) combinedPendingParentIds.push(jobId2);
      const pendingCombinedId = addPendingJob({
        generateType: "Combined",
        prompt: prompt.trim(),
        previewImageUrl: image1 ?? image2 ?? null,
        imageUrl: image1 ?? image2 ?? null,
        parentJobId: jobId1 ?? jobId2 ?? currentParentJobId ?? null,
        parentJobIds: combinedPendingParentIds,
      });
      loadJobInfo({
        id: pendingCombinedId,
        userId: null,
        status: "WAIT",
        prompt: prompt.trim(),
        imageUrl: image1 ?? image2 ?? null,
        generateType: "Combined",
        enablePBR: false,
        resultGlbUrl: null,
        previewImageUrl: image1 ?? image2 ?? null,
        errorCode: null,
        errorMessage: null,
        workspaceId: workspaceId ?? null,
        parentJobId: jobId1 ?? jobId2 ?? currentParentJobId ?? null,
        parentJobIds: combinedPendingParentIds,
        sourceImages: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setLeftLibraryTab("images");

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
          url1 = await uploadSourceImageWithFallback(file1, tokenGetter);
        } else {
          url1 = image1!; // from library (already S3 or proxy URL)
        }
        if (file2) {
          url2 = await uploadSourceImageWithFallback(file2, tokenGetter);
        } else {
          url2 = image2!; // from library
        }
        const srcImages: string[] = [url1, url2];
        const parentIds: string[] = [];
        if (jobId1) parentIds.push(jobId1);
        if (jobId2) parentIds.push(jobId2);
        const primaryParent = jobId1 || jobId2 || currentParentJobId;

        // Send files if available, otherwise URLs (from workspace library)
        const result = await combinedEdit(
          prompt.trim(),
          file1,
          file2,
          tokenGetter,
          file1 ? null : image1,  // URL for slot 1 if no file
          file2 ? null : image2,   // URL for slot 2 if no file
          {
            workspaceId,
            parentJobId: primaryParent,
            parentJobIds: parentIds,
            sourceImages: srcImages,
          }
        );
        if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }

        setLastPreviewImageUrl(result.image_url);
        setLastPreviewId(result.combined_id);
        setCurrentParentJobId(result.combined_id); // This new combined image becomes parent for next iteration
        setLeftLibraryTab("images"); // Keep on Images tab when showing combined image
        setCenterView({ type: "preview", imageUrl: result.image_url, previewId: result.combined_id });
        setGeneratingPreview(false);
        mobileGenStartedAtRef.current = null;
        setMobileTab("canvas");
        setMobileGeneratedToast(true);

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
        removePendingJob(pendingCombinedId);
        refreshLibrary();

        // Update generation info panel
        const combinedJob = {
          id: result.combined_id, previewImageUrl: result.image_url, prompt: prompt.trim(),
          status: "DONE" as const, generateType: "Combined",
          parentJobId: primaryParent, parentJobIds: parentIds, sourceImages: srcImages,
          createdAt: new Date().toISOString(), userId: null, imageUrl: null,
          enablePBR: false, resultGlbUrl: null,
          errorCode: null, errorMessage: null, updatedAt: new Date().toISOString(),
        } satisfies BackendJob;
        loadJobInfo(combinedJob);

        if (thenGenerate3D) await start3DFromImage(result.image_url, result.combined_id);
      } catch (err: any) {
        if (progressIntervalRef.current) { clearInterval(progressIntervalRef.current); progressIntervalRef.current = null; }
        if (isPaywallError(err?.message)) {
          track("paywall_hit", { source: "combined_edit", action: "combine_images" });
        }
        const userFacing = toUserFacingGpuError(err.message || "Failed to combine images");
        await waitMobileGpuOfflineMinimum(err.message, userFacing);
        mobileGenStartedAtRef.current = null;
        setCenterView({ type: "error", message: userFacing });
        setGeneratingPreview(false);
        removePendingJob(pendingCombinedId);
      }
    }
  };

  // ──────────── Generate 3D: from current preview, or generate image first then 3D ────────────
  // Single entry point for "Generate 3D" everywhere (center preview button AND
  // the bottom "Generate 3D" button when inputMode === "image"). Previously the
  // bottom button went through `handleGenerateImage()` which clears
  // `lastPreviewImageUrl/Id` at its start (line ~1059) — that desyncs the
  // polling effect's `prev.previewId === currentGenerating.jobId` check and
  // leaves the user staring at a spinner that never updates. Routing both
  // buttons through this function keeps the working "library click → Generate
  // 3D Model" flow intact and uses an identical code path for fresh uploads.
  const handleGenerate3D = async () => {
    setError(null);
    if (loading || generatingPreview) return;
    if (!hasWorkspaceContext) {
      setForcedWorkspaceModal(true);
      setShowNewWorkspaceModal(true);
      setError("Please create a workspace first");
      return;
    }

    // Water engine writes Three.js straight from the prompt.
    // Never touches FLUX, Trellis, the queue, or credits.
    if (selectedIsCode) {
      await runWater();
      return;
    }

    // image mode (or text_1img with no prompt): pass disk `File` straight into
    // `submitImageTo3D` (via start3DFromImage) instead of a separate upload step,
    // so behavior matches the working /generate flow and the GPU always receives
    // a URL the worker can fetch (from gateway/backend upload inside submit).
    if (inputMode === "image" || (inputMode === "text_1img" && !prompt.trim())) {
      if (!file1 && !image1 && !lastPreviewImageUrl) {
        setError("Please upload or select an image");
        return;
      }
      let parentId: string | null = jobId1 ?? lastPreviewId;
      let displayUrl: string;
      let fileForSubmit: File | null = file1;
      let revokeDisplayUrl: string | null = null;
      if (file1) {
        parentId = null;
        if (image1) {
          displayUrl = image1;
        } else {
          revokeDisplayUrl = URL.createObjectURL(file1);
          displayUrl = revokeDisplayUrl;
        }
      } else if (image1) {
        displayUrl = image1;
      } else {
        displayUrl = lastPreviewImageUrl!;
      }
      try {
        setLastPreviewImageUrl(displayUrl);
        setLastPreviewId(parentId);
        setCenterView({ type: "preview", imageUrl: displayUrl, previewId: parentId || undefined });
        await start3DFromImage(displayUrl, parentId, fileForSubmit);
      } finally {
        if (revokeDisplayUrl) URL.revokeObjectURL(revokeDisplayUrl);
      }
      return;
    }

    // We already have a generated preview in the center → reuse its URL.
    if (lastPreviewImageUrl) {
      await start3DFromImage(lastPreviewImageUrl, lastPreviewId);
      return;
    }

    // No image and no preview: generate image first (using current text mode),
    // then chain straight into 3D. (Hydrilla cloud / Trilles only — Water returns earlier.)
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

    // If this job is queued/running for 3D generation, restore generating state in center.
    if ((job.status === "RUN" || job.status === "WAIT") && !job.resultGlbUrl && is3DGenerationType(job.generateType)) {
      setLeftLibraryTab("3d"); // Switch to 3D tab when viewing a job that is generating 3D
      setCurrentGenerating({
        jobId: job.id,
        status: "generating",
        progress: 0,
        estimatedTotalSeconds: 300,
        startTime: Number.isFinite(Date.parse(job.createdAt)) ? Date.parse(job.createdAt) : Date.now(),
      });
      setCenterView({
        type: "generating",
        progress: job.status === "WAIT" ? 5 : 15,
        message: job.status === "WAIT" ? "Queued for 3D generation..." : "Generating 3D model...",
      });
      setLastPreviewImageUrl(imageUrl);
      setLastPreviewId(job.id);
      setCurrentParentJobId(job.id);
      loadJobInfo(job);
      return;
    }

    if (inputMode === "image") {
      setLastPreviewImageUrl(imageUrl);
      setLastPreviewId(job.id);
      setCurrentParentJobId(job.id);
      setLeftLibraryTab("images");
      setCenterView({ type: "preview", imageUrl, previewId: job.id });
      setModeStates((prev) => ({
        ...prev,
        image: {
          ...prev.image,
          image1: imageUrl,
          file1: null,
          jobId1: job.id,
          prompt: "",
        },
      }));
      loadJobInfo(job);
      return;
    }

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
      setLeftLibraryTab("images");
      setCenterView({ type: "preview", imageUrl, previewId: job.id });
      loadJobInfo(job);
      return;
    }

    // Default behavior: switch to text_1img mode
    setLastPreviewImageUrl(imageUrl);
    setLastPreviewId(job.id);
    setCurrentParentJobId(job.id); // This library image becomes parent for next edit/3D
    setLeftLibraryTab("images");
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
    // Prefer Water path for wt_/cs_ even if list payload omitted engine fields.
    if (isWaterJobFn(job) || isWaterJobId(job.id)) {
      setLeftLibraryTab("3d");
      if (job.status === "RUN" || job.status === "WAIT") {
        const pollGen = ++waterPollGenRef.current;
        setCurrentGenerating({
          jobId: job.id,
          status: "generating",
          progress: 20,
          estimatedTotalSeconds: 90,
          startTime: Number.isFinite(Date.parse(job.createdAt)) ? Date.parse(job.createdAt) : Date.now(),
        });
        setLoading(true);
        setCenterView({
          type: "generating",
          progress: 20,
          message: "Water · building…",
        });
        loadJobInfo(job);
        // Resume poll
        void (async () => {
          const tokenGetter = async () => (await getToken()) ?? null;
          for (let i = 0; i < 150; i++) {
            if (pollGen !== waterPollGenRef.current) return;
            await new Promise((r) => setTimeout(r, 2000));
            if (pollGen !== waterPollGenRef.current) return;
            try {
              const cs = await fetchWaterJob(job.id, tokenGetter);
              if (pollGen !== waterPollGenRef.current) return;
              if (cs.status === "DONE" && cs.factoryCode) {
                setCodeFactoryCode(cs.factoryCode);
                setCodeSculptPass(cs.sculptPass);
                setCurrentGenerating(null);
                setLoading(false);
                setCenterView({ type: "code", factoryCode: cs.factoryCode, jobId: job.id });
                setMobileTab("canvas");
                setMobileGeneratedToast(true);
                setSelectedJobInfo((prev) =>
                  prev && prev.id === job.id
                    ? { ...prev, status: "DONE", sculptPass: cs.sculptPass, hasFactoryCode: true }
                    : prev
                );
                setLibrary3DAssets((prev) =>
                  prev.map((j) =>
                    j.id === job.id
                      ? { ...j, status: "DONE" as const, hasFactoryCode: true, sculptPass: cs.sculptPass }
                      : j
                  )
                );
                return;
              }
              if (cs.status === "FAIL") {
                setCurrentGenerating(null);
                setLoading(false);
                setCenterView({ type: "error", message: cs.errorMessage || "Water failed" });
                setSelectedJobInfo((prev) =>
                  prev && prev.id === job.id ? { ...prev, status: "FAIL" } : prev
                );
                return;
              }
              const progress = Math.min(92, 20 + i * 1.5);
              setCodeSculptPass(cs.sculptPass);
              setSelectedJobInfo((prev) =>
                prev && prev.id === job.id
                  ? { ...prev, status: "RUN", sculptPass: cs.sculptPass }
                  : prev
              );
              setCurrentGenerating((prev) =>
                prev && prev.jobId === job.id ? { ...prev, progress, status: "generating" } : prev
              );
              setCenterView((prev) => {
                if (prev.type !== "generating") return prev;
                return {
                  type: "generating",
                  progress,
                  message: sculptPassLabel(cs.sculptPass),
                };
              });
            } catch {
              // continue
            }
          }
          if (pollGen !== waterPollGenRef.current) return;
          setCurrentGenerating(null);
          setLoading(false);
          setCenterView({
            type: "error",
            message: "Water timed out. Try opening the job again from the library.",
          });
        })();
        return;
      }
      const inlineCode =
        job.factoryCode && job.factoryCode !== "__present__" ? job.factoryCode : null;
      if (inlineCode) {
        setCodeFactoryCode(inlineCode);
        setCurrentGenerating(null);
        setLoading(false);
        setCenterView({ type: "code", factoryCode: inlineCode, jobId: job.id });
        loadJobInfo(job);
        return;
      }
      // Fetch factory if not on job payload yet (list API only signals hasFactoryCode)
      setCenterView({
        type: "generating",
        progress: 40,
        message: "Loading Water preview…",
      });
      void (async () => {
        try {
          const tokenGetter = async () => (await getToken()) ?? null;
          const cs = await fetchWaterJob(job.id, tokenGetter);
          if (cs.factoryCode) {
            setCodeFactoryCode(cs.factoryCode);
            setCodeSculptPass(cs.sculptPass);
            setCurrentGenerating(null);
            setLoading(false);
            setCenterView({ type: "code", factoryCode: cs.factoryCode, jobId: job.id });
          } else if (cs.status === "FAIL") {
            setCurrentGenerating(null);
            setLoading(false);
            setCenterView({ type: "error", message: cs.errorMessage || "Water failed" });
          } else {
            setCurrentGenerating(null);
            setLoading(false);
            setCenterView({
              type: "error",
              message: "Code is not ready yet. Wait a moment and try again.",
            });
          }
        } catch {
          setCurrentGenerating(null);
          setLoading(false);
          setCenterView({ type: "error", message: "Could not load Water result" });
        }
      })();
      loadJobInfo(job);
      return;
    }

    if (isWaterJobId(job.id)) {
      // Should have been handled above; never fall through to GLB proxy.
      return;
    }

    if ((job.status === "RUN" || job.status === "WAIT") && !job.resultGlbUrl) {
      setLeftLibraryTab("3d");
      setCurrentGenerating({
        jobId: job.id,
        status: "generating",
        progress: 0,
        estimatedTotalSeconds: 300,
        startTime: Number.isFinite(Date.parse(job.createdAt)) ? Date.parse(job.createdAt) : Date.now(),
      });
      setCenterView({
        type: "generating",
        progress: job.status === "WAIT" ? 5 : 15,
        message: job.status === "WAIT" ? "Queued for 3D generation..." : "Generating 3D model...",
      });
      if (job.previewImageUrl || job.imageUrl) {
        setLastPreviewImageUrl(job.previewImageUrl || job.imageUrl);
        setLastPreviewId(job.id);
        setCurrentParentJobId(job.id);
      }
      loadJobInfo(job);
      return;
    }

    if (job.resultGlbUrl) {
      setLeftLibraryTab("3d"); // Keep 3D tab active when viewing a 3D model
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
    enablePBR: false,
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
      setLeftLibraryTab("images");
      setCenterView({ type: "preview", imageUrl, previewId: item.id });
      if (inputMode === "image") {
        setModeStates((prev) => ({
          ...prev,
          image: {
            ...prev.image,
            image1: imageUrl,
            file1: null,
            jobId1: item.id,
            prompt: "",
          },
        }));
      } else {
        setInputMode("text_1img");
        setModeStates((prev) => ({
          ...prev,
          text_1img: {
            ...prev.text_1img,
            image1: imageUrl,
            file1: null,
            jobId1: item.id,
            prompt: prev.text_1img.prompt ?? "",
          },
        }));
      }
    }
    loadJobInfo(job);
  }, [lineageItemToJob, loadJobInfo, inputMode]);

  // ──────────── Filtered library ────────────
  // Merge optimistic pending entries with server jobs. Pendings appear first so the
  // loader shows immediately on user action, and stay visible until the server returns
  // the real RUN/WAIT job (at which point refreshLibrary prunes the pending).
  const pendingImageJobs = pendingJobs.filter((p) => !is3DGenerationType(p.generateType));
  const pending3DJobs = pendingJobs.filter((p) => is3DGenerationType(p.generateType));
  const mergedLibraryImages = [...pendingImageJobs, ...libraryImages];
  const mergedLibrary3DAssets = [...pending3DJobs, ...library3DAssets];
  const filteredImages = mergedLibraryImages.filter((a) =>
    (a.prompt || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filtered3DAssets = mergedLibrary3DAssets.filter((a) =>
    (a.prompt || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isGenerating = loading || generatingPreview || (currentGenerating?.status === "generating");
  const mobileCanvasGenerating =
    centerView.type === "generating" ||
    Boolean(
      centerView.type === "preview" &&
        currentGenerating?.status === "generating" &&
        centerView.previewId === currentGenerating.jobId
    );
  const mobileGeneratingMessage =
    centerView.type === "generating" ? centerView.message : "Generating 3D model...";
  const mobileGeneratingProgress =
    centerView.type === "generating" ? centerView.progress : (currentGenerating?.progress ?? 0);
  const showGenerate3DButton = centerView.type === "preview" && lastPreviewImageUrl && !isGenerating;

  // Mobile: open 3D from /generations via ?open3d=jobId — show in canvas and switch to Canvas tab
  useEffect(() => {
    const open3dId = searchParams.get("open3d");
    if (!open3dId || libraryLoading) return;
    const job = library3DAssets.find((j) => j.id === open3dId);
    if (!job) return;
    if (isWaterJob(job) || isWaterJobId(job.id)) {
      handle3DClick(job);
      setMobileTab("canvas");
      window.history.replaceState(null, "", workspaceId ? `/workspace/${workspaceId}` : "/workspace");
      return;
    }
    if (job.resultGlbUrl) {
      setLeftLibraryTab("3d");
      setCenterView({ type: "3d", glbUrl: getProxyGlbUrl(job.id), jobId: job.id });
      loadJobInfo(job);
      setMobileTab("canvas");
      window.history.replaceState(null, "", workspaceId ? `/workspace/${workspaceId}` : "/workspace");
    }
  }, [searchParams, libraryLoading, library3DAssets, loadJobInfo, workspaceId]);

  if (resolvingWorkspace) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fafafa]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
          <p className="text-sm text-neutral-500">Loading workspace…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#fafafa] text-neutral-950 font-dm-sans">
      {/* No top navbar — left nav in left sidebar, right nav (name, My Library, profile, collapse) in right sidebar */}

      {/* New Workspace name modal */}
      {showNewWorkspaceModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4"
          onClick={() => {
            if (newWorkspaceCreating) return;
            if (forcedWorkspaceModal) return;
            setShowNewWorkspaceModal(false);
          }}
        >
          <Card className="w-full max-w-md rounded-[22px] border-neutral-200/60 bg-white/95 backdrop-blur-xl shadow-[0_24px_80px_-16px_rgba(0,0,0,0.28)]" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-6 sm:p-7">
            <h2 className="mb-1 text-[17px] font-semibold tracking-tight text-neutral-900">New workspace</h2>
            <p className="mb-5 text-sm text-neutral-500">Give your workspace a name to get started.</p>
            <Input
              type="text"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="e.g. My Project, Character Pack"
              className="mb-5 h-11 rounded-xl border-neutral-200 bg-neutral-50/80 shadow-none focus-visible:border-neutral-300 focus-visible:ring-neutral-900/[0.04]"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (newWorkspaceName.trim()) handleCreateNewWorkspace();
                }
                if (e.key === "Escape") {
                  if (!forcedWorkspaceModal) setShowNewWorkspaceModal(false);
                }
              }}
              autoFocus
              disabled={newWorkspaceCreating}
            />
            <div className="flex gap-2.5 justify-end">
              {!forcedWorkspaceModal && (
                <Button
                  type="button"
                  onClick={() => !newWorkspaceCreating && setShowNewWorkspaceModal(false)}
                  variant="ghost"
                  disabled={newWorkspaceCreating}
                  className="h-10 rounded-full"
                >
                  Cancel
                </Button>
              )}
              <Button
                type="button"
                onClick={handleCreateNewWorkspace}
                disabled={!newWorkspaceName.trim() || newWorkspaceCreating}
                className="h-10 rounded-full"
              >
                {newWorkspaceCreating ? "Creating…" : "Create"}
              </Button>
            </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lineage item preview popup — click Creation Lineage step to preview; Select shows in main view */}
      {lineagePreviewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4"
          onClick={() => setLineagePreviewItem(null)}
        >
          <div
            className="bg-white/95 backdrop-blur-xl rounded-[22px] shadow-[0_24px_80px_-16px_rgba(0,0,0,0.28)] border border-neutral-200/60 max-w-md w-full max-h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-neutral-100/80 flex items-center justify-between">
              <span className="text-[13px] font-semibold tracking-tight text-neutral-900 capitalize">
                {lineagePreviewItem.generateType?.replace(/_/g, " ") || "Image"}
                {lineagePreviewItem.resultGlbUrl && " · 3D"}
              </span>
              <button
                type="button"
                onClick={() => setLineagePreviewItem(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
                aria-label="Close"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-auto p-5 flex flex-col items-center">
              {lineagePreviewItem.previewImageUrl ? (
                <img
                  src={displayImageUrl(lineagePreviewItem.previewImageUrl)}
                  alt="Preview"
                  className="max-w-full max-h-[50vh] w-auto h-auto object-contain rounded-2xl border border-neutral-200/80 bg-neutral-50"
                />
              ) : lineagePreviewItem.resultGlbUrl && lineagePreviewItem.sourceImages?.[0] ? (
                <img
                  src={displayImageUrl(lineagePreviewItem.sourceImages[0])}
                  alt="Source"
                  className="max-w-full max-h-[50vh] w-auto h-auto object-contain rounded-2xl border border-neutral-200/80 bg-neutral-50"
                />
              ) : (
                <div className="w-48 h-48 rounded-2xl border border-neutral-200 bg-neutral-50 flex items-center justify-center">
                  <svg className="w-10 h-10 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
                </div>
              )}
              {lineagePreviewItem.prompt && (
                <p className="text-[13px] text-neutral-500 mt-4 text-center line-clamp-2 w-full" title={lineagePreviewItem.prompt}>{lineagePreviewItem.prompt}</p>
              )}
            </div>
            <div className="p-4 border-t border-neutral-100/80 flex gap-2.5">
              <button
                type="button"
                onClick={() => setLineagePreviewItem(null)}
                className="flex-1 h-10 text-sm font-medium text-neutral-600 bg-neutral-100 rounded-full hover:bg-neutral-200 transition-colors"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  handleLineageStepClick(lineagePreviewItem);
                  setLineagePreviewItem(null);
                }}
                className="flex-1 h-10 text-sm font-semibold text-white bg-neutral-900 rounded-full hover:bg-neutral-800 transition-colors"
              >
                Select
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compact-only: top bar — back + name + tools (phones + tablets) */}
      <header className="lg:hidden flex items-center justify-between gap-3 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-neutral-200 bg-white shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            href="/app/studio"
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-100 text-neutral-600 transition-colors shrink-0"
            aria-label="Back to Studio"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-neutral-400">Hydrilla</p>
            <p className="text-[15px] font-semibold tracking-tight text-neutral-900 truncate" title={workspaceName.trim() ? workspaceName : "Workspace"}>
              {workspaceName.trim() ? workspaceName : "Workspace"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden min-[400px]:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800" title="Credits remaining">
            <svg className="w-3.5 h-3.5 shrink-0 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span className="text-[12px] font-semibold tabular-nums">{creditsLoading ? "…" : Math.max(0, creditsTotal - creditsUsed)}</span>
          </div>
          <Link
            href="/rigging"
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-colors shrink-0"
            aria-label="3D Rigging"
            title="3D Rigging"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4M2 12h4m12 0h4m-3.5-6.5L17 8m-10 8l-2.5 2.5M20.5 18.5L18 16M5.5 5.5L8 8" /><circle cx="12" cy="12" r="2" /></svg>
          </Link>
          <Link
            href="/generations"
            className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-colors shrink-0"
            aria-label="Workspace generations"
            title="Generations"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </Link>
        </div>
      </header>

      {/* Compact: large generating card on Create tab */}
      {mobileTab === "create" && mobileCanvasGenerating && (
        <div
          className="lg:hidden fixed inset-x-0 z-[35] flex items-center justify-center px-4 pointer-events-auto bg-black/25"
          style={{
            top: "calc(3.75rem + env(safe-area-inset-top, 0px))",
            bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))",
          }}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="w-full max-w-sm min-h-[min(48vh,300px)] rounded-[28px] bg-white text-neutral-900 shadow-[0_24px_80px_-16px_rgba(0,0,0,0.28)] flex flex-col items-center justify-center gap-5 px-8 py-10 mx-auto border border-neutral-200">
            <div className="w-12 h-12 border-2 border-neutral-200 border-t-neutral-900 rounded-full animate-spin shrink-0" />
            <div className="text-center space-y-1.5">
              <p className="text-[15px] font-semibold leading-snug tracking-tight">{mobileGeneratingMessage}</p>
              <p className="text-sm text-neutral-500 tabular-nums">{Math.round(mobileGeneratingProgress)}%</p>
            </div>
            <div className="w-full max-w-[220px] h-1.5 bg-neutral-200/80 rounded-full overflow-hidden">
              <div
                className="h-full bg-neutral-900 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(mobileGeneratingProgress, 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
      {mobileGeneratedToast && (
        <div className="lg:hidden fixed left-0 right-0 top-[calc(3.75rem+env(safe-area-inset-top,0px))] z-30 flex justify-center px-3 py-2 pointer-events-none">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-950 text-white text-xs font-medium shadow-lg">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
            Generated
          </span>
        </div>
      )}

      {/* 3-panel on desktop; compact: single column via Canvas | Create */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative flex-col lg:flex-row">
        {/* Left panel toggle */}
        <button
          type="button"
          onClick={() => setLeftPanelOpen(true)}
          className={cn(
            "absolute left-0 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-r-2xl border border-neutral-200/80 bg-white px-2.5 py-4 text-neutral-700 shadow-[4px_0_20px_rgba(0,0,0,0.06)] transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-neutral-50 active:scale-[0.98] lg:flex",
            leftPanelOpen
              ? "pointer-events-none -translate-x-2 opacity-0"
              : "pointer-events-auto translate-x-0 opacity-100"
          )}
          title="Open library panel"
          aria-label="Open library panel"
          tabIndex={leftPanelOpen ? -1 : 0}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500">Library</span>
        </button>

        {/* Left Panel - Library (sliding & resizable); on mobile: hidden — use Assets icon to open /app/assets */}
        <aside
          ref={libraryPanelRef}
          style={{
            width: leftPanelOpen ? leftPanelWidth : 0,
            minWidth: leftPanelOpen ? leftPanelWidth : 0,
            transition: resizingLeft
              ? "none"
              : "width 150ms cubic-bezier(0.22, 1, 0.36, 1), min-width 150ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          className={cn(
            "flex shrink-0 flex-col overflow-hidden border-r border-neutral-200/70 bg-white will-change-[width]",
            "max-lg:hidden",
            !leftPanelOpen && "border-transparent"
          )}
        >
          {/* Fixed inner width keeps content from reflowing while the panel animates */}
          <div className="flex h-full shrink-0" style={{ width: leftPanelWidth }}>
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
          {/* Left navbar: Logo + New Workspace */}
          <div className="hidden lg:flex h-14 px-4 border-b border-neutral-200/60 items-center justify-between gap-2">
            <Link href="/app/studio" className="text-[17px] font-semibold text-neutral-900 tracking-[-0.03em] shrink-0 hover:opacity-70 transition-opacity">
              Hydrilla
            </Link>
            <Button
              type="button"
              onClick={() => { setNewWorkspaceName(""); setShowNewWorkspaceModal(true); }}
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 rounded-full px-3 text-[12px] font-medium"
              title="New Workspace"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              <span>New</span>
            </Button>
          </div>
          <div className="hidden lg:flex px-3 py-3 border-b border-neutral-200/60 items-center gap-2">
            <Button type="button" onClick={() => setLeftPanelOpen(false)} variant="ghost" size="sm" className="h-9 w-9 shrink-0 rounded-full p-0" title="Close library" aria-label="Close library panel">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            </Button>
            <div className="relative flex-1 min-w-0">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="h-9 rounded-full bg-neutral-50/80 border-neutral-200/80 pl-9 shadow-none focus-visible:border-neutral-300 focus-visible:ring-neutral-900/[0.04]"
              />
            </div>
          </div>
          {/* Tab bar — Images | 3D */}
          <div className="px-3 pt-3 pb-2">
            <div
              role="tablist"
              aria-label="Library tabs"
              className="relative inline-flex h-9 w-full items-center rounded-full border border-neutral-200 bg-neutral-100 p-1 text-neutral-500"
            >
              <motion.div
                className="absolute top-1 bottom-1 rounded-full bg-neutral-950 shadow-sm"
                initial={false}
                animate={{
                  left: leftLibraryTab === "images" ? 4 : "50%",
                  width: "calc(50% - 4px)",
                }}
                transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
                aria-hidden
              />
              <Button
                type="button"
                role="tab"
                variant="ghost"
                size="sm"
                {...(leftLibraryTab === "images" ? { "aria-selected": "true" as const } : { "aria-selected": "false" as const })}
                aria-controls="library-images-panel"
                id="library-tab-images"
                tabIndex={leftLibraryTab === "images" ? 0 : -1}
                onClick={() => setLeftLibraryTab("images")}
                title="Images"
                className={cn(
                  "relative z-10 h-7 flex-1 gap-1.5 rounded-full border-transparent px-3 text-[12px] hover:bg-transparent",
                  leftLibraryTab === "images" ? "text-white hover:text-white" : "text-neutral-500 hover:text-neutral-800"
                )}
              >
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                <span>Images</span>
              </Button>
              <Button
                type="button"
                role="tab"
                variant="ghost"
                size="sm"
                {...(leftLibraryTab === "3d" ? { "aria-selected": "true" as const } : { "aria-selected": "false" as const })}
                aria-controls="library-3d-panel"
                id="library-tab-3d"
                tabIndex={leftLibraryTab === "3d" ? 0 : -1}
                onClick={() => setLeftLibraryTab("3d")}
                title="3D Assets"
                className={cn(
                  "relative z-10 h-7 flex-1 gap-1.5 rounded-full border-transparent px-3 text-[12px] hover:bg-transparent",
                  leftLibraryTab === "3d" ? "text-white hover:text-white" : "text-neutral-500 hover:text-neutral-800"
                )}
              >
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                <span>3D</span>
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1 min-h-0" role="tabpanel" id="library-images-panel" aria-labelledby="library-tab-images" hidden={leftLibraryTab !== "images"}>
            <div className="px-3 py-3">
            {leftLibraryTab === "images" && (
              <div className="space-y-3">
                <Link href="/library" className="flex items-center justify-between group px-0.5">
                  <h3 className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.14em]">Images</h3>
                  <svg className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </Link>
                <div className="grid grid-cols-2 gap-2.5">
                  {libraryLoading ? (
                    <div className="col-span-2 grid grid-cols-2 gap-2.5">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-2xl bg-neutral-100 animate-pulse" />
                      ))}
                    </div>
                  ) : filteredImages.length === 0 ? (
                    <div className="col-span-2 flex flex-col items-center justify-center min-h-[120px] rounded-2xl bg-neutral-50 border border-dashed border-neutral-200/80 text-neutral-500 text-xs gap-2">
                      <svg className="w-7 h-7 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
                      <span>No images yet</span>
                    </div>
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
                        className="group/card relative aspect-square rounded-2xl overflow-hidden border border-neutral-200/70 hover:border-neutral-300 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center justify-center"
                      >
                        {(item.previewImageUrl || item.imageUrl) ? (
                          <img src={displayImageUrl(item.previewImageUrl || item.imageUrl)} alt={item.prompt || "Image"} className="w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover/card:scale-[1.03]" />
                        ) : (
                          <span className="text-neutral-500 text-[10px] text-center px-1 truncate max-w-full font-medium">{item.prompt || "Image"}</span>
                        )}
                        {(item.status === "RUN" || item.status === "WAIT") && (
                          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex flex-col items-center justify-center gap-1.5">
                            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                            <span className="text-[10px] font-medium text-white">
                              {item.status === "WAIT" ? "Queued" : "Generating"}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            </div>
          </ScrollArea>
          <ScrollArea role="tabpanel" id="library-3d-panel" aria-labelledby="library-tab-3d" hidden={leftLibraryTab !== "3d"} className="flex-1 min-h-0">
            <div className="px-3 py-3">
            {leftLibraryTab === "3d" && (
              <div className="space-y-3">
                <Link href="/library" className="flex items-center justify-between group px-0.5">
                  <h3 className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.14em]">3D Assets</h3>
                  <svg className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                </Link>
                <div className="grid grid-cols-2 gap-2.5">
                  {libraryLoading ? (
                    <div className="col-span-2 grid grid-cols-2 gap-2.5">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-2xl bg-neutral-100 animate-pulse" />
                      ))}
                    </div>
                  ) : filtered3DAssets.length === 0 ? (
                    <div className="col-span-2 flex flex-col items-center justify-center min-h-[120px] rounded-2xl bg-neutral-50 border border-dashed border-neutral-200/80 text-neutral-500 text-xs gap-2">
                      <svg className="w-7 h-7 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      <span>No 3D assets yet</span>
                    </div>
                  ) : (
                    filtered3DAssets.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handle3DClick(item)}
                        className="group/card relative aspect-square rounded-2xl overflow-hidden border border-neutral-200/70 hover:border-neutral-300 hover:shadow-[0_8px_24px_-12px_rgba(0,0,0,0.18)] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer bg-neutral-100 shadow-[0_1px_2px_rgba(0,0,0,0.04)] text-left"
                      >
                        {item.previewImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={displayImageUrl(item.previewImageUrl)}
                            alt={item.prompt || "3D Asset"}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
                          />
                        ) : isWaterJobFn(item) ? (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-b from-neutral-50 to-neutral-100 text-neutral-300">
                            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                            </svg>
                          </div>
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-neutral-300">
                            <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        )}
                        {/* Status: only in-progress (amber) or failed (red) — no Done / Code labels */}
                        {(item.status === "RUN" || item.status === "WAIT" || item.status === "FAIL") && (
                          <span
                            className={cn(
                              "absolute left-2 top-2 h-2 w-2 rounded-full ring-2 ring-white shadow-sm",
                              item.status === "FAIL"
                                ? "bg-red-500"
                                : "bg-amber-400 animate-pulse"
                            )}
                            title={
                              item.status === "FAIL"
                                ? "Failed"
                                : item.status === "WAIT"
                                  ? "Queued"
                                  : "Generating"
                            }
                          />
                        )}
                        {(item.status === "RUN" || item.status === "WAIT") && !item.previewImageUrl && (
                          <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
            </div>
          </ScrollArea>
            </div>
            {/* Left resize handle — desktop only */}
            {leftPanelOpen && (
              <div
                role="separator"
                aria-orientation="vertical"
                onMouseDown={(e) => {
                  e.preventDefault();
                  resizeStartRef.current = { x: e.clientX, leftW: leftPanelWidth };
                  setResizingLeft(true);
                }}
                className={`hidden lg:block w-1 flex-shrink-0 bg-transparent hover:bg-neutral-200 active:bg-black/20 cursor-col-resize transition-colors ${resizingLeft ? "bg-black/20" : ""}`}
              />
            )}
          </div>
        </aside>

        {/* Center - Preview / 3D / generating; on mobile: visible only when Canvas tab */}
        <main className={cn("flex-1 flex flex-col min-w-0 min-h-0 bg-[#fafafa] overflow-y-auto", mobileTab === "canvas" ? "max-lg:flex" : "max-lg:hidden")}>
          {centerView.type === "empty" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] border border-neutral-200/80 bg-white text-neutral-400 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(0,0,0,0.12)]">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </div>
              <h2 className="mb-2 text-[26px] font-semibold tracking-[-0.03em] text-neutral-900">What will you create today?</h2>
              <p className="mb-6 max-w-sm text-sm leading-6 text-neutral-500">Start with a text prompt, or choose an image from your library to edit or turn into 3D.</p>
              <Button
                type="button"
                onClick={() => {
                  setFullView(false);
                  setRightPanelOpen(true);
                  setMobileTab("create");
                  // Focus after the panel starts opening so the field is mounted/visible.
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => promptTextareaRef.current?.focus());
                  });
                }}
                variant="outline"
                className="h-10 rounded-full px-5"
              >
                Write a prompt
              </Button>
            </div>
          )}

          {centerView.type === "preview" && !(currentGenerating && centerView.previewId === currentGenerating.jobId) && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 min-h-0 flex items-center justify-center p-5 bg-[#fafafa]">
                <div className="relative w-full max-w-full h-full max-h-full rounded-[24px] overflow-hidden border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.14)] bg-white flex items-center justify-center">
                  <img src={displayImageUrl(centerView.imageUrl)} alt="Preview" className="max-w-full max-h-full w-auto h-auto object-contain" />
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 p-3.5 border-t border-neutral-200/60 bg-white/90 backdrop-blur-xl">
                {showGenerate3DButton ? (
                  <Button
                    type="button"
                    onClick={handleGenerate3D}
                    size="lg"
                    className="h-11 rounded-full px-6"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Generate {selectedIsCode ? "Water" : "3D Model"}
                  </Button>
                ) : (
                  <span className="text-sm text-neutral-500">Image preview</span>
                )}
              </div>
            </div>
          )}

          {(centerView.type === "generating" ||
            (centerView.type === "preview" &&
              currentGenerating?.status === "generating" &&
              centerView.previewId === currentGenerating.jobId)) && (
            <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 text-center">
              <Card className="w-full max-w-md border-neutral-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_20px_48px_-20px_rgba(0,0,0,0.14)]">
                <CardContent className="px-7 py-9 sm:px-9">
                  <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-neutral-200 bg-neutral-50">
                    <div className="h-6 w-6 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400 mb-2">
                    {currentGenerating?.jobId?.startsWith("cs_") || selectedIsCode
                      ? "Water"
                      : "Hydrilla"}
                  </p>
                  <h2 className="text-[17px] font-semibold tracking-[-0.02em] text-neutral-900 leading-snug">
                    {centerView.type === "generating" ? centerView.message : "Generating 3D model…"}
                  </h2>
                  {(currentGenerating?.jobId?.startsWith("cs_") || selectedIsCode) && (
                    <div className="mt-5 flex items-center justify-center gap-1.5">
                      {SCULPT_PASS_STEPS.map((step, idx) => {
                        const activeIdx = sculptPassIndex(codeSculptPass);
                        const done = idx < activeIdx;
                        const active = idx === activeIdx;
                        return (
                          <div
                            key={step}
                            className={cn(
                              "h-1.5 rounded-full transition-all duration-500",
                              active ? "w-8 bg-neutral-900" : done ? "w-4 bg-neutral-400" : "w-4 bg-neutral-200"
                            )}
                            title={SCULPT_PASS_LABELS[step]}
                          />
                        );
                      })}
                    </div>
                  )}
                  {currentGenerating?.status === "generating" &&
                    currentGenerating?.queueInfo &&
                    (currentGenerating.queueInfo.jobs_ahead > 0 ||
                      (currentGenerating.queueInfo.estimated_total_seconds ?? 0) > 0) && (
                      <p className="mt-3 text-[13px] text-neutral-500">
                        {currentGenerating.queueInfo.jobs_ahead > 0 && (
                          <span>
                            Position {currentGenerating.queueInfo.position + 1} in queue
                          </span>
                        )}
                        {currentGenerating.queueInfo.estimated_total_seconds != null &&
                          currentGenerating.queueInfo.estimated_total_seconds > 0 && (
                            <span>
                              {currentGenerating.queueInfo.jobs_ahead > 0 ? " · " : ""}
                              Est. ~{Math.round(currentGenerating.queueInfo.estimated_total_seconds / 60)} min
                            </span>
                          )}
                      </p>
                    )}
                  <div className="mt-6 space-y-2">
                    <Progress
                      className="h-1.5 w-full"
                      value={
                        centerView.type === "generating"
                          ? centerView.progress
                          : currentGenerating?.progress ?? 0
                      }
                    />
                    <p className="text-[12px] tabular-nums text-neutral-500">
                      {Math.round(
                        centerView.type === "generating"
                          ? centerView.progress
                          : currentGenerating?.progress ?? 0
                      )}
                      %
                    </p>
                  </div>
                  {currentGenerating?.jobId && !currentGenerating.jobId.startsWith("cs_") && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!currentGenerating?.jobId) return;
                        try {
                          await cancelJob(currentGenerating.jobId, () => getToken());
                          if (progressIntervalRef.current) {
                            clearInterval(progressIntervalRef.current);
                            progressIntervalRef.current = null;
                          }
                          setCurrentGenerating(null);
                          setLoading(false);
                          setCenterView({ type: "error", message: "Job cancelled" });
                        } catch (e: any) {
                          setCenterView({
                            type: "error",
                            message: toUserFacingGpuError(e?.message || "Failed to cancel"),
                          });
                        }
                      }}
                      className="mt-6 h-9 px-4 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                    >
                      Cancel generation
                    </button>
                  )}
                  {currentGenerating?.jobId?.startsWith("cs_") && (
                    <button
                      type="button"
                      onClick={() => {
                        waterPollGenRef.current += 1;
                        setCurrentGenerating(null);
                        setLoading(false);
                        setCenterView({ type: "empty" });
                      }}
                      className="mt-6 h-9 px-4 text-sm font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-full transition-colors"
                    >
                      Dismiss
                    </button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {centerView.type === "code" && (
            <div className="flex-1 flex flex-col min-h-0 max-lg:min-h-[50vh]">
              <WaterViewer
                factoryCode={centerView.factoryCode || codeFactoryCode}
                passLabel={codeSculptPass}
                jobId={centerView.jobId}
                className="flex-1 min-h-0"
                onThumbnail={(dataUrl) => {
                  const jobId = centerView.type === "code" ? centerView.jobId : null;
                  if (!jobId) return;
                  const prompt =
                    selectedJobInfo?.id === jobId ? selectedJobInfo.prompt : null;
                  rememberCodeThumb(jobId, dataUrl, prompt);
                  void (async () => {
                    try {
                      const tokenGetter = async () => (await getToken()) ?? null;
                      const saved = await saveWaterThumbnail(jobId, dataUrl, tokenGetter);
                      if (saved && !saved.startsWith("data:")) {
                        codeThumbCacheRef.current[jobId] = saved;
                      }
                      setLibrary3DAssets((prev) =>
                        prev.map((j) =>
                          j.id === jobId ? { ...j, previewImageUrl: saved } : j
                        )
                      );
                    } catch {
                      // local data URL still shows on the card via cache
                    }
                  })();
                }}
              />
            </div>
          )}

          {centerView.type === "3d" && (
            <div className="flex-1 flex flex-col min-h-0 max-lg:min-h-[50vh]">
              <div className={`flex-1 min-h-0 relative ${fullView ? "flex justify-center items-center" : ""}`}>
                <div className={fullView ? "w-full h-full min-w-0 min-h-0" : "h-full w-full"}>
                <ThreeViewer
                  glbUrl={centerView.glbUrl}
                  background={envBackground}
                  grid={envGrid}
                  shadow={envShadow}
                  autoRotate={envAutoRotate}
                  lighting={envLighting}
                  lightIntensity={lightIntensity}
                  brightness={brightness}
                  materialType={materialType}
                  materialRoughness={materialRoughness}
                  wireframeMode={wireframeMode}
                  onWireframeChange={setWireframeMode}
                />
                </div>
                {/* Material + Roughness bar on top of 3D scene; z-[100] so it stays above WebGL canvas layer and works as soon as model loads */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/90 backdrop-blur-xl border border-neutral-200/70 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.18)] pointer-events-auto">
                  {[
                    { id: "standard" as const, label: "PBR", title: "PBR (Physically Based)" },
                    { id: "matcap" as const, label: "Matcap", title: "Matcap" },
                    { id: "toon" as const, label: "Toon", title: "Toon shading" },
                    { id: "lambert" as const, label: "Lambert", title: "Lambert (diffuse)" },
                    { id: "normal" as const, label: "Normal", title: "Normal map" },
                  ].map(({ id, label, title }) => (
                    <button
                      key={id}
                      type="button"
                      title={title}
                      aria-label={title}
                      onClick={() => setMaterialType(id)}
                      className={`p-2 rounded-full transition-all duration-200 ${materialType === id ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"}`}
                    >
                      {id === "standard" && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                      )}
                      {id === "matcap" && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>
                      )}
                      {id === "toon" && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /><path d="M12 3v6" /><path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" /></svg>
                      )}
                      {id === "lambert" && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" /><line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" /><line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" /><line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" /></svg>
                      )}
                      {id === "normal" && (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 3h6v6H3z" /><path d="M15 3h6v6h-6z" /><path d="M3 15h6v6H3z" /><path d="M15 15h6v6h-6z" /></svg>
                      )}
                    </button>
                  ))}
                  <div className="ml-1 pl-2 border-l border-neutral-200 flex items-center">
                    <button
                      type="button"
                      title={wireframeMode ? "Wireframe On" : "Wireframe Off"}
                      aria-label={wireframeMode ? "Wireframe On" : "Wireframe Off"}
                      onClick={() => setWireframeMode((v) => !v)}
                      className={`p-2 rounded-full transition-all duration-200 ${wireframeMode ? "bg-neutral-900 text-white" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"}`}
                    >
                      <svg className={`w-5 h-5 ${wireframeMode ? "opacity-100" : "opacity-70"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={wireframeMode ? 2.5 : 2} strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                      </svg>
                    </button>
                  </div>
                  {materialType === "standard" && (
                    <div className="relative ml-1 pl-2 border-l border-neutral-200">
                      <button
                        type="button"
                        title="Roughness"
                        aria-label="Roughness"
                        onClick={() => setRoughnessDropdownOpen((o) => !o)}
                        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium text-neutral-700 hover:bg-neutral-100 capitalize"
                      >
                        <span>{materialRoughness}</span>
                        <svg className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${roughnessDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      {roughnessDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setRoughnessDropdownOpen(false)} aria-hidden />
                          <div className="absolute top-full left-0 mt-1 z-20 py-0.5 min-w-[100%] rounded-lg bg-white border border-neutral-200 shadow-lg overflow-hidden">
                            {(["smooth", "medium", "rough"] as const).map((opt) => (
                              <button key={opt} type="button" onClick={() => { setMaterialRoughness(opt); setRoughnessDropdownOpen(false); }} className={`w-full px-2.5 py-1.5 text-xs text-left capitalize transition-colors ${materialRoughness === opt ? "bg-neutral-100 text-neutral-900 font-medium" : "text-neutral-600 hover:bg-neutral-50"}`}>
                                {opt}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
              {/* Actions: mobile = Download + info icon; desktop = Download + Full View + optional Create another 3D / Edit */}
              <div className="relative">
              <div className="flex items-center justify-center gap-2.5 p-3.5 border-t border-neutral-200/60 bg-white/90 backdrop-blur-xl flex-wrap">
                <a
                  href={centerView.glbUrl}
                  download
                  onClick={() => track("model_downloaded", { format: "glb" })}
                  className="inline-flex items-center h-10 px-4 text-sm font-medium bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-colors"
                >
                  <span className="lg:hidden">Download</span>
                  <span className="hidden lg:inline">Download GLB</span>
                </a>
                {/* Mobile-only: info icon to open generation info popover above */}
                {selectedJobInfo && (
                  <button
                    type="button"
                    onClick={() => setMobileGenInfoOpen((v) => !v)}
                    className="lg:hidden flex h-10 w-10 items-center justify-center rounded-full bg-neutral-100 hover:bg-neutral-200 transition-colors"
                    aria-label="Generation info"
                  >
                    <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </button>
                )}
                <span className="hidden lg:inline-flex items-center gap-3 flex-wrap">
                  {fullView ? (
                    <button type="button" onClick={() => { setFullView(false); setLeftPanelOpen(true); setRightPanelOpen(true); }} className="h-10 px-4 text-sm font-medium bg-neutral-100 text-neutral-800 rounded-full hover:bg-neutral-200 transition-colors">Exit full view</button>
                  ) : (
                    <button type="button" onClick={() => { setFullView(true); setLeftPanelOpen(false); setRightPanelOpen(false); }} className="h-10 px-4 text-sm font-medium bg-neutral-100 text-neutral-800 rounded-full hover:bg-neutral-200 transition-colors">Full View</button>
                  )}
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
                        className="h-10 px-4 text-sm font-medium bg-neutral-100 text-neutral-800 rounded-full hover:bg-neutral-200 transition-colors"
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
                        className="h-10 px-4 text-sm font-medium bg-neutral-100 text-neutral-800 rounded-full hover:bg-neutral-200 transition-colors"
                      >
                        Edit this image
                      </button>
                    </>
                  )}
                </span>
              </div>
              {/* Mobile-only: popover above the action row with generation info */}
              {mobileGenInfoOpen && selectedJobInfo && (
                <>
                  <div className="fixed inset-0 z-40 lg:hidden" aria-hidden onClick={() => setMobileGenInfoOpen(false)} />
                  <div className="absolute bottom-full left-0 right-0 z-50 lg:hidden mb-1 mx-2 max-h-[60vh] overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-lg">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100 bg-neutral-50">
                      <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Generation Info</span>
                      <button type="button" onClick={() => setMobileGenInfoOpen(false)} className="p-1 rounded hover:bg-neutral-200" aria-label="Close">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <div className="p-3 space-y-3 max-h-[50vh] overflow-y-auto">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                        <div className="text-neutral-400 font-medium">Type</div>
                        <div className="text-neutral-700">{formatGenerationType(selectedJobInfo.generateType)}</div>
                        <div className="text-neutral-400 font-medium">Status</div>
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${selectedJobInfo.status === "DONE" ? "bg-emerald-500" : selectedJobInfo.status === "FAIL" ? "bg-red-500" : "bg-amber-500 animate-pulse"}`} />
                            <span className="text-neutral-700 font-medium">
                              {{ DONE: "Completed", FAIL: "Failed", RUN: "Processing", WAIT: "Pending" }[selectedJobInfo.status] || selectedJobInfo.status || "Unknown"}
                            </span>
                          </div>
                          {isWaterJobFn(selectedJobInfo) && (selectedJobInfo.sculptPass || codeSculptPass) && selectedJobInfo.status !== "DONE" && (
                            <span className="text-[10px] text-neutral-500 pl-3">
                              {sculptPassLabel(selectedJobInfo.sculptPass || codeSculptPass)}
                            </span>
                          )}
                          {isWaterJobFn(selectedJobInfo) && selectedJobInfo.status === "DONE" && (
                            <span className="text-[10px] text-neutral-500 pl-3">Blockout ready</span>
                          )}
                        </div>
                        {selectedJobInfo.resultGlbUrl && selectedJobInfo.sourceImages?.[0] && (
                          <>
                            <div className="text-neutral-400 font-medium">Source image</div>
                            <div className="flex items-center gap-1.5">
                              <img src={displayImageUrl(selectedJobInfo.sourceImages[0])} alt="Source" className="w-8 h-8 rounded object-cover border border-neutral-200" />
                            </div>
                          </>
                        )}
                        {selectedJobInfo.prompt && (
                          <>
                            <div className="text-neutral-400 font-medium">Prompt</div>
                            <div className="text-neutral-700 truncate" title={selectedJobInfo.prompt}>{selectedJobInfo.prompt}</div>
                          </>
                        )}
                        <div className="text-neutral-400 font-medium">Created</div>
                        <div className="text-neutral-700">{selectedJobInfo.createdAt ? new Date(selectedJobInfo.createdAt).toLocaleString() : "—"}</div>
                        <div className="text-neutral-400 font-medium">Job ID</div>
                        <div className="text-neutral-700 font-mono text-[10px] truncate" title={selectedJobInfo.id}>{selectedJobInfo.id}</div>
                      </div>
                      {jobLineage.length >= 1 && (
                        <div className="pt-2 border-t border-neutral-100">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400 mb-2">Creation Lineage</p>
                          <div className="relative pl-4">
                            <div className="absolute left-[7px] top-1 bottom-1 w-px bg-neutral-200" />
                            {jobLineage.map((item, idx) => {
                              const isCurrent = item.id === selectedJobInfo.id;
                              const parentCount = (item.parentJobIds && item.parentJobIds.length > 0) ? item.parentJobIds.length : (item.parentJobId ? 1 : 0);
                              const sourceCount = item.sourceImages?.length ?? 0;
                              const isMerge = parentCount > 1 || (item.generateType === "Combined" && sourceCount >= 2);
                              const showSourceImages = isMerge && sourceCount > 0;
                              const show3DSourceImage = item.resultGlbUrl && sourceCount >= 1 && item.sourceImages?.[0];
                              const mergeLabel = parentCount > 1 ? `${parentCount} parents` : sourceCount >= 2 ? "2 sources" : null;
                              const isSingleCombined = jobLineage.length === 1 && item.generateType === "Combined";
                              const stepLabel = isSingleCombined ? "Step 1" : idx === 0 ? "Origin" : `Step ${idx}`;
                              return (
                                <button
                                  key={item.id}
                                  type="button"
                                  onClick={() => { setLineagePreviewItem(item); setMobileGenInfoOpen(false); }}
                                  className={`relative flex items-start gap-2.5 pb-2.5 last:pb-0 w-full text-left cursor-pointer rounded px-1 -mx-1 hover:bg-neutral-50 transition-colors ${isCurrent ? "opacity-100" : "opacity-70"}`}
                                >
                                  {isMerge ? (
                                    <div className={`absolute -left-[18px] top-0 w-3.5 h-3.5 rotate-45 border-2 flex-shrink-0 ${isCurrent ? "border-black bg-black" : "border-neutral-400 bg-white"}`} />
                                  ) : (
                                    <div className={`absolute -left-4 top-0.5 w-3 h-3 rounded-full border-2 flex-shrink-0 ${isCurrent ? "border-black bg-black" : "border-neutral-300 bg-white"}`} />
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`text-[10px] font-semibold ${isCurrent ? "text-black" : "text-neutral-500"}`}>{stepLabel}</span>
                                      <span className="text-[10px] text-neutral-400">{formatGenerationType(item.generateType)}</span>
                                      {mergeLabel && <span className="text-[10px] px-1 py-0.5 rounded bg-neutral-100 text-neutral-600 font-medium">{mergeLabel}</span>}
                                      {item.resultGlbUrl && <span className="text-[10px] px-1 py-0.5 rounded bg-neutral-100 text-neutral-500">3D</span>}
                                    </div>
                                    {item.prompt && <p className="text-[10px] text-neutral-500 truncate mt-0.5" title={item.prompt}>{item.prompt}</p>}
                                    {showSourceImages && item.sourceImages && (
                                      <div className="flex gap-1 mt-1">
                                        {item.sourceImages.map((src, i) => (
                                          <img key={i} src={displayImageUrl(src)} alt={`Source ${i + 1}`} className="w-5 h-5 rounded object-cover border border-neutral-200" />
                                        ))}
                                      </div>
                                    )}
                                    {show3DSourceImage && (
                                      <div className="flex items-center gap-1 mt-1">
                                        <span className="text-[10px] text-neutral-400">Source image</span>
                                        <img src={displayImageUrl(item.sourceImages![0])} alt="Source" className="w-5 h-5 rounded object-cover border border-neutral-200" />
                                      </div>
                                    )}
                                  </div>
                                  {item.previewImageUrl ? (
                                    <img src={displayImageUrl(item.previewImageUrl)} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0 border border-neutral-200" />
                                  ) : item.resultGlbUrl ? (
                                    <div className="w-7 h-7 rounded flex-shrink-0 border border-neutral-200 bg-neutral-100 flex items-center justify-center">
                                      <svg className="w-4 h-4 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                    </div>
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      {jobLineage.length === 0 && (
                        <div className="pt-2 border-t border-neutral-100">
                          <p className="text-[10px] text-neutral-400 italic">No iterative history — this is an original generation.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
              </div>
            </div>
          )}

          {centerView.type === "error" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-full max-w-sm rounded-[28px] border border-red-100 bg-white px-8 py-10 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.12)]">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                  <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-sm text-red-600 mb-5">{centerView.message}</p>
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
                  className="h-10 px-5 text-sm font-medium bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {/* ──────────── Generation Info — compact, minimal ──────────── */}
          {selectedJobInfo && centerView.type !== "empty" && (
            <div className="flex-shrink-0 border-t border-neutral-200/70 bg-white/95 backdrop-blur-xl max-lg:hidden">
              <button
                type="button"
                onClick={() => setGenInfoExpanded((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-400 hover:bg-neutral-50/80 transition-colors"
              >
                <span className="flex items-center gap-2 normal-case tracking-normal">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400">
                    Details
                  </span>
                  <span className="text-[12px] font-medium text-neutral-700">
                    {formatGenerationType(selectedJobInfo.generateType)}
                  </span>
                  {(selectedJobInfo.status === "RUN" ||
                    selectedJobInfo.status === "WAIT" ||
                    selectedJobInfo.status === "FAIL") && (
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        selectedJobInfo.status === "FAIL"
                          ? "bg-red-500"
                          : "bg-amber-400 animate-pulse"
                      )}
                    />
                  )}
                </span>
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${genInfoExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {genInfoExpanded && (
                <div className="px-4 pb-3.5 space-y-3 max-h-[180px] overflow-y-auto">
                  <div className="flex flex-wrap items-baseline gap-x-5 gap-y-2 text-[12px]">
                    {selectedJobInfo.prompt && (
                      <p className="min-w-0 flex-[1_1_100%] text-neutral-800 leading-snug line-clamp-2" title={selectedJobInfo.prompt}>
                        {selectedJobInfo.prompt}
                      </p>
                    )}
                    <div className="flex items-center gap-1.5 text-neutral-500">
                      <span className="text-neutral-400">Status</span>
                      <span className="font-medium text-neutral-700">
                        {selectedJobInfo.status === "DONE"
                          ? isWaterJobFn(selectedJobInfo)
                            ? "Ready"
                            : "Done"
                          : selectedJobInfo.status === "FAIL"
                            ? "Failed"
                            : selectedJobInfo.status === "WAIT"
                              ? "Queued"
                              : sculptPassLabel(selectedJobInfo.sculptPass || codeSculptPass)}
                      </span>
                    </div>
                    {selectedJobInfo.createdAt && (
                      <div className="flex items-center gap-1.5 text-neutral-500">
                        <span className="text-neutral-400">Created</span>
                        <span className="font-medium text-neutral-700 tabular-nums">
                          {new Date(selectedJobInfo.createdAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {jobLineage.length > 1 && (
                    <div className="pt-2 border-t border-neutral-100">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400 mb-2">
                        Lineage
                      </p>
                      <div className="flex gap-2 overflow-x-auto pb-0.5">
                        {jobLineage.map((item, idx) => {
                          const isCurrent = item.id === selectedJobInfo.id;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setLineagePreviewItem(item)}
                              className={cn(
                                "shrink-0 rounded-xl border px-2.5 py-2 text-left transition-colors min-w-[112px] max-w-[140px]",
                                isCurrent
                                  ? "border-neutral-900 bg-neutral-950 text-white"
                                  : "border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700"
                              )}
                            >
                              <p className={cn("text-[10px] font-semibold", isCurrent ? "text-white/70" : "text-neutral-400")}>
                                {idx === 0 ? "Origin" : `Step ${idx}`}
                              </p>
                              <p className="text-[11px] truncate mt-0.5">
                                {formatGenerationType(item.generateType)}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>

        {/* Right panel toggle — always mounted for smooth show/hide */}
        <button
          type="button"
          onClick={() => setRightPanelOpen(true)}
          className={cn(
            "absolute right-0 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-l-2xl border border-neutral-200/80 bg-white px-2.5 py-4 text-neutral-700 shadow-[-4px_0_20px_rgba(0,0,0,0.06)] transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-neutral-50 active:scale-[0.98] lg:flex",
            rightPanelOpen
              ? "pointer-events-none translate-x-2 opacity-0"
              : "pointer-events-auto translate-x-0 opacity-100"
          )}
          title="Open create panel"
          aria-label="Open create panel"
          tabIndex={rightPanelOpen ? -1 : 0}
        >
          <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500">Create</span>
        </button>

        {/* Right Panel — fixed inner width on desktop; full-bleed on phone/tablet */}
        <aside
          style={{
            width: isCompact
              ? mobileTab === "create"
                ? "100%"
                : 0
              : rightPanelOpen
                ? RIGHT_PANEL_WIDTH
                : 0,
            minWidth: isCompact
              ? mobileTab === "create"
                ? "100%"
                : 0
              : rightPanelOpen
                ? RIGHT_PANEL_WIDTH
                : 0,
            transition: isCompact
              ? "none"
              : "width 150ms cubic-bezier(0.22, 1, 0.36, 1), min-width 150ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          className={cn(
            "flex-shrink-0 flex flex-col bg-white border-l border-neutral-200/70 overflow-hidden will-change-[width]",
            "max-lg:border-l-0 max-lg:border-t max-lg:border-neutral-200 max-lg:bg-white",
            !rightPanelOpen && "max-lg:border-transparent",
            mobileTab === "create"
              ? "max-lg:!w-full max-lg:!min-w-0 max-lg:flex-1 max-lg:min-h-0 max-lg:overflow-auto"
              : "max-lg:hidden"
          )}
        >
          <div
            className="flex h-full shrink-0 max-lg:!w-full max-lg:!min-w-0 max-lg:!max-w-full"
            style={{ width: isCompact ? "100%" : RIGHT_PANEL_WIDTH, maxWidth: isCompact ? "100%" : undefined }}
          >
          <div className="h-full min-w-0 flex-1 overflow-y-auto flex flex-col [tab-size:4]">
          {/* Right navbar: workspace name, credits, My Library, Profile, Collapse — desktop only */}
          <div className="hidden lg:flex h-14 flex-shrink-0 px-3 border-b border-neutral-200/60 items-center gap-1.5 min-w-0">
            <Input
              type="text"
              value={workspaceName}
              onChange={(e) => handleWorkspaceNameChange(e.target.value)}
              placeholder="Name workspace"
              className="h-9 flex-1 min-w-0 border-transparent bg-transparent px-2 text-[13px] font-semibold tracking-tight shadow-none focus-visible:border-neutral-200 focus-visible:ring-0"
            />
            <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-full bg-neutral-900/[0.04] border border-neutral-200/60" title="Credits remaining">
              <svg className="w-3.5 h-3.5 text-neutral-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <span className="text-[12px] font-semibold text-neutral-800 tabular-nums">{creditsLoading ? "…" : Math.max(0, creditsTotal - creditsUsed)}</span>
            </div>
            <Link href="/rigging" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors shrink-0" title="3D Rigging" aria-label="3D Rigging">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4M2 12h4m12 0h4m-3.5-6.5L17 8m-10 8l-2.5 2.5M20.5 18.5L18 16M5.5 5.5L8 8" /><circle cx="12" cy="12" r="2" /></svg>
            </Link>
            <Link href="/library" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors shrink-0" title="My Library" aria-label="My Library">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </Link>
            <div className="shrink-0 [&_.cl-userButtonBox]:!flex [&_.cl-userButtonTrigger]:!rounded-full">
              {clientMounted ? <UserButton afterSignOutUrl="/" /> : <div className="w-8 h-8 rounded-full bg-neutral-200 animate-pulse" aria-hidden />}
            </div>
            <button type="button" onClick={() => setRightPanelOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors duration-200 shrink-0" title="Collapse panel" aria-label="Collapse panel">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            </button>
          </div>
          <ScrollArea className="flex-1 min-h-0 w-full">
          <div className="mx-auto w-full max-w-xl lg:max-w-none px-4 sm:px-6 lg:px-5 pt-4 sm:pt-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] lg:pb-8 space-y-4 sm:space-y-5 leading-[1.15]">
            {/* Input mode — Text | Image | Edit | Combine */}
            <div
              role="tablist"
              aria-label="Input mode"
              className="grid grid-cols-4 gap-1 rounded-2xl border border-neutral-200 bg-neutral-100 p-1 text-neutral-500"
            >
              <Button
                type="button"
                role="tab"
                size="sm"
                variant={inputMode === "text" ? "outline" : "ghost"}
                onClick={() => setInputMode("text")}
                title="Text prompt only"
                className={cn(
                  "h-11 sm:h-10 gap-1 rounded-xl border-transparent px-1 text-[11px] sm:text-xs font-semibold",
                  inputMode === "text" && "border-transparent bg-white text-neutral-950 shadow-sm"
                )}
              >
                <span className="text-xs font-bold leading-none sm:text-sm">T</span>
                <span>Text</span>
              </Button>
              <Button
                type="button"
                role="tab"
                size="sm"
                variant={inputMode === "image" ? "outline" : "ghost"}
                disabled={selectedIsCode}
                onClick={() => !selectedIsCode && setInputMode("image")}
                title={
                  selectedIsCode
                    ? "Code models build from text only"
                    : "Upload an image to generate a 3D model"
                }
                className={cn(
                  "h-11 sm:h-10 gap-1 rounded-xl border-transparent px-1 text-[11px] sm:text-xs font-semibold",
                  inputMode === "image" && "border-transparent bg-white text-neutral-950 shadow-sm"
                )}
              >
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <span>Image</span>
              </Button>
              <Button
                type="button"
                role="tab"
                size="sm"
                variant={inputMode === "text_1img" ? "outline" : "ghost"}
                disabled={!primaryApiUp || selectedIsCode}
                onClick={() => primaryApiUp && !selectedIsCode && setInputMode("text_1img")}
                title={
                  selectedIsCode
                    ? "Code models build from text only"
                    : primaryApiUp
                      ? "Text + 1 image"
                      : "Edit requires the primary API (currently unavailable)"
                }
                className={cn(
                  "h-11 sm:h-10 gap-1 rounded-xl border-transparent px-1 text-[11px] sm:text-xs font-semibold",
                  inputMode === "text_1img" && "border-transparent bg-white text-neutral-950 shadow-sm"
                )}
              >
                <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
                <span>Edit</span>
              </Button>
              <Button
                type="button"
                role="tab"
                size="sm"
                variant={inputMode === "text_2img" ? "outline" : "ghost"}
                disabled={!primaryApiUp || selectedIsCode}
                onClick={() => primaryApiUp && !selectedIsCode && setInputMode("text_2img")}
                title={
                  selectedIsCode
                    ? "Code models build from text only"
                    : primaryApiUp
                      ? "Text + 2 images"
                      : "Combine requires the primary API (currently unavailable)"
                }
                className={cn(
                  "h-11 sm:h-10 gap-1 rounded-xl border-transparent px-1 text-[11px] sm:text-xs font-semibold",
                  inputMode === "text_2img" && "border-transparent bg-white text-neutral-950 shadow-sm"
                )}
              >
                <div className="flex -space-x-0.5 shrink-0">
                  <div className="w-2 h-2 rounded-sm bg-current opacity-70" />
                  <div className="w-2 h-2 rounded-sm bg-current opacity-70" />
                </div>
                <span>Combine</span>
              </Button>
            </div>

            {/* Image slots — same spacing as reference */}
            {(inputMode === "image" || inputMode === "text_1img" || inputMode === "text_2img") && (
              <div className="space-y-2">
                <label className="block text-[13px] font-semibold tracking-tight text-neutral-800">{inputMode === "text_2img" ? "Image 1 & 2" : inputMode === "image" ? "Source image" : "Image"}</label>
                <div className="flex gap-2">
                  <div className={inputMode === "text_2img" ? "flex-1 min-w-0" : "flex-1"}>
                    {inputMode === "text_2img" && <span className="text-xs text-neutral-500 block mb-1">Image 1</span>}
                    {inputMode === "image" && <p className="text-xs text-neutral-500 mb-2">Upload or drop an image, or choose one from the library. Generate runs image → 3D.</p>}
                    <ImageDropzone slot={1} image={image1} onDrop={(e) => handleDrop(e, 1)} onPaste={(e) => handlePaste(e, 1)} onFileSelect={(e) => handleFileSelect(e, 1)} onClear={() => handleClearImage(1)} isDragging={isDragging} onDragOver={() => setIsDragging(true)} onDragLeave={() => setIsDragging(false)} />
                  </div>
                  {inputMode === "text_2img" && (
                    <div className="flex-1 min-w-0">
                      <span className="text-xs text-neutral-500 block mb-1">Image 2</span>
                      <ImageDropzone slot={2} image={image2} onDrop={(e) => handleDrop(e, 2)} onPaste={(e) => handlePaste(e, 2)} onFileSelect={(e) => handleFileSelect(e, 2)} onClear={() => handleClearImage(2)} isDragging={isDragging} onDragOver={() => setIsDragging(true)} onDragLeave={() => setIsDragging(false)} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Prompt — hidden in Image mode (upload → 3D only) */}
            {inputMode !== "image" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[13px] font-semibold tracking-tight text-neutral-800">Prompt</label>
                <div className="flex items-center gap-1 text-neutral-400">
                  <button type="button" className="p-1.5 rounded-md hover:bg-neutral-100 hover:text-neutral-600 transition-colors" title="Redo"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg></button>
                  <button type="button" className="p-1.5 rounded-md hover:bg-neutral-100 hover:text-neutral-600 transition-colors" title="Suggestions"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg></button>
                  <DropdownMenu open={historyDropdownOpen} onOpenChange={setHistoryDropdownOpen}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-neutral-500 hover:text-neutral-900"
                        title="Prompt history"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      sideOffset={8}
                      className="w-[min(340px,calc(100vw-2rem))] max-h-[min(320px,70vh)] overflow-y-auto p-0"
                    >
                      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-100 bg-white px-3.5 py-2.5">
                        <DropdownMenuLabel className="p-0">Prompt history</DropdownMenuLabel>
                        {promptHistory.length > 0 && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setPromptHistory([]);
                              try {
                                localStorage.removeItem(PROMPT_HISTORY_KEY);
                              } catch {
                                // ignore
                              }
                            }}
                            className="text-[11px] font-medium text-neutral-400 hover:text-red-600"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                      {promptHistory.length === 0 ? (
                        <div className="px-4 py-8 text-center">
                          <p className="text-sm font-medium text-neutral-600">No prompts yet</p>
                          <p className="mt-1 text-xs text-neutral-400">
                            Your recent generations will appear here.
                          </p>
                        </div>
                      ) : (
                        <DropdownMenuGroup className="py-1.5">
                          {promptHistory.map((item, i) => (
                            <DropdownMenuItem
                              key={i}
                              onSelect={() => {
                                setPrompt(item.slice(0, 800));
                                promptTextareaRef.current?.focus();
                              }}
                              className="flex items-start gap-2.5 rounded-xl px-2.5 py-2.5 text-left cursor-pointer"
                            >
                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-neutral-100 text-[10px] font-semibold text-neutral-500">
                                {i + 1}
                              </span>
                              <span className="min-w-0 flex-1 text-[13px] leading-snug text-neutral-700 line-clamp-2">
                                {item || "(empty)"}
                              </span>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuGroup>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <div className="relative">
                <Textarea
                  ref={promptTextareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value.slice(0, 800))}
                  maxLength={800}
                  placeholder={selectedIsCode ? "Describe the object to build in Three.js, e.g., a vintage folding camera with a leather body and chrome dials." : inputMode === "text" ? "Describe the object you want to generate. You can use your native language, e.g., a medieval axe." : inputMode === "text_1img" ? "Describe how to edit this image..." : "Describe how to combine these images..."}
                  className="min-h-[132px] sm:min-h-[148px] resize-none rounded-2xl border-neutral-200 bg-neutral-50 pb-8 shadow-none focus-visible:border-neutral-300 focus-visible:ring-neutral-900/10"
                  rows={4}
                />
                <span className="absolute bottom-2.5 right-3 text-[11px] text-neutral-400 tabular-nums">{prompt.length}/800</span>
              </div>
            </div>
            )}

            {/* Error — validation & workspace (always); centerView errors on phone Create tab (canvas hidden) */}
            {error && (
              <div className="px-3 py-2.5 text-sm bg-red-50 text-red-600 rounded-xl border border-red-200">{error}</div>
            )}
            {mobileTab === "create" && centerView.type === "error" && (
              <div className="lg:hidden space-y-3 px-0.5">
                <div className="px-3 py-3 text-sm bg-red-50 text-red-700 rounded-xl border border-red-200 flex gap-3 items-start">
                  <span className="shrink-0 mt-0.5 text-red-500" aria-hidden>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </span>
                  <p className="min-w-0 flex-1 leading-relaxed">{centerView.message}</p>
                </div>
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
                  className="w-full py-2.5 text-sm font-semibold text-white bg-neutral-950 rounded-xl hover:bg-neutral-800 transition-colors"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Engine — Hydrilla cloud (our models / credits) vs Water (BYOK) */}
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 leading-[1.15]">
              <div className="flex items-center gap-1.5 min-w-0">
                <label className="text-sm font-semibold text-neutral-800">Engine</label>
                <span
                  className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200/80 text-neutral-600"
                  title="Cloud = models we provide (credits → GLB). Water = your API key (0 credits → Three.js)."
                  aria-label="Info"
                >
                  <span className="text-[10px] font-bold leading-none">i</span>
                </span>
              </div>
              <div className="relative min-w-[160px] max-w-[220px]">
                <DropdownMenu open={modelDropdownOpen} onOpenChange={setModelDropdownOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-auto w-full justify-between gap-1.5 rounded-full px-3 py-2 sm:px-2.5 sm:py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
                    >
                      <span className="truncate flex items-center gap-1.5 min-w-0">
                        <span
                          className={
                            selectedIsCode
                              ? "shrink-0 rounded-md bg-sky-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-800"
                              : "shrink-0 rounded-md bg-neutral-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-600"
                          }
                        >
                          {selectedIsCode ? "Water" : "Cloud"}
                        </span>
                        {selectedCatalog?.kind === "code" && !providerKeyOk(selectedCatalog.provider) && (
                          <span className="text-red-500 shrink-0" title="API key missing">!</span>
                        )}
                        <span className="truncate">{selectedCatalog?.label ?? selectedModel}</span>
                      </span>
                      <svg className={`w-3.5 h-3.5 shrink-0 text-neutral-500 transition-transform ${modelDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="w-[280px] max-h-[min(420px,70vh)] overflow-y-auto p-1.5"
                  >
                    {orderedModelGroups.map((group, gi) => {
                      const items = pickerItemsForGroup(group);
                      if (!items.length) return null;
                      const groupUnlocked =
                        group === "Hydrilla" ||
                        items.some((opt) => !opt.comingSoon && providerKeyOk(opt.provider));
                      return (
                        <DropdownMenuGroup key={group}>
                          {gi > 0 && <DropdownMenuSeparator />}
                          <DropdownMenuLabel>
                            {group === "Hydrilla"
                              ? "Hydrilla cloud · credits"
                              : groupUnlocked
                                ? `Water · ${group === "OpenRouter Free" ? "free keys" : group} · unlocked`
                                : `Water · ${group === "OpenRouter Free" ? "free keys" : group} · locked`}
                          </DropdownMenuLabel>
                          {items.map((opt) => {
                            const needsKey = opt.provider !== "hydrilla";
                            const keyOk = !needsKey || providerKeyOk(opt.provider);
                            const disabled = Boolean(opt.comingSoon);
                            const locked = disabled || (needsKey && !keyOk);
                            return (
                              <DropdownMenuItem
                                key={opt.id}
                                disabled={disabled}
                                onSelect={() => {
                                  if (disabled) return;
                                  if (needsKey && !keyOk) {
                                    setError("Add your API key in Settings first");
                                    window.location.href = "/app/settings";
                                    return;
                                  }
                                  setSelectedModel(opt.id);
                                  // Persist Water default so Settings + next session match the picker
                                  if (opt.provider !== "hydrilla") {
                                    void (async () => {
                                      try {
                                        const tokenGetter = async () =>
                                          (await getToken()) ?? null;
                                        await saveUserModelPrefs(
                                          { defaultCodeModel: opt.id },
                                          tokenGetter
                                        );
                                      } catch {
                                        // session selection still works
                                      }
                                    })();
                                  }
                                }}
                                className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-xs cursor-pointer ${
                                  locked
                                    ? "text-neutral-400"
                                    : selectedModel === opt.id
                                      ? "bg-neutral-100 text-neutral-800 font-semibold"
                                      : "text-neutral-700"
                                }`}
                              >
                                <span className="flex items-center gap-2 min-w-0">
                                  <span className={`truncate ${locked ? "text-neutral-400" : ""}`}>
                                    {opt.label}
                                  </span>
                                  {opt.free && opt.vision && !locked && (
                                    <span className="text-[9px] uppercase tracking-wide text-emerald-600 shrink-0">
                                      vision
                                    </span>
                                  )}
                                  {locked && (
                                    <span title={opt.comingSoon ? "Coming soon" : "Add API key in Settings"}>
                                      <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                      </svg>
                                    </span>
                                  )}
                                </span>
                                {!locked && selectedModel === opt.id && (
                                  <svg className="w-3.5 h-3.5 text-neutral-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuGroup>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <div className="px-2.5 py-2">
                      <a
                        href="/app/settings"
                        className="text-[11px] font-medium text-neutral-700 hover:text-neutral-900 underline-offset-2 hover:underline"
                        onClick={() => setModelDropdownOpen(false)}
                      >
                        Manage API keys →
                      </a>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Number of Generations — Hydrilla cloud only; Water always builds one model */}
            <div
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 leading-[1.15]",
                selectedIsCode && "hidden"
              )}
            >
              <div className="flex items-center gap-1.5">
                <label className="text-sm font-semibold text-neutral-800">Number of Generations</label>
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-neutral-200/80 text-neutral-600" title="How many variants to generate" aria-label="Info">
                  <span className="text-[10px] font-bold leading-none">i</span>
                </span>
              </div>
              <div className="flex items-center rounded-xl bg-white border border-neutral-200 overflow-hidden">
                <button type="button" onClick={() => setNumGenerations((n) => Math.max(1, n - 1))} className="px-3 py-2.5 sm:px-2 sm:py-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors" title="Decrease number of generations" aria-label="Decrease number of generations">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                <span className="min-w-[2.5ch] text-center text-sm font-semibold text-neutral-800 py-1.5">{numGenerations}</span>
                <button type="button" onClick={() => setNumGenerations((n) => Math.min(10, n + 1))} className="px-3 py-2.5 sm:px-2 sm:py-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 transition-colors" title="Increase number of generations" aria-label="Increase number of generations">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                </button>
              </div>
            </div>

            {/* Cost line — Hydrilla cloud uses credits; Water is BYOK */}
            {(() => {
              if (selectedIsCode) {
                return (
                  <div className="flex items-center justify-center gap-2 rounded-xl border border-neutral-200/80 bg-white px-3 py-2 text-[12px] text-neutral-600">
                    <span className="tabular-nums text-neutral-500">~1–3 min</span>
                    <span className="h-1 w-1 rounded-full bg-neutral-300" aria-hidden />
                    <span className="font-semibold tracking-tight text-neutral-800">Water · 0 credits</span>
                  </div>
                );
              }
              const isImageOrEdit =
                inputMode === "text" ||
                (inputMode !== "image" && prompt.trim().length > 0 && (image1 || image2));
              const cost =
                inputMode === "text_2img" && prompt.trim()
                  ? 4
                  : inputMode === "text_1img" && prompt.trim()
                    ? 3
                    : isImageOrEdit
                      ? CREDITS_IMAGE
                      : CREDITS_3D;
              const total = creditsLoading ? 0 : creditsTotal;
              return (
                <div className="flex items-center justify-center gap-2 text-sm text-neutral-600">
                  <span className="tabular-nums text-neutral-500">{isImageOrEdit ? "~30s" : "~1 min"}</span>
                  <span className="h-1 w-1 rounded-full bg-neutral-300" aria-hidden />
                  <span className="flex items-center gap-1.5 font-medium text-neutral-800">
                    <svg className="w-4 h-4 text-neutral-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="tabular-nums">{cost} / {total}</span>
                    <span className="text-neutral-500 font-normal">credits</span>
                  </span>
                </div>
              );
            })()}

            {/* Generate — primary action, premium black button with vectorized icon.
                When the user is in pure-image mode (or text_1img with no prompt) the
                only thing this button does is "make a 3D from this image", so we
                route it through `handleGenerate3D` — the same code path the working
                left-library "Generate 3D Model" button uses. Going through
                `handleGenerateImage()` previously cleared `lastPreviewImageUrl/Id`
                and produced the "spinner never finishes" bug for fresh uploads. */}
            <Button
              type="button"
              onClick={() => {
                // Water: text → Three.js. Never enters FLUX or the GPU queue.
                if (selectedIsCode) {
                  void runWater();
                  return;
                }
                if (inputMode === "image" || (inputMode === "text_1img" && !prompt.trim())) {
                  void handleGenerate3D();
                } else {
                  void handleGenerateImage();
                }
              }}
              disabled={isGenerating}
              size="lg"
              variant="default"
              className="w-full h-12 sm:h-[52px] rounded-full text-[15px]"
            >
              {isGenerating ? (
                <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span className="tracking-tight">Generating...</span></>
              ) : (
                <>
                  <img src="/vectorized_019cb4b0-6961-73df-8fbb-bdaa166fad56.svg" alt="" className="w-5 h-5 object-contain opacity-95 invert brightness-110" />
                  <span className="tracking-tight font-semibold">
                    {selectedIsCode
                      ? "Generate with Water"
                      : inputMode === "image"
                        ? "Generate 3D"
                        : "Generate"}
                  </span>
                </>
              )}
            </Button>

            {/* Environment controls only when 3D model is currently open in center */}
            {centerView.type === "3d" && (
              <div className="space-y-3 pt-1 border-t border-neutral-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-[0.14em]">Environment</span>
                  <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-neutral-200 text-neutral-500" title="Viewer environment" aria-label="Info"><span className="text-[9px] font-bold leading-none">i</span></span>
                </div>
                <div className="space-y-2.5">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 leading-[1.15]">
                    <label className="text-sm font-medium text-neutral-800">Lighting</label>
                    <div className="relative min-w-[100px]">
                      <button
                        type="button"
                        onClick={() => setLightingDropdownOpen((o) => !o)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white border border-neutral-200 text-left text-sm font-medium text-neutral-800 hover:bg-neutral-50 transition-colors duration-200 capitalize"
                      >
                        <span>{envLighting}</span>
                        <svg className={`w-4 h-4 shrink-0 text-neutral-400 transition-transform duration-200 ${lightingDropdownOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </button>
                      {lightingDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setLightingDropdownOpen(false)} aria-hidden />
                          <div className="absolute top-full right-0 mt-1 z-20 py-0.5 min-w-[100%] rounded-lg bg-white border border-neutral-200 shadow-lg overflow-hidden">
                            {(["neutral", "studio", "outdoor"] as const).map((opt) => (
                              <button key={opt} type="button" onClick={() => { setEnvLighting(opt); setLightingDropdownOpen(false); }} className={`w-full px-3 py-2 text-sm text-left capitalize transition-colors ${envLighting === opt ? "bg-neutral-100 text-neutral-900 font-medium" : "text-neutral-600 hover:bg-neutral-50"}`}>
                                {opt}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 leading-[1.15]">
                    <label className="text-sm font-medium text-neutral-800">Light intensity</label>
                    <div className="flex items-center gap-2 min-w-[100px] flex-1 max-w-[200px]">
                      <Slider value={lightIntensity} onValueChange={setLightIntensity} min={0.3} max={2} step={0.1} className="min-w-0 flex-1" aria-label="Light intensity" />
                      <span className="text-xs text-neutral-600 tabular-nums w-8 shrink-0 text-right">{lightIntensity.toFixed(1)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 leading-[1.15]">
                    <label className="text-sm font-medium text-neutral-800">Brightness</label>
                    <div className="flex items-center gap-2 min-w-[100px] flex-1 max-w-[200px]">
                      <Slider value={brightness} onValueChange={setBrightness} min={0.5} max={2} step={0.05} className="min-w-0 flex-1" aria-label="Brightness" />
                      <span className="text-xs text-neutral-600 tabular-nums w-8 shrink-0 text-right">{brightness.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 leading-[1.15]">
                    <label className="text-sm font-medium text-neutral-800">Background</label>
                    <Switch checked={envBackground} onCheckedChange={setEnvBackground} aria-label="Background" title={envBackground ? "Transparent background" : "Solid background"} />
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 leading-[1.15]">
                    <label className="text-sm font-medium text-neutral-800">Grid</label>
                    <Switch checked={envGrid} onCheckedChange={setEnvGrid} aria-label="Grid" title={envGrid ? "Hide grid" : "Show grid"} />
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 leading-[1.15]">
                    <label className="text-sm font-medium text-neutral-800">Shadow</label>
                    <Switch checked={envShadow} onCheckedChange={setEnvShadow} aria-label="Shadow" title={envShadow ? "Hide shadows" : "Show shadows"} />
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 leading-[1.15]">
                    <label className="text-sm font-medium text-neutral-800">Auto rotate</label>
                    <Switch checked={envAutoRotate} onCheckedChange={setEnvAutoRotate} aria-label="Auto rotate" title={envAutoRotate ? "Pause rotation" : "Auto rotate"} />
                  </div>
                </div>
              </div>
            )}

          </div>
          </ScrollArea>
          </div>
          </div>
        </aside>
      </div>

      {/* Compact: bottom Canvas | Create with sliding pill */}
      <nav
        className="lg:hidden shrink-0 border-t border-neutral-200 bg-white px-3 pt-2.5 pb-[max(0.65rem,env(safe-area-inset-bottom))]"
        aria-label="Workspace sections"
      >
        <div className="relative mx-auto flex h-[56px] w-full max-w-[420px] items-center rounded-full bg-neutral-100 p-1.5 border border-neutral-200">
          <motion.div
            className="absolute top-1.5 bottom-1.5 rounded-full bg-neutral-950 shadow-sm"
            initial={false}
            animate={{
              left: mobileTab === "canvas" ? 6 : "50%",
              width: "calc(50% - 6px)",
            }}
            transition={{ type: "spring", stiffness: 420, damping: 34, mass: 0.7 }}
            aria-hidden
          />
          <Button
            type="button"
            variant="ghost"
            onClick={() => setMobileTab("canvas")}
            aria-pressed={mobileTab === "canvas"}
            className={cn(
              "relative z-10 h-full flex-1 gap-2 rounded-full text-[15px] font-semibold hover:bg-transparent",
              mobileTab === "canvas" ? "text-white hover:text-white" : "text-neutral-600 hover:text-neutral-900"
            )}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" /></svg>
            Canvas
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setMobileTab("create")}
            aria-pressed={mobileTab === "create"}
            className={cn(
              "relative z-10 h-full flex-1 gap-2 rounded-full text-[15px] font-semibold hover:bg-transparent",
              mobileTab === "create" ? "text-white hover:text-white" : "text-neutral-600 hover:text-neutral-900"
            )}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16m8-8H4" /></svg>
            Create
          </Button>
        </div>
      </nav>
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
      className={`flex-1 min-h-[132px] rounded-2xl border border-dashed flex flex-col items-center justify-center p-3 transition-all ${isDragging ? "border-neutral-900 bg-neutral-100 scale-[1.01]" : "border-neutral-300 bg-neutral-50/80 hover:border-neutral-400 hover:bg-white"}`}
      onDrop={onDrop} onDragOver={(e) => { e.preventDefault(); onDragOver(); }} onDragLeave={onDragLeave} onPaste={onPaste}
    >
      <input type="file" accept=".png,.jpg,.jpeg,.webp" className="hidden" id={inputId} onChange={onFileSelect} />
      {image ? (
        <div className="relative w-full h-full min-h-[108px] rounded-xl overflow-hidden group border border-neutral-200 bg-white">
          <img src={image} alt="Upload" className="w-full h-full object-cover" />
          <Button type="button" onClick={onClear} size="sm" className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-neutral-950/80 p-0 hover:bg-neutral-950" aria-label="Clear image">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </Button>
        </div>
      ) : (
        <label htmlFor={inputId} className="cursor-pointer text-center rounded-xl px-4 py-3 focus-within:ring-2 focus-within:ring-neutral-900/10">
          <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white text-neutral-500 shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" /></svg>
          </span>
          <p className="text-xs font-semibold text-neutral-700">Upload, drop, or paste</p>
          <p className="text-[10px] text-neutral-400 mt-1">You can also drag from the library</p>
        </label>
      )}
    </div>
  );
}
