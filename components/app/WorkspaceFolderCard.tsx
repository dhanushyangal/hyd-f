"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import GlassFolder, {
  type ArtPreset,
  type FolderFile,
} from "@/components/ui/glass-folder-cards";
import {
  fetchWorkspaceJobs,
  getProxiedImageUrl,
  type BackendJob,
  type Workspace,
} from "@/lib/api";
import { cn } from "@/lib/utils";

const PRESETS: ArtPreset[] = ["aurora", "ember", "dusk", "glacier", "verdant"];

function seedOf(id: string) {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  return h >>> 0;
}

function proxyImage(url: string | null | undefined) {
  if (!url) return undefined;
  return getProxiedImageUrl(url) || url;
}

function clip(value: string, max = 72) {
  const clean = value.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + "…";
}

/** Last edit, in the studio's short relative form. */
export function lastEditedLabel(iso: string | null | undefined, now = new Date()): string {
  if (!iso) return "";
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return "";
  const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((startOfDay(now).getTime() - startOfDay(then).getTime()) / 86_400_000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days <= 7) return `${days} days ago`;
  let months = (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
  if (now.getDate() < then.getDate()) months -= 1;
  if (months < 1) return "1 month ago";
  if (months < 12) return months === 1 ? "1 month ago" : `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

function formatWhen(iso: string | null | undefined) {
  if (!iso) return undefined;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** Closed-state pocket: the one preview we already have. Real jobs replace this once the folder is opened. */
function filesFromPreview(workspace: Workspace, image: string | undefined): FolderFile[] {
  const count = workspace.jobCount ?? 0;
  if (count <= 0 && !image) return [];
  const prompt = workspace.firstJobPrompt ? clip(workspace.firstJobPrompt) : "";
  return [
    {
      name: prompt || workspace.name,
      meta: image ? "Preview" : undefined,
      image,
    },
  ];
}

function filesFromJobs(jobs: BackendJob[]): FolderFile[] {
  const newestFirst = [...jobs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  return newestFirst.slice(0, 4).map((job) => ({
    name: job.prompt ? clip(job.prompt) : "Untitled",
    meta: formatWhen(job.createdAt),
    image: proxyImage(job.previewImageUrl),
  }));
}

export function WorkspaceFolderCard({
  workspace,
  index,
  duplicating,
  onOpen,
  onRename,
  onRenameSave,
  onRenameCancel,
  onDuplicate,
  onDelete,
  editing = false,
  getToken,
}: {
  workspace: Workspace;
  index: number;
  duplicating: boolean;
  editing?: boolean;
  onOpen: (id: string) => void;
  onRename: (workspace: Workspace) => void;
  onRenameSave: (name: string) => void;
  onRenameCancel: () => void;
  onDuplicate: (workspace: Workspace) => void;
  onDelete: (workspace: Workspace) => void;
  getToken: () => Promise<string | null>;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const loadedFor = useRef<string | null>(null);
  const [width, setWidth] = useState(280);
  const [hovered, setHovered] = useState(false);
  const [draft, setDraft] = useState(workspace.name);
  const wasEditing = useRef(false);
  const [jobs, setJobs] = useState<BackendJob[] | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [themeReady, setThemeReady] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setThemeReady(true);
  }, []);

  useEffect(() => {
    if (editing && !wasEditing.current) setDraft(workspace.name);
    wasEditing.current = editing;
  }, [editing, workspace.name]);

  useEffect(() => {
    const url = proxyImage(workspace.firstJobPreviewImageUrl);
    if (!url) {
      setImageFailed(false);
      return;
    }
    let live = true;
    const probe = new Image();
    probe.onload = () => {
      if (live) setImageFailed(false);
    };
    probe.onerror = () => {
      if (live) setImageFailed(true);
    };
    probe.src = url;
    return () => {
      live = false;
    };
  }, [workspace.firstJobPreviewImageUrl]);

  useLayoutEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const apply = () => {
      const next = Math.round(el.clientWidth);
      if (next < 80) return;
      setWidth((current) => (current === next ? current : next));
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const loadJobs = useCallback(() => {
    if (loadedFor.current === workspace.id) return;
    loadedFor.current = workspace.id;
    void fetchWorkspaceJobs(workspace.id, () => getTokenRef.current()).then((next) => {
      setJobs(next);
    });
  }, [workspace.id]);

  useEffect(() => {
    if (hovered) loadJobs();
  }, [hovered, loadJobs]);

  const image = imageFailed ? undefined : proxyImage(workspace.firstJobPreviewImageUrl);
  const count = workspace.jobCount ?? 0;
  const edited = lastEditedLabel(workspace.updatedAt);
  const meta = edited || (count === 0 ? "Empty" : `${count} item${count === 1 ? "" : "s"}`);
  const files = useMemo(() => {
    if (jobs && jobs.length > 0) return filesFromJobs(jobs);
    return filesFromPreview(workspace, image);
  }, [jobs, workspace, image]);
  const seed = (seedOf(workspace.id) % 997) || 3;

  return (
    <div
      ref={boxRef}
      className={cn(
        "relative min-w-0 w-full",
        editing || hovered ? "z-30" : "z-0 hover:z-10 focus-within:z-30",
      )}
      onPointerEnter={() => {
        setHovered(true);
        loadJobs();
      }}
      onPointerLeave={() => setHovered(false)}
    >
      <GlassFolder
        label={workspace.name}
        meta={meta}
        tone={themeReady && resolvedTheme === "dark" ? "dark" : "light"}
        art={PRESETS[seedOf(workspace.id) % PRESETS.length]}
        seed={seed}
        image={image}
        files={files}
        action="more"
        includeFolderToggle={false}
        editing={editing}
        editValue={draft}
        onEditValueChange={setDraft}
        onEditConfirm={() => {
          const next = draft.trim();
          if (!next || next === workspace.name) return;
          onRenameSave(next);
        }}
        onEditCancel={onRenameCancel}
        width={width}
        appear
        appearDelay={Math.min(index, 8) * 80}
        open={hovered || editing}
        onGlassClick={() => {
          if (!editing) onOpen(workspace.id);
        }}
        onFileSelect={() => {
          if (!editing) onOpen(workspace.id);
        }}
        menu={[
          { label: "Open workspace", onSelect: () => onOpen(workspace.id) },
          { label: "Rename", onSelect: () => onRename(workspace) },
          {
            label: duplicating ? "Duplicating…" : "Duplicate",
            onSelect: () => {
              if (!duplicating) onDuplicate(workspace);
            },
          },
          { label: "Delete", danger: true, onSelect: () => onDelete(workspace) },
        ]}
      />
    </div>
  );
}
