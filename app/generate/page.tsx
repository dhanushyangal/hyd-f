"use client";

import { useState, useRef } from "react";
import { submitTextTo3D, submitImageTo3D } from "../../lib/api";

type Mode = "text" | "image";

export default function GeneratePage() {
  const [mode, setMode] = useState<Mode>("text");
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setUploadedFile(file);
    setImageUrl(""); // Clear URL input when file is selected
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setJobId(null);

    try {
      let result;
      if (mode === "text") {
        if (!prompt.trim()) {
          setError("Please enter a prompt");
          setLoading(false);
          return;
        }
        result = await submitTextTo3D(prompt.trim());
      } else {
        // If file is uploaded, send directly to FastAPI (which will upload to S3)
        // Otherwise, use the provided URL
        if (uploadedFile) {
          setUploading(true);
          try {
            // Send file directly to FastAPI - it will handle S3 upload
            result = await submitImageTo3D(null, uploadedFile);
          } catch (uploadErr: any) {
            setError(uploadErr.message || "Failed to submit image");
            setLoading(false);
            setUploading(false);
            return;
          } finally {
            setUploading(false);
          }
        } else if (imageUrl.trim()) {
          result = await submitImageTo3D(imageUrl.trim(), null);
        } else {
          setError("Please upload an image file or enter an image URL");
          setLoading(false);
          return;
        }
      }

      setJobId(result.job_id);
    } catch (err: any) {
      setError(err.message || "Failed to submit job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Generate 3D Model</h1>
        <p className="text-sm text-slate-600">Create 3D models from text prompts or images using Hunyuan3D.</p>
      </div>

      {/* Mode Selection */}
      <div className="rounded-lg border bg-white p-4 shadow-sm">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => {
              setMode("text");
              setImageUrl("");
              setError(null);
            }}
            className={`flex-1 rounded px-4 py-2 font-medium transition-colors ${
              mode === "text" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Text to 3D
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("image");
              setPrompt("");
              setError(null);
            }}
            className={`flex-1 rounded px-4 py-2 font-medium transition-colors ${
              mode === "image" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Image to 3D
          </button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-white p-6 shadow-sm">
        {mode === "text" ? (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Text Prompt</label>
            <textarea
              className="w-full rounded border p-3"
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A realistic medieval sword with fine details"
              required
            />
            <p className="mt-1 text-xs text-slate-500">Describe the 3D model you want to generate</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Upload Image</label>
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="flex cursor-pointer items-center justify-center rounded border-2 border-dashed border-slate-300 bg-slate-50 p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <div className="text-center">
                    <div className="text-sm font-medium text-slate-700">Choose Image File</div>
                    <div className="text-xs text-slate-500 mt-1">JPEG, PNG, WebP, GIF (max 10MB)</div>
                  </div>
                </label>
                {uploadedFile && (
                  <div className="relative rounded border bg-white p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-700">{uploadedFile.name}</span>
                        <span className="text-xs text-slate-500">
                          ({(uploadedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={removeUploadedFile}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    {imagePreview && (
                      <div className="mt-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-h-48 w-auto rounded border"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or</span>
              </div>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Image URL</label>
              <input
                type="url"
                className="w-full rounded border p-3"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  if (e.target.value.trim()) {
                    setUploadedFile(null);
                    setImagePreview(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = "";
                    }
                  }
                }}
                placeholder="https://example.com/image.jpg"
              />
              <p className="mt-1 text-xs text-slate-500">Enter a publicly accessible image URL</p>
            </div>
          </div>
        )}

        {error && <div className="rounded bg-red-100 px-4 py-3 text-sm text-red-700">{error}</div>}

        {/* Loading Overlay */}
        {(loading || uploading) && (
          <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">
                  {uploading ? "Uploading Image..." : "Submitting Job..."}
                </h3>
                <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
              </div>
              <p className="text-sm text-slate-600">
                {uploading 
                  ? "Uploading your image to cloud storage..." 
                  : mode === "text"
                  ? "Creating 3D generation job (estimated time: ~3 minutes)..."
                  : "Creating 3D generation job (estimated time: ~2.5 minutes)..."}
              </p>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || uploading}
          className="w-full rounded bg-blue-600 px-6 py-3 text-white font-medium shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading
            ? "Uploading image..."
            : loading
            ? "Submitting..."
            : mode === "text"
            ? "Generate from Text"
            : "Generate from Image"}
        </button>
      </form>

      {jobId && (
        <div className="rounded-lg border-2 border-green-200 bg-green-50 p-4">
          <div className="font-semibold text-green-900 mb-2">✅ Job Created Successfully!</div>
          <div className="text-sm text-green-800 mb-3">
            <div>Job ID: <code className="bg-green-100 px-2 py-1 rounded">{jobId}</code></div>
          </div>
          <div className="flex gap-2">
            <a
              className="inline-block rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors"
              href={`/viewer?jobId=${jobId}&mode=${mode === "text" ? "text-to-3d" : "image-to-3d"}`}
            >
              View Progress & Result
            </a>
            <a
              className="inline-block rounded bg-slate-200 px-4 py-2 text-sm text-slate-700 hover:bg-slate-300 transition-colors"
              href={`/generate`}
              onClick={(e) => {
                e.preventDefault();
                setJobId(null);
                setPrompt("");
                setImageUrl("");
                setUploadedFile(null);
                setImagePreview(null);
                setError(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            >
              Create Another
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
