"use client";

import { useEffect, useState } from "react";
import { Job } from "../lib/api";

interface LoadingProgressProps {
  job: Job;
  mode: "text-to-3d" | "image-to-3d";
}

// Estimated times in seconds
const ESTIMATED_TIMES = {
  "text-to-3d": 180, // 3 minutes
  "image-to-3d": 150, // 2.5 minutes
};

// Step messages based on progress
const STEP_MESSAGES = {
  "text-to-3d": [
    { progress: 0, message: "Initializing job..." },
    { progress: 10, message: "Generating image from text prompt..." },
    { progress: 30, message: "Optimizing generated image..." },
    { progress: 40, message: "Removing background..." },
    { progress: 50, message: "Generating 3D mesh..." },
    { progress: 90, message: "Finalizing 3D model..." },
    { progress: 95, message: "Uploading to cloud storage..." },
  ],
  "image-to-3d": [
    { progress: 0, message: "Initializing job..." },
    { progress: 10, message: "Downloading and optimizing image..." },
    { progress: 30, message: "Removing background..." },
    { progress: 50, message: "Generating 3D mesh..." },
    { progress: 90, message: "Finalizing 3D model..." },
    { progress: 95, message: "Uploading to cloud storage..." },
  ],
};

export function LoadingProgress({ job, mode }: LoadingProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);

  // Calculate elapsed time
  useEffect(() => {
    if (!job.created_at) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() / 1000) - job.created_at!);
      setElapsedTime(elapsed);

      // Calculate estimated time remaining based on progress
      if (job.progress > 0) {
        const totalEstimated = ESTIMATED_TIMES[mode];
        const progressRatio = job.progress / 100;
        const estimatedElapsed = totalEstimated * progressRatio;
        const remaining = Math.max(0, totalEstimated - estimatedElapsed);
        setEstimatedTimeRemaining(Math.ceil(remaining));
      } else {
        setEstimatedTimeRemaining(ESTIMATED_TIMES[mode]);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [job.created_at, job.progress, mode]);

  // Get current step message
  const getCurrentStep = () => {
    const steps = STEP_MESSAGES[mode];
    for (let i = steps.length - 1; i >= 0; i--) {
      if (job.progress >= steps[i].progress) {
        return steps[i].message;
      }
    }
    return steps[0].message;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const currentStep = getCurrentStep();
  const progress = job.progress || 0;

  return (
    <div className="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 shadow-lg">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-slate-800">Generating 3D Model</h3>
          <div className="text-sm font-medium text-blue-600">{progress}%</div>
        </div>
        <p className="text-sm text-slate-600">{currentStep}</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden shadow-inner">
          <div
            className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 h-3 rounded-full transition-all duration-500 ease-out relative overflow-hidden"
            style={{ width: `${progress}%` }}
          >
            {/* Animated shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
          </div>
        </div>
      </div>

      {/* Time Information */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="bg-white/50 rounded-lg p-3 border border-blue-100">
          <div className="text-xs text-slate-500 mb-1">Elapsed Time</div>
          <div className="text-lg font-semibold text-slate-800">{formatTime(elapsedTime)}</div>
        </div>
        <div className="bg-white/50 rounded-lg p-3 border border-blue-100">
          <div className="text-xs text-slate-500 mb-1">Estimated Remaining</div>
          <div className="text-lg font-semibold text-blue-600">
            {estimatedTimeRemaining !== null ? formatTime(estimatedTimeRemaining) : "Calculating..."}
          </div>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="mt-4 pt-4 border-t border-blue-200">
        <div className="text-xs font-medium text-slate-600 mb-2">Progress Steps:</div>
        <div className="space-y-1">
          {STEP_MESSAGES[mode].map((step, index) => {
            const isActive = progress >= step.progress;
            const isCurrent = progress >= step.progress && (index === STEP_MESSAGES[mode].length - 1 || progress < STEP_MESSAGES[mode][index + 1].progress);
            
            return (
              <div
                key={index}
                className={`flex items-center gap-2 text-xs transition-colors ${
                  isActive ? "text-blue-700" : "text-slate-400"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full transition-all ${
                    isActive
                      ? "bg-blue-600 ring-2 ring-blue-300 ring-offset-1"
                      : "bg-slate-300"
                  } ${isCurrent ? "animate-pulse" : ""}`}
                />
                <span className={isCurrent ? "font-semibold" : ""}>{step.message}</span>
                {isActive && !isCurrent && (
                  <span className="text-green-600 ml-auto">✓</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Background Processing Indicator */}
      <div className="mt-4 pt-4 border-t border-blue-200">
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <span>Processing in background - you can close this page</span>
        </div>
      </div>
    </div>
  );
}






