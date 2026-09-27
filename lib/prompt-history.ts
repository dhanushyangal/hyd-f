"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { isWaterJob } from "@/lib/engines";

export type PromptEngine = "water" | "cloud";

export type PromptHistoryEntry = {
  text: string;
  at: number;
  engine: PromptEngine;
};

type StoredHistory = {
  entries: PromptHistoryEntry[];
  /** Workspace jobs created before this are hidden after "Clear". */
  clearedAt: number;
};

type PromptSourceJob = {
  id: string;
  prompt: string | null;
  createdAt: string;
  engine?: string | null;
  generateType?: string | null;
  resultKind?: string | null;
  hasFactoryCode?: boolean;
};

const MAX_STORED = 50;
const MAX_SHOWN = 30;
const EMPTY: StoredHistory = { entries: [], clearedAt: 0 };

const storageKey = (workspaceId: string) => `hydrilla:prompt-history:${workspaceId}`;
const normalize = (text: string) => text.replace(/\s+/g, " ").trim();

function read(workspaceId: string): StoredHistory {
  try {
    const raw = localStorage.getItem(storageKey(workspaceId));
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<StoredHistory>;
    const entries = Array.isArray(parsed.entries)
      ? parsed.entries.filter(
          (e): e is PromptHistoryEntry =>
            !!e && typeof e.text === "string" && typeof e.at === "number" && (e.engine === "water" || e.engine === "cloud")
        )
      : [];
    return { entries: entries.slice(0, MAX_STORED), clearedAt: Number(parsed.clearedAt) || 0 };
  } catch {
    return EMPTY;
  }
}

function write(workspaceId: string, history: StoredHistory) {
  try {
    localStorage.setItem(storageKey(workspaceId), JSON.stringify(history));
  } catch {
    /* storage full or disabled */
  }
}

/**
 * Prompts submitted in a workspace, newest first. Local submissions are merged with the
 * prompts of the workspace's jobs so history survives other devices and cleared storage.
 */
export function usePromptHistory(workspaceId: string | null, jobs: readonly PromptSourceJob[]) {
  const [stored, setStored] = useState<{ workspaceId: string | null; history: StoredHistory }>({
    workspaceId: null,
    history: EMPTY,
  });

  useEffect(() => {
    setStored({ workspaceId, history: workspaceId ? read(workspaceId) : EMPTY });
  }, [workspaceId]);

  const history = stored.workspaceId === workspaceId ? stored.history : EMPTY;

  const entries = useMemo(() => {
    const byText = new Map<string, PromptHistoryEntry>();
    const add = (entry: PromptHistoryEntry) => {
      const key = entry.text.toLowerCase();
      const existing = byText.get(key);
      if (!existing || existing.at < entry.at) byText.set(key, entry);
    };
    history.entries.forEach(add);
    for (const job of jobs) {
      const text = normalize(job.prompt ?? "");
      const at = Date.parse(job.createdAt);
      if (!text || !Number.isFinite(at) || at <= history.clearedAt) continue;
      add({ text, at, engine: isWaterJob(job) ? "water" : "cloud" });
    }
    return [...byText.values()].sort((a, b) => b.at - a.at).slice(0, MAX_SHOWN);
  }, [history, jobs]);

  const record = useCallback(
    (raw: string, engine: PromptEngine) => {
      const text = normalize(raw);
      if (!text || !workspaceId) return;
      setStored((prev) => {
        const base = prev.workspaceId === workspaceId ? prev.history : read(workspaceId);
        const next: StoredHistory = {
          ...base,
          entries: [
            { text, at: Date.now(), engine },
            ...base.entries.filter((e) => e.text.toLowerCase() !== text.toLowerCase()),
          ].slice(0, MAX_STORED),
        };
        write(workspaceId, next);
        return { workspaceId, history: next };
      });
    },
    [workspaceId]
  );

  const clear = useCallback(() => {
    if (!workspaceId) return;
    const next: StoredHistory = { entries: [], clearedAt: Date.now() };
    write(workspaceId, next);
    setStored({ workspaceId, history: next });
  }, [workspaceId]);

  return { entries, record, clear };
}
