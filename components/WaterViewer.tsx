"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChevronDown, Download, Droplets } from "lucide-react";
import { StudioOrb } from "@/components/workspace/StudioOrb";
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
import {
  DEFAULT_VIEWER_LOOK,
  resolveViewerLook,
  sanitizePartMaterials,
  type PartMaterialMap,
  type ViewerLook,
} from "@/lib/viewer/look";
import { SELECTION_HIGHLIGHT } from "@/lib/viewer/highlight";
import { ModelStatsOverlay } from "@/components/workspace/ModelStatsOverlay";
import type { ModelMeshStats } from "@/lib/viewer/meshStats";

type Props = {
  factoryCode: string | null;
  className?: string;
  jobId?: string | null;
  onThumbnail?: (dataUrl: string) => void;
  /** Fired after a successful download (for analytics). */
  onDownloaded?: (format: ExportFormat) => void;
  /** Hide the built-in top-right controls when the parent renders its own bar. */
  hideToolbar?: boolean;
  /** Left offset for the engine badge, in CSS pixels. Defaults to 12 (`left-3`). */
  badgeLeft?: number;
  instance?: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  } | null;
  look?: ViewerLook;
  /** Per-mesh overrides; meshes not listed keep their authored material. */
  partMaterials?: PartMaterialMap;
  /** Authored material per mesh name, reported once the factory has built. */
  onParts?: (parts: PartMaterialMap) => void;
  selectedPart?: string | null;
  /** Part clicked in the canvas (null = empty space). */
  onPick?: (name: string | null) => void;
  onInstanceTransform?: (t: {
    position: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
  }) => void;
};

export type ExportFormat = "glb" | "gltf" | "obj" | "stl" | "png" | "ts";

/** Bump when the sandbox message protocol changes so browsers don't reuse a stale cached iframe. */
const WATER_SANDBOX_SRC = "/water-sandbox.html?v=4";

export type WaterViewerHandle = {
  exportFormat: (format: ExportFormat) => Promise<{ ok: true } | { ok: false; error: string }>;
  canExportMesh: boolean;
  hasFactoryCode: boolean;
};

