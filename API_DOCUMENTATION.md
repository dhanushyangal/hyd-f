# API Documentation for Frontend Developers

This document provides comprehensive API documentation for the Hydrilla 3D Generation Platform. The system consists of two backends:

1. **Node.js/TypeScript Backend** (`backend/`) - Main API server handling authentication, database operations, and job management
2. **Python Backend** (`app_improved.py`) - FastAPI server handling 3D model generation, image processing, and GPU operations

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Authentication](#authentication)
3. [Node.js Backend API](#nodejs-backend-api)
4. [Python Backend API](#python-backend-api)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Examples](#examples)

---

## Architecture Overview

### System Flow

```
Frontend (Next.js)
    ↓
Node.js Backend (Express) - Handles auth, DB, job management
    ↓
Python Backend (FastAPI) - Handles 3D generation, GPU processing
    ↓
S3 Storage - Stores generated models and images
```

### Base URLs

- **Node.js Backend**: `process.env.NEXT_PUBLIC_BACKEND_URL` (default: `http://localhost:4000`)
- **Python Backend**: `process.env.NEXT_PUBLIC_API_URL` (default: `https://api.hydrilla.co`)

### Status Mapping

| Node.js Backend | Python Backend | Description |
|----------------|----------------|-------------|
| `WAIT` | `pending` | Job is queued, waiting to start |
| `RUN` | `processing` | Job is actively processing |
| `DONE` | `completed` | Job completed successfully |
| `FAIL` | `failed` / `cancelled` | Job failed or was cancelled |

---

## Authentication

The system uses **Clerk** for authentication. All protected endpoints require a valid Clerk JWT token in the `Authorization` header.

### Getting Auth Token (Client-Side)

```typescript
import { useAuth } from "@clerk/nextjs";

const { getToken } = useAuth();
const token = await getToken();

// Include in headers
headers: {
  "Authorization": `Bearer ${token}`,
  "Content-Type": "application/json"
}
```

### Auth Middleware

- **`requireAuth`**: Endpoint requires authentication (returns 401 if not authenticated)
- **`optionalAuth`**: Endpoint works with or without authentication (returns empty data if not authenticated)

---

## Node.js Backend API

Base URL: `NEXT_PUBLIC_BACKEND_URL` (default: `http://localhost:4000`)

All endpoints are prefixed with `/api/3d`

### 1. Generate 3D Model

**Endpoint**: `POST /api/3d/generate`  
**Auth**: Required  
**Description**: Submit a job to generate a 3D model from text prompt or image

#### Request Body

**Text-to-3D:**
```json
{
  "prompt": "A red sports car"
}
```

**Image-to-3D:**
```json
{
  "imageUrl": "https://example.com/image.jpg"
}
```

#### Response

```json
{
  "jobId": "uuid-string"
}
```

#### Example

```typescript
const response = await fetch(`${backendBase}/api/3d/generate`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "A red sports car"
  })
});

const { jobId } = await response.json();
```

---

### 2. Get Job Status

**Endpoint**: `GET /api/3d/status/:jobId`  
**Auth**: Optional  
**Description**: Get the current status of a job, including progress and queue information

#### Response

```json
{
  "job": {
    "id": "uuid-string",
    "userId": "user_xxx",
    "status": "WAIT" | "RUN" | "DONE" | "FAIL",
    "prompt": "A red sports car",
    "imageUrl": null,
    "resultGlbUrl": "https://s3.../mesh.glb",
    "previewImageUrl": "https://s3.../preview.png",
    "errorMessage": null,
    "name": "My 3D Model",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T00:00:00Z"
  },
  "queue": {
    "position": 0,
    "jobs_ahead": 0,
    "estimated_wait_seconds": 0,
    "estimated_total_seconds": 130,
    "queue_length": 0,
    "currently_processing": true
  }
}
```

#### Example

```typescript
const response = await fetch(`${backendBase}/api/3d/status/${jobId}`, {
  headers: {
    "Authorization": `Bearer ${token}`
  }
});

const { job, queue } = await response.json();
```

---

### 3. Get Job History

**Endpoint**: `GET /api/3d/history`  
**Auth**: Optional (returns empty array if not authenticated)  
**Description**: Get all jobs for the authenticated user

#### Response

```json
{
  "jobs": [
    {
      "id": "uuid-string",
      "userId": "user_xxx",
      "status": "DONE",
      "prompt": "A red sports car",
      "resultGlbUrl": "https://s3.../mesh.glb",
      "previewImageUrl": "https://s3.../preview.png",
      "name": "My 3D Model",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Example

```typescript
const response = await fetch(`${backendBase}/api/3d/history`, {
  headers: {
    "Authorization": `Bearer ${token}`
  }
});

const { jobs } = await response.json();
```

---

### 4. Update Job Name

**Endpoint**: `PATCH /api/3d/jobs/:jobId/name`  
**Auth**: Required  
**Description**: Update the name of a job

#### Request Body

```json
{
  "name": "My Custom Name"
}
```

#### Response

```json
{
  "success": true,
  "message": "Job name updated"
}
```

#### Example

```typescript
const response = await fetch(`${backendBase}/api/3d/jobs/${jobId}/name`, {
  method: "PATCH",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: "My Custom Name"
  })
});
```

---

### 5. Delete Job

**Endpoint**: `DELETE /api/3d/jobs/:jobId`  
**Auth**: Required  
**Description**: Delete a job (only if you own it)

#### Response

```json
{
  "success": true,
  "message": "Job deleted"
}
```

---

### 6. Register Job (Internal)

**Endpoint**: `POST /api/3d/register-job`  
**Auth**: Optional  
**Description**: Register a job in the database (used internally when preview images are generated)

#### Request Body

```json
{
  "job_id": "uuid-string",
  "prompt": "A red sports car",
  "previewImageUrl": "https://s3.../preview.png"
}
```

#### Response

```json
{
  "success": true,
  "job_id": "uuid-string"
}
```

**Note**: This endpoint is typically called automatically by the frontend after generating a preview image. It creates a job record with status `DONE` if only `previewImageUrl` is provided.

---

### 7. Upload Image

**Endpoint**: `POST /api/3d/upload-image`  
**Auth**: Optional  
**Description**: Upload an image file to S3 and get a public URL

#### Request

**Form Data:**
- `image`: File (multipart/form-data)

#### Response

```json
{
  "success": true,
  "url": "https://s3.../uploads/image-1234567890.jpg"
}
```

#### Example

```typescript
const formData = new FormData();
formData.append("image", file);

const response = await fetch(`${backendBase}/api/3d/upload-image`, {
  method: "POST",
  body: formData
});

const { url } = await response.json();
```

---

### 8. Get Queue Info

**Endpoint**: `GET /api/3d/queue/info`  
**Auth**: Not required  
**Description**: Get current queue statistics for accurate time estimation

#### Response

```json
{
  "queue_length": 2,
  "currently_processing": true,
  "waiting_jobs": 2,
  "estimated_wait_for_new_job_seconds": 260,
  "estimated_time_per_job_seconds": 130,
  "preview_queue_length": 1,
  "currently_generating_preview": false,
  "preview_waiting": 1,
  "estimated_wait_for_preview_seconds": 20,
  "estimated_preview_time_seconds": 20
}
```

---

### 9. Get Current User Profile

**Endpoint**: `GET /api/3d/me`  
**Auth**: Required  
**Description**: Get the current authenticated user's profile and statistics

#### Response

```json
{
  "user": {
    "id": "user_xxx",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "imageUrl": "https://...",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "stats": {
    "totalJobs": 10,
    "completedJobs": 8
  }
}
```

---

### 10. Sync User

**Endpoint**: `POST /api/3d/sync-user`  
**Auth**: Required  
**Description**: Sync the authenticated user to the database (called automatically on first request)

#### Response

```json
{
  "success": true,
  "user": {
    "id": "user_xxx",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

---

## Python Backend API

Base URL: `NEXT_PUBLIC_API_URL` (default: `https://api.hydrilla.co`)

**Note**: The frontend typically does NOT call the Python backend directly. All requests go through the Node.js backend, which then calls the Python backend. However, for preview image generation, the frontend may call the Python backend directly.

### 1. Generate Preview Image (Text-to-Image)

**Endpoint**: `POST /text-to-image`  
**Auth**: Not required (but `user_id` can be passed)  
**Description**: Generate a preview image from a text prompt (synchronous, returns immediately)

#### Request

**Form Data:**
- `prompt`: string (required)
- `user_id`: string (optional)

#### Response

```json
{
  "success": true,
  "preview_id": "uuid-string",
  "image_url": "https://s3.../preview_image.png",
  "prompt": "A red sports car",
  "message": "Preview image generated successfully",
  "queue": {
    "position": 0,
    "previews_ahead": 0,
    "estimated_wait_seconds": 0,
    "estimated_total_seconds": 20,
    "queue_length": 0,
    "currently_generating": false
  }
}
```

#### Example

```typescript
const formData = new URLSearchParams();
formData.append("prompt", "A red sports car");

const response = await fetch(`${apiBase}/text-to-image`, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded"
  },
  body: formData.toString()
});

const data = await response.json();
// data.image_url contains the preview image URL
```

---

### 2. Submit Image-to-3D Job

**Endpoint**: `POST /image-to-3d`  
**Auth**: Not required (handled by Node.js backend)  
**Description**: Submit an image-to-3D generation job (asynchronous)

#### Request

**Form Data:**
- `image_url`: string (required) - Public URL of the image
- `image_file`: File (optional) - Direct file upload (requires S3)
- `user_id`: string (optional) - User ID (typically not sent from frontend)

#### Response

```json
{
  "job_id": "uuid-string",
  "status": "pending",
  "message": "Job created successfully. Use /status/{job_id} to check progress.",
  "status_url": "/status/{job_id}",
  "stream_url": "/stream/{job_id}"
}
```

**Note**: The frontend should NOT call this directly. Use the Node.js backend endpoint `/api/3d/generate` instead.

---

### 3. Submit Text-to-3D Job

**Endpoint**: `POST /text-to-3d`  
**Auth**: Not required (handled by Node.js backend)  
**Description**: Submit a text-to-3D generation job (asynchronous)

#### Request

**Form Data:**
- `prompt`: string (required)
- `user_id`: string (optional) - User ID (typically not sent from frontend)

#### Response

```json
{
  "job_id": "uuid-string",
  "status": "pending",
  "message": "Job created successfully. Use /status/{job_id} to check progress.",
  "status_url": "/status/{job_id}",
  "stream_url": "/stream/{job_id}"
}
```

**Note**: The frontend should NOT call this directly. Use the Node.js backend endpoint `/api/3d/generate` instead.

---

### 4. Get Job Status (Python Backend)

**Endpoint**: `GET /status/:jobId`  
**Auth**: Not required  
**Description**: Get the status of a job from the Python backend

#### Response

```json
{
  "job_id": "uuid-string",
  "user_id": "user_xxx",
  "status": "pending" | "processing" | "completed" | "failed" | "cancelled",
  "progress": 50,
  "message": "Generating 3D mesh...",
  "created_at": 1704067200,
  "updated_at": 1704067250,
  "queue": {
    "position": 0,
    "jobs_ahead": 0,
    "estimated_wait_seconds": 0,
    "estimated_total_seconds": 130,
    "queue_length": 0,
    "currently_processing": true
  },
  "result": {
    "job_id": "uuid-string",
    "mode": "image-to-3d",
    "mesh_url": "https://s3.../mesh.glb",
    "processed_image_url": "https://s3.../processed_image.png",
    "elapsed_seconds": 125.5
  },
  "error": "Error message if failed"
}
```

**Note**: The frontend should use the Node.js backend endpoint `/api/3d/status/:jobId` instead, which provides better error handling and ownership checks.

---

### 5. Get Queue Info

**Endpoint**: `GET /queue/info`  
**Auth**: Not required  
**Description**: Get current queue statistics

#### Response

```json
{
  "queue_length": 2,
  "currently_processing": true,
  "waiting_jobs": 2,
  "estimated_wait_for_new_job_seconds": 260,
  "estimated_time_per_job_seconds": 130,
  "preview_queue_length": 1,
  "currently_generating_preview": false,
  "preview_waiting": 1,
  "estimated_wait_for_preview_seconds": 20,
  "estimated_preview_time_seconds": 20
}
```

---

### 6. Cancel Job

**Endpoint**: `POST /cancel/:jobId`  
**Auth**: Not required  
**Description**: Cancel a running or pending job

#### Response

```json
{
  "job_id": "uuid-string",
  "status": "cancelled",
  "message": "Job cancellation requested. It will stop at the next checkpoint."
}
```

---

### 7. Health Check

**Endpoint**: `GET /health`  
**Auth**: Not required  
**Description**: Check if the Python backend is running

#### Response

```json
{
  "status": "ok"
}
```

---

## Data Models

### Job Record (Node.js Backend)

```typescript
interface BackendJob {
  id: string;
  userId: string | null;
  status: "WAIT" | "RUN" | "DONE" | "FAIL";
  prompt: string | null;
  imageUrl: string | null;
  generateType: string;
  faceCount: number | null;
  enablePBR: boolean;
  polygonType: string | null;
  resultGlbUrl: string | null;        // URL to the generated .glb file
  previewImageUrl: string | null;      // URL to the preview image
  errorCode: string | null;
  errorMessage: string | null;
  name: string | null;                 // User-defined name for the job
  createdAt: string;
  updatedAt: string;
}
```

### Job Status (Python Backend)

```typescript
interface Job {
  job_id: string;
  user_id?: string;
  status: "pending" | "processing" | "completed" | "failed" | "cancelled";
  progress: number;                    // 0-100
  message: string;
  created_at?: number;
  updated_at?: number;
  queue?: QueueInfo;
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
```

### Queue Info

```typescript
interface QueueInfo {
  position: number;                    // 0 = processing, 1+ = waiting
  jobs_ahead: number;
  estimated_wait_seconds: number;
  estimated_total_seconds: number;
  queue_length: number;
  currently_processing: boolean;
}
```

---

## Error Handling

### Standard Error Response

All endpoints return errors in the following format:

```json
{
  "error": "Error message here"
}
```

### HTTP Status Codes

- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Internal Server Error
- `503` - Service Unavailable (external service down)

### Common Error Scenarios

1. **Authentication Required**
   ```json
   {
     "error": "Authentication required"
   }
   ```

2. **Job Not Found**
   ```json
   {
     "error": "Job not found"
   }
   ```

3. **Permission Denied**
   ```json
   {
     "error": "You don't have permission to view this job"
   }
   ```

4. **Invalid Input**
   ```json
   {
     "error": "Either prompt or imageUrl is required"
   }
   ```

5. **External Service Unavailable**
   ```json
   {
     "error": "External service unavailable. Please try again later."
   }
   ```

---

## Examples

### Complete Workflow: Text-to-3D

```typescript
// 1. Generate preview image
const formData = new URLSearchParams();
formData.append("prompt", "A red sports car");

const previewResponse = await fetch(`${apiBase}/text-to-image`, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: formData.toString()
});

const previewData = await previewResponse.json();
const previewImageUrl = previewData.image_url;

// 2. Register job with preview
await fetch(`${backendBase}/api/3d/register-job`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    job_id: previewData.preview_id,
    prompt: "A red sports car",
    previewImageUrl: previewImageUrl
  })
});

// 3. Generate 3D model (if user clicks "Generate 3D")
const generateResponse = await fetch(`${backendBase}/api/3d/generate`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    prompt: "A red sports car"
  })
});

const { jobId } = await generateResponse.json();

// 4. Poll for status
const pollStatus = async () => {
  const response = await fetch(`${backendBase}/api/3d/status/${jobId}`, {
    headers: { "Authorization": `Bearer ${token}` }
  });
  
  const { job, queue } = await response.json();
  
  if (job.status === "DONE") {
    // Job completed! Use job.resultGlbUrl for the 3D model
    console.log("3D Model:", job.resultGlbUrl);
  } else if (job.status === "FAIL") {
    console.error("Job failed:", job.errorMessage);
  } else {
    // Still processing, check again in 2 seconds
    console.log(`Progress: ${job.status}, Queue: ${queue.position}`);
    setTimeout(pollStatus, 2000);
  }
};

pollStatus();
```

### Complete Workflow: Image-to-3D

```typescript
// 1. Upload image
const formData = new FormData();
formData.append("image", file);

const uploadResponse = await fetch(`${backendBase}/api/3d/upload-image`, {
  method: "POST",
  body: formData
});

const { url: imageUrl } = await uploadResponse.json();

// 2. Generate 3D model
const generateResponse = await fetch(`${backendBase}/api/3d/generate`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    imageUrl: imageUrl
  })
});

const { jobId } = await generateResponse.json();

// 3. Poll for status (same as text-to-3D)
```

### Update Job Name

```typescript
const response = await fetch(`${backendBase}/api/3d/jobs/${jobId}/name`, {
  method: "PATCH",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: "My Custom Model Name"
  })
});

const { success } = await response.json();
```

### Get User History

```typescript
const response = await fetch(`${backendBase}/api/3d/history`, {
  headers: {
    "Authorization": `Bearer ${token}`
  }
});

const { jobs } = await response.json();

jobs.forEach(job => {
  console.log(`${job.name || job.prompt}: ${job.status}`);
  if (job.resultGlbUrl) {
    console.log(`3D Model: ${job.resultGlbUrl}`);
  }
});
```

---

## Important Notes for Frontend Developers

### 1. **Always use Node.js Backend for Job Operations**

The frontend should **never** call the Python backend directly for job submission or status checking. Always use:
- `/api/3d/generate` instead of `/text-to-3d` or `/image-to-3d`
- `/api/3d/status/:jobId` instead of `/status/:jobId`

The only exception is `/text-to-image` for preview generation, which can be called directly.

### 2. **Preview Image Generation**

When generating a preview image:
1. Call `/text-to-image` on Python backend
2. Immediately call `/api/3d/register-job` to create a job record with the preview
3. This ensures the preview appears in the user's history

### 3. **Status Polling**

- Poll `/api/3d/status/:jobId` every 2-3 seconds while job is `WAIT` or `RUN`
- Stop polling when status is `DONE` or `FAIL`
- Display queue information to users for better UX

### 4. **Error Handling**

- Always check `response.ok` before parsing JSON
- Handle 401 errors by redirecting to login
- Handle 403 errors by showing a permission denied message
- Handle 503 errors by showing "Service temporarily unavailable"

### 5. **Authentication**

- Always include `Authorization: Bearer ${token}` header for protected endpoints
- Use Clerk's `getToken()` to get the token
- Handle token expiration gracefully

### 6. **File Uploads**

- Use `FormData` for file uploads
- Don't set `Content-Type` header manually for FormData (browser sets it automatically)
- Maximum file size: 10MB

### 7. **Queue Information**

- Always display queue information to users for transparency
- Use `estimated_total_seconds` for accurate time estimates
- Show `jobs_ahead` count for better UX

---

## Environment Variables

### Frontend (.env.local)

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_API_URL=https://api.hydrilla.co
```

### Node.js Backend

```env
HUNYUAN_API_URL=https://api.hydrilla.co
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=sk_...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET=hunyuan3d-outputs
S3_REGION=us-east-1
```

---

## Support

For questions or issues, please contact the backend team or refer to the codebase:
- Node.js Backend: `backend/src/routes/threeD.ts`
- Python Backend: `app_improved.py`

