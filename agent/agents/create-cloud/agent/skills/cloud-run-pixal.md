---
description: >-
  Load for the Cloud generate stage, after an image has been admitted (or preprocess was
  skipped with a reason), to submit and await Pixal3D image→3D and capture the GLB. This
  is the ONLY Cloud generate path — load it whenever geometry must be produced. Not
  bake, not scoring, not promote.
---

# cloud-run-pixal

Pixal3D = BlueFox 1 = Trellis = persisted `trilles`. One backbone, one host, one
generate skill.

## Tools

1. `job.submit` — `adapter: "pixal3d"`, `kind: "image_to_3d"`, compiled i2_3d intent +
   admitted image URI.
2. `job.await` — poll/webhook until terminal. **Park the session here.** No model turns
   while waiting.
3. `run.checkpoint` — stage `cloud-run-pixal`, artifact = GLB URI, new `runId`.

## Rules

- Output is **mesh/GLB** (`result_kind=glb`). Never describe this as Three.js factory
  generation.
- Download and checkpoint the GLB immediately on terminal; a URL that expires is not
  evidence.
- `structure → shape → texture` is worker configuration, not skill branching.
- Mint a new `runId` on each generate — it invalidates prior evidence by design.

## Forbidden

- Submitting Meshy / Tripo / fal / Rodin or any BYOK adapter.
- Switching engine mid-job.
- Skipping the image requirement when the pipeline mandated t2i → i2_3d.
- Calling bake or score from here. **This stage never promotes.**
- Any in-process Comfy runtime.

Depth: `agent-skills/Hydrilla AI orchestration/skills/cloud/cloud-run-pixal/`
(`job-contract.md`, `job-hooks.md`, `resume.md`).
