---
name: water-route-estimate
description: >-
  Use after Water compile to estimate credits and select BYOK adapter/profile
  inside Water only (Meshy/Tripo/fal/…). Never routes to Pixal/BlueFox or
  switches engines.
metadata:
  version: "0.3.0"
  author: hydrilla
  engine: water
  token_class: router
compatibility: run.estimate, run.route; Water agent only.
---

# water-route-estimate

## Tool sequence

1. `run.estimate` — hard stop if not ok  
2. `run.route` with `engine: "water"` — echo; confidence ≥0.82  
3. `run.checkpoint`

## Rules

- Adapter pick **inside Water** only.  
- May estimate fal/Meshy/Tripo costs — never swap to Cloud.  
- License tags / paid-call discipline from harness refs.  
