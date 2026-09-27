---
description: >-
  Load immediately after water-compile-prompt succeeds, to estimate cost and latency
  before spend and to pick the profile, tier, and waterMode inside Water. Also load when
  a route confidence check must fail closed. Never load to choose between engines.
---

# water-route-estimate

## Tools

1. `run.estimate` — hard gate. `ok:false` ⇒ stop, do not spend the customer's budget.
2. `run.route` with `engine: "water"` — an **echo**, never a choice.
3. `run.checkpoint` — stage `water-route-estimate`.

## Decide

- **waterMode**: `threejs` (shipped, first-class) or `mesh` (deferred — do not select it
  until it ships). This is an intra-engine decision.
- **profile**: `draft` | `balanced` | `quality` | `game_ready` ⇒ fidelity floor
  0.70 / 0.80 / 0.85 / 0.85.
- **confidence** ≥ **0.82**. Below it, fail closed.

## Rules

- Adapter and profile selection happen **inside Water** only. On `mesh` mode the
  adapters are Meshy / Tripo / fal / Rodin; estimating their cost is fine, swapping to
  Cloud is not.
- Never emit a Cloud adapter id. Never "fall back" across engines.
- Estimate always precedes spend. BYOK budget is the customer's money — respect
  provider-aware soft budgets and `partial: true` semantics.
- The Fast tier stays cheap: no evaluator LLM, no VLM.
- Class profiles may only **raise** floors.

Depth: `agent-skills/Hydrilla AI orchestration/skills/water/water-route-estimate/`.
