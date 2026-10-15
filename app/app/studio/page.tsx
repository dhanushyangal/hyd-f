"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import {
  fetchWorkspaces,
  createWorkspaceApi,
  deleteWorkspaceApi,
  updateWorkspaceNameApi,
  type Workspace,
} from "../../../lib/api";
import { setCurrentWorkspaceId } from "../../../lib/utils";
import {
  bootstrapHeroWorkspace,
  peekPendingHeroPrompt,
} from "../../../lib/pendingHeroPrompt";
import { track } from "../../../lib/analytics";
import { MessageSquare, FolderOpen, Plus, Search } from "lucide-react";
import { WorkspaceFolderCard } from "@/components/app/WorkspaceFolderCard";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function StudioPage() {
  const router = useRouter();
  const { getToken, isSignedIn, isLoaded } = useAuth();
  const { user } = useUser();
  const SHOW_QUICK_START_CHAT = false;
  const userName = user?.firstName || user?.fullName || user?.username || "";
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameSaving, setRenameSaving] = useState(false);
  const renameLock = useRef(false);
  const newWorkspaceRef = useRef<HTMLDivElement>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deleteConfirmWorkspace, setDeleteConfirmWorkspace] = useState<Workspace | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  /** True while applying a landing-page hero prompt (create workspace → open it). */
  const [heroBootstrapping, setHeroBootstrapping] = useState(false);
  const heroBootstrapStarted = useRef(false);

  // Before paint: if hero prompt is pending, skip the studio list loader entirely.
  useLayoutEffect(() => {
    if (!peekPendingHeroPrompt()) return;
    setHeroBootstrapping(true);
    setLoading(false);
  }, []);

  // Hero → login → studio: create named workspace, then open it with prompt prefilled.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (!peekPendingHeroPrompt()) return;
    if (heroBootstrapStarted.current) return;
    heroBootstrapStarted.current = true;

    let cancelled = false;
    setHeroBootstrapping(true);
    setLoading(false);
    setActionError(null);

    // Warm the Clerk token while we kick off create (avoids a serial wait).
    const tokenReady = getToken();

    void (async () => {
      try {
        await tokenReady;
        const result = await bootstrapHeroWorkspace(async (name) => {
          const tokenGetter = async () => (await getToken()) ?? "";
          return createWorkspaceApi(name, tokenGetter);
        });
        if (cancelled) return;
        if (!result) {
          setHeroBootstrapping(false);
          return;
        }
        setCurrentWorkspaceId(result.workspaceId);
        router.replace(`/workspace/${result.workspaceId}`);
      } catch (err: unknown) {
        console.error("Failed to bootstrap hero workspace:", err);
        if (!cancelled) {
          setActionError(
            err instanceof Error
              ? err.message
              : "Could not create workspace. Check that the backend is running."
          );
          setHeroBootstrapping(false);
          heroBootstrapStarted.current = false;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken, router]);

  const loadWorkspaces = async () => {
    if (!isSignedIn) return;
    // Hero flow owns workspace creation — don't also create a Demo Workspace.
    if (peekPendingHeroPrompt() || heroBootstrapping) return;
    setLoading(true);
    setActionError(null);
    try {
      const tokenGetter = async () => await getToken();
      const ws = await fetchWorkspaces(tokenGetter);
      setWorkspaces(ws);
    } catch (err: unknown) {
      setActionError(
        err instanceof Error ? err.message : "Could not load workspaces."
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    if (peekPendingHeroPrompt() || heroBootstrapping) return;
    void loadWorkspaces();
  }, [isLoaded, isSignedIn, heroBootstrapping]);

  const handleCreateWorkspace = async () => {
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    setActionError(null);
    try {
      const tokenGetter = async () => await getToken();
      const ws = await createWorkspaceApi(name, tokenGetter);
      track("workspace_created", { source: "studio" });
      setShowNewModal(false);
      setNewName("");
      setCurrentWorkspaceId(ws.id);
      router.push(`/workspace/${ws.id}`);
    } catch (err: unknown) {
      console.error("Failed to create workspace:", err);
      setActionError(
        err instanceof Error
          ? err.message
          : "Could not create workspace. Check that the backend is running."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleOpenWorkspace = (workspaceId: string) => {
    track("workspace_opened", { source: "studio" });
    setCurrentWorkspaceId(workspaceId);
    router.push(`/workspace/${workspaceId}`);
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    setDeleteConfirmWorkspace(null);
    setDeletingId(workspaceId);
    try {
      const tokenGetter = async () => await getToken();
      await deleteWorkspaceApi(workspaceId, tokenGetter);
      track("workspace_deleted", { source: "studio" });
      setWorkspaces((prev) => prev.filter((ws) => ws.id !== workspaceId));
    } catch (err: unknown) {
      console.error("Failed to delete workspace:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicateWorkspace = async (ws: Workspace) => {
    setDuplicatingId(ws.id);
    try {
      const tokenGetter = async () => await getToken();
      const newWs = await createWorkspaceApi(`${ws.name} (Copy)`, tokenGetter);
      setWorkspaces((prev) => [newWs, ...prev]);
    } catch (err: unknown) {
      console.error("Failed to duplicate workspace:", err);
    } finally {
      setDuplicatingId(null);
    }
  };

  const handleStartRename = (ws: Workspace) => {
    setRenamingId(ws.id);
  };

  const handleSaveRename = async (name: string) => {
    const next = name.trim();
    if (!renamingId || !next || renameLock.current) return;
    renameLock.current = true;
    setRenameSaving(true);
    try {
      const tokenGetter = async () => await getToken();
      await updateWorkspaceNameApi(renamingId, next, tokenGetter);
      setWorkspaces((prev) =>
        prev.map((w) =>
          w.id === renamingId ? { ...w, name: next, updatedAt: new Date().toISOString() } : w,
        ),
      );
      setRenamingId(null);
    } catch (err: unknown) {
      console.error("Failed to rename workspace:", err);
    } finally {
      renameLock.current = false;
      setRenameSaving(false);
    }
  };

  useEffect(() => {
    if (!showNewModal) return;
    const onPointerDown = (event: PointerEvent) => {
      if (creating) return;
      if (newWorkspaceRef.current?.contains(event.target as Node)) return;
      event.preventDefault();
      event.stopPropagation();
      setShowNewModal(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !creating) setShowNewModal(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [showNewModal, creating]);

  const filtered = workspaces
    .filter((ws) => ws.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

  // Hero handoff: minimal transition — don't paint the studio list while we create + open.
  if (heroBootstrapping) {
    return (
      <div className="app-content-page font-dm-sans flex min-h-[50vh] flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
        <p className="text-sm text-neutral-500">Opening your workspace…</p>
        {actionError && (
          <div className="mt-2 max-w-md rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {actionError}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="app-content-page font-dm-sans bg-[var(--app-canvas)]">
      <section className="flex flex-col gap-8 sm:gap-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] sm:text-xs font-medium text-neutral-400 tracking-[0.14em] uppercase">
              My Workspace
            </p>
            <h1 className="mt-1.5 text-[28px] sm:text-[34px] font-semibold text-neutral-900 tracking-[-0.03em] leading-[1.1] truncate">
              {getGreeting()}{userName ? `, ${userName}` : ""}
            </h1>
            <p className="mt-2 text-sm text-neutral-500 max-w-md">
              {loading
                ? "Loading your projects…"
                : `${filtered.length} workspace${filtered.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2.5 w-full lg:w-auto lg:shrink-0">
            <div className="relative min-w-0 flex-1 lg:flex-none lg:w-52">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-10 pr-4 text-sm bg-white/80 border border-neutral-200/80 rounded-full text-neutral-900 placeholder:text-neutral-400 shadow-[0_1px_2px_rgba(0,0,0,0.04)] focus:bg-white focus:border-neutral-300 focus:ring-4 focus:ring-neutral-900/[0.04] outline-none transition-all"
              />
            </div>
            <div ref={newWorkspaceRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setNewName("");
                  setShowNewModal((open) => !open);
                }}
                className="inline-flex items-center justify-center gap-1.5 h-10 px-4 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-full shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_-4px_rgba(0,0,0,0.2)] transition-all active:scale-[0.98]"
                aria-expanded={showNewModal}
                aria-haspopup="dialog"
              >
                <Plus className="w-4 h-4" strokeWidth={2.25} />
                New
              </button>
              {showNewModal && (
                <div
                  role="dialog"
                  aria-labelledby="new-workspace-title"
                  className="absolute right-0 top-[calc(100%+8px)] z-40 w-[280px] rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-[0_18px_50px_-24px_rgba(0,0,0,0.45)]"
                >
                  <h3 id="new-workspace-title" className="text-[15px] font-semibold text-neutral-900 tracking-tight">
                    New workspace
                  </h3>
                  <p className="mt-1 text-[13px] text-neutral-500">Name it, then create.</p>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Workspace name"
                    aria-label="Workspace name"
                    className="mt-3 w-full h-10 px-3 rounded-xl border border-neutral-200 bg-neutral-50/80 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-neutral-300 focus:ring-4 focus:ring-neutral-900/[0.04] outline-none transition-all"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newName.trim()) handleCreateWorkspace();
                      if (e.key === "Escape" && !creating) setShowNewModal(false);
                    }}
                    autoFocus
                    disabled={creating}
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => !creating && setShowNewModal(false)}
                      className="h-9 px-3 text-sm font-medium text-neutral-600 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors"
                      disabled={creating}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateWorkspace}
                      disabled={!newName.trim() || creating}
                      className="h-9 px-3.5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {creating ? "Creating…" : "Create"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {actionError && (
          <div className="rounded-2xl border border-red-200/80 bg-red-50/90 px-4 py-3.5 text-sm text-red-800">
            {actionError}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8 sm:gap-x-6 sm:gap-y-10">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse w-full rounded-[28px] bg-neutral-200/70" style={{ aspectRatio: "340 / 326" }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-[24px] border border-neutral-200/70 bg-white py-24 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-5">
              <FolderOpen className="w-7 h-7 text-neutral-400" strokeWidth={1.5} />
            </div>
            <p className="text-[17px] font-semibold text-neutral-900 tracking-tight mb-1.5">
              {searchQuery ? "No matches" : "No workspaces yet"}
            </p>
            <p className="text-sm text-neutral-500 mb-6">
              {searchQuery
                ? "Try a different search term."
                : "Create a workspace to start generating."}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={() => { setNewName(""); setShowNewModal(true); }}
                className="inline-flex items-center gap-1.5 h-10 px-5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-full transition-colors"
              >
                <Plus className="w-4 h-4" />
                New workspace
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-8 sm:gap-x-6 sm:gap-y-10 items-start pt-3">
            {filtered.map((ws, index) => (
              <WorkspaceFolderCard
                key={ws.id}
                workspace={ws}
                index={index}
                duplicating={duplicatingId === ws.id}
                editing={renamingId === ws.id}
                onOpen={handleOpenWorkspace}
                onRename={handleStartRename}
                onRenameSave={(name) => {
                  if (!renameSaving) void handleSaveRename(name);
                }}
                onRenameCancel={() => {
                  if (!renameSaving) setRenamingId(null);
                }}
                onDuplicate={handleDuplicateWorkspace}
                onDelete={setDeleteConfirmWorkspace}
                getToken={getToken}
              />
            ))}
          </div>
        )}
      </section>

      {/* Quick start – bottom, clearly separated */}
      {SHOW_QUICK_START_CHAT && (
        <section className="mt-auto pt-6 sm:pt-8 border-t border-neutral-200">
          <h2 className="text-xs sm:text-sm font-medium text-neutral-700 uppercase tracking-wider mb-3 sm:mb-4">
            Quick start
          </h2>
          <Link
            href="/generate"
            className="group inline-flex items-center gap-3 sm:gap-4 w-full max-w-[280px] p-4 sm:p-5 rounded-xl border border-neutral-200 bg-white shadow-sm hover:shadow-md hover:border-neutral-300 transition-all duration-200"
          >
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0 text-left">
              <p className="font-semibold text-neutral-900 text-sm sm:text-base">Chat</p>
              <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">Generate in a conversation</p>
            </div>
          </Link>
        </section>
      )}

      {/* Delete workspace confirmation */}
      {deleteConfirmWorkspace && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-4"
          onClick={() => !deletingId && setDeleteConfirmWorkspace(null)}
        >
          <div
            className="bg-white/95 backdrop-blur-xl rounded-[22px] shadow-[0_24px_80px_-16px_rgba(0,0,0,0.28)] border border-neutral-200/60 w-full max-w-sm p-6 sm:p-7"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[17px] font-semibold text-neutral-900 tracking-tight mb-1">Delete workspace?</h3>
            <p className="text-sm text-neutral-500 mb-5">
              &ldquo;{deleteConfirmWorkspace.name}&rdquo; will be removed. Jobs inside it are not deleted.
            </p>
            <div className="flex gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => !deletingId && setDeleteConfirmWorkspace(null)}
                className="h-10 px-4 text-sm font-medium text-neutral-600 hover:text-neutral-900 rounded-full hover:bg-neutral-100 transition-colors"
                disabled={!!deletingId}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteWorkspace(deleteConfirmWorkspace.id)}
                disabled={!!deletingId}
                className="h-10 px-5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deletingId === deleteConfirmWorkspace.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
