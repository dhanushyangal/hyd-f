---
description: >-
  Load at the root of any Cloud Create session, and again on every resume, to drive the
  JobCard stage machine — which stage runs next, when to park, and how to recover after a
  crash or a long GPU wait. Also load whenever job state is unclear; the card is the only
  answer.
---

# cloud-run-job

Root orchestration. The JobCard is **total state**; chat is never job state.

## Stage order

```
cloud-compile-prompt → cloud-route-estimate → [cloud-t2i] → cloud-preprocess-ref
  → cloud-run-pixal → cloud-mesh-post → [cloud-bake] → cloud-evaluate → [cloud-refine-loop]
```

Every stage exists on the card from creation. A stage moves
`pending → running → (done | skipped | failed)`. Refine re-entry resets it to `running`
with `attempt + 1`.

## Tools

`run.checkpoint` — the **only** writer of stage truth. Idempotent per
`(jobId, runId, stageId, attempt)`.

## Checkpoint rules

1. `skipped` without a `skipReason` is rejected.
2. `failed` without at least one fail code is rejected.
3. Advancing past `cloud-mesh-post` while it is not `done` is rejected.
4. `next` must name a stage that exists on the card.
5. `cloud-mesh-post` and `cloud-evaluate` can never be `skipped`.

## Park and resume

- Park on `job.await` and on long bakes. eve checkpoints the step and resumes on the
  terminal webhook.
- Resume = load the card → first stage not `done`/`skipped` → run it. Never re-run a
  `done` stage. Never replay chat.
- A resumed job keeps its `runId` unless the resumed stage mints a new one (remesh,
  bake, refine).

## Forbidden

Firstmate as the runner · chat as job state · any engine switch · loading a Water skill ·
promoting from anywhere but `cloud-evaluate`.
