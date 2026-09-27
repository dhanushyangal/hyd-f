---
description: >-
  Load on a Cloud job when profile=game_ready, or when the geometry gate reported NO_UV,
  after cloud-mesh-post has passed — to run Hydrilla's own bake worker for UVs and PBR
  channels. Also load when someone proposes letting a third party "bake" the asset.
  Not generate, not scoring.
---

# cloud-bake

## When

`profile=game_ready`, or `gate_report` contains `NO_UV`, **and** `cloud-mesh-post` is
`done`. Otherwise skip with `skipReason="profile!=game_ready"`.

## Tools

1. `mesh.bake` — Hydrilla's own worker: reduce → UV unwrap → bake → pack → channel QA.
2. `run.checkpoint` — stage `cloud-bake`, artifacts = GLB + map URIs + `bake_report`,
   new `runId`.

## Output

GLB plus real PBR channels — albedo, metalness, roughness, normal — at the game_ready
tier for the profile. `NO_UV` triggers a bake, never a silent pass.

## Rules

- **Hydrilla owns bake.** Meshy, Tripo, and any generation provider must not own it; a
  provider's remesh or "PBR" toggle is not a bake.
- Needle is a feature-flagged sidecar only, never the default.
- Bake-channel QA is **stage-aware**: it never runs before `cloud-mesh-post` passes, and
  never on the draft path.
- A new `runId` is minted here, so all earlier turntables and sheets become stale.

Depth: `agent-skills/Hydrilla AI orchestration/skills/cloud/cloud-bake/`
(`pbr-map-expectations.md`, `material-slot-qa.md`, `glb-compress-notes.md`).
