import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("image.rembg");

export default defineTool({
  description:
    "image.rembg — background removal plus reference admission for Cloud, run before " +
    "any paid GPU call. Returns a cleaned image URI and an admission_report checked " +
    "against foreground 5-97% of frame, shortest side >= 64px, and largest blob >= 60% " +
    "of foreground. Hands only: it judges admission, never aesthetics, and never calls " +
    "a VLM. Thin RPC to the Hydrilla backend.",
  inputSchema: z.object({
    jobId: z.string().min(1),
    runId: z.string().min(1),
    imageUri: z
      .url()
      .describe("User-supplied image, or the plate produced by the t2i stage."),
    matte: z
      .enum(["gray", "transparent"])
      .default("gray")
      .describe("Gray, not black — a black matte bleeds into dark subjects."),
    model: z.enum(["birefnet", "rembg"]).default("birefnet"),
  }),
  async execute(input) {
    return callRunApi(TOOL_ID, { engine: "cloud", ...input });
  },
});
