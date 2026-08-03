"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Download, Droplets, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ENGINE } from "@/lib/engines";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  factoryCode: string | null;
  className?: string;
  passLabel?: string | null;
  jobId?: string | null;
  onThumbnail?: (dataUrl: string) => void;
};

type ExportFormat = "glb" | "gltf" | "obj" | "stl" | "png" | "ts";

const MESH_FORMATS: Array<{
  id: ExportFormat;
  label: string;
  hint: string;
}> = [
  { id: "glb", label: "GLB", hint: "Binary glTF — best for web & most apps" },
  { id: "gltf", label: "GLTF", hint: "JSON glTF" },
  { id: "obj", label: "OBJ", hint: "Wavefront mesh" },
  { id: "stl", label: "STL", hint: "3D print / CAD" },
  { id: "png", label: "PNG", hint: "Preview snapshot" },
];

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

function fileBase(jobId?: string | null) {
  const id = (jobId || "model").replace(/[^\w.-]+/g, "").slice(0, 28);
  return `hydrilla-water-${id || "model"}`;
}

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
  const pendingExport = useRef<{
    requestId: string;
    resolve: (v: { ok: true } | { ok: false; error: string }) => void;
  } | null>(null);
  const [ready, setReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const lastThumbKey = useRef<string | null>(null);

  useEffect(() => {
    onThumbnailRef.current = onThumbnail;
  }, [onThumbnail]);

  const postCode = (code: string) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    setModelReady(false);
    // Protocol kept for sandbox compatibility (legacy code-sculpt-* message types).
    win.postMessage({ type: "code-sculpt-load", code }, "*");
  };

  useEffect(() => {
    const onMessage = (ev: MessageEvent) => {
      if (ev.source !== iframeRef.current?.contentWindow) return;
      const data = ev.data;
      if (!data || typeof data !== "object") return;
      if (data.type === "code-sculpt-boot") {
        setReady(true);
        setBooting(false);
        setError(null);
      }
      if (data.type === "code-sculpt-ready") {
        setReady(true);
        setBooting(false);
        setError(null);
        setModelReady(true);
      }
      if (data.type === "code-sculpt-error") {
        setBooting(false);
        setModelReady(false);
        setError(String(data.message || "Preview failed"));
      }
      if (data.type === "code-sculpt-thumbnail" && typeof data.dataUrl === "string") {
        const key = `${jobId || ""}:${data.dataUrl.slice(0, 64)}`;
        if (lastThumbKey.current === key) return;
        lastThumbKey.current = key;
        onThumbnailRef.current?.(data.dataUrl);
      }
      if (data.type === "code-sculpt-export-result" && pendingExport.current) {
        if (data.requestId !== pendingExport.current.requestId) return;
        const pending = pendingExport.current;
        pendingExport.current = null;
        if (!data.ok) {
          pending.resolve({ ok: false, error: String(data.error || "Export failed") });
          return;
        }
        try {
          const rawName = String(data.filename || "model.bin");
          const ext = rawName.includes(".") ? rawName.slice(rawName.lastIndexOf(".")) : ".bin";
          const filename = `${fileBase(jobId)}${ext}`;
          const mime = String(data.mime || "application/octet-stream");
          // Prefer transferred ArrayBuffer (fast path) over base64.
          if (data.buffer instanceof ArrayBuffer) {
            downloadBlob(new Blob([data.buffer], { type: mime }), filename);
          } else if (ArrayBuffer.isView(data.buffer)) {
            downloadBlob(new Blob([data.buffer as BlobPart], { type: mime }), filename);
          } else if (typeof data.base64 === "string") {
            downloadBlob(base64ToBlob(data.base64, mime), filename);
          } else if (typeof data.text === "string") {
            downloadBlob(new Blob([data.text], { type: mime || "text/plain" }), filename);
          } else {
            pending.resolve({ ok: false, error: "Export returned empty data" });
            return;
          }
          pending.resolve({ ok: true });
        } catch (err) {
          pending.resolve({
            ok: false,
            error: err instanceof Error ? err.message : "Could not save file",
          });
        }
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [jobId]);

  useEffect(() => {
    setError(null);
    setExportError(null);
    setModelReady(false);
    lastThumbKey.current = null;
    if (factoryCode) setBooting(true);
  }, [factoryCode]);

  useEffect(() => {
    if (!ready || !factoryCode) return;
    setBooting(true);
    setError(null);
    postCode(factoryCode);
  }, [ready, factoryCode]);

  const requestSandboxExport = (format: Exclude<ExportFormat, "ts">) =>
    new Promise<{ ok: true } | { ok: false; error: string }>((resolve) => {
      const win = iframeRef.current?.contentWindow;
      if (!win) {
        resolve({ ok: false, error: "Preview is not ready" });
        return;
      }
      if (!modelReady) {
        resolve({ ok: false, error: "Wait for the model to finish loading" });
        return;
      }
      const requestId = `exp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const timer = window.setTimeout(() => {
        if (pendingExport.current?.requestId === requestId) {
          pendingExport.current = null;
          resolve({ ok: false, error: "Export timed out — try again" });
        }
      }, format === "glb" ? 20000 : 45000);
      pendingExport.current = {
        requestId,
        resolve: (v) => {
          window.clearTimeout(timer);
          resolve(v);
        },
      };
      win.postMessage({ type: "code-sculpt-export", format, requestId }, "*");
    });

  const downloadTs = () => {
    if (!factoryCode) return;
    downloadBlob(
      new Blob([factoryCode], { type: "text/typescript;charset=utf-8" }),
      `${fileBase(jobId)}.ts`
    );
  };

  const handleExport = async (format: ExportFormat) => {
    setExportError(null);
    if (format === "ts") {
      downloadTs();
      return;
    }
    setExporting(format);
    try {
      const result = await requestSandboxExport(format);
      if (!result.ok) setExportError(result.error);
    } finally {
      setExporting(null);
    }
  };

  const passDisplay =
    passLabel === "blockout" || passLabel === "done"
      ? "blockout ready"
      : passLabel || null;

  const canExportMesh = Boolean(factoryCode && modelReady && !exporting && !error);

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
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5">
          <button
            type="button"
            disabled={!canExportMesh}
            onClick={() => void handleExport("glb")}
            className="inline-flex items-center gap-1.5 rounded-full border border-neutral-900 bg-neutral-900 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50"
            title="Download GLB (fast)"
          >
            {exporting === "glb" ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Download className="h-3 w-3" />
            )}
            GLB
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={Boolean(exporting)}
                className="inline-flex items-center gap-1 rounded-full border border-neutral-200/80 bg-white/90 px-2 py-1 text-[11px] font-medium text-neutral-800 shadow-sm backdrop-blur hover:bg-white disabled:opacity-60"
                title="More formats"
              >
                {exporting && exporting !== "glb" ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px]">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-neutral-400">
                More formats
              </DropdownMenuLabel>
              {MESH_FORMATS.filter((f) => f.id !== "glb").map((fmt) => (
                <DropdownMenuItem
                  key={fmt.id}
                  disabled={!canExportMesh}
                  onSelect={(e) => {
                    e.preventDefault();
                    void handleExport(fmt.id);
                  }}
                  className="flex flex-col items-start gap-0.5 rounded-lg px-2.5 py-2 text-xs cursor-pointer"
                >
                  <span className="font-semibold text-neutral-900">{fmt.label}</span>
                  <span className="text-[10px] text-neutral-500">{fmt.hint}</span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-neutral-400">
                Source
              </DropdownMenuLabel>
              <DropdownMenuItem
                disabled={Boolean(exporting)}
                onSelect={(e) => {
                  e.preventDefault();
                  void handleExport("ts");
                }}
                className="flex flex-col items-start gap-0.5 rounded-lg px-2.5 py-2 text-xs cursor-pointer"
              >
                <span className="font-semibold text-neutral-900">TypeScript</span>
                <span className="text-[10px] text-neutral-500">createModel() factory source</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
      {exportError && !error && (
        <div className="absolute bottom-3 left-3 right-3 z-10 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {exportError}
        </div>
      )}
    </div>
  );
}
