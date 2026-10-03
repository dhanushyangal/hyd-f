import {
  getPrimaryUrl,
  isPrimaryUp,
  markPrimaryDown,
  onHealthChange,
  canEdit,
  onFeaturesChange,
  getHealthState,
} from "./apiHealth";
import {
  DEFAULT_IMAGE_OPTIONS,
  type ImageOptions,
  type ImageProvider,
  type ImageQuality,
} from "./imageOptions";

// Re-export health utilities for UI components

export {
  isPrimaryUp,
  onHealthChange,
  canEdit,
  onFeaturesChange,
  getHealthState,
};

const apiBase = getPrimaryUrl();

// Backend URL - must be set in Vercel environment variables as NEXT_PUBLIC_BACKEND_URL
const getBackendBase = (): string => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (
    !url ||
    url === "NEXT_PUBLIC_BACKEND_URL" ||
    url.includes("NEXT_PUBLIC_BACKEND_URL")
  ) {
    return "https://hydrilla-backend.vercel.app"; // Fallback for local dev
  }
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

const backendBase = getBackendBase();

/**
 * Check if an error is a network error indicating the API is unavailable
 */
function isApiUnavailableError(err: any): boolean {
  return (
    err.name === "TypeError" &&
    (err.message.includes("fetch") ||
      err.message.includes("Failed to fetch") ||
      err.message.includes("NetworkError") ||
      err.message.includes("Network request failed") ||
      err.message.includes("ERR_CONNECTION_REFUSED") ||
      err.message.includes("ERR_INTERNET_DISCONNECTED") ||
      err.message.includes("ERR_NETWORK_CHANGED"))
  );
}

/**
 * Get user-friendly error message when GPU/API is offline
 */
function getGpuOfflineErrorMessage(): string {
  return "GPU is currently offline. Please try again after some time.";
}

/** Only notify founders when API explicitly reported GPU/offline, not for generic network "Failed to fetch" */
function shouldNotifyGpuOffline(err: any): boolean {
  const msg = err?.message ?? "";
  return (
    msg.includes("GPU is currently offline") ||
    msg.includes("External service unavailable") ||
    msg.includes("GPU API is currently unavailable")
  );
}

/**
 * Notify backend about GPU offline error (non-blocking)
 */
export async function notifyGpuOffline(
  errorMessage: string,
  getToken?: () => Promise<string | null>,
) {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (getToken) {
      const token = await getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    // Send notification to backend (non-blocking, don't wait for response)
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    fetch(`${backendBase}/api/3d/notify-gpu-offline`, {
      method: "POST",
      headers,
      body: JSON.stringify({ errorMessage }),
      signal: controller.signal,
    })
      .then((res) => {
        clearTimeout(timeoutId);
        if (!res.ok) {
          console.warn(
            "Failed to send GPU offline notification:",
            res.status,
            res.statusText,
          );
        } else {
          console.log("GPU offline notification sent successfully");
        }
        return res.json();
      })
      .catch((err) => {
        clearTimeout(timeoutId);
        // Log but don't throw - notification is not critical
        if (err.name !== "AbortError") {
          console.warn("Failed to send GPU offline notification:", err.message);
        }
      });
  } catch (err: any) {
    // Log but don't throw - notification is not critical
    console.warn("Error in notifyGpuOffline:", err.message);
  }
}

export type JobStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

// Queue information for accurate time estimation
export interface QueueInfo {
  position: number; // 0 = processing, 1+ = waiting
  jobs_ahead: number;
  estimated_wait_seconds: number;
  estimated_total_seconds: number;
  queue_length: number;
  currently_processing: boolean;
}

export interface Job {
  job_id: string;
  status: JobStatus;
  progress: number;
  message: string;
  created_at?: number;
  updated_at?: number;
  queue?: QueueInfo; // Queue position and wait time
  result?: {
    job_id: string;
    mode: "image-to-3d";
    prompt?: string;
    mesh_url?: string;
    generated_image_url?: string;
    processed_image_url?: string;
    output?: string;
    processed_image?: string;
    generated_image?: string;
    elapsed_seconds: number;
  };
  error?: string;
  creditsRefunded?: boolean;
}

// Backend API types
export type BackendJobStatus = "WAIT" | "RUN" | "FAIL" | "DONE";

export interface Workspace {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  firstJobPreviewImageUrl?: string | null;
  firstJobPrompt?: string | null;
  jobCount?: number;
}

export type WaterVisualEvidence = {
  gatePassed?: boolean;
  fidelity?: number | null;
  failCodes?: string[];
  promoteEligible?: boolean;
  reasons?: string[];
  source?: "factory" | "unexecuted" | string;
  meshNames?: string[];
  turntables?: Array<{ angle: number; dataUrl: string }>;
  sheetDataUrl?: string | null;
};

type WaterMaterialPatch = {
  color?: string;
  roughness?: number;
  metalness?: number;
};

export type WaterSceneInstance = {
  nodeId: string;
  assetId: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  material?: WaterMaterialPatch | null;
  /** Per-mesh overrides keyed by factory mesh name. */
  partMaterials?: Record<string, WaterMaterialPatch>;
};

export type WaterSceneBundle = {
  jobId: string;
  projectId: string;
  sceneId: string;
  assetId: string;
  nodeId: string;
  ir: {
    version: 0;
    camera: {
      position: [number, number, number];
      target: [number, number, number];
      fov: number;
    };
    lights: Array<{
      type: string;
      intensity: number;
      position?: [number, number, number];
    }>;
    instances: WaterSceneInstance[];
  };
  /** This job's instance within the (shared) project scene. */
  instance: WaterSceneInstance;
  meshNames: string[];
  triangleCount: number | null;
  drawCalls: number | null;
  qualityTier: "fast" | "standard" | "studio" | null;
  pack: string | null;
};

export type WaterChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export interface BackendJob {
  id: string;
  userId: string | null;
  status: BackendJobStatus;
  prompt: string | null;
  imageUrl: string | null;
  generateType: string;
  resultGlbUrl: string | null;
  previewImageUrl: string | null;
  errorMessage: string | null;
  workspaceId?: string | null;
  parentJobId?: string | null;
  parentJobIds?: string[]; // All parent IDs (multi-parent merges)
  sourceImages?: string[] | null; // Actual source image URLs used as input
  engine?: string | null;
  resultKind?: string | null;
  factoryCode?: string | null;
  /** Library list may set this instead of shipping full factoryCode */
  hasFactoryCode?: boolean;
  sculptPass?: string | null;
  /** Wall-clock generate time in ms. Null while running. */
  durationMs?: number | null;
  visualEvidence?: WaterVisualEvidence | null;
  createdAt: string;
  updatedAt: string;
}

export type UserApiKeyMeta = {
  provider:
    | "anthropic"
    | "openai"
    | "google"
    | "gemini"
    | "openrouter"
    | "cursor";
  label?: string;
  configured: boolean;
  last4: string | null;
  status: "unchecked" | "valid" | "invalid";
  lastError: string | null;
  verifiedAt: string | null;
  updatedAt: string | null;
};

export type ConnectorPublic = {
  id: "anthropic" | "openai" | "google" | "openrouter" | "cursor";
  name: string;
  product: string;
  docsUrl: string;
  keyPlaceholder: string;
};

export type WaterModelRow = {
  id: string;
  name: string;
  nativeId: string;
  free?: boolean;
};

