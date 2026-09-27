import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("run.estimate");

export default defineTool({
  description:
    "run.estimate — Cloud credit and latency estimate, computed BEFORE any spend. " +
    "Returns { ok, credits, latencyMs } and a hard stop when ok is false. Brain only: " +
    "it estimates, it never deducts credits and never submits a job. Thin RPC to the " +
    "Hydrilla backend.\n\n" +
    "The plan is rebuilt from the JobCard so an estimate cannot be based on a cheaper " +
    "plan than the one that will run. profile and assetClass are informational; the card's " +
    "compiled contract decides. Pass availableCredits to get an affordability verdict " +
    "rather than a bare cost.",
  inputSchema: z.object({
    jobId: z.string().min(1),
    runId: z.string().min(1),
    profile: z
      .enum(["draft", "balanced", "quality", "game_ready"])
      .describe("Render profile under consideration."),
    assetClass: z
      .enum(["prop", "vehicle", "prop-hero"])
      .describe("Declared class from the compile contract, never inferred."),
    needsT2i: z
      .boolean()
      .describe("True when the input is text-only and a reference plate must be generated."),
    hasReferenceImage: z.boolean().describe("True when a user image is present."),
  }),
  async execute(input) {
    return callRunApi(TOOL_ID, { engine: "cloud", ...input });
  },
});
