import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("run.route");

export default defineTool({
  description:
    "run.route — pick the waterMode, profile, and adapter INSIDE Water. The engine field " +
    "is echoed, never chosen: this tool cannot route out of Water and has no cross-engine " +
    "fallback. Adapter choices are Water-only (Meshy, Tripo, fal, Rodin) and apply solely " +
    "to the deferred 'mesh' mode; the shipped 'threejs' mode runs the in-process harness " +
    "with no adapter. Returns a confidence score; below 0.82 the caller must fail closed. " +
    "Brain only. Thin RPC to the Hydrilla backend.\n\n" +
    "The CompiledPrompt is read from the JobCard, not from your arguments — call " +
    "prompt.compile with `compiled` first or this returns a CONTRACT error. Confidence is " +
    "read from the card too; pass compileConfidence only to override it with a fresher number.",
  inputSchema: z.object({
    jobId: z.string().min(1),
    runId: z.string().min(1),
    waterMode: z
      .enum(["threejs", "mesh"])
      .default("threejs")
      .describe("Intra-engine mode. Selecting a mode is not an engine switch."),
    assetClass: z.enum(["prop", "vehicle", "prop-hero"]),
    profileHint: z.enum(["draft", "balanced", "quality", "game_ready"]).optional(),
    adapterHint: z
      .enum(["meshy", "tripo", "fal", "rodin"])
      .optional()
      .describe("Water BYOK adapters only, and only meaningful on the deferred mesh mode."),
    hasReferenceImage: z.boolean(),
    estimatedCredits: z.number().nonnegative().optional(),
  }),
  async execute(input) {
    // `engine` is an echo. There is no code path here that can change it.
    return callRunApi(TOOL_ID, { engine: "water", ...input });
  },
});