export type WaterModelGroup = {
  provider: ConnectorPublic["id"];
  name: string;
  source: "user" | "platform";
  models: WaterModelRow[];
  error?: string;
};

function keyUsable(k: UserApiKeyMeta | undefined): boolean {
  return Boolean(k?.configured && k.status !== "invalid");
}

function providerSlot(
  provider: string,
  keys: UserApiKeyMeta[],
): UserApiKeyMeta | undefined {
  const want = provider === "gemini" ? "google" : provider;
  return keys.find((k) => {
    const id = k.provider === "gemini" ? "google" : k.provider;
    return id === want;
  });
}

export function providerKeyAvailable(
  provider: string,
  keys: UserApiKeyMeta[],
  sharedKeys: UserApiKeyMeta[] = [],
): boolean {
  if (provider === "hydrilla") return true;
  return (
    keyUsable(providerSlot(provider, keys)) ||
    keyUsable(providerSlot(provider, sharedKeys))
  );
}

export type UserModelPrefs = {
  defaultMeshModel: string;
  defaultCodeModel: string | null;
  enabledCodeModels?: string[] | null;
};

/**
 * Transform backend job format to frontend Job format
 */
function transformBackendJobToJob(backendJob: BackendJob | any): Job {
  // Map backend status to frontend status
  const statusMap: Record<BackendJobStatus, JobStatus> = {
    WAIT: "pending",
    RUN: "processing",
    DONE: "completed",
    FAIL: "failed",
  };

  return {
    job_id: backendJob.id,
    status: statusMap[backendJob.status as BackendJobStatus] || "pending",
    progress:
      backendJob.status === "DONE" ? 100 : backendJob.status === "RUN" ? 50 : 0,
    message:
      backendJob.errorMessage ||
      (backendJob.status === "DONE" ? "Completed" : "Processing..."),
    created_at: backendJob.createdAt
      ? new Date(backendJob.createdAt).getTime()
      : undefined,
    updated_at: backendJob.updatedAt
      ? new Date(backendJob.updatedAt).getTime()
      : undefined,
    result:
      backendJob.resultGlbUrl || backendJob.previewImageUrl
        ? {
            job_id: backendJob.id,
            mode: "image-to-3d",
            prompt: backendJob.prompt || undefined,
            mesh_url: backendJob.resultGlbUrl || undefined,
            processed_image_url: backendJob.previewImageUrl || undefined,
            generated_image_url: backendJob.previewImageUrl || undefined,
            output: backendJob.resultGlbUrl || undefined,
            elapsed_seconds: 0,
          }
        : undefined,
    error: backendJob.errorMessage || undefined,
    creditsRefunded: Boolean(
      backendJob.creditsRefunded ||
      backendJob.credits_refunded ||
      (backendJob.status === "FAIL" &&
        backendJob.errorMessage?.toLowerCase().includes("refund")),
    ),
  };
}

/**
 * Register a job with preview image
 */
export async function registerJobWithPreview(
  previewId: string,
  previewImageUrl: string,
  prompt: string,
  getToken?: () => Promise<string | null>,
  chatId?: string | null,
  generateType?: string | null,
  workspaceId?: string | null,
  parentJobId?: string | null,
  parentJobIds?: string[] | null,
  sourceImages?: string[] | null,
): Promise<void> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (getToken) {
      const token = await getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const body: any = {
      job_id: previewId,
      prompt,
      previewImageUrl,
    };
    if (chatId) {
      body.chatId = chatId;
    }
    if (generateType) {
      body.generateType = generateType;
    }
    if (workspaceId) {
      body.workspaceId = workspaceId;
    }
    if (parentJobId) {
      body.parentJobId = parentJobId;
    }
    if (parentJobIds && parentJobIds.length > 0) {
      body.parentJobIds = parentJobIds;
    }
    if (sourceImages && sourceImages.length > 0) {
      body.sourceImages = sourceImages;
    }

    await fetch(`${backendBase}/api/3d/register-job`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    }).catch(() => {});
  } catch {}
}

/** Resolve relative image URL from gateway to full URL */
function resolveImageUrl(url: string): string {
  if (!url || !url.startsWith("/")) return url;
  const base = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
  return `${base}${url}`;
}

function resolveLoadableImageUrl(url: string | null | undefined): string {
  const resolved = resolveImageUrl(url || "");
  return getProxiedImageUrl(resolved) || resolved;
}

function isGatewayOutputImageUrl(url: string): boolean {
  return (
    url.includes("/outputs/preview/") ||
    url.includes("/outputs/image/") ||
    url.includes("/outputs/edit/")
  );
}

type ImageRequestContext = {
  chatId?: string | null;
  workspaceId?: string | null;
  parentJobId?: string | null;
  parentJobIds?: string[] | null;
};

const IMAGE_NETWORK_ERROR =
  "Could not reach Hydrilla. Check your connection and try again.";

async function readImageError(res: Response, fallback: string): Promise<Error> {
  const text = await res.text().catch(() => "");
  const resolveMessage = (): string => {
    try {
      const data = JSON.parse(text) as {
        error?: string | { message?: string; code?: string };
        message?: string;
      };
      if (typeof data.error === "string") {
        return data.error;
      }
      if (
        data.error &&
        typeof data.error === "object" &&
        typeof data.error.message === "string"
      ) {
        return data.error.message;
      }
      if (typeof data.message === "string") {
        return data.message;
      }
    } catch {
      /* non-json body */
    }
    if (text) {
      return text;
    }
    return fallback;
  };
  return new Error(resolveMessage());
}

/**
 * Text-to-image via OpenAI or Gemini (auth required; 2 credits low / 5 high).
 * The backend returns the stored image synchronously.
 */
