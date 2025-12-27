"use client";

import { ThreeViewer } from "./ThreeViewer";

interface ModelCanvasProps {
  glbUrl: string | null;
  isLoading: boolean;
  progress: number;
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
  previewImageUrl?: string | null;
  isGeneratingPreview?: boolean;
}

export function ModelCanvas({ 
  glbUrl, 
  isLoading, 
  progress, 
  zoom = 100, 
  onZoomChange,
  previewImageUrl,
  isGeneratingPreview = false
}: ModelCanvasProps) {
  return (
    <div className="w-full h-full relative bg-transparent flex items-center justify-center">
      {/* Square box container */}
      <div className="w-[600px] h-[600px] bg-white border border-gray-200 rounded-lg shadow-sm relative overflow-hidden">
        {glbUrl ? (
          // Show 3D model when available (highest priority)
          <div className="w-full h-full">
            <ThreeViewer glbUrl={glbUrl} zoom={zoom} onZoomChange={onZoomChange} showTestSphere={false} />
          </div>
        ) : isGeneratingPreview ? (
          // Show preview generation loading
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto border-4 border-gray-300/30 border-t-gray-600 rounded-full animate-spin" />
              <div>
                <p className="text-gray-700 text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
                  Generating Preview...
                </p>
                <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
                  {progress}%
                </p>
              </div>
            </div>
          </div>
        ) : previewImageUrl ? (
          // Show preview image
          <div className="w-full h-full relative">
            <img 
              src={previewImageUrl} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          </div>
        ) : isLoading ? (
          // Show 3D model generation loading
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto border-4 border-gray-300/30 border-t-gray-600 rounded-full animate-spin" />
              <div>
                <p className="text-gray-700 text-sm font-medium" style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
                  Generating 3D Model...
                </p>
                <p className="text-gray-500 text-xs mt-1" style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}>
                  {progress}%
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Default: show test sphere
          <div className="w-full h-full">
            <ThreeViewer glbUrl="" zoom={zoom} onZoomChange={onZoomChange} showTestSphere={true} />
          </div>
        )}
      </div>
    </div>
  );
}

