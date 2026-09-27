import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("mesh.post.gate");

export default defineTool({
  description:
    "mesh.post.gate — the deterministic geometry HARD gate for a Cloud GLB, plus optional " +
    "AutoRemesher remesh and re-gate. Checks non-empty GLB, normals, zero non-manifold " +
    "edges, self-intersection, finite bounds, +Y grounded normalize, draft triangle " +
    "budget 50k, floaters/thin shell, and orbit area ratio >= 0.15. Returns a " +
    "gate_report with deterministic fail codes. Hands only: zero aesthetics, zero VLM, " +
    "never promotes. Runs BEFORE any scoring and is never skippable. Thin RPC to the " +
    "Hydrilla backend — the geometry runs in the mesh worker, not here.",
  inputSchema: z.object({
    jobId: z.string().min(1),
    runId: z.string().min(1),
    glbUri: z.url().describe("The GLB exported by cloud-run-pixal."),
    profile: z.enum(["draft", "balanced", "quality", "game_ready"]),
    assetClass: z
      .enum(["prop", "vehicle", "prop-hero"])
      .describe(
        "Declared class from the JobCard compile contract. Class may only RAISE bars, " +
          "never lower them, and is never inferred from a filename."
      ),
    allowRemesh: z
      .boolean()
      .default(true)
      .describe("On HARD fail, attempt AutoRemesher once and re-gate under a new runId."),
  }),
  async execute(input) {
    return callRunApi(TOOL_ID, { engine: "cloud", ...input }, { timeoutMs: 600_000 });
  },
});
