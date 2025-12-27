"use client";

import { useEffect, useState, Suspense, useRef } from "react";
import { fetchStatus, Job, getGlbUrl, getPreviewImageUrl, cancelJob } from "../../lib/api";
import { ThreeViewer } from "../../components/ThreeViewer";
import { JobStatusBadge } from "../../components/JobStatusBadge";
import { useSearchParams } from "next/navigation";
import { ConfirmModal } from "../../components/ConfirmModal";
import { Navigation } from "../../components/Navigation";

// Force dynamic rendering to prevent prerendering errors with useSearchParams
export const dynamic = 'force-dynamic';

const POLL_INTERVAL = 5000;

function ViewerContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId") || "";
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [modelGenerationProgress, setModelGenerationProgress] = useState(0);
  const modelProgressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Start progress simulation when job is pending/processing
  useEffect(() => {
    if (job && (job.status === "pending" || job.status === "processing") && modelProgressIntervalRef.current === null) {
      const modelDuration = 150000; // 2 minutes 30 seconds = 150 seconds
      const updateInterval = 500; // Update every 500ms
      const progressStep = (100 / modelDuration) * updateInterval;

      setModelGenerationProgress(0);

      // Start progress simulation - runs for full 2m 30s
      modelProgressIntervalRef.current = setInterval(() => {
        setModelGenerationProgress(prev => {
          if (prev >= 99) {
            // Stop at 99% - wait for actual completion
            if (modelProgressIntervalRef.current) {
              clearInterval(modelProgressIntervalRef.current);
              modelProgressIntervalRef.current = null;
            }
            return 99;
          }
          return Math.min(prev + progressStep, 99);
        });
      }, updateInterval);
    } else if (job && (job.status === "completed" || job.status === "failed" || job.status === "cancelled")) {
      // Clear progress simulation when job completes
      if (modelProgressIntervalRef.current) {
        clearInterval(modelProgressIntervalRef.current);
        modelProgressIntervalRef.current = null;
      }
      setModelGenerationProgress(100);
    }

    return () => {
      if (modelProgressIntervalRef.current) {
        clearInterval(modelProgressIntervalRef.current);
        modelProgressIntervalRef.current = null;
      }
    };
  }, [job]);

  useEffect(() => {
    if (!jobId) return;
    let active = true;

    const fetchAndSchedule = async () => {
      try {
        const data = await fetchStatus(jobId);
        if (!active) return;
        setJob(data);
        if (data.status === "pending" || data.status === "processing") {
          setTimeout(fetchAndSchedule, POLL_INTERVAL);
        }
      } catch (err: any) {
        if (!active) return;
        setError(err.message || "Failed to fetch status");
        setTimeout(fetchAndSchedule, POLL_INTERVAL * 2);
      }
    };

    fetchAndSchedule();
    return () => {
      active = false;
    };
  }, [jobId]);

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const handleCancelConfirm = async () => {
    setShowCancelConfirm(false);
    setCancelling(true);
    try {
      await cancelJob(jobId);
      setJob((prev) => prev ? { ...prev, status: "cancelled" } : null);
    } catch (err: any) {
      setError(err.message || "Failed to cancel job");
    } finally {
      setCancelling(false);
    }
  };

  const handleCancelModalCancel = () => {
    setShowCancelConfirm(false);
  };

  if (!jobId) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center p-8 rounded-2xl bg-white border border-gray-200 shadow-lg">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-black/5 flex items-center justify-center">
            <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-black mb-2">Job ID Required</h2>
          <p className="text-gray-600 mb-4">Please provide a job ID in the URL.</p>
          <a href="/generate" className="text-black hover:text-gray-700 transition-colors">
            ← Go to Generate
          </a>
        </div>
      </div>
    );
  }

  const glbUrl = job ? getGlbUrl(job) : null;
  const previewUrl = job ? getPreviewImageUrl(job) : null;

  return (
    <div className="space-y-6 px-4 lg:px-8 py-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-black">3D Model Viewer</h1>
          <p className="text-gray-600 mt-1">
            Job ID: <code className="bg-gray-100 px-2 py-1 rounded text-black text-sm">{jobId}</code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {job && <JobStatusBadge status={job.status} />}
          {job && (job.status === "pending" || job.status === "processing") && (
            <button
              onClick={handleCancelClick}
              disabled={cancelling}
              className="px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-black transition-colors disabled:opacity-50"
            >
              {cancelling ? "Cancelling..." : "Cancel Job"}
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {job && job.status === "failed" && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-black">Generation Failed</div>
              <div className="text-sm text-red-700">{job.error || "An error occurred during generation"}</div>
            </div>
          </div>
        </div>
      )}

      {job && job.status === "cancelled" && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-black">Job Cancelled</div>
              <div className="text-sm text-gray-600">{job.error || "This job was cancelled"}</div>
            </div>
          </div>
        </div>
      )}

      {job && job.status === "completed" && (
        <div className="space-y-6">
          {glbUrl ? (
            <>
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
                <ThreeViewer glbUrl={glbUrl} />
              </div>
              <div className="flex items-center gap-4 flex-wrap">
                <a
                  href={glbUrl}
                  download
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-900 transition-all"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download GLB
                </a>
                {previewUrl && (
                  <a
                    href={previewUrl}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    View Preview Image
                  </a>
                )}
                {job.result && (
                  <div className="text-sm text-gray-600">
                    Completed in {job.result.elapsed_seconds}s
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 text-black">
              Job completed but GLB URL is not available yet. Please refresh.
            </div>
          )}
        </div>
      )}

      {job && (job.status === "pending" || job.status === "processing") && (
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-8">
          <div className="w-full max-w-md mx-auto">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-black mb-2">Generating your 3D model...</h3>
              <p className="text-3xl font-bold text-black mb-1">{Math.round(modelGenerationProgress)}%</p>
              <p className="text-sm text-neutral-400">Estimated time: ~2m 30s</p>
            </div>
            
            {/* Linear Progress Bar */}
            <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden mb-4">
              <div 
                className="h-full bg-black rounded-full transition-all duration-500 ease-out"
                style={{ width: `${modelGenerationProgress}%` }}
              ></div>
            </div>
            
            {/* Progress Steps */}
            <div className="flex justify-between text-xs text-neutral-400">
              <span>Processing</span>
              <span>Rendering</span>
              <span>Finalizing</span>
            </div>
          </div>
        </div>
      )}

      {!job && !error && (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-gray-600">
            <div className="w-6 h-6 spinner"></div>
            <span>Loading job status...</span>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <ConfirmModal
        isOpen={showCancelConfirm}
        title="Cancel Job"
        message="Are you sure you want to cancel this job? The generation process will be stopped."
        confirmText="Cancel Job"
        cancelText="Keep Running"
        onConfirm={handleCancelConfirm}
        onCancel={handleCancelModalCancel}
        variant="warning"
      />
    </div>
  );
}

export default function ViewerPage() {
  return (
    <>
      <Navigation />
      <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-gray-600">
          <div className="w-6 h-6 spinner"></div>
          <span>Loading...</span>
        </div>
      </div>
    }>
      <ViewerContent />
    </Suspense>
    </>
  );
}
