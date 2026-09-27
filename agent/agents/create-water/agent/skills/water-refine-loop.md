---
description: >-
  Load when water-evaluate rejects with a retryable defect and you must decide whether to
  retry and where to re-enter. Also load whenever you are about to retry anything, or
  whenever switching to the other engine starts to look like a fix — it is forbidden.
  Not a generate skill.
---

# water-refine-loop

Coordinates retries. Produces nothing itself.

## Caps (enforced on the JobCard, not in memory)

- ≤ **3** refine attempts per stage.
- ≤ **6** total per job.
- Stop on: success · repeated identical defect · plateau **Δ < 0.02** · ceiling reached ·
  budget exhausted. BYOK budget is the customer's money — stop early rather than burn it.

## Re-entry — Water only

Re-enter `water-generate-3d`, `water-mesh-post`, or `water-evaluate` as the
`ScoreReport` directs. Bump `runId` whenever a generate or bake invalidates the
EvidenceManifest, and increment the stage `attempt`.

## Stop rules

1. Never schedule `water-evaluate` VLM or `water-bake` until `water-mesh-post` is green
   **on the new `runId`**.
2. A geometry HARD fail is fixed by remesh or regenerate, or the job is **rejected**. A
   VLM never overrides it.
3. **"Try BlueFox instead" is a forbidden engine switch.** So is "Cloud would handle this
   better", "let me re-run it on the other engine", and every other phrasing. There is no
   Cloud escape hatch. If Water cannot clear the floor within the caps, reject.
4. Switching `waterMode` is an intra-engine decision, not an escape — and `mesh` mode is
   deferred, so on a shipped job the only mode is `threejs`.
5. Profiles may only raise retry floors; never soften a floor mid-loop to close a job.
6. Prefer an honest reject over spending the remaining budget on a defect that has not
   moved.
