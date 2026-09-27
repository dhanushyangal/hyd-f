---
description: >-
  Load at the root of any Water Create session, and again on every resume, to drive the
  JobCard stage machine — which stage runs next, when to park, and how to recover after a
  crash or a long provider wait. Also load whenever job state is unclear; the card is the
  only answer.
---

# water-run-job

Root orchestration. The JobCard is **total state**; chat is never job state.

## Stage order (shipped `threejs` mode)

```
water-compile-prompt → water-route-estimate → water-generate-3d
  → water-mesh-post → water-evaluate → [water-refine-loop]
```

`water-t2i`, `water-preprocess-ref`, and `water-bake` become card stages only on the
deferred `water-mesh` mode. Do not checkpoint a stage the card does not carry — and
never import a Cloud t2i stage to fill the gap.

A stage moves `pending → running → (done | skipped | failed)`. Refine re-entry resets it
to `running` with `attempt + 1`.

## Tools

`run.checkpoint` — the **only** writer of stage truth. Idempotent per
`(jobId, runId, stageId, attempt)`.

## Checkpoint rules

1. `skipped` without a `skipReason` is rejected.
2. `failed` without at least one fail code is rejected.
3. Advancing past `water-mesh-post` while it is not `done` is rejected.
4. `next` must name a stage that exists on the card.
5. `water-mesh-post` and `water-evaluate` can never be `skipped`.

## Park and resume

- Park on `job.await` (mesh mode) and on long harness passes. eve checkpoints the step
  and resumes on delivery.
- Resume = load the card → first stage not `done`/`skipped` → run it. Never re-run a
  `done` stage. Never replay chat.
- Keep `partial: true` semantics from the harness: a partially complete pass is reported
  honestly, not upgraded to `done`.

## Forbidden

Firstmate as the runner · chat as job state · any engine switch · loading a Cloud skill ·
promoting from anywhere but `water-evaluate`.