export async function generatePreviewImage(
  prompt: string,
  getToken?: () => Promise<string | null>,
  context?: ImageRequestContext,
  options: ImageOptions = DEFAULT_IMAGE_OPTIONS,
): Promise<{
  image_url: string;
  preview_id: string;
  provider: ImageProvider;
  quality: ImageQuality;
  model?: string;
  credits_used?: number;
}> {
  const token = getToken ? await getToken() : null;
  if (!token) {
    throw new Error("Authentication required");
  }

  let res: Response;
  try {
    res = await fetch(`${backendBase}/api/3d/text-to-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        prompt: prompt.trim(),
        provider: options.provider,
        quality: options.quality,
        aspect: options.aspect,
        chatId: context?.chatId || undefined,
        workspaceId: context?.workspaceId || undefined,
        parentJobId: context?.parentJobId || undefined,
        parentJobIds:
          context?.parentJobIds && context.parentJobIds.length > 0
            ? context.parentJobIds
            : undefined,
      }),
    });
  } catch (err: any) {
    if (isApiUnavailableError(err)) throw new Error(IMAGE_NETWORK_ERROR);
    throw err;
  }
  if (res.status === 402) {
    throw await readImageError(
      res,
      "Insufficient credits. Please subscribe or buy more credits.",
    );
  }
  if (!res.ok) throw await readImageError(res, "Failed to generate image");

  const result = await res.json();
  return {
    image_url: resolveLoadableImageUrl(result.image_url ?? ""),
    preview_id: result.preview_id ?? result.job_id,
    provider: result.provider ?? options.provider,
    quality: result.quality ?? options.quality,
    model: result.model,
    credits_used: result.credits_used,
  };
}

/**
 * Edit an image with a prompt via OpenAI or Gemini (auth required; 3 credits low / 6 high).
 * Supports single image editing or multi-view 3D screenshot editing (Angle 1 through 4).
 */
export async function editImage(
  prompt: string,
  imageFile?: File | File[] | null,
  imageUrl?: string | string[] | null,
  getToken?: () => Promise<string | null>,
  context?: ImageRequestContext & { sourceImages?: string[] | null; additionalPrompt?: string | null },
  options: Pick<ImageOptions, "provider" | "quality"> = DEFAULT_IMAGE_OPTIONS,
): Promise<{
  edit_id: string;
  image_url: string;
  prompt: string;
  provider: ImageProvider;
  quality: ImageQuality;
  model?: string;
}> {
  const formData = new FormData();
  formData.append("prompt", prompt.trim());
  if (Array.isArray(imageFile) && imageFile.length > 0) {
    imageFile.forEach((file) => {
      formData.append("images", file);
    });
  } else if (imageFile && !Array.isArray(imageFile)) {
    formData.append("image", imageFile);
  } else if (Array.isArray(imageUrl) && imageUrl.length > 0) {
    formData.append("sourceImages", JSON.stringify(imageUrl));
  } else if (imageUrl && typeof imageUrl === "string") {
    formData.append("image_url", imageUrl);
  } else {
    throw new Error("Either image file(s) or image URL(s) are required");
  }
  formData.append("provider", options.provider);
  formData.append("quality", options.quality);
  if (context?.chatId) {
    formData.append("chatId", context.chatId);
  }
  if (context?.workspaceId) {
    formData.append("workspaceId", context.workspaceId);
  }
  if (context?.parentJobId) {
    formData.append("parentJobId", context.parentJobId);
  }
  if (context?.parentJobIds && context.parentJobIds.length > 0) {
    formData.append("parentJobIds", JSON.stringify(context.parentJobIds));
  }
  if (context?.sourceImages && context.sourceImages.length > 0) {
    formData.append("sourceImages", JSON.stringify(context.sourceImages));
  }
  if (context?.additionalPrompt) {
    formData.append("additionalPrompt", context.additionalPrompt);
  }

  const token = getToken ? await getToken() : null;
  if (!token) {
    throw new Error("Authentication required");
  }

  const res = await (async () => {
    try {
      return await fetch(`${backendBase}/api/3d/edit-image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
    } catch (err: any) {
      if (isApiUnavailableError(err)) {
        throw new Error(IMAGE_NETWORK_ERROR);
      }
      throw err;
    }
  })();

  if (res.status === 402) {
    throw await readImageError(
      res,
      "Insufficient credits. Please subscribe or buy more credits.",
    );
  }
  if (!res.ok) {
    throw await readImageError(res, "Failed to edit image");
  }

  const result = await res.json();
  return {
    edit_id: result.edit_id ?? result.job_id,
    image_url: resolveLoadableImageUrl(result.image_url ?? ""),
    prompt: result.prompt || prompt,
    provider: result.provider ?? options.provider,
    quality: result.quality ?? options.quality,
    model: result.model,
  };
}

/** Credits info from GET /api/payments/credits */
export interface CreditsInfo {
  used: number;
  total: number;
  remaining: number;
  plan: string | null;
  resetAt?: string | null;
}

/**
 * Fetch current user credits (requires auth). Backend creates free-tier row if missing.
 */
export async function getCredits(
  getToken: () => Promise<string | null>,
): Promise<CreditsInfo> {
  const token = await getToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${backendBase}/api/payments/credits`, {
    method: "GET",
    headers,
  });
  if (!res.ok) {
    const fallback = { used: 0, total: 200, remaining: 200, plan: null };
    try {
      const data = await res.json();
      if (data.credits) return data.credits as CreditsInfo;
    } catch {}
    return fallback;
  }
  const data = (await res.json()) as { credits?: CreditsInfo };
  return (data.credits ?? {
    used: 0,
    total: 200,
    remaining: 200,
    plan: null,
  }) as CreditsInfo;
}

/**
 * Check if the user has early/premium access (e.g. active subscription).
 * Used by EarlyAccessBadge. Returns { hasAccess: true } if user has an active subscription.
 */
export async function checkEarlyAccess(
  _email: string | undefined,
  getToken?: () => Promise<string | null>,
): Promise<{ hasAccess: boolean }> {
  if (!getToken) return { hasAccess: false };
  try {
    const token = await getToken();
    if (!token) return { hasAccess: false };
    const res = await fetch(`${backendBase}/api/payments/subscription`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { hasAccess: false };
    const data = (await res.json()) as { subscription?: unknown };
    return { hasAccess: !!data.subscription };
  } catch {
    return { hasAccess: false };
  }
}

/**
 * Upload image file to backend and get URL (backend may use local uploads or S3).
 */
export async function uploadImage(
  file: File,
  getToken?: () => Promise<string | null>,
): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const headers: HeadersInit = {};
  if (getToken) {
    const token = await getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${backendBase}/api/3d/upload-image`, {
    method: "POST",
    headers,
    body: formData,
  });

  if (!res.ok) {
    let errorText: string;
    try {
      const errorData = await res.json();
      errorText = errorData.error || "Failed to upload image";
    } catch {
      errorText = (await res.text()) || "Failed to upload image";
    }
    throw new Error(errorText);
  }

  const data = await res.json();
  return data.url;
}

/**
 * Upload image via the Node backend (S3). Auth required.
 * Kept for callers that used the old GPU upload helper.
 */
export async function uploadImageViaApi(
  file: File,
  getToken?: () => Promise<string | null>,
): Promise<string> {
  if (!getToken) {
    throw new Error("Authentication required");
  }
  return uploadImage(file, getToken);
}

/**
 * `blob:` / `data:` URLs only exist in the browser — the GPU worker on EC2 cannot
 * download them. If we ever receive one (e.g. state lost the `File` after React
 * re-render, or another caller passed a preview URL only), read the bytes here
 * and upload before calling `/api/3d/generate`.
 */
