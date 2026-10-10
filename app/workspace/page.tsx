"use client";

import dynamic from "next/dynamic";
import { Suspense, useState, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth, UserButton } from "@clerk/nextjs";
import { motion } from "motion/react";
import {
  Box,
  Download,
  Grid3x3,
  Image as ImageIcon,
  Library,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelRightClose,
  Plus,
  RotateCw,
  Search,
} from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { StudioOrb } from "../../components/workspace/StudioOrb";
import { WorkspaceRail, type WorkspaceSection } from "../../components/workspace/WorkspaceRail";
import { AgentPanel } from "../../components/workspace/AgentPanel";
import { ImagePanel } from "../../components/workspace/ImagePanel";
import { ModelPanel } from "../../components/workspace/ModelPanel";
import { EditPanel } from "../../components/workspace/EditPanel";
import { GalleryPanel } from "../../components/workspace/GalleryPanel";
import { renderGlbSnapshot, renderGlbMultiViewSnapshots } from "../../lib/viewer/renderGlbSnapshot";
import { MAX_PROMPT } from "../../components/workspace/composer-parts";
import type { WaterViewerHandle } from "../../components/WaterViewer";
import { WaterPassRail } from "../../components/water/WaterPassRail";
import { AssetInspector } from "../../components/workspace/AssetInspector";
import {
  applyLookPatch,
  DEFAULT_PART_MATERIAL,
  DEFAULT_VIEWER_LOOK,
  sanitizePartMaterials,
  toHexColor,
  type PartMaterial,
  type PartMaterialMap,
  type ViewerLook,
} from "../../lib/viewer/look";
import type { ModelMeshStats } from "../../lib/viewer/meshStats";
import { useKeyedDebounce } from "../../lib/use-keyed-debounce";
import { usePromptHistory } from "../../lib/prompt-history";
import { ModeToggle } from "../../components/mode-toggle";
import { Input } from "../../components/ui/input";
import { Progress } from "../../components/ui/progress";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  submitImageTo3D,
  submitWater,
  fetchWaterJob,
  saveWaterThumbnail,
  fetchUserApiKeys,
  fetchWaterModels,
  saveUserModelPrefs,
  generatePreviewImage,
  registerJobWithPreview,
  editImage,
  uploadImageViaApi,
  uploadImage,
  fetchWorkspace,
  fetchWorkspaceJobs,
  fetchWorkspaces,
  updateWorkspaceNameApi,
  createWorkspaceApi,
  fetchStatus,
  fetchQueueInfo,
  getGlbUrl,
  getProxyGlbUrl,
  getProxiedImageUrl,
  downloadGlbWithAuth,
  notifyGpuOffline,
  cancelJob,
  canEdit,
  onFeaturesChange,
  getHealthState,
  BackendJob,
  QueueInfo,
  UserApiKeyMeta,
  providerKeyAvailable,
  type WaterModelGroup,
  type WaterSceneBundle,
  patchWaterScene,
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
  getCatalogModel,
  isCodeModel,
  migrateCodeModelId,
  providerForModelId,
  type CatalogModel,
  type ModelId,
} from "../../lib/models";
import {
  ENABLED_WATER_MODELS_EVENT,
  ENABLED_WATER_MODELS_KEY,
  readEnabledModelIds,
  resolveEnabledModelIds,
} from "../../lib/waterModels";
import { isWaterJob, isWaterJobId } from "../../lib/engines";
import type { ImageProviderAvailability } from "../../lib/apiHealth";
import {
  DEFAULT_IMAGE_OPTIONS,
  IMAGE_TO_3D_CREDITS,
  imageCredits,
  loadImageOptions,
  saveImageOptions,
  type ImageOptions,
} from "../../lib/imageOptions";
import {
  DEFAULT_WATER_SKILL,
  WATER_SKILLS,
  WATER_SKILL_STORAGE_KEY,
  WATER_TIER_STORAGE_KEY,
  parseQualityTier,
  waterPassLabel,
  type QualityTier,
  type WaterSkillId,
} from "../../lib/waterSkills";
import {
  requestNotificationPermission,
  notifyGenerationComplete,
} from "../../lib/browserNotifications";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://hydrilla-backend.vercel.app";
const WATER_POLL_INTERVAL_MS = 2_000;
const WATER_POLL_MAX_MS = 18 * 60 * 1000;

const displayImageUrl = (url: string | null | undefined): string => getProxiedImageUrl(url) || url || "";


const sculptPassLabel = (pass?: string | null): string => waterPassLabel(pass);

// Lazy-load ThreeViewer (Three.js is heavy; load only when 3D is shown)
const ThreeViewer = dynamic(() => import("../../components/ThreeViewer").then((m) => ({ default: m.ThreeViewer })), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-white">
      <StudioOrb state="searching" size={64} />
    </div>
  ),
});

const WaterViewer = dynamic(
  () => import("../../components/WaterViewer").then((m) => ({ default: m.WaterViewer })),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-white">
        <StudioOrb state="searching" size={64} />
      </div>
    ),
  }
);

type InputMode = "text" | "image" | "text_1img";

// Per-mode state so each mode remembers its own prompt and image
interface ModeState {
  prompt: string;
  image1: string | null;
  file1: File | null;
  jobId1: string | null; // Workspace job ID for image1 (null if uploaded from disk)
}

const defaultModeStates: Record<InputMode, ModeState> = {
  text: { prompt: "", image1: null, file1: null, jobId1: null },
  image: { prompt: "", image1: null, file1: null, jobId1: null },
  text_1img: { prompt: "", image1: null, file1: null, jobId1: null },
};

type CenterView =
  | { type: "empty" }
  | { type: "preview"; imageUrl: string; previewId?: string }
  | { type: "generating"; progress: number; message: string }
  | { type: "3d"; glbUrl: string; jobId: string }
  | { type: "code"; factoryCode: string; jobId: string }
  | { type: "error"; message: string; refunded?: boolean };

