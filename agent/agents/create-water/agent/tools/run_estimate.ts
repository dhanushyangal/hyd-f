import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("run.estimate");

export default defineTool({
  description:
    "run.estimate — Water cost, token, and latency estimate, computed BEFORE any spend. " +
    "Water spends the customer's own BYOK budget, so an estimate always precedes the " +
    "call and provider-aware soft budgets apply. Returns { ok, credits, tokens, " +
    "latencyMs }; ok=false is a hard stop. Brain only: it estimates, it never deducts " +
    "and never submits. Thin RPC to the Hydrilla backend.\n\n" +
    "The plan is rebuilt from the JobCard so an estimate cannot be based on a cheaper " +
    "plan than the one that will run. profile and assetClass are informational; the card's " +
    "compiled contract decides. Pass availableCredits to get an affordability verdict " +
    "rather than a bare cost.",
  inputSchema: z.object({
    jobId: z.string().min(1),
    runId: z.string().min(1),
    waterMode: z.enum(["threejs", "mesh"]).default("threejs"),
    profile: z.enum(["draft", "balanced", "quality", "game_ready"]),
    assetClass: z
      .enum(["prop", "vehicle", "prop-hero"])
      .describe("Declared class from the compile contract, never inferred."),
    hasReferenceImage: z.boolean(),
  }),
  async execute(input) {
    return callRunApi(TOOL_ID, { engine: "water", ...input });
  },
});
