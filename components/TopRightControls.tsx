"use client";

import { motion } from "framer-motion";
import { FolderOpen } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

export function TopRightControls() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="absolute top-5 right-6 flex items-center gap-3 z-50"
    >
      <Link 
        href="/library"
        className="bg-black text-white px-5 py-2.5 rounded-2xl text-[13px] font-bold flex items-center gap-2 hover:bg-gray-800 transition-all active:scale-95 shadow-lg"
        style={{ fontFamily: 'var(--font-dm-sans), DM Sans, sans-serif' }}
      >
        <FolderOpen size={14} />
        Library
      </Link>
      <UserButton
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: "w-10 h-10",
          },
        }}
      />
    </motion.div>
  );
}

