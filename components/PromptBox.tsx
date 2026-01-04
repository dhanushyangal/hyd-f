"use client";

import { useState, useRef, useEffect } from "react";
import { Image as ImageIcon, Plus, ChevronDown, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PromptBoxProps {
  value: string;
  onChange: (value: string) => void;
  onImageUpload?: (file: File) => void;
  onSubmit?: () => void;
  imagePreview?: string | null;
  aspectRatio?: string;
  mode?: "text" | "image" | "reference";
  disabled?: boolean;
  placeholder?: string;
  isAtBottom?: boolean;
}

export function PromptBox({
  value,
  onChange,
  onImageUpload,
  onSubmit,
  imagePreview,
  aspectRatio = "3:4",
  mode = "text",
  disabled = false,
  placeholder = "Describe your scene with visual references...",
  isAtBottom = false,
}: PromptBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [images, setImages] = useState<string[]>([]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "22px";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(scrollHeight, 200)}px`;
    }
  }, [value]);

  // Sync imagePreview with images array
  useEffect(() => {
    if (imagePreview) {
      setImages([imagePreview]);
    } else {
      setImages([]);
    }
  }, [imagePreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      // Clear text when image is uploaded
      if (value.trim()) {
        onChange("");
      }
      onImageUpload(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (onSubmit && (value.trim() || images.length > 0)) {
        onSubmit();
      }
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, idx) => idx !== index);
    setImages(newImages);
    if (newImages.length === 0 && onImageUpload) {
      // Trigger callback to clear image
      const emptyFile = new File([], "");
      // @ts-ignore
      onImageUpload(emptyFile);
    }
  };

  const [selectedModel, setSelectedModel] = useState("Hunyuan3D-2.1");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [showComingSoonMessage, setShowComingSoonMessage] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const models = [
    { id: "hunyuan", name: "Hunyuan3D-2.1", available: true },
    { id: "trellis", name: "TRELLIS 2", available: false },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };

    if (isModelDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModelDropdownOpen]);

  const canSubmit = value.trim().length > 0 || images.length > 0;

  return (
    <motion.div 
      className="relative w-full max-w-[700px] mx-auto group"
      initial={false}
      animate={isAtBottom ? { y: 0, opacity: 1 } : { y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      style={{ width: '100%', maxWidth: '700px' }}
    >
      {/* Image Preview Stack - Shows when images exist (even at bottom) */}
      <AnimatePresence>
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className={`absolute ${isAtBottom ? '-top-[120px]' : '-top-[99px]'} left-4 flex items-center z-50 pointer-events-none`}
          >
            <div className="flex -space-x-10 pointer-events-auto">
              {images.map((img, i) => (
                <motion.div
                  key={i}
                  initial={{ rotate: -6, x: 0 }}
                  whileHover={{ rotate: 0, y: -5, zIndex: 100, scale: 1.05 }}
                  style={{ zIndex: 40 - i }}
                  className="relative group/img"
                >
                  <div 
                    className="w-[78px] h-[104px] rounded-[16px] overflow-hidden border border-gray-200/50 shadow-lg bg-white cursor-pointer"
                    onClick={() => removeImage(i)}
                  >
                    <img src={img} alt="Ref" className="w-full h-full object-cover" />
                  </div>
                  <button 
                    onClick={() => removeImage(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 text-white rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-all hover:scale-110 shadow-xl z-50"
                    aria-label="Remove image"
                  >
                    <X size={12} strokeWidth={3} />
                  </button>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Prompt Box - Premium Glassmorphism Frosted Glass Style */}
      <div className="relative w-full">
        {/* Frosted glass effect with subtle gradient overlay */}
        <div className="absolute -inset-[1px] bg-gradient-to-br from-gray-200/30 via-gray-100/20 to-transparent rounded-[24px] -z-10 blur-sm" />
        <div className="bg-white/15 backdrop-blur-2xl rounded-[24px] border border-gray-400/25 shadow-2xl pt-5 pb-3 px-6 flex flex-col gap-1 w-full relative overflow-visible">
          {/* Inner glow for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/5 to-transparent pointer-events-none rounded-[24px]" />
          {/* Subtle border highlight for premium look */}
          <div className="absolute inset-0 rounded-[24px] border border-white/30 pointer-events-none" />
          {/* eslint-disable-next-line @next/next/no-inline-styles */}
          <textarea 
            ref={textareaRef}
            value={value}
            onChange={(e) => {
              const newValue = e.target.value;
              // Clear image when text is typed
              if (newValue.trim() && images.length > 0 && onImageUpload) {
                const emptyFile = new File([], "");
                // @ts-ignore
                onImageUpload(emptyFile);
              }
              onChange(newValue);
            }}
            onKeyDown={handleKeyDown}
            disabled={disabled || images.length > 0}
            placeholder={placeholder}
            className="prompt-box-textarea w-full bg-transparent border-0 outline-none text-[14px] sm:text-[18px] font-medium text-gray-900 placeholder:text-gray-400 resize-none min-h-[28px] leading-tight tracking-tight p-0 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-0 focus:border-0 focus:outline-none focus:shadow-none font-dm-sans"
            style={{
              whiteSpace: "pre-wrap",
              overflowWrap: "break-word",
            }}
            autoFocus={false}
          />
          
          <div className="flex items-center justify-between mt-1 gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative group/image-btn">
                <button 
                  onClick={() => !images.length && !value.trim() && fileInputRef.current?.click()}
                  disabled={disabled || images.length > 0 || value.trim().length > 0}
                  className="p-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                  title={images.length > 0 ? "Image already uploaded" : value.trim() ? "Clear text to upload image" : "Upload image"}
                  aria-label="Upload image"
                >
                  <ImageIcon size={18} strokeWidth={1.5} className="text-gray-700" />
                </button>
                {/* Tooltip when text is present */}
                {value.trim() && !images.length && (
                  <div className="absolute bottom-full left-0 mb-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-900 text-white text-[10px] sm:text-xs rounded-lg shadow-lg whitespace-nowrap opacity-0 group-hover/image-btn:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>You cannot use image and text at the same time</span>
                    </div>
                    {/* Tooltip arrow */}
                    <div className="absolute top-full left-3 sm:left-4 -mt-1">
                      <div className="w-2 h-2 bg-gray-900 rotate-45"></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Model Selector Dropdown - Modern Design */}
              <div className="relative z-50" ref={dropdownRef}>
                <button
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white border transition-all duration-200 font-dm-sans ${
                    isModelDropdownOpen 
                      ? 'border-gray-300 shadow-md bg-gray-50' 
                      : 'border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <span className="text-[10px] sm:text-xs font-semibold text-gray-900">
                    {selectedModel}
                  </span>
                  <ChevronDown 
                    size={10}
                    className={`text-gray-500 transition-transform duration-200 ease-in-out sm:w-3 sm:h-3 ${isModelDropdownOpen ? 'rotate-180' : 'rotate-0'}`} 
                  />
                </button>
                
                <AnimatePresence>
                  {isModelDropdownOpen && (
                    <>
                      {/* Backdrop overlay */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[55]"
                        onClick={() => setIsModelDropdownOpen(false)}
                      />
                      
                      {/* Dropdown menu */}
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                        className="absolute top-full mt-1.5 left-0 bg-white rounded-2xl border border-gray-200 shadow-xl py-1.5 min-w-[200px] z-[60] overflow-hidden"
                        style={{
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                        }}
                      >
                        {models.map((model, index) => (
                          <motion.button
                            key={model.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.2 }}
                            onClick={() => {
                              if (model.available) {
                                setSelectedModel(model.name);
                                setIsModelDropdownOpen(false);
                              } else {
                                // Show coming soon message for unavailable models
                                setShowComingSoonMessage(true);
                                setTimeout(() => {
                                  setShowComingSoonMessage(false);
                                }, 2000);
                              }
                            }}
                            className={`w-full px-4 py-2.5 text-left text-xs sm:text-sm transition-all duration-150 font-dm-sans relative ${
                              model.available
                                ? 'hover:bg-gray-50 text-gray-900 cursor-pointer active:bg-gray-100'
                                : 'text-gray-400 cursor-pointer hover:bg-gray-50/50'
                            } ${
                              selectedModel === model.name 
                                ? 'bg-gray-50 font-semibold text-gray-900' 
                                : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`${!model.available ? 'opacity-60' : ''} ${selectedModel === model.name ? 'text-gray-900' : ''}`}>
                                {model.name}
                              </span>
                              {!model.available && (
                                <span className="text-[10px] font-medium text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full ml-2 border border-orange-200">
                                  Coming Soon
                                </span>
                              )}
                              {model.available && selectedModel === model.name && (
                                <svg className="w-4 h-4 text-gray-600 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            {selectedModel === model.name && model.available && (
                              <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-900 rounded-r-full" />
                            )}
                          </motion.button>
                        ))}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
                
                {/* Coming Soon Message */}
                {showComingSoonMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute top-full mt-2 left-0 px-3 py-2 bg-orange-50 border border-orange-200 rounded-lg shadow-md z-50 whitespace-nowrap"
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-orange-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-medium text-orange-800">Coming Soon</span>
                    </div>
                    {/* Arrow */}
                    <div className="absolute top-0 left-4 -mt-1.5">
                      <div className="w-3 h-3 bg-orange-50 border-l border-t border-orange-200 rotate-45"></div>
                    </div>
                  </motion.div>
                )}
              </div>
              
              {/* Create Button - Premium Silver Style with Slow Hover */}
              <motion.button 
                whileHover={canSubmit ? { 
                  scale: 1.03,
                  transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] }
                } : {}}
                whileTap={canSubmit ? { 
                  scale: 0.97,
                  transition: { duration: 0.2 }
                } : {}}
                transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                onClick={onSubmit}
                disabled={disabled || !canSubmit}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed font-dm-sans ${
                  canSubmit 
                    ? 'bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 text-slate-800 shadow-md border border-slate-300/60' 
                    : 'bg-slate-100/50 text-slate-400 border border-slate-200/40'
                }`}
                style={{ 
                  textShadow: canSubmit ? '0 1px 2px rgba(255, 255, 255, 0.8)' : 'none',
                }}
                title="Create"
                aria-label="Create"
              >
                Create
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload image file"
      />
    </motion.div>
  );
}

