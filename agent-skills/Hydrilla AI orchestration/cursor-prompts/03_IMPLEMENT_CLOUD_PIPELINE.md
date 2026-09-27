# Cursor prompt — Implement Cloud pipeline (t2i → i2_3d exact)

## Task

Implement Cloud DAG workers + skill wiring:

```
cloud-compile-prompt
  → cloud-route-estimate (needs_t2i)
  → cloud-t2i (text→image worker)
  → cloud-preprocess-ref (BiRefNet admission)
  → cloud-run-pixal (Pixal image→3D submit/poll)  // ONLY generate
  → cloud-mesh-post
  → cloud-bake? (profile)
  → cloud-evaluate
  → cloud-refine-loop?
```

## Requirements

- Text-only Cloud jobs must not skip t2i when `needs_t2i=true`.
- `cloud-run-pixal` uses `packages/adapters-bluefox` / Pixal — mesh/GLB out.
- JobCard stages match `/workspace/hydrilla-harness/docs/JOB_CARD.md`.
- eve parks during Pixal await.
- No Three.js factory generate; viewers only for later evidence.

## Prior code to reuse

- `packages/job-runner`, `packages/prompt-compiler`, `packages/adapters-bluefox`
- Prior skill refs under `packages/agent-skills/skills/run-3d-job/` (Cloud parts only)
