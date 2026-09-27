import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("run.route");

export default defineTool({
  description:
    "run.route — pick the profile and adapter INSIDE Cloud and resolve needs_t2i. The " +
    "engine field is echoed, never chosen: this tool cannot route to Water and has no " +
    "cross-engine or BYOK-adapter fallback. Returns a confidence score; below 0.82 the " +
    "caller must fail closed and stop rather than guess. Brain only. Thin RPC to the " +
    "Hydrilla backend.\n\n" +
    "The CompiledPrompt is read from the JobCard, not from your arguments — call "  +
    "prompt.compile with `compiled` first or this returns a CONTRACT error. Confidence "  +
    "is read from the card too; pass compileConfidence only to override it with a "  +
    "fresher number.",
  inputSchema: z.object({
    jobId: z.string().min(1),
    runId: z.string().min(1),
    assetClass: z
      .enum(["prop", "vehicle", "prop-hero"])
      .describe("Declared class from the compile contract, never inferred."),
    profileHint: z.enum(["draft", "balanced", "quality", "game_ready"]).optional(),
    hasReferenceImage: z.boolean(),
    estimatedCredits: z
      .number()
      .nonnegative()
      .optional()
      .describe("Result of run.estimate, so routing can respect the budget."),
  }),
  async execute(input) {
    // `engine` is an echo. There is no code path here that can change it.
    return callRunApi(TOOL_ID, { engine: "cloud", ...input });
  },
});