const MESH_FORMATS: Array<{
  id: Exclude<ExportFormat, "ts">;
  label: string;
  hint: string;
}> = [
  { id: "glb", label: "GLB", hint: "Binary glTF — best for web & most apps" },
  { id: "gltf", label: "GLTF", hint: "JSON glTF (self-contained)" },
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

/** Cross-iframe ArrayBuffer may fail `instanceof` — detect by shape. */
function coerceArrayBuffer(value: unknown): ArrayBuffer | null {
  if (value instanceof ArrayBuffer) return value;
  if (ArrayBuffer.isView(value)) {
    const view = value as ArrayBufferView;
    // Copy into a fresh ArrayBuffer — view.buffer may be SharedArrayBuffer
    const copy = new Uint8Array(view.byteLength);
    copy.set(new Uint8Array(view.buffer, view.byteOffset, view.byteLength));
    return copy.buffer;
  }
  if (
    value &&
    typeof value === "object" &&
    (value as { constructor?: { name?: string } }).constructor?.name === "ArrayBuffer" &&
    typeof (value as { byteLength?: number }).byteLength === "number"
  ) {
    return value as ArrayBuffer;
  }
  return null;
}

function fileBase(jobId?: string | null) {
  const id = (jobId || "model").replace(/[^\w.-]+/g, "").slice(0, 28);
  return `hydrilla-water-${id || "model"}`;
}

/** Water engine preview — procedural Three.js factory in a sandboxed iframe. */
export const WaterViewer = forwardRef<WaterViewerHandle, Props>(function WaterViewer(
  {
    factoryCode,
    className,
    jobId,
    onThumbnail,
    onDownloaded,
    hideToolbar = false,
    badgeLeft = 12,
    instance = null,
    look = DEFAULT_VIEWER_LOOK,
    partMaterials,
    onParts,
    selectedPart = null,
    onPick,
    onInstanceTransform,
  },
  ref
) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const onThumbnailRef = useRef(onThumbnail);
  const onPartsRef = useRef(onParts);
  const onPickRef = useRef(onPick);
  const onInstanceTransformRef = useRef(onInstanceTransform);
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
  const [modelStats, setModelStats] = useState<ModelMeshStats | null>(null);
  const lastThumbKey = useRef<string | null>(null);

  useEffect(() => {
    onThumbnailRef.current = onThumbnail;
    onPartsRef.current = onParts;
    onPickRef.current = onPick;
    onInstanceTransformRef.current = onInstanceTransform;
  }, [onThumbnail, onParts, onPick, onInstanceTransform]);
  const resolvedLook = useMemo(() => resolveViewerLook(look), [look]);

  const postCode = (code: string) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    setModelReady(false);
    // Protocol kept for sandbox compatibility (legacy code-sculpt-* message types).
    win.postMessage({ type: "code-sculpt-load", code, instance: instance || undefined }, "*");
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
        onPartsRef.current?.(sanitizePartMaterials(data.parts));
        if (data.stats) {
          setModelStats(data.stats as ModelMeshStats);
        }
      }
      if (data.type === "water-select") {
        onPickRef.current?.(data.name ? String(data.name) : null);
      }
      if (data.type === "water-transform" && Array.isArray(data.position)) {
        onInstanceTransformRef.current?.({
          position: data.position as [number, number, number],
          rotation: (data.rotation || [0, 0, 0]) as [number, number, number],
          scale: (data.scale || [1, 1, 1]) as [number, number, number],
        });
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
          const ab = coerceArrayBuffer(data.buffer);
          if (ab) {
            downloadBlob(new Blob([ab], { type: mime }), filename);
          } else if (typeof data.base64 === "string" && data.base64.length > 0) {
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
    setModelStats(null);
    lastThumbKey.current = null;
    if (factoryCode) setBooting(true);
  }, [factoryCode]);

  useEffect(() => {
    if (!ready || !factoryCode) return;
    setBooting(true);
    setError(null);
    postCode(factoryCode);
  }, [ready, factoryCode]);

  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !ready || !instance) return;
    win.postMessage({ type: "water-transform", instance }, "*");
  }, [instance, ready, modelReady]);

  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !ready || !modelReady) return;
    win.postMessage({ type: "water-parts", parts: partMaterials ?? {} }, "*");
  }, [partMaterials, ready, modelReady]);

  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !ready) return;
    win.postMessage({ type: "water-look", look: resolvedLook }, "*");
  }, [resolvedLook, ready, modelReady]);

  useEffect(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !ready || !modelReady) return;
    win.postMessage({ type: "water-highlight", name: selectedPart, spec: SELECTION_HIGHLIGHT }, "*");
  }, [selectedPart, ready, modelReady]);

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
    if (!factoryCode) {
      return { ok: false as const, error: "No factory code to download" };
    }
    downloadBlob(
      new Blob([factoryCode], { type: "text/typescript;charset=utf-8" }),
      `${fileBase(jobId)}.ts`
    );
    return { ok: true as const };
  };

  const handleExport = async (format: ExportFormat) => {
    setExportError(null);
    if (format === "ts") {
      const result = downloadTs();
      if (result.ok) onDownloaded?.("ts");
      else setExportError(result.error);
      return result;
    }
    setExporting(format);
    try {
      const result = await requestSandboxExport(format);
      if (!result.ok) setExportError(result.error);
      else onDownloaded?.(format);
      return result;
    } finally {
      setExporting(null);
    }
  };

  const canExportMesh = Boolean(factoryCode && modelReady && !exporting && !error);

  useImperativeHandle(
    ref,
    () => ({
      exportFormat: handleExport,
      canExportMesh,
      hasFactoryCode: Boolean(factoryCode),
    }),
    // handleExport closes over latest state; rebind when readiness changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [factoryCode, modelReady, exporting, error, jobId]
  );

  return (
    <div className={cn("relative h-full w-full overflow-hidden bg-white", className)}>
      <iframe
        ref={iframeRef}
        title={`${ENGINE.water.label} preview`}
        src={WATER_SANDBOX_SRC}
        sandbox="allow-scripts"
        className="absolute inset-0 h-full w-full border-0"
        onLoad={() => {
          setReady(true);
        }}
      />
      <div
        className="absolute top-3 z-10 flex items-center gap-2"
        style={{ left: badgeLeft }}
      >
        <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/80 bg-white/90 px-2.5 py-1 text-[11px] font-medium tracking-tight text-neutral-700 shadow-sm backdrop-blur">
          <Droplets className="h-3 w-3 text-sky-600" strokeWidth={2} />
          {ENGINE.water.label}
        </span>
      </div>
      {factoryCode && !hideToolbar && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
          <button
            type="button"
            disabled={!canExportMesh}
            onClick={() => void handleExport("glb")}
            className="inline-flex items-center gap-1 rounded-full border border-neutral-900 bg-neutral-900 px-2 py-1 text-[10px] font-semibold text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50"
            title="Download GLB"
          >
            {exporting === "glb" ? (
              <StudioOrb state="working" size={20} />
            ) : (
              <Download className="h-3 w-3" />
            )}
            GLB
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={Boolean(exporting) && exporting !== "ts"}
                className="inline-flex items-center gap-0.5 rounded-full border border-neutral-200/80 bg-white/90 px-1.5 py-1 text-[10px] font-medium text-neutral-800 shadow-sm backdrop-blur hover:bg-white disabled:opacity-60"
                title="Download GLTF, TypeScript, and more"
              >
                {exporting && exporting !== "glb" ? (
                  <StudioOrb state="working" size={20} />
                ) : (
                  <>
                    <span>Formats</span>
                    <ChevronDown className="h-3 w-3 opacity-70" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[220px]">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wide text-neutral-400">
                Mesh
              </DropdownMenuLabel>
              {MESH_FORMATS.map((fmt) => (
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
                disabled={!factoryCode || Boolean(exporting)}
                onSelect={(e) => {
                  e.preventDefault();
                  void handleExport("ts");
                }}
                className="flex flex-col items-start gap-0.5 rounded-lg px-2.5 py-2 text-xs cursor-pointer"
              >
                <span className="font-semibold text-neutral-900">TypeScript (.ts)</span>
                <span className="text-[10px] text-neutral-500">createModel() factory source</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      {(!factoryCode || booting) && !error && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <StudioOrb state={factoryCode ? "searching" : "breathing"} size={64} />
        </div>
      )}
      {error && (
        <div className="absolute top-12 left-3 right-3 z-10 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}
      {exportError && !error && (
        <div className="absolute bottom-3 left-3 right-3 z-10 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {exportError}
        </div>
      )}
      {modelReady && modelStats && (
        <ModelStatsOverlay stats={modelStats} corner="bottom-left" />
      )}
    </div>
  );
});

export default WaterViewer;