/** Show "GPU is unavailable" when both APIs have failed (fetch/network errors). */
function toUserFacingGpuError(msg: string | null | undefined): string {
  if (!msg) {
    return "GPU is currently offline or restarting. Your credits have been refunded. Please try again in a few moments.";
  }
  if (/fetch failed|failed to fetch|networkerror|ECONNREFUSED|External service unavailable|GPU is unavailable|GPU is currently offline|503|timeout|timed out|GENERATION_TIMEOUT/i.test(msg)) {
    return "GPU is currently offline or restarting. Your credits have been refunded. Please try again in a few moments.";
  }
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
      <div className="flex h-screen items-center justify-center bg-white">
        <StudioOrb state="connecting" size={64} />
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

  // Edit needs an OpenAI or Gemini key on the backend (features.edit_image from /api/3d/health).
  // Updated after mount so SSR/client first paint match.
  const [editAvailable, setEditAvailable] = useState(false);
  const [imageProviders, setImageProviders] = useState<ImageProviderAvailability>({ openai: true, gemini: true });
  useEffect(() => {
    setEditAvailable(canEdit());
    setImageProviders(getHealthState().providers);
    return onFeaturesChange((state) => {
      setEditAvailable(!!state.features.edit_image);
      setImageProviders(state.providers);
    });
  }, []);

  const [imageOptions, setImageOptions] = useState<ImageOptions>(DEFAULT_IMAGE_OPTIONS);
  useEffect(() => {
    setImageOptions(loadImageOptions());
  }, []);
  const handleImageOptionsChange = useCallback((next: ImageOptions) => {
    setImageOptions(next);
    saveImageOptions(next);
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Loading states
  const [loading, setLoading] = useState(false);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [activeModelStats, setActiveModelStats] = useState<ModelMeshStats | null>(null);
  const isSubmittingImageRef = useRef(false);
  const isSubmitting3DRef = useRef(false);
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
        resultGlbUrl: null,
        previewImageUrl: partial.previewImageUrl ?? null,
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

  // Selected job (factory, source image, water scene)
  const [selectedJobInfo, setSelectedJobInfo] = useState<BackendJob | null>(null);
  const [mobileGeneratedToast, setMobileGeneratedToast] = useState(false);
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
            resultGlbUrl: null,
            previewImageUrl: dataUrl,
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
  const [activeSection, setActiveSection] = useState<WorkspaceSection>("model");
  const [waterSkill, setWaterSkill] = useState<WaterSkillId>(DEFAULT_WATER_SKILL);
  const [isImageEditMode, setIsImageEditMode] = useState<boolean>(false);
  const [editPrompt, setEditPrompt] = useState<string>("");
  const [editResolution, setEditResolution] = useState<"standard" | "ultra1k">("standard");
  const [modelResolution, setModelResolution] = useState<"standard" | "ultra1k">("standard");
  const [modelInputMode, setModelInputMode] = useState<"image" | "prompt">("image");

  useEffect(() => {
    setClientMounted(true);
    try {
      const savedTier = window.localStorage.getItem(WATER_TIER_STORAGE_KEY);
      if (savedTier) {
        setWaterQualityTier(parseQualityTier(savedTier));
      }
      const savedSkill = window.localStorage.getItem(
        WATER_SKILL_STORAGE_KEY
      ) as WaterSkillId | null;
      if (savedSkill && WATER_SKILLS.some((s) => s.id === savedSkill)) {
        setWaterSkill(savedSkill);
      }
      const savedSection = window.localStorage.getItem(
        "hydrilla_workspace_section"
      ) as WorkspaceSection | null;
      if (
        savedSection &&
        (savedSection === "agent" || savedSection === "image" || savedSection === "model" || savedSection === "edit")
      ) {
        setActiveSection(savedSection);
        if (savedSection === "agent" || savedSection === "image") {
          setInputMode("text");
        } else if (savedSection === "edit") {
          setInputMode("text_1img");
        } else {
          setInputMode("image");
        }
      } else {
        setInputMode("image");
      }
    } catch {
      /* ignore */
    }
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
  const [preferredWaterModelId, setPreferredWaterModelId] = useState<string | null>(null);
  const [agentPrompt, setAgentPrompt] = useState("");
  const [enabledWaterIds, setEnabledWaterIds] = useState<string[]>([]);
  const [apiKeys, setApiKeys] = useState<UserApiKeyMeta[]>([]);
  const [sharedKeys, setSharedKeys] = useState<UserApiKeyMeta[]>([]);
  const [waterGroups, setWaterGroups] = useState<WaterModelGroup[]>([]);
  const [codeFactoryCode, setCodeFactoryCode] = useState<string | null>(null);
  const [codeSculptPass, setCodeSculptPass] = useState<string | null>(null);
  const [waterEditTargetJobId, setWaterEditTargetJobId] = useState<string | null>(null);
  const [waterDropHighlight, setWaterDropHighlight] = useState(false);
  const [waterQualityTier, setWaterQualityTier] = useState<QualityTier>("standard");
  const [waterScene, setWaterScene] = useState<WaterSceneBundle | null>(null);
  // Part editing for whichever viewer is open (Water iframe or Cloud GLB).
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  /** Authored material per mesh, reported by the viewer on load. */
  const [authoredParts, setAuthoredParts] = useState<PartMaterialMap>({});
  /** Live edits this session; win over saved scene values. */
  const [partEdits, setPartEdits] = useState<PartMaterialMap>({});
  const waterViewerRef = useRef<WaterViewerHandle>(null);
  const waterPickerModels: CatalogModel[] = useMemo(
    () =>
      waterGroups.flatMap((g) => {
        const free = g.models.filter((m) => m.free);
        const paid = g.models.filter((m) => !m.free);
        const asCatalog = (models: typeof g.models, group: string): CatalogModel[] =>
          models.map((m) => ({
            id: m.id,
            label: m.name,
            group,
            kind: "code" as const,
            provider: g.provider,
            free: m.free,
            source: g.source,
          }));
        if (g.provider === "openrouter" && free.length && paid.length) {
          return [
            ...asCatalog(free, "OpenRouter Free"),
            ...asCatalog(paid, "OpenRouter"),
          ];
        }
        return asCatalog(g.models, g.name);
      }),
    [waterGroups]
  );
  const selectedCatalog =
    getCatalogModel(selectedModel) ||
    waterPickerModels.find((m) => m.id === selectedModel) ||
    undefined;
  const selectedProvider = providerForModelId(selectedModel);
  const selectedIsCode =
    selectedProvider !== null && selectedProvider !== "hydrilla";

  // Water: Text + Edit only. Snap away from the cloud Image mode.
  // Cloud: snap Edit off when image editing is unavailable.
  useEffect(() => {
    if (selectedIsCode) {
      if (inputMode === "image") {
        setInputMode("text");
      }
      return;
    }
    if (inputMode === "text_1img" && !editAvailable) {
      setInputMode("text");
    }
  }, [selectedIsCode, inputMode, editAvailable]);

  useEffect(() => {
    if (centerView.type !== "code" && centerView.type !== "3d") return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (event.key === "Escape") {
        setSelectedPart(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [centerView.type]);

  const viewerAssetKey =
    centerView.type === "code" ? `code:${centerView.jobId}` : centerView.type === "3d" ? `3d:${centerView.glbUrl}` : "";
  useEffect(() => {
    setSelectedPart(null);
    setAuthoredParts({});
    setPartEdits({});
  }, [viewerAssetKey]);

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
        setSharedKeys(data.sharedKeys ?? []);
        // Chat box always opens on Cloud / BlueFox 1; the saved Water model is not auto-selected.
        const preferred = migrateCodeModelId(data.prefs?.defaultCodeModel);
        if (preferred && isCodeModel(preferred)) {
          setPreferredWaterModelId(preferred);
          // Persist migration when prefs still hold a retired 4.5 id
          if (data.prefs?.defaultCodeModel && data.prefs.defaultCodeModel !== preferred) {
            void saveUserModelPrefs({ defaultCodeModel: preferred }, tokenGetter).catch(() => {});
          }
        }
        try {
          const water = await fetchWaterModels(tokenGetter);
          setWaterGroups(water.groups);
          setEnabledWaterIds(
            resolveEnabledModelIds(water.groups, data.prefs?.enabledCodeModels)
          );
        } catch {
          setWaterGroups([]);
        }
      } catch {
        // Settings migration may not be deployed yet — picker still works for Trilles
      }
    })();
  }, [isSignedIn, getToken]);

  const providerKeyOk = useCallback(
    (provider: string) => providerKeyAvailable(provider, apiKeys, sharedKeys),
    [apiKeys, sharedKeys]
  );

  useEffect(() => {
    const sync = () => {
      const local = readEnabledModelIds();
      setEnabledWaterIds(resolveEnabledModelIds(waterGroups, local));
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === ENABLED_WATER_MODELS_KEY) sync();
    };
    window.addEventListener(ENABLED_WATER_MODELS_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(ENABLED_WATER_MODELS_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, [waterGroups]);

  const modelTypeLabel: Record<string, string> = Object.fromEntries([
    ...MODEL_CATALOG.map((m) => [m.id, m.label] as const),
    ...waterPickerModels.map((m) => [m.id, m.label] as const),
  ]);
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

  const [look, setLook] = useState<ViewerLook>(DEFAULT_VIEWER_LOOK);
  const updateLook = useCallback((patch: Partial<ViewerLook>) => setLook((prev) => applyLookPatch(prev, patch)), []);

  const activeWaterJobId =
    centerView.type === "code"
      ? centerView.jobId
      : selectedJobInfo && isWaterJobFn(selectedJobInfo)
        ? selectedJobInfo.id
        : null;
  const waterThreadJobs = useMemo(() => {
    if (!activeWaterJobId) {
      return [];
    }
    const findJob = (id: string): BackendJob | null =>
      library3DAssets.find((j) => j.id === id) ||
      (selectedJobInfo?.id === id ? selectedJobInfo : null);
    const chain: { id: string; prompt: string | null; createdAt: string }[] = [];
    const seen = new Set<string>();
    const cursor: { id: string | null } = { id: activeWaterJobId };
    while (cursor.id && !seen.has(cursor.id)) {
      seen.add(cursor.id);
      const job = findJob(cursor.id);
      chain.unshift({
        id: cursor.id,
        prompt: job?.prompt ?? null,
        createdAt: job?.createdAt ?? "",
      });
      const parentId = job?.parentJobId ?? null;
      cursor.id = parentId && isWaterJobId(parentId) ? parentId : null;
    }
    return chain;
  }, [activeWaterJobId, library3DAssets, selectedJobInfo]);

  const activeWaterJobRef = useRef(activeWaterJobId);
  activeWaterJobRef.current = activeWaterJobId;
  const waterSceneForJob = waterScene && waterScene.jobId === activeWaterJobId ? waterScene : null;
  const savedParts = useMemo(
    () => sanitizePartMaterials(waterSceneForJob?.instance?.partMaterials),
    [waterSceneForJob]
  );
  const effectiveParts = useMemo(() => ({ ...savedParts, ...partEdits }), [savedParts, partEdits]);
  const selectedPartMaterial: PartMaterial | null = selectedPart
    ? { ...DEFAULT_PART_MATERIAL, ...authoredParts[selectedPart], ...effectiveParts[selectedPart] }
    : null;

  const handleViewerParts = useCallback((parts: PartMaterialMap) => {
    setAuthoredParts(parts);
    setSelectedPart((prev) => (prev && parts[prev] ? prev : Object.keys(parts)[0] ?? null));
  }, []);

  const savePartMaterial = useKeyedDebounce<{ jobId: string; name: string; material: PartMaterial }>(
    (_key, { jobId, name, material }) => {
      void patchWaterScene({
        jobId,
        op: "material",
        name,
        material,
        getToken: async () => (await getToken()) ?? null,
      })
        .then((scene) => {
          if (scene && activeWaterJobRef.current === jobId) setWaterScene(scene);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : "Could not save part material");
        });
    },
    250
  );

  const handlePartMaterial = (patch: Partial<PartMaterial>) => {
    if (!selectedPart || !selectedPartMaterial) return;
    const color = patch.color == null ? selectedPartMaterial.color : toHexColor(patch.color);
    if (!color) return;
    const next: PartMaterial = { ...selectedPartMaterial, ...patch, color };
    setPartEdits((prev) => ({ ...prev, [selectedPart]: next }));
    if (activeWaterJobId) {
      savePartMaterial(`${activeWaterJobId}:${selectedPart}`, { jobId: activeWaterJobId, name: selectedPart, material: next });
    }
  };

  const historyJobs = useMemo(() => [...libraryImages, ...library3DAssets], [libraryImages, library3DAssets]);
  const promptHistory = usePromptHistory(workspaceId, historyJobs);

  useEffect(() => {
    if (isSignedIn && workspaceId) {
      refreshCredits();
    }
  }, [isSignedIn, workspaceId, refreshCredits]);

  const promptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const libraryPanelRef = useRef<HTMLElement>(null);

  // Sliding & resizable side panels
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [leftLibraryTab, setLeftLibraryTab] = useState<"images" | "3d">("images");
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [fullView, setFullView] = useState(false);
  const [leftPanelWidth, setLeftPanelWidth] = useState(280);
  const [resizingLeft, setResizingLeft] = useState(false);
  const resizeStartRef = useRef({ x: 0, leftW: 0 });

  // Compact (phone + tablet < lg): Canvas | Create tabs instead of 3-panel desktop
  const [mobileTab, setMobileTab] = useState<"canvas" | "create">("create");
  const [isCompact, setIsCompact] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 1023px)").matches : false
  );

  const MIN_PANEL = 200;
  const MAX_LEFT = 500;
  const RIGHT_PANEL_WIDTH = 280; // fixed width, not resizable; collapse gives more space to viewer

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
  const file1 = current.file1;
  const jobId1 = current.jobId1;

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
  const setFile1 = useCallback(
    (f: File | null) => updateCurrentMode({ file1: f }),
    [updateCurrentMode]
  );
  const setJobId1 = useCallback(
    (id: string | null) => updateCurrentMode({ jobId1: id }),
    [updateCurrentMode]
  );

  const [multiViewPreviews, setMultiViewPreviews] = useState<string[]>([]);
  const [isRenderingMultiView, setIsRenderingMultiView] = useState(false);
  const cachedMultiViewFilesRef = useRef<File[] | null>(null);

  const captureMultiViewSnapshots = useCallback(
    async (source: File | string) => {
      setIsRenderingMultiView(true);
      try {
        const res = await renderGlbMultiViewSnapshots(source);
        setMultiViewPreviews(res.views.map((v) => v.dataUrl));
        cachedMultiViewFilesRef.current = res.views.map((v) => v.file);
        setImage1(res.composite.dataUrl);
      } catch (err) {
        console.warn("Multi-view 4-screenshot capture failed:", err);
      } finally {
        setIsRenderingMultiView(false);
      }
    },
    [setImage1]
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
    if (!currentGenerating || currentGenerating.status !== "generating") {
      return;
    }
    // Pending optimistic IDs are in-flight client placeholders; never poll server with pending- prefix.
    // Water jobs poll via fetchWaterJob in runWater / handle3DClick — never use GPU/GLB status.
    if (
      currentGenerating.jobId.startsWith("pending-") ||
      isWaterJobId(currentGenerating.jobId) ||
      centerView.type === "code"
    ) {
      return;
    }

    const failureTracker = { count: 0 };
    const MAX_FAILURES = 20;

    // 30-minute timeout cap:
    // Gives generous time (20-30 minutes) especially for high-res reconstruction or GPU queue wait.
    const MAX_POLL_MS = 30 * 60 * 1000;
    const pollStartedAt = Date.now();

    const pollStatus = async () => {
      // Stop polling if we've exceeded the max client-side wait (30 minutes).
      if (Date.now() - pollStartedAt > MAX_POLL_MS) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        const timedOutJobId = currentGenerating.jobId;
        setCurrentGenerating(null);
        setLoading(false);
        try {
          await cancelJob(timedOutJobId, async () => (await getToken()) ?? null);
        } catch {
          // ignore cancel error; backend timeout handles status and refund
        }
        refreshCredits();
        refreshLibrary();
        setCenterView({
          type: "error",
          message:
            "GPU is currently offline or restarting. Your credits have been refunded. Please try again in a few moments.",
          refunded: true,
        });
        return;
      }
      try {
        const status = await fetchStatus(currentGenerating.jobId, async () => (await getToken()) ?? null);
        failureTracker.count = 0;

        if (status.queue) {
          const estimatedTotal = status.queue.estimated_total_seconds || currentGenerating.estimatedTotalSeconds || 840;
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
              const followsCurrentJob =
                prev.type === "generating" ||
                (prev.type === "preview" && prev.previewId === currentGenerating.jobId) ||
                (prev.type === "3d" && prev.jobId === currentGenerating.jobId);
              if (!followsCurrentJob) return prev;
              return { type: "generating", progress: waitProgress, message: msg };
            });
            setCurrentGenerating((prev) =>
              prev ? { ...prev, progress: waitProgress } : null
            );
          } else {
            const gpuProgress =
              typeof status.progress === "number" && status.progress > 0 ? status.progress : null;
            const waitTime = status.queue.estimated_wait_seconds || 0;
            const processingElapsed = Math.max(0, elapsedSeconds - waitTime);
            const processingDuration = Math.max(1, estimatedTotal - waitTime);
            const timeProgress = 50 + (processingElapsed / processingDuration) * 45;
            const progress = gpuProgress != null
              ? Math.max(gpuProgress, Math.min(95, timeProgress))
              : Math.max(50, Math.min(95, timeProgress));
            const msg = status.message || "Generating 3D model...";
            setCenterView((prev) => {
              const followsCurrentJob =
                prev.type === "generating" ||
                (prev.type === "preview" && prev.previewId === currentGenerating.jobId) ||
                (prev.type === "3d" && prev.jobId === currentGenerating.jobId);
              if (!followsCurrentJob) return prev;
              return {
                type: "generating",
                progress,
                message: msg,
              };
            });
            setCurrentGenerating((prev) =>
              prev ? { ...prev, progress } : null
            );
          }
        } else if (typeof status.progress === "number") {
          const progress = Math.min(95, Math.max(5, status.progress));
          const msg = status.message || "Generating 3D model...";
          setCenterView((prev) => {
            const followsCurrentJob =
              prev.type === "generating" ||
              (prev.type === "preview" && prev.previewId === currentGenerating.jobId) ||
              (prev.type === "3d" && prev.jobId === currentGenerating.jobId);
            if (!followsCurrentJob) return prev;
            return { type: "generating", progress, message: msg };
          });
          setCurrentGenerating((prev) =>
            prev ? { ...prev, progress } : null
          );
        } else if (status.status === "processing" || status.status === "pending") {
          const startTime = status.created_at || currentGenerating.startTime || Date.now();
          const elapsedSeconds = (Date.now() - startTime) / 1000;
          const estimatedTotal = currentGenerating.estimatedTotalSeconds || 840;
          const progress = Math.min(90, Math.max(8, (elapsedSeconds / estimatedTotal) * 90));
          setCenterView((prev) => {
            const followsCurrentJob =
              prev.type === "generating" ||
              (prev.type === "preview" && prev.previewId === currentGenerating.jobId) ||
              (prev.type === "3d" && prev.jobId === currentGenerating.jobId);
            if (!followsCurrentJob) return prev;
            return {
              type: "generating",
              progress,
              message: status.message || "Generating 3D model...",
            };
          });
          setCurrentGenerating((prev) =>
            prev ? { ...prev, progress } : null
          );
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

          notifyGenerationComplete({
            type: "3d",
            prompt: selectedJobInfo?.prompt || prompt || null,
          });

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
            userId: null, imageUrl: null, errorMessage: null, updatedAt: new Date().toISOString(),
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
          const rawError = status.error || "Generation failed";
          const userFacing = toUserFacingGpuError(rawError);
          setCurrentGenerating(null);
          setLoading(false);
          refreshCredits();
          refreshLibrary();
          void (async () => {
            await waitMobileGpuOfflineMinimum(status.error, userFacing);
            mobileGenStartedAtRef.current = null;
            setCenterView({
              type: "error",
              message: userFacing,
              refunded: true,
            });
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
          refreshCredits();
          refreshLibrary();
          setCenterView({
            type: "error",
            message: "Job cancelled. Your credits have been automatically refunded.",
            refunded: true,
          });
        }
      } catch (err: unknown) {
        failureTracker.count += 1;
        const errMsg = err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message) : "";
        const isGpuUnavailable = /GPU is (currently )?offline|GPU is unavailable|503/i.test(errMsg);
        const maxAllowedFailures = isGpuUnavailable ? 3 : MAX_FAILURES;
        if (failureTracker.count >= maxAllowedFailures) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          track("3d_generation_failed", {
            stage: "polling",
            reason: isGpuUnavailable ? "gpu_unavailable" : "connection_lost",
          });
          setCurrentGenerating(null);
          setLoading(false);
          refreshCredits();
          refreshLibrary();
          setCenterView({
            type: "error",
            message: isGpuUnavailable
              ? "GPU is currently offline or restarting. Your credits have been automatically refunded."
              : "Lost connection to server. Any credits used for failed generation have been automatically refunded.",
            refunded: true,
          });
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
  const processIncomingFile = useCallback(
    async (file: File) => {
      const is3DFile =
        file.name.endsWith(".glb") ||
        file.name.endsWith(".gltf") ||
        file.name.endsWith(".obj") ||
        file.type.startsWith("model/");
      const isImageFile = file.type.startsWith("image/");
      if (!is3DFile && !isImageFile) {
        return;
      }
      const url = URL.createObjectURL(file);
      setImage1(url);
      setFile1(file);
      setJobId1(null);
      if (is3DFile) {
        setCenterView({ type: "3d", glbUrl: url, jobId: "uploaded-3d-model" });
        void captureMultiViewSnapshots(file);
      }
    },
    [setImage1, setFile1, setJobId1, setCenterView, captureMultiViewSnapshots]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      // Check if dragged from the library panel (has job-id data)
      const draggedJobId = e.dataTransfer.getData("application/job-id");
      const draggedImageUrl = e.dataTransfer.getData("text/uri-list");
      if (draggedJobId && draggedImageUrl) {
        // Dropped from library — use URL, track parent job ID, clear file
        setImage1(draggedImageUrl);
        setFile1(null);
        setJobId1(draggedJobId);
        setMultiViewPreviews([]);
        cachedMultiViewFilesRef.current = null;
        return;
      }

      // Dropped from file system
      const file = e.dataTransfer.files?.[0];
      if (!file) {
        return;
      }
      void processIncomingFile(file);
    },
    [setImage1, setFile1, setJobId1, processIncomingFile]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const file = e.clipboardData.files?.[0];
      if (!file) {
        return;
      }
      void processIncomingFile(file);
    },
    [processIncomingFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        return;
      }
      void processIncomingFile(file);
      e.target.value = "";
    },
    [processIncomingFile]
  );

  const handleClearImage = useCallback(() => {
    setImage1(null);
    setFile1(null);
    setJobId1(null);
    setMultiViewPreviews([]);
    cachedMultiViewFilesRef.current = null;
    setIsRenderingMultiView(false);
  }, [setImage1, setFile1, setJobId1]);

  // ──────────── Water (bring-your-own model): text → procedural Three.js ────────────
  // No GPU, no credits, no image required. The backend runs the img2threejs-style pipeline
  // (intake gate → spec → blockout codegen → code gate) and we just poll the pass names.
  const runWater = useCallback(
    async (options: {
      referenceImageUrl?: string | null;
      parentId?: string | null;
      promptOverride?: string | null;
    } = {}) => {
      void requestNotificationPermission();

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

      const description = (options.promptOverride ?? prompt).trim();
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
          qualityTier: waterQualityTier,
          skillId: waterSkill,
          factoryCode:
            parentId && centerView.type === "code" && centerView.jobId === parentId
              ? centerView.factoryCode
              : parentId && codeFactoryCode
                ? codeFactoryCode
                : undefined,
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
          resultGlbUrl: null,
          previewImageUrl: referenceImageUrl,
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
          const maxAttempts = Math.ceil(WATER_POLL_MAX_MS / WATER_POLL_INTERVAL_MS);
          for (let i = 0; i < maxAttempts; i++) {
            if (pollGen !== waterPollGenRef.current) return;
            await new Promise((r) => setTimeout(r, WATER_POLL_INTERVAL_MS));
            if (pollGen !== waterPollGenRef.current) return;
            try {
              const job = await fetchWaterJob(result.job_id, tokenGetter);
              if (pollGen !== waterPollGenRef.current) return;

              if (job.status === "DONE" && job.factoryCode) {
                setCodeFactoryCode(job.factoryCode);
                setCodeSculptPass(job.sculptPass || "done");
                if (job.scene) setWaterScene(job.scene);
                setCurrentGenerating(null);
                setCenterView({ type: "code", factoryCode: job.factoryCode, jobId: result.job_id });
                setMobileTab("canvas");
                setMobileGeneratedToast(true);
                setSelectedJobInfo((prev) =>
                  prev && prev.id === result.job_id
                    ? {
                        ...prev,
                        status: "DONE",
                        sculptPass: job.sculptPass || "done",
                        hasFactoryCode: true,
                        durationMs: job.durationMs,
                        visualEvidence: job.visualEvidence,
                      }
                    : prev
                );
                notifyGenerationComplete({
                  type: "3d",
                  prompt: job.prompt || options.promptOverride || prompt || null,
                });
                setLibrary3DAssets((prev) =>
                  applyCodeThumbs(
                    prev.map((j) =>
                      j.id === result.job_id
                        ? {
                            ...j,
                            status: "DONE" as const,
                            hasFactoryCode: true,
                            sculptPass: job.sculptPass || "done",
                            durationMs: job.durationMs,
                            visualEvidence: job.visualEvidence,
                          }
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
                  prev && prev.id === result.job_id
                    ? { ...prev, status: "FAIL", errorMessage: job.errorMessage, durationMs: job.durationMs }
                    : prev
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
            message:
              "Water is still running longer than expected. Open the job from the library to resume live status.",
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
      waterQualityTier,
      centerView,
      codeFactoryCode,
    ]
  );

  /** Resolve parent Water job for right-panel Edit mode. Empty string = user cleared the slot. */
  const resolveWaterEditParentId = useCallback((): string | null => {
    if (waterEditTargetJobId === "") return null;
    if (waterEditTargetJobId) return waterEditTargetJobId;
    if (centerView.type === "code" && centerView.jobId) return centerView.jobId;
    if (selectedJobInfo && isWaterJobFn(selectedJobInfo)) return selectedJobInfo.id;
    return null;
  }, [waterEditTargetJobId, centerView, selectedJobInfo, isWaterJobFn]);

  /** Right-panel Water Generate: Text = new job; Edit = refine parent. */
  const runWaterFromPanel = useCallback(async () => {
    if (inputMode === "text_1img") {
      const parentId = resolveWaterEditParentId();
      if (!parentId) {
        const msg = "Open or select a Water model to edit first";
        setError(msg);
        setCenterView({ type: "error", message: msg });
        return;
      }
      if (!prompt.trim()) {
        setError("Please enter a refine prompt");
        return;
      }
      await runWater({ parentId, promptOverride: prompt.trim() });
      return;
    }
    await runWater();
  }, [inputMode, resolveWaterEditParentId, prompt, runWater]);

  // Helper: start 3D generation from image URL (used after image gen or when we already have preview).
  // When `localFile` is set (user picked a file from disk), pass it straight into `submitImageTo3D` so
  // the client upload path matches /generate page — avoids relying on a separate pre-upload + URL that
  // can be wrong (gateway vs backend, blob quirks, or localhost URLs in dev).
  const start3DFromImage = useCallback(
    async (
      imageUrl: string,
      previewId: string | null,
      localFile: File | null = null,
      customPrompt?: string | null
    ) => {
      void requestNotificationPermission();

      if (!hasWorkspaceContext) {
        setForcedWorkspaceModal(true);
        setShowNewWorkspaceModal(true);
        setError("Please create a workspace first");
        return;
      }

      if (isSubmitting3DRef.current) {
        return;
      }
      isSubmitting3DRef.current = true;

      // Water engine. The image is only ever an extra reference.
      if (isCodeModel(selectedModel)) {
        try {
          const reference = localFile
            ? await uploadImage(localFile, async () => await getToken()).catch(() => null)
            : (imageUrl || null);
          await runWater({ referenceImageUrl: reference, parentId: previewId });
        } finally {
          isSubmitting3DRef.current = false;
        }
        return;
      }

      const targetPrompt = (
        customPrompt !== undefined && customPrompt !== null
          ? customPrompt
          : activeSection === "edit"
          ? editPrompt
          : prompt
      )?.trim() || null;

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
        prompt: targetPrompt,
        parentJobId: previewId ?? null,
        parentJobIds: previewId ? [previewId] : [],
      });
      loadJobInfo({
        id: pendingId,
        userId: null,
        status: "WAIT",
        prompt: targetPrompt,
        imageUrl,
        generateType: "ImageTo3D",
        resultGlbUrl: null,
        previewImageUrl: imageUrl,
        errorMessage: null,
        workspaceId: workspaceId ?? null,
        parentJobId: previewId ?? null,
        parentJobIds: previewId ? [previewId] : [],
        sourceImages: [imageUrl],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const queueInfo = await fetchQueueInfo().catch(async (err: unknown) => {
        const msg = err && typeof err === "object" && "message" in err ? String((err as { message?: string }).message) : "";
        const userFacing = msg?.includes("GPU is currently offline")
          ? toUserFacingGpuError(msg)
          : toUserFacingGpuError("Failed to get queue info");
        if (msg?.includes("GPU is currently offline")) {
          notifyGpuOffline(msg, tokenGetter);
        }
        await waitMobileGpuOfflineMinimum(msg, userFacing);
        mobileGenStartedAtRef.current = null;
        setCenterView({ type: "error", message: userFacing, refunded: true });
        removePendingJob(pendingId);
        setLoading(false);
        track("3d_generation_failed", {
          stage: "queue_info",
          reason: msg?.includes("GPU is currently offline") ? "gpu_offline" : "queue_error",
        });
        return null;
      });
      const active3DResolution = activeSection === "edit" ? editResolution : modelResolution;
      const fallbackEstSec = active3DResolution === "ultra1k" ? 900 : 840;
      const estimatedTotal = queueInfo?.estimated_total_seconds || fallbackEstSec;
      try {
        const result = await submitImageTo3D(
          localFile ? null : imageUrl,
          localFile,
          tokenGetter,
          previewId,
          null,
          workspaceId,
          previewId,
          selectedModel,
          active3DResolution,
          targetPrompt
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
          prompt: targetPrompt,
          imageUrl,
          generateType: "ImageTo3D",
          resultGlbUrl: null,
          previewImageUrl: imageUrl,
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
        setCenterView({ type: "error", message: userFacing, refunded: true });
        removePendingJob(pendingId);
        refreshCredits();
        refreshLibrary();
      } finally {
        isSubmitting3DRef.current = false;
        setLoading(false);
      }
    },
    [getToken, workspaceId, hasWorkspaceContext, markMobileGenerationStart, selectedModel, waitMobileGpuOfflineMinimum, addPendingJob, removePendingJob, refreshLibrary, refreshCredits, runWater, activeSection, editPrompt, prompt, editResolution, modelResolution]
  );

  // ──────────── STEP 1: Generate Image (optionally then 3D) ────────────
  const handleGenerateImage = async (thenGenerate3D?: boolean) => {
    if (isSubmittingImageRef.current || loading || generatingPreview) {
      return;
    }
    void requestNotificationPermission();
    setError(null);

    // Architectural guard: no caller can accidentally send a bring-your-own
    // model through TextToImage, the image providers, credits, or the GPU queue.
    if (selectedIsCode) {
      await runWaterFromPanel();
      return;
    }

    if (!hasWorkspaceContext) {
      setForcedWorkspaceModal(true);
      setShowNewWorkspaceModal(true);
      setError("Please create a workspace first");
      return;
    }
    if (!thenGenerate3D) {
      setLastPreviewImageUrl(null);
      setLastPreviewId(null);
    }

    const tokenGetter = async () => await getToken();

    // ── Text-only: /text-to-image (generatePreviewImage) ──
    if (inputMode === "text") {
      const trimmedPrompt = prompt.trim();
      if (!trimmedPrompt) {
        setError("Please enter a prompt");
        return;
      }
      if (trimmedPrompt.length < 2) {
        setError("Prompt is too short. Please provide at least 2 characters.");
        return;
      }
      if (prompt.length > MAX_PROMPT) {
        setError(`Prompt exceeds maximum supported length of ${MAX_PROMPT} characters.`);
        return;
      }

      isSubmittingImageRef.current = true;
      track("text_to_image_started", {
        then_generate_3d: !!thenGenerate3D,
        provider: imageOptions.provider,
        quality: imageOptions.quality,
        aspect: imageOptions.aspect,
      });
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
        resultGlbUrl: null,
        previewImageUrl: null,
        errorMessage: null,
        workspaceId: workspaceId ?? null,
        parentJobId: null,
        parentJobIds: [],
        sourceImages: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setLeftLibraryTab("images");

      const estimatedTime = imageOptions.quality === "high" ? 60 : 25;
      const startTime = Date.now();
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(90, (elapsed / estimatedTime) * 95);
        setCenterView({ type: "generating", progress, message: "Generating image from text..." });
      }, 200);

      try {
        const result = await generatePreviewImage(prompt.trim(), tokenGetter, { workspaceId }, imageOptions);
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
        refreshCredits();

        // Update generation info panel
        const newJob = { id: result.preview_id, previewImageUrl: result.image_url, prompt: prompt.trim(), status: "DONE" as const, generateType: "TextToImage", createdAt: new Date().toISOString(), userId: null, imageUrl: null, resultGlbUrl: null, errorMessage: null, updatedAt: new Date().toISOString() } satisfies BackendJob;
        loadJobInfo(newJob);

        if (thenGenerate3D) {
          await start3DFromImage(result.image_url, result.preview_id);
        } else {
          notifyGenerationComplete({
            type: "image",
            prompt: prompt.trim(),
          });
        }
      } catch (err: any) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        if (isPaywallError(err?.message)) {
          track("paywall_hit", { source: "text_to_image", action: "generate_image" });
        }
        const userFacing = err?.message || "Failed to generate image";
        await waitMobileGpuOfflineMinimum(err.message, userFacing);
        mobileGenStartedAtRef.current = null;
        setCenterView({ type: "error", message: userFacing, refunded: true });
        setGeneratingPreview(false);
        removePendingJob(pendingTextImageId);
        refreshCredits();
        refreshLibrary();
      } finally {
        isSubmittingImageRef.current = false;
      }
      return;
    }

    // ── Image only: upload or library image → 3D (no text-to-image, no edit API) ──
    if (inputMode === "image") {
      if (isSubmitting3DRef.current || isSubmittingImageRef.current) {
        return;
      }
      if (!file1 && !image1) {
        setError("Please upload an image");
        return;
      }
      setError(null);
      const uploadedImageUrl = file1
        ? await uploadSourceImageWithFallback(file1, tokenGetter).catch((err: any) => {
            setError(err?.message || "Failed to upload image");
            return null;
          })
        : image1!;
      if (!uploadedImageUrl) {
        return;
      }
      setLastPreviewImageUrl(uploadedImageUrl);
      setLastPreviewId(jobId1);
      setCenterView({ type: "preview", imageUrl: uploadedImageUrl, previewId: jobId1 || undefined });
      await start3DFromImage(uploadedImageUrl, jobId1);
      return;
    }

    // ── Text + 1 image: /edit-image (image-to-image), or image-to-3D if no prompt ──
    if (inputMode === "text_1img") {
      if (isSubmitting3DRef.current || isSubmittingImageRef.current) {
        return;
      }
      if (!file1 && !image1) {
        setError("Please upload an image");
        return;
      }

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
      track("image_edit_started", {
        mode: "text_1img",
        provider: imageOptions.provider,
        quality: imageOptions.quality,
      });

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
        resultGlbUrl: null,
        previewImageUrl: image1 ?? null,
        errorMessage: null,
        workspaceId: workspaceId ?? null,
        parentJobId: jobId1 ?? currentParentJobId ?? null,
        parentJobIds: jobId1 ? [jobId1] : [],
        sourceImages: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      setLeftLibraryTab("images");

      const estimatedTime = imageOptions.quality === "high" ? 60 : 30;
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

        const result = await editImage(
          prompt.trim(),
          file1,
          file1 ? null : image1,
          tokenGetter,
          {
            workspaceId,
            parentJobId: jobId1 || currentParentJobId || null,
            parentJobIds: jobId1 ? [jobId1] : [],
            sourceImages: editSrcImages,
          },
          imageOptions
        );
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
        refreshCredits();

        // Update generation info panel
        const editedJob = { id: result.edit_id, previewImageUrl: result.image_url, prompt: prompt.trim(), status: "DONE" as const, generateType: "EditImage", parentJobId: editParent, parentJobIds: editParentIds, sourceImages: editSrcImages, createdAt: new Date().toISOString(), userId: null, imageUrl: null, resultGlbUrl: null, errorMessage: null, updatedAt: new Date().toISOString() } satisfies BackendJob;
        loadJobInfo(editedJob);

        if (thenGenerate3D) {
          await start3DFromImage(result.image_url, result.edit_id);
        } else {
          notifyGenerationComplete({
            type: "image",
            prompt: prompt.trim(),
          });
        }
      } catch (err: any) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        if (isPaywallError(err?.message)) {
          track("paywall_hit", { source: "image_edit", action: "edit_image" });
        }
        const userFacing = err?.message || "Failed to edit image";
        await waitMobileGpuOfflineMinimum(err.message, userFacing);
        mobileGenStartedAtRef.current = null;
        setCenterView({ type: "error", message: userFacing, refunded: true });
        setGeneratingPreview(false);
        removePendingJob(pendingEditId);
        refreshCredits();
        refreshLibrary();
      }
      return;
    }
  };

  // ──────────── Generate 3D: from current preview, prompt, or chained edit ────────────
  // Single entry point for "Generate 3D" everywhere (center preview button AND
  // the bottom "Generate 3D" button when in Model / Edit studio).
  const handleGenerate3D = async () => {
    setError(null);
    if (loading || generatingPreview || isSubmitting3DRef.current || isSubmittingImageRef.current) {
      return;
    }
    if (!hasWorkspaceContext) {
      setForcedWorkspaceModal(true);
      setShowNewWorkspaceModal(true);
      setError("Please create a workspace first");
      return;
    }

    // Water engine writes Three.js straight from the prompt.
    // Never touches the image providers, the GPU VM, the queue, or credits.
    if (selectedIsCode) {
      await runWaterFromPanel();
      return;
    }

    const isEditSection = activeSection === "edit";
    const effectivePrompt = isEditSection
      ? editPrompt.trim()
      : prompt.trim();
    const effectiveResolution = isEditSection ? editResolution : modelResolution;
    const tokenGetter = async () => {
      return await getToken();
    };

    // ── Edit Studio flow: with base image + prompt (Image Edit -> 3D Generation) ──
    if (isEditSection && (file1 || image1 || lastPreviewImageUrl) && effectivePrompt) {
      if (effectivePrompt.length < 2) {
        setError("Edit prompt is too short. Please provide at least 2 characters.");
        return;
      }

      isSubmittingImageRef.current = true;
      track("edit_studio_edit_to_3d_started", {
        model: selectedModel,
        resolution: effectiveResolution,
        provider: imageOptions.provider,
      });
      setGeneratingPreview(true);
      markMobileGenerationStart();
      setCenterView({ type: "generating", progress: 0, message: "Modifying 3D model..." });

      const pendingEditId = addPendingJob({
        generateType: "EditImage",
        prompt: effectivePrompt,
        previewImageUrl: image1 ?? lastPreviewImageUrl ?? null,
        imageUrl: image1 ?? lastPreviewImageUrl ?? null,
        parentJobId: jobId1 ?? lastPreviewId ?? currentParentJobId ?? null,
        parentJobIds: jobId1 ? [jobId1] : (lastPreviewId ? [lastPreviewId] : []),
      });

      const estimatedTime = imageOptions.quality === "high" ? 60 : 30;
      const startTime = Date.now();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(90, (elapsed / estimatedTime) * 95);
        setCenterView({ type: "generating", progress, message: "Applying 3D model modifications..." });
      }, 200);

      try {
        const is3DModelFile = Boolean(
          file1 && (
            file1.name.toLowerCase().endsWith(".glb") ||
            file1.name.toLowerCase().endsWith(".gltf") ||
            file1.name.toLowerCase().endsWith(".obj") ||
            file1.type.startsWith("model/")
          )
        );

        const is3DUrl = (url: string | null | undefined): boolean => {
          if (!url) {
            return false;
          }
          const clean = url.split("?")[0].toLowerCase();
          return clean.endsWith(".glb") || clean.endsWith(".gltf") || clean.endsWith(".obj") || clean.includes("/glb/");
        };

        const target3DSource: File | string | null = (is3DModelFile && file1)
          ? file1
          : (selected3DJob?.resultGlbUrl || (image1 && is3DUrl(image1) ? image1 : null));

        const multiViewResult = await (async () => {
          if (!target3DSource) {
            return null;
          }
          try {
            return await renderGlbMultiViewSnapshots(target3DSource);
          } catch (renderErr) {
            console.warn("Multi-view 4-screenshot capture failed; attempting single snapshot fallback:", renderErr);
            return null;
          }
        })();

        const multiViewFiles = multiViewResult ? multiViewResult.views.map((v) => v.file) : [];
        const fallbackSingleFile = await (async () => {
          if (multiViewFiles.length > 0) {
            return null;
          }
          if (is3DModelFile && file1) {
            try {
              const snapshot = await renderGlbSnapshot(file1);
              setImage1(snapshot.dataUrl);
              return snapshot.file;
            } catch (singleErr) {
              console.warn("Single snapshot failed:", singleErr);
              return null;
            }
          }
          return file1;
        })();

        const primarySnapshotFile = multiViewResult
          ? multiViewResult.composite.file
          : fallbackSingleFile;

        const filesToSend = multiViewResult
          ? [...multiViewFiles, multiViewResult.composite.file]
          : (fallbackSingleFile ? [fallbackSingleFile] : []);

        const srcUrl = primarySnapshotFile
          ? await uploadSourceImageWithFallback(primarySnapshotFile, tokenGetter)
          : (image1 ?? lastPreviewImageUrl ?? null);
        const editSrcImages = srcUrl ? [srcUrl] : [];

        const result = await editImage(
          effectivePrompt,
          filesToSend.length > 0 ? filesToSend : primarySnapshotFile,
          filesToSend.length > 0 || primarySnapshotFile ? null : (image1 ?? lastPreviewImageUrl),
          tokenGetter,
          {
            workspaceId,
            parentJobId: jobId1 || lastPreviewId || currentParentJobId || null,
            parentJobIds: jobId1 ? [jobId1] : (lastPreviewId ? [lastPreviewId] : []),
            sourceImages: editSrcImages,
          },
          imageOptions
        );

        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }

        const editParent = jobId1 || lastPreviewId || currentParentJobId;
        const editParentIds = editParent ? [editParent] : [];

        setLastPreviewImageUrl(result.image_url);
        setLastPreviewId(result.edit_id);
        setCurrentParentJobId(result.edit_id);
        setLeftLibraryTab("images");
        setCenterView({ type: "preview", imageUrl: result.image_url, previewId: result.edit_id });
        setGeneratingPreview(false);
        mobileGenStartedAtRef.current = null;

        try {
          await registerJobWithPreview(
            result.edit_id,
            result.image_url,
            isEditSection ? editPrompt.trim() : effectivePrompt,
            tokenGetter,
            null,
            "EditImage",
            workspaceId,
            editParent,
            editParentIds,
            editSrcImages
          );
        } catch {
          /* non-critical */
        }
        removePendingJob(pendingEditId);
        refreshLibrary();
        refreshCredits();

        // Chain immediately into 3D model generation
        await start3DFromImage(result.image_url, result.edit_id, null, isEditSection ? editPrompt.trim() : null);
      } catch (err: any) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        if (isPaywallError(err?.message)) {
          track("paywall_hit", { source: "edit_studio", action: "edit_image" });
        }
        const userFacing = err?.message || "Failed to modify 3D model";
        await waitMobileGpuOfflineMinimum(err.message, userFacing);
        mobileGenStartedAtRef.current = null;
        setCenterView({ type: "error", message: userFacing, refunded: true });
        setGeneratingPreview(false);
        removePendingJob(pendingEditId);
        refreshCredits();
        refreshLibrary();
      } finally {
        isSubmittingImageRef.current = false;
      }
      return;
    }

    // ── Prompt to 3D Generation flow: (Model Studio in prompt mode, or Edit Studio with prompt only) ──
    const isModelSection = activeSection === "model";
    const isPromptTo3DFlow =
      (isModelSection && modelInputMode === "prompt" && Boolean(effectivePrompt)) ||
      (isEditSection && Boolean(effectivePrompt) && !file1 && !image1 && !lastPreviewImageUrl);

    if (isPromptTo3DFlow) {
      if (effectivePrompt.length < 2) {
        setError("Prompt is too short. Please provide at least 2 characters.");
        return;
      }
      if (effectivePrompt.length > MAX_PROMPT) {
        setError(`Prompt exceeds maximum supported length of ${MAX_PROMPT} characters.`);
        return;
      }

      isSubmittingImageRef.current = true;
      track(isModelSection ? "model_studio_text_to_3d_started" : "edit_studio_text_to_3d_started", {
        model: selectedModel,
        resolution: effectiveResolution,
        provider: imageOptions.provider,
      });
      setGeneratingPreview(true);
      markMobileGenerationStart();
      setCenterView({ type: "generating", progress: 0, message: "Synthesizing concept art from prompt..." });

      const pendingTextImageId = addPendingJob({
        generateType: "TextToImage",
        prompt: effectivePrompt,
      });

      const estimatedTime = imageOptions.quality === "high" ? 60 : 25;
      const startTime = Date.now();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const progress = Math.min(90, (elapsed / estimatedTime) * 95);
        setCenterView({ type: "generating", progress, message: "Synthesizing concept art from prompt..." });
      }, 200);

      try {
        const result = await generatePreviewImage(effectivePrompt, tokenGetter, { workspaceId }, imageOptions);
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }

        setLastPreviewImageUrl(result.image_url);
        setLastPreviewId(result.preview_id);
        setCurrentParentJobId(result.preview_id);
        
        // Directly transition into 3D generation without showing 2D preview image
        setCenterView({
          type: "generating",
          progress: 10,
          message: "Starting 3D model generation...",
        });
        setGeneratingPreview(false);
        mobileGenStartedAtRef.current = null;

        try {
          await registerJobWithPreview(
            result.preview_id,
            result.image_url,
            effectivePrompt,
            tokenGetter,
            null,
            null,
            workspaceId,
            null
          );
        } catch {
          /* non-critical */
        }
        removePendingJob(pendingTextImageId);
        refreshLibrary();
        refreshCredits();

        // Chain immediately into 3D model generation
        await start3DFromImage(result.image_url, result.preview_id);
      } catch (err: any) {
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }
        if (isPaywallError(err?.message)) {
          track("paywall_hit", { source: isModelSection ? "model_studio" : "edit_studio", action: "generate_image" });
        }
        const userFacing = err?.message || "Failed to generate concept from prompt";
        await waitMobileGpuOfflineMinimum(err.message, userFacing);
        mobileGenStartedAtRef.current = null;
        setCenterView({ type: "error", message: userFacing, refunded: true });
        setGeneratingPreview(false);
        removePendingJob(pendingTextImageId);
        refreshCredits();
        refreshLibrary();
      } finally {
        isSubmittingImageRef.current = false;
      }
      return;
    }

    // ── Direct Image-to-3D: Model Studio flow with image file / reference image ──
    if (!file1 && !image1 && !lastPreviewImageUrl) {
      setError(
        isEditSection
          ? "Please enter a prompt or upload an image"
          : (modelInputMode === "prompt"
            ? "Please enter a prompt to generate 3D"
            : "Please upload or select an image")
      );
      return;
    }

    const parentId = file1 ? null : (jobId1 ?? lastPreviewId);
    const revokeState: { url: string | null } = { url: null };
    const resolveDisplayUrl = (): string => {
      if (file1) {
        if (image1) {
          return image1;
        }
        revokeState.url = URL.createObjectURL(file1);
        return revokeState.url;
      }
      if (image1) {
        return image1;
      }
      return lastPreviewImageUrl!;
    };
    const displayUrl = resolveDisplayUrl();

    try {
      setLastPreviewImageUrl(displayUrl);
      setLastPreviewId(parentId);
      setCenterView({ type: "preview", imageUrl: displayUrl, previewId: parentId || undefined });
      await start3DFromImage(displayUrl, parentId, file1);
    } finally {
      if (revokeState.url) {
        URL.revokeObjectURL(revokeState.url);
      }
    }
  };

  // ──────────── Generation Info helpers ────────────
  const loadJobInfo = useCallback(async (job: BackendJob) => {
    setSelectedJobInfo(job);
    if (isWaterJobFn(job)) {
      try {
        const cs = await fetchWaterJob(job.id, async () => (await getToken()) ?? null);
        setSelectedJobInfo((prev) =>
          prev && prev.id === job.id
            ? {
                ...prev,
                durationMs: cs.durationMs ?? prev.durationMs,
                visualEvidence: cs.visualEvidence ?? prev.visualEvidence,
                hasFactoryCode: Boolean(cs.factoryCode) || prev.hasFactoryCode,
              }
            : prev
        );
        if (cs.scene) setWaterScene(cs.scene);
      } catch {
        /* Details still shows the library row */
      }
    }
  }, [getToken, isWaterJobFn]);

  const handleSelect3DModelForEdit = useCallback(
    (job: BackendJob) => {
      const thumb = job.previewImageUrl || job.imageUrl;
      if (thumb) {
        setImage1(thumb);
        setLastPreviewImageUrl(thumb);
      }
      setFile1(null);
      setJobId1(job.id);
      setLastPreviewId(job.id);
      setCurrentParentJobId(job.id);
      if (job.resultGlbUrl) {
        const proxyGlb = getProxyGlbUrl(job.id);
        setCenterView({ type: "3d", glbUrl: proxyGlb, jobId: job.id });
        void captureMultiViewSnapshots(proxyGlb);
      } else if (thumb) {
        setCenterView({ type: "preview", imageUrl: thumb, previewId: job.id });
        setMultiViewPreviews([]);
        cachedMultiViewFilesRef.current = null;
      }
      loadJobInfo(job);
    },
    [setImage1, setFile1, setJobId1, setLastPreviewId, setLastPreviewImageUrl, setCurrentParentJobId, loadJobInfo, captureMultiViewSnapshots]
  );

  const handleSelectWorkspaceImage = useCallback(
    (job: BackendJob) => {
      const img = job.previewImageUrl || job.imageUrl;
      if (!img) {
        return;
      }
      setImage1(img);
      setLastPreviewImageUrl(img);
      setFile1(null);
      setJobId1(job.id);
      setLastPreviewId(job.id);
      setCurrentParentJobId(job.id);
      setMultiViewPreviews([]);
      cachedMultiViewFilesRef.current = null;
      setIsRenderingMultiView(false);
      setCenterView({ type: "preview", imageUrl: img, previewId: job.id });
      loadJobInfo(job);
    },
    [setImage1, setFile1, setJobId1, setLastPreviewId, setLastPreviewImageUrl, setCurrentParentJobId, loadJobInfo]
  );

  const selected3DJob = useMemo(() => {
    if (jobId1) {
      return library3DAssets.find((j) => {
        return j.id === jobId1;
      }) ?? null;
    }
    return null;
  }, [jobId1, library3DAssets]);

  // ──────────── Library click handlers ────────────
  const handleImageClick = (job: BackendJob) => {
    if (job.status === "FAIL") {
      setLeftLibraryTab("images");
      refreshCredits();
      setCenterView({
        type: "error",
        message: toUserFacingGpuError(job.errorMessage),
        refunded: true,
      });
      loadJobInfo(job);
      return;
    }

    if (job.id.startsWith("pending-")) {
      setCenterView({
        type: "generating",
        progress: 10,
        message: job.generateType === "EditImage" ? "Editing base image..." : "Generating concept art...",
      });
      loadJobInfo(job);
      return;
    }

    const imageUrl = job.previewImageUrl || job.imageUrl;
    if (!imageUrl) {
      return;
    }

    // If this job is queued/running for 3D generation, restore generating state in center.
    if ((job.status === "RUN" || job.status === "WAIT") && !job.resultGlbUrl && is3DGenerationType(job.generateType)) {
      setLeftLibraryTab("3d"); // Switch to 3D tab when viewing a job that is generating 3D
      setCurrentGenerating({
        jobId: job.id,
        status: "generating",
        progress: 0,
        estimatedTotalSeconds: 840,
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
    void requestNotificationPermission();

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
          const maxAttempts = Math.ceil(WATER_POLL_MAX_MS / WATER_POLL_INTERVAL_MS);
          for (let i = 0; i < maxAttempts; i++) {
            if (pollGen !== waterPollGenRef.current) return;
            await new Promise((r) => setTimeout(r, WATER_POLL_INTERVAL_MS));
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
                    ? {
                        ...prev,
                        status: "DONE",
                        sculptPass: cs.sculptPass,
                        hasFactoryCode: true,
                        durationMs: cs.durationMs,
                        visualEvidence: cs.visualEvidence,
                      }
                    : prev
                );
                setLibrary3DAssets((prev) =>
                  prev.map((j) =>
                    j.id === job.id
                      ? {
                          ...j,
                          status: "DONE" as const,
                          hasFactoryCode: true,
                          sculptPass: cs.sculptPass,
                          durationMs: cs.durationMs,
                          visualEvidence: cs.visualEvidence,
                        }
                      : j
                  )
                );
                notifyGenerationComplete({
                  type: "3d",
                  prompt: job.prompt || null,
                });
                return;
              }
              if (cs.status === "FAIL") {
                setCurrentGenerating(null);
                setLoading(false);
                setCenterView({ type: "error", message: cs.errorMessage || "Water failed" });
                setSelectedJobInfo((prev) =>
                  prev && prev.id === job.id
                    ? { ...prev, status: "FAIL", durationMs: cs.durationMs }
                    : prev
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
            message:
              "Water is still running longer than expected. Open the job again from the library to resume live status.",
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
        void (async () => {
          try {
            const cs = await fetchWaterJob(job.id, async () => (await getToken()) ?? null);
            if (cs.sculptPass) setCodeSculptPass(cs.sculptPass);
          } catch {
            /* ignore */
          }
        })();
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

    if (job.id.startsWith("pending-")) {
      setLeftLibraryTab("3d");
      setCenterView({
        type: "generating",
        progress: 10,
        message: "Generating 3D model...",
      });
      loadJobInfo(job);
      return;
    }

    if ((job.status === "RUN" || job.status === "WAIT") && !job.resultGlbUrl) {
      setLeftLibraryTab("3d");
      setCurrentGenerating({
        jobId: job.id,
        status: "generating",
        progress: 0,
        estimatedTotalSeconds: 840,
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

    if (job.status === "FAIL") {
      setLeftLibraryTab("3d");
      refreshCredits();
      setCenterView({
        type: "error",
        message: toUserFacingGpuError(job.errorMessage),
        refunded: true,
      });
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

  /** Set Water Edit parent from library drag/click — opens 3D in center + updates right-panel thumb. */
  const applyWaterEditParent = useCallback(
    (job: BackendJob) => {
      if (!isWaterJobFn(job) && !isWaterJobId(job.id)) {
        setError("Drop a Water model to edit");
        return;
      }
      setWaterEditTargetJobId(job.id);
      setError(null);
      setInputMode("text_1img");
      handle3DClick(job);
    },
    [isWaterJobFn, handle3DClick]
  );

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

  const handleSelectModel = (id: ModelId, option: CatalogModel) => {
    setSelectedModel(id);
    if (option.provider !== "hydrilla") {
      void (async () => {
        try {
          const tokenGetter = async () => (await getToken()) ?? null;
          await saveUserModelPrefs({ defaultCodeModel: id }, tokenGetter);
        } catch {
          /* session selection still works */
        }
      })();
    }
  };

  // Agent runs only on Water (bring-your-own-key) models; Image and Model run only on Cloud.
  useEffect(() => {
    if (activeSection === "agent") {
      if (selectedIsCode) {
        return;
      }
      const usable = (m: CatalogModel) => providerKeyOk(m.provider);
      const water =
        waterPickerModels.find((m) => m.id === preferredWaterModelId && usable(m)) ||
        waterPickerModels.find((m) => enabledWaterIds.includes(m.id) && usable(m)) ||
        waterPickerModels.find(usable);
      if (water) {
        setSelectedModel(water.id);
      }
      return;
    }
    if (selectedIsCode) {
      const cloud = MODEL_CATALOG.find((m) => m.provider === "hydrilla" && !m.comingSoon);
      if (cloud) {
        setSelectedModel(cloud.id);
      }
    }
  }, [
    activeSection,
    selectedIsCode,
    waterPickerModels,
    enabledWaterIds,
    preferredWaterModelId,
    providerKeyOk,
  ]);

  const handleSelectSection = useCallback(
    (section: WorkspaceSection) => {
      setActiveSection(section);
      try {
        window.localStorage.setItem("hydrilla_workspace_section", section);
      } catch {
        /* ignore */
      }
      if (section === "agent") {
        setInputMode("text");
      } else if (section === "image") {
        setInputMode(isImageEditMode ? "text_1img" : "text");
      } else if (section === "edit") {
        setInputMode("text_1img");
      } else {
        setInputMode("image");
      }
    },
    [isImageEditMode]
  );

  const handleAgentGenerate = () => {
    const text = agentPrompt.trim();
    if (!text) {
      return;
    }
    void runWater({ promptOverride: text });
    if (hasWorkspaceContext) {
      promptHistory.record(text, "water");
      setAgentPrompt("");
    }
  };

  const handleImageGenerate = () => {
    if (isSubmittingImageRef.current || isGenerating) {
      return;
    }
    const text = prompt.trim();
    if (!text) {
      setError("Please enter a prompt");
      return;
    }
    if (text.length < 2) {
      setError("Prompt is too short. Please provide at least 2 characters.");
      return;
    }
    void handleGenerateImage(false);
    if (hasWorkspaceContext) {
      promptHistory.record(text, "cloud");
    }
  };

  const isGenerating = loading || generatingPreview || (currentGenerating?.status === "generating");
  const waterEditParentId = resolveWaterEditParentId();
  const waterEditParentJob =
    (waterEditParentId && library3DAssets.find((j) => j.id === waterEditParentId)) ||
    (waterEditParentId && selectedJobInfo?.id === waterEditParentId ? selectedJobInfo : null) ||
    null;
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
      <div className="flex h-screen items-center justify-center bg-white">
        <StudioOrb state="connecting" size={64} />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-white text-neutral-950 font-dm-sans">
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

      {/* Compact-only: top bar — back + name + section pills + tools (phones + tablets) */}
      <header className="lg:hidden flex items-center justify-between gap-2 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2.5 border-b border-neutral-200 bg-white shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Link
            href="/"
            className="flex items-center gap-1.5 hover:opacity-80 transition-opacity shrink-0"
            aria-label="Hydrilla"
          >
            <div className="relative w-6 h-6 shrink-0 logo-spin-hover">
              <Image src="/hyd01.png" alt="Hydrilla" fill className="object-contain" priority sizes="24px" />
            </div>
            <span className="font-dm-sans text-xs font-semibold tracking-tight text-neutral-900 hidden sm:inline">
              Hydrilla
            </span>
          </Link>
          <div className="min-w-0 hidden sm:block pl-1.5 border-l border-neutral-200">
            <p className="text-[12px] font-medium tracking-tight text-neutral-500 truncate" title={workspaceName.trim() ? workspaceName : "Workspace"}>
              {workspaceName.trim() ? workspaceName : "Workspace"}
            </p>
          </div>
        </div>

        {/* 4 Section switcher pills for mobile */}
        <div className="flex items-center rounded-full bg-neutral-100 p-0.5 text-[11px] border border-neutral-200/80">
          <button
            type="button"
            onClick={() => handleSelectSection("agent")}
            className={cn(
              "rounded-full px-2.5 py-1 font-medium transition-colors",
              activeSection === "agent" ? "bg-neutral-900 text-white font-semibold shadow-xs" : "text-neutral-500 hover:text-neutral-900"
            )}
          >
            Agent
          </button>
          <button
            type="button"
            onClick={() => handleSelectSection("image")}
            className={cn(
              "rounded-full px-2.5 py-1 font-medium transition-colors",
              activeSection === "image" ? "bg-neutral-900 text-white font-semibold shadow-xs" : "text-neutral-500 hover:text-neutral-900"
            )}
          >
            Image
          </button>
          <button
            type="button"
            onClick={() => handleSelectSection("model")}
            className={cn(
              "rounded-full px-2.5 py-1 font-medium transition-colors",
              activeSection === "model" ? "bg-neutral-900 text-white font-semibold shadow-xs" : "text-neutral-500 hover:text-neutral-900"
            )}
          >
            Model
          </button>
          <button
            type="button"
            onClick={() => handleSelectSection("edit")}
            className={cn(
              "rounded-full px-2.5 py-1 font-medium transition-colors",
              activeSection === "edit" ? "bg-neutral-900 text-white font-semibold shadow-xs" : "text-neutral-500 hover:text-neutral-900"
            )}
          >
            Edit
          </button>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="hidden min-[400px]:flex items-center gap-1.5 px-2 py-1 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-800" title="Credits remaining">
            <span className="text-[11px] font-semibold tabular-nums">{creditsLoading ? "…" : Math.max(0, creditsTotal - creditsUsed)}</span>
            <span className="text-[9px] uppercase text-neutral-400">cr</span>
          </div>
          <Link
            href="/generations"
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-500 hover:text-neutral-800 transition-colors shrink-0"
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
          className="lg:hidden fixed inset-x-0 z-[35] flex items-center justify-center px-4 pointer-events-none"
          style={{
            top: "calc(3.75rem + env(safe-area-inset-top, 0px))",
            bottom: "calc(5rem + env(safe-area-inset-bottom, 0px))",
          }}
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="flex flex-col items-center justify-center gap-5 px-8 py-10 mx-auto">
            <StudioOrb state="weaving" size={64} />
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
        {/* 1. Left Icon Rail (Desktop only) */}
        <WorkspaceRail
          activeSection={activeSection}
          onSelectSection={handleSelectSection}
          creditsTotal={creditsTotal}
          creditsUsed={creditsUsed}
          creditsLoading={creditsLoading}
          clientMounted={clientMounted}
          className="max-lg:hidden"
        />

        {/* 2. Left Active Section Panel (Agent / Image / Model) */}
        <div
          style={{ width: isCompact ? "100%" : leftPanelWidth }}
          className={cn(
            "relative shrink-0 flex flex-col h-full overflow-hidden bg-white z-10",
            isCompact && mobileTab !== "create" && "max-lg:hidden"
          )}
        >
          {error ? (
            <div className="flex shrink-0 items-start gap-2 border-b border-red-100 bg-red-50 px-4 py-2.5 text-[12px] leading-5 text-red-700">
              <span className="min-w-0 flex-1">{error}</span>
              <button
                type="button"
                onClick={() => setError(null)}
                className="shrink-0 font-medium text-red-500 hover:text-red-700"
                aria-label="Dismiss error"
              >
                Dismiss
              </button>
            </div>
          ) : null}

          {activeSection === "agent" && (
            <AgentPanel
              prompt={agentPrompt}
              onPromptChange={setAgentPrompt}
              selectedModel={selectedModel}
              selectedLabel={
                selectedIsCode ? selectedCatalog?.label ?? selectedModel : "Select a model"
              }
              waterPickerModels={waterPickerModels}
              enabledWaterIds={enabledWaterIds}
              providerKeyOk={providerKeyOk}
              onSelectModel={handleSelectModel}
              qualityTier={waterQualityTier}
              onQualityTierChange={(tier) => {
                setWaterQualityTier(tier);
                try {
                  window.localStorage.setItem(WATER_TIER_STORAGE_KEY, tier);
                } catch {
                  /* ignore */
                }
              }}
              skillId={waterSkill}
              onSkillChange={(skill) => {
                setWaterSkill(skill);
                try {
                  window.localStorage.setItem(WATER_SKILL_STORAGE_KEY, skill);
                } catch {
                  /* ignore */
                }
              }}
              promptHistory={promptHistory.entries}
              onSelectHistory={(item) => setAgentPrompt(item)}
              onClearHistory={promptHistory.clear}
              onGenerate={handleAgentGenerate}
              generating={isGenerating}
              disabled={isGenerating}
              activeWaterJobId={activeWaterJobId}
              waterThreadJobs={waterThreadJobs}
              getToken={async () => await getToken()}
              onWaterRefine={(refinePrompt) => {
                void runWater({ promptOverride: refinePrompt, parentId: activeWaterJobId });
              }}
            />
          )}

          {activeSection === "image" && (
            <ImagePanel
              prompt={prompt}
              onPromptChange={setPrompt}
              isEditMode={isImageEditMode}
              onToggleEditMode={(edit) => {
                setIsImageEditMode(edit);
                setInputMode(edit ? "text_1img" : "text");
              }}
              editAvailable={editAvailable}
              imageOptions={imageOptions}
              onImageOptionsChange={handleImageOptionsChange}
              imageProviders={imageProviders}
              image={image1}
              isDragging={isDragging}
              onImageDrop={handleDrop}
              onImagePaste={handlePaste}
              onImageFileSelect={handleFileSelect}
              onImageClear={handleClearImage}
              onDragOver={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
              promptHistory={promptHistory.entries}
              onSelectHistory={(item) => setPrompt(item)}
              onClearHistory={promptHistory.clear}
              onGenerate={handleImageGenerate}
              generating={isGenerating}
              disabled={isGenerating}
              onSwitchToModel={() => {
                if (centerView.type === "preview" && centerView.imageUrl) {
                  setImage1(centerView.imageUrl);
                }
                handleSelectSection("model");
              }}
            />
          )}

          {activeSection === "model" && (
            <ModelPanel
              prompt={prompt}
              onPromptChange={setPrompt}
              promptHistory={promptHistory.entries}
              onSelectHistory={(item) => setPrompt(item)}
              onClearHistory={promptHistory.clear}
              inputMode={modelInputMode}
              onInputModeChange={setModelInputMode}
              image={image1}
              libraryImages={libraryImages}
              onSelectImage={handleSelectWorkspaceImage}
              isDragging={isDragging}
              onImageDrop={handleDrop}
              onImagePaste={handlePaste}
              onImageFileSelect={handleFileSelect}
              onImageClear={handleClearImage}
              onDragOver={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
              selectedModel={selectedModel}
              selectedLabel={selectedCatalog?.label ?? selectedModel}
              waterPickerModels={waterPickerModels}
              enabledWaterIds={enabledWaterIds}
              providerKeyOk={providerKeyOk}
              onSelectModel={handleSelectModel}
              resolution={modelResolution}
              onResolutionChange={setModelResolution}
              onGenerate={handleGenerate3D}
              generating={isGenerating}
              disabled={isGenerating}
              onSwitchToImage={() => handleSelectSection("image")}
              onSwitchToEdit={() => handleSelectSection("edit")}
            />
          )}

          {activeSection === "edit" && (
            <EditPanel
              prompt={editPrompt}
              onPromptChange={setEditPrompt}
              image={image1}
              file={file1}
              jobId={jobId1}
              selected3DJob={selected3DJob}
              library3DAssets={library3DAssets}
              libraryImages={libraryImages}
              onSelect3DModel={handleSelect3DModelForEdit}
              onSelectImage={handleSelectWorkspaceImage}
              isDragging={isDragging}
              onImageDrop={handleDrop}
              onImagePaste={handlePaste}
              onImageFileSelect={handleFileSelect}
              onImageClear={handleClearImage}
              multiViewPreviews={multiViewPreviews}
              isRenderingMultiView={isRenderingMultiView}
              onDragOver={() => {
                setIsDragging(true);
              }}
              onDragLeave={() => {
                setIsDragging(false);
              }}
              selectedModel={selectedModel}
              selectedLabel={selectedCatalog?.label ?? selectedModel}
              waterPickerModels={waterPickerModels}
              enabledWaterIds={enabledWaterIds}
              providerKeyOk={providerKeyOk}
              onSelectModel={handleSelectModel}
              resolution={editResolution}
              onResolutionChange={setEditResolution}
              onGenerate={handleGenerate3D}
              generating={isGenerating}
              disabled={isGenerating}
              onSwitchToModel={() => {
                handleSelectSection("model");
              }}
            />
          )}

          {/* Left panel resize drag handle (desktop only) */}
          <div
            onMouseDown={(e) => {
              e.preventDefault();
              resizeStartRef.current = { x: e.clientX, leftW: leftPanelWidth };
              setResizingLeft(true);
            }}
            className={cn(
              "hidden lg:block absolute top-0 bottom-0 right-0 w-1 cursor-col-resize hover:bg-neutral-300 transition-colors z-20",
              resizingLeft && "bg-neutral-400"
            )}
          />
        </div>

        {/* Center - Preview / 3D / generating; on mobile: visible only when Canvas tab */}
        <main className={cn("relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white", mobileTab === "canvas" ? "max-lg:flex" : "max-lg:hidden")}>
          {(centerView.type === "3d" || centerView.type === "code") && (
            <div
              className="pointer-events-none absolute top-4 z-[25] hidden items-center justify-center lg:flex left-0 right-0"
            >
              <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-neutral-200/70 bg-white px-1.5 py-1 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.18)]">
                {centerView.type === "3d" ? (
                  <>
                    <button
                      type="button"
                      title={look.grid ? "Hide grid" : "Show grid"}
                      aria-label="Grid"
                      onClick={() => updateLook({ grid: !look.grid })}
                      className={cn("flex h-8 w-8 items-center justify-center rounded-full", look.grid ? "bg-neutral-950 text-white" : "text-neutral-500 hover:bg-neutral-100")}
                    >
                      <Grid3x3 className="h-4 w-4" strokeWidth={1.85} />
                    </button>
                    <button
                      type="button"
                      title={look.autoRotate ? "Pause rotation" : "Auto rotate"}
                      aria-label="Auto rotate"
                      onClick={() => updateLook({ autoRotate: !look.autoRotate })}
                      className={cn("flex h-8 w-8 items-center justify-center rounded-full", look.autoRotate ? "bg-neutral-950 text-white" : "text-neutral-500 hover:bg-neutral-100")}
                    >
                      <RotateCw className="h-4 w-4" strokeWidth={1.85} />
                    </button>
                    <button
                      type="button"
                      title={look.wireframe ? "Wireframe on" : "Wireframe"}
                      aria-label="Wireframe"
                      onClick={() => updateLook({ wireframe: !look.wireframe })}
                      className={cn("flex h-8 w-8 items-center justify-center rounded-full", look.wireframe ? "bg-neutral-950 text-white" : "text-neutral-500 hover:bg-neutral-100")}
                    >
                      <Box className="h-4 w-4" strokeWidth={1.85} />
                    </button>
                    <span className="mx-1 h-4 w-px bg-neutral-200" />
                    <button
                      type="button"
                      title="Export GLB"
                      aria-label="Export GLB"
                      onClick={() => {
                        track("model_downloaded", { format: "glb" });
                        void downloadGlbWithAuth(
                          centerView.glbUrl,
                          `hydrilla-${centerView.jobId || "model"}.glb`,
                          async () => (await getToken()) ?? null
                        ).catch((err) => {
                          console.error(err);
                          alert(err instanceof Error ? err.message : "Failed to download model");
                        });
                      }}
                      className="inline-flex h-8 items-center gap-1.5 rounded-full bg-neutral-950 px-3 text-[12px] font-semibold text-white hover:bg-neutral-800"
                    >
                      <Download className="h-3.5 w-3.5" strokeWidth={2} />
                      Export
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    title="Export GLB"
                    aria-label="Export GLB"
                    onClick={() => {
                      void waterViewerRef.current?.exportFormat("glb").then((result) => {
                        if (result?.ok) track("model_downloaded", { format: "glb", engine: "water" });
                      });
                    }}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-neutral-950 px-3 text-[12px] font-semibold text-white hover:bg-neutral-800"
                  >
                    <Download className="h-3.5 w-3.5" strokeWidth={2} />
                    Export
                  </button>
                )}
                <button
                  type="button"
                  title={fullView ? "Exit full view" : "Full view"}
                  aria-label={fullView ? "Exit full view" : "Full view"}
                  onClick={() => {
                    if (fullView) {
                      setFullView(false);
                      setLeftPanelOpen(true);
                      setRightPanelOpen(true);
                    } else {
                      setFullView(true);
                      setLeftPanelOpen(false);
                      setRightPanelOpen(false);
                    }
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100"
                >
                  {fullView ? <Minimize2 className="h-4 w-4" strokeWidth={1.85} /> : <Maximize2 className="h-4 w-4" strokeWidth={1.85} />}
                </button>
              </div>
            </div>
          )}
          <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {centerView.type === "empty" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-[20px] border border-neutral-200/80 bg-white text-neutral-400 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-16px_rgba(0,0,0,0.12)]">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              </div>
              <h2 className="mb-2 text-[26px] font-semibold tracking-[-0.03em] text-neutral-900">
                {selectedIsCode ? "Build one great asset" : "What will you create today?"}
              </h2>
              <p className="mb-6 max-w-sm text-sm leading-6 text-neutral-500">
                {selectedIsCode
                  ? "Describe it in the composer below. Water builds the parts in sequence, then gives you direct control."
                  : "Describe it in the composer below, or choose an image from your library to edit or turn into 3D."}
              </p>
              <Button
                type="button"
                onClick={() => {
                  setFullView(false);
                  setMobileTab("canvas");
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

          {centerView.type === "preview" && (
            <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 flex items-center justify-center p-5 bg-white">
                <div className="relative w-full max-w-full h-full max-h-full rounded-[24px] overflow-hidden border border-neutral-200/70 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.14)] bg-white flex items-center justify-center">
                  <img src={displayImageUrl(centerView.imageUrl)} alt="Preview" className="max-w-full max-h-full w-auto h-auto object-contain" />
                </div>
              </div>
              <div className="flex items-center justify-center gap-3 p-3.5 border-t border-neutral-200/60 bg-white/90 backdrop-blur-xl">
                {showGenerate3DButton ? (
                  <Button
                    type="button"
                    onClick={() => {
                      if (centerView.imageUrl) {
                        setImage1(centerView.imageUrl);
                      }
                      handleSelectSection("model");
                      void handleGenerate3D();
                    }}
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

          {centerView.type === "generating" && <div className="flex-1 min-h-0 bg-white" />}

          {(centerView.type === "generating" ||
            (centerView.type === "preview" &&
              currentGenerating?.status === "generating" &&
              centerView.previewId === currentGenerating.jobId)) && (
            <div className="pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center">
              <StudioOrb state="weaving" size={64} />
              <p className="mt-5 max-w-sm text-center text-[15px] font-medium tracking-tight text-neutral-800">
                {centerView.type === "generating" ? centerView.message : "Generating 3D model…"}
              </p>
                  {(currentGenerating?.jobId?.startsWith("wt_") ||
                    currentGenerating?.jobId?.startsWith("cs_") ||
                    selectedIsCode) && (
                    <WaterPassRail
                      tier={waterQualityTier}
                      pass={codeSculptPass}
                      className="mt-5 justify-center"
                    />
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
                  <div className="mt-6 w-48 space-y-2">
                    <Progress
                      className="h-1 w-full"
                      value={
                        centerView.type === "generating"
                          ? centerView.progress
                          : currentGenerating?.progress ?? 0
                      }
                    />
                    <p className="text-center text-[12px] tabular-nums text-neutral-400">
                      {Math.round(
                        centerView.type === "generating"
                          ? centerView.progress
                          : currentGenerating?.progress ?? 0
                      )}
                      %
                    </p>
                  </div>
                  {currentGenerating?.jobId && (
                    <button
                      type="button"
                      onClick={async () => {
                        if (!currentGenerating?.jobId) {
                          return;
                        }
                        const jobId = currentGenerating.jobId;
                        try {
                          waterPollGenRef.current += 1;
                          await cancelJob(jobId, () => getToken());
                          if (progressIntervalRef.current) {
                            clearInterval(progressIntervalRef.current);
                            progressIntervalRef.current = null;
                          }
                          setCurrentGenerating(null);
                          setLoading(false);
                          refreshCredits();
                          refreshLibrary();
                          setCenterView({
                            type: "error",
                            message: "Job cancelled. Your credits have been automatically refunded.",
                            refunded: true,
                          });
                        } catch (e: any) {
                          setCenterView({
                            type: "error",
                            message: toUserFacingGpuError(e?.message || "Failed to cancel"),
                            refunded: true,
                          });
                        }
                      }}
                      className="pointer-events-auto mt-6 h-9 px-4 text-sm font-medium text-neutral-500 hover:text-neutral-800"
                    >
                      Cancel
                    </button>
                  )}
            </div>
          )}

          {centerView.type === "code" && (
            <div
              className={cn(
                "flex-1 flex flex-col min-h-0 max-lg:min-h-[50vh] relative",
                waterDropHighlight && "ring-2 ring-sky-400/70 ring-inset"
              )}
              onDragOver={(e) => {
                if (![...e.dataTransfer.types].includes("application/job-id")) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
                setWaterDropHighlight(true);
              }}
              onDragLeave={() => setWaterDropHighlight(false)}
              onDrop={(e) => {
                e.preventDefault();
                setWaterDropHighlight(false);
                const droppedId = e.dataTransfer.getData("application/job-id");
                if (!droppedId) return;
                const target = library3DAssets.find((j) => j.id === droppedId);
                if (!target) {
                  setError("Drop a Water asset from the library");
                  return;
                }
                handle3DClick(target);
              }}
            >
              <WaterViewer
                ref={waterViewerRef}
                factoryCode={centerView.factoryCode || codeFactoryCode}
                jobId={centerView.jobId}
                className="flex-1 min-h-0"
                hideToolbar
                badgeLeft={isCompact ? 12 : leftPanelOpen ? leftPanelWidth + 32 : 16}
                instance={waterSceneForJob?.instance ?? null}
                look={look}
                partMaterials={effectiveParts}
                onParts={handleViewerParts}
                selectedPart={selectedPart}
                onPick={setSelectedPart}
                onInstanceTransform={(t) => {
                  const jobId = centerView.type === "code" ? centerView.jobId : null;
                  if (!jobId) return;
                  void patchWaterScene({
                    jobId,
                    op: "move",
                    position: t.position,
                    rotation: t.rotation,
                    scale: t.scale,
                    getToken: async () => (await getToken()) ?? null,
                  }).then((scene) => {
                    if (scene) setWaterScene(scene);
                  }).catch(() => undefined);
                }}
                onDownloaded={(format) => track("model_downloaded", { format, engine: "water" })}
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
                  look={look}
                  partMaterials={effectiveParts}
                  onParts={handleViewerParts}
                  selectedPart={selectedPart}
                  onPick={setSelectedPart}
                  onModelStats={setActiveModelStats}
                />
                </div>
              </div>
            </div>
          )}

          {centerView.type === "error" && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-full max-w-md rounded-[28px] border border-neutral-200/80 bg-white px-8 py-9 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_40px_-16px_rgba(0,0,0,0.12)]">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-50 flex items-center justify-center">
                  <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-neutral-900 mb-1.5">
                  Generation Unsuccessful
                </h3>
                <p className="text-xs text-neutral-600 mb-4 leading-relaxed max-w-sm mx-auto">
                  {toUserFacingGpuError(centerView.message)}
                </p>

                {/* Prominent Automatic Refund Banner */}
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-neutral-200/90 bg-neutral-50/90 p-3.5 text-left text-xs text-neutral-900 shadow-xs">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white text-[11px] font-bold">
                    ✓
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-950">Credits Automatically Refunded</p>
                    <p className="mt-0.5 text-neutral-600 leading-normal">
                      We didn&apos;t charge your balance for this generation. Your credits are intact so you can retry right away.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setCenterView({ type: "empty" });
                    }}
                    className="h-10 px-6 text-sm font-medium bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition-colors shadow-xs active:scale-[0.98]"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}

          </div>
        </main>

        {/* Toggle button to reopen Gallery panel when collapsed on desktop */}
        <button
          type="button"
          onClick={() => setRightPanelOpen(true)}
          className={cn(
            "absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-2xl border border-neutral-200/60 bg-white px-2.5 py-4 text-neutral-700 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.14)] transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-neutral-50 active:scale-[0.98] lg:flex",
            rightPanelOpen
              ? "pointer-events-none translate-x-2 opacity-0"
              : "pointer-events-auto translate-x-0 opacity-100"
          )}
          title="Open generations gallery"
          aria-label="Open generations gallery"
          tabIndex={rightPanelOpen ? -1 : 0}
        >
          <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500">Gallery</span>
        </button>

        {/* Right Gallery & Inspector Panel */}
        <GalleryPanel
          workspaceName={workspaceName}
          onWorkspaceNameChange={handleWorkspaceNameChange}
          activeSection={activeSection}
          images={mergedLibraryImages}
          assets3D={mergedLibrary3DAssets}
          loading={libraryLoading}
          onImageClick={handleImageClick}
          on3DClick={handle3DClick}
          isWaterJobFn={isWaterJobFn}
          isOpen={rightPanelOpen}
          onClose={() => setRightPanelOpen(false)}
          inspectorKind={
            centerView.type === "3d" || centerView.type === "code"
              ? centerView.type
              : centerView.type === "preview"
                ? "preview"
                : "empty"
          }
          inspectorAssetKey={viewerAssetKey}
          parts={Object.keys(authoredParts)}
          selectedPart={selectedPart}
          onSelectPart={setSelectedPart}
          look={look}
          onLookChange={updateLook}
          partMaterial={selectedPartMaterial}
          onPartMaterial={handlePartMaterial}
          onUploadFile={handleFileSelect}
          modelStats={activeModelStats}
          className={cn(
            "max-lg:hidden",
            !rightPanelOpen && "hidden"
          )}
        />
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
            Scene
          </Button>
        </div>
      </nav>
    </div>
  );
}
