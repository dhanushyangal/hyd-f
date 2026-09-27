---
name: water-mesh-post
description: >-
  Use when a Water BYOK GLB must pass geometric HARD gates before bake/score.
  Provider remesh does not waive gates. Not VLM aesthetics.
metadata:
  version: "0.3.0"
  author: hydrilla
  engine: water
  token_class: judge
compatibility: mesh.post.gate; Water agent only.
---

# water-mesh-post

Same HARD discipline as Cloud (`IMG2THREEJS_DELTA.md`). AutoRemesher MIT default local remesh; BYOK retopo escalate only after local fail — still Water engine.

Illegal to skip on Create paths.
