"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { fetchHistory, BackendJob, JobStatus, deleteJob } from "../../lib/api";
import { JobStatusBadge } from "../../components/JobStatusBadge";
import { ConfirmModal } from "../../components/ConfirmModal";
import { Navigation } from "../../components/Navigation";

function convertBackendStatus(status: BackendJob["status"]): JobStatus {
  switch (status) {
    case "WAIT": return "pending";
    case "RUN": return "processing";
    case "DONE": return "completed";
    case "FAIL": return "failed";
    default: return "pending";
  }
}

export default function LibraryPage() {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  
  // Cache auth state to prevent flashing (initialize as null for SSR)
  const [cachedAuthState, setCachedAuthState] = useState<boolean | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Load cached auth state only on client after mount
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem("auth_signed_in");
      if (cached === "true" || cached === "false") {
        setCachedAuthState(cached === "true");
      }
    }
  }, []);
  
  // Update cached auth state when Clerk loads
  useEffect(() => {
    if (isLoaded && isSignedIn !== undefined) {
      const authState = !!isSignedIn;
      setCachedAuthState(authState);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("auth_signed_in", String(authState));
      }
    }
  }, [isLoaded, isSignedIn]);

  // Use cached state if Clerk is still loading and we have a cached value, otherwise use actual state
  // Only use cached state after component has mounted to avoid hydration mismatch
  const userIsSignedIn = isLoaded ? isSignedIn : (isMounted ? cachedAuthState : null);
  
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  const loadJobs = useCallback(async (showLoading = true) => {
    if (!userIsSignedIn) {
      setJobs([]);
      setLoading(false);
      return;
    }

    if (showLoading) setLoading(true);
    else setRefreshing(true);

    try {
      const tokenGetter = async () => await getToken();
      const data = await fetchHistory(tokenGetter);
      setJobs(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load history");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userIsSignedIn, getToken]);

  useEffect(() => {
    loadJobs();
  }, [userIsSignedIn]);

  // Auto-refresh if there are any processing jobs
  useEffect(() => {
    const hasProcessingJobs = jobs.some(job => job.status === "WAIT" || job.status === "RUN");
    if (!hasProcessingJobs) return;

    const intervalId = setInterval(() => {
      loadJobs(false);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [jobs, loadJobs]);

  const handleDeleteClick = (jobId: string) => {
    setJobToDelete(jobId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!jobToDelete) return;
    
    setShowDeleteConfirm(false);
    setDeletingId(jobToDelete);
    try {
      const tokenGetter = async () => await getToken();
      await deleteJob(jobToDelete, tokenGetter);
      setJobs(jobs.filter(j => j.id !== jobToDelete));
    } catch (err: any) {
      setError(err.message || "Failed to delete job");
    } finally {
      setDeletingId(null);
      setJobToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setJobToDelete(null);
  };

  // Show loading state while Clerk is checking auth (only show if no cached state and not mounted yet)
  if (!isLoaded && !isMounted) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-4">
            <div className="w-10 h-10 spinner"></div>
          </div>
          <div className="text-black text-sm">Loading...</div>
        </div>
      </div>
    );
  }

  // Show sign-in prompt if not authenticated (only after Clerk has loaded)
  if (isLoaded && userIsSignedIn === false) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-6">
        <div className="text-center space-y-6 p-8 rounded-2xl bg-white border border-neutral-200 max-w-md">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-black/5 flex items-center justify-center">
            <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-black mb-2">Sign In to View Library</h2>
            <p className="text-gray-600">Access your generated 3D models and manage your creations.</p>
          </div>
          <SignInButton mode="modal">
            <button className="w-full px-6 py-3 text-lg font-semibold bg-black text-white rounded-xl hover:bg-gray-900 transition-all">
              Sign In to Continue
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navigation />
      <div className="space-y-8 px-4 lg:px-8 py-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-4">
      <div>
          <h1 className="text-3xl font-bold text-black">My Library</h1>
          <p className="text-gray-600 mt-2">Your generated 3D models and creations.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadJobs(false)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all disabled:opacity-50"
          >
            <svg className={`w-5 h-5 ${refreshing ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
          <a
            href="/generate"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white font-medium hover:bg-gray-900 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Generation
          </a>
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

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 spinner"></div>
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 rounded-2xl border border-gray-200 bg-gray-50">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-white border border-gray-200 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-black mb-2">No generations yet</h3>
          <p className="text-gray-600 mb-6">Start creating amazing 3D models from text or images.</p>
          <a
            href="/generate"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-black text-white font-medium hover:bg-gray-900 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Create Your First Model
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
            <div
              key={job.id}
              className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-gray-300 transition-all group shadow-sm hover:shadow-md"
            >
              {/* Preview */}
              <div className="aspect-square bg-gray-100 relative">
                {job.previewImageUrl ? (
                  <img
                    src={job.previewImageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gray-200 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <JobStatusBadge status={convertBackendStatus(job.status)} />
                </div>
              </div>

              {/* Info */}
              <div className="p-4 space-y-3">
                <div>
                  {job.prompt ? (
                    <p className="text-sm text-black line-clamp-2">{job.prompt}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Image to 3D</p>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  {new Date(job.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <a
                    href={`/viewer?jobId=${job.id}`}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 hover:text-black transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </a>
                  {job.resultGlbUrl && (
                    <a
                      href={job.resultGlbUrl}
                      download
                      className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-gray-100 text-sm text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  )}
                  <button
                    onClick={() => handleDeleteClick(job.id)}
                    disabled={deletingId === job.id}
                    className="flex items-center justify-center px-3 py-2 rounded-lg bg-gray-100 text-sm text-gray-500 hover:bg-gray-200 hover:text-black transition-colors disabled:opacity-50"
                  >
                    {deletingId === job.id ? (
                      <div className="w-4 h-4 spinner border-black"></div>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        title="Delete Job"
        message="Are you sure you want to delete this job? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        variant="danger"
      />
    </div>
    </>
  );
}
