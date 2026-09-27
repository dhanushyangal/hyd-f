---
description: >-
  Load at the very start of any Water Create job, before routing or spending the
  customer's BYOK budget, to turn raw text and optional references into a CompiledPrompt
  and a provider-agnostic brief. Also load when deciding waterMode, or when a request
  asks for a real person's likeness. Not routing, generating, or scoring.
---

# water-compile-prompt

First brain step on every Water path. One `CompiledPrompt` per user turn.

## Tools

1. `prompt.compile` — engine `water`.
2. `run.checkpoint` — stage `water-compile-prompt`.

## Emit

- `subject`, `parts[]`, `materials[]`, `scale_m`, `ground_contact`, `style_lock`.
- **geo_brief** and **tex_brief** kept separate.
- Declared `assetClass` — `prop` | `vehicle` | `prop-hero`.
- `waterMode` intent: `threejs` (shipped, `result_kind=three_factory`) or `mesh`
  (deferred, `result_kind=glb`). Choosing a mode is **not** an engine switch.
- `needs_t2i` only if a deferred mesh adapter would require a reference image.

## Rules

- **Asset class is declared from the contract** — never inferred from a filename, a
  path, or prompt keywords.
- Engine is never chosen here. The session is already `engine=water`.
- Never embed Cloud pipeline language. Water does not mandate text→image → image→3D.
- Characters are **allowed, stylized only**. Emit an explicit non-photoreal style lock.

## HARD-REFUSE → `ok:false` + `refuse_reason`

Photoreal human likeness · a real, identifiable, or famous person · a reference photo of
a real person · NSFW or prohibited content · any request to run this on Cloud.

Depth: `agent-skills/Hydrilla AI orchestration/skills/water/water-compile-prompt/`.
