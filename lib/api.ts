import {
  getPrimaryUrl,
  getAlternativeUrl,
  getFallbackCapableUrl,
  isPrimaryUp,
  markPrimaryDown,
  onHealthChange,
} from "./apiHealth";

// Re-export health utilities for UI components

export { isPrimaryUp, onHealthChange };

const apiBase = getPrimaryUrl();

// Backend URL - must be set in Vercel environment variables as NEXT_PUBLIC_BACKEND_URL
const getBackendBase = (): string => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url || url === "NEXT_PUBLIC_BACKEND_URL" || url.includes("NEXT_PUBLIC_BACKEND_URL")) {
    return "https://hydrilla-backend.vercel.app/"; // Fallback for local dev
  }
  return url.endsWith('/') ? url.slice(0, -1) : url;
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

export interface Chat {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  firstJobPreviewImageUrl?: string | null;
  firstJobPrompt?: string | null;
}

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
  enablePBR: boolean;
  resultGlbUrl: string | null;
  previewImageUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  workspaceId?: string | null;
  parentJobId?: string | null;
  parentJobIds?: string[];       // All parent IDs (multi-parent merges)
  sourceImages?: string[] | null; // Actual source image URLs used as input
  createdAt: string;
  updatedAt: string;
}

/**
 * Get authorization header with Clerk token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  // Check if we're on the client side
  if (typeof window === "undefined") {
    return {};
  }

  try {
    // Dynamically import to avoid SSR issues
    const { useAuth } = await import("@clerk/nextjs");
    // This won't work in regular functions - need to use getToken from Clerk
    return {};
  } catch {
    return {};
  }
}

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
 * Poll gateway /status/<jobId> until status is completed, failed, or cancelled.
 * Used when the gateway returns async (status "pending") for preview/edit/combined.
 */
