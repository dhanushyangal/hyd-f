"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { fetchWorkspaces, createWorkspaceApi, deleteWorkspaceApi, type Workspace } from "../lib/api";
import { setCurrentWorkspaceId } from "../lib/utils";

const buttonClassName =
  "inline-flex items-center justify-center bg-white/90 backdrop-blur-md border border-white/40 text-black px-5 sm:px-6 py-2.5 sm:py-3 rounded-full text-sm sm:text-base font-medium hover:bg-white hover:scale-[1.02] transition-all duration-200 shadow-md active:scale-[0.98]";

export default function StartGeneratingButton() {
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [workspacesLoading, setWorkspacesLoading] = useState(false);
  const [workspaceSearchQuery, setWorkspaceSearchQuery] = useState("");
  const [showNewWorkspaceNameModal, setShowNewWorkspaceNameModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceCreating, setNewWorkspaceCreating] = useState(false);

  const loadWorkspaces = async () => {
    if (!isSignedIn) return;
    setWorkspacesLoading(true);
    try {
      const tokenGetter = async () => await getToken();
      const ws = await fetchWorkspaces(tokenGetter);
      setWorkspaces(ws);
    } catch {
      /* ignore */
    }
    setWorkspacesLoading(false);
  };

  useEffect(() => {
    if (showModal && isSignedIn) {
      loadWorkspaces();
    }
  }, [showModal, isSignedIn]);

  const handleChooseChat = () => {
    setShowModal(false);
    router.push("/generate");
  };

  const handleOpenNewWorkspaceNameModal = () => {
    setNewWorkspaceName("");
    setShowNewWorkspaceNameModal(true);
  };

  const handleCreateNewWorkspace = async () => {
    const name = newWorkspaceName.trim();
    if (!name || newWorkspaceCreating) return;
    setNewWorkspaceCreating(true);
    try {
      const tokenGetter = async () => await getToken();
      const ws = await createWorkspaceApi(name, tokenGetter);
      setShowNewWorkspaceNameModal(false);
      setShowModal(false);
      setNewWorkspaceName("");
      setCurrentWorkspaceId(ws.id);
      router.push("/workspace");
    } catch (err: unknown) {
      console.error("Failed to create workspace:", err);
    } finally {
      setNewWorkspaceCreating(false);
    }
  };

  const handleOpenWorkspace = (workspaceId: string) => {
    setShowModal(false);
    setCurrentWorkspaceId(workspaceId);
    router.push("/workspace");
  };

  const handleDeleteWorkspace = async (e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation();
    if (!confirm("Delete this workspace? Jobs inside it will not be deleted.")) return;
    try {
      const tokenGetter = async () => await getToken();
      await deleteWorkspaceApi(workspaceId, tokenGetter);
      setWorkspaces((prev) => prev.filter((ws) => ws.id !== workspaceId));
    } catch (err: unknown) {
      console.error("Failed to delete workspace:", err);
    }
  };

  const filteredWorkspaces = workspaces.filter((ws) =>
    ws.name.toLowerCase().includes(workspaceSearchQuery.toLowerCase())
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={buttonClassName}
        style={{ fontFamily: "var(--font-dm-sans), DM Sans, sans-serif" }}
      >
        Start Generating
      </button>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
              <h2 className="text-lg font-semibold text-black">Where do you want to create?</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Close modal"
                title="Close"
              >
                <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4">
              <button
                type="button"
                onClick={handleChooseChat}
                className="w-full flex items-center gap-4 p-4 rounded-xl border border-neutral-200 hover:border-black hover:bg-neutral-50 transition-all text-left group"
              >
                <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-black">Chat</p>
                  <p className="text-sm text-neutral-500">Generate in a chat conversation</p>
                </div>
                <svg className="w-5 h-5 text-neutral-400 group-hover:text-black transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 rounded-xl border border-neutral-200 bg-neutral-50/50">
                  <div className="w-12 h-12 rounded-xl bg-neutral-800 text-white flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-black">Workspace</p>
                    <p className="text-sm text-neutral-500">Visual workspace with image & 3D panels</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenNewWorkspaceNameModal}
                    className="px-3 py-1.5 text-sm bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors flex-shrink-0"
                  >
                    + New
                  </button>
                </div>

                {/* New workspace name modal */}
                {showNewWorkspaceNameModal && (
                  <div
                    className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm"
                    onClick={() => !newWorkspaceCreating && setShowNewWorkspaceNameModal(false)}
                  >
                    <div
                      className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <h3 className="text-lg font-semibold text-black mb-2">New Workspace</h3>
                      <p className="text-sm text-neutral-500 mb-4">Give your workspace a name.</p>
                      <input
                        type="text"
                        value={newWorkspaceName}
                        onChange={(e) => setNewWorkspaceName(e.target.value)}
                        placeholder="e.g. My Project, Character Pack"
                        className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-black placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black/10 mb-4"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newWorkspaceName.trim()) handleCreateNewWorkspace();
                          if (e.key === "Escape") setShowNewWorkspaceNameModal(false);
                        }}
                        autoFocus
                        disabled={newWorkspaceCreating}
                      />
                      <div className="flex gap-3 justify-end">
                        <button
                          type="button"
                          onClick={() => !newWorkspaceCreating && setShowNewWorkspaceNameModal(false)}
                          className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-black transition-colors"
                          disabled={newWorkspaceCreating}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateNewWorkspace}
                          disabled={!newWorkspaceName.trim() || newWorkspaceCreating}
                          className="px-4 py-2 text-sm font-medium text-white bg-black hover:bg-neutral-800 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {newWorkspaceCreating ? "Creating…" : "Create"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {workspaces.length > 3 && (
                  <input
                    type="text"
                    placeholder="Search workspaces..."
                    value={workspaceSearchQuery}
                    onChange={(e) => setWorkspaceSearchQuery(e.target.value)}
                    className="w-full px-4 py-2.5 text-sm bg-neutral-50 border border-neutral-200 rounded-xl text-black placeholder:text-neutral-400 focus:border-black focus:ring-1 focus:ring-black/10 transition-all"
                  />
                )}

                <div className="max-h-[200px] overflow-y-auto space-y-2">
                  {workspacesLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <div className="w-5 h-5 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
                    </div>
                  ) : filteredWorkspaces.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-sm text-neutral-400">
                        {workspaceSearchQuery ? "No workspaces found" : "No workspaces yet. Create one to get started."}
                      </p>
                    </div>
                  ) : (
                    filteredWorkspaces.map((ws) => (
                      <div
                        key={ws.id}
                        className="flex items-center gap-3 p-3 rounded-xl border border-neutral-100 hover:border-neutral-300 bg-white transition-all group"
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenWorkspace(ws.id)}
                          className="flex flex-1 items-center gap-3 min-w-0 text-left"
                        >
                          <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-neutral-100 flex items-center justify-center">
                            {ws.firstJobPreviewImageUrl ? (
                              <img src={ws.firstJobPreviewImageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-black truncate">{ws.name}</p>
                            <p className="text-xs text-neutral-400">
                              {ws.jobCount ? `${ws.jobCount} item${ws.jobCount !== 1 ? "s" : ""}` : "Empty"} · {new Date(ws.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteWorkspace(e, ws.id)}
                          className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                          title="Delete workspace"
                        >
                          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
