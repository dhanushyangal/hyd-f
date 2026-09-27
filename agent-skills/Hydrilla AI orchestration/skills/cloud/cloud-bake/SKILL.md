---
name: cloud-bake
description: >-
  Use on Cloud when profile=game_ready after mesh-post HARD pass. Runs Hydrilla
  own bake worker (reduce→uv→bake→pack→qa). Needle CLI feature-flag only.
  Not Meshy bake, not score.
metadata:
  version: "0.3.0"
  author: hydrilla
  engine: cloud
  token_class: worker-orch
compatibility: mesh.bake; Cloud agent only.
---

# cloud-bake

## When to use

`profile=game_ready` and mesh-post passed. Else skip with `skipReason=profile!=game_ready`.

## Tool sequence

1. `mesh.bake` — own worker  
2. `run.checkpoint` — mark `bake` + map URIs  

## Rules

- Default bake = **Hydrilla own**.  
- Needle = **feature flag** sidecar only — never default.  
- Meshy must not own bake.  
- Output remains GLB + PBR maps for production handoff.
