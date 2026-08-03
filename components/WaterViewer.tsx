"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import { ENGINE } from "@/lib/engines";

type Props = {
  factoryCode: string | null;
  className?: string;
  passLabel?: string | null;
  jobId?: string | null;
  onThumbnail?: (dataUrl: string) => void;
};

/** Water engine preview — procedural Three.js factory in a sandboxed iframe. */
export function WaterViewer({
  factoryCode,
  className,
  passLabel,
  jobId,
  onThumbnail,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onThumbnailRef = useRef(onThumbnail);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const lastThumbKey = useRef<string | null>(null);

  useEffect(() => {
    onThumbnailRef.current = onThumbnail;
  }, [onThumbnail]);

  const postCode = (code: string) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    // Protocol kept for sandbox compatibility (legacy code-sculpt-* message types).
    win.postMessage({ type: "code-sculpt-load", code }, "*");
  };

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (ev.source !== iframeRef.current?.contentWindow) return;
      const data = ev.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "code-sculpt-boot" || data.type === "code-sculpt-ready") {
        setReady(true);
        setBooting(false);
        setError(null);
      }
      if (data.type === "code-sculpt-error") {
        setBooting(false);
        setError(String(data.message || "Preview failed"));
      }
      if (data.type === "code-sculpt-thumbnail" && typeof data.dataUrl === "string") {
        const key = `${jobId || ""}:${data.dataUrl.slice(0, 64)}`;
        if (lastThumbKey.current === key) return;
        lastThumbKey.current = key;
        onThumbnailRef.current?.(data.dataUrl);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [jobId]);

  useEffect(() => {
    setError(null);
    lastThumbKey.current = null;
    if (factoryCode) setBooting(true);
  }, [factoryCode]);

  useEffect(() => {
    if (!ready || !factoryCode) return;
    setBooting(true);
    setError(null);
    postCode(factoryCode);
  }, [ready, factoryCode]);

  const passDisplay =
    passLabel === "blockout" || passLabel === "done"
      ? "blockout ready"
      : passLabel || null;

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-[#f4f4f5]", className)}>
      <iframe
        ref={iframeRef}
        title={`${ENGINE.water.label} preview`}
        src="/water-sandbox.html"
        sandbox="allow-scripts"
        className="absolute inset-0 h-full w-full border-0"
        onLoad={() => {
          setReady(true);
          if (factoryCode) {
            setBooting(true);
            setError(null);
            postCode(factoryCode);
          }
        }}
      />
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/80 bg-white/90 px-2.5 py-1 text-[11px] font-medium tracking-tight text-neutral-700 shadow-sm backdrop-blur">
          <Droplets className="h-3 w-3" />
          {ENGINE.water.label}
          {passDisplay ? ` · ${passDisplay}` : ""}
        </span>
      </div>
      {factoryCode && (
        <button
          type="button"
          onClick={() => {
            if (!factoryCode) return;
            const blob = new Blob([factoryCode], { type: "text/typescript" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "createModel.ts";
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="absolute right-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-neutral-200/80 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-neutral-800 shadow-sm backdrop-blur hover:bg-white"
        >
          <Download className="h-3 w-3" />
          Download .ts
        </button>
      )}
      {(!factoryCode || booting) && !error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#f4f4f5]/80 text-sm text-neutral-500">
          <div className="h-9 w-9 rounded-full border-2 border-neutral-200 border-t-neutral-800 animate-spin" />
          <span className="tracking-tight">
            {factoryCode ? "Loading preview…" : "Waiting for generated code…"}
          </span>
        </div>
      )}
      {error && (
        <div className="absolute bottom-3 left-3 right-3 z-10 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

