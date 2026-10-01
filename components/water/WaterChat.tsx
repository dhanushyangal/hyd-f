"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { fetchWaterMessages, sendWaterChat, type WaterChatMessage } from "@/lib/api";

export type WaterThreadJob = {
  id: string;
  prompt: string | null;
  createdAt: string;
};

type ThreadMessage = WaterChatMessage & { generation?: boolean };

type Props = {
  jobId: string | null;
  /** Jobs in this model's refine chain, oldest first. Defaults to just `jobId`. */
  threadJobs?: WaterThreadJob[];
  modelId: string;
  getToken: () => Promise<string | null>;
  disabled?: boolean;
  className?: string;
  onClose?: () => void;
  docked?: boolean;
  onRefine?: (prompt: string) => void;
  onScene?: (scene: unknown) => void;
};

export function WaterChat({
  jobId,
  threadJobs,
  modelId,
  getToken,
  disabled,
  className,
  onClose,
  docked,
  onRefine,
  onScene,
}: Props) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const thread: WaterThreadJob[] =
    threadJobs && threadJobs.length > 0
      ? threadJobs
      : jobId
        ? [{ id: jobId, prompt: null, createdAt: "" }]
        : [];
  const threadKey = thread.map((j) => `${j.id}:${j.prompt ?? ""}`).join("|");
  const threadRef = useRef(thread);
  threadRef.current = thread;

  useEffect(() => {
    const jobs = threadRef.current;
    if (jobs.length === 0) {
      setMessages([]);
      return;
    }
    const state = { cancelled: false };
    const tokenGetter = () => getTokenRef.current();
    void Promise.all(
      jobs.map((job) => fetchWaterMessages(job.id, tokenGetter).catch(() => []))
    ).then((perJob) => {
      if (state.cancelled) {
        return;
      }
      const merged = jobs.flatMap((job, i): ThreadMessage[] => {
        const intro: ThreadMessage[] = job.prompt?.trim()
          ? [
              {
                id: `gen-${job.id}`,
                role: "user",
                content: job.prompt.trim(),
                createdAt: job.createdAt,
                generation: true,
              },
            ]
          : [];
        return [...intro, ...(perJob[i] ?? [])];
      });
      setMessages(merged);
    });
    return () => {
      state.cancelled = true;
    };
  }, [threadKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = async () => {
    const text = draft.trim();
    if (!jobId || !text || busy || disabled) {
      return;
    }
    setDraft("");
    setMessages((prev) => [
      ...prev,
      { id: `local-${Date.now()}`, role: "user", content: text, createdAt: new Date().toISOString() },
    ]);
    setBusy(true);
    try {
      const result = await sendWaterChat({
        jobId,
        message: text,
        modelId,
        getToken: () => getTokenRef.current(),
      });
      setMessages((prev) => [
        ...prev,
        {
          id: `asst-${Date.now()}`,
          role: "assistant",
          content: result.reply,
          createdAt: new Date().toISOString(),
        },
      ]);
      if (result.scene) {
        onScene?.(result.scene);
      }
      if (result.kind === "refine" && result.refinePrompt) {
        onRefine?.(result.refinePrompt);
      }
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
  };

  return (
    <div
      className={cn(
        "flex h-full min-h-0 w-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-[0_18px_60px_-24px_rgba(0,0,0,0.28)]",
        className
      )}
    >
      <div className={cn("flex items-center justify-between border-b border-neutral-200/70 px-3 py-2", docked && "hidden")}>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 transition-[background-color,color,transform] duration-150 hover:bg-neutral-100 hover:text-neutral-800 active:scale-[0.97]"
            aria-label="Close follow up"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 space-y-2">
        {!jobId && !docked && (
          <p className="text-[12px] text-neutral-500 leading-5">Generate first, then type a follow-up here.</p>
        )}
        {jobId && messages.length === 0 && (
          <p className="text-[12px] text-neutral-500 leading-5">No messages yet. Describe a change below.</p>
        )}
        {messages.map((m) =>
          m.generation ? (
            <div key={m.id} className="rounded-xl border border-sky-100 bg-sky-50/70 px-2.5 py-2 text-[12px] leading-5 text-sky-900">
              <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-sky-600">
                Build
              </span>
              {m.content}
            </div>
          ) : (
            <div
              key={m.id}
              className={cn(
                "rounded-xl px-2.5 py-2 text-[12px] leading-5",
                m.role === "user" ? "bg-neutral-900 text-white" : "bg-neutral-50 text-neutral-800 border border-neutral-200"
              )}
            >
              {m.content}
            </div>
          )
        )}
        <div ref={bottomRef} />
      </div>
      <form
        className="p-2 border-t border-neutral-200/70"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder="Describe a change…"
          disabled={!jobId || busy || disabled}
          className="w-full min-h-[72px] resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-[12px] outline-none transition-[border-color,background-color] duration-150 focus:border-neutral-400 focus:bg-white disabled:opacity-50"
        />
      </form>
    </div>
  );
}
