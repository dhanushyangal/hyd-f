"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useAuth, SignInButton } from "@clerk/nextjs";
import {
  AlertCircle,
  ArrowRight,
  Box,
  Download,
  Eye,
  ImageIcon,
  LibraryBig,
  LoaderCircle,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
  return new Date(createdAt).toLocaleDateString(undefined, {
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
    <Card className="group flex h-full flex-col overflow-hidden rounded-[22px] border-neutral-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.045)]">
      <div className="relative m-2 aspect-[4/3] overflow-hidden rounded-[17px] border border-neutral-100 bg-neutral-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={job.prompt || "Generated asset preview"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_50%_40%,#ffffff_0%,#f3f4f6_70%)]">
            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-400 shadow-sm">
              <Box className="h-7 w-7" strokeWidth={1.6} />
            </span>
          </div>
        )}

        <div className="absolute left-3 top-3">
          <JobStatusBadge status={convertBackendStatus(job.status)} />
        </div>

        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-950/25 backdrop-blur-[1px]">
            <LoaderCircle className="h-7 w-7 animate-spin text-white" />
          </div>
        )}
      </div>

      <CardContent className="flex-1 px-5 pb-4 pt-3">
        <p className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-neutral-900">
          {job.prompt || "Image to 3D"}
        </p>
        <div className="mt-3 flex items-center justify-between gap-3 border-t border-neutral-100 pt-3">
          <span className="text-xs font-medium text-neutral-400">
            {formatCreatedAt(job.createdAt)}
          </span>
          <span className="rounded-md bg-neutral-100 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-[0.08em] text-neutral-500">
            {job.resultGlbUrl ? "3D asset" : "Image"}
          </span>
        </div>
      </CardContent>

      <CardFooter className="gap-2 px-5 pb-5">
        <Button asChild variant="outline" className="flex-1 rounded-xl">
          <Link href={viewHref}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </Link>
        </Button>

        {showDownloadGlb && job.resultGlbUrl && (
          <Button
            asChild
            variant="outline"
            className="h-11 w-11 rounded-xl p-0"
          >
            <a
              href={job.resultGlbUrl}
              download
              title="Download GLB file"
              aria-label="Download GLB file"
            >
              <Download className="h-4 w-4" />
            </a>
          </Button>
        )}

        <Button
          type="button"
          variant="ghost"
          onClick={() => onDelete(job.id)}
          disabled={deleting}
          className="h-11 w-11 rounded-xl p-0 text-neutral-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Delete generation"
          title="Delete"
        >
          {deleting ? (
            <LoaderCircle className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function LibrarySection({
  title,
  count,
  icon: Icon,
  children,
}: {
  title: string;
  count: number;
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-5 flex items-center gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-700">
          <Icon className="h-5 w-5" strokeWidth={1.9} />
        </span>
        <div>
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-neutral-950">
            {title}
          </h2>
          <p className="text-xs font-medium text-neutral-400">
            {count} {count === 1 ? "asset" : "assets"}
          </p>
        </div>
      </div>
      {children}
    </section>
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

  if (!isLoaded && !isMounted) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-white px-6">
        <div className="text-center">
          <LoaderCircle className="mx-auto h-8 w-8 animate-spin text-neutral-500" />
          <p className="mt-3 text-sm font-medium text-neutral-500">
            Loading library…
          </p>
        </div>
      </div>
    );
  }

  if (isLoaded && userIsSignedIn === false) {
    return (
      <div className="flex min-h-[75vh] items-center justify-center bg-white px-4 py-24">
        <Card className="w-full max-w-md rounded-[24px] border-neutral-200 bg-white text-center shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <CardContent className="p-8">
            <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-700">
              <LibraryBig className="h-7 w-7" strokeWidth={1.8} />
            </span>
            <h2 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-neutral-950">
              Your library, in one place.
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Sign in to access your generated images and production-ready 3D
              assets.
            </p>
            <SignInButton mode="modal">
              <Button size="lg" className="mt-7 w-full rounded-xl">
                Sign in to continue
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </SignInButton>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 pb-24 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        <header className="flex flex-col gap-6 border-b border-neutral-200 pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
              Asset library
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-neutral-950 sm:text-4xl">
              Your creative archive.
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500 sm:text-base">
              Review, download, and manage every image and 3D asset generated
              with Hydrilla.
            </p>
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => void loadJobs(false)}
              disabled={refreshing}
              className="rounded-xl"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              />
              {refreshing ? "Refreshing…" : "Refresh"}
            </Button>
            <Button asChild className="flex-1 rounded-xl sm:flex-none">
              <Link href="/generate">
                <Plus className="mr-2 h-4 w-4" />
                New generation
              </Link>
            </Button>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex min-h-[360px] items-center justify-center">
            <LoaderCircle className="h-8 w-8 animate-spin text-neutral-400" />
          </div>
        ) : jobs.length === 0 ? (
          <Card className="mt-10 rounded-[24px] border-dashed border-neutral-300 bg-neutral-50/70 text-center">
            <CardContent className="px-6 py-16 sm:py-20">
              <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-500 shadow-sm">
                <Sparkles className="h-6 w-6" strokeWidth={1.8} />
              </span>
              <h2 className="mt-6 text-xl font-semibold tracking-[-0.025em] text-neutral-950">
                Your first asset starts here.
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-neutral-500">
                Generate a 3D model or image and it will appear in your library
                automatically.
              </p>
              <Button asChild size="lg" className="mt-7 rounded-xl">
                <Link href="/generate">
                  Create your first asset
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-12 space-y-14">
            {objects3d.length > 0 && (
              <LibrarySection
                title="3D assets"
                count={objects3d.length}
                icon={Box}
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                </div>
              </LibrarySection>
            )}

            {images.length > 0 && (
              <LibrarySection title="Images" count={images.length} icon={ImageIcon}>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
                </div>
              </LibrarySection>
            )}
          </div>
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
  );
}
