# Water skill pack — BYOK (never Pixal)

**Date:** 2026-09-13 (SoT locked)  
**Canon:** [SKILL_ID_CANON.md](./SKILL_ID_CANON.md)  
**Engine:** Water only. Never copy Cloud Pixal/t2i-Trellis prompts.  
**Generate:** `water-generate-3d` only (Meshy/Tripo/fal/…). Optional `water-t2i` if adapter needs image.  
**OFF hot path:** `water-threejs-preview` (OPTIONAL legacy).

## Pipeline

```text
UI engine=Water
  → water-compile-prompt
  → water-route-estimate
  → [water-t2i]
  → [water-preprocess-ref]
  → water-generate-3d
  → water-mesh-post
  → [water-bake]
  → water-evaluate
  → [water-refine-loop]
  → water-run-job
  → [water-experiment]
```

## Canon Water IDs

water-compile-prompt, water-route-estimate, water-t2i, water-preprocess-ref, water-generate-3d, water-mesh-post, water-bake, water-evaluate, water-refine-loop, water-run-job, water-experiment  
(+ OPTIONAL water-threejs-preview — never Cloud)

## Retired aliases

water-mesh-post-gate, water-game-ready-bake, water-score-compare, water-gate-factory, water-visual (retired — not Create hot path)