async function ensurePublicImageUrlFor3d(
  imageUrl: string | null,
  imageFile: File | null,
): Promise<{ imageUrl: string | null; imageFile: File | null }> {
  if (imageFile || !imageUrl) return { imageUrl, imageFile };
  const t = imageUrl.trim();
  if (!t.startsWith("blob:") && !t.startsWith("data:"))
    return { imageUrl, imageFile: null };
  try {
    const res = await fetch(imageUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const blob = await res.blob();
    const mime = blob.type || "image/png";
    const ext =
      mime === "image/jpeg" || mime === "image/jpg"
        ? ".jpg"
        : mime === "image/webp"
          ? ".webp"
          : mime === "image/gif"
            ? ".gif"
            : ".png";
    const file = new File([blob], `upload${ext}`, { type: mime });
    return { imageUrl: null, imageFile: file };
  } catch {
    throw new Error(
      "Could not read the image from your device. Please select the file again or pick the image from your library.",
    );
  }
}

/**
 * Submit image-to-3D job via backend (deducts credits, then submits to Python API).
 * If imageFile is provided, uploads first to get imageUrl. Returns job_id.
 * Throws on 402 (insufficient credits) with error message.
 */
export async function submitImageTo3D(
  imageUrl: string | null,
  imageFile: File | null = null,
  getToken?: () => Promise<string | null>,
  previewJobId?: string | null,
  chatId?: string | null,
  workspaceId?: string | null,
  parentJobId?: string | null,
  aiModel?: string | null,
  resolution?: "standard" | "ultra1k" | null,
  prompt?: string | null,
): Promise<{ job_id: string }> {
  const unwrapped = unwrapProxiedImageUrl(imageUrl) || imageUrl;
  const resolved = await ensurePublicImageUrlFor3d(unwrapped, imageFile);
  const targetImageUrl = resolved.imageUrl;
  const targetImageFile = resolved.imageFile;

  const sourceImageUrl = await (async (): Promise<string> => {
    if (targetImageFile) {
      if (isPrimaryUp()) {
        try {
          const apiUploaded = await uploadImageViaApi(targetImageFile, getToken);
          if (apiUploaded) {
            return apiUploaded;
          }
        } catch {
          // ignore
        }
      }
      try {
        const fallbackUploaded = await uploadImage(targetImageFile, getToken);
        if (fallbackUploaded) {
          return fallbackUploaded;
        }
      } catch {
        throw new Error("Failed to upload image. Please try again.");
      }
      throw new Error("Failed to upload image. Please try again.");
    }
    if (!targetImageUrl) {
      throw new Error("Either imageUrl or imageFile must be provided");
    }
    return targetImageUrl;
  })();

  const urlToSend = sourceImageUrl;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (getToken) {
    const token = await getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    const res = await fetch(`${backendBase}/api/3d/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        imageUrl: urlToSend,
        prompt: prompt || undefined,
        aiModel: aiModel || undefined,
        chatId: chatId || undefined,
        workspaceId: workspaceId || undefined,
        parentJobId: parentJobId || previewJobId || undefined,
        parentJobIds:
          parentJobId || previewJobId
            ? [parentJobId || previewJobId]
            : undefined,
        resolution: resolution || undefined,
      }),
    });

    if (res.status === 402) {
      const data = await res.json().catch(() => ({}));
      throw new Error(
        (data as { error?: string }).error ||
          "Insufficient credits. Please subscribe or buy more credits.",
      );
    }

    if (!res.ok) {
      let errorText: string;
      try {
        const errorData = await res.json();
        errorText = errorData.error || "Failed to submit job";
      } catch {
        errorText = (await res.text()) || "Failed to submit job";
      }
      throw new Error(errorText);
    }

    const data = (await res.json()) as { jobId?: string };
    const jobId = data.jobId;

    if (jobId && (chatId || workspaceId || previewJobId || parentJobId)) {
      try {
        const body: Record<string, unknown> = {
          job_id: jobId,
          imageUrl: urlToSend,
          generateType: "ImageTo3D",
        };
        if (sourceImageUrl) body.sourceImages = [sourceImageUrl];
        if (previewJobId) body.previewJobId = previewJobId;
        if (chatId) body.chatId = chatId;
        if (workspaceId) body.workspaceId = workspaceId;
        if (parentJobId || previewJobId)
          body.parentJobId = parentJobId || previewJobId;
        if (aiModel) body.aiModel = aiModel;
        await fetch(`${backendBase}/api/3d/register-job`, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        }).catch(() => {});
      } catch {}
    }

    return { job_id: jobId ?? "" };
  } catch (err: any) {
    if (
      err?.message?.includes("credits") ||
      err?.message?.includes("Insufficient")
    )
      throw err;
    if (isApiUnavailableError(err)) {
      markPrimaryDown();
      if (shouldNotifyGpuOffline(err)) {
        notifyGpuOffline(err.message || "GPU/API unavailable", getToken);
      }
      throw new Error(getGpuOfflineErrorMessage());
    }
    throw err;
  }
}

/** @deprecated — always use submitImageTo3D (Node backend). Kept as a hard error if called. */
async function submitImageTo3DViaGateway(
  _imageUrl: string | null,
  _imageFile: File | null,
  _getToken?: () => Promise<string | null>,
  _previewJobId?: string | null,
  _chatId?: string | null,
  _workspaceId?: string | null,
  _parentJobId?: string | null,
): Promise<{ job_id: string }> {
  throw new Error(
    "Direct GPU gateway submit is disabled. Use submitImageTo3D via the Node backend.",
  );
}

/**
 * Fetch job lineage (iterative prompting chain from root to the given job)
 */
export interface LineageItem {
  id: string;
  parentJobId: string | null;
  parentJobIds: string[]; // All parent IDs (multi-parent merges)
  sourceImages: string[] | null; // Source image URLs used as input
  prompt: string | null;
  previewImageUrl: string | null;
  resultGlbUrl: string | null;
  generateType: string;
  status: string;
  createdAt: string;
}

export async function fetchJobLineage(
  jobId: string,
  getToken?: () => Promise<string | null>,
): Promise<LineageItem[]> {
  const headers: HeadersInit = {};
  if (getToken) {
    const token = await getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  const res = await fetch(`${backendBase}/api/3d/jobs/${jobId}/lineage`, {
    headers,
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.lineage || [];
}

/**
 * Fetch job status from Node backend (auth recommended; required by API).
 */
export async function fetchStatus(
  jobId: string,
  getToken?: () => Promise<string | null>,
): Promise<Job> {
  const headers: HeadersInit = {};
  if (getToken) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${backendBase}/api/3d/status/${jobId}`, { headers });
  if (!res.ok) {
    let errorText: string;
    try {
      const errorData = await res.json();
      errorText = errorData.error || "Failed to fetch status";
    } catch {
      errorText = (await res.text()) || "Failed to fetch status";
    }
    throw new Error(errorText);
  }
  // Backend returns { job: BackendJob, queue?: QueueInfo }, we need to transform it to Job format
  const data = await res.json();
  const job = transformBackendJobToJob(data.job || data);

  if (typeof data.progress === "number") {
    job.progress = data.progress;
  }
  if (typeof data.message === "string" && data.message.trim()) {
    job.message = data.message;
  }
  if (typeof data.created_at === "number") {
    job.created_at = data.created_at;
  }
  if (data.queue) {
    job.queue = data.queue;
  }
  if (data.creditsRefunded || data.credits_refunded || job.creditsRefunded) {
    job.creditsRefunded = true;
  }

  return job;
}

/**
 * Fetch queue info for accurate time estimation
 */
export async function fetchQueueInfo(): Promise<
  | (QueueInfo & {
      estimated_wait_for_preview_seconds?: number;
      estimated_preview_time_seconds?: number;
      api_available?: boolean;
    })
  | null
> {
  let timeoutId: NodeJS.Timeout | null = null;
  try {
    // Backend responds within 1.5s (its own Python timeout); use 3.5s so we don't abort before backend responds
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`${backendBase}/api/3d/queue/info`, {
      signal: controller.signal,
    });

    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }

    // Backend may return 200 with api_available: false when gateway is unreachable (no 503)
    const data = await res.json();

    // Never treat queue/info failure as "GPU offline" - use fallback so 3D form stays usable.
    // GPU offline is only shown when an actual 3D submit (register-job / text-to-3d / image-to-3d) fails.
    if (!res.ok) {
      // If we still get 503, use response body as fallback if it has queue shape
      if (
        res.status === 503 &&
        data &&
        typeof data.estimated_total_seconds === "number"
      ) {
        return {
          position: 0,
          jobs_ahead: data.jobs_ahead_for_new ?? 0,
          estimated_wait_seconds: data.estimated_wait_for_new_job_seconds ?? 0,
          estimated_total_seconds: data.estimated_total_seconds ?? 300,
          queue_length: data.queue_length ?? 0,
          currently_processing: data.currently_processing ?? false,
          estimated_wait_for_preview_seconds:
            data.estimated_wait_for_preview_seconds ?? 0,
          estimated_preview_time_seconds:
            data.estimated_preview_time_seconds ?? 25,
          api_available: false,
        };
      }
      return null;
    }

    return {
      position: 0,
      jobs_ahead:
        data.jobs_ahead_for_new ??
        data.queue_length + (data.currently_processing ? 1 : 0),
      estimated_wait_seconds: data.estimated_wait_for_new_job_seconds || 0,
      estimated_total_seconds:
        data.estimated_total_seconds ??
        (data.estimated_wait_for_new_job_seconds || 0) +
          (data.estimated_time_per_job_seconds || 300),
      queue_length: data.queue_length || 0,
      currently_processing: data.currently_processing || false,
      estimated_wait_for_preview_seconds:
        data.estimated_wait_for_preview_seconds || 0,
      estimated_preview_time_seconds: data.estimated_preview_time_seconds ?? 25,
      api_available: data.api_available !== false,
    };
  } catch (err: any) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    // Timeout or network error: return null so callers use defaults; do not show "GPU offline"
    if (
      err.name === "AbortError" ||
      err.name === "TimeoutError" ||
      (err.name === "TypeError" && err.message?.includes("fetch"))
    ) {
      return null;
    }
    if (err.message?.includes("GPU is currently offline")) {
      return null;
    }
    return null;
  }
}

