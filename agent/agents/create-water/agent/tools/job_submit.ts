import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("job.submit");

export default defineTool({
  description:
    "job.submit — Water generate RPC. Shipped threejs jobs do NOT use this tool: " +
    "the product path is POST /api/water/generate (Clerk + BYOK) which compiles, " +
    "routes, and binds a pack in-process. This RPC 501s by design until mesh adapters " +
    "are mounted. Mesh adapters (meshy, tripo, fal, rodin) stay deferred.",
  inputSchema: z.object({
    jobId: z.string().min(1),
    runId: z.string().min(1),
    stageId: z
      .enum(["water-t2i", "water-generate-3d"])
      .describe("The only two Water stages allowed to submit."),
    kind: z.enum(["t2i", "text_to_3d", "image_to_3d"]),
    adapter: z
      .enum(["water-threejs", "water-t2i", "meshy", "tripo", "fal", "rodin"])
      .describe(
        "water-threejs runs the shipped factory harness. Other adapters are mesh-mode / t2i."
      ),
    prompt: z.string().optional().describe("Compiled prompt. Required for t2i and text_to_3d."),
    imageUri: z
      .url()
      .optional()
      .describe("Admitted reference image. Required for kind='image_to_3d'."),
    intent: z
      .object({
        geoBrief: z.string().optional(),
        texBrief: z.string().optional(),
        polyBudgetHint: z.number().int().positive().optional(),
        transparency: z.boolean().optional(),
        thinShell: z.boolean().optional(),
      })
      .optional(),
    profile: z.enum(["draft", "balanced", "quality", "game_ready"]),
  }),
  async execute(input) {
    return callRunApi(TOOL_ID, { engine: "water", ...input });
  },
});
