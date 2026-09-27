# JobCard protocol helper

**Canonical:** `/workspace/hydrilla-harness/docs/JOB_CARD.md`  
**Package:** `@hydrilla/harness-contracts`

## Skill duty

All Create skills update session via `run.checkpoint` only (mark + next + optional skipReason). Do not invent parallel state files in chat.

## Cloud vs Water

Same stage enum; `engine` field is immutable for the job. Stage `generate` means Pixal i2_3d on Cloud and BYOK on Water — different skills, same stage name.

## Illegal skips

Never skip `generate` or `mesh_post` on Create paths.
