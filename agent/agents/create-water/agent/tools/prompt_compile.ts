import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";
import { COMPILE_CONFIDENCE, COMPILED_PROMPT } from "#shared/compiledPrompt";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("prompt.compile");

export default defineTool({
  description:
    "prompt.compile — Water (engine=water, BYOK) prompt compiler. Turns raw text and " +
    "optional references into a CompiledPrompt with a geo_brief, a tex_brief, a declared " +
    "assetClass, and the waterMode intent ('threejs', shipped and first-class, or " +
    "'mesh', deferred). Characters are allowed but stylized only — it HARD-REFUSES " +
    "photoreal likeness and real identifiable people. Brain only: it never touches a " +
    "provider and never chooses an engine; choosing a waterMode is not an engine switch. " +
    "Thin RPC to the Hydrilla backend, which holds the customer's BYOK key.\n\n" +
    "CALL IT TWICE. First without `compiled` to get the refusal screen and the required " +
    "field list. If it refuses, STOP — do not rephrase to get past it. Otherwise call " +
    "again with `compiled` and `confidence` filled in; the backend validates them and " +
    "persists them on the JobCard, and every later stage reads asset_class and scale_m " +
    "from the card rather than from your arguments.",
  inputSchema: z.object({
    jobId: z.string().min(1).describe("Existing jobs.id (wt_* for Water)."),
    runId: z.string().min(1).describe("Current JobCard runId."),
    text: z.string().min(1).describe("Raw user request, verbatim."),
    refImageUris: z.array(z.url()).max(8).optional(),
    waterMode: z
      .enum(["threejs", "mesh"])
      .default("threejs")
      .describe(
        "'threejs' is shipped and first-class (result_kind=three_factory); 'mesh' is " +
          "deferred to Phase 7. A mode is chosen inside Water and is NOT an engine switch."
      ),
    profileHint: z.enum(["draft", "balanced", "quality", "game_ready"]).optional(),
    declaredAssetClass: z
      .enum(["prop", "vehicle", "prop-hero"])
      .optional()
      .describe(
        "Class declared by the contract or the UI. NEVER infer this from a filename, " +
          "a path, or prompt keywords."
      ),
    compiled: COMPILED_PROMPT.optional().describe(
      "YOUR compiled output. Omit on the first call; supply it on the second. " +
        "t2i_prompt is null on Water unless a reference plate is genuinely needed."
    ),
    confidence: COMPILE_CONFIDENCE.optional().describe(
      "Required alongside `compiled`. Without it run.route fails closed."
    ),
  }),
  async execute(input) {
    return callRunApi(TOOL_ID, { engine: "water", ...input });
  },
});
