---
name: cloud-run-job
description: >-
  Durable JobCard stage machine for the Cloud Create DAG. Parks during GPU
  workers; resumes from JobCard next — not chat. eve session brain entrypoint.
metadata:
  version: "0.3.0"
  author: hydrilla
  engine: cloud
  token_class: router
compatibility: run.checkpoint; eve durability; Cloud agent only.
---

# cloud-run-job

## When to use

Root orchestration for a Cloud Create job session.

## Stage order (Cloud)

`compile → estimate → route → t2i → preprocess → generate(i2_3d) → mesh_post → bake? → export → render_views → score → done`

Illegal to skip `generate` or `mesh_post` on Create paths.

## Behavior

- Maintain JobCard total state (`docs/JOB_CARD.md`)  
- Invoke engine-scoped skills in order  
- Park eve session on `job.await` / long bake; resume via webhook/`next`  
- Attach EvidenceManifest pointer on score  

## Forbidden

Firstmate as runner; chat replay as state; engine switch; Water skills.
