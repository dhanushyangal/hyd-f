"use client";

import dynamic from "next/dynamic";
import { Suspense, useState, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
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
import { ChatComponent } from "../../components/workspace/ChatComponent";
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
  combinedEdit,
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
  canCombine,
  onFeaturesChange,
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
import {
  WATER_TIER_STORAGE_KEY,
  parseQualityTier,
  waterPassLabel,
  type QualityTier,
} from "../../lib/waterSkills";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://hydrilla-backend.vercel.app";
const CREDITS_IMAGE = 2;
const CREDITS_3D = 10;
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
  if (/fetch failed|failed to fetch|networkerror|ECONNREFUSED|External service unavailable|GPU is unavailable/i.test(msg))
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

  // GPU features — Edit & Combine only when high-mode features.edit_image / combined_edit.
  // Initialize optimistic so SSR/client first paint match; updated after mount from /api/3d/health.
  const [editAvailable, setEditAvailable] = useState(false);
  const [combineAvailable, setCombineAvailable] = useState(false);
  useEffect(() => {
    setEditAvailable(canEdit());
    setCombineAvailable(canCombine());
    return onFeaturesChange((state) => {
      setEditAvailable(!!state.features.edit_image);
      setCombineAvailable(!!state.features.combined_edit);
    });
  }, []);

  // When features drop to low, force back to "text" if on Combine.
  // Cloud Edit snap (text_1img) is handled with Water awareness below.
  useEffect(() => {
    if (!combineAvailable && inputMode === "text_2img") setInputMode("text");
  }, [combineAvailable, inputMode]);
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
  useEffect(() => {
    setClientMounted(true);
    try {
      const saved = window.localStorage.getItem(WATER_TIER_STORAGE_KEY);
      if (saved) setWaterQualityTier(parseQualityTier(saved));
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

  // Water: Text + Edit only. Snap away from cloud Image/Combine modes.
  // Cloud: snap Edit off when GPU edit is unavailable.
  useEffect(() => {
    if (selectedIsCode) {
      if (inputMode === "image" || inputMode === "text_2img") {
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
        // Prefer saved Water default when user already configured BYOK
        const preferred = migrateCodeModelId(data.prefs?.defaultCodeModel);
        if (preferred && isCodeModel(preferred)) {
          const provider = providerForModelId(preferred);
          const keyOk =
            !provider ||
            provider === "hydrilla" ||
            providerKeyAvailable(provider, data.keys, data.sharedKeys ?? []);
          if (keyOk) setSelectedModel(preferred as ModelId);
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

  const activeWaterJobId = centerView.type === "code" ? centerView.jobId : null;
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
  const [numGenerations, setNumGenerations] = useState(1);


  const historyJobs = useMemo(() => [...libraryImages, ...library3DAssets], [libraryImages, library3DAssets]);
  const promptHistory = usePromptHistory(workspaceId, historyJobs);

  useEffect(() => {
    if (isSignedIn && workspaceId) refreshCredits();
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
        const status = await fetchStatus(currentGenerating.jobId, async () => (await getToken()) ?? null);
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
          const estimatedTotal = currentGenerating.estimatedTotalSeconds || 300;
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
    async (options: {
      referenceImageUrl?: string | null;
      parentId?: string | null;
      promptOverride?: string | null;
    } = {}) => {
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
        const newJob = { id: result.preview_id, previewImageUrl: result.image_url, prompt: prompt.trim(), status: "DONE" as const, generateType: "TextToImage", createdAt: new Date().toISOString(), userId: null, imageUrl: null, resultGlbUrl: null, errorMessage: null, updatedAt: new Date().toISOString() } satisfies BackendJob;
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
        const editedJob = { id: result.edit_id, previewImageUrl: result.image_url, prompt: prompt.trim(), status: "DONE" as const, generateType: "EditImage", parentJobId: editParent, parentJobIds: editParentIds, sourceImages: editSrcImages, createdAt: new Date().toISOString(), userId: null, imageUrl: null, resultGlbUrl: null, errorMessage: null, updatedAt: new Date().toISOString() } satisfies BackendJob;
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
        resultGlbUrl: null,
        previewImageUrl: image1 ?? image2 ?? null,
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
          createdAt: new Date().toISOString(), userId: null, imageUrl: null, resultGlbUrl: null, errorMessage: null, updatedAt: new Date().toISOString(),
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
      await runWaterFromPanel();
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

  const handleSelectInputMode = (mode: InputMode) => {
    if (mode === "text") {
      setInputMode("text");
      return;
    }
    if (mode === "image") {
      if (selectedIsCode) return;
      setInputMode("image");
      return;
    }
    if (mode === "text_2img") {
      if (selectedIsCode || !combineAvailable) return;
      setInputMode("text_2img");
      return;
    }
    if (selectedIsCode) {
      setInputMode("text_1img");
      let parentId: string | null =
        (centerView.type === "code" ? centerView.jobId : null) ||
        waterEditTargetJobId ||
        (selectedJobInfo && isWaterJobFn(selectedJobInfo) ? selectedJobInfo.id : null);
      if (!parentId) {
        const recent = library3DAssets.find(
          (j) => (isWaterJobFn(j) || isWaterJobId(j.id)) && j.status === "DONE" && hasRealFactoryCode(j)
        );
        parentId = recent?.id ?? null;
      }
      if (!parentId) {
        setError("Open or select a Water model to edit first");
        return;
      }
      setWaterEditTargetJobId(parentId);
      setError(null);
      if (centerView.type !== "code" || centerView.jobId !== parentId) {
        const job =
          library3DAssets.find((j) => j.id === parentId) ||
          (selectedJobInfo?.id === parentId ? selectedJobInfo : null);
        if (job) {
          handle3DClick(job);
        } else {
          setCenterView({
            type: "generating",
            progress: 40,
            message: "Loading Water model…",
          });
          void (async () => {
            try {
              const cs = await fetchWaterJob(parentId!, async () => (await getToken()) ?? null);
              if (cs.factoryCode) {
                setCodeFactoryCode(cs.factoryCode);
                if (cs.sculptPass) setCodeSculptPass(cs.sculptPass);
                setCurrentGenerating(null);
                setLoading(false);
                setCenterView({
                  type: "code",
                  factoryCode: cs.factoryCode,
                  jobId: parentId!,
                });
              } else {
                setCenterView({
                  type: "error",
                  message: "Water model is not ready to edit yet",
                });
              }
            } catch {
              setCenterView({
                type: "error",
                message: "Could not load Water model",
              });
            }
          })();
        }
      }
      return;
    }
    if (editAvailable) setInputMode("text_1img");
  };

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

  const handleChatGenerate = () => {
    if (selectedIsCode) {
      void runWaterFromPanel();
    } else if (inputMode === "image" || (inputMode === "text_1img" && !prompt.trim())) {
      void handleGenerate3D();
    } else {
      void handleGenerateImage();
    }
    // Handlers above capture `prompt` synchronously, so the composer can reset right away.
    if (prompt.trim() && hasWorkspaceContext) {
      promptHistory.record(prompt, selectedIsCode ? "water" : "cloud");
      setPrompt("");
    }
  };

  const isGenerating = loading || generatingPreview || (currentGenerating?.status === "generating");
  const chatCostLabel = selectedIsCode
    ? "Water · 0 credits"
    : `${
        inputMode === "text_2img" && prompt.trim()
          ? 4
          : inputMode === "text_1img" && prompt.trim()
            ? 3
            : inputMode === "text" || (inputMode !== "image" && prompt.trim().length > 0 && (image1 || image2))
              ? CREDITS_IMAGE
              : CREDITS_3D
      } / ${creditsLoading ? "…" : creditsTotal} credits`;
  const chatGenerateLabel = selectedIsCode
    ? inputMode === "text_1img"
      ? "Refine with Water"
      : "Generate with Water"
    : inputMode === "image"
      ? "Generate 3D"
      : "Generate";
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
        {/* Left panel toggle */}
        <button
          type="button"
          onClick={() => setLeftPanelOpen(true)}
          className={cn(
            "absolute left-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-2xl border border-neutral-200/60 bg-white px-2.5 py-4 text-neutral-700 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.14)] transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-neutral-50 active:scale-[0.98] lg:flex",
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
              : "width 150ms cubic-bezier(0.22, 1, 0.36, 1), min-width 150ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease",
          }}
          className={cn(
            "flex shrink-0 flex-col overflow-hidden border border-neutral-200/60 bg-white will-change-[width]",
            "max-lg:hidden",
            "lg:absolute lg:bottom-4 lg:left-4 lg:top-4 lg:z-30 lg:rounded-[26px] lg:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.14)]",
            !leftPanelOpen && "border-transparent lg:pointer-events-none lg:opacity-0"
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
            <div className="flex items-center gap-0.5">
              <Button
                type="button"
                onClick={() => { setNewWorkspaceName(""); setShowNewWorkspaceModal(true); }}
                variant="ghost"
                size="sm"
                className="h-8 shrink-0 rounded-full px-3 text-[12px] font-medium"
                title="New Workspace"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.25} />
                <span>New</span>
              </Button>
              <Button type="button" onClick={() => setLeftPanelOpen(false)} variant="ghost" size="sm" className="h-8 w-8 shrink-0 rounded-full p-0" title="Close library" aria-label="Close library panel">
                <PanelLeftClose className="h-4 w-4" strokeWidth={2} />
              </Button>
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
                <ImageIcon className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
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
                <Box className="h-3.5 w-3.5 shrink-0" strokeWidth={2} />
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
                        className="group/card relative aspect-square rounded-2xl overflow-hidden border border-neutral-200/70 hover:border-neutral-400 transition-colors duration-150 cursor-pointer bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)] flex items-center justify-center active:scale-[0.98]"
                      >
                        {(item.previewImageUrl || item.imageUrl) ? (
                          <img src={displayImageUrl(item.previewImageUrl || item.imageUrl)} alt={item.prompt || "Image"} className="w-full h-full object-cover pointer-events-none" />
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
                        draggable={isWaterJobFn(item)}
                        onDragStart={(e) => {
                          if (!isWaterJobFn(item)) return;
                          e.dataTransfer.setData("application/job-id", item.id);
                          e.dataTransfer.setData("application/water-job", "1");
                          e.dataTransfer.setData(
                            "text/uri-list",
                            item.previewImageUrl || item.imageUrl || ""
                          );
                          e.dataTransfer.effectAllowed = "copy";
                        }}
                        onClick={() => handle3DClick(item)}
                        className="group/card relative aspect-square rounded-2xl overflow-hidden border border-neutral-200/70 hover:border-neutral-400 transition-colors duration-150 cursor-pointer bg-neutral-100 shadow-[0_1px_2px_rgba(0,0,0,0.04)] text-left active:scale-[0.98]"
                      >
                        {item.previewImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={displayImageUrl(item.previewImageUrl)}
                            alt={item.prompt || "3D Asset"}
                            className="w-full h-full object-cover"
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
          <div className="hidden lg:block shrink-0 border-t border-neutral-200/60 px-3 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" strokeWidth={2} />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search…"
                className="h-9 rounded-full border-neutral-200/80 bg-neutral-50/80 pl-9 shadow-none focus-visible:border-neutral-300 focus-visible:ring-neutral-900/[0.04]"
              />
            </div>
          </div>
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
        <main className={cn("relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-white", mobileTab === "canvas" ? "max-lg:flex" : "max-lg:hidden")}>
          {(centerView.type === "3d" || centerView.type === "code") && (
            <div
              className="pointer-events-none absolute top-4 z-[25] hidden items-center justify-center lg:flex"
              style={{
                left: leftPanelOpen ? leftPanelWidth + 32 : 16,
                right: rightPanelOpen ? RIGHT_PANEL_WIDTH + 32 : 16,
                transition: resizingLeft
                  ? "none"
                  : "left 150ms cubic-bezier(0.22, 1, 0.36, 1), right 150ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
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
                        if (!currentGenerating?.jobId) return;
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
                          setCenterView({ type: "error", message: "Job cancelled" });
                        } catch (e: any) {
                          setCenterView({
                            type: "error",
                            message: toUserFacingGpuError(e?.message || "Failed to cancel"),
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
                />
                </div>
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

          </div>
        </main>

        <button
          type="button"
          onClick={() => setRightPanelOpen(true)}
          className={cn(
            "absolute right-4 top-1/2 z-20 hidden -translate-y-1/2 flex-col items-center justify-center gap-1 rounded-2xl border border-neutral-200/60 bg-white px-2.5 py-4 text-neutral-700 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.14)] transition-[opacity,transform] duration-150 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-neutral-50 active:scale-[0.98] lg:flex",
            rightPanelOpen
              ? "pointer-events-none translate-x-2 opacity-0"
              : "pointer-events-auto translate-x-0 opacity-100"
          )}
          title="Open scene controls"
          aria-label="Open scene controls"
          tabIndex={rightPanelOpen ? -1 : 0}
        >
          <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-500">Scene</span>
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
              : "width 150ms cubic-bezier(0.22, 1, 0.36, 1), min-width 150ms cubic-bezier(0.22, 1, 0.36, 1), opacity 150ms ease",
          }}
          className={cn(
            "flex-shrink-0 flex flex-col bg-white border border-neutral-200/60 overflow-hidden will-change-[width]",
            "lg:absolute lg:bottom-4 lg:right-4 lg:top-4 lg:z-30 lg:rounded-[26px] lg:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.14)]",
            "max-lg:border-l-0 max-lg:border-t max-lg:border-neutral-200 max-lg:bg-white",
            !rightPanelOpen && "max-lg:border-transparent lg:pointer-events-none lg:opacity-0",
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
          <div className="hidden lg:flex h-[72px] flex-shrink-0 px-3 border-b border-neutral-200/60 items-center gap-2 min-w-0">
            <div className="shrink-0 [&_.cl-userButtonBox]:!flex [&_.cl-userButtonTrigger]:!rounded-full">
              {clientMounted ? <UserButton afterSignOutUrl="/" /> : <div className="w-8 h-8 rounded-full bg-neutral-200 animate-pulse" aria-hidden />}
            </div>
            <Input
              type="text"
              value={workspaceName}
              onChange={(e) => handleWorkspaceNameChange(e.target.value)}
              placeholder="Name workspace"
              className="h-9 min-w-0 flex-1 border-transparent bg-transparent px-1 text-[13px] font-semibold tracking-tight shadow-none focus-visible:border-neutral-200 focus-visible:ring-0"
            />
            <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-full bg-neutral-900/[0.04] border border-neutral-200/60" title="Credits remaining">
              <span className="text-[12px] font-semibold text-neutral-800 tabular-nums">{creditsLoading ? "…" : Math.max(0, creditsTotal - creditsUsed)}</span>
            </div>
            <Link href="/library" className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors shrink-0" title="My Library" aria-label="My Library">
              <Library className="h-4 w-4" strokeWidth={2} />
            </Link>
            <ModeToggle />
            <button type="button" onClick={() => setRightPanelOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors duration-200 shrink-0" title="Collapse panel" aria-label="Collapse panel">
              <PanelRightClose className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
          <ScrollArea className="flex-1 min-h-0 w-full">
          <div className="mx-auto w-full max-w-xl lg:max-w-none px-4 sm:px-6 lg:px-5 pt-3 sm:pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] lg:pb-6">
            <AssetInspector
              kind={
                centerView.type === "3d" || centerView.type === "code"
                  ? centerView.type
                  : centerView.type === "preview"
                    ? "preview"
                    : "empty"
              }
              parts={Object.keys(authoredParts)}
              selectedPart={selectedPart}
              onSelectPart={setSelectedPart}
              look={look}
              onLookChange={updateLook}
              partMaterial={selectedPartMaterial}
              onPartMaterial={handlePartMaterial}
            />
          </div>
          </ScrollArea>
          </div>
          </div>
        </aside>

        <div
          className="pointer-events-none absolute z-40 flex justify-center px-3 max-lg:left-0 max-lg:right-0 bottom-3 lg:bottom-5"
          style={
            isCompact
              ? undefined
              : {
                  left: leftPanelOpen ? leftPanelWidth + 32 : 16,
                  right: rightPanelOpen ? RIGHT_PANEL_WIDTH + 32 : 16,
                }
          }
        >
          <div className="pointer-events-auto w-full max-w-[760px]">
            <ChatComponent
              prompt={prompt}
              onPromptChange={setPrompt}
              textareaRef={promptTextareaRef}
              inputMode={inputMode}
              onInputModeChange={handleSelectInputMode}
              selectedIsCode={selectedIsCode}
              editAvailable={editAvailable}
              combineAvailable={combineAvailable}
              selectedModel={selectedModel}
              selectedLabel={selectedCatalog?.label ?? selectedModel}
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
              numGenerations={numGenerations}
              onNumGenerationsChange={setNumGenerations}
              promptHistory={promptHistory.entries}
              onSelectHistory={(item) => {
                setPrompt(item);
                promptTextareaRef.current?.focus();
              }}
              onClearHistory={promptHistory.clear}
              image1={image1}
              image2={image2}
              isDragging={isDragging}
              onImageDrop={handleDrop}
              onImagePaste={handlePaste}
              onImageFileSelect={handleFileSelect}
              onImageClear={handleClearImage}
              onDragOver={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
              waterEdit={
                selectedIsCode && inputMode === "text_1img"
                  ? {
                      parentId: waterEditParentId,
                      title:
                        waterEditParentJob?.prompt?.trim() ||
                        (waterEditParentId ? `Water · ${waterEditParentId.slice(0, 10)}…` : "No model selected"),
                      previewUrl: waterEditParentJob?.previewImageUrl || waterEditParentJob?.imageUrl || null,
                      highlight: waterDropHighlight,
                      onDragOver: (e) => {
                        if (![...e.dataTransfer.types].includes("application/job-id")) return;
                        e.preventDefault();
                        e.dataTransfer.dropEffect = "copy";
                        setWaterDropHighlight(true);
                      },
                      onDragLeave: () => setWaterDropHighlight(false),
                      onDrop: (e) => {
                        e.preventDefault();
                        setWaterDropHighlight(false);
                        const droppedId = e.dataTransfer.getData("application/job-id");
                        if (!droppedId) return;
                        const target = library3DAssets.find((j) => j.id === droppedId);
                        if (!target) {
                          setError("Drop a Water model from the library");
                          return;
                        }
                        applyWaterEditParent(target);
                      },
                      onClear: () => setWaterEditTargetJobId(""),
                    }
                  : null
              }
              onGenerate={handleChatGenerate}
              generating={isGenerating}
              error={error}
              costLabel={chatCostLabel}
              generateLabel={chatGenerateLabel}
            />
          </div>
        </div>
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
