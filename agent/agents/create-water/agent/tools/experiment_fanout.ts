import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("experiment.fanout");

export default defineTool({
  description:
    "experiment.fanout — Lab-only N-way fanout for Water, at concurrency 3, from one " +
    "shared compile. ENGINE-SCOPED: every arm is a Water arm (engineScope is fixed to " +
    "'water' and cannot be overridden). Arms may compare harness settings or Water BYOK " +
    "adapters (meshy, tripo, fal, rodin) against each other; a Cloud arm is not " +
    "available here — that belongs to the Cloud Lab agent — because a cross-engine arm " +
    "would be an engine switch. Each arm still passes mesh.post.gate before it is " +
    "scored, dual metrics are reported separately so a HARD geometry fail is never " +
    "averaged away, and Water results are never merged into a Cloud rubric. Every arm " +
    "spends the customer's BYOK budget. Not for customer jobs. Thin RPC to the Hydrilla " +
    "backend.",
  inputSchema: z.object({
    experimentId: z.string().min(1).describe("Lab run identifier grouping the arms."),
    jobId: z.string().min(1).optional().describe("Seed job, when the fanout forks one."),
    waterMode: z.enum(["threejs", "mesh"]).default("threejs"),
    arms: z
      .array(
        z.object({
          label: z.string().min(1),
          profile: z.enum(["draft", "balanced", "quality", "game_ready"]),
          promptOverride: z.string().optional(),
          adapter: z
            .enum(["meshy", "tripo", "fal", "rodin"])
            .optional()
            .describe("Water BYOK adapters only; deferred mesh mode."),
          notes: z.string().optional(),
        })
      )
      .min(2)
      .max(8),
    concurrency: z.number().int().min(1).max(3).default(3),
  }),
  async execute(input) {
    return callRunApi(
      TOOL_ID,
      { engine: "water", engineScope: "water", ...input },
      { timeoutMs: 900_000 }
    );
  },
});
