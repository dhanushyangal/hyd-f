/**
 * Hydrilla Run API client.
 *
 * This module is the ONLY network egress in the agent package. Every tool under
 * `create-cloud/tools/` and `create-water/tools/` is a thin typed RPC that funnels
 * through `callRunApi`.
 *
 * Laws (docs/contracts/TOOL_SURFACE.md, agent-skills/.../KILL_LIST.md):
 *   - Exactly 12 tool ids. `assertToolId` throws on a 13th.
 *   - Tools never implement geometry, scoring, bake, or provider calls in-process.
 *     The backend owns the hands; the agent owns the brain.
 *   - No provider SDK, no customer BYOK key, and no AI Gateway call ever happens here.
 *     Customer keys live in the Hydrilla backend and never leave it.
 *
 * Transport: POST {HYDRILLA_RUN_API}/api/create/tools/<toolId>
 *            Authorization: Bearer {HYDRILLA_RUN_API_TOKEN}
 */

/** The frozen tool surface. No 13th id — new capability folds in behind one of these. */
export const TOOL_IDS = [
  "prompt.compile",
  "run.estimate",
  "run.route",
  "image.rembg",
  "job.submit",
  "job.await",
  "mesh.post.gate",
  "mesh.bake",
  "asset.render_views",
  "asset.score",
  "run.checkpoint",
  "experiment.fanout",
] as const;

export type ToolId = (typeof TOOL_IDS)[number];

const TOOL_ID_SET: ReadonlySet<string> = new Set<string>(TOOL_IDS);

export function isToolId(value: string): value is ToolId {
  return TOOL_ID_SET.has(value);
}

/** Call at module scope in every tool file so a typo fails fast, not at runtime. */
export function assertToolId(value: string): ToolId {
  if (!isToolId(value)) {
    throw new Error(
      `Unknown Create tool id "${value}". The surface is frozen at ${TOOL_IDS.length} ids; ` +
        `fold new capability behind an existing tool instead of adding one.`
    );
  }
  return value;
}

const DEFAULT_BASE_URL = "https://api.hydrilla.co";
const DEFAULT_TIMEOUT_MS = 60_000;

export function runApiBaseUrl(): string {
  const raw = process.env.HYDRILLA_RUN_API?.trim();
  return (raw && raw.length > 0 ? raw : DEFAULT_BASE_URL).replace(/\/+$/, "");
}

function runApiToken(): string {
  const token = process.env.HYDRILLA_RUN_API_TOKEN?.trim();
  if (!token) {
    throw new Error(
      "HYDRILLA_RUN_API_TOKEN is not set. The agent cannot reach the Hydrilla Run API " +
        "and must not attempt any provider call of its own."
    );
  }
  return token;
}

export class RunApiError extends Error {
  readonly toolId: string;
  readonly status: number;
  readonly body: string;

  constructor(toolId: string, status: number, body: string) {
    super(`Run API ${toolId} failed with ${status}: ${body.slice(0, 500)}`);
    this.name = "RunApiError";
    this.toolId = toolId;
    this.status = status;
    this.body = body;
  }
}

export type RunApiOptions = {
  /** Wall-clock budget for a single request. Long provider waits belong to `job.await`. */
  timeoutMs?: number;
  /** Caller-supplied cancellation, merged with the timeout. */
  signal?: AbortSignal;
  /**
   * Replay key. `run.checkpoint` is idempotent per (jobId, runId, stageId, attempt);
   * pass that tuple here so a durable retry does not double-write stage truth.
   */
  idempotencyKey?: string;
};

/**
 * POST a JSON body to one Create tool and return its parsed JSON result.
 *
 * Throws `RunApiError` on a non-2xx response so a failing stage surfaces as a failure
 * on the JobCard rather than a silent pass.
 */
export async function callRunApi<TResult = unknown>(
  toolId: ToolId,
  body: Record<string, unknown>,
  options: RunApiOptions = {}
): Promise<TResult> {
  const id = assertToolId(toolId);
  const url = `${runApiBaseUrl()}/api/create/tools/${id}`;

  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const onExternalAbort = () => controller.abort();
  if (options.signal) {
    if (options.signal.aborted) controller.abort();
    else options.signal.addEventListener("abort", onExternalAbort, { once: true });
  }

  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
    authorization: `Bearer ${runApiToken()}`,
    "x-hydrilla-tool-id": id,
  };
  if (options.idempotencyKey) headers["idempotency-key"] = options.idempotencyKey;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await res.text();
    if (!res.ok) throw new RunApiError(id, res.status, text);

    if (text.length === 0) return undefined as TResult;
    try {
      return JSON.parse(text) as TResult;
    } catch {
      throw new RunApiError(id, res.status, `non-JSON response: ${text}`);
    }
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener("abort", onExternalAbort);
  }
}
