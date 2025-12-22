"use client";

import { useEffect, useState } from "react";
import { fetchHistory, BackendJob, JobStatus } from "../../lib/api";
import { JobStatusBadge } from "../../components/JobStatusBadge";

// Convert backend status to frontend status
function convertBackendStatus(status: BackendJob["status"]): JobStatus {
  switch (status) {
    case "WAIT":
      return "pending";
    case "RUN":
      return "processing";
    case "DONE":
      return "completed";
    case "FAIL":
      return "failed";
    default:
      return "pending";
  }
}

export default function LibraryPage() {
  const [jobs, setJobs] = useState<BackendJob[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory()
      .then(setJobs)
      .catch((err) => setError(err.message || "Failed to load history"));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Library</h1>
        <p className="text-sm text-slate-600">Your recent generation jobs.</p>
      </div>

      {error && <div className="rounded bg-red-100 px-3 py-2 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-lg border bg-white shadow-sm">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Job</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {jobs.map((job) => (
              <tr key={job.id}>
                <td className="px-4 py-3">
                  <div className="font-medium text-slate-900">{job.id}</div>
                  {job.prompt && <div className="text-xs text-slate-600">{job.prompt.slice(0, 80)}</div>}
                </td>
                <td className="px-4 py-3">{job.generateType}</td>
                <td className="px-4 py-3">
                  <JobStatusBadge status={convertBackendStatus(job.status)} />
                </td>
                <td className="px-4 py-3">{new Date(job.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <a className="text-blue-600 underline" href={`/viewer?jobId=${job.id}`}>
                    Open
                  </a>
                  {job.resultGlbUrl && (
                    <a className="ml-3 text-emerald-600 underline" href={job.resultGlbUrl} download>
                      Download
                    </a>
                  )}
                </td>
              </tr>
            ))}
            {!jobs.length && (
              <tr>
                <td className="px-4 py-6 text-sm text-slate-500" colSpan={5}>
                  No jobs yet. Submit a generation to see history.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

