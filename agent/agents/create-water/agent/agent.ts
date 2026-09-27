import { anthropic } from "@ai-sdk/anthropic";
import { defineAgent } from "eve";

/**
 * eve-create-water — the Water (BYOK) Create orchestrator.
 *
 * ===========================================================================
 * WHY A DIRECT PROVIDER MODEL AND NOT A GATEWAY MODEL ID
 * ===========================================================================
 *
 * The kill list bans "AI Gateway — direct provider keys / Water BYOK only". A bare gateway
 * model id string routes through Vercel AI Gateway; a provider-authored LanguageModel calls
 * Anthropic directly with ANTHROPIC_API_KEY and never touches it. Do not replace this with a
 * model-id string, and do not run `eve set --model <id>` or `/model <id>` — both rewrite it
 * to a gateway id.
 *
 * The distinction matters more here than on Cloud: Water runs on the CUSTOMER's key. That key
 * lives in the Hydrilla backend and is used only there. This agent orchestrates; it never
 * reads, forwards, or logs a customer key, and the model configured above is Hydrilla's own
 * orchestration cost, carrying prompt and gate metadata only.
 *
 * Water's default result is Three.js factory code (`createModel()`), not a mesh — that is the
 * shipped, first-class output, and `waterMode: "mesh"` is the deferred path. Choosing a mode
 * inside Water is not an engine switch; this agent can never route to Cloud.
 */
export default defineAgent({
  model: anthropic(process.env.HYDRILLA_ORCHESTRATOR_MODEL ?? "claude-opus-4-8"),
});
