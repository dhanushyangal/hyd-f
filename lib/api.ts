import {
  getPrimaryUrl,
  isPrimaryUp,
  markPrimaryDown,
  onHealthChange,
  canEdit,
  canCombine,
  onFeaturesChange,
  getHealthState,
} from "./apiHealth";

// Re-export health utilities for UI components

export { isPrimaryUp, onHealthChange, canEdit, canCombine, onFeaturesChange, getHealthState };

const apiBase = getPrimaryUrl();

// Backend URL - must be set in Vercel environment variables as NEXT_PUBLIC_BACKEND_URL
const getBackendBase = (): string => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url || url === "NEXT_PUBLIC_BACKEND_URL" || url.includes("NEXT_PUBLIC_BACKEND_URL")) {
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
export async function notifyGpuOffline(errorMessage: string, getToken?: () => Promise<string | null>) {
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
          console.warn("Failed to send GPU offline notification:", res.status, res.statusText);
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

export type JobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

// Queue information for accurate time estimation
export interface QueueInfo {
  position: number;  // 0 = processing, 1+ = waiting
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
  queue?: QueueInfo;  // Queue position and wait time
  result?: {
    job_id: string;
    mode: "text-to-3d" | "image-to-3d";
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
  parentJobIds?: string[];       // All parent IDs (multi-parent merges)
  sourceImages?: string[] | null; // Actual source image URLs used as input
  engine?: string | null;
  resultKind?: string | null;
  factoryCode?: string | null;
  /** Library list may set this instead of shipping full factoryCode */
  hasFactoryCode?: boolean;
  sculptPass?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UserApiKeyMeta = {
  provider: "anthropic" | "openai" | "gemini" | "openrouter" | "cursor";
  label?: string;
  configured: boolean;
  last4: string | null;
  status: "unchecked" | "valid" | "invalid";
  lastError: string | null;
  verifiedAt: string | null;
  updatedAt: string | null;
};

export type UserModelPrefs = {
  defaultMeshModel: string;
  defaultCodeModel: string | null;
};


/**
 * Transform backend job format to frontend Job format
 */
function transformBackendJobToJob(backendJob: BackendJob | any): Job {
  // Map backend status to frontend status
  const statusMap: Record<BackendJobStatus, JobStatus> = {
    "WAIT": "pending",
    "RUN": "processing",
    "DONE": "completed",
    "FAIL": "failed"
  };

  return {
    job_id: backendJob.id,
    status: statusMap[backendJob.status as BackendJobStatus] || "pending",
    progress: backendJob.status === "DONE" ? 100 : backendJob.status === "RUN" ? 50 : 0,
    message: backendJob.errorMessage || (backendJob.status === "DONE" ? "Completed" : "Processing..."),
    created_at: backendJob.createdAt ? new Date(backendJob.createdAt).getTime() : undefined,
    updated_at: backendJob.updatedAt ? new Date(backendJob.updatedAt).getTime() : undefined,
    result: backendJob.resultGlbUrl || backendJob.previewImageUrl ? {
      job_id: backendJob.id,
      mode: backendJob.prompt ? "text-to-3d" : "image-to-3d",
      prompt: backendJob.prompt || undefined,
      mesh_url: backendJob.resultGlbUrl || undefined,
      processed_image_url: backendJob.previewImageUrl || undefined,
      generated_image_url: backendJob.previewImageUrl || undefined,
      output: backendJob.resultGlbUrl || undefined,
      elapsed_seconds: 0
    } : undefined,
    error: backendJob.errorMessage || undefined
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
  sourceImages?: string[] | null
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
      previewImageUrl 
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

/**
 * Poll backend job status until completed, failed, or cancelled.
 * Never calls the GPU gateway from the browser.
 */
async function pollBackendStatusUntilCompleted(
  jobId: string,
  getToken: () => Promise<string | null>,
  options?: { maxWaitMs?: number; intervalMs?: number }
): Promise<{ status: string; result?: { image_url?: string }; image_url?: string; error?: string; job?: any }> {
  const maxWaitMs = options?.maxWaitMs ?? 120_000; // 2 min
  const intervalMs = options?.intervalMs ?? 2000;
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const token = await getToken();
    if (!token) throw new Error("Authentication required");
    const res = await fetch(`${backendBase}/api/3d/status/${jobId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || "Failed to fetch status");
    }
    const data = await res.json();
    const job = data.job || data;
    const status = (job.status as string) || (data.status as string);
    // Backend uses DONE/FAIL; gateway used completed/failed
    if (status === "DONE" || status === "completed") {
      return {
        status: "completed",
        image_url: job.previewImageUrl || job.image_url || data.image_url,
        result: { image_url: job.previewImageUrl || job.image_url },
        job,
      };
    }
    if (status === "FAIL" || status === "failed" || status === "cancelled") {
      throw new Error(job.errorMessage || data.error || data.message || `Job ${status}`);
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error("Preview timed out. Please try again.");
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
    url.includes("/outputs/edit/") ||
    url.includes("/outputs/combined/")
  );
}

/**
 * Generate preview image from text prompt via Node backend (auth required; credits deducted).
 * Gateway may return immediately (sync) with image_url, or async (pending) — we poll until completed.
 */
export async function generatePreviewImage(
  prompt: string,
  getToken?: () => Promise<string | null>,
  context?: {
    chatId?: string | null;
    workspaceId?: string | null;
    parentJobId?: string | null;
    parentJobIds?: string[] | null;
  }
): Promise<{ 
  image_url: string; 
  preview_id: string;
  queue?: QueueInfo;
}> {
  if (!getToken) {
    throw new Error("Authentication required");
  }
  const token = await getToken();
  if (!token) {
    throw new Error("Authentication required");
  }

  const parseErrorResponse = async (res: Response): Promise<string> => {
    try {
      const data = await res.json();
      return data.error || "Failed to generate preview image";
    } catch {
      return (await res.text()) || "Failed to generate preview image";
    }
  };

  const handleResult = async (result: any) => {
    const previewId = result.preview_id ?? result.job_id;
    const resolve = (url: string) => resolveLoadableImageUrl(url);

    if (result.status === "pending" || result.status === "queued" || (result.image_url == null && previewId)) {
      const statusData = await pollBackendStatusUntilCompleted(previewId, getToken);
      const imageUrl = statusData.image_url ?? statusData.result?.image_url ?? "";
      return { image_url: resolve(imageUrl), preview_id: previewId, queue: result.queue };
    }

    return { image_url: resolve(result.image_url ?? ""), preview_id: previewId, queue: result.queue };
  };

  try {
    const res = await fetch(`${backendBase}/api/3d/text-to-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        prompt: prompt.trim(),
        chatId: context?.chatId || undefined,
        workspaceId: context?.workspaceId || undefined,
        parentJobId: context?.parentJobId || undefined,
        parentJobIds: context?.parentJobIds && context.parentJobIds.length > 0 ? context.parentJobIds : undefined,
      }),
    });
    if (res.status === 402) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || "Insufficient credits. Please subscribe or buy more credits.");
    }
    if (!res.ok) throw new Error(await parseErrorResponse(res));
    const result = await res.json();
    return await handleResult(result);
  } catch (err: any) {
    if (err?.message?.includes("credits") || err?.message?.includes("Insufficient") || err?.message?.includes("Authentication")) throw err;
    if (isApiUnavailableError(err)) {
      if (shouldNotifyGpuOffline(err)) notifyGpuOffline(err.message || "API unavailable", getToken);
      throw new Error(getGpuOfflineErrorMessage());
    }
    throw err;
  }
}

