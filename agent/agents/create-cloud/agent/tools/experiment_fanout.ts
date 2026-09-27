import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("experiment.fanout");

export default defineTool({
  description:
    "experiment.fanout — Lab-only N-way fanout for Cloud, at concurrency 3, from one " +
    "shared compile. ENGINE-SCOPED: every arm is a Cloud arm (engineScope is fixed to " +
    "'cloud' and cannot be overridden). A Water or BYOK-adapter arm is not available " +
    "here — that belongs to the Water Lab agent — because a cross-engine arm would be an " +
    "engine switch. May include the raw engine output as a baseline column, which is " +
    "never a Create default. Each arm still passes mesh.post.gate before it is scored, " +
    "and dual metrics are reported separately so a HARD geometry fail is never averaged " +
    "away. Not for customer jobs. Thin RPC to the Hydrilla backend.",
  inputSchema: z.object({
    experimentId: z.string().min(1).describe("Lab run identifier grouping the arms."),
    jobId: z.string().min(1).optional().describe("Seed job, when the fanout forks one."),
    arms: z
      .array(
        z.object({
          label: z.string().min(1),
          profile: z.enum(["draft", "balanced", "quality", "game_ready"]),
          promptOverride: z.string().optional(),
          adapter: z
            .enum(["flux-t2i", "pixal3d"])
            .optional()
            .describe("Cloud adapters only."),
          notes: z.string().optional(),
        })
      )
      .min(2)
      .max(8),
    concurrency: z.number().int().min(1).max(3).default(3),
    includeRawBaseline: z
      .boolean()
      .default(true)
      .describe("Raw engine output as a comparison column, never as the shipped default."),
  }),
  async execute(input) {
    return callRunApi(
      TOOL_ID,
      { engine: "cloud", engineScope: "cloud", ...input },
      { timeoutMs: 900_000 }
    );
  },
});
