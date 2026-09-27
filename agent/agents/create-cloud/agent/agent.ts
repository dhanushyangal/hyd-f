import { anthropic } from "@ai-sdk/anthropic";
import { defineAgent } from "eve";

/**
 * eve-create-cloud — the Cloud (BlueFox / Pixal3D / Trellis) Create orchestrator.
 *
 * ===========================================================================
 * WHY A DIRECT PROVIDER MODEL AND NOT A GATEWAY MODEL ID
 * ===========================================================================
 *
 * The kill list (agent-skills/Hydrilla AI orchestration/docs/KILL_LIST.md) bans
 * "AI Gateway — direct provider keys / Water BYOK only", and cursor-prompts/01 repeats
 * "Direct provider keys — no AI Gateway".
 *
 * A bare gateway model id string (`"anthropic/claude-opus-4.8"`) routes through Vercel AI
 * Gateway, so it is not an option here. Passing a provider-authored LanguageModel instead
 * calls Anthropic directly with ANTHROPIC_API_KEY and never touches the gateway — which
 * satisfies the ban literally rather than by argument. Do not "simplify" this back to a
 * model-id string, and do not run `eve set --model <id>` or `/model <id>`, since both
 * rewrite this to a gateway id.
 *
 * Note the id format differs by route: direct Anthropic ids use hyphens
 * (`claude-opus-4-8`), gateway ids use a dot (`anthropic/claude-opus-4.8`).
 *
 * Separately, this agent is the BRAIN only. It plans stages, reads gate reports, and decides
 * promote / reject / refine; it never generates a customer asset. Every generation call
 * (t2i, image→3D, bake, render, score) is an HTTP RPC to the Hydrilla backend at
 * POST {HYDRILLA_RUN_API}/api/create/tools/<toolId>. The backend holds Hydrilla's Cloud
 * credentials and, on Water, the customer's BYOK keys; those keys are never sent to this
 * agent. No tool in `tools/` imports a provider SDK, and the only egress is
 * `shared/runApi.ts`. See `agent/README.md`.
 */
export default defineAgent({
  model: anthropic(process.env.HYDRILLA_ORCHESTRATOR_MODEL ?? "claude-opus-4-8"),
});
