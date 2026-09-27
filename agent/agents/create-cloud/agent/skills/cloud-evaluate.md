---
description: >-
  Load after cloud-mesh-post passes (and cloud-bake, when it ran) to render turntables,
  build the single comparison sheet, score against the reference, and decide promote,
  reject, or refine. This is the ONLY promote path — load it whenever a Cloud asset is
  about to be shipped to a user. Never load to generate or to rescue a geometry failure.
---

# cloud-evaluate

Skeptical evaluator. Generator ≠ evaluator: this skill never calls `job.submit`.

## Tools

1. Confirm `cloud-mesh-post` is `done` on the JobCard — if not, refuse to score.
2. `asset.render_views` — turntable at **0 / 90 / 180 / 270**, exactly four captures.
3. `asset.score` — Tier1 → identity → VLM last; **exactly one** comparison sheet per
   `runId`.
4. `run.checkpoint` — stage `cloud-evaluate` with the verdict.

## Order (never reorder)

```
mesh.post.gate HARD pass → render_views → Tier1 → identity → VLM → checkEvidence → promote | reject | refine
```

## Floors

| Check | Floor |
|---|---|
| Silhouette IoU | HARD ≥ **0.85** |
| Scale error | ≤ **0.08** |
| Aspect error | ≤ **0.05** |
| Objectness rescue `RECON_OBJ_MIN` | ≈ **0.48** |
| Continue | ≥ **0.70** |
| Quality-complete fidelity | ≥ **0.85** |
| Identity features | ≤ **5**, each ≥ **0.80** |
| Important features average | ≥ **0.65** |
| VLM per-criterion | ≥ **0.80** |
| VLM spread across samples | ≤ **0.20** |
| Profile fidelity floor | draft 0.70 · balanced 0.80 · quality 0.85 · game_ready 0.85 |

## Rules

1. **No score if mesh-post HARD failed.** A VLM never rescues `NON_MANIFOLD`,
   `SELF_INTERSECT`, or any HARD code.
2. Promote requires a fresh, complete EvidenceManifest for the **current** `runId`:
   `glb`, `gate_report` (HARD pass), four `turntable`, one `comparison_sheet`,
   `score_report`, plus `admission_report` when a reference image existed and
   `bake_report` when bake ran.
3. **Objectness before blind IoU reject** on gen-vs-photo comparisons: IoU-only HARD with
   objectness ≥ `RECON_OBJ_MIN` routes to a **probe**, never past a geometry HARD fail.
4. Small features need **zoom/microscope patches**, not global IoU churn. Prefer
   multi-orbit self-consistency over a single view against the t2i plate.
5. Default evidence rubric is the generic prop pack. The Car identity pack applies only
   when `class=vehicle`.
6. Class profiles only **raise** floors.
7. Fidelity adapters (masks, depth) need provenance; adapter output is never a ship
   grant.
8. **Prefer reject when the evidence is thin.** A missing capture is a reject, not a
   judgement call.
9. Two comparison sheets for one `runId` is a hard error.

Depth: `agent-skills/Hydrilla AI orchestration/skills/cloud/cloud-evaluate/`
(`prop-score-rubric.md`, `car-identity-features.md`, `evidence-manifest.md`,
`img2threejs-must-fold.md`, `quality-bar.md`).
