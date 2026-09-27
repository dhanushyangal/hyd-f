import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("job.await");

export default defineTool({
  description:
    "job.await — wait for a submitted Water BYOK job to reach a terminal state and return " +
    "its artifact URIs. Park-friendly: eve checkpoints the step and resumes on delivery, " +
    "so never burn model turns polling. Hands only: on timeout it reports, it never " +
    "re-submits — a duplicate submit spends the customer's money twice. Thin RPC to the " +
    "Hydrilla backend.",
  inputSchema: z.object({
    jobId: z.string().min(1),
    runId: z.string().min(1),
    stageId: z.enum(["water-t2i", "water-generate-3d"]),
    providerJobId: z.string().min(1).describe("Returned by job.submit."),
    timeoutMs: z
      .number()
      .int()
      .positive()
      .max(3_600_000)
      .default(900_000)
      .describe("Upper bound for the wait. Exceeding it is a report, never a re-submit."),
    pollIntervalMs: z.number().int().positive().max(60_000).default(5_000),
  }),
  async execute(input) {
    return callRunApi(TOOL_ID, { engine: "water", ...input }, { timeoutMs: input.timeoutMs });
  },
});
