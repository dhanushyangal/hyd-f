"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface MenuProps {
  isOpen: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}

export function Menu({ isOpen, onClose, children }: MenuProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={onClose}
          />
          
          {/* Menu Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 bottom-0 w-[280px] bg-white border-r border-neutral-200 shadow-2xl z-50 lg:hidden overflow-y-auto"
          >
            {/* Header */}
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-black">Menu</h2>
              <button
                onClick={onClose}
                aria-label="Close menu"
                className="p-2 hover:bg-neutral-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-black" />
              </button>
            </div>
            
            {/* Menu Content */}
            <div className="p-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