/**
 * Edit image with prompt (image-to-image).
 * Gateway may return sync image_url or async (pending) — we poll until completed.
 */
export async function editImage(
  prompt: string,
  imageFile?: File | null,
  imageUrl?: string | null,
  getToken?: () => Promise<string | null>,
  context?: {
    chatId?: string | null;
    workspaceId?: string | null;
    parentJobId?: string | null;
    parentJobIds?: string[] | null;
    sourceImages?: string[] | null;
  }
): Promise<{ edit_id: string; image_url: string; prompt: string; strength: number }> {
  const formData = new FormData();
  formData.append("prompt", prompt.trim());
  if (imageFile) {
    formData.append("image", imageFile);
  } else if (imageUrl) {
    formData.append("image_url", imageUrl);
  } else {
    throw new Error("Either image file or image URL is required");
  }
  if (context?.chatId) formData.append("chatId", context.chatId);
  if (context?.workspaceId) formData.append("workspaceId", context.workspaceId);
  if (context?.parentJobId) formData.append("parentJobId", context.parentJobId);
  if (context?.parentJobIds && context.parentJobIds.length > 0) {
    formData.append("parentJobIds", JSON.stringify(context.parentJobIds));
  }
  if (context?.sourceImages && context.sourceImages.length > 0) {
    formData.append("sourceImages", JSON.stringify(context.sourceImages));
  }

  const doRequest = async (url: string, headers: HeadersInit) => {
    const res = await fetch(url, { method: "POST", headers, body: formData });
    if (res.status === 402) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || "Insufficient credits. Please subscribe or buy more credits.");
    }
    if (!res.ok) {
      let errorText: string;
      let code: string | undefined;
      try {
        const errorData = await res.json();
        errorText = errorData.error || "Failed to edit image";
        code = errorData.code;
      } catch {
        errorText = (await res.text()) || "Failed to edit image";
      }
      if (res.status === 403 || code === "FEATURE_UNAVAILABLE") {
        throw new Error(errorText || "Edit is not available on this GPU tier.");
      }
      throw new Error(errorText);
    }
    return res.json();
  };

  try {
    if (!getToken) {
      throw new Error("Authentication required");
    }
    const token = await getToken();
    if (!token) {
      throw new Error("Authentication required");
    }
    const result = await doRequest(`${backendBase}/api/3d/edit-image`, {
      Authorization: `Bearer ${token}`,
    });
    const editId = result.edit_id ?? result.job_id;
    if (result.status === "pending" || result.status === "queued" || (result.image_url == null && editId)) {
      const statusData = await pollBackendStatusUntilCompleted(editId, getToken);
      const imageUrlFromStatus = statusData.image_url ?? statusData.result?.image_url ?? "";
      return {
        edit_id: editId,
        image_url: resolveLoadableImageUrl(imageUrlFromStatus),
        prompt: result.prompt || prompt,
        strength: result.strength ?? 0.6,
      };
    }
    return {
      edit_id: editId,
      image_url: resolveLoadableImageUrl(result.image_url || ""),
      prompt: result.prompt || prompt,
      strength: result.strength ?? 0.6,
    };
  } catch (err: any) {
    if (err?.message?.includes("credits") || err?.message?.includes("Insufficient") || err?.message?.includes("Authentication")) throw err;
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

/**
 * Fetch a remote image URL and convert it to a File object for FormData uploads.
 * Routes through our backend image proxy to avoid S3 CORS issues.
 */
async function urlToFile(url: string, filename: string): Promise<File> {
  // Use the backend proxy to avoid CORS when fetching S3 images
  const proxyUrl = getProxiedImageUrl(url) || url;
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);
  const blob = await response.blob();

  // Determine extension from URL
  const rawExt = (url.split(".").pop()?.split("?")[0] || "png").toLowerCase();
  const ext = ["jpg", "jpeg", "png", "webp", "gif"].includes(rawExt) ? rawExt : "png";

  // Always use a real image/* mimetype. S3 may return "application/octet-stream"
  // when objects were uploaded without ContentType — that would cause the backend
  // multer fileFilter to reject the upload.
  const blobType = (blob.type || "").toLowerCase();
  const mimeType = blobType.startsWith("image/")
    ? blobType
    : `image/${ext === "jpg" ? "jpeg" : ext}`;

  // Re-wrap blob with the corrected type so the resulting File reports it.
  const typed = new Blob([blob], { type: mimeType });
  return new File([typed], `${filename}.${ext}`, { type: mimeType });
}

