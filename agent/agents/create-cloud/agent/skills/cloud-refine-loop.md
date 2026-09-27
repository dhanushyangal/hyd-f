---
description: >-
  Load when cloud-evaluate rejects with a retryable defect and you must decide whether to
  retry and where to re-enter the pipeline. Also load whenever you are about to retry
  anything — the caps and stop conditions live here. Not a generate skill.
---

# cloud-refine-loop

Coordinates retries. Produces nothing itself.

## Caps (enforced on the JobCard, not in memory)

- ≤ **3** refine attempts per stage.
- ≤ **6** total per job.
- Stop on: success · repeated identical defect · plateau **Δ < 0.02** · ceiling reached ·
  budget exhausted.

## Re-entry

Re-enter `cloud-t2i`, `cloud-preprocess-ref`, `cloud-run-pixal`, `cloud-mesh-post`, or
`cloud-evaluate` as the `ScoreReport` directs — **Cloud only**. Bump `runId` whenever a
generate or bake invalidates the EvidenceManifest, and increment the stage `attempt`.

## Stop rules

1. Never schedule `cloud-evaluate` VLM or `cloud-bake` until `cloud-mesh-post` is green
   **on the new `runId`**.
2. A geometry HARD fail is fixed by remesh or regenerate, or the job is **rejected**. A
   VLM never overrides it.
3. An objectness probe or microscope request from evaluate is a targeted refine
   instruction, not a pass grant.
4. Profiles may only raise retry floors; never soften a floor mid-loop to close a job.
5. Fidelity-adapter hints need provenance on the JobCard; an adapter score is never a
   ship signal.
6. **Never switch to Water.** There is no cross-engine retry.
7. Prefer an honest reject over burning the remaining budget on a defect that has not
   moved.
