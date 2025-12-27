"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { 
  MousePointer2, 
  Hand, 
  Crop, 
  ChevronDown,
  Undo2,
  Redo2,
} from "lucide-react";

interface GenerateNavbarProps {
  zoom?: number;
  onZoomChange?: (zoom: number) => void;
}

function NavItem({ 
  icon, 
  isSelected = false, 
  onClick 
}: { 
  icon: React.ReactNode; 
  isSelected?: boolean;
  onClick?: () => void;
}) {
  return (
    <button 
      onClick={onClick}
      className={`p-2.5 rounded-lg transition-all duration-200 ${
        isSelected 
          ? "bg-gray-200 text-gray-900" 
          : "text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
      }`}
    >
      {icon}
    </button>
  );
}

export function GenerateNavbar({ zoom = 100, onZoomChange }: GenerateNavbarProps) {
  const [selectedTool, setSelectedTool] = useState<string>("pointer");
  const [isZoomDropdownOpen, setIsZoomDropdownOpen] = useState(false);
  
  const zoomOptions = [25, 50, 75, 100, 125, 150, 175, 200];

  const handleZoomSelect = (newZoom: number) => {
    if (onZoomChange) {
      onZoomChange(newZoom);
    }
    setIsZoomDropdownOpen(false);
  };

  return (
    <div className="fixed top-5 left-0 right-0 flex justify-center z-[100] pointer-events-none">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="pointer-events-auto"
      >
        <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm border border-gray-300 p-1">
          <NavItem 
            icon={<MousePointer2 size={18} strokeWidth={2} />} 
            isSelected={selectedTool === "pointer"}
            onClick={() => setSelectedTool("pointer")}
          />
          <NavItem 
            icon={<Hand size={18} strokeWidth={2} />} 
            isSelected={selectedTool === "hand"}
            onClick={() => setSelectedTool("hand")}
          />
          <NavItem 
            icon={<Crop size={18} strokeWidth={2} />} 
            isSelected={selectedTool === "crop"}
            onClick={() => setSelectedTool("crop")}
          />
          
          <div className="w-[1px] h-6 bg-gray-300 mx-1" />
          
          <div className="relative">
            <button 
              onClick={() => setIsZoomDropdownOpen(!isZoomDropdownOpen)}
              className="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-1.5 text-sm font-medium"
            >
              <span>{zoom}%</span>
              <ChevronDown size={14} strokeWidth={2} />
            </button>
            
            {isZoomDropdownOpen && (
              <div className="absolute top-full mt-1 left-0 bg-white border border-gray-300 rounded-lg shadow-lg py-1 min-w-[80px] z-50">
                {zoomOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleZoomSelect(option)}
                    className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 transition-colors ${
                      zoom === option ? 'bg-gray-100 font-semibold' : ''
                    }`}
                  >
                    {option}%
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="w-[1px] h-6 bg-gray-300 mx-1" />
          
          <NavItem 
            icon={<Undo2 size={18} strokeWidth={2} />} 
            onClick={() => {}}
          />
          <NavItem 
            icon={<Redo2 size={18} strokeWidth={2} />} 
            onClick={() => {}}
          />
          
          <div className="w-[1px] h-6 bg-gray-300 mx-1" />
          
          <button className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-sm font-medium">
            Export
          </button>
        </div>
      </motion.div>
    </div>
  );
}
