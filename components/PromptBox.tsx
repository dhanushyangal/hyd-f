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
      onImageUpload(file);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (onSubmit && value.trim()) {
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
      {/* Image Preview Stack - Only shows when images exist */}
      <AnimatePresence>
        {images.length > 0 && !isAtBottom && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-[99px] left-4 flex items-center z-50 pointer-events-none"
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
        <div className="bg-white/15 backdrop-blur-2xl rounded-[24px] border border-gray-400/25 shadow-2xl pt-5 pb-3 px-6 flex flex-col gap-1 w-full relative overflow-hidden">
          {/* Inner glow for depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-white/25 via-white/5 to-transparent pointer-events-none rounded-[24px]" />
          {/* Subtle border highlight for premium look */}
          <div className="absolute inset-0 rounded-[24px] border border-white/30 pointer-events-none" />
          <textarea 
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={placeholder}
            className="w-full bg-transparent border-0 outline-none text-[18px] font-medium text-gray-900 placeholder:text-gray-400 resize-none min-h-[28px] leading-tight tracking-tight p-0 disabled:opacity-50 disabled:cursor-not-allowed focus:ring-0 focus:border-0 focus:outline-none focus:shadow-none"
            style={{
              whiteSpace: "pre-wrap",
              overflowWrap: "break-word",
              fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
            }}
          />
          
          <div className="flex items-center justify-between mt-1 gap-3 relative z-10">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => !images.length && fileInputRef.current?.click()}
                disabled={disabled || images.length > 0}
                className="p-2 rounded-lg bg-white/20 backdrop-blur-sm border border-white/30 hover:bg-white/30 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                title={images.length > 0 ? "Image already uploaded" : "Upload image"}
                aria-label="Upload image"
              >
                <ImageIcon size={18} strokeWidth={1.5} className="text-gray-700" />
              </button>
            </div>

            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Model Selector Dropdown - Premium Small Glass Style */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-md hover:bg-white/80 transition-all duration-300 border border-gray-300/40 shadow-sm hover:shadow-md group"
                  style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                >
                  <span className="text-[11px] font-semibold text-gray-800" style={{ 
                    textShadow: '0 1px 2px rgba(255, 255, 255, 0.9)',
                  }}>
                    {selectedModel}
                  </span>
                  <ChevronDown size={11} className={`text-gray-600 transition-transform duration-300 ${isModelDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {isModelDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                      className="absolute top-full mt-2 left-0 bg-white/95 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-lg py-2 min-w-[180px] z-50"
                    >
                      {models.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            if (model.available) {
                              setSelectedModel(model.name);
                              setIsModelDropdownOpen(false);
                            }
                          }}
                          disabled={!model.available}
                          className={`w-full px-4 py-2.5 text-left text-sm transition-all duration-200 ${
                            model.available
                              ? 'hover:bg-gray-50 text-gray-900'
                              : 'text-gray-400 cursor-not-allowed opacity-60'
                          } ${
                            selectedModel === model.name ? 'bg-gray-50 font-semibold' : ''
                          }`}
                          style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                        >
                          <div className="flex items-center justify-between">
                            <span>{model.name}</span>
                            {!model.available && (
                              <span className="text-[10px] text-gray-400 ml-2">coming soon</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
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
                className={`px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed ${
                  canSubmit 
                    ? 'bg-gradient-to-br from-slate-200 via-slate-100 to-slate-200 text-slate-800 shadow-md border border-slate-300/60' 
                    : 'bg-slate-100/50 text-slate-400 border border-slate-200/40'
                }`}
                style={{ 
                  fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif',
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

