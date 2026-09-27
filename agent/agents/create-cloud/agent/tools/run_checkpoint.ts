import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("run.checkpoint");

/** The nine Cloud JobCard stages, in order. Water stages are not addressable here. */
const CLOUD_STAGE_ID = z.enum([
  "cloud-compile-prompt",
  "cloud-route-estimate",
  "cloud-t2i",
  "cloud-preprocess-ref",
  "cloud-run-pixal",
  "cloud-mesh-post",
  "cloud-bake",
  "cloud-evaluate",
  "cloud-refine-loop",
]);

/** Deterministic fail codes. Gates emit these; never free-text "looks wrong". */
const FAIL_CODE = z.enum([
  // geometry — HARD, never rescued by an aesthetic score
  "EMPTY_GLB",
  "NO_NORMALS",
  "NON_MANIFOLD",
  "SELF_INTERSECT",
  "NAN_BOUNDS",
  "NOT_GROUNDED",
  "TRI_BUDGET",
  "FLOATER",
  "THIN_SHELL",
  "ORBIT_COLLAPSE",
  // materials / export
  "NO_UV",
  "MISSING_MAP",
  "SCALE",
  "GLTF_INVALID",
  // intake
  "CROP",
  "BAD_SILHOUETTE",
  "ADMISSION_FG",
  "ADMISSION_SIZE",
  "ADMISSION_BLOB",
  // scoring
  "IOU",
  "ASPECT",
  "IDENTITY_FEATURE",
  "FIDELITY_FLOOR",
  "VLM_SPREAD",
  // contract / routing
  "CONTRACT",
  "BANNED_API",
  "REFUSED_CLASS",
  "ROUTE_CONFIDENCE",
  "EVIDENCE_INCOMPLETE",
]);

export default defineTool({
  description:
    "run.checkpoint — the ONLY writer of stage truth on the Cloud JobCard. Records a " +
    "stage transition, its artifacts, and the next stage. Idempotent per (jobId, runId, " +
    "stageId, attempt). The backend rejects: a skip without a skipReason, a failure " +
    "without a fail code, advancing past cloud-mesh-post before it is done, a next that " +
    "is not a stage on the card, and any attempt to skip cloud-mesh-post or " +
    "cloud-evaluate. The JobCard is total state — chat is never job state. Thin RPC to " +
    "the Hydrilla backend.",
  inputSchema: z.object({
    jobId: z.string().min(1),
    runId: z
      .string()
      .min(1)
      .describe("Re-minted on generate, remesh, bake, and each refine iteration."),
    stageId: CLOUD_STAGE_ID,
    status: z.enum(["pending", "running", "done", "skipped", "failed"]),
    skipReason: z
      .string()
      .min(1)
      .optional()
      .describe("REQUIRED when status='skipped'. cloud-mesh-post and cloud-evaluate are never skippable."),
    failCodes: z
      .array(FAIL_CODE)
      .optional()
      .describe("REQUIRED (at least one) when status='failed'."),
    artifacts: z
      .array(z.string())
      .optional()
      .describe("URIs produced by this stage: GLB, gate_report, turntables, sheet, reports."),
    next: CLOUD_STAGE_ID.nullable()
      .optional()
      .describe("Next stage to run, or null when terminal. Must exist on the card."),
    attempt: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("1-based; increments on refine re-entry. Part of the idempotency key."),
  }),
  async execute(input) {
    return callRunApi(
      TOOL_ID,
      { engine: "cloud", ...input },
      {
        idempotencyKey: `${input.jobId}:${input.runId}:${input.stageId}:${input.attempt ?? 1}`,
      }
    );
  },
});