/**
 * Combined edit: Prompt + 2 images -> one combined/edited image.
 * Gateway may return sync image_url or async (pending) — we poll until completed.
 */
export async function combinedEdit(
  prompt: string,
  imageFile1: File | null,
  imageFile2: File | null,
  getToken?: () => Promise<string | null>,
  imageUrl1?: string | null,
  imageUrl2?: string | null,
  context?: {
    chatId?: string | null;
    workspaceId?: string | null;
    parentJobId?: string | null;
    parentJobIds?: string[] | null;
    sourceImages?: string[] | null;
  }
): Promise<{ combined_id: string; image_url: string; prompt: string; prompt_used: string }> {
  const file1 = imageFile1 || (imageUrl1 ? await urlToFile(imageUrl1, "image_1") : null);
  const file2 = imageFile2 || (imageUrl2 ? await urlToFile(imageUrl2, "image_2") : null);

  if (!file1 || !file2) {
    throw new Error("Both images are required for combined edit");
  }

  const formData = new FormData();
  formData.append("prompt", prompt.trim());
  formData.append("image_1", file1);
  formData.append("image_2", file2);
  if (context?.chatId) formData.append("chatId", context.chatId);
  if (context?.workspaceId) formData.append("workspaceId", context.workspaceId);
  if (context?.parentJobId) formData.append("parentJobId", context.parentJobId);
  if (context?.parentJobIds && context.parentJobIds.length > 0) {
    formData.append("parentJobIds", JSON.stringify(context.parentJobIds));
  }
  if (context?.sourceImages && context.sourceImages.length > 0) {
    formData.append("sourceImages", JSON.stringify(context.sourceImages));
  }

  const doRequest = async (url: string, headers: HeadersInit) => {
    const res = await fetch(url, { method: "POST", headers, body: formData });
    if (res.status === 402) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || "Insufficient credits. Please subscribe or buy more credits.");
    }
    if (!res.ok) {
      let errorText: string;
      let code: string | undefined;
      try {
        const errorData = await res.json();
        errorText = errorData.error || "Failed to combine images";
        code = errorData.code;
      } catch {
        errorText = (await res.text()) || "Failed to combine images";
      }
      if (res.status === 403 || code === "FEATURE_UNAVAILABLE") {
        throw new Error(errorText || "Combine is not available on this GPU tier.");
      }
      throw new Error(errorText);
    }
    return res.json();
  };

  try {
    if (!getToken) {
      throw new Error("Authentication required");
    }
    const token = await getToken();
    if (!token) {
      throw new Error("Authentication required");
    }
    const result = await doRequest(`${backendBase}/api/3d/combined-edit`, { Authorization: `Bearer ${token}` });

    const combinedId = result.combined_id ?? result.job_id;

    // Async: status "pending" → poll Node status until completed
    if (result.status === "pending" || result.status === "queued" || (result.image_url == null && combinedId)) {
      const statusData = await pollBackendStatusUntilCompleted(combinedId, getToken);
      const imageUrlFromStatus = statusData.image_url ?? statusData.result?.image_url ?? "";
      return {
        combined_id: combinedId,
        image_url: resolveLoadableImageUrl(imageUrlFromStatus),
        prompt: result.prompt || prompt,
        prompt_used: (statusData.result as { prompt_used?: string })?.prompt_used ?? result.prompt ?? prompt,
      };
    }

    return {
      combined_id: combinedId,
      image_url: resolveLoadableImageUrl(result.image_url || ""),
      prompt: result.prompt || prompt,
      prompt_used: result.prompt_used || prompt,
    };
  } catch (err: any) {
    if (err?.message?.includes("credits") || err?.message?.includes("Insufficient") || err?.message?.includes("Authentication")) throw err;
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
export async function getCredits(getToken: () => Promise<string | null>): Promise<CreditsInfo> {
  const token = await getToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${backendBase}/api/payments/credits`, { method: "GET", headers });
  if (!res.ok) {
    const fallback = { used: 0, total: 200, remaining: 200, plan: null };
    try {
      const data = await res.json();
      if (data.credits) return data.credits as CreditsInfo;
    } catch {}
    return fallback;
  }
  const data = (await res.json()) as { credits?: CreditsInfo };
  return (data.credits ?? { used: 0, total: 200, remaining: 200, plan: null }) as CreditsInfo;
}

/**
 * Check if the user has early/premium access (e.g. active subscription).
 * Used by EarlyAccessBadge. Returns { hasAccess: true } if user has an active subscription.
 */
export async function checkEarlyAccess(
  _email: string | undefined,
  getToken?: () => Promise<string | null>
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
export async function uploadImage(file: File, getToken?: () => Promise<string | null>): Promise<string> {
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
export async function uploadImageViaApi(file: File, getToken?: () => Promise<string | null>): Promise<string> {
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
  imageFile: File | null
): Promise<{ imageUrl: string | null; imageFile: File | null }> {
  if (imageFile || !imageUrl) return { imageUrl, imageFile };
  const t = imageUrl.trim();
  if (!t.startsWith("blob:") && !t.startsWith("data:")) return { imageUrl, imageFile: null };
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
      "Could not read the image from your device. Please select the file again or pick the image from your library."
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
  aiModel?: string | null
): Promise<{ job_id: string }> {
  const resolved = await ensurePublicImageUrlFor3d(imageUrl, imageFile);
  imageUrl = resolved.imageUrl;
  imageFile = resolved.imageFile;

  let sourceImageUrl: string | null = imageUrl || null;

  if (imageFile) {
    if (isPrimaryUp()) {
      try {
        sourceImageUrl = await uploadImageViaApi(imageFile, getToken);
      } catch {
        sourceImageUrl = null;
      }
    }
    if (!sourceImageUrl) {
      try {
        sourceImageUrl = await uploadImage(imageFile, getToken);
      } catch {
        throw new Error("Failed to upload image. Please try again.");
      }
    }
  } else if (!imageUrl) {
    throw new Error("Either imageUrl or imageFile must be provided");
  }

  const urlToSend = sourceImageUrl || imageUrl!;
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (getToken) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(`${backendBase}/api/3d/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        imageUrl: urlToSend,
        aiModel: aiModel || undefined,
        chatId: chatId || undefined,
        workspaceId: workspaceId || undefined,
        parentJobId: (parentJobId || previewJobId) || undefined,
        parentJobIds: (parentJobId || previewJobId) ? [parentJobId || previewJobId] : undefined,
      }),
    });

    if (res.status === 402) {
      const data = await res.json().catch(() => ({}));
      throw new Error((data as { error?: string }).error || "Insufficient credits. Please subscribe or buy more credits.");
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
        if (parentJobId || previewJobId) body.parentJobId = parentJobId || previewJobId;
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
    if (err?.message?.includes("credits") || err?.message?.includes("Insufficient")) throw err;
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
  _parentJobId?: string | null
): Promise<{ job_id: string }> {
  throw new Error("Direct GPU gateway submit is disabled. Use submitImageTo3D via the Node backend.");
}