/**
 * Get GLB URL from job result (use proxy endpoint to avoid CORS issues)
 */
export function getGlbUrl(job: Job): string | null {
  if (!job.result) return null;
  const url = job.result.mesh_url || job.result.output || null;
  if (!url) return null;

  // Use proxy endpoint to avoid CORS issues
  // Extract jobId from the URL or use job.job_id
  const jobId = job.job_id;
  if (jobId) {
    return `${backendBase}/api/3d/glb/${jobId}`;
  }

  // Fallback to direct URL if no jobId
  return url;
}

/**
 * Convert any direct S3 or raw GLB URL into an auth-friendly backend proxy URL.
 * Prevents browser CORS errors when loading S3 models in ThreeViewer.
 */
export function getProxiedGlbUrl(
  urlOrJobId: string | null | undefined,
): string | null {
  if (!urlOrJobId) {
    return null;
  }
  const s = urlOrJobId.trim();
  if (!s) {
    return null;
  }

  // Blob or data URLs (e.g. locally dropped or generated files)
  if (s.startsWith("blob:") || s.startsWith("data:")) {
    return s;
  }

  // Already proxied via backend
  if (s.startsWith(backendBase) && s.includes("/api/3d/glb/")) {
    return s;
  }

  // Raw UUID job ID
  const uuidRegex =
    /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
  if (/^[0-9a-fA-F-]{36}$/.test(s)) {
    return `${backendBase}/api/3d/glb/${s}`;
  }

  // S3 or external URL containing a job UUID
  const match = s.match(uuidRegex);
  if (
    match &&
    (s.includes("amazonaws.com") ||
      s.includes("s3.") ||
      s.includes("hydrilla-outputs") ||
      s.includes("/mesh.glb"))
  ) {
    return `${backendBase}/api/3d/glb/${match[0]}`;
  }

  return s;
}

/**
 * Get proxy GLB URL from job ID (for BackendJob objects)
 */
export function getProxyGlbUrl(jobId: string): string {
  return `${backendBase}/api/3d/glb/${jobId}`;
}

/**
 * Download a GLB through the auth-gated proxy (anchor tags cannot send Bearer tokens).
 */
