# Cloud skill pack — Pixal3D / BlueFox GLB

**Date:** 2026-09-13 (SoT locked)  
**Canon IDs:** [SKILL_ID_CANON.md](./SKILL_ID_CANON.md)  
**Engine:** Cloud only. UI/API immutable. Never Water tools/prompts.  
**Orchestrator:** eve ([ORCHESTRATOR_DECISION.md](./ORCHESTRATOR_DECISION.md)).  
**Bodies:** `skills/cloud/*/SKILL.md` deepened from Max v0.2.3 — no shared-8, no engine-switch.

## Pipeline

```text
UI engine=Cloud
  → cloud-compile-prompt
  → cloud-route-estimate
  → [cloud-t2i]                 # when needs_t2i
  → cloud-preprocess-ref
  → cloud-run-pixal             # image→3D Pixal (NOT cloud-i2-3d)
  → cloud-mesh-post
  → [cloud-bake]
  → cloud-evaluate              # ≠ generator
  → [cloud-refine-loop]
  → cloud-run-job               # JobCard DAG coordinator (wraps order)
  → [cloud-experiment]          # Lab
```

`cloud-run-job` owns durable DAG order/checkpoints; stage skills own prompts/gates.

## text→image→i2_3d rules

| Skill | Rules |
|-------|-------|
| cloud-compile-prompt | geo_brief + tex_brief; HARD-REFUSE character/Thor/creature/face/hair; needs_t2i if no image |
| cloud-t2i | single subject, gray/studio, no mesh jargon |
| cloud-preprocess-ref | rembg → gray not black; multiview worker flags only |
| cloud-run-pixal | Pixal only; stages in worker config; no LLM poll; download-now |
| cloud-evaluate | one comparison sheet; ≤5 identity; EvidenceManifest; floors 0.70/0.80/0.85 |

## Canon Cloud IDs

cloud-compile-prompt, cloud-route-estimate, cloud-t2i, cloud-preprocess-ref, cloud-run-pixal, cloud-mesh-post, cloud-bake, cloud-evaluate, cloud-refine-loop, cloud-run-job, cloud-experiment

## Retired aliases

cloud-i2-3d, cloud-mesh-post-gate, cloud-game-ready-bake, cloud-score-compare, cloud-run-experiment
