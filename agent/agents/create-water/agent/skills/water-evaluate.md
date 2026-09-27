---
description: >-
  Load after water-mesh-post passes (and water-bake, when it ran) to render turntables,
  build the single comparison sheet, score against the brief or reference, and decide
  promote, reject, or refine. This is the ONLY promote path — load it whenever a Water
  asset is about to be shipped. Never load to generate or to rescue a geometry failure.
---

# water-evaluate

Skeptical evaluator, `engine=water`. Generator ≠ evaluator: this skill never generates.

## Tools

1. Confirm `water-mesh-post` is `done` on the JobCard — if not, refuse to score.
2. `asset.render_views` — turntable at **0 / 90 / 180 / 270**, exactly four captures.
3. `asset.score` — Tier1 → identity → VLM last; **exactly one** comparison sheet per
   `runId`.
4. `run.checkpoint` — stage `water-evaluate` with the verdict.

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

1. **No score if mesh-post HARD failed.** A VLM never rescues a HARD geometry code.
2. Promote requires a fresh, complete EvidenceManifest for the **current** `runId`:
   `glb`, `gate_report` (HARD pass), four `turntable`, one `comparison_sheet`,
   `score_report`, plus `bake_report` when bake ran.
3. Objectness rescue routes to a **probe**, never past a geometry HARD fail. Small
   features need zoom/microscope patches, not global IoU churn.
4. **Tag every report `engine=water`.** The Water rubric is separate from the Cloud
   sheet-averaging rubric — never merge or average a `three_factory` result with a Cloud
   GLB into one score, including in Lab dual-column sheets.
5. The exported GLB is the subject. A correct-looking sandbox preview is not evidence.
6. Class profiles only **raise** floors.
7. **Prefer reject when the evidence is thin.**
8. Fast tier: skip the evaluator LLM and the VLM; the deterministic gates still run.
9. Three.js viewers are evidence capture only.
