"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { fetchWorkspace, fetchWorkspaceJobs } from "../../lib/api";
import { getCurrentWorkspaceId } from "../../lib/utils";
import type { BackendJob } from "../../lib/api";

export default function GenerationsPage() {
  const router = useRouter();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [libraryImages, setLibraryImages] = useState<BackendJob[]>([]);
  const [library3DAssets, setLibrary3DAssets] = useState<BackendJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"images" | "3d">("images");
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
    Promise.all([
      fetchWorkspace(id, tokenGetter).then((ws) => ws?.name ?? ""),
      fetchWorkspaceJobs(id, tokenGetter),
    ])
      .then(([name, jobs]) => {
        setWorkspaceName(name);
        setLibraryImages(jobs.filter((j) => (j.previewImageUrl || j.imageUrl) && !j.resultGlbUrl).slice(0, 50));
        setLibrary3DAssets(jobs.filter((j) => j.resultGlbUrl).slice(0, 50));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn, tokenGetter, router]);

  const filteredImages = libraryImages.filter((a) =>
    (a.prompt || "").toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filtered3D = library3DAssets.filter((a) =>
    (a.prompt || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleImageClick = (item: BackendJob) => {
    setPreviewImage(item);
  };

  const handle3DClick = (item: BackendJob) => {
    router.push(`/workspace?open3d=${encodeURIComponent(item.id)}`);
  };

  if (!isLoaded || !isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!workspaceId) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header: back to workspace + title */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 px-4 py-3 border-b border-neutral-200 bg-white/95 backdrop-blur-md shrink-0">
        <Link
          href="/workspace"
          className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-neutral-100 text-neutral-600 transition-colors shrink-0"
          aria-label="Back to workspace"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-lg font-bold text-neutral-900 truncate flex-1 text-center mx-2">
          {workspaceName || "Generations"}
        </h1>
        <div className="w-10 shrink-0" />
      </header>

      {/* Search */}
      <div className="px-3 py-3 border-b border-neutral-100">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder:text-neutral-500 text-sm focus:border-neutral-300 focus:ring-2 focus:ring-neutral-200/80 focus:outline-none transition-shadow"
          />
        </div>
      </div>

      {/* Tabs: Images | 3D (smooth, liquid-glass style) */}
      <div className="px-3 pt-3 pb-2">
        <div
          role="tablist"
          aria-label="Library tabs"
          className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-neutral-100/90 p-1.5 text-neutral-500 border border-neutral-200/60 shadow-sm transition-all duration-200"
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "images"}
            onClick={() => setTab("images")}
            title="Images"
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg h-full text-sm font-semibold transition-all duration-200 ${
              tab === "images" ? "bg-white text-neutral-900 shadow-sm border border-neutral-200/80" : "text-neutral-500 hover:bg-neutral-200/60 hover:text-neutral-700"
            }`}
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            Images
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "3d"}
            onClick={() => setTab("3d")}
            title="3D Assets"
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg h-full text-sm font-semibold transition-all duration-200 ${
              tab === "3d" ? "bg-white text-neutral-900 shadow-sm border border-neutral-200/80" : "text-neutral-500 hover:bg-neutral-200/60 hover:text-neutral-700"
            }`}
          >
            <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
              <line x1="12" y1="22.08" x2="12" y2="12" />
            </svg>
            3D
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-3 py-4 min-h-0">
        {tab === "images" && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-neutral-800 uppercase tracking-widest">Images</h2>
            {loading ? (
              <div className="flex items-center justify-center min-h-[160px]">
                <div className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
              </div>
            ) : filteredImages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[160px] rounded-2xl bg-neutral-50 border border-dashed border-neutral-200 text-neutral-600 text-sm gap-3">
                <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span>No images in this workspace yet</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredImages.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleImageClick(item)}
                    className="aspect-square rounded-xl overflow-hidden border border-neutral-200 hover:border-neutral-400 hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer bg-white shadow-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-neutral-300"
                  >
                    {(item.previewImageUrl || item.imageUrl) ? (
                      <img
                        src={item.previewImageUrl || item.imageUrl || ""}
                        alt={item.prompt || "Image"}
                        className="w-full h-full object-cover pointer-events-none"
                      />
                    ) : (
                      <span className="text-neutral-600 text-xs text-center px-2 truncate max-w-full font-medium">
                        {item.prompt || "Image"}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "3d" && (
          <div className="space-y-4">
            <h2 className="text-xs font-bold text-neutral-800 uppercase tracking-widest">3D Assets</h2>
            {loading ? (
              <div className="flex items-center justify-center min-h-[160px]">
                <div className="w-8 h-8 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
              </div>
            ) : filtered3D.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[160px] rounded-2xl bg-neutral-50 border border-dashed border-neutral-200 text-neutral-600 text-sm gap-3">
                <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>No 3D assets in this workspace yet</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filtered3D.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handle3DClick(item)}
                    className="aspect-square rounded-xl overflow-hidden border border-neutral-200 hover:border-neutral-400 hover:shadow-lg active:scale-[0.98] transition-all cursor-pointer bg-white shadow-sm flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-neutral-300"
                  >
                    {item.previewImageUrl ? (
                      <img
                        src={item.previewImageUrl}
                        alt={item.prompt || "3D Asset"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-neutral-500">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <span className="text-xs mt-1 font-medium">3D</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image preview popup (mobile) — tap X to close */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
        >
          <div
            className="relative max-w-full max-h-full rounded-2xl overflow-hidden bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {(previewImage.previewImageUrl || previewImage.imageUrl) ? (
              <img
                src={previewImage.previewImageUrl || previewImage.imageUrl || ""}
                alt={previewImage.prompt || "Preview"}
                className="max-w-full max-h-[85vh] w-auto h-auto object-contain"
              />
            ) : (
              <div className="w-64 h-64 flex items-center justify-center text-neutral-500 text-sm">
                {previewImage.prompt || "Image"}
              </div>
            )}
            {previewImage.prompt && (
              <p className="p-3 text-xs text-neutral-600 line-clamp-2 border-t border-neutral-100">
                {previewImage.prompt}
              </p>
            )}
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
              aria-label="Close preview"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
