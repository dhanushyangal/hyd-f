import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";
import { COMPILE_CONFIDENCE, COMPILED_PROMPT } from "#shared/compiledPrompt";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("prompt.compile");

export default defineTool({
  description:
    "prompt.compile — Cloud (engine=cloud, BlueFox/Pixal3D) prompt compiler. Turns raw " +
    "text and optional reference images into a CompiledPrompt with a geo_brief, a " +
    "tex_brief, a declared assetClass, a studio t2i prompt, i2_3d intent tags, and a " +
    "needs_t2i signal. Also returns the HARD refusal for characters, humanoids, faces, " +
    "hair, and creatures (Create v1 is props and hard-surface only). Brain only: it " +
    "never touches the GPU and never chooses an engine. Thin RPC to the Hydrilla " +
    "backend, which owns all generation.\n\n" +
    "CALL IT TWICE. First without `compiled` to get the refusal screen and the required " +
    "field list. If it refuses, STOP — do not rephrase to get past it. Otherwise call " +
    "again with `compiled` and `confidence` filled in; the backend validates them and " +
    "persists them on the JobCard, and every later stage reads asset_class and scale_m " +
    "from the card rather than from your arguments.",
  inputSchema: z.object({
    jobId: z.string().min(1).describe("Existing jobs.id for this Create job."),
    runId: z.string().min(1).describe("Current JobCard runId."),
    text: z.string().min(1).describe("Raw user request, verbatim."),
    refImageUris: z
      .array(z.url())
      .max(8)
      .optional()
      .describe("User-supplied reference images, if any."),
    profileHint: z
      .enum(["draft", "balanced", "quality", "game_ready"])
      .optional()
      .describe("Profile hint from the UI. run.route makes the final choice."),
    declaredAssetClass: z
      .enum(["prop", "vehicle", "prop-hero"])
      .optional()
      .describe(
        "Class declared by the contract or the UI. NEVER infer this from a filename, " +
          "a path, or prompt keywords — keyword detection silently applies specialty floors."
      ),
    compiled: COMPILED_PROMPT.optional().describe(
      "YOUR compiled output. Omit on the first call; supply it on the second."
    ),
    confidence: COMPILE_CONFIDENCE.optional().describe(
      "Required alongside `compiled`. Without it run.route fails closed."
    ),
  }),
  async execute(input) {
    return callRunApi(TOOL_ID, { engine: "cloud", ...input });
  },
});
