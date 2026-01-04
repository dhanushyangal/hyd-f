const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.hydrilla.co";

// Backend URL - must be set in Vercel environment variables as NEXT_PUBLIC_BACKEND_URL
const getBackendBase = (): string => {
  const url = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!url || url === "NEXT_PUBLIC_BACKEND_URL" || url.includes("NEXT_PUBLIC_BACKEND_URL")) {
    return "http://localhost:4000"; // Fallback for local dev
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

export interface BackendJob {
  id: string;
  userId: string | null;
  status: BackendJobStatus;
  prompt: string | null;
  imageUrl: string | null;
  generateType: string;
  faceCount: number | null;
  enablePBR: boolean;
  polygonType: string | null;
  resultGlbUrl: string | null;
  previewImageUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  name?: string | null;
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
  getToken?: () => Promise<string | null>
): Promise<void> {
  try {
    const headers: HeadersInit = { "Content-Type": "application/json" };
    if (getToken) {
      const token = await getToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    await fetch(`${backendBase}/api/3d/register-job`, {
      method: "POST",
      headers,
      body: JSON.stringify({ 
        job_id: previewId, 
        prompt,
        previewImageUrl 
      }),
    }).catch(() => {});
  } catch {}
}

/**
 * Generate preview image from text prompt
 */
export async function generatePreviewImage(prompt: string, getToken?: () => Promise<string | null>): Promise<{ 
  image_url: string; 
  preview_id: string;
  queue?: QueueInfo;
}> {
  const formData = new FormData();
  formData.append("prompt", prompt);

  const headers: HeadersInit = {};
  if (getToken) {
    const token = await getToken();
    if (token) {
      formData.append("user_id", ""); // Can be extracted from token if needed
    }
  }

  try {
    const res = await fetch(`${apiBase}/text-to-image`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      let errorText: string;
      try {
        const errorData = await res.json();
        errorText = errorData.error || "Failed to generate preview image";
      } catch {
        errorText = (await res.text()) || "Failed to generate preview image";
      }
      throw new Error(errorText);
    }

    const result = await res.json();
    return {
      image_url: result.image_url,
      preview_id: result.preview_id,
      queue: result.queue,  // Include queue info if available
    };
  } catch (err: any) {
    // Check if it's a network error indicating API is unavailable
    if (isApiUnavailableError(err)) {
      // Send notification to founders (non-blocking)
      notifyGpuOffline(err.message || "GPU/API unavailable", getToken);
      throw new Error(getGpuOfflineErrorMessage());
    }
    // Re-throw other errors
    throw err;
  }
}

/**
 * Submit text-to-3D job
 */
export async function submitTextTo3D(prompt: string, getToken?: () => Promise<string | null>): Promise<{ job_id: string }> {
  const formData = new FormData();
  formData.append("prompt", prompt);

  try {
    const res = await fetch(`${apiBase}/text-to-3d`, {
      method: "POST",
      body: formData,
    });

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

    const result = await res.json();

    // Register job in backend with auth token
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (getToken) {
        const token = await getToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      await fetch(`${backendBase}/api/3d/register-job`, {
        method: "POST",
        headers,
        body: JSON.stringify({ job_id: result.job_id, prompt }),
      }).catch(() => {});
    } catch {}

    return result;
  } catch (err: any) {
    // Check if it's a network error indicating API is unavailable
    if (isApiUnavailableError(err)) {
      // Send notification to founders (non-blocking)
      notifyGpuOffline(err.message || "GPU/API unavailable", getToken);
      throw new Error(getGpuOfflineErrorMessage());
    }
    // Re-throw other errors
    throw err;
  }
}

/**
 * Upload image file to backend and get URL
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
 * Submit image-to-3D job
 */
export async function submitImageTo3D(
  imageUrl: string | null,
  imageFile: File | null = null,
  getToken?: () => Promise<string | null>
): Promise<{ job_id: string }> {
  const formData = new FormData();

  if (imageFile) {
    formData.append("image_file", imageFile);
  } else if (imageUrl) {
    formData.append("image_url", imageUrl);
  } else {
    throw new Error("Either imageUrl or imageFile must be provided");
  }

  try {
    const res = await fetch(`${apiBase}/image-to-3d`, {
      method: "POST",
      body: formData,
    });

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

    const result = await res.json();

    // Register job in backend with auth token
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (getToken) {
        const token = await getToken();
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }
      }

      await fetch(`${backendBase}/api/3d/register-job`, {
        method: "POST",
        headers,
        body: JSON.stringify({ job_id: result.job_id, imageUrl: imageUrl || "uploaded_file" }),
      }).catch(() => {});
    } catch {}

    return result;
  } catch (err: any) {
    // Check if it's a network error indicating API is unavailable
    if (isApiUnavailableError(err)) {
      // Send notification to founders (non-blocking)
      notifyGpuOffline(err.message || "GPU/API unavailable", getToken);
      throw new Error(getGpuOfflineErrorMessage());
    }
    // Re-throw other errors
    throw err;
  }
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
    // Create abort controller for timeout - reduced to 2 seconds for faster failure detection
    const controller = new AbortController();
    timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout for faster detection
    
    const res = await fetch(`${backendBase}/api/3d/queue/info`, {
      signal: controller.signal,
    });
    
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    
    // Check status immediately before parsing JSON - faster error detection
    if (!res.ok) {
      // If 503 (Service Unavailable), API is offline
      if (res.status === 503) {
        throw new Error("GPU is currently offline. Please try again after some time.");
      }
      // For other errors, try to parse error message
      try {
        const errorData = await res.json();
        if (errorData.api_available === false || errorData.error) {
          throw new Error("GPU is currently offline. Please try again after some time.");
        }
      } catch {
        throw new Error("GPU is currently offline. Please try again after some time.");
      }
    }
    
    const data = await res.json();
    
    // Check if API is unavailable (double check after parsing)
    if (data.api_available === false) {
      // API is offline - throw error to be caught by caller
      throw new Error("GPU is currently offline. Please try again after some time.");
    }
    
    return {
      position: 0,
      jobs_ahead: data.queue_length + (data.currently_processing ? 1 : 0),
      estimated_wait_seconds: data.estimated_wait_for_new_job_seconds || 0,
      estimated_total_seconds: (data.estimated_wait_for_new_job_seconds || 0) + (data.estimated_time_per_job_seconds || 130),
      queue_length: data.queue_length || 0,
      currently_processing: data.currently_processing || false,
      // Preview queue info
      estimated_wait_for_preview_seconds: data.estimated_wait_for_preview_seconds || 0,
      estimated_preview_time_seconds: data.estimated_preview_time_seconds || 20,
      api_available: data.api_available !== false, // Default to true if not specified
    };
  } catch (err: any) {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    // Check if it's a timeout or network error
    if (err.name === "AbortError" || err.name === "TimeoutError" || 
        (err.name === "TypeError" && err.message?.includes("fetch"))) {
      throw new Error("GPU is currently offline. Please try again after some time.");
    }
    // Re-throw if it's already our error message
    if (err.message?.includes("GPU is currently offline")) {
      throw err;
    }
    // Otherwise return null for other errors
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
 * Update job name (requires auth)
 */
export async function updateJobName(jobId: string, name: string, getToken: () => Promise<string | null>): Promise<void> {
  const token = await getToken();
  if (!token) {
    throw new Error("Authentication required");
  }

  const res = await fetch(`${backendBase}/api/3d/jobs/${jobId}/name`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ name }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to update job name");
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
 * Cancel a job
 */
export async function cancelJob(jobId: string): Promise<void> {
  const res = await fetch(`${apiBase}/cancel/${jobId}`, {
    method: "POST",
  });

  if (!res.ok) {
    const data = await res.json();
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