/**
 * Fetch job lineage (iterative prompting chain from root to the given job)
 */
export interface LineageItem {
  id: string;
  parentJobId: string | null;
  parentJobIds: string[];         // All parent IDs (multi-parent merges)
  sourceImages: string[] | null;  // Source image URLs used as input
  prompt: string | null;
  previewImageUrl: string | null;
  resultGlbUrl: string | null;
  generateType: string;
  status: string;
  createdAt: string;
}

export async function fetchJobLineage(
  jobId: string,
  getToken?: () => Promise<string | null>
): Promise<LineageItem[]> {
  const headers: HeadersInit = {};
  if (getToken) {
    const token = await getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  const res = await fetch(`${backendBase}/api/3d/jobs/${jobId}/lineage`, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  return data.lineage || [];
}

/**
 * Fetch job status from Node backend (auth recommended; required by API).
 */
export async function fetchStatus(
  jobId: string,
  getToken?: () => Promise<string | null>
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

  return job;
}

/**
 * Fetch queue info for accurate time estimation
 */
export async function fetchQueueInfo(): Promise<(QueueInfo & { 
  estimated_wait_for_preview_seconds?: number;
  estimated_preview_time_seconds?: number;
  api_available?: boolean;
}) | null> {
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
      if (res.status === 503 && data && typeof data.estimated_total_seconds === "number") {
        return {
          position: 0,
          jobs_ahead: data.jobs_ahead_for_new ?? 0,
          estimated_wait_seconds: data.estimated_wait_for_new_job_seconds ?? 0,
          estimated_total_seconds: data.estimated_total_seconds ?? 300,
          queue_length: data.queue_length ?? 0,
          currently_processing: data.currently_processing ?? false,
          estimated_wait_for_preview_seconds: data.estimated_wait_for_preview_seconds ?? 0,
          estimated_preview_time_seconds: data.estimated_preview_time_seconds ?? 25,
          api_available: false,
        };
      }
      return null;
    }

    return {
      position: 0,
      jobs_ahead: data.jobs_ahead_for_new ?? data.queue_length + (data.currently_processing ? 1 : 0),
      estimated_wait_seconds: data.estimated_wait_for_new_job_seconds || 0,
      estimated_total_seconds: data.estimated_total_seconds ?? (data.estimated_wait_for_new_job_seconds || 0) + (data.estimated_time_per_job_seconds || 300),
      queue_length: data.queue_length || 0,
      currently_processing: data.currently_processing || false,
      estimated_wait_for_preview_seconds: data.estimated_wait_for_preview_seconds || 0,
      estimated_preview_time_seconds: data.estimated_preview_time_seconds ?? 25,
      api_available: data.api_available !== false,
    };
  } catch (err: any) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    // Timeout or network error: return null so callers use defaults; do not show "GPU offline"
    if (err.name === "AbortError" || err.name === "TimeoutError" || (err.name === "TypeError" && err.message?.includes("fetch"))) {
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
  getToken: () => Promise<string | null>
): Promise<void> {
  const token = await getToken();
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(glbUrl, { headers, credentials: "include" });
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
 * Proxy S3 / gateway image URLs through the backend to avoid CORS.
 * - data:/blob:/already-proxied → returned as-is
 * - Anything else → returned as-is (won't be proxied) unless S3/gateway
 */
export function getProxiedImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const s = url.trim();
  if (!s) return null;

  if (s.startsWith("data:") || s.startsWith("blob:")) return s;
  if (s.startsWith(backendBase)) return s;
  if (s.includes("/api/3d/image-proxy")) return s;

  const resolved = s.startsWith("/") ? resolveImageUrl(s) : s;
  if (resolved.includes("amazonaws.com") || resolved.includes("s3.") || isGatewayOutputImageUrl(resolved)) {
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
  const url = (
    job.result.processed_image_url ||
    job.result.generated_image_url ||
    job.result.processed_image ||
    job.result.generated_image ||
    null
  );
  
  // If we have a URL, proxy it so private S3 and gateway output URLs load reliably.
  if (url) return getProxiedImageUrl(url);
  
  // If no URL but we have a job_id, try gateway output path (file may not be on public S3).
  if (job.job_id) {
    const base = getPrimaryUrl().replace(/\/$/, "");
    return getProxiedImageUrl(`${base}/outputs/preview/${job.job_id}/preview_image.png`);
  }
  
  return null;
}


export async function fetchHistory(getToken?: () => Promise<string | null>): Promise<BackendJob[]> {
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
          errorText = errorData.error || `Failed to fetch history: ${res.status} ${res.statusText}`;
        } catch {
          errorText = await res.text() || `Failed to fetch history: ${res.status} ${res.statusText}`;
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
      return Array.isArray(data) ? data : (data.jobs || []);
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      
      // Handle abort (timeout)
      if (fetchErr.name === "AbortError") {
        throw new Error("Request timeout: Backend took too long to respond (30s timeout)");
      }
      throw fetchErr;
    }
  } catch (err: any) {
    // Handle network errors
    const isNetworkError = err.name === "TypeError" && 
                          (err.message.includes("fetch") || 
                           err.message.includes("Failed to fetch") ||
                           err.message.includes("NetworkError") ||
                           err.message.includes("Network request failed"));
    
    if (isNetworkError) {
      // For history fetching, return empty array instead of throwing error
      // This allows the app to continue working even if history can't be loaded
      console.warn("Failed to fetch history - backend may be temporarily unavailable:", err.message);
      return [];
    }
    
    // Re-throw other errors (API errors, parsing errors, etc.)
    throw err;
  }
}

/**
 * Delete a job (requires auth)
 */
export async function deleteJob(jobId: string, getToken: () => Promise<string | null>): Promise<void> {
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
 * Cancel a 3D job (via backend; backend proxies to Python gateway).
 */
export async function cancelJob(
  jobId: string,
  getToken?: () => Promise<string | null>
): Promise<void> {
  const headers: HeadersInit = {};
  if (getToken) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${backendBase}/api/3d/cancel/${jobId}`, {
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
export async function syncUser(getToken: () => Promise<string | null>): Promise<{ success: boolean; user?: any }> {
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
  getToken: () => Promise<string | null>
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
export async function fetchWorkspaces(getToken?: () => Promise<string | null>): Promise<Workspace[]> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (getToken) {
      const token = await getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${backendBase}/api/3d/workspaces?t=${Date.now()}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      if (response.status === 500) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error?.includes("relation") || errorData.error?.includes("does not exist")) {
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
export async function createWorkspaceApi(name?: string, getToken?: () => Promise<string | null>): Promise<Workspace> {
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
      `Cannot reach backend at ${backendBase}. Is the API running?`
    );
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({} as { error?: string; message?: string }));
    throw new Error(
      body.message || body.error || `Failed to create workspace (${response.status})`
    );
  }

  const data = await response.json();
  return data.workspace;
}

/**
 * Get a workspace by ID
 */
export async function fetchWorkspace(workspaceId: string, getToken?: () => Promise<string | null>): Promise<Workspace | null> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (getToken) {
      const token = await getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${backendBase}/api/3d/workspaces/${workspaceId}`, {
      method: "GET",
      headers,
    });

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
export async function fetchWorkspaceJobs(workspaceId: string, getToken?: () => Promise<string | null>): Promise<BackendJob[]> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (getToken) {
      const token = await getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${backendBase}/api/3d/workspaces/${workspaceId}/jobs?t=${Date.now()}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

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
export async function updateWorkspaceNameApi(workspaceId: string, name: string, getToken?: () => Promise<string | null>): Promise<void> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (getToken) {
    const token = await getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${backendBase}/api/3d/workspaces/${workspaceId}/name`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ name }),
  });

  if (!response.ok) {
    throw new Error(`Failed to update workspace name: ${response.statusText}`);
  }
}

/**
 * Delete a workspace
 */
export async function deleteWorkspaceApi(workspaceId: string, getToken?: () => Promise<string | null>): Promise<void> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (getToken) {
    const token = await getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${backendBase}/api/3d/workspaces/${workspaceId}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to delete workspace: ${response.statusText}`);
  }
}

// ---------------------------------------------------------------------------
// BYOK / Water (user keys + procedural Three.js)
// ---------------------------------------------------------------------------

async function authHeaders(getToken?: () => Promise<string | null>): Promise<HeadersInit> {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (getToken) {
    const token = await getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export async function fetchUserApiKeys(
  getToken?: () => Promise<string | null>
): Promise<{ keys: UserApiKeyMeta[]; prefs: UserModelPrefs }> {
  const res = await fetch(`${backendBase}/api/user/api-keys`, {
    headers: await authHeaders(getToken),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || "Failed to load API keys");
  }
  return res.json();
}

export async function saveUserApiKey(
  provider: string,
  apiKey: string,
  getToken?: () => Promise<string | null>
): Promise<UserApiKeyMeta> {
  const res = await fetch(`${backendBase}/api/user/api-keys/${provider}`, {
    method: "PUT",
    headers: await authHeaders(getToken),
    body: JSON.stringify({ apiKey }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error || "Failed to save API key");
  }
  return (body as { key: UserApiKeyMeta }).key;
}

export async function verifyUserApiKey(
  provider: string,
  getToken?: () => Promise<string | null>
): Promise<{ ok: boolean; status: string; error: string | null }> {
  const res = await fetch(`${backendBase}/api/user/api-keys/${provider}/verify`, {
    method: "POST",
    headers: await authHeaders(getToken),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error || "Verification failed");
  }
  return body as { ok: boolean; status: string; error: string | null };
}

export async function deleteUserApiKey(
  provider: string,
  getToken?: () => Promise<string | null>
): Promise<void> {
  const res = await fetch(`${backendBase}/api/user/api-keys/${provider}`, {
    method: "DELETE",
    headers: await authHeaders(getToken),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || "Failed to remove key");
  }
}

export async function saveUserModelPrefs(
  prefs: { defaultMeshModel?: string; defaultCodeModel?: string | null },
  getToken?: () => Promise<string | null>
): Promise<UserModelPrefs> {
  const res = await fetch(`${backendBase}/api/user/model-prefs`, {
    method: "PATCH",
    headers: await authHeaders(getToken),
    body: JSON.stringify(prefs),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error || "Failed to save model preference");
  }
  return (body as { prefs: UserModelPrefs }).prefs;
}

export type OpenRouterFreeModelRow = {
  id: string;
  name: string;
  vision: boolean;
  contextLength: number | null;
};

export async function fetchOpenRouterFreeModels(
  getToken?: () => Promise<string | null>
): Promise<{ models: OpenRouterFreeModelRow[]; syncedAt: string; note?: string }> {
  const res = await fetch(`${backendBase}/api/user/openrouter/free-models`, {
    headers: await authHeaders(getToken),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error || "Failed to sync OpenRouter free models");
  }
  return body as { models: OpenRouterFreeModelRow[]; syncedAt: string; note?: string };
}

export type CursorModelRow = {
  id: string;
  displayName: string;
  isAuto?: boolean;
};

/** Live Cursor Cloud Agents models (requires a saved Cursor key). */
export async function fetchCursorModels(
  getToken?: () => Promise<string | null>
): Promise<{ models: CursorModelRow[]; syncedAt: string; note?: string }> {
  const res = await fetch(`${backendBase}/api/user/cursor/models`, {
    headers: await authHeaders(getToken),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error || "Failed to sync Cursor models");
  }
  return body as { models: CursorModelRow[]; syncedAt: string; note?: string };
}

export async function fetchOpenRouterKeyStatus(
  getToken?: () => Promise<string | null>
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
    throw new Error((body as { error?: string }).error || "Failed to load OpenRouter key status");
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
  skillId?: string | null;
  qualityTier?: string | null;
  getToken?: () => Promise<string | null>;
}): Promise<{
  job_id: string;
  mode: "text_to_code" | "image_to_code";
  skillId?: string;
  qualityTier?: string;
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
      skillId: params.skillId || undefined,
      qualityTier: params.qualityTier || undefined,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (body as { message?: string; error?: string }).message ||
        (body as { error?: string }).error ||
        "Water failed"
    );
  }
  return {
    job_id: (body as { jobId?: string }).jobId || "",
    mode: (body as { mode?: "text_to_code" | "image_to_code" }).mode || "text_to_code",
    skillId: (body as { skillId?: string }).skillId,
    qualityTier: (body as { qualityTier?: string }).qualityTier,
  };
}


export async function fetchWaterJob(
  jobId: string,
  getToken?: () => Promise<string | null>
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
  prompt: string | null;
}> {
  const res = await fetch(`${backendBase}/api/water/jobs/${jobId}`, {
    headers: await authHeaders(getToken),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error || "Failed to load Water job");
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
    prompt: job.prompt ?? null,
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
  limit = 100
): Promise<WaterUsageRow[]> {
  const res = await fetch(`${backendBase}/api/water/usage?limit=${limit}`, {
    headers: await authHeaders(getToken),
    cache: "no-store",
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error || "Failed to load Water usage");
  }
  return ((body as { jobs?: WaterUsageRow[] }).jobs || []) as WaterUsageRow[];
}


/** Persist a canvas screenshot as the Water library thumbnail. */
export async function saveWaterThumbnail(
  jobId: string,
  dataUrl: string,
  getToken?: () => Promise<string | null>
): Promise<string> {
  const res = await fetch(`${backendBase}/api/water/jobs/${jobId}/thumbnail`, {
    method: "POST",
    headers: await authHeaders(getToken),
    body: JSON.stringify({ dataUrl }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { error?: string }).error || "Failed to save thumbnail");
  }
  return (body as { previewImageUrl?: string }).previewImageUrl || dataUrl;
}
