import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("job.submit");

export default defineTool({
  description:
    "job.submit — submit work to a Cloud adapter and return a provider job id. Two " +
    "kinds only: 't2i' (the text-to-image worker behind cloud-t2i) and 'image_to_3d' " +
    "(Pixal3D, the ONLY Cloud generate path). Hands only: it submits and returns, it " +
    "never polls to completion — that is job.await. Adapter credentials live in the " +
    "Hydrilla backend and never reach this agent. Thin RPC to the Hydrilla backend.",
  inputSchema: z.object({
    jobId: z.string().min(1),
    runId: z.string().min(1),
    stageId: z
      .enum(["cloud-t2i", "cloud-run-pixal"])
      .describe("The only two Cloud stages allowed to submit."),
    kind: z.enum(["t2i", "image_to_3d"]),
    adapter: z
      .enum(["flux-t2i", "pixal3d"])
      .describe(
        "flux-t2i for kind='t2i'; pixal3d for kind='image_to_3d'. Pixal3D = BlueFox 1 = " +
          "Trellis = persisted `trilles` — one backbone, no second host."
      ),
    prompt: z
      .string()
      .optional()
      .describe("Compiled t2i prompt. Required for kind='t2i'."),
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
      .optional()
      .describe("Compiled i2_3d intent tags. Geometry intent is not texture intent."),
    profile: z.enum(["draft", "balanced", "quality", "game_ready"]),
  }),
  async execute(input) {
    return callRunApi(TOOL_ID, { engine: "cloud", ...input });
  },
});
