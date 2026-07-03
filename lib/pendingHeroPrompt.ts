/**
 * Pending intent from the landing-page hero prompt box.
 *
 * Flow: Hero saves prompt → login → /app/studio creates workspace →
 * /workspace/:id applies prefill (ready to Generate).
 */

export const PENDING_HERO_PROMPT_KEY = "hydrilla_pending_hero_prompt";
export const WORKSPACE_PREFILL_KEY = "hydrilla_workspace_prefill";
export const WORKSPACE_BOOTSTRAP_KEY = "hydrilla_workspace_bootstrap";

const STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "and",
  "or",
  "of",
  "to",
  "for",
  "with",
  "in",
  "on",
  "at",
  "from",
  "by",
  "my",
  "your",
  "our",
  "me",
  "make",
  "create",
  "generate",
  "build",
  "design",
  "please",
  "want",
  "need",
  "like",
  "some",
  "this",
  "that",
  "it",
]);

function canUseStorage(): boolean {
  return typeof window !== "undefined";
}

export function savePendingHeroPrompt(prompt: string): void {
  if (!canUseStorage()) return;
  const value = prompt.trim().slice(0, 800);
  if (!value) return;
  try {
    localStorage.setItem(PENDING_HERO_PROMPT_KEY, value);
    sessionStorage.setItem("hero_prompt", value);
  } catch {
    /* private mode / quota */
  }
}

export function peekPendingHeroPrompt(): string | null {
  if (!canUseStorage()) return null;
  try {
    const fromLocal = localStorage.getItem(PENDING_HERO_PROMPT_KEY);
    if (fromLocal?.trim()) return fromLocal.trim().slice(0, 800);
    const fromSession = sessionStorage.getItem("hero_prompt");
    if (fromSession?.trim()) return fromSession.trim().slice(0, 800);
  } catch {
    /* ignore */
  }
  return null;
}

/** Read and clear the pending prompt (one-shot). */
export function consumePendingHeroPrompt(): string | null {
  const value = peekPendingHeroPrompt();
  if (!canUseStorage()) return value;
  try {
    localStorage.removeItem(PENDING_HERO_PROMPT_KEY);
    sessionStorage.removeItem("hero_prompt");
  } catch {
    /* ignore */
  }
  return value;
}

/** Prompt to inject into the workspace textarea after studio creates the project. */
export function saveWorkspacePrefill(prompt: string): void {
  if (!canUseStorage()) return;
  const value = prompt.trim().slice(0, 800);
  if (!value) return;
  try {
    sessionStorage.setItem(WORKSPACE_PREFILL_KEY, value);
  } catch {
    /* ignore */
  }
}

export function consumeWorkspacePrefill(): string | null {
  if (!canUseStorage()) return null;
  try {
    const value = sessionStorage.getItem(WORKSPACE_PREFILL_KEY);
    sessionStorage.removeItem(WORKSPACE_PREFILL_KEY);
    return value?.trim() ? value.trim().slice(0, 800) : null;
  } catch {
    return null;
  }
}

export type WorkspaceBootstrapMeta = {
  workspaceId: string;
  workspaceName: string;
};

/** Lets /workspace open instantly without waiting on a second fetch. */
export function saveWorkspaceBootstrap(meta: WorkspaceBootstrapMeta): void {
  if (!canUseStorage()) return;
  try {
    sessionStorage.setItem(WORKSPACE_BOOTSTRAP_KEY, JSON.stringify(meta));
  } catch {
    /* ignore */
  }
}

export function consumeWorkspaceBootstrap(
  workspaceId?: string | null
): WorkspaceBootstrapMeta | null {
  if (!canUseStorage()) return null;
  try {
    const raw = sessionStorage.getItem(WORKSPACE_BOOTSTRAP_KEY);
    if (!raw) return null;
    const meta = JSON.parse(raw) as WorkspaceBootstrapMeta;
    if (!meta?.workspaceId) return null;
    if (workspaceId && meta.workspaceId !== workspaceId) return null;
    sessionStorage.removeItem(WORKSPACE_BOOTSTRAP_KEY);
    return meta;
  } catch {
    return null;
  }
}

/**
 * One-word workspace name from the prompt (first meaningful word).
 * e.g. "Make a sword with fire" → "Sword"
 */
export function workspaceNameFromPrompt(prompt: string): string {
  const words = prompt
    .trim()
    .split(/[\s,./\\|_-]+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ""))
    .filter(Boolean);

  const chosen =
    words.find((w) => !STOP_WORDS.has(w.toLowerCase())) ?? words[0] ?? "Project";

  const capped = chosen.slice(0, 24);
  return capped.charAt(0).toUpperCase() + capped.slice(1).toLowerCase();
}

export type HeroBootstrapResult = {
  workspaceId: string;
  workspaceName: string;
  prompt: string;
};

/** Shared across React Strict Mode double-mounts so we only create one workspace. */
let heroBootstrapInFlight: Promise<HeroBootstrapResult | null> | null = null;

/**
 * Create a workspace from the pending hero prompt (at most once per page load).
 * Call from /app/studio after login. Sets workspace prefill for the workspace page.
 */
export async function bootstrapHeroWorkspace(
  createWorkspace: (name: string) => Promise<{ id: string; name?: string | null }>
): Promise<HeroBootstrapResult | null> {
  if (heroBootstrapInFlight) return heroBootstrapInFlight;

  const pending = peekPendingHeroPrompt();
  if (!pending) return null;

  heroBootstrapInFlight = (async () => {
    const name = workspaceNameFromPrompt(pending);
    const ws = await createWorkspace(name);
    const workspaceName = ws.name?.trim() || name;
    consumePendingHeroPrompt();
    saveWorkspacePrefill(pending);
    saveWorkspaceBootstrap({ workspaceId: ws.id, workspaceName });
    return {
      workspaceId: ws.id,
      workspaceName,
      prompt: pending.slice(0, 800),
    };
  })();

  try {
    return await heroBootstrapInFlight;
  } catch (err) {
    heroBootstrapInFlight = null;
    throw err;
  }
}
