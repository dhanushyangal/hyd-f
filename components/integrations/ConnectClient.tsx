"use client";

import { SignInButton, SignedIn, SignedOut, useAuth, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BRIDGE_DEFAULT_URL } from "@/lib/integrations";

type BridgeState = "checking" | "offline" | "online" | "pushed" | "error";

const APP_LABELS: Record<string, string> = {
  blender: "Blender",
  maya: "Maya",
  unity: "Unity",
  unreal: "Unreal",
  godot: "Godot",
  "3dsmax": "3ds Max",
  plugin: "your plugin",
};

/** Clerk session JWTs are short (~60s). Refresh often + on tab focus. */
const REFRESH_MS = 10_000;

export function ConnectClient() {
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  const params = useSearchParams();
  const app = (params.get("app") || "plugin").toLowerCase();
  const appLabel = APP_LABELS[app] || "your plugin";
  const returnPath = `/integrations/connect?app=${encodeURIComponent(app)}`;
  const pushInFlight = useRef(false);

  const [bridgeState, setBridgeState] = useState<BridgeState>("checking");
  const [message, setMessage] = useState("Checking local Bridge…");
  const [lastPush, setLastPush] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tokenLeft, setTokenLeft] = useState<number | null>(null);

  const email = useMemo(() => {
    return user?.primaryEmailAddress?.emailAddress || user?.username || null;
  }, [user]);

  const readTokenExpiry = useCallback((token: string) => {
    try {
      const parts = token.split(".");
      if (parts.length < 2) {
        return null;
      }
      const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const pad = payload + "=".repeat((4 - (payload.length % 4)) % 4);
      const data = JSON.parse(atob(pad)) as { exp?: number };
      if (typeof data.exp !== "number") {
        return null;
      }
      return Math.max(0, Math.floor(data.exp - Date.now() / 1000));
    } catch {
      return null;
    }
  }, []);

  const pushSession = useCallback(async () => {
    if (pushInFlight.current) {
      return;
    }
    pushInFlight.current = true;
    setBusy(true);
    try {
      const health = await fetch(`${BRIDGE_DEFAULT_URL}/health`, {
        cache: "no-store",
      });
      if (!health.ok) {
        throw new Error("Bridge health failed");
      }
      setBridgeState("online");

      // Force a fresh JWT — cached tokens can already be near expiry
      const token = await getToken({ skipCache: true });
      if (!token) {
        setBridgeState("error");
        setMessage("Could not read your Hydrilla session. Try signing out and back in.");
        setTokenLeft(null);
        return;
      }

      const left = readTokenExpiry(token);
      setTokenLeft(left);

      const response = await fetch(`${BRIDGE_DEFAULT_URL}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          token,
          email,
          user_id: user?.id,
          expires_at: left != null ? Date.now() / 1000 + left : undefined,
        }),
      });
      if (!response.ok) {
        throw new Error(`Bridge auth failed (${response.status})`);
      }
      setBridgeState("pushed");
      setLastPush(new Date().toLocaleTimeString());
      setMessage(
        `Connected to ${appLabel}. Keep this tab open and in the foreground while generating — tokens refresh every ${REFRESH_MS / 1000}s.`
      );
    } catch {
      setBridgeState("offline");
      setTokenLeft(null);
      setMessage(
        `Bridge offline. In ${appLabel}, click Run Bridge, then Retry here.`
      );
    } finally {
      setBusy(false);
      pushInFlight.current = false;
    }
  }, [appLabel, email, getToken, readTokenExpiry, user?.id]);

  useEffect(() => {
    if (!isSignedIn) {
      setBridgeState("checking");
      setMessage("Sign in to connect your account to the local Bridge.");
      setTokenLeft(null);
      return;
    }

    void pushSession();
    const timer = window.setInterval(() => {
      void pushSession();
    }, REFRESH_MS);

    const onVisible = () => {
      if (document.visibilityState === "visible") {
        void pushSession();
      }
    };
    const onFocus = () => {
      void pushSession();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", onFocus);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", onFocus);
    };
  }, [isSignedIn, pushSession]);

  return (
    <main className="min-h-[70vh] bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#f1f5f9_100%)] px-5 pb-16 pt-28 sm:px-6">
      <div className="mx-auto max-w-lg rounded-3xl border border-neutral-200/80 bg-white p-8 shadow-[0_30px_80px_-48px_rgba(0,0,0,0.45)]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-neutral-500">
          DCC connect
        </p>
        <h1
          className="mt-3 text-[28px] font-semibold tracking-[-0.04em] text-neutral-950"
          style={{
            fontFamily:
              "'RoobertVF', 'Roobert', var(--font-dm-sans), 'DM Sans', sans-serif",
          }}
        >
          Sign in for {appLabel}
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-neutral-600">
          Use your Hydrilla account. Leave this tab open (and visible) while you generate so
          your session stays fresh in the local Bridge.
        </p>

        <SignedOut>
          <div className="mt-8 space-y-3">
            <SignInButton mode="modal" forceRedirectUrl={returnPath} fallbackRedirectUrl={returnPath}>
              <button
                type="button"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[#111] px-5 py-3 text-[15px] font-semibold text-white hover:bg-neutral-800"
              >
                Sign in with Hydrilla
              </button>
            </SignInButton>
            <Link
              href={`/sign-in?redirect_url=${encodeURIComponent(returnPath)}`}
              className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-300 px-5 py-3 text-[15px] font-semibold text-neutral-950 hover:bg-neutral-50"
            >
              Sign in on full page
            </Link>
            <p className="pt-1 text-center text-[13px] text-neutral-500">
              Prefer keys?{" "}
              <Link href="/app/api-keys" className="font-semibold text-neutral-900 underline">
                Create an API key
              </Link>
            </p>
          </div>
        </SignedOut>

        <SignedIn>
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl bg-neutral-50 px-4 py-3 text-[14px] text-neutral-700">
              <p className="font-semibold text-neutral-950">{email || "Signed in"}</p>
              <p className="mt-1">{message}</p>
              {lastPush ? (
                <p className="mt-2 text-[12px] text-neutral-500">
                  Last sync {lastPush}
                  {tokenLeft != null ? ` · token ~${tokenLeft}s left` : ""}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span
                className={
                  bridgeState === "pushed" || bridgeState === "online"
                    ? "text-[13px] font-medium text-emerald-700"
                    : bridgeState === "offline" || bridgeState === "error"
                      ? "text-[13px] font-medium text-red-600"
                      : "text-[13px] font-medium text-neutral-500"
                }
              >
                {bridgeState === "pushed"
                  ? "Connected to Bridge"
                  : bridgeState === "online"
                    ? "Bridge online"
                    : bridgeState === "offline"
                      ? "Bridge offline"
                      : bridgeState === "error"
                        ? "Session error"
                        : "Checking…"}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => void pushSession()}
                className="rounded-lg border border-neutral-300 px-3 py-1.5 text-[12px] font-semibold text-neutral-900 hover:bg-neutral-50 disabled:opacity-50"
              >
                {busy ? "Connecting…" : "Retry"}
              </button>
            </div>

            {bridgeState === "offline" ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-5 text-amber-950">
                Open {appLabel} → Hydrilla panel → click{" "}
                <span className="font-semibold">Run Bridge</span>, then Retry.
              </div>
            ) : null}

            <ol className="list-decimal space-y-2 pl-5 text-[14px] leading-6 text-neutral-700">
              <li>
                In {appLabel}, click <span className="font-semibold">Run Bridge</span>.
              </li>
              <li>
                Keep this tab open and visible (auto-refresh every {REFRESH_MS / 1000}s). Switching
                away for a long time can expire the session.
              </li>
              <li>
                In {appLabel}, click <span className="font-semibold">Sync</span>, then open{" "}
                <span className="font-semibold">Your jobs</span> to see pending/running work.
              </li>
              <li>
                For long sessions, use an{" "}
                <Link href="/app/api-keys" className="font-semibold underline">
                  API key
                </Link>
                .
              </li>
            </ol>

            <Link
              href="/integrations"
              className="inline-flex text-[13px] font-semibold text-neutral-900 underline"
            >
              Back to integrations
            </Link>
          </div>
        </SignedIn>
      </div>
    </main>
  );
}
