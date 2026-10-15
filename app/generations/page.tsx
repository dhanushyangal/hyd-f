"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Box, Droplets, Image as ImageIcon, Search, X } from "lucide-react";
import { fetchWorkspace, fetchWorkspaceJobs, getProxiedImageUrl, type BackendJob } from "../../lib/api";
import { isWaterJob } from "../../lib/engines";
import { cn, getCurrentWorkspaceId } from "../../lib/utils";

const displayImageUrl = (url: string | null | undefined): string => getProxiedImageUrl(url) || url || "";

type Tab = "images" | "3d";

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

function isImageJob(job: BackendJob): boolean {
  return Boolean(job.previewImageUrl || job.imageUrl) && !job.resultGlbUrl && !isWaterJob(job);
}

function is3DJob(job: BackendJob): boolean {
  return Boolean(job.resultGlbUrl) || isWaterJob(job);
}

function GenerationCard({
  job,
  kind,
  onSelect,
}: {
  job: BackendJob;
  kind: Tab;
  onSelect: () => void;
}) {
  const preview = displayImageUrl(job.previewImageUrl || job.imageUrl);
  const water = isWaterJob(job);
  const badge = kind === "images" ? "Image" : water ? "Water" : "3D";
  const title = job.prompt?.trim() || (kind === "images" ? "Untitled image" : water ? "Water scene" : "3D model");
  const running = job.status === "RUN" || job.status === "WAIT" || job.id.startsWith("pending-");
  const failed = job.status === "FAIL";

  return (
    <button
      type="button"
      onClick={onSelect}
      className="group min-w-0 w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 rounded-[20px]"
    >
      <div className="relative aspect-square overflow-hidden rounded-[20px] border border-neutral-200/80 bg-gradient-to-b from-neutral-100 to-neutral-50 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(0,0,0,0.08)] transition-[transform,box-shadow] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:shadow-[0_2px_6px_rgba(0,0,0,0.05),0_16px_40px_-16px_rgba(0,0,0,0.18)] group-active:scale-[0.98]">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt=""
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-neutral-300">
            {kind === "images" ? (
              <ImageIcon className="h-7 w-7" strokeWidth={1.5} />
            ) : water ? (
              <Droplets className="h-7 w-7" strokeWidth={1.5} />
            ) : (
              <Box className="h-7 w-7" strokeWidth={1.5} />
            )}
          </span>
        )}

        <span className="absolute left-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-black/[0.06] bg-white/90 px-2.5 py-1 text-[10px] font-semibold text-neutral-700 shadow-xs backdrop-blur-md">
          {kind === "images" ? (
            <ImageIcon className="h-3 w-3" strokeWidth={2.1} aria-hidden />
          ) : water ? (
            <Droplets className="h-3 w-3" strokeWidth={2.1} aria-hidden />
          ) : (
            <Box className="h-3 w-3" strokeWidth={2.1} aria-hidden />
          )}
          {badge}
        </span>

        {running || failed ? (
          <span
            className={cn(
              "absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-sm",
              failed ? "bg-red-500" : "bg-amber-400 animate-pulse"
            )}
            aria-label={failed ? "Failed" : "In progress"}
          />
        ) : null}
      </div>

      <div className="mt-2.5 px-0.5">
        <p className="truncate text-[13px] font-semibold tracking-tight text-neutral-900">{title}</p>
        <p className="mt-0.5 text-[11px] text-neutral-400">
          {badge}
          {job.createdAt ? ` · ${formatDate(job.createdAt)}` : ""}
        </p>
      </div>
    </button>
  );
}

