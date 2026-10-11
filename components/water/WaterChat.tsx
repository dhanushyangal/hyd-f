"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchWaterMessages, sendWaterChat, type WaterChatMessage } from "@/lib/api";
import { StudioOrb } from "@/components/workspace/StudioOrb";

export type WaterThreadJob = {
  id: string;
  prompt: string | null;
  createdAt: string;
};

export type ThreadMessage = WaterChatMessage & { generation?: boolean };

type ThreadOptions = {
  /** Null pauses the thread (nothing loads, `send` is a no-op). */
  jobId: string | null;
  /** Jobs in this model's refine chain, oldest first. Defaults to just `jobId`. */
  threadJobs?: WaterThreadJob[];
  modelId: string;
  getToken: () => Promise<string | null>;
  onRefine?: (prompt: string) => void;
  onScene?: (scene: unknown) => void;
};

/** Follow-up conversation for a Water build: loads the chain's history and sends refinements. */
export function useWaterThread({ jobId, threadJobs, modelId, getToken, onRefine, onScene }: ThreadOptions) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const latest = useRef({ getToken, onRefine, onScene, modelId, jobId });
  latest.current = { getToken, onRefine, onScene, modelId, jobId };

  const thread: WaterThreadJob[] =
    threadJobs && threadJobs.length > 0
      ? threadJobs
      : jobId
        ? [{ id: jobId, prompt: null, createdAt: "" }]
        : [];
  const threadKey = jobId ? thread.map((j) => `${j.id}:${j.prompt ?? ""}`).join("|") : "";
  const threadRef = useRef(thread);
  threadRef.current = thread;

  useEffect(() => {
    const jobs = threadKey ? threadRef.current : [];
    if (jobs.length === 0) {
      setMessages([]);
      return;
    }
    const state = { cancelled: false };
    const tokenGetter = () => latest.current.getToken();
    void Promise.all(jobs.map((job) => fetchWaterMessages(job.id, tokenGetter).catch(() => []))).then((perJob) => {
      if (state.cancelled) return;
      setMessages(
        jobs.flatMap((job, i): ThreadMessage[] => {
          const intro: ThreadMessage[] = job.prompt?.trim()
            ? [{ id: `gen-${job.id}`, role: "user", content: job.prompt.trim(), createdAt: job.createdAt, generation: true }]
            : [];
          return [...intro, ...(perJob[i] ?? [])];
        })
      );
    });
    return () => {
      state.cancelled = true;
    };
  }, [threadKey]);

  const send = useCallback(async (raw: string) => {
    const text = raw.trim();
    const { jobId: target, modelId: model } = latest.current;
    if (!target || !text) return;
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "user", content: text, createdAt: new Date().toISOString() },
    ]);
    setBusy(true);
    try {
      const result = await sendWaterChat({
        jobId: target,
        message: text,
        modelId: model,
        getToken: () => latest.current.getToken(),
      });
      setMessages((prev) => [
        ...prev,
        { id: `asst-${Date.now()}`, role: "assistant", content: result.reply, createdAt: new Date().toISOString() },
      ]);
      if (result.scene) latest.current.onScene?.(result.scene);
      if (result.kind === "refine" && result.refinePrompt) latest.current.onRefine?.(result.refinePrompt);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: err instanceof Error ? err.message : "Follow-up failed",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }, []);

  return { messages, busy, send };
}

/** Collapsed by default: one line with the latest reply, so the viewer stays visible. */
export function WaterThreadPeek({ messages, busy }: { messages: ThreadMessage[]; busy: boolean }) {
  const [open, setOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const last = messages[messages.length - 1];

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ block: "end" });
  }, [open, messages.length]);

  if (messages.length === 0 && !busy) return null;

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-10 w-full items-center gap-2.5 px-4 text-left text-[13px] text-neutral-500 transition-colors hover:text-neutral-900"
      >
        {busy ? (
          <StudioOrb state="working" size={20} />
        ) : (
          <MessageSquare className="h-3.5 w-3.5 shrink-0 text-neutral-400" strokeWidth={2} />
        )}
        <span className="min-w-0 flex-1 truncate">
          {busy ? "Thinking…" : last ? last.content : ""}
        </span>
        <span className="shrink-0 tabular-nums text-[12px] text-neutral-400">{messages.length}</span>
        <ChevronDown
          className={cn("h-3.5 w-3.5 shrink-0 text-neutral-400 transition-transform duration-150", open && "rotate-180")}
          strokeWidth={2}
        />
      </button>
      {open ? (
        <div className="max-h-[min(240px,30vh)] space-y-1.5 overflow-y-auto px-4 pb-3" role="log" aria-label="Refine history">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "w-fit max-w-[85%] rounded-2xl px-3 py-1.5 text-[13px] leading-5",
                m.role === "user" ? "ml-auto bg-neutral-900 text-white" : "bg-neutral-100 text-neutral-800",
                m.generation && "bg-sky-50 text-sky-900"
              )}
            >
              {m.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      ) : null}
    </div>
  );
}
