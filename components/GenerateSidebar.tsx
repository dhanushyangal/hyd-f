"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Camera, 
  Sun, 
  Lightbulb, 
  Grid3x3, 
  Box, 
  Lock, 
  Eye, 
  Plus, 
  Search, 
  ChevronDown,
  X,
  Brain
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface GenerateSidebarProps {
  variations?: Array<{
    id: string;
    imageUrl: string;
    prompt?: string;
    createdAt?: Date;
  }>;
  onSelectVariation?: (id: string) => void;
  selectedVariationId?: string | null;
}

interface SceneElement {
  id: string;
  name: string;
  icon: React.ReactNode;
  locked?: boolean;
  visible?: boolean;
  selected?: boolean;
}

export function GenerateSidebar({ 
  variations = [], 
  onSelectVariation,
  selectedVariationId 
}: GenerateSidebarProps) {
  const [activeTab, setActiveTab] = useState<"scene" | "assets">("assets");
  const [searchQuery, setSearchQuery] = useState("");
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Scene elements
  const sceneElements: SceneElement[] = [
    { id: "camera1", name: "Camera 1", icon: <Camera size={16} /> },
    { id: "domeLight", name: "Dome Light", icon: <Sun size={16} /> },
    { id: "keyLight", name: "Key Light", icon: <Lightbulb size={16} /> },
    { id: "areaLight", name: "Area Light", icon: <Grid3x3 size={16} /> },
    { 
      id: "character", 
      name: "Character", 
      icon: <Box size={16} />,
      locked: true,
      visible: true
    },
    { id: "background2", name: "Background 2", icon: <Box size={16} /> },
    { id: "object2", name: "Object 2", icon: <Box size={16} />, selected: true },
    { id: "background1", name: "Background 1", icon: <Box size={16} /> },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    };

    if (isProjectDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isProjectDropdownOpen]);

  // Filter variations based on search
  const filteredVariations = variations.filter(variation => 
    variation.prompt?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    variation.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ x: -320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="fixed left-0 top-0 h-screen w-80 bg-white/95 backdrop-blur-2xl border-r border-gray-200/50 shadow-2xl z-40 flex flex-col"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-200/50">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
            className="flex items-center gap-2 w-full group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-900 to-black flex items-center justify-center flex-shrink-0">
              <Brain size={16} className="text-white" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span 
                  className="text-sm font-semibold text-gray-900 truncate"
                  style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                >
                  3D Boy Character
                </span>
                <ChevronDown 
                  size={14} 
                  className={`text-gray-500 transition-transform duration-200 flex-shrink-0 ${
                    isProjectDropdownOpen ? 'rotate-180' : ''
                  }`} 
                />
              </div>
              <p className="text-xs text-gray-500 mt-0.5 truncate">3D Design Project</p>
            </div>
            <div className="w-6 h-4 rounded border border-gray-300/50 bg-gray-50/50 flex-shrink-0"></div>
          </button>

          {/* Project Dropdown */}
          <AnimatePresence>
            {isProjectDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full mt-2 left-0 right-0 bg-white/95 backdrop-blur-xl rounded-xl border border-gray-200/50 shadow-lg py-2 z-50"
              >
                <button className="w-full px-4 py-2.5 text-left text-sm text-gray-900 hover:bg-gray-50 transition-colors">
                  <div className="font-semibold">3D Boy Character</div>
                  <div className="text-xs text-gray-500 mt-0.5">3D Design Project</div>
                </button>
                <button className="w-full px-4 py-2.5 text-left text-sm text-gray-600 hover:bg-gray-50 transition-colors border-t border-gray-100">
                  <div className="font-medium">New Project</div>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200/50 px-5">
        <button
          onClick={() => setActiveTab("scene")}
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === "scene"
              ? "text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
          style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
        >
          Scene
          {activeTab === "scene" && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-t-full"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
        <button
          onClick={() => setActiveTab("assets")}
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === "assets"
              ? "text-gray-900"
              : "text-gray-500 hover:text-gray-700"
          }`}
          style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
        >
          Assets
          {activeTab === "assets" && (
            <motion.div
              layoutId="activeTab"
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-900 rounded-t-full"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "scene" ? (
          <div className="px-3 py-4 space-y-1">
            {sceneElements.map((element) => (
              <motion.button
                key={element.id}
                whileHover={{ x: 2 }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group ${
                  element.selected
                    ? "bg-gray-100/80 text-gray-900"
                    : "hover:bg-gray-50/80 text-gray-700"
                }`}
              >
                <div className={`flex-shrink-0 ${
                  element.selected ? "text-gray-900" : "text-gray-500"
                }`}>
                  {element.icon}
                </div>
                <span 
                  className="flex-1 text-left text-sm font-medium truncate"
                  style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
                >
                  {element.name}
                </span>
                {element.id === "character" && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {element.locked && (
                      <Lock size={12} className="text-gray-400" />
                    )}
                    {element.visible && (
                      <Eye size={12} className="text-gray-400" />
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle add action
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                    >
                      <Plus size={12} className="text-gray-500" />
                    </button>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        ) : (
          <div className="p-4">
            {filteredVariations.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredVariations.map((variation, index) => (
                  <motion.button
                    key={variation.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onSelectVariation?.(variation.id)}
                    className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      selectedVariationId === variation.id
                        ? "border-gray-900 shadow-lg"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <img
                      src={variation.imageUrl}
                      alt={variation.prompt || `Variation ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {selectedVariationId === variation.id && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 border-2 border-gray-900 rounded-xl"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                  <Box size={24} className="text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">
                  No variations yet
                </p>
                <p className="text-xs text-gray-500">
                  Generated models will appear here
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="px-4 py-3 border-t border-gray-200/50">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full pl-9 pr-20 py-2.5 bg-gray-50/80 border border-gray-200/50 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/20 focus:border-gray-300 transition-all"
            style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 text-xs font-medium text-gray-500 bg-white/80 border border-gray-200/50 rounded">
              ⌘K
            </kbd>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