export default function GenerationsPage() {
  const router = useRouter();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [libraryImages, setLibraryImages] = useState<BackendJob[]>([]);
  const [library3DAssets, setLibrary3DAssets] = useState<BackendJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("images");
  const [searchQuery, setSearchQuery] = useState("");
  const [previewImage, setPreviewImage] = useState<BackendJob | null>(null);

  const tokenGetter = useCallback(async () => (await getToken()) ?? "", [getToken]);

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      setLoading(false);
      return;
    }
    const id = getCurrentWorkspaceId();
    if (!id) {
      setLoading(false);
      router.replace("/workspace");
      return;
    }
    setWorkspaceId(id);
    setLoading(true);
    Promise.all([fetchWorkspace(id, tokenGetter).then((ws) => ws?.name ?? ""), fetchWorkspaceJobs(id, tokenGetter)])
      .then(([name, jobs]) => {
        setWorkspaceName(name);
        const sorted = [...jobs].sort((a, b) => Date.parse(b.createdAt || "") - Date.parse(a.createdAt || ""));
        setLibraryImages(sorted.filter(isImageJob).slice(0, 80));
        setLibrary3DAssets(sorted.filter(is3DJob).slice(0, 80));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn, tokenGetter, router]);

  useEffect(() => {
    if (!previewImage) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPreviewImage(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewImage]);

  const filteredImages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return libraryImages;
    return libraryImages.filter((a) => (a.prompt || "").toLowerCase().includes(q));
  }, [libraryImages, searchQuery]);

  const filtered3D = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return library3DAssets;
    return library3DAssets.filter((a) => (a.prompt || "").toLowerCase().includes(q));
  }, [library3DAssets, searchQuery]);

  const items = tab === "images" ? filteredImages : filtered3D;
  const totalCount = tab === "images" ? libraryImages.length : library3DAssets.length;

  const handleImageClick = (item: BackendJob) => setPreviewImage(item);
  const handle3DClick = (item: BackendJob) => {
    router.push(`/workspace?open3d=${encodeURIComponent(item.id)}`);
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[var(--app-canvas)] font-dm-sans">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
      </div>
    );
  }

  if (!workspaceId) return null;

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--app-canvas)] font-dm-sans text-neutral-950">
      <header className="sticky top-0 z-20 shrink-0 border-b border-neutral-200/80 bg-white/90 pt-[env(safe-area-inset-top)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-2 px-4 sm:h-16 sm:gap-3 sm:px-6 lg:px-8">
          <Link
            href="/workspace"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-neutral-600 outline-none transition-colors hover:bg-neutral-100 hover:text-neutral-950 focus-visible:ring-2 focus-visible:ring-neutral-900"
            aria-label="Back to workspace"
            title="Back to workspace"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={1.85} />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-medium uppercase tracking-[0.14em] text-neutral-400">Generations</p>
            <h1 className="truncate text-[15px] font-semibold tracking-tight text-neutral-900 sm:text-[17px]">
              {workspaceName || "Workspace"}
            </h1>
          </div>
          <Link
            href="/workspace"
            className="hidden h-10 shrink-0 items-center rounded-full bg-neutral-950 px-4 text-[13px] font-semibold text-white outline-none transition-colors hover:bg-neutral-800 focus-visible:ring-2 focus-visible:ring-neutral-900 focus-visible:ring-offset-2 sm:inline-flex"
          >
            Open workspace
          </Link>
        </div>
      </header>

      <main className="scrollbar-minimal min-h-0 flex-1 overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
          <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <h2 className="text-[26px] font-semibold tracking-[-0.03em] text-neutral-900 sm:text-[32px]">
                {tab === "images" ? "Images" : "3D models"}
              </h2>
              <p className="mt-1.5 text-sm text-neutral-500">
                {loading
                  ? "Loading this workspace…"
                  : searchQuery.trim()
                    ? `${items.length} match${items.length === 1 ? "" : "es"}`
                    : `${totalCount} ${totalCount === 1 ? "item" : "items"} in this workspace`}
              </p>
            </div>

            <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative w-full sm:w-56">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search prompts…"
                  aria-label="Search generations"
                  className="h-11 w-full rounded-full border border-neutral-200/80 bg-white pl-9 pr-9 text-[13px] text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.03)] outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-400 sm:h-10"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
              </div>

              <div
                role="tablist"
                aria-label="Generation type"
                className="inline-flex h-11 w-full items-center gap-0.5 overflow-x-auto rounded-full border border-neutral-200/80 bg-white p-1 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:h-10 sm:w-auto"
              >
                {(
                  [
                    { id: "images" as const, label: "Images", count: libraryImages.length },
                    { id: "3d" as const, label: "3D", count: library3DAssets.length },
                  ] as const
                ).map((item) => {
                  const selected = tab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => setTab(item.id)}
                      className={cn(
                        "h-full min-w-0 flex-1 whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors sm:flex-none",
                        selected ? "bg-neutral-900 text-white" : "text-neutral-500 hover:text-neutral-800"
                      )}
                    >
                      {item.label}
                      {item.count > 0 ? (
                        <span className={cn("ml-1.5 tabular-nums text-[10px]", selected ? "text-white/70" : "text-neutral-400")}>
                          {item.count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-6 sm:mt-8">
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="aspect-square rounded-[20px] bg-neutral-200/70" />
                    <div className="mt-3 h-3.5 w-2/3 rounded-full bg-neutral-200/70" />
                    <div className="mt-1.5 h-3 w-1/3 rounded-full bg-neutral-200/50" />
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-[24px] border border-dashed border-neutral-200 bg-white px-6 py-16 text-center sm:py-20">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-neutral-100">
                  {tab === "images" ? (
                    <ImageIcon className="h-7 w-7 text-neutral-400" strokeWidth={1.5} />
                  ) : (
                    <Box className="h-7 w-7 text-neutral-400" strokeWidth={1.5} />
                  )}
                </div>
                <p className="text-[17px] font-semibold tracking-tight text-neutral-900">
                  {searchQuery.trim()
                    ? "No matches"
                    : tab === "images"
                      ? "No images yet"
                      : "No 3D models yet"}
                </p>
                <p className="mt-1.5 max-w-sm text-sm text-neutral-500">
                  {searchQuery.trim()
                    ? "Try another keyword, or clear the search."
                    : tab === "images"
                      ? "Generate or edit an image in this workspace and it will show up here."
                      : "Generate a 3D model in this workspace and open it from here."}
                </p>
                {searchQuery.trim() ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="mt-6 inline-flex h-11 items-center rounded-full border border-neutral-200 bg-white px-5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50"
                  >
                    Clear search
                  </button>
                ) : (
                  <Link
                    href="/workspace"
                    className="mt-6 inline-flex h-11 items-center rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800"
                  >
                    Back to workspace
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">
                {items.map((item) => (
                  <GenerationCard
                    key={item.id}
                    job={item}
                    kind={tab}
                    onSelect={() => (tab === "images" ? handleImageClick(item) : handle3DClick(item))}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {previewImage ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-6"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <div
            className="relative flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden rounded-t-[24px] border border-neutral-200/70 bg-white shadow-[0_24px_80px_-16px_rgba(0,0,0,0.28)] sm:rounded-[24px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-neutral-100 px-4">
              <p className="truncate pr-3 text-[13px] font-medium text-neutral-700">
                {previewImage.prompt || "Image preview"}
              </p>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 outline-none transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-neutral-900"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" strokeWidth={1.85} />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 items-center justify-center bg-neutral-50 p-4 sm:p-6">
              {(previewImage.previewImageUrl || previewImage.imageUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={displayImageUrl(previewImage.previewImageUrl || previewImage.imageUrl)}
                  alt={previewImage.prompt || "Preview"}
                  className="max-h-[min(70dvh,640px)] max-w-full rounded-2xl object-contain shadow-[0_8px_30px_-12px_rgba(0,0,0,0.2)]"
                />
              ) : (
                <div className="flex h-64 w-64 items-center justify-center text-sm text-neutral-500">
                  {previewImage.prompt || "Image"}
                </div>
              )}
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 border-t border-neutral-100 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="inline-flex h-10 items-center rounded-full px-4 text-[13px] font-medium text-neutral-600 hover:bg-neutral-100"
              >
                Close
              </button>
              <Link
                href="/workspace"
                className="inline-flex h-10 items-center rounded-full bg-neutral-950 px-4 text-[13px] font-semibold text-white hover:bg-neutral-800"
              >
                Open in workspace
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
