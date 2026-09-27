---
name: cloud-preprocess-ref
description: >-
  Use on Cloud when a user, ref, or t2i image must pass BiRefNet admission before
  Pixal image→3D. Not generate, bake, or VLM score.
metadata:
  version: "0.3.0"
  author: hydrilla
  engine: cloud
  token_class: judge
compatibility: image.rembg; Cloud agent only.
---

# cloud-preprocess-ref

## When to use

After t2i or when user supplied an image, before `cloud-run-pixal`.

## Tool sequence

1. `image.rembg` — BiRefNet + admission report  
2. `run.checkpoint` — mark `preprocess`

## Admission (img2threejs)

fg 5–97%; short side ≥64px; largest blob ≥60%. Fail → request new image or refine t2i — do not call Pixal on rejected admission.

## Skip

Only with `skipReason` (e.g. clean studio ref, rembg off) per JobCard policy.
