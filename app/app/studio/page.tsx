"use client";

import { useState, useEffect, useRef } from "react";
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
import { setCurrentWorkspaceId, cn } from "../../../lib/utils";
import { MessageSquare, FolderOpen, Plus, Search, Trash2, MoreVertical, Copy, Pencil } from "lucide-react";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function StudioPage() {
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const userName = user?.firstName || user?.fullName || user?.username || "";
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renameWorkspace, setRenameWorkspace] = useState<Workspace | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deleteConfirmWorkspace, setDeleteConfirmWorkspace] = useState<Workspace | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpenId) return;
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenId(null);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [menuOpenId]);

  const loadWorkspaces = async () => {
    if (!isSignedIn) return;
    setLoading(true);
    try {
      const tokenGetter = async () => await getToken();
      const ws = await fetchWorkspaces(tokenGetter);
      setWorkspaces(ws);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isSignedIn) loadWorkspaces();
  }, [isSignedIn]);

  const handleCreateWorkspace = async () => {
    const name = newName.trim();
    if (!name || creating) return;
    setCreating(true);
    try {
      const tokenGetter = async () => await getToken();
      const ws = await createWorkspaceApi(name, tokenGetter);
      setShowNewModal(false);
      setNewName("");
      setCurrentWorkspaceId(ws.id);
      router.push("/workspace");
    } catch (err: unknown) {
      console.error("Failed to create workspace:", err);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenWorkspace = (workspaceId: string) => {
    setCurrentWorkspaceId(workspaceId);
    router.push("/workspace");
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    setDeleteConfirmWorkspace(null);
    setDeletingId(workspaceId);
    try {
      const tokenGetter = async () => await getToken();
      await deleteWorkspaceApi(workspaceId, tokenGetter);
      setWorkspaces((prev) => prev.filter((ws) => ws.id !== workspaceId));
    } catch (err: unknown) {
      console.error("Failed to delete workspace:", err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDuplicateWorkspace = async (ws: Workspace) => {
    setMenuOpenId(null);
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
    setMenuOpenId(null);
    setRenameWorkspace(ws);
    setRenameValue(ws.name);
  };

  const handleSaveRename = async () => {
    if (!renameWorkspace || !renameValue.trim()) return;
    try {
      const tokenGetter = async () => await getToken();
      await updateWorkspaceNameApi(renameWorkspace.id, renameValue.trim(), tokenGetter);
      setWorkspaces((prev) => prev.map((w) => (w.id === renameWorkspace.id ? { ...w, name: renameValue.trim() } : w)));
      setRenameWorkspace(null);
      setRenameValue("");
    } catch (err: unknown) {
      console.error("Failed to rename workspace:", err);
    }
  };

  const filtered = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-content-page font-dm-sans">
      {/* My Workspace section – reference layout */}
      <section className="flex flex-col gap-4 sm:gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6">
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-medium text-neutral-500 uppercase tracking-wider">
              My Workspace
            </h2>
            <h1 className="text-xl sm:text-3xl font-bold text-neutral-900 tracking-tight mt-0.5 truncate">
              {getGreeting()}{userName ? `, ${userName}` : ""}
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 min-w-0">
            <div className="relative flex items-center min-w-0">
              <Search className="absolute left-3 w-4 h-4 text-neutral-400 pointer-events-none shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full min-w-0 sm:w-44 py-2.5 pl-10 pr-4 text-sm bg-neutral-50 border border-neutral-200 rounded-xl text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus:ring-1 focus:ring-neutral-300/30 outline-none transition-all"
              />
            </div>
            <button
              type="button"
              onClick={() => { setNewName(""); setShowNewModal(true); }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-xl transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              New
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/60 py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-neutral-400" />
            </div>
            <p className="text-base font-medium text-neutral-600 mb-1">
              {searchQuery ? "No workspaces match your search." : "No workspaces yet."}
            </p>
            <p className="text-sm text-neutral-500">
              Create one to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {filtered.map((ws) => (
              <div
                key={ws.id}
                className="group relative flex flex-col min-w-0 rounded-2xl border border-neutral-200 bg-white shadow-md hover:shadow-xl hover:border-neutral-300 transition-all duration-200 overflow-visible"
                style={{ minHeight: 280 }}
              >
                {/* Card body: large preview + title (clickable) */}
                <button
                  type="button"
                  onClick={() => handleOpenWorkspace(ws.id)}
                  className="flex flex-col flex-1 p-4 sm:p-7 text-left min-h-0"
                >
                  <div className="w-full aspect-square max-h-[160px] sm:max-h-[220px] rounded-xl overflow-hidden bg-neutral-100 flex items-center justify-center mb-3 sm:mb-5">
                    {ws.firstJobPreviewImageUrl ? (
                      <img
                        src={ws.firstJobPreviewImageUrl}
                        alt=""
                        width={220}
                        height={220}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                        sizes="(max-width: 640px) 50vw, 220px"
                      />
                    ) : (
                      <FolderOpen className="w-16 h-16 sm:w-20 sm:h-20 text-neutral-400" />
                    )}
                  </div>
                  <p className="font-semibold text-neutral-900 text-lg truncate">
                    {ws.name}
                  </p>
                  <p className="text-sm text-neutral-500 mt-1 truncate">
                    {ws.jobCount ? `${ws.jobCount} item${ws.jobCount !== 1 ? "s" : ""}` : "Empty"}
                  </p>
                </button>

                {/* Bottom bar: 3-dot menu inside card */}
                <div
                  className="flex items-center justify-end gap-2 px-4 sm:px-6 pb-4 sm:pb-5 pt-0 shrink-0"
                  ref={menuOpenId === ws.id ? menuRef : null}
                >
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setMenuOpenId(menuOpenId === ws.id ? null : ws.id); }}
                    className={cn(
                      "p-2 rounded-lg text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all",
                      menuOpenId === ws.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    )}
                    title="Options"
                    aria-label="Options"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>
                  {menuOpenId === ws.id && (
                    <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 py-1.5 w-44 rounded-xl bg-white border border-neutral-200 shadow-lg z-20">
                      <button
                        type="button"
                        onClick={() => handleStartRename(ws)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50 text-left rounded-lg mx-1"
                      >
                        <Pencil className="w-4 h-4 shrink-0 text-neutral-500" />
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDuplicateWorkspace(ws)}
                        disabled={duplicatingId === ws.id}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-neutral-800 hover:bg-neutral-50 text-left disabled:opacity-50 rounded-lg mx-1"
                      >
                        <Copy className="w-4 h-4 shrink-0 text-neutral-500" />
                        {duplicatingId === ws.id ? "Duplicating…" : "Duplicate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setDeleteConfirmWorkspace(ws); setMenuOpenId(null); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 text-left rounded-lg mx-1"
                      >
                        <Trash2 className="w-4 h-4 shrink-0" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quick start – bottom, clearly separated */}
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

      {/* New workspace modal */}
      {showNewModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => !creating && setShowNewModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-900 mb-1 font-dm-sans">
              New Workspace
            </h3>
            <p className="text-sm text-neutral-500 mb-4">
              Give your workspace a name.
            </p>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. My Project, Character Pack"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400/20 outline-none mb-4 font-dm-sans"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) handleCreateWorkspace();
                if (e.key === "Escape") setShowNewModal(false);
              }}
              autoFocus
              disabled={creating}
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => !creating && setShowNewModal(false)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateWorkspace}
                disabled={!newName.trim() || creating}
                className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? "Creating…" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete workspace confirmation */}
      {deleteConfirmWorkspace && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => !deletingId && setDeleteConfirmWorkspace(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-900 mb-1 font-dm-sans">Delete workspace?</h3>
            <p className="text-sm text-neutral-500 mb-4">
              &ldquo;{deleteConfirmWorkspace.name}&rdquo; will be removed. Jobs inside it are not deleted.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => !deletingId && setDeleteConfirmWorkspace(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                disabled={!!deletingId}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteWorkspace(deleteConfirmWorkspace.id)}
                disabled={!!deletingId}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {deletingId === deleteConfirmWorkspace.id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename workspace modal */}
      {renameWorkspace && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setRenameWorkspace(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-neutral-900 mb-1 font-dm-sans">Rename workspace</h3>
            <p className="text-sm text-neutral-500 mb-4">Enter a new name.</p>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Workspace name"
              aria-label="Workspace name"
              className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400/20 outline-none mb-4 font-dm-sans"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSaveRename();
                if (e.key === "Escape") setRenameWorkspace(null);
              }}
              autoFocus
            />
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setRenameWorkspace(null)}
                className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRename}
                disabled={!renameValue.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
