"use client";

import { JobStatus } from "../lib/api";

export function JobStatusBadge({ status }: { status: JobStatus }) {
  const colors: Record<JobStatus, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    failed: "bg-red-100 text-red-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-slate-100 text-slate-800",
  };

  const labels: Record<JobStatus, string> = {
    pending: "Pending",
    processing: "Processing",
    failed: "Failed",
    completed: "Completed",
    cancelled: "Cancelled",
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${colors[status]}`}>{labels[status]}</span>;
}
