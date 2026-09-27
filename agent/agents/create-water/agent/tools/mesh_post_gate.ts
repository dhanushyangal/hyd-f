import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("mesh.post.gate");

export default defineTool({
  description:
    "mesh.post.gate — the deterministic geometry HARD gate for Water, run on the EXPORTED " +
    "GLB, not on the sandbox preview. Same bar as Cloud: non-empty GLB, normals, zero " +
    "non-manifold edges, self-intersection, finite bounds, +Y grounded normalize, draft " +
    "triangle budget 50k, floaters/thin shell, and orbit area ratio >= 0.15. Returns a " +
    "gate_report with deterministic fail codes. A provider's own remesh does not waive " +
    "this gate. Hands only: zero aesthetics, zero VLM, never promotes, never skippable. " +
    "Thin RPC to the Hydrilla backend — the geometry runs in the mesh worker, not here.",
  inputSchema: z.object({
    jobId: z.string().min(1),
    runId: z.string().min(1),
    glbUri: z
      .url()
      .describe("The EXPORTED GLB. A correct-looking preview is not the subject."),
    waterMode: z.enum(["threejs", "mesh"]).default("threejs"),
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
      .describe("On HARD fail, attempt local AutoRemesher once and re-gate under a new runId."),
  }),
  async execute(input) {
    return callRunApi(TOOL_ID, { engine: "water", ...input }, { timeoutMs: 600_000 });
  },
});
