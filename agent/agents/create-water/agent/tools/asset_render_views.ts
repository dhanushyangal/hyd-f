import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("asset.render_views");

export default defineTool({
  description:
    "asset.render_views — render turntable stills of the exported Water GLB at " +
    "0/90/180/270 degrees. Exactly four captures; the EvidenceManifest requires one per " +
    "angle. Hands only: it renders evidence, it does not compose the comparison sheet " +
    "(asset.score does) and it does not judge. The Three.js viewer here is evidence " +
    "capture, not the deliverable. Thin RPC to the Hydrilla backend.",
  inputSchema: z.object({
    jobId: z.string().min(1),
    runId: z.string().min(1),
    glbUri: z
      .url()
      .describe("The exported GLB that already passed mesh.post.gate."),
    angles: z
      .array(z.number().int().min(0).max(359))
      .length(4)
      .default([0, 90, 180, 270])
      .describe("Fixed by the evidence contract. Changing these breaks promote."),
    widthPx: z.number().int().min(256).max(4096).default(1024),
    heightPx: z.number().int().min(256).max(4096).default(1024),
  }),
  async execute(input) {
    return callRunApi(TOOL_ID, { engine: "water", ...input }, { timeoutMs: 300_000 });
  },
});