export async function downloadGlbWithAuth(
  glbUrl: string,
  filename: string,
  getToken: () => Promise<string | null>,
): Promise<void> {
  const targetUrl = getProxiedGlbUrl(glbUrl) || glbUrl;
  const token = await getToken();
  const isBackendUrl =
    !targetUrl.startsWith("blob:") &&
    !targetUrl.startsWith("data:") &&
    (targetUrl.startsWith(backendBase) ||
      targetUrl.startsWith("/") ||
      targetUrl.includes("/api/3d/glb/"));
  const headers: HeadersInit =
    token && isBackendUrl ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(targetUrl, {
    headers,
    credentials: isBackendUrl ? "include" : "omit",
  });
  if (!res.ok) {
    throw new Error(`Failed to download model (${res.status})`);
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = objectUrl;
    a.download = filename.endsWith(".glb") ? filename : `${filename}.glb`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Extract target URL if input is wrapped in backend /api/3d/image-proxy
 */
export function unwrapProxiedImageUrl(
  url: string | null | undefined,
): string | null {
  if (!url) {
    return null;
  }
  const s = url.trim();
  if (s.includes("/api/3d/image-proxy")) {
    try {
      const parsed = new URL(s, "http://localhost");
      const real = parsed.searchParams.get("url");
      if (real) {
        return real;
      }
    } catch {
      const idx = s.indexOf("?url=");
      if (idx !== -1) {
        return decodeURIComponent(s.slice(idx + 5));
      }
    }
  }
  return s;
}

/**
 * Proxy S3 / gateway image URLs through the backend to avoid CORS.
 * - data:/blob:/already-proxied → returned as-is
 * - Anything else → returned as-is (won't be proxied) unless S3/gateway
 */
export function getProxiedImageUrl(
  url: string | null | undefined,
): string | null {
  if (!url) {
    return null;
  }
  const s = url.trim();
  if (!s) {
    return null;
  }

  if (s.startsWith("data:") || s.startsWith("blob:")) {
    return s;
  }
  if (s.includes("/api/3d/image-proxy")) {
    if (!s.includes("?url=")) {
      return null;
    }
    return s;
  }
  if (s.startsWith(backendBase)) {
    return s;
  }

  const resolved = s.startsWith("/") ? resolveImageUrl(s) : s;
  if (
    resolved.includes("amazonaws.com") ||
    resolved.includes("s3.") ||
    isGatewayOutputImageUrl(resolved)
  ) {
    return `${backendBase}/api/3d/image-proxy?url=${encodeURIComponent(resolved)}`;
  }
  return resolved;
}

/**
 * Get preview image URL from job result
 * Also tries preview/{jobId}/preview_image.png path if the main URL doesn't work
 */
export function getPreviewImageUrl(job: Job): string | null {
  if (!job.result) return null;
  const url =
    job.result.processed_image_url ||
    job.result.generated_image_url ||
    job.result.processed_image ||
    job.result.generated_image ||
    null;

  // If we have a URL, proxy it so private S3 and gateway output URLs load reliably.
  if (url) return getProxiedImageUrl(url);

  // If no URL but we have a job_id, try gateway output path (file may not be on public S3).
  if (job.job_id) {
    const base = getPrimaryUrl().replace(/\/$/, "");
    return getProxiedImageUrl(
      `${base}/outputs/preview/${job.job_id}/preview_image.png`,
    );
  }

  return null;
}

export async function fetchHistory(
  getToken?: () => Promise<string | null>,
): Promise<BackendJob[]> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (getToken) {
    const token = await getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  try {
    const url = `${backendBase}/api/3d/history`;

    // Add timeout to prevent hanging requests (30 seconds for database queries)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const res = await fetch(url, {
        headers,
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Check if response is ok
      if (!res.ok) {
        let errorText: string;
        try {
          const errorData = await res.json();
          errorText =
            errorData.error ||
            `Failed to fetch history: ${res.status} ${res.statusText}`;
        } catch {
          errorText =
            (await res.text()) ||
            `Failed to fetch history: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorText);
      }

      // Parse response
      let data: any;
      try {
        const text = await res.text();
        if (!text) {
          return [];
        }
        data = JSON.parse(text);
      } catch {
        throw new Error("Invalid response format from backend");
      }

      // Handle both { jobs: [...] } and direct array response
      return Array.isArray(data) ? data : data.jobs || [];
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);

      // Handle abort (timeout)
      if (fetchErr.name === "AbortError") {
        throw new Error(
          "Request timeout: Backend took too long to respond (30s timeout)",
        );
      }
      throw fetchErr;
    }
  } catch (err: any) {
    // Handle network errors
    const isNetworkError =
      err.name === "TypeError" &&
      (err.message.includes("fetch") ||
        err.message.includes("Failed to fetch") ||
        err.message.includes("NetworkError") ||
        err.message.includes("Network request failed"));

    if (isNetworkError) {
      // For history fetching, return empty array instead of throwing error
      // This allows the app to continue working even if history can't be loaded
      console.warn(
        "Failed to fetch history - backend may be temporarily unavailable:",
        err.message,
      );
      return [];
    }

    // Re-throw other errors (API errors, parsing errors, etc.)
    throw err;
  }
}

/**
 * Delete a job (requires auth)
 */
export async function deleteJob(
  jobId: string,
  getToken: () => Promise<string | null>,
): Promise<void> {
  const token = await getToken();
  if (!token) {
    throw new Error("Authentication required");
  }

  const res = await fetch(`${backendBase}/api/3d/jobs/${jobId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to delete job");
  }
}

/**
 * Cancel a job. Water (`wt_` / `cs_`) → /api/water/jobs/:id/cancel.
 * Cloud 3D / image → /api/3d/cancel/:id (proxies to GPU).
 */
export async function cancelJob(
  jobId: string,
  getToken?: () => Promise<string | null>,
): Promise<void> {
  const headers: HeadersInit = {};
  if (getToken) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const isWater = jobId.startsWith("wt_") || jobId.startsWith("cs_");
  const url = isWater
    ? `${backendBase}/api/water/jobs/${jobId}/cancel`
    : `${backendBase}/api/3d/cancel/${jobId}`;
  const res = await fetch(url, {
    method: "POST",
    headers,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to cancel job");
  }
}

/**
 * Sync user to backend database (call after login)
 */
export async function syncUser(
  getToken: () => Promise<string | null>,
): Promise<{ success: boolean; user?: any }> {
  const token = await getToken();
  if (!token) {
    return { success: false };
  }

  try {
    const res = await fetch(`${backendBase}/api/3d/sync-user`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return { success: false };
    }

    const data = await res.json();
    return { success: true, user: data.user };
  } catch {
    return { success: false };
  }
}

export type CurrentUserResult =
  | { ok: true; user: any; stats: any }
  | { ok: false; reason: "no_token" | "http_error" | "network_error" };

/**
 * Get current user profile from backend.
 * Distinguishes transport/auth failures from a successful profile response.
 */
export async function getCurrentUser(
  getToken: () => Promise<string | null>,
): Promise<CurrentUserResult> {
  let token: string | null;
  try {
    token = await getToken();
  } catch {
    return { ok: false, reason: "no_token" };
  }

  if (!token) {
    return { ok: false, reason: "no_token" };
  }

  try {
    const res = await fetch(`${backendBase}/api/3d/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return { ok: false, reason: "http_error" };
    }

    const data = await res.json();
    return { ok: true, user: data.user, stats: data.stats };
  } catch {
    return { ok: false, reason: "network_error" };
  }
}

// ============================================
// WORKSPACE API
// ============================================

/**
 * Fetch all workspaces for the current user
 */
export async function fetchWorkspaces(
  getToken?: () => Promise<string | null>,
): Promise<Workspace[]> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (getToken) {
      const token = await getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(
      `${backendBase}/api/3d/workspaces?t=${Date.now()}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      if (response.status === 500) {
        const errorData = await response.json().catch(() => ({}));
        if (
          errorData.error?.includes("relation") ||
          errorData.error?.includes("does not exist")
        ) {
          console.warn("Workspaces table not found, returning empty array.");
          return [];
        }
      }
      throw new Error(`Failed to fetch workspaces: ${response.statusText}`);
    }

    const data = await response.json();
    return data.workspaces || [];
  } catch (err: any) {
    console.error("Failed to fetch workspaces:", err);
    return [];
  }
}

/**
 * Create a new workspace
 */
export async function createWorkspaceApi(
  name?: string,
  getToken?: () => Promise<string | null>,
): Promise<Workspace> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (getToken) {
    const token = await getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${backendBase}/api/3d/workspaces`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: name || "Untitled Workspace" }),
    });
  } catch {
    throw new Error(
      `Cannot reach backend at ${backendBase}. Is the API running?`,
    );
  }

  if (!response.ok) {
    const body = await response
      .json()
      .catch(() => ({}) as { error?: string; message?: string });
    throw new Error(
      body.message ||
        body.error ||
        `Failed to create workspace (${response.status})`,
    );
  }

  const data = await response.json();
  return data.workspace;
}

/**
 * Get a workspace by ID
 */
export async function fetchWorkspace(
  workspaceId: string,
  getToken?: () => Promise<string | null>,
): Promise<Workspace | null> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (getToken) {
      const token = await getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(
      `${backendBase}/api/3d/workspaces/${workspaceId}`,
      {
        method: "GET",
        headers,
      },
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Failed to fetch workspace: ${response.statusText}`);
    }

    const data = await response.json();
    return data.workspace || null;
  } catch (err: any) {
    console.error("Failed to fetch workspace:", err);
    return null;
  }
}

/**
 * Get all jobs for a workspace
 */
export async function fetchWorkspaceJobs(
  workspaceId: string,
  getToken?: () => Promise<string | null>,
): Promise<BackendJob[]> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (getToken) {
      const token = await getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(
      `${backendBase}/api/3d/workspaces/${workspaceId}/jobs?t=${Date.now()}`,
      {
        method: "GET",
        headers,
        cache: "no-store",
      },
    );

    if (!response.ok) {
      if (response.status === 404) return [];
      throw new Error(`Failed to fetch workspace jobs: ${response.statusText}`);
    }

    const data = await response.json();
    return data.jobs || [];
  } catch (err: any) {
    console.error("Failed to fetch workspace jobs:", err);
    return [];
  }
}

/**
 * Update workspace name
 */
export async function updateWorkspaceNameApi(
  workspaceId: string,
  name: string,
  getToken?: () => Promise<string | null>,
): Promise<void> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (getToken) {
    const token = await getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(
    `${backendBase}/api/3d/workspaces/${workspaceId}/name`,
    {
      method: "PATCH",
      headers,
      body: JSON.stringify({ name }),
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to update workspace name: ${response.statusText}`);
  }
}

/**
 * Delete a workspace
 */
export async function deleteWorkspaceApi(
  workspaceId: string,
  getToken?: () => Promise<string | null>,
): Promise<void> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (getToken) {
    const token = await getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(
    `${backendBase}/api/3d/workspaces/${workspaceId}`,
    {
      method: "DELETE",
      headers,
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to delete workspace: ${response.statusText}`);
  }
}

// ---------------------------------------------------------------------------
// BYOK / Water (user keys + procedural Three.js)
// ---------------------------------------------------------------------------

async function authHeaders(
  getToken?: () => Promise<string | null>,
): Promise<HeadersInit> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (getToken) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchUserApiKeys(
  getToken?: () => Promise<string | null>,
): Promise<{
  keys: UserApiKeyMeta[];
  sharedKeys: UserApiKeyMeta[];
  prefs: UserModelPrefs;
  connectors: ConnectorPublic[];
}> {
  const res = await fetch(`${backendBase}/api/user/api-keys`, {
    headers: await authHeaders(getToken),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error || "Failed to load API keys",
    );
  }
  const body = (await res.json()) as {
    keys: UserApiKeyMeta[];
    sharedKeys?: UserApiKeyMeta[];
    prefs: UserModelPrefs;
    connectors?: ConnectorPublic[];
  };
  return {
    keys: body.keys,
    sharedKeys: body.sharedKeys ?? [],
    prefs: body.prefs,
    connectors: body.connectors ?? [],
  };
}

export async function saveUserApiKey(
  provider: string,
  apiKey: string,
  getToken?: () => Promise<string | null>,
): Promise<UserApiKeyMeta> {
  const res = await fetch(`${backendBase}/api/user/api-keys/${provider}`, {
    method: "PUT",
    headers: await authHeaders(getToken),
    body: JSON.stringify({ apiKey }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { error?: string }).error || "Failed to save API key",
    );
  }
  return (body as { key: UserApiKeyMeta }).key;
}

export async function verifyUserApiKey(
  provider: string,
  getToken?: () => Promise<string | null>,
): Promise<{ ok: boolean; status: string; error: string | null }> {
  const res = await fetch(
    `${backendBase}/api/user/api-keys/${provider}/verify`,
    {
      method: "POST",
      headers: await authHeaders(getToken),
    },
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { error?: string }).error || "Verification failed",
    );
  }
  return body as { ok: boolean; status: string; error: string | null };
}

