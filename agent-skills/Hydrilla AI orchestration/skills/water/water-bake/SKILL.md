---
name: water-bake
description: >-
  Use on Water game_ready profiles after HARD mesh-post. Hydrilla own bake
  worker only; Needle flag-only; providers never own bake.
metadata:
  version: "0.3.0"
  author: hydrilla
  engine: water
  token_class: worker-orch
compatibility: mesh.bake; Water agent only.
---

# water-bake

`mesh.bake` own pipeline. Skip if profile ≠ game_ready. Meshy/Tripo remesh ≠ bake.
