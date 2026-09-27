import { z } from "zod";

/**
 * The CompiledPrompt the agent writes and the backend validates.
 *
 * Shared by both engines on purpose. The backend validates ONE contract, so two copies of
 * this schema would be two chances to drift out of agreement with it. This is safe to share
 * in a way that skills are not: it names no generator, no adapter, and no engine.
 *
 * Field names are snake_case because that is the wire contract. The backend converts to
 * camelCase internally; do not pre-convert here.
 */
export const COMPILED_PROMPT = z.object({
  subject: z.string().min(1).describe("What the thing is, in plain words. No style adjectives."),
  parts: z
    .array(z.string().min(1))
    .min(1)
    .describe("Named parts that must exist in the mesh. The gate counts these."),
  materials: z.array(z.string().min(1)).min(1).describe("Distinct material slots expected."),
  scale_m: z
    .number()
    .positive()
    .describe(
      "Longest dimension in METRES. Drives the scale gate — a 4m chair fails, so state a " +
        "real-world size rather than a guess."
    ),
  ground_contact: z
    .boolean()
    .describe("True when the object rests on a surface. Drives the NOT_GROUNDED check."),
  style_lock: z.string().min(1).describe("Style commitment held constant across refines."),
  asset_class: z
    .enum(["prop", "vehicle", "prop-hero"])
    .describe(
      "DECLARED, never inferred. Pass through declaredAssetClass when the contract supplied " +
        "one; never read it out of a filename, a path, or prompt keywords."
    ),
  profile: z.enum(["draft", "balanced", "quality", "game_ready"]),
  t2i_prompt: z
    .string()
    .nullable()
    .describe("Studio reference prompt. Required on Cloud when needs_t2i, else null."),
  i2_3d_intent: z.object({
    geo_brief: z.string().min(1).describe("Geometry intent only — form, not colour."),
    texture_brief: z.string().min(1).describe("Texture intent only. Kept separate by design."),
    poly_budget_hint: z.number().int().positive(),
    needs_transparency: z.boolean(),
    needs_thin_shell: z.boolean().describe("True for sheets and shells; relaxes THIN_SHELL."),
    needs_liquid_volume: z.boolean(),
  }),
});

export type CompiledPromptInput = z.infer<typeof COMPILED_PROMPT>;

/**
 * Confidence that the request was understood. `run.route` FAILS CLOSED when this is missing
 * or below its floor, so an honest low number stops the run instead of burning credits on a
 * guess. Never report high confidence to get past the gate.
 */
export const COMPILE_CONFIDENCE = z
  .number()
  .min(0)
  .max(1)
  .describe("0..1 confidence that the compile understood the request. Required to route.");
