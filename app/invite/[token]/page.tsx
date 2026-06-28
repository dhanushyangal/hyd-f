"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { redeemInvite, validateInvite } from "../../../lib/api";

const adminEmail =
  process.env.NEXT_PUBLIC_ADMIN_CONTACT_EMAIL || "admin@hydrilla.co";

type PageState = "loading" | "invalid" | "form" | "success";

export default function InviteRedeemPage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";

  const [pageState, setPageState] = useState<PageState>("loading");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [approvedEmail, setApprovedEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setPageState("invalid");
      return;
    }

    validateInvite(token).then((result) => {
      if (result.valid) {
        setPageState("form");
      } else {
        setPageState("invalid");
      }
    });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const result = await redeemInvite(token, email);
    setSubmitting(false);

    if (result.success) {
      setApprovedEmail(result.email || email);
      setPageState("success");
    } else {
      setError(result.error || "Failed to redeem invite");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16 bg-neutral-50">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          {pageState === "loading" && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
            </div>
          )}

          {pageState === "invalid" && (
            <>
              <h1 className="text-2xl font-semibold text-gray-900 mb-3 text-center">
                Invalid or expired link
              </h1>
              <p className="text-gray-600 text-center mb-4">
                This invite link is invalid, has already been used, or has expired.
              </p>
              <p className="text-gray-600 text-center text-sm">
                Contact the admin at{" "}
                <a
                  href={`mailto:${adminEmail}`}
                  className="text-black font-medium underline"
                >
                  {adminEmail}
                </a>
              </p>
            </>
          )}

          {pageState === "form" && (
            <>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2 text-center">
                Activate your access
              </h1>
              <p className="text-gray-600 text-center mb-6 text-sm">
                Enter your email to unlock access to Hydrilla.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-black text-white py-2.5 px-4 text-sm font-medium hover:bg-gray-900 transition-colors disabled:opacity-50"
                >
                  {submitting ? "Activating..." : "Activate access"}
                </button>
              </form>
            </>
          )}

          {pageState === "success" && (
            <>
              <h1 className="text-2xl font-semibold text-gray-900 mb-3 text-center">
                Access granted
              </h1>
              <p className="text-gray-600 text-center mb-6">
                You can now sign in with{" "}
                <span className="font-medium text-black">{approvedEmail}</span>.
              </p>
              <Link
                href="/sign-in"
                className="block w-full text-center rounded-lg bg-black text-white py-2.5 px-4 text-sm font-medium hover:bg-gray-900 transition-colors"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
