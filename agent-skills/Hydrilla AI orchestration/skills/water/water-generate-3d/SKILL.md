---
name: water-generate-3d
description: >-
  Use on Water as the generate path: submit/poll BYOK 3D adapters (Meshy, Tripo,
  fal, …) to produce mesh/GLB. Not Pixal i2_3d, not bake owner, not Cloud t2i.
metadata:
  version: "0.3.0"
  author: hydrilla
  engine: water
  token_class: worker-orch
compatibility: job.submit, job.await; Water adapters; Water agent only.
---

# water-generate-3d

## When to use

After route (+ preprocess if needed). **Only** Water generate skill.

## Behavior

- `job.submit` / `job.await` via selected BYOK adapter  
- Steal lifecycle patterns from skills.sh keepers (Meshy poll/SSE, fal async) — fold as workers, not new skill IDs  
- Export GLB URI; checkpoint `generate`  
- eve park during long provider jobs  

## Forbidden

- Calling BlueFox/Pixal from Water agent  
- Letting Meshy/Tripo **own bake**  
- Copying `cloud-t2i` / `cloud-run-pixal` prompts wholesale  
- Three.js factory as default Water GLB Create (optional later preview skill only)

## Hard rule

**Never Pixal / Cloud Trellis.** Adapters: Meshy / Tripo / fal / Rodin only inside Water.
