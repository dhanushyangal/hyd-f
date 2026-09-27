import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("run.checkpoint");

/**
 * Water JobCard stages. The shipped `threejs` mode carries the six stages in
 * docs/contracts/JOB_CARD.md; `water-t2i`, `water-preprocess-ref`, and `water-bake`
 * only become card stages on the deferred `water-mesh` mode. The backend rejects any
 * stage that is not present on the card. Cloud stages are not addressable here.
 */
const WATER_STAGE_ID = z.enum([
  "water-compile-prompt",
  "water-route-estimate",
  "water-t2i",
  "water-preprocess-ref",
  "water-generate-3d",
  "water-mesh-post",
  "water-bake",
  "water-evaluate",
  "water-refine-loop",
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
    "run.checkpoint — the ONLY writer of stage truth on the Water JobCard. Records a " +
    "stage transition, its artifacts, and the next stage. Idempotent per (jobId, runId, " +
    "stageId, attempt). The backend rejects: a skip without a skipReason, a failure " +
    "without a fail code, advancing past water-mesh-post before it is done, a next that " +
    "is not a stage on the card, and any attempt to skip water-mesh-post or " +
    "water-evaluate. The JobCard is total state — chat is never job state. Thin RPC to " +
    "the Hydrilla backend.",
  inputSchema: z.object({
    jobId: z.string().min(1),
    runId: z
      .string()
      .min(1)
      .describe("Re-minted on generate, remesh, bake, and each refine iteration."),
    stageId: WATER_STAGE_ID,
    status: z.enum(["pending", "running", "done", "skipped", "failed"]),
    skipReason: z
      .string()
      .min(1)
      .optional()
      .describe("REQUIRED when status='skipped'. water-mesh-post and water-evaluate are never skippable."),
    failCodes: z
      .array(FAIL_CODE)
      .optional()
      .describe("REQUIRED (at least one) when status='failed'."),
    artifacts: z
      .array(z.string())
      .optional()
      .describe("URIs produced by this stage: GLB, factory code, gate_report, turntables, sheet."),
    next: WATER_STAGE_ID.nullable()
      .optional()
      .describe("Next stage to run, or null when terminal. Must exist on the card."),
    attempt: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("1-based; increments on refine re-entry. Part of the idempotency key."),
    partial: z
      .boolean()
      .optional()
      .describe(
        "Harness `partial: true` semantics — a partially complete pass is reported " +
          "honestly, never upgraded to done."
      ),
  }),
  async execute(input) {
    return callRunApi(
      TOOL_ID,
      { engine: "water", ...input },
      {
        idempotencyKey: `${input.jobId}:${input.runId}:${input.stageId}:${input.attempt ?? 1}`,
      }
    );
  },
});
