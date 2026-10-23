"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth, SignInButton } from "@clerk/nextjs";
import {
  AlertCircle,
  Download,
  Eye,
  LoaderCircle,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

import Footer from "@/components/layout/Footer";
import { ConfirmModal } from "@/components/ConfirmModal";
import { JobStatusBadge } from "@/components/JobStatusBadge";
import {
  deleteJob,
  fetchHistory,
  type BackendJob,
  type JobStatus,
} from "@/lib/api";

function convertBackendStatus(status: BackendJob["status"]): JobStatus {
  switch (status) {
    case "WAIT":
      return "pending";
    case "RUN":
      return "processing";
    case "DONE":
      return "completed";
    case "FAIL":
      return "failed";
    default:
      return "pending";
  }
}

function formatCreatedAt(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

interface LibraryCardProps {
  job: BackendJob;
  viewHref: string;
  onDelete: (id: string) => void;
  deletingId: string | null;
  showDownloadGlb: boolean;
}

function LibraryCard({
  job,
  viewHref,
  onDelete,
  deletingId,
  showDownloadGlb,
}: LibraryCardProps) {
  const imageUrl = job.previewImageUrl || job.imageUrl;
  const deleting = deletingId === job.id;
  const isProcessing = job.status === "RUN" || job.status === "WAIT";

  return (
    <li className="pickle-research-card">
      <div className="pickle-research-thumbnail relative">
        <Link href={viewHref} className="block h-full w-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={job.prompt || "Generated asset preview"}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-[#f5f5f7] text-[14px] text-black/45">
              3D Asset
            </div>
          )}
        </Link>

        <div className="absolute left-3.5 top-3.5">
          <JobStatusBadge status={convertBackendStatus(job.status)} />
        </div>

        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px]">
            <LoaderCircle className="h-7 w-7 animate-spin text-white" />
          </div>
        )}
      </div>

      <Link href={viewHref} className="no-underline">
        <h2 className="pickle-research-card-title line-clamp-1">
          {job.prompt || "Image to 3D"}
        </h2>
      </Link>
      <p className="pickle-research-card-subtitle">
        {job.resultGlbUrl
          ? "Segmented 3D mesh with PBR maps ready for studio inspection and export."
          : "Generated reference frame ready for 3D synthesis."}
      </p>

      <div className="pickle-research-card-meta justify-between">
        <div className="flex items-center gap-3.5">
          <span>{formatCreatedAt(job.createdAt)}</span>
          <span className="pickle-research-card-divider" aria-hidden="true" />
          <span>{job.resultGlbUrl ? "3D Asset" : "Reference Image"}</span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={viewHref}
            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-black/15 px-3 text-[13px] font-medium text-black no-underline hover:bg-black/5"
          >
            <Eye className="h-3.5 w-3.5" />
            View
          </Link>
          {showDownloadGlb && job.resultGlbUrl && (
            <a
              href={job.resultGlbUrl}
              download
              title="Download GLB file"
              aria-label="Download GLB file"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/15 text-black hover:bg-black/5"
            >
              <Download className="h-3.5 w-3.5" />
            </a>
          )}
          <button
            type="button"
            onClick={() => onDelete(job.id)}
            disabled={deleting}
            aria-label="Delete generation"
            title="Delete"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 text-black/50 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            {deleting ? (
              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </li>
  );
}

