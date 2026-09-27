---
name: cloud-run-pixal
description: >-
  Use on Cloud as the ONLY generate path: submit/poll Pixal3D image→3D after an
  admitted image. Produces mesh/GLB. Not text-only bypass, not Water BYOK, not bake.
metadata:
  version: "0.3.0"
  author: hydrilla
  engine: cloud
  token_class: worker-orch
compatibility: job.submit, job.await; adapters-bluefox / Pixal; Cloud agent only.
---

# cloud-run-pixal

## When to use

Cloud generate stage after preprocess (or valid skip). **Only** Cloud generate skill.

## Tool sequence

1. `job.submit` — BlueFox/Pixal image→3D with compiled i2_3d intent + image URI  
2. `job.await` — poll/SSE until terminal (eve may park session)  
3. `run.checkpoint` — mark `generate` + GLB URI

## Product language

- Output = **mesh/GLB** from Pixal (`result_kind=glb`).  
- Do **not** describe this as Three.js factory generation.  
- Three.js viewers may load the GLB later for evidence — not this skill’s job.

## Forbidden

- Meshy/Tripo/fal submit from Cloud agent  
- Engine switch mid-job  
- Skipping image requirement when pipeline mandated t2i→i2_3d  
- Calling bake or score here  

## Hands vs brain

This skill orchestrates; Pixal worker is hands. No Comfy runtime in-process.

## Rules (deepen)

- Submit **Pixal/Cloud only** — never Meshy/Tripo as Cloud generate.
- No LLM poll on `job.await`.
- Download GLB immediately; checkpoint via JobCard.
- structure→shape→texture lives in **worker config**, not skill branches.

## Prior pack references (v0.2.3)

- [job-hooks.md](./references/job-hooks.md)
- [job-contract.md](./references/job-contract.md)
- [resume.md](./references/resume.md)
