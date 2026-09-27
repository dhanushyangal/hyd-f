---
description: >-
  Load immediately after cloud-compile-prompt succeeds, to estimate credits and latency
  before any spend and to pick the profile and adapter inside Cloud. Also load when
  deciding needs_t2i or when a route confidence check must fail closed. Never load to
  choose between engines.
---

# cloud-route-estimate

## Tools

1. `run.estimate` — hard gate. `ok:false` ⇒ stop the job, do not spend.
2. `run.route` with `engine: "cloud"` — an **echo**, never a choice.
3. `run.checkpoint` — stage `cloud-route-estimate`.

## Decide

- **profile**: `draft` | `balanced` | `quality` | `game_ready`. It sets the fidelity
  floor (0.70 / 0.80 / 0.85 / 0.85) and whether `cloud-bake` runs.
- **needs_t2i**: true for text-only input. An admitted user image may set it false, and
  that skip must carry a `skipReason`.
- **confidence** ≥ **0.82**. Below it, fail closed — stop and ask, do not guess.

## Rules

- Adapter and profile selection happen **inside Cloud** only.
- Never emit a Water or BYOK adapter id. There is no cross-engine fallback, under any
  phrasing. Never switch engines.
- Estimate always precedes credit deduction — no spend before a number exists.
- Class profiles may only **raise** floors. A `draft` run never silently inherits
  `vehicle` or `prop-hero` bars.

Depth: `agent-skills/Hydrilla AI orchestration/skills/cloud/cloud-route-estimate/`
(`routing.md`, `class-poly-budgets.md`, `paid-call-discipline.md`).
