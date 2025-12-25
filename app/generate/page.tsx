"use client";

import { useState, useRef } from "react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { submitTextTo3D, submitImageTo3D, generatePreviewImage } from "../../lib/api";

type Mode = "text" | "image";

export default function GeneratePage() {
  const { isSignedIn, getToken } = useAuth();
  const [mode, setMode] = useState<Mode>("text");
  const [prompt, setPrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // Text-to-3D preview states
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      return;
    }

    setUploadedFile(file);
    setImageUrl("");
    setError(null);

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

  // Generate preview image for text-to-3D
  const handleGeneratePreview = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }

    setGeneratingPreview(true);
    setError(null);
    setPreviewImageUrl(null);
    setPreviewId(null);

    try {
      const tokenGetter = async () => await getToken();
      const result = await generatePreviewImage(prompt.trim(), tokenGetter);
      setPreviewImageUrl(result.image_url);
      setPreviewId(result.preview_id);
    } catch (err: any) {
      setError(err.message || "Failed to generate preview image");
    } finally {
      setGeneratingPreview(false);
    }
  };

  // Regenerate preview with same prompt
  const handleRegeneratePreview = async () => {
    await handleGeneratePreview();
  };

  // Generate 3D model from preview image
  const handleGenerate3D = async () => {
    if (!previewImageUrl) {
      setError("No preview image available");
      return;
    }

    setLoading(true);
    setError(null);
    setJobId(null);

    try {
      const tokenGetter = async () => await getToken();
      // Use the preview image URL to generate 3D model
      const result = await submitImageTo3D(previewImageUrl, null, tokenGetter);
      setJobId(result.job_id);
      // Clear preview after starting 3D generation
      setPreviewImageUrl(null);
      setPreviewId(null);
    } catch (err: any) {
      setError(err.message || "Failed to generate 3D model");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignedIn) {
      setError("Please sign in to generate 3D models");
      return;
    }

    if (mode === "text") {
      // For text mode, generate preview first
      await handleGeneratePreview();
    } else {
      // For image mode, proceed directly to 3D generation
      setLoading(true);
      setError(null);
      setJobId(null);

      try {
        let result;
        const tokenGetter = async () => await getToken();

        if (uploadedFile) {
          setUploading(true);
          try {
            result = await submitImageTo3D(null, uploadedFile, tokenGetter);
          } catch (uploadErr: any) {
            setError(uploadErr.message || "Failed to submit image");
            setLoading(false);
            setUploading(false);
            return;
          } finally {
            setUploading(false);
          }
        } else if (imageUrl.trim()) {
          result = await submitImageTo3D(imageUrl.trim(), null, tokenGetter);
        } else {
          setError("Please upload an image file or enter an image URL");
          setLoading(false);
          return;
        }

        setJobId(result.job_id);
      } catch (err: any) {
        setError(err.message || "Failed to submit job");
      } finally {
        setLoading(false);
      }
    }
  };

  // Show sign-in prompt if not authenticated
  if (!isSignedIn) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6 p-8 rounded-2xl bg-white border border-gray-200 shadow-lg max-w-md">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-black/5 flex items-center justify-center">
            <svg className="w-8 h-8 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-black mb-2">Sign In Required</h2>
            <p className="text-gray-600">Create an account or sign in to start generating stunning 3D models.</p>
          </div>
          <SignInButton mode="modal">
            <button className="w-full px-6 py-3 text-lg font-semibold bg-black text-white rounded-xl hover:bg-gray-900 transition-all">
              Sign In to Continue
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-black">Generate 3D Model</h1>
        <p className="text-gray-600 mt-2">Create stunning 3D models from text prompts or images using AI.</p>
      </div>

      {/* Mode Selection */}
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-2 inline-flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("text");
            setImageUrl("");
            setError(null);
            setPreviewImageUrl(null);
            setPreviewId(null);
          }}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            mode === "text"
              ? "bg-black text-white"
              : "text-gray-600 hover:text-black hover:bg-white"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Text to 3D
          </span>
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("image");
            setPrompt("");
            setError(null);
            setPreviewImageUrl(null);
            setPreviewId(null);
          }}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            mode === "image"
              ? "bg-black text-white"
              : "text-gray-600 hover:text-black hover:bg-white"
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Image to 3D
          </span>
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-8">
        {mode === "text" ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-black mb-3">Text Prompt</label>
              <textarea
                className="w-full rounded-xl border border-gray-300 bg-white p-4 text-black placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
                rows={4}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  // Clear preview when prompt changes
                  if (previewImageUrl) {
                    setPreviewImageUrl(null);
                    setPreviewId(null);
                  }
                }}
                placeholder="A realistic medieval sword with intricate engravings on the blade..."
                required
                disabled={generatingPreview}
              />
              <p className="mt-2 text-xs text-gray-500">Be descriptive for better results. Include details about style, material, and features.</p>
            </div>

            {/* Loading State for Preview Generation */}
            {generatingPreview && !previewImageUrl && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-black">Generating Preview Image</h3>
                </div>
                <div className="rounded-lg overflow-hidden border border-gray-200 bg-white relative">
                  <div className="aspect-square flex flex-col items-center justify-center min-h-[300px]">
                    <div className="relative">
                      <div className="w-20 h-20 mx-auto mb-6">
                        <div className="w-20 h-20 spinner border-black"></div>
                      </div>
                      <div className="text-center space-y-2">
                        <p className="text-base font-medium text-black">Creating your preview image...</p>
                        <p className="text-sm text-gray-600">This may take a few moments</p>
                      </div>
                    </div>
                    {/* Animated dots */}
                    <div className="flex items-center gap-2 mt-6">
                      <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-black rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600 text-center">
                  AI is generating a preview image from your text prompt...
                </p>
              </div>
            )}

            {/* Preview Image Display */}
            {previewImageUrl && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-black">Preview Image</h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleRegeneratePreview}
                      disabled={generatingPreview}
                      className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm text-gray-700 hover:bg-gray-100 hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {generatingPreview ? (
                        <>
                          <div className="w-4 h-4 spinner border-black"></div>
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Regenerate
                        </>
                      )}
                    </button>
                  </div>
                </div>
                {generatingPreview ? (
                  <div className="rounded-lg overflow-hidden border border-gray-200 bg-white relative">
                    <div className="aspect-square flex flex-col items-center justify-center min-h-[300px] relative">
                      {/* Show existing image with overlay */}
                      <img 
                        src={previewImageUrl} 
                        alt="Preview" 
                        className="w-full h-full object-contain absolute inset-0 opacity-30"
                      />
                      <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 mb-4">
                          <div className="w-16 h-16 spinner border-black"></div>
                        </div>
                        <p className="text-sm font-medium text-black">Regenerating preview...</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg overflow-hidden border border-gray-200 bg-white">
                    <img 
                      src={previewImageUrl} 
                      alt="Preview" 
                      className="w-full h-auto max-h-96 object-contain mx-auto"
                    />
                  </div>
                )}
                <p className="mt-4 text-sm text-gray-600 text-center">
                  Review the preview image. If you're happy with it, click "Generate 3D Model" below.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-black mb-3">Upload Image</label>
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
                className="flex cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 hover:border-gray-400 hover:bg-gray-100 transition-all group"
              >
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white flex items-center justify-center group-hover:bg-gray-50 transition-colors border border-gray-200">
                    <svg className="w-6 h-6 text-gray-600 group-hover:text-black transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-sm font-medium text-gray-700">Click to upload image</div>
                  <div className="text-xs text-gray-500 mt-1">JPEG, PNG, WebP, GIF (max 10MB)</div>
                </div>
              </label>
              
              {uploadedFile && (
                <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                        <svg className="w-5 h-5 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-black">{uploadedFile.name}</span>
                        <span className="block text-xs text-gray-500">
                          {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeUploadedFile}
                      className="text-gray-500 hover:text-black transition-colors p-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {imagePreview && (
                    <div className="mt-4">
                      <img src={imagePreview} alt="Preview" className="max-h-48 w-auto rounded-lg border border-gray-200" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-sm text-gray-500">Or enter URL</span>
              </div>
            </div>

            {/* URL Input */}
            <div>
              <label className="block text-sm font-medium text-black mb-3">Image URL</label>
              <input
                type="url"
                className="w-full rounded-xl border border-gray-300 bg-white p-4 text-black placeholder:text-gray-400 focus:border-black focus:ring-2 focus:ring-black/10 transition-all"
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
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 flex items-center gap-2">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {mode === "text" ? (
          <>
            {!previewImageUrl ? (
              <button
                type="submit"
                disabled={generatingPreview || !prompt.trim()}
                className="w-full rounded-xl bg-black text-white px-6 py-4 font-semibold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
              >
                {generatingPreview ? (
                  <>
                    <div className="w-5 h-5 spinner border-white"></div>
                    Generating preview image...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Generate Preview Image
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGenerate3D}
                disabled={loading}
                className="w-full rounded-xl bg-black text-white px-6 py-4 font-semibold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 spinner border-white"></div>
                    Creating your 3D model...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate 3D Model
                  </>
                )}
              </button>
            )}
          </>
        ) : (
          <button
            type="submit"
            disabled={loading || uploading}
            className="w-full rounded-xl bg-black text-white px-6 py-4 font-semibold hover:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
          >
            {uploading ? (
              <>
                <div className="w-5 h-5 spinner border-white"></div>
                Uploading image...
              </>
            ) : loading ? (
              <>
                <div className="w-5 h-5 spinner border-white"></div>
                Creating your 3D model...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Generate from Image
              </>
            )}
          </button>
        )}
      </form>

      {jobId && (
        <div className="rounded-2xl border-2 border-green-200 bg-green-50 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <div className="font-semibold text-black">Job Created Successfully!</div>
              <div className="text-sm text-gray-600">Your 3D model is being generated</div>
            </div>
          </div>
          <div className="text-sm text-gray-700 mb-4 bg-white rounded-lg p-3 border border-gray-200">
            Job ID: <code className="bg-gray-100 px-2 py-1 rounded text-black">{jobId}</code>
          </div>
          <div className="flex gap-3">
            <a
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-black text-white px-4 py-3 text-sm font-medium hover:bg-gray-900 transition-all"
              href={`/viewer?jobId=${jobId}`}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View Progress
            </a>
            <button
              className="px-4 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all"
              onClick={() => {
                setJobId(null);
                setPrompt("");
                setImageUrl("");
                setUploadedFile(null);
                setImagePreview(null);
                setPreviewImageUrl(null);
                setPreviewId(null);
                setError(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
            >
              Create Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
