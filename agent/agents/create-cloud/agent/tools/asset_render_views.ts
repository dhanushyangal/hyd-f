import { defineTool } from "eve/tools";
import { z } from "zod";
import { assertToolId, callRunApi } from "#shared/runApi";

/** Canonical dotted tool id. The filename uses underscores; this is the contract id. */
export const TOOL_ID = assertToolId("asset.render_views");

export default defineTool({
  description:
    "asset.render_views — render turntable stills of a Cloud GLB at 0/90/180/270 degrees. " +
    "Exactly four captures; the EvidenceManifest requires one per angle. Hands only: it " +
    "renders evidence, it does not compose the comparison sheet (asset.score does) and " +
    "it does not judge. Three.js here is a viewer for evidence capture, never a generate " +
    "path. Thin RPC to the Hydrilla backend.",
  inputSchema: z.object({
    jobId: z.string().min(1),
    runId: z.string().min(1),
    glbUri: z.url().describe("A GLB that has already passed mesh.post.gate."),
    angles: z
      .array(z.number().int().min(0).max(359))
      .length(4)
      .default([0, 90, 180, 270])
      .describe("Fixed by the evidence contract. Changing these breaks promote."),
    widthPx: z.number().int().min(256).max(4096).default(1024),
    heightPx: z.number().int().min(256).max(4096).default(1024),
  }),
  async execute(input) {
    return callRunApi(TOOL_ID, { engine: "cloud", ...input }, { timeoutMs: 300_000 });
  },
});
