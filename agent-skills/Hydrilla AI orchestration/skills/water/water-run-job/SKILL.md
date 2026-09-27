---
name: water-run-job
description: >-
  Durable JobCard stage machine for Water Create DAG. eve park/resume during
  BYOK GPU/provider waits. Not Firstmate, not Cloud Pixal DAG.
metadata:
  version: "0.3.0"
  author: hydrilla
  engine: water
  token_class: router
compatibility: run.checkpoint; Water agent only.
---

# water-run-job

Stages: `compile → estimate → route → [t2i skip usual] → preprocess? → generate(BYOK) → mesh_post → bake? → export → render_views → score → done`

Note: Water typically skips Cloud t2i stage (`skipReason`) unless a Water-specific text→image helper is productized — do not import `cloud-t2i`.
