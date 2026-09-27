import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("mesh.bake");

export default defineTool({
  description:
    "mesh.bake — Hydrilla's own bake worker for Water, the same worker Cloud uses: " +
    "reduce, UV unwrap, bake PBR channels, pack, and run channel QA. Use when " +
    "profile=game_ready or the gate reported NO_UV, and only after mesh.post.gate has " +
    "HARD-passed. Hydrilla owns bake: a generation provider's remesh or texture option " +
    "is not a bake, and Needle is a feature-flagged sidecar only. Hands only; mints a " +
    "new runId, which staleness-invalidates prior evidence. Thin RPC to the Hydrilla " +
    "backend.",
  inputSchema: z.object({
    jobId: z.string().min(1),
    runId: z.string().min(1),
    glbUri: z.url().describe("A GLB that has already passed mesh.post.gate."),
    profile: z.enum(["draft", "balanced", "quality", "game_ready"]),
    channels: z
      .array(z.enum(["albedo", "metalness", "roughness", "normal", "ao"]))
      .min(1)
      .default(["albedo", "metalness", "roughness", "normal"]),
    targetTriangles: z.number().int().positive().optional(),
    reason: z
      .enum(["game_ready", "NO_UV"])
      .describe("Why bake is running. NO_UV triggers a bake, never a silent pass."),
  }),
  async execute(input) {
    return callRunApi(TOOL_ID, { engine: "water", ...input }, { timeoutMs: 900_000 });
  },
});
