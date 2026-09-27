---
description: >-
  Load for the Water generate stage, after routing, to produce the asset — the Three.js
  factory via the in-process harness on the shipped threejs mode, or a BYOK adapter
  submit/await on the deferred mesh mode. This is the ONLY Water generate path. Not
  bake, not scoring, not promote.
---

# water-generate-3d

## Mode `threejs` — shipped, first-class

Per `docs/DECISIONS_LOCKED.md` **D1** this is not a preview and not legacy. Generation
runs as in-process harness passes in the Hydrilla backend: planner → SculptSpec +
quality contract → locked passes → generator ≠ evaluator → deterministic code gates →
fallback. There is no GPU adapter and no `job.submit` on this mode.

- `result_kind = three_factory`, plus an exported GLB for gating and handoff.
- The exported GLB — not the sandbox preview — is what `water-mesh-post` judges.
- Checkpoint stage `water-generate-3d` with the factory code reference and the exported
  GLB URI. Mint a new `runId`.

## Mode `mesh` — deferred (Phase 7)

BYOK adapters only: Meshy, Tripo, fal, Rodin. `job.submit` with the customer's key held
**server-side in the Hydrilla backend**, then `job.await` — **park the session**, no
model turns while waiting. Provider lifecycle quirks (Meshy poll/SSE, fal async) are
worker concerns, never new skill ids and never new tool ids.

## Forbidden

- Calling Pixal3D / BlueFox / Trellis. They do not exist on this agent.
- Letting Meshy, Tripo, fal, Rodin, or Needle **own bake** — a provider remesh or "PBR"
  toggle is not a bake.
- Reading or forwarding the customer's BYOK key. It stays in the backend.
- Promoting from here. Generator never promotes.
- Switching engines under any framing, including "the other engine would be faster".