async function pollGatewayStatusUntilCompleted(
  jobId: string,
  baseUrl?: string,
  options?: { maxWaitMs?: number; intervalMs?: number }
): Promise<{ status: string; result?: { image_url?: string }; image_url?: string; error?: string }> {
  const base = baseUrl || apiBase;
  const maxWaitMs = options?.maxWaitMs ?? 120_000; // 2 min
  const intervalMs = options?.intervalMs ?? 2000;
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const res = await fetch(`${base}/status/${jobId}`);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error((err as { error?: string }).error || "Failed to fetch status");
    }
    const data = await res.json();
    const status = data.status as string;
    if (status === "completed") {
      return data;
    }
    if (status === "failed" || status === "cancelled") {
      throw new Error(data.error || data.message || `Job ${status}`);
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

/**
 * Generate preview image from text prompt.
 * When getToken is provided, uses backend /api/3d/text-to-image so credits are deducted (2).
 * Otherwise calls gateway directly (no deduction).
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
  const parseErrorResponse = async (res: Response): Promise<string> => {
    try {
      const data = await res.json();
      return data.error || "Failed to generate preview image";
    } catch {
      return (await res.text()) || "Failed to generate preview image";
    }
  };

  const handleResult = async (result: any, baseUrl: string) => {
    const previewId = result.preview_id ?? result.job_id;
    const resolve = (url: string) => {
      if (!url || !url.startsWith("/")) return url;
      const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
      return `${base}${url}`;
    };

    if (result.status === "pending" || (result.image_url == null && previewId)) {
      const statusData = await pollGatewayStatusUntilCompleted(previewId, baseUrl);
      const imageUrl = statusData.image_url ?? statusData.result?.image_url ?? "";
      return { image_url: resolve(imageUrl), preview_id: previewId, queue: result.queue };
    }

    return { image_url: resolve(result.image_url ?? ""), preview_id: previewId, queue: result.queue };
  };

  // Use backend when authenticated so credits are deducted (2 per text-to-image)
  if (getToken) {
    const token = await getToken();
    if (token) {
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
        // Backend proxies gateway response; polling still uses gateway URL
        return await handleResult(result, getFallbackCapableUrl());
      } catch (err: any) {
        if (err?.message?.includes("credits") || err?.message?.includes("Insufficient")) throw err;
        if (isApiUnavailableError(err)) {
          if (shouldNotifyGpuOffline(err)) notifyGpuOffline(err.message || "API unavailable", getToken);
          throw new Error(getGpuOfflineErrorMessage());
        }
        throw err;
      }
    }
  }

  // No token: call gateway directly (no credit deduction)
  const buildFormData = (): FormData => {
    const fd = new FormData();
    fd.append("prompt", prompt);
    return fd;
  };
  const targetUrl = getFallbackCapableUrl();

  try {
    const res = await fetch(`${targetUrl}/text-to-image`, {
      method: "POST",
      body: buildFormData(),
    });

    if (!res.ok) throw new Error(await parseErrorResponse(res));

    return await handleResult(await res.json(), targetUrl);
  } catch (err: any) {
    if (isApiUnavailableError(err) && targetUrl === getPrimaryUrl()) {
      markPrimaryDown();

      try {
        const altRes = await fetch(`${getAlternativeUrl()}/text-to-image`, {
          method: "POST",
          body: buildFormData(),
        });

        if (!altRes.ok) throw new Error(await parseErrorResponse(altRes));

        return await handleResult(await altRes.json(), getAlternativeUrl());
      } catch (altErr: any) {
        if (shouldNotifyGpuOffline(altErr)) {
          notifyGpuOffline(altErr.message || "Both APIs unavailable", getToken);
        }
        throw new Error(getGpuOfflineErrorMessage());
      }
    }

    if (isApiUnavailableError(err)) {
      if (shouldNotifyGpuOffline(err)) {
        notifyGpuOffline(err.message || "GPU/API unavailable", getToken);
      }
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
      try {
        const errorData = await res.json();
        errorText = errorData.error || "Failed to edit image";
      } catch {
        errorText = (await res.text()) || "Failed to edit image";
      }
      throw new Error(errorText);
    }
    return res.json();
  };

  try {
    // Use backend when authenticated so credits are deducted (3 per edit)
    if (getToken) {
      const token = await getToken();
      if (token) {
        const result = await doRequest(`${backendBase}/api/3d/edit-image`, {
          Authorization: `Bearer ${token}`,
        });
        const editId = result.edit_id ?? result.job_id;
        if (result.status === "pending" || (result.image_url == null && editId)) {
          const statusData = await pollGatewayStatusUntilCompleted(editId);
          const imageUrlFromStatus = statusData.image_url ?? statusData.result?.image_url ?? "";
          return {
            edit_id: editId,
            image_url: resolveImageUrl(imageUrlFromStatus),
            prompt: result.prompt || prompt,
            strength: result.strength ?? 0.6,
          };
        }
        return {
          edit_id: editId,
          image_url: resolveImageUrl(result.image_url || ""),
          prompt: result.prompt || prompt,
          strength: result.strength ?? 0.6,
        };
      }
    }

    const result = await doRequest(`${apiBase}/edit-image`, {});
    const editId = result.edit_id ?? result.job_id;

    if (result.status === "pending" || (result.image_url == null && editId)) {
      const statusData = await pollGatewayStatusUntilCompleted(editId);
      const imageUrlFromStatus = statusData.image_url ?? statusData.result?.image_url ?? "";
      return {
        edit_id: editId,
        image_url: resolveImageUrl(imageUrlFromStatus),
        prompt: result.prompt || prompt,
        strength: result.strength ?? 0.6,
      };
    }

    return {
      edit_id: editId,
      image_url: resolveImageUrl(result.image_url || ""),
      prompt: result.prompt || prompt,
      strength: result.strength ?? 0.6,
    };
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

/**
 * Fetch a remote image URL and convert it to a File object for FormData uploads.
 * Routes through our backend image proxy to avoid S3 CORS issues.
 */
async function urlToFile(url: string, filename: string): Promise<File> {
  // Use the backend proxy to avoid CORS when fetching S3 images
  const proxyUrl = `${backendBase}/api/3d/image-proxy?url=${encodeURIComponent(url)}`;
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
      try {
        const errorData = await res.json();
        errorText = errorData.error || "Failed to combine images";
      } catch {
        errorText = (await res.text()) || "Failed to combine images";
      }
      throw new Error(errorText);
    }
    return res.json();
  };

  try {
    // Use backend when authenticated so credits are deducted (4 per combined edit)
    let result: any;
    if (getToken) {
      const token = await getToken();
      if (token) {
        result = await doRequest(`${backendBase}/api/3d/combined-edit`, { Authorization: `Bearer ${token}` });
      } else {
        result = await doRequest(`${apiBase}/combined-edit`, {});
      }
    } else {
      result = await doRequest(`${apiBase}/combined-edit`, {});
    }

    const combinedId = result.combined_id ?? result.job_id;

    // Async gateway: status "pending" → poll until completed
    if (result.status === "pending" || (result.image_url == null && combinedId)) {
      const statusData = await pollGatewayStatusUntilCompleted(combinedId);
      const imageUrlFromStatus = statusData.image_url ?? statusData.result?.image_url ?? "";
      return {
        combined_id: combinedId,
        image_url: resolveImageUrl(imageUrlFromStatus),
        prompt: result.prompt || prompt,
        prompt_used: (statusData.result as { prompt_used?: string })?.prompt_used ?? result.prompt ?? prompt,
      };
    }

    return {
      combined_id: combinedId,
      image_url: resolveImageUrl(result.image_url || ""),
      prompt: result.prompt || prompt,
      prompt_used: result.prompt_used || prompt,
    };
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

/**
 * Submit text-to-3D job via backend (deducts credits, then submits to Python API).
 * Returns job_id. Throws on 402 (insufficient credits) with error message.
 */
export async function submitTextTo3D(prompt: string, getToken?: () => Promise<string | null>, chatId?: string | null, workspaceId?: string | null): Promise<{ job_id: string }> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (getToken) {
      const token = await getToken();
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${backendBase}/api/3d/generate`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        prompt,
        chatId: chatId || undefined,
        workspaceId: workspaceId || undefined,
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

    // Attach chat/workspace by registering the job (backend already created it with user_id and credits)
    if (jobId && (chatId || workspaceId)) {
      try {
        const registerBody: Record<string, unknown> = { job_id: jobId, prompt, generateType: "TextTo3D" };
        if (chatId) registerBody.chatId = chatId;
        if (workspaceId) registerBody.workspaceId = workspaceId;
        await fetch(`${backendBase}/api/3d/register-job`, {
          method: "POST",
          headers,
          body: JSON.stringify(registerBody),
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
 * Upload image via the gateway API so the returned URL is always an S3 URL.
 * Use this for source_images in combined-edit so DB stores stable S3 links (not localhost).
 */
export async function uploadImageViaApi(file: File, getToken?: () => Promise<string | null>): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const headers: HeadersInit = {};
  if (getToken) {
    const token = await getToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${apiBase}/upload-image`, {
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

/** @deprecated Used only when falling back to gateway for image-to-3d (e.g. if backend generate fails). */
async function submitImageTo3DViaGateway(
  imageUrl: string | null,
  imageFile: File | null,
  getToken?: () => Promise<string | null>,
  previewJobId?: string | null,
  chatId?: string | null,
  workspaceId?: string | null,
  parentJobId?: string | null
): Promise<{ job_id: string }> {
  let sourceImageUrl: string | null = imageUrl || null;
  if (imageFile && isPrimaryUp()) {
    try {
      sourceImageUrl = await uploadImageViaApi(imageFile, getToken);
    } catch {
      sourceImageUrl = null;
    }
  }
  if (!sourceImageUrl && !imageUrl) throw new Error("Either imageUrl or imageFile must be provided");

  const buildFormData = (): FormData => {
    const fd = new FormData();
    if (sourceImageUrl) fd.append("image_url", sourceImageUrl);
    else if (imageFile) fd.append("image_file", imageFile);
    else if (imageUrl) fd.append("image_url", imageUrl);
    return fd;
  };
  const parseErrorResponse = async (res: Response): Promise<string> => {
    try {
      const data = await res.json();
      return data.error || "Failed to submit job";
    } catch {
      return (await res.text()) || "Failed to submit job";
    }
  };
  const registerJob = async (result: { job_id: string }): Promise<void> => {
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (getToken) {
        const token = await getToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;
      }
      const body: Record<string, unknown> = {
        job_id: result.job_id,
        imageUrl: sourceImageUrl || imageUrl || "uploaded_file",
        generateType: "ImageTo3D",
      };
      if (sourceImageUrl) body.sourceImages = [sourceImageUrl];
      if (previewJobId) body.previewJobId = previewJobId;
      if (chatId) body.chatId = chatId;
      if (workspaceId) body.workspaceId = workspaceId;
      if (parentJobId || previewJobId) body.parentJobId = parentJobId || previewJobId;
      await fetch(`${backendBase}/api/3d/register-job`, { method: "POST", headers, body: JSON.stringify(body) }).catch(() => {});
    } catch {}
  };

  const targetUrl = getFallbackCapableUrl();
  const res = await fetch(`${targetUrl}/image-to-3d`, { method: "POST", body: buildFormData() });
  if (!res.ok) throw new Error(await parseErrorResponse(res));
  const result = await res.json();
  await registerJob(result);
  return result;
}

function _submitImageTo3DGatewayFallback(
  imageUrl: string | null,
  imageFile: File | null,
  getToken?: () => Promise<string | null>,
  previewJobId?: string | null,
  chatId?: string | null,
  workspaceId?: string | null,
  parentJobId?: string | null
): Promise<{ job_id: string }> {
  return submitImageTo3DViaGateway(imageUrl, imageFile, getToken, previewJobId, chatId, workspaceId, parentJobId);
}

export async function _unusedSubmitImageTo3DGateway(
  imageUrl: string | null,
  imageFile: File | null,
  getToken?: () => Promise<string | null>,
  previewJobId?: string | null,
  chatId?: string | null,
  workspaceId?: string | null,
  parentJobId?: string | null
): Promise<{ job_id: string }> {
  try {
    const altRes = await fetch(`${getAlternativeUrl()}/image-to-3d`, {
      method: "POST",
      body: (() => {
        const fd = new FormData();
        if (imageUrl) fd.append("image_url", imageUrl);
        else if (imageFile) fd.append("image_file", imageFile);
        return fd;
      })(),
    });
    if (!altRes.ok) throw new Error(await altRes.json().then((d: any) => d.error).catch(() => "Failed"));
    const result = await altRes.json();
    if (getToken) {
      const token = await getToken();
      await fetch(`${backendBase}/api/3d/register-job`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ job_id: result.job_id, imageUrl: imageUrl || "uploaded_file", generateType: "ImageTo3D", chatId, workspaceId, parentJobId: parentJobId || previewJobId }),
      }).catch(() => {});
    }
    return result;
  } catch (altErr: any) {
    if (shouldNotifyGpuOffline(altErr)) {
      notifyGpuOffline(altErr.message || "Both APIs unavailable", getToken);
    }
    throw new Error(getGpuOfflineErrorMessage());
  }
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
 * Fetch job status from API
 */
