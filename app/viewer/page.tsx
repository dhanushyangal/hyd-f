"use client";

import { useEffect, useState, Suspense } from "react";
import { fetchStatus, Job, getGlbUrl, getPreviewImageUrl, cancelJob } from "../../lib/api";
import { ThreeViewer } from "../../components/ThreeViewer";
import { JobStatusBadge } from "../../components/JobStatusBadge";
import { LoadingProgress } from "../../components/LoadingProgress";
import { useSearchParams } from "next/navigation";

const POLL_INTERVAL = 5000;

function ViewerContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId") || "";
  const mode = (searchParams.get("mode") || "text-to-3d") as "text-to-3d" | "image-to-3d";
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!jobId) return;
    let active = true;

    const fetchAndSchedule = async () => {
      try {
        const data = await fetchStatus(jobId);
        if (!active) return;
        setJob(data);
        // Continue polling if job is still processing
        if (data.status === "pending" || data.status === "processing") {
          setTimeout(fetchAndSchedule, POLL_INTERVAL);
        }
      } catch (err: any) {
        if (!active) return;
        setError(err.message || "Failed to fetch status");
        // Retry on error
        setTimeout(fetchAndSchedule, POLL_INTERVAL * 2);
      }
    };

    fetchAndSchedule();
    return () => {
      active = false;
    };
  }, [jobId]);

  if (!jobId) {
    return <div className="text-sm text-red-600">jobId is required in query string.</div>;
  }

  // Always use jobId if available to get fresh URL from API
  // This avoids expired presigned URLs from database
  const glbUrl = jobId ? getGlbUrl(job || {} as Job, jobId) : (job ? getGlbUrl(job) : null);
  const previewUrl = job ? getPreviewImageUrl(job) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">3D Model Viewer</h1>
          <p className="text-sm text-slate-600">Job ID: {jobId}</p>
        </div>
        {job && <JobStatusBadge status={job.status} />}
      </div>

      {error && <div className="rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</div>}

      {job && job.status === "failed" && (
        <div className="rounded border bg-white p-4 shadow-sm">
          <div className="font-semibold text-red-700">Job failed</div>
          <div className="text-sm text-red-600">{job.error || "Unknown error"}</div>
        </div>
      )}

      {job && job.status === "cancelled" && (
        <div className="rounded border bg-yellow-100 p-4 shadow-sm">
          <div className="font-semibold text-yellow-700">Job cancelled</div>
          <div className="text-sm text-yellow-600">{job.error || "Job was cancelled by user"}</div>
        </div>
      )}

      {job && job.status === "completed" && (
        <div className="space-y-4">
          {glbUrl ? (
            <>
              <ThreeViewer glbUrl={glbUrl} />
              <div className="flex items-center gap-3 flex-wrap">
                <a
                  href={glbUrl}
                  download
                  className="rounded bg-emerald-600 px-4 py-2 text-white shadow hover:bg-emerald-700 transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Download GLB
                </a>
                {previewUrl && (
                  <a
                    href={previewUrl}
                    className="rounded bg-blue-600 px-4 py-2 text-white shadow hover:bg-blue-700 transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Preview Image
                  </a>
                )}
                {job.result && (
                  <div className="text-sm text-slate-600">
                    Completed in {job.result.elapsed_seconds}s
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded border bg-yellow-50 p-4 text-sm text-yellow-800">
              Job completed but GLB URL is not available yet. Please wait a moment and refresh.
            </div>
          )}
        </div>
      )}

      {job && (job.status === "pending" || job.status === "processing") && (
        <div className="space-y-4">
          <LoadingProgress 
            job={job} 
            mode={job.result?.mode || mode}
          />
          <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
            <div className="space-y-3">
              <p className="text-sm text-red-800">
                ⚠️ Note: 3D generation cannot be interrupted mid-process. Cancellation will stop at the next checkpoint.
              </p>
              <button
                onClick={async () => {
                  if (!jobId || cancelling) return;
                  setCancelling(true);
                  try {
                    const result = await cancelJob(jobId);
                    setError(null);
                    // Update job status immediately
                    setJob(prev => prev ? { ...prev, status: "cancelled" as Job["status"], message: result.message } : null);
                  } catch (err: any) {
                    setError(err.message || "Failed to cancel job");
                  } finally {
                    setCancelling(false);
                  }
                }}
                disabled={cancelling}
                className="w-full px-4 py-2 rounded bg-red-500 text-white font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {cancelling ? "⏹️ Cancelling..." : "🛑 Cancel 3D Generation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ViewerPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-600">Loading...</div>}>
      <ViewerContent />
    </Suspense>
  );
}

