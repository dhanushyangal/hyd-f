const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.hydrilla.co";
// Backend URL - must be set in Vercel environment variables as NEXT_PUBLIC_BACKEND_URL
// For Vercel deployments, set this to your backend deployment URL (e.g., https://hydrilla-backend.vercel.app)
const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export type JobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export interface Job {
  job_id: string;
  status: JobStatus;
  progress: number;
  message: string;
  created_at?: number;
  updated_at?: number;
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
 * Generate preview image from text prompt
 */
export async function generatePreviewImage(prompt: string, getToken?: () => Promise<string | null>): Promise<{ image_url: string; preview_id: string }> {
  const formData = new FormData();
  formData.append("prompt", prompt);

  const headers: HeadersInit = {};
  if (getToken) {
    const token = await getToken();
    if (token) {
      formData.append("user_id", ""); // Can be extracted from token if needed
    }
  }

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
  };
}

/**
 * Submit text-to-3D job
 */
export async function submitTextTo3D(prompt: string, getToken?: () => Promise<string | null>): Promise<{ job_id: string }> {
  const formData = new FormData();
  formData.append("prompt", prompt);

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
}

/**
 * Fetch job status from API
 */
export async function fetchStatus(jobId: string): Promise<Job> {
  const res = await fetch(`${apiBase}/status/${jobId}`);
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
  return res.json();
}

/**
 * Get GLB URL from job result (use proxy for S3 URLs to avoid CORS)
 */
export function getGlbUrl(job: Job): string | null {
  if (!job.result) return null;
  const url = job.result.mesh_url || job.result.output || null;
  if (!url) return null;

  if (url.includes("s3.amazonaws.com") || url.includes("amazonaws.com") || url.startsWith("http")) {
    return `${backendBase}/api/3d/glb-proxy?url=${encodeURIComponent(url)}`;
  }

  return url;
}

/**
 * Get preview image URL from job result
 */
export function getPreviewImageUrl(job: Job): string | null {
  if (!job.result) return null;
  return (
    job.result.processed_image_url ||
    job.result.generated_image_url ||
    job.result.processed_image ||
    job.result.generated_image ||
    null
  );
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
    const res = await fetch(url, { 
      headers,
      method: "GET",
      cache: "no-store",
    });
    
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
    
    const data = await res.json();
    // Handle both { jobs: [...] } and direct array response
    return Array.isArray(data) ? data : (data.jobs || []);
  } catch (err: any) {
    // Handle network errors
    if (err.name === "TypeError" && (err.message.includes("fetch") || err.message.includes("Failed to fetch"))) {
      const errorMsg = `Unable to connect to backend. Please ensure NEXT_PUBLIC_BACKEND_URL is set correctly in your Vercel environment variables. Current backend URL: ${backendBase}`;
      console.error("Backend connection error:", errorMsg, err);
      throw new Error(errorMsg);
    }
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
      console.error("Failed to sync user:", await res.text());
      return { success: false };
    }

    const data = await res.json();
    return { success: true, user: data.user };
  } catch (err) {
    console.error("Error syncing user:", err);
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
  } catch (err) {
    console.error("Error fetching user profile:", err);
    return null;
  }
}
