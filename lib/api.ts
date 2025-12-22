const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://api.hydrilla.co";

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

export async function submitTextTo3D(prompt: string): Promise<{ job_id: string }> {
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
      errorText = await res.text() || "Failed to submit job";
    }
    throw new Error(errorText);
  }
  const result = await res.json();
  
  // Also register job in backend/Supabase (fire and forget)
  try {
    await fetch(`${backendBase}/api/3d/register-job`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: result.job_id, prompt }),
    }).catch(() => {
      // Ignore errors - backend sync will handle it
    });
  } catch {
    // Ignore errors
  }
  
  return result;
}

// Upload image file to backend and get URL
export async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${backendBase}/api/3d/upload-image`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    let errorText: string;
    try {
      const errorData = await res.json();
      errorText = errorData.error || "Failed to upload image";
    } catch {
      errorText = await res.text() || "Failed to upload image";
    }
    throw new Error(errorText);
  }

  const data = await res.json();
  return data.url;
}

export async function submitImageTo3D(imageUrl: string | null, imageFile: File | null = null): Promise<{ job_id: string }> {
  const formData = new FormData();
  
  // If file is provided, upload directly to FastAPI
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
      errorText = await res.text() || "Failed to submit job";
    }
    throw new Error(errorText);
  }
  const result = await res.json();
  
  // Also register job in backend/Supabase (fire and forget)
  try {
    await fetch(`${backendBase}/api/3d/register-job`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: result.job_id, imageUrl: imageUrl || "uploaded_file" }),
    }).catch(() => {
      // Ignore errors - backend sync will handle it
    });
  } catch {
    // Ignore errors
  }
  
  return result;
}

export async function fetchStatus(jobId: string): Promise<Job> {
  const res = await fetch(`${apiBase}/status/${jobId}`);
  if (!res.ok) {
    let errorText: string;
    try {
      const errorData = await res.json();
      errorText = errorData.error || "Failed to fetch status";
    } catch {
      errorText = await res.text() || "Failed to fetch status";
    }
    throw new Error(errorText);
  }
  return res.json();
}

// Get GLB URL from job result (use proxy for S3 URLs to avoid CORS)
export function getGlbUrl(job: Job): string | null {
  if (!job.result) return null;
  const url = job.result.mesh_url || job.result.output || null;
  if (!url) return null;
  
  // If it's an S3 URL or external URL, use backend proxy to avoid CORS
  if (url.includes("s3.amazonaws.com") || url.includes("amazonaws.com") || url.startsWith("http")) {
    return `${backendBase}/api/3d/glb-proxy?url=${encodeURIComponent(url)}`;
  }
  
  return url;
}

// Get preview image URL from job result
export function getPreviewImageUrl(job: Job): string | null {
  if (!job.result) return null;
  return job.result.processed_image_url || job.result.generated_image_url || job.result.processed_image || job.result.generated_image || null;
}

// Backend API types (for compatibility with existing backend)
export type BackendJobStatus = "WAIT" | "RUN" | "FAIL" | "DONE";

export interface BackendJob {
  id: string;
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

// Backend API functions (for library/history)
const backendBase = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

export async function fetchHistory(): Promise<BackendJob[]> {
  const res = await fetch(`${backendBase}/api/3d/history`);
  if (!res.ok) throw new Error(await res.text());
  const data = await res.json();
  return data.jobs;
}

