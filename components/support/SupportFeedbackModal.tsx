"use client";

import { useState, useRef, useEffect, ChangeEvent, FormEvent } from "react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";
import {
  X,
  Paperclip,
  CheckCircle2,
  ChevronDown,
  Loader2,
} from "lucide-react";
import { submitSupportRequest, uploadSupportFile } from "@/lib/api";
import type { SupportTab } from "@/context/SupportContext";

export type { SupportTab };

const REQUEST_TYPE_OPTIONS = [
  { value: "Issue", label: "Issue" },
  { value: "Billing", label: "Billing" },
  { value: "Account & Data Management", label: "Account & Data Management" },
  { value: "Ask a question", label: "Ask a question" },
];

type SupportFeedbackModalProps = {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: SupportTab;
};

export function SupportFeedbackModal({
  isOpen,
  onClose,
  defaultTab = "issue",
}: SupportFeedbackModalProps) {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();

  const [activeTab, setActiveTab] = useState<SupportTab>(defaultTab);
  const [requestType, setRequestType] = useState<string>("Issue");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [guestEmail, setGuestEmail] = useState<string>("");

  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync tab if defaultTab changes when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab);
      setIsSuccess(false);
      setErrorMessage(null);
    }
  }, [isOpen, defaultTab]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      return;
    }
    setAttachedFile(file);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachmentPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  const handleRemoveAttachment = () => {
    setAttachedFile(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setErrorMessage("Please enter a message.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      // Upload attachment if any
      const uploadResult = attachedFile
        ? await (async () => {
            setUploadingAttachment(true);
            try {
              return await uploadSupportFile(attachedFile, getToken);
            } catch (err) {
              console.warn("Attachment upload failed, sending ticket without attachment", err);
              return null;
            } finally {
              setUploadingAttachment(false);
            }
          })()
        : null;

      const pageUrl = typeof window !== "undefined" ? window.location.href : undefined;
      const metadata = typeof window !== "undefined"
        ? {
            userAgent: navigator.userAgent,
            screenWidth: window.innerWidth,
            screenHeight: window.innerHeight,
            timestamp: new Date().toISOString(),
          }
        : {};

      await submitSupportRequest(
        {
          type: activeTab,
          request_type: activeTab === "issue" ? requestType : "Feedback",
          message: message.trim(),
          attachment_url: uploadResult?.url || undefined,
          attachment_name: attachedFile?.name || undefined,
          page_url: pageUrl,
          metadata,
          email: !isSignedIn && guestEmail.trim() ? guestEmail.trim() : undefined,
          name: user?.fullName || undefined,
        },
        isSignedIn ? getToken : undefined
      );

      setIsSuccess(true);
      setMessage("");
      setAttachedFile(null);
      setAttachmentPreview(null);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const isIssueTab = activeTab === "issue";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4 transition-all">
      <div
        className="relative w-full max-w-[530px] rounded-2xl bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.25)] p-6 font-dm-sans transition-all animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
                {isIssueTab ? "Issue reported" : "Thank you for your feedback!"}
              </h3>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-sm mx-auto">
                {isIssueTab
                  ? "We've logged your issue and our team will look into it as soon as possible."
                  : "We appreciate your ideas and feedback to help us build a better Hydrilla."}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl bg-neutral-900 px-6 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-200 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Header with Icon & Subtitle */}
            <div className="space-y-1.5 pr-8">
              <div className="flex items-center gap-2">
                <span className="text-xl select-none" role="img" aria-hidden="true">
                  {isIssueTab ? "🚨" : "💡"}
                </span>
                <h2 className="text-[20px] font-semibold text-neutral-900 dark:text-neutral-100 tracking-tight">
                  {isIssueTab ? "Report an issue" : "Share Feedback"}
                </h2>
              </div>
              <p className="text-[13px] leading-relaxed text-neutral-600 dark:text-neutral-400">
                {isIssueTab ? (
                  <>
                    Something isn't working? Errors, bugs, or setup problems go here. Check out our{" "}
                    <Link
                      href="/docs"
                      target="_blank"
                      className="font-medium text-neutral-900 dark:text-neutral-200 underline hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                      Help Center
                    </Link>
                  </>
                ) : (
                  "Ideas, feature requests, praise, or general feedback — not for support issues."
                )}
              </p>
            </div>

            {/* Toggle Tabs */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("issue");
                  setErrorMessage(null);
                }}
                className={`h-11 rounded-xl px-4 text-[13.5px] font-medium transition-all ${
                  isIssueTab
                    ? "border-2 border-purple-400 dark:border-purple-500 bg-purple-50/60 dark:bg-purple-950/20 text-neutral-900 dark:text-neutral-100 shadow-sm"
                    : "border border-transparent bg-neutral-100/90 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
              >
                Report an issue
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("feedback");
                  setErrorMessage(null);
                }}
                className={`h-11 rounded-xl px-4 text-[13.5px] font-medium transition-all ${
                  !isIssueTab
                    ? "border-2 border-purple-400 dark:border-purple-500 bg-purple-50/60 dark:bg-purple-950/20 text-neutral-900 dark:text-neutral-100 shadow-sm"
                    : "border border-transparent bg-neutral-100/90 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 hover:text-neutral-900 dark:hover:text-neutral-200"
                }`}
              >
                Share feedback
              </button>
            </div>

            {/* Request Type Dropdown (Only for "Report an issue") */}
            {isIssueTab ? (
              <div className="flex items-center justify-between gap-4 pt-1">
                <label className="text-[14px] font-medium text-neutral-800 dark:text-neutral-200 shrink-0">
                  Request Type
                </label>
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen((prev) => !prev)}
                    className="flex h-10 w-48 sm:w-56 items-center justify-between rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/80 px-3.5 text-[13px] font-medium text-neutral-800 dark:text-neutral-200 shadow-sm hover:border-neutral-300 dark:hover:border-neutral-600 transition-colors"
                  >
                    <span className="truncate">{requestType}</span>
                    <ChevronDown
                      className={`h-4 w-4 text-neutral-400 transition-transform duration-200 ${
                        dropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {dropdownOpen ? (
                    <div className="absolute right-0 top-full z-50 mt-1.5 w-48 sm:w-56 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-1 shadow-lg">
                      {REQUEST_TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setRequestType(opt.value);
                            setDropdownOpen(false);
                          }}
                          className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors ${
                            requestType === opt.value
                              ? "bg-neutral-100 dark:bg-neutral-700/70 text-neutral-950 dark:text-white"
                              : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700/40 hover:text-neutral-900 dark:hover:text-white"
                          }`}
                        >
                          {requestType === opt.value ? (
                            <span className="text-xs text-neutral-900 dark:text-white">✓</span>
                          ) : (
                            <span className="w-2.5" />
                          )}
                          <span className="truncate">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Email input for guest users */}
            {!isSignedIn ? (
              <div className="space-y-1">
                <input
                  type="email"
                  placeholder="Your email (so we can reply back to you)"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className="w-full h-10 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/80 px-3.5 text-[13px] text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
                />
              </div>
            ) : null}

            {/* Textarea */}
            <div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={
                  isIssueTab
                    ? "Describe the issue in detail, and attach any screenshots or recordings below"
                    : "How can we make Hydrilla better for you?"
                }
                rows={5}
                required
                className="w-full resize-none rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800/80 p-3.5 text-[13.5px] leading-relaxed text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 outline-none focus:border-neutral-400 dark:focus:border-neutral-500 transition-colors"
              />
            </div>

            {/* Attachment preview if file selected */}
            {attachedFile ? (
              <div className="flex items-center justify-between rounded-xl border border-neutral-200/90 dark:border-neutral-700/80 bg-neutral-50/80 dark:bg-neutral-800/60 p-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  {attachmentPreview ? (
                    <img
                      src={attachmentPreview}
                      alt="Preview"
                      className="h-8 w-8 rounded-lg object-cover border border-neutral-200 dark:border-neutral-700 shrink-0"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-200/70 dark:bg-neutral-700 text-neutral-500 shrink-0">
                      <Paperclip className="h-4 w-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200 truncate">
                      {attachedFile.name}
                    </p>
                    <p className="text-[11px] text-neutral-400">
                      {(attachedFile.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveAttachment}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200/70 dark:hover:bg-neutral-700 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors shrink-0"
                  aria-label="Remove attachment"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}

            {errorMessage ? (
              <p className="text-xs text-rose-500 font-medium">{errorMessage}</p>
            ) : null}

            {/* Action Bar (Paperclip on Left, Send Message on Right) */}
            <div className="flex items-center justify-between pt-1">
              {/* Paperclip attachment button */}
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,video/*,.png,.jpg,.jpeg,.webp,.gif,.mp4,.webm,.mov"
                  className="hidden"
                  id="support-file-input"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                  title="Attach screenshot or recording"
                  aria-label="Attach file"
                >
                  <Paperclip className="h-4 w-4" strokeWidth={1.8} />
                </button>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting || !message.trim()}
                className="flex items-center justify-center gap-2 rounded-xl bg-neutral-900 px-5 py-2.5 text-[13.5px] font-medium text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 transition-all shadow-sm"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>{uploadingAttachment ? "Uploading..." : "Sending..."}</span>
                  </>
                ) : (
                  <span>Send message</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
