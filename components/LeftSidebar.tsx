"use client";

import { motion } from "framer-motion";
import { Plus, Minus, Box } from "lucide-react";

export function LeftSidebar() {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
      className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-5 z-50"
    >
      <div className="flex flex-col gap-1.5 bg-white/80 backdrop-blur-xl rounded-2xl p-2 border border-gray-200/50 shadow-lg">
        <button className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-xl transition-all">
          <Plus size={20} strokeWidth={1.5} />
        </button>
        <div className="w-6 h-[1px] bg-gray-300 mx-auto my-0.5" />
        <button className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50 rounded-xl transition-all">
          <Minus size={20} strokeWidth={1.5} />
        </button>
      </div>
      
      <button className="p-4 bg-white text-black rounded-[22px] transition-all relative shadow-lg border border-gray-200/50 hover:scale-105 active:scale-95">
        <Box size={20} strokeWidth={2} />
        <div className="absolute -right-0.5 -top-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
      </button>
    </motion.div>
  );
}

