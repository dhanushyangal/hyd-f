---
name: cloud-t2i
description: >-
  Use on Cloud jobs when needs_t2i is true. Orchestrates the text→image worker
  to produce a studio-quality reference for Pixal image→3D. Not image→3D itself,
  not Water generate, not scoring.
metadata:
  version: "0.3.0"
  author: hydrilla
  engine: cloud
  token_class: worker-orch
compatibility: t2i worker behind route; run.checkpoint; Cloud agent only.
---

# cloud-t2i

## When to use

Cloud DAG after route when `needs_t2i=true`. Part of locked pipeline: **text→image → image→3D**.

## Behavior

- Call t2i **worker** (not a 13th Run API tool ID; packaging may expose helper RPC).  
- Use compiled t2i prompt: single prop, clear silhouette, neutral studio, no characters.  
- Output image URI → feed `cloud-preprocess-ref` (or skip preprocess only with documented skipReason).  
- `run.checkpoint` mark `t2i` + evidence URI.

## Rules

- Do not submit Pixal i2_3d from this skill.  
- Do not skip t2i on text-only Cloud jobs when route set `needs_t2i=true`.  
- Three.js is irrelevant here — output is a **2D image** for Pixal.

## Fail-closed

Worker error → retryable per job policy; do not silently jump to generate.