export async function deleteUserApiKey(
  provider: string,
  getToken?: () => Promise<string | null>,
): Promise<void> {
  const res = await fetch(`${backendBase}/api/user/api-keys/${provider}`, {
    method: "DELETE",
    headers: await authHeaders(getToken),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error || "Failed to remove key",
    );
  }
}

export async function saveUserModelPrefs(
  prefs: {
    defaultMeshModel?: string;
    defaultCodeModel?: string | null;
    enabledCodeModels?: string[] | null;
  },
  getToken?: () => Promise<string | null>,
): Promise<UserModelPrefs> {
  const res = await fetch(`${backendBase}/api/user/model-prefs`, {
    method: "PATCH",
    headers: await authHeaders(getToken),
    body: JSON.stringify(prefs),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { error?: string }).error || "Failed to save model preference",
    );
  }
  return (body as { prefs: UserModelPrefs }).prefs;
}

export type OpenRouterFreeModelRow = {
  id: string;
  name: string;
  vision: boolean;
  contextLength: number | null;
};

export async function fetchWaterModels(
  getToken?: () => Promise<string | null>,
): Promise<{ groups: WaterModelGroup[]; syncedAt: string }> {
  const res = await fetch(`${backendBase}/api/user/models`, {
    headers: await authHeaders(getToken),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { error?: string }).error || "Failed to load Water models",
    );
  }
  return body as { groups: WaterModelGroup[]; syncedAt: string };
}

export async function fetchOpenRouterFreeModels(
  getToken?: () => Promise<string | null>,
): Promise<{
  models: OpenRouterFreeModelRow[];
  syncedAt: string;
  note?: string;
}> {
  const res = await fetch(`${backendBase}/api/user/openrouter/free-models`, {
    headers: await authHeaders(getToken),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { error?: string }).error ||
        "Failed to sync OpenRouter free models",
    );
  }
  return body as {
    models: OpenRouterFreeModelRow[];
    syncedAt: string;
    note?: string;
  };
}

export type CursorModelRow = {
  id: string;
  displayName: string;
  isAuto?: boolean;
};

/** Live Cursor Cloud Agents models (requires a saved Cursor key). */
export async function fetchCursorModels(
  getToken?: () => Promise<string | null>,
): Promise<{ models: CursorModelRow[]; syncedAt: string; note?: string }> {
  const res = await fetch(`${backendBase}/api/user/cursor/models`, {
    headers: await authHeaders(getToken),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { error?: string }).error || "Failed to sync Cursor models",
    );
  }
  return body as { models: CursorModelRow[]; syncedAt: string; note?: string };
}

export async function fetchOpenRouterKeyStatus(
  getToken?: () => Promise<string | null>,
): Promise<{
  label: string | null;
  limit: number | null;
  usage: number | null;
  isFreeTier: boolean | null;
}> {
  const res = await fetch(`${backendBase}/api/user/openrouter/key-status`, {
    headers: await authHeaders(getToken),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { error?: string }).error ||
        "Failed to load OpenRouter key status",
    );
  }
  return (body as { status: any }).status;
}

/**
 * Water engine: text → procedural Three.js (bring-your-own-key, no GPU).
 * `imageUrl` is an optional extra reference — prompt alone is enough.
 * Calls `/api/water/*` (legacy `/api/code-sculpt/*` remains mounted on the backend).
 */
export async function submitWater(params: {
  prompt: string;
  modelId: string;
  imageUrl?: string | null;
  workspaceId?: string | null;
  parentJobId?: string | null;
  qualityTier?: "fast" | "standard" | "studio";
  skillId?: string | null;
  factoryCode?: string | null;
  getToken?: () => Promise<string | null>;
}): Promise<{
  job_id: string;
  mode: "text_to_code" | "image_to_code";
}> {
  const res = await fetch(`${backendBase}/api/water/generate`, {
    method: "POST",
    headers: await authHeaders(params.getToken),
    body: JSON.stringify({
      prompt: params.prompt,
      modelId: params.modelId,
      imageUrl: params.imageUrl || undefined,
      workspaceId: params.workspaceId || undefined,
      parentJobId: params.parentJobId || undefined,
      qualityTier: params.qualityTier || undefined,
      skillId:
        params.skillId && params.skillId !== "auto"
          ? params.skillId
          : undefined,
      factoryCode: params.factoryCode || undefined,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { message?: string; error?: string }).message ||
        (body as { error?: string }).error ||
        "Water failed",
    );
  }
  return {
    job_id: (body as { jobId?: string }).jobId || "",
    mode:
      (body as { mode?: "text_to_code" | "image_to_code" }).mode ||
      "text_to_code",
  };
}

export async function fetchWaterJob(
  jobId: string,
  getToken?: () => Promise<string | null>,
): Promise<{
  id: string;
  status: BackendJobStatus;
  factoryCode: string | null;
  sculptPass: string | null;
  errorMessage: string | null;
  previewImageUrl: string | null;
  imageUrl: string | null;
  llmModel: string | null;
  llmProvider: string | null;
  llmInputTokens: number | null;
  llmOutputTokens: number | null;
  llmTotalTokens: number | null;
  durationMs: number | null;
  prompt: string | null;
  visualEvidence: WaterVisualEvidence | null;
  scene: WaterSceneBundle | null;
}> {
  const res = await fetch(`${backendBase}/api/water/jobs/${jobId}`, {
    headers: await authHeaders(getToken),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { error?: string }).error || "Failed to load Water job",
    );
  }
  const job = (body as { job: any }).job;
  return {
    id: job.id,
    status: job.status,
    factoryCode: job.factoryCode ?? null,
    sculptPass: job.sculptPass ?? null,
    errorMessage: job.errorMessage ?? null,
    previewImageUrl: job.previewImageUrl ?? null,
    imageUrl: job.imageUrl ?? null,
    llmModel: job.llmModel ?? null,
    llmProvider: job.llmProvider ?? null,
    llmInputTokens: job.llmInputTokens ?? null,
    llmOutputTokens: job.llmOutputTokens ?? null,
    llmTotalTokens: job.llmTotalTokens ?? null,
    durationMs: typeof job.durationMs === "number" ? job.durationMs : null,
    prompt: job.prompt ?? null,
    visualEvidence: (job.visualEvidence as WaterVisualEvidence | null) ?? null,
    scene: (job.scene as WaterSceneBundle | null) ?? null,
  };
}

