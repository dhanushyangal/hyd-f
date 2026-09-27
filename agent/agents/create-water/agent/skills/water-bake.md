---
description: >-
  Load on a Water job when profile=game_ready, or when the geometry gate reported NO_UV,
  after water-mesh-post has passed — to run Hydrilla's own bake worker for UVs and PBR
  channels. Also load whenever a provider is proposed as the baker. Not generate, not
  scoring.
---

# water-bake

## When

`profile=game_ready`, or `gate_report` contains `NO_UV`, **and** `water-mesh-post` is
`done`. Otherwise skip with `skipReason="profile!=game_ready"`.

Bake is a card stage only on the deferred `water-mesh` mode; on the shipped `threejs`
mode treat it as guidance and do not checkpoint a stage the card does not carry.

## Tools

1. `mesh.bake` — the **same Hydrilla worker Cloud uses**: reduce → UV unwrap → bake →
   pack → channel QA.
2. `run.checkpoint` — artifacts = GLB + map URIs + `bake_report`, new `runId`.

## Rules

- **Hydrilla owns bake.** Meshy, Tripo, fal, and Rodin never own it. Their remesh or
  texture options are generation features, not a bake.
- Needle is a feature-flagged sidecar only, never the default.
- Bake-channel QA is **stage-aware**: never before `water-mesh-post` passes, never on the
  draft path.
- A new `runId` is minted here, so all earlier turntables and sheets become stale.
