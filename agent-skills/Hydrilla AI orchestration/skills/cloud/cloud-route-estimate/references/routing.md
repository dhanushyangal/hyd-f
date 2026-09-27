# route-and-estimate — routing

## Profiles

| Profile | Skills after route | Notes |
|---------|-------------------|-------|
| `draft` | compile + route only → thin generate | ≤2 skills loaded |
| `balanced` | + preprocess + run-3d-job + mesh-post + score | Default quality |
| `quality` | balanced + stricter score | More views / thresholds |
| `game_ready` | + `game-ready-bake` | Opt-in bake worker |

## Engine (UI/API only — immutable)

1. **Engine comes from UI/API** — this skill never chooses Cloud vs Water.
2. **When engine is unset** (API/tests only): default BlueFox/Cloud (Pixal3D GCP + harness).
3. When user picked Water: stay on Water; BYOK adapters inside Water only.
4. Raw Pixal3D alone = compare / adapter path, not a skill-driven engine switch.

## Escalate Water BYOK (topo/poly only)

Escalate to BYOK remesh/adapters **inside the locked engine** only if `mesh-post-gate` fails topology/poly after AutoRemesher (or remesh exhausted):

| Escalate target | When |
|-----------------|------|
| Tripo Smart Mesh | topo/poly fail; user has Tripo key |
| PolyGen | topo/poly fail; user has key |
| Meshy remesh | topo/poly fail; escalate-only — **never** default bake ownership |

Do **not** switch engines for aesthetic score fails (use correction_loop / regenerate on the locked engine first).

## Tool order (Steve rev3)

`run.estimate` (hard gate) → `run.route` (needs estimateOk) → `run.checkpoint`.

## Confidence

`run.route` returns `confidence ∈ [0,1]`. Threshold **0.82**. Below → request-input; do not estimate-then-submit anyway.
