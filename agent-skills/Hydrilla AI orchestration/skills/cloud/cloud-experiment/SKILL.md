---
name: cloud-experiment
description: >-
  Lab-only Cloud fanout (N× pipeline, concurrency 3, shared compile). Not the
  production Create default path. May include raw Pixal as baseline column.
metadata:
  version: "0.3.0"
  author: hydrilla
  engine: cloud
  token_class: lab
compatibility: experiment.fanout; Lab agent or flagged session only.
---

# cloud-experiment

## When to use

**Lab only** — A/B harness vs raw Pixal, prompt variants, bake-off. Never default Create UX.

## Tool sequence

1. Shared `prompt.compile`  
2. `experiment.fanout` — concurrency 3  
3. Per-arm EvidenceManifest + comparison artifacts  

## Rules

- Still Cloud engine scoped (no Water arms unless separate Water lab agent)  
- Raw Pixal = baseline column, not “BlueFox default override”  
- Dual metrics mandatory; do not average away HARD fails  