export default function LibraryPage() {
  const { isSignedIn, getToken, isLoaded } = useAuth();
  const [cachedAuthState, setCachedAuthState] = useState<boolean | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
    const cached = window.sessionStorage.getItem("auth_signed_in");
    if (cached === "true" || cached === "false") {
      setCachedAuthState(cached === "true");
    }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn !== undefined) {
      const authState = Boolean(isSignedIn);
      setCachedAuthState(authState);
      window.sessionStorage.setItem("auth_signed_in", String(authState));
    }
  }, [isLoaded, isSignedIn]);

  const userIsSignedIn = isLoaded
    ? isSignedIn
    : isMounted
      ? cachedAuthState
      : null;

  const loadJobs = useCallback(
    async (showLoading = true) => {
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
      } catch (loadError: unknown) {
        setError(
          loadError instanceof Error ? loadError.message : "Failed to load history"
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [getToken, userIsSignedIn]
  );

  useEffect(() => {
    void loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    const hasProcessingJobs = jobs.some(
      (job) => job.status === "WAIT" || job.status === "RUN"
    );
    if (!hasProcessingJobs) return;

    const intervalId = window.setInterval(() => {
      void loadJobs(false);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [jobs, loadJobs]);

  const objects3d = useMemo(
    () => jobs.filter((job) => job.resultGlbUrl),
    [jobs]
  );
  const images = useMemo(
    () =>
      jobs.filter(
        (job) => (job.previewImageUrl || job.imageUrl) && !job.resultGlbUrl
      ),
    [jobs]
  );

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
      setJobs((current) => current.filter((job) => job.id !== jobToDelete));
    } catch (deleteError: unknown) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Failed to delete job"
      );
    } finally {
      setDeletingId(null);
      setJobToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setJobToDelete(null);
  };

  return (
    <>
      <div className="pickle-research-page">
        <header className="pickle-research-hero">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="pickle-research-title">3D Asset Library</h1>
              <p className="pickle-research-description">
                Review, inspect, and download every reference image and 3D mesh generated with BlueFox 1.
              </p>
            </div>

            {userIsSignedIn ? (
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => void loadJobs(false)}
                  disabled={refreshing}
                  className="pickle-glass-pill"
                  style={{ height: "48px", fontSize: "16px", padding: "0 20px", cursor: "pointer" }}
                >
                  <RefreshCw
                    className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  {refreshing ? "Refreshing…" : "Refresh"}
                </button>
                <Link href="/generate" className="pickle-pill-solid">
                  <Plus className="h-4 w-4" />
                  New generation
                </Link>
              </div>
            ) : null}
          </div>
        </header>

        <div className="pickle-research-container" style={{ marginTop: "56px" }}>
          {!isLoaded && !isMounted ? (
            <div className="flex min-h-[280px] items-center justify-center">
              <LoaderCircle className="h-7 w-7 animate-spin text-black/40" />
            </div>
          ) : isLoaded && userIsSignedIn === false ? (
            <div
              className="pickle-card-surface"
              style={{ maxWidth: "600px", padding: "40px 36px" }}
            >
              <h2 className="pickle-h3" style={{ width: "100%" }}>
                Sign in to view your library
              </h2>
              <p className="pickle-text" style={{ width: "100%", marginTop: "12px" }}>
                Your generated meshes, PBR maps, and reference images are stored privately in your Hydrilla account.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <SignInButton mode="modal">
                  <button type="button" className="pickle-pill-solid">
                    Sign in to continue
                  </button>
                </SignInButton>
                <Link
                  href="/docs"
                  className="pickle-glass-pill"
                  style={{ height: "48px", fontSize: "16px", padding: "0 22px" }}
                >
                  Read documentation
                </Link>
              </div>
            </div>
          ) : (
            <>
              {error && (
                <div
                  role="alert"
                  className="mb-8 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-[15px] text-red-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              {loading ? (
                <div className="flex min-h-[280px] items-center justify-center">
                  <LoaderCircle className="h-7 w-7 animate-spin text-black/40" />
                </div>
              ) : jobs.length === 0 ? (
                <div
                  className="pickle-card-surface"
                  style={{ maxWidth: "600px", padding: "40px 36px" }}
                >
                  <h2 className="pickle-h3" style={{ width: "100%" }}>
                    Your archive is empty
                  </h2>
                  <p className="pickle-text" style={{ width: "100%", marginTop: "12px" }}>
                    Generate a 3D model from text or a reference image and it will appear here automatically.
                  </p>
                  <div className="mt-7">
                    <Link href="/generate" className="pickle-pill-solid">
                      Create your first asset
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-20">
                  {objects3d.length > 0 && (
                    <section>
                      <h2 className="pickle-h2" style={{ width: "100%", marginBottom: "28px" }}>
                        3D Assets ({objects3d.length})
                      </h2>
                      <ul className="pickle-research-grid" style={{ width: "100%", marginTop: 0 }}>
                        {objects3d.map((job) => (
                          <LibraryCard
                            key={job.id}
                            job={job}
                            viewHref={`/viewer?jobId=${job.id}`}
                            onDelete={handleDeleteClick}
                            deletingId={deletingId}
                            showDownloadGlb
                          />
                        ))}
                      </ul>
                    </section>
                  )}

                  {images.length > 0 && (
                    <section>
                      <h2 className="pickle-h2" style={{ width: "100%", marginBottom: "28px" }}>
                        Reference Images ({images.length})
                      </h2>
                      <ul className="pickle-research-grid" style={{ width: "100%", marginTop: 0 }}>
                        {images.map((job) => (
                          <LibraryCard
                            key={job.id}
                            job={job}
                            viewHref={`/viewer?jobId=${job.id}&mode=image`}
                            onDelete={handleDeleteClick}
                            deletingId={deletingId}
                            showDownloadGlb={false}
                          />
                        ))}
                      </ul>
                    </section>
                  )}
                </div>
              )}
            </>
          )}

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
      </div>
      <Footer />
    </>
  );
}