export type WaterUsageRow = {
  id: string;
  prompt: string | null;
  status: string;
  model: string | null;
  provider: string | null;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  createdAt: string;
};

/** List Water jobs with LLM token usage for the current user. */
export async function fetchWaterUsage(
  getToken?: () => Promise<string | null>,
  limit = 100,
): Promise<WaterUsageRow[]> {
  const res = await fetch(`${backendBase}/api/water/usage?limit=${limit}`, {
    headers: await authHeaders(getToken),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { error?: string }).error || "Failed to load Water usage",
    );
  }
  return ((body as { jobs?: WaterUsageRow[] }).jobs || []) as WaterUsageRow[];
}

/** Persist a canvas screenshot as the Water library thumbnail. */
export async function saveWaterThumbnail(
  jobId: string,
  dataUrl: string,
  getToken?: () => Promise<string | null>,
): Promise<string> {
  const res = await fetch(`${backendBase}/api/water/jobs/${jobId}/thumbnail`, {
    method: "POST",
    headers: await authHeaders(getToken),
    body: JSON.stringify({ dataUrl }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { error?: string }).error || "Failed to save thumbnail",
    );
  }
  return (body as { previewImageUrl?: string }).previewImageUrl || dataUrl;
}

export async function saveWaterFactory(
  jobId: string,
  factoryCode: string,
  getToken?: () => Promise<string | null>,
): Promise<{
  factoryCode: string;
  visual: WaterVisualEvidence;
}> {
  const res = await fetch(`${backendBase}/api/water/jobs/${jobId}/factory`, {
    method: "PATCH",
    headers: await authHeaders(getToken),
    body: JSON.stringify({ factoryCode }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { message?: string; error?: string }).message ||
        (body as { error?: string }).error ||
        "Failed to save factory",
    );
  }
  return body as {
    factoryCode: string;
    visual: WaterVisualEvidence;
  };
}

export async function sendWaterChat(params: {
  jobId: string;
  message: string;
  modelId: string;
  getToken?: () => Promise<string | null>;
}): Promise<{
  kind: string;
  reply: string;
  refinePrompt: string | null;
  scene: WaterSceneBundle | null;
  visual: WaterVisualEvidence | null;
}> {
  const res = await fetch(`${backendBase}/api/water/chat`, {
    method: "POST",
    headers: await authHeaders(params.getToken),
    body: JSON.stringify({
      jobId: params.jobId,
      message: params.message,
      modelId: params.modelId,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error || "Follow-up failed");
  }
  return body as {
    kind: string;
    reply: string;
    refinePrompt: string | null;
    scene: WaterSceneBundle | null;
    visual: WaterVisualEvidence | null;
  };
}

export async function fetchWaterMessages(
  jobId: string,
  getToken?: () => Promise<string | null>,
): Promise<WaterChatMessage[]> {
  const res = await fetch(`${backendBase}/api/water/jobs/${jobId}/messages`, {
    headers: await authHeaders(getToken),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  return (
    (
      body as {
        messages?: Array<{
          id: string;
          role: string;
          content: string;
          created_at: string;
        }>;
      }
    ).messages || []
  ).map((m) => ({
    id: m.id,
    role: m.role === "assistant" ? "assistant" : "user",
    content: m.content,
    createdAt: m.created_at,
  }));
}

export async function patchWaterScene(params: {
  jobId: string;
  op: "move" | "rotate" | "scale" | "material";
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  /** Mesh name — with `material`, saves a per-part override. */
  name?: string;
  material?: WaterMaterialPatch;
  getToken?: () => Promise<string | null>;
}): Promise<WaterSceneBundle | null> {
  const res = await fetch(
    `${backendBase}/api/water/jobs/${params.jobId}/scene`,
    {
      method: "PATCH",
      headers: await authHeaders(params.getToken),
      body: JSON.stringify({
        op: params.op,
        position: params.position,
        rotation: params.rotation,
        scale: params.scale,
        name: params.name,
        material: params.material,
      }),
    },
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { error?: string }).error || "Failed to update scene",
    );
  }
  return (body as { scene?: WaterSceneBundle }).scene || null;
}

export type DeveloperApiKeyMeta = {
  id: string;
  name: string;
  keyPrefix: string;
  status: "active" | "revoked";
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
  totalCreditsUsed?: number;
  totalRequests?: number;
};

export type DeveloperApiKeyUsageRecord = {
  id: string;
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  creditsDeducted: number;
  details: Record<string, unknown>;
  createdAt: string;
};

export type DeveloperApiKeyDetails = {
  key: DeveloperApiKeyMeta;
  summary: {
    totalCreditsUsed: number;
    totalRequests: number;
    credits3d: number;
    credits2d: number;
    requests3d: number;
    requests2d: number;
    endpointCounts: Record<string, { requests: number; credits: number }>;
  };
  recentLogs: DeveloperApiKeyUsageRecord[];
};

export async function fetchDeveloperApiKeys(
  getToken?: () => Promise<string | null>,
): Promise<DeveloperApiKeyMeta[]> {
  const res = await fetch(`${backendBase}/api/user/developer-keys`, {
    headers: await authHeaders(getToken),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { error?: string }).error ||
        "Failed to fetch developer API keys",
    );
  }
  return (body.keys || []) as DeveloperApiKeyMeta[];
}

export async function fetchDeveloperKeyDetails(
  keyId: string,
  getToken?: () => Promise<string | null>,
): Promise<DeveloperApiKeyDetails> {
  const res = await fetch(`${backendBase}/api/user/developer-keys/${keyId}`, {
    headers: await authHeaders(getToken),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { error?: string }).error ||
        "Failed to fetch developer API key details",
    );
  }
  return (body as { details: DeveloperApiKeyDetails }).details;
}

export async function createDeveloperApiKey(
  name: string,
  getToken?: () => Promise<string | null>,
): Promise<{ apiKey: string; meta: DeveloperApiKeyMeta }> {
  const res = await fetch(`${backendBase}/api/user/developer-keys`, {
    method: "POST",
    headers: await authHeaders(getToken),
    body: JSON.stringify({ name }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { error?: string }).error ||
        "Failed to create developer API key",
    );
  }
  return body as { apiKey: string; meta: DeveloperApiKeyMeta };
}

export async function revokeDeveloperApiKey(
  keyId: string,
  getToken?: () => Promise<string | null>,
): Promise<void> {
  const res = await fetch(`${backendBase}/api/user/developer-keys/${keyId}`, {
    method: "DELETE",
    headers: await authHeaders(getToken),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ||
        "Failed to revoke developer API key",
    );
  }
}
