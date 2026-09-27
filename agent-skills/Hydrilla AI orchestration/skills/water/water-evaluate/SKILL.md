---
name: water-evaluate
description: >-
  Skeptical evaluator for Water GLBs: turntable, one comparison sheet vs
  reference, heuristics/VLM. Owns promote/reject. Do not average with Cloud
  rubrics. Never overrides HARD fail.
metadata:
  version: "0.3.0"
  author: hydrilla
  engine: water
  token_class: judge
compatibility: asset.render_views, asset.score; Water agent only.
---

# water-evaluate

## Evaluator rules

Mirror Cloud skeptical bar (`QUALITY_VS_PIXAL.md` numbers apply to GLB fidelity vs reference). Tag reports `engine=water`. Dual-column Lab sheets must not average Cloud+Water into one score.

Three.js/viewer = evidence capture only.