export async function fetchStatus(jobId: string): Promise<Job> {
  const res = await fetch(`${backendBase}/api/3d/status/${jobId}`);
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
  
  // Include queue info if available
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
  
  // If we have a URL, return it
  if (url) return url;
  
  // If no URL but we have a job_id, try to construct preview path
  // This handles cases where preview images are in preview/{jobId}/preview_image.png
  if (job.job_id) {
    const bucket = "hunyuan3d-outputs";
    const region = "us-east-1";
    return `https://${bucket}.s3.${region}.amazonaws.com/preview/${job.job_id}/preview_image.png`;
  }
  
  return null;
}

/**
 * Fetch job history from backend (requires auth for user-specific jobs)
 */
/**
 * Fetch all chats for the current user
 */
export async function fetchChats(getToken?: () => Promise<string | null>): Promise<Chat[]> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (getToken) {
      const token = await getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${backendBase}/api/3d/chats?t=${Date.now()}`, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      // If table doesn't exist yet, return empty array instead of throwing
      if (response.status === 500) {
        const errorData = await response.json().catch(() => ({}));
        if (errorData.error?.includes("relation") || errorData.error?.includes("does not exist")) {
          console.warn("Chats table not found, returning empty array. Please run the migration.");
          return [];
        }
      }
      throw new Error(`Failed to fetch chats: ${response.statusText}`);
    }

    const data = await response.json();
    return data.chats || [];
  } catch (err: any) {
    console.error("Failed to fetch chats:", err);
    // Return empty array on error to prevent app crash
    return [];
  }
}

/**
 * Fetch a specific chat with its jobs
 */
export async function fetchChat(chatId: string, getToken?: () => Promise<string | null>): Promise<{ chat: Chat; jobs: BackendJob[] }> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (getToken) {
      const token = await getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${backendBase}/api/3d/chats/${chatId}`, {
      method: "GET",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch chat: ${response.statusText}`);
    }

    const data = await response.json();
    return { chat: data.chat, jobs: data.jobs || [] };
  } catch (err: any) {
    console.error("Failed to fetch chat:", err);
    throw err;
  }
}

/**
 * Create a new chat
 */
export async function createChat(name?: string, getToken?: () => Promise<string | null>): Promise<Chat> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (getToken) {
      const token = await getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${backendBase}/api/3d/chats`, {
      method: "POST",
      headers,
      body: JSON.stringify({ name: name || "New Chat" }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create chat: ${response.statusText}`);
    }

    const data = await response.json();
    return data.chat;
  } catch (err: any) {
    console.error("Failed to create chat:", err);
    throw err;
  }
}

/**
 * Get or create active chat (most recent chat, or create new one)
 */
export async function getOrCreateActiveChat(getToken?: () => Promise<string | null>): Promise<Chat | null> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (getToken) {
      try {
        const token = await getToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      } catch (tokenErr) {
        console.warn("Failed to get token for active chat:", tokenErr);
        // Continue without token - backend will handle auth
      }
    }

    let response: Response;
    try {
      response = await fetch(`${backendBase}/api/3d/chats/active`, {
        method: "GET",
        headers,
      });
    } catch (fetchErr: any) {
      console.warn("Failed to fetch active chat:", fetchErr);
      return null;
    }

    if (!response.ok) {
      // For any error status, try to get error details but always return null
      if (response.status === 500 || response.status >= 500) {
        try {
          const errorData = await response.json().catch(() => ({}));
          if (errorData.error?.includes("relation") || errorData.error?.includes("does not exist")) {
            console.warn("Chats table not found. Please run the migration.");
          } else {
            console.warn("Server error getting active chat:", errorData.error || response.statusText);
          }
        } catch {
          // If we can't parse the error, still return null gracefully
          console.warn("Failed to get active chat (server error). Please run the migration.");
        }
      } else {
        console.warn(`Failed to get active chat: ${response.status} ${response.statusText}`);
      }
      return null;
    }

    try {
      const data = await response.json();
      return data.chat || null;
    } catch (parseErr) {
      console.warn("Failed to parse active chat response:", parseErr);
      return null;
    }
  } catch (err: any) {
    // Catch any unexpected errors and return null instead of throwing
    console.warn("Unexpected error getting active chat:", err?.message || err);
    return null;
  }
}

/**
 * Update chat name
 */
export async function updateChatName(chatId: string, name: string, getToken?: () => Promise<string | null>): Promise<void> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (getToken) {
      const token = await getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${backendBase}/api/3d/chats/${chatId}/name`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error(`Failed to update chat name: ${response.statusText}`);
    }
  } catch (err: any) {
    console.error("Failed to update chat name:", err);
    throw err;
  }
}

/**
 * Delete a chat
 */
export async function deleteChat(chatId: string, getToken?: () => Promise<string | null>): Promise<void> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (getToken) {
      const token = await getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(`${backendBase}/api/3d/chats/${chatId}`, {
      method: "DELETE",
      headers,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete chat: ${response.statusText}`);
    }
  } catch (err: any) {
    console.error("Failed to delete chat:", err);
    throw err;
  }
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

/**
 * Get current user profile from backend
 */
export async function getCurrentUser(getToken: () => Promise<string | null>): Promise<{ user: any; stats: any } | null> {
  const token = await getToken();
  if (!token) {
    return null;
  }

  try {
    const res = await fetch(`${backendBase}/api/3d/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      return null;
    }

    return await res.json();
  } catch {
    return null;
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

  const response = await fetch(`${backendBase}/api/3d/workspaces`, {
    method: "POST",
    headers,
    body: JSON.stringify({ name: name || "Untitled Workspace" }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create workspace: ${response.statusText}`);
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