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
    <article className="pickle-article">
      <header className="pickle-article-header">
        <p className="pickle-article-kicker">
          <Link href="/integrations">Integrations</Link>
        </p>
        <h1 className="pickle-article-title">Sign in for {appLabel}</h1>
        <p className="pickle-article-subtitle">
          Use your Hydrilla account. Leave this tab open while you generate so your session stays fresh in the local Bridge.
        </p>
        <div className="pickle-article-meta">
          <span>Local Bridge</span>
          <span className="pickle-meta-divider" aria-hidden="true" />
          <span>127.0.0.1:7345</span>
        </div>
      </header>

      <div className="pickle-article-column">
        <div
          className="pickle-card-surface"
          style={{ width: "min(600px, 100%)", padding: "36px 40px", borderRadius: "32px" }}
        >
          <SignedOut>
            <div className="space-y-4">
              <p className="pickle-text" style={{ width: "100%" }}>
                Authenticate with your Studio account to push short-lived session tokens directly to {appLabel}.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <SignInButton mode="modal" forceRedirectUrl={returnPath} fallbackRedirectUrl={returnPath}>
                  <button type="button" className="pickle-pill-solid">
                    Sign in with Hydrilla
                  </button>
                </SignInButton>
                <Link
                  href={`/sign-in?redirect_url=${encodeURIComponent(returnPath)}`}
                  className="pickle-glass-pill"
                  style={{ height: "48px", fontSize: "16px", padding: "0 22px" }}
                >
                  Sign in on full page
                </Link>
              </div>
              <p className="pickle-license" style={{ paddingTop: "8px" }}>
                Prefer static API keys?{" "}
                <Link href="/app/api-keys">Create an API key</Link>.
              </p>
            </div>
          </SignedOut>

          <SignedIn>
            <div className="space-y-6">
              <div className="rounded-2xl bg-white p-5 border border-black/5">
                <p className="text-[16px] font-semibold text-black">{email || "Signed in"}</p>
                <p className="mt-1.5 text-[15px] leading-relaxed text-black/70">{message}</p>
                {lastPush ? (
                  <p className="mt-2 text-[13px] text-black/45">
                    Last sync {lastPush}
                    {tokenLeft != null ? ` · token ~${tokenLeft}s left` : ""}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <span
                  className={
                    bridgeState === "pushed" || bridgeState === "online"
                      ? "text-[15px] font-medium text-emerald-700"
                      : bridgeState === "offline" || bridgeState === "error"
                        ? "text-[15px] font-medium text-red-600"
                        : "text-[15px] font-medium text-black/50"
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
                  className="pickle-pill-solid"
                  style={{ height: "40px", fontSize: "15px", padding: "0 18px" }}
                >
                  {busy ? "Connecting…" : "Retry"}
                </button>
              </div>

              {bridgeState === "offline" ? (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5 text-[14px] leading-6 text-amber-950">
                  Open {appLabel} → Hydrilla panel → click{" "}
                  <strong>Run Bridge</strong>, then Retry.
                </div>
              ) : null}

              <div className="pickle-text" style={{ width: "100%" }}>
                <ol>
                  <li>
                    In {appLabel}, click <strong>Run Bridge</strong>.
                  </li>
                  <li>
                    Keep this tab open and visible (auto-refresh every {REFRESH_MS / 1000}s).
                  </li>
                  <li>
                    In {appLabel}, click <strong>Sync</strong>, then open{" "}
                    <strong>Your jobs</strong> to see pending or completed work.
                  </li>
                  <li>
                    For headless or long sessions, use an{" "}
                    <Link href="/app/api-keys">API key</Link>.
                  </li>
                </ol>
              </div>

              <div>
                <Link href="/integrations" className="pickle-text" style={{ fontSize: "15px" }}>
                  ← Back to integrations
                </Link>
              </div>
            </div>
          </SignedIn>
        </div>
      </div>
    </article>
  );
}
