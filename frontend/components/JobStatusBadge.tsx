"use client";

import { JobStatus } from "../lib/api";

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const config: Record<JobStatus, { bg: string; text: string; dot: string }> = {
    pending: {
      bg: "bg-yellow-50 border-yellow-200",
      text: "text-yellow-700",
      dot: "bg-yellow-500",
    },
    processing: {
      bg: "bg-blue-50 border-blue-200",
      text: "text-blue-700",
      dot: "bg-blue-500 animate-pulse",
    },
    failed: {
      bg: "bg-red-50 border-red-200",
      text: "text-red-700",
      dot: "bg-red-500",
    },
    completed: {
      bg: "bg-green-50 border-green-200",
      text: "text-green-700",
      dot: "bg-green-500",
    },
    cancelled: {
      bg: "bg-gray-100 border-gray-300",
      text: "text-gray-600",
      dot: "bg-gray-400",
    },
  };

  const labels: Record<JobStatus, string> = {
    pending: "Pending",
    processing: "Processing",
    failed: "Failed",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  const { bg, text, dot } = config[status];

  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium border ${bg} ${text}`}>
      <span className={`w-2 h-2 rounded-full ${dot}`}></span>
      {labels[status]}
    </span>
  );
}
