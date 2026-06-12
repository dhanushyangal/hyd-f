"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  AdminInvite,
  createInvite,
  listInvites,
} from "../../../lib/api";

const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdminUser(user: ReturnType<typeof useUser>["user"]): boolean {
  if (!user) return false;
  if (user.publicMetadata?.role === "admin") return true;
  const email = user.primaryEmailAddress?.emailAddress?.toLowerCase();
  return !!email && adminEmails.includes(email);
}

export default function AdminInvitesPage() {
  const { isSignedIn, getToken } = useAuth();
  const { user, isLoaded } = useUser();
  const router = useRouter();

  const [invites, setInvites] = useState<AdminInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadInvites = useCallback(async () => {
    const tokenGetter = async () => await getToken();
    const result = await listInvites(tokenGetter);
    setInvites(result.invites);
    if (result.error) {
      setError(result.error);
    }
    setLoading(false);
  }, [getToken]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !isAdminUser(user)) {
      router.replace("/");
      return;
    }

    loadInvites();
  }, [isLoaded, isSignedIn, user, router, loadInvites]);

  const handleCreate = async () => {
    setCreating(true);
    setError(null);
    const tokenGetter = async () => await getToken();
    const result = await createInvite(tokenGetter);
    setCreating(false);

    if (!result || "error" in result) {
      setError(result && "error" in result ? result.error : "Failed to create invite.");
      return;
    }

    await loadInvites();
  };

  const copyLink = async (invite: AdminInvite) => {
    try {
      await navigator.clipboard.writeText(invite.inviteUrl);
      setCopiedId(invite.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setError("Failed to copy link");
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Invite links</h1>
            <p className="text-gray-600 text-sm mt-1">
              Create single-use links for new users.
            </p>
          </div>
          <button
            onClick={handleCreate}
            disabled={creating}
            className="rounded-lg bg-black text-white py-2.5 px-4 text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
          >
            {creating ? "Creating..." : "Create invite link"}
          </button>
        </div>

        {error && (
          <p className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            {error}
          </p>
        )}

        <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Created</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Expires</th>
                <th className="text-left px-4 py-3 font-medium text-gray-700">Used by</th>
                <th className="text-right px-4 py-3 font-medium text-gray-700">Link</th>
              </tr>
            </thead>
            <tbody>
              {invites.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No invites yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                invites.map((invite) => (
                  <tr key={invite.id} className="border-t border-gray-100">
                    <td className="px-4 py-3">
                      <StatusBadge status={invite.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(invite.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDate(invite.expiresAt)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {invite.usedByEmail || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => copyLink(invite)}
                        disabled={invite.status !== "active"}
                        className="text-sm text-black underline hover:text-gray-700 disabled:text-gray-400 disabled:no-underline"
                      >
                        {copiedId === invite.id ? "Copied!" : "Copy link"}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: AdminInvite["status"] }) {
  const styles = {
    active: "bg-green-100 text-green-800",
    used: "bg-gray-100 text-gray-700",
    expired: "bg-amber-100 text-amber-800",
  };

  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${styles[status]}`}>
      {status}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
