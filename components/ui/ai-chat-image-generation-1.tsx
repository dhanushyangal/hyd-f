"use client"

import * as React from "react"
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

export interface ImageGenerationProps {
  children: React.ReactNode;
  progress?: number;
  loadingState?: "starting" | "generating" | "completed";
  duration?: number;
}

export const ImageGeneration = (
  ({ children, progress: externalProgress, loadingState: externalLoadingState, duration: externalDuration = 30000 } : ImageGenerationProps) => {
    const [progress, setProgress] = React.useState(0);
    const [loadingState, setLoadingState] = React.useState<
      "starting" | "generating" | "completed"
    >("starting");
    const [animatedProgress, setAnimatedProgress] = React.useState(0);
    const duration = externalDuration;

    // Use external progress and loading state if provided, otherwise use internal state
    const finalProgress = externalProgress !== undefined ? externalProgress : progress;
    const finalLoadingState = externalLoadingState !== undefined ? externalLoadingState : loadingState;

    // Animate progress reveal when external progress is provided and completed
    React.useEffect(() => {
      if (externalProgress !== undefined && externalProgress > 0 && finalLoadingState === "completed") {
        // Animate from 0 to the target progress over 1 second
        const startTime = Date.now();
        const targetProgress = externalProgress;
        const animationDuration = 1000;
        
        const interval = setInterval(() => {
          const elapsed = Date.now() - startTime;
          const newProgress = Math.min(targetProgress, (elapsed / animationDuration) * targetProgress);
          setAnimatedProgress(newProgress);
          
          if (newProgress >= targetProgress) {
            clearInterval(interval);
          }
        }, 16);
        
        return () => clearInterval(interval);
      } else if (externalProgress !== undefined) {
        // For non-completed states, use progress directly
        setAnimatedProgress(externalProgress);
      }
    }, [externalProgress, finalLoadingState]);

    React.useEffect(() => {
      // Only run internal progress if external props are not provided
      if (externalProgress === undefined && externalLoadingState === undefined) {
        const startingTimeout = setTimeout(() => {
          setLoadingState("generating");

          const startTime = Date.now();

          const interval = setInterval(() => {
            const elapsedTime = Date.now() - startTime;
            const progressPercentage = Math.min(
              100,
              (elapsedTime / duration) * 100
            );

            setProgress(progressPercentage);

            if (progressPercentage >= 100) {
              clearInterval(interval);
              setLoadingState("completed");
            }
          }, 16);

          return () => clearInterval(interval);
        }, 3000);

        return () => clearTimeout(startingTimeout);
      }
    }, [duration, externalProgress, externalLoadingState]);

    // Hide status text when completed and external props are provided (for preview images)
    const showStatusText = !(finalLoadingState === "completed" && externalProgress !== undefined);
    
    return (
      <div className="flex flex-col gap-2">
        {showStatusText && (
          <motion.span
            className="bg-[linear-gradient(110deg,var(--color-muted-foreground),35%,var(--color-foreground),50%,var(--color-muted-foreground),75%,var(--color-muted-foreground))] bg-[length:200%_100%] bg-clip-text text-transparent text-base font-medium"
            initial={{ backgroundPosition: "200% 0" }}
            animate={{
              backgroundPosition:
                finalLoadingState === "completed" ? "0% 0" : "-200% 0",
            }}
            transition={{
              repeat: finalLoadingState === "completed" ? 0 : Infinity,
              duration: 3,
              ease: "linear",
            }}
          >
            {finalLoadingState === "starting" && "Getting started."}
            {finalLoadingState === "generating" && "Creating image. May take a moment."}
            {finalLoadingState === "completed" && "Image created."}
          </motion.span>
        )}
        <div className="relative rounded-xl border border-neutral-200 bg-white max-w-md overflow-hidden">
            {children}
          <motion.div
            className="absolute w-full h-[125%] -top-[25%] pointer-events-none backdrop-blur-3xl"
            initial={false}
            animate={{
              clipPath: `polygon(0 ${externalProgress !== undefined && finalLoadingState === "completed" ? animatedProgress : finalProgress}%, 100% ${externalProgress !== undefined && finalLoadingState === "completed" ? animatedProgress : finalProgress}%, 100% 100%, 0 100%)`,
              opacity: finalLoadingState === "completed" && (externalProgress !== undefined ? animatedProgress >= 100 : true) ? 0 : 1,
            }}
            transition={{
              duration: externalProgress !== undefined && finalLoadingState === "completed" ? 0.1 : 0.3,
              ease: "easeOut",
            }}
            style={{
              clipPath: `polygon(0 ${externalProgress !== undefined && finalLoadingState === "completed" ? animatedProgress : finalProgress}%, 100% ${externalProgress !== undefined && finalLoadingState === "completed" ? animatedProgress : finalProgress}%, 100% 100%, 0 100%)`,
              maskImage:
                (externalProgress !== undefined && finalLoadingState === "completed" ? animatedProgress : finalProgress) === 0
                  ? "linear-gradient(to bottom, black -5%, black 100%)"
                  : `linear-gradient(to bottom, transparent ${(externalProgress !== undefined && finalLoadingState === "completed" ? animatedProgress : finalProgress) - 5}%, transparent ${externalProgress !== undefined && finalLoadingState === "completed" ? animatedProgress : finalProgress}%, black ${(externalProgress !== undefined && finalLoadingState === "completed" ? animatedProgress : finalProgress) + 5}%)`,
              WebkitMaskImage:
                (externalProgress !== undefined && finalLoadingState === "completed" ? animatedProgress : finalProgress) === 0
                  ? "linear-gradient(to bottom, black -5%, black 100%)"
                  : `linear-gradient(to bottom, transparent ${(externalProgress !== undefined && finalLoadingState === "completed" ? animatedProgress : finalProgress) - 5}%, transparent ${externalProgress !== undefined && finalLoadingState === "completed" ? animatedProgress : finalProgress}%, black ${(externalProgress !== undefined && finalLoadingState === "completed" ? animatedProgress : finalProgress) + 5}%)`,
            }}
          />
        </div>
      </div>
    );
  }
);

ImageGeneration.displayName = "ImageGeneration";

