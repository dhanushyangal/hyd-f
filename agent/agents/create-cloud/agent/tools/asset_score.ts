import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("asset.score");

export default defineTool({
  description:
    "asset.score — the Cloud evaluator. Composes exactly ONE comparison sheet per runId, " +
    "runs Tier1 (IoU >= 0.85, scale <= 0.08, aspect <= 0.05) with objectness rescue at " +
    "RECON_OBJ_MIN ~0.48, then identity features (<= 5, each >= 0.80, important average " +
    ">= 0.65), then a VLM LAST (criteria >= 0.80, spread <= 0.20). Owns promote / reject " +
    "/ refine, and is the only tool that may promote. It can never rescue a HARD " +
    "geometry fail and must not run before mesh.post.gate has passed. Thin RPC to the " +
    "Hydrilla backend.",
  inputSchema: z.object({
    jobId: z.string().min(1),
    runId: z.string().min(1),
    glbUri: z.url(),
    referenceImageUri: z
      .url()
      .optional()
      .describe("Admitted reference or t2i plate the result is compared against."),
    turntableUris: z
      .array(z.url())
      .length(4)
      .describe("The four captures from asset.render_views, in angle order."),
    profile: z.enum(["draft", "balanced", "quality", "game_ready"]),
    assetClass: z
      .enum(["prop", "vehicle", "prop-hero"])
      .describe(
        "Declared class. The Car identity pack applies only when class=vehicle; class " +
          "may only RAISE floors."
      ),
    gatePassed: z
      .boolean()
      .describe("Result of mesh.post.gate. False means refuse to score — no VLM rescue."),
    allowVlm: z
      .boolean()
      .default(true)
      .describe("VLM runs last and never on a HARD fail. Multi-sample near threshold."),
  }),
  async execute(input) {
    return callRunApi(TOOL_ID, { engine: "cloud", ...input }, { timeoutMs: 600_000 });
  },
});
