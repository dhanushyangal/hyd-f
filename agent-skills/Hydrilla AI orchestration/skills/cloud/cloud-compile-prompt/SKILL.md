---
name: cloud-compile-prompt
description: >-
  Use when a Cloud (BlueFox/Pixal) Create job needs a CompiledPrompt from text
  and/or refs. Props/hard-surface Car-class only. Emits t2i prompt fields plus
  i2_3d intent tags. Not for characters, Water BYOK, mesh generate, or scoring.
metadata:
  version: "0.3.1"
  author: hydrilla
  engine: cloud
  token_class: router
compatibility: Hydrilla Run API prompt.compile; eve Create Cloud agent only.
---

# cloud-compile-prompt

## When to use

First brain step on every **Cloud** create/draft path. Produces one `CompiledPrompt` consumed by `cloud-route-estimate` → `cloud-t2i` / `cloud-preprocess-ref` → `cloud-run-pixal`.

## Inputs / outputs

| In | Out |
|----|-----|
| raw text, optional ref image URIs, profile hint | `CompiledPrompt` + inject tags |
| character / policy fail | `ok:false` + `refuse_reason` |

## Tool sequence

1. `prompt.compile` — once per user turn  
2. `run.checkpoint` — mark `compile`

## Rules

- **Create v1:** props/hard-surface (Car-class) only. **HARD-REFUSE** characters, creatures, faces-as-core, hair-as-core.
- Force structured fields: `subject`, `parts[]`, `materials[]`, `scale_m`, `ground_contact`, `style_lock`.
- Emit **t2i prompt** text suitable for studio/product ref (single object, clear silhouette, neutral lighting).
- Emit **i2_3d intent** tags for Pixal (geo brief ≠ texture brief; poly_budget_hint; transparency/thin-shell flags).
- Single primary object; meters; +Y up implied for GLB.
- **Asset class** from intent/contract fields — **never** infer from filename or keyword heuristics (Gwen must-fold #1).
- **Engine is never chosen here** — session already `engine=bluefox`.

## Stop / refuse

- Characters / Thor / humanoid-as-core  
- NSFW / prohibited content  
- Three.js factory as primary deliverable (redirect: Cloud delivers **mesh/GLB**)  
- Requests to switch to Water  

## References (harness — do not duplicate wholesale)

- `/workspace/hydrilla-harness/packages/agent-skills/skills/compile-3d-prompt/`
- `/workspace/hydrilla-harness/docs/CREATE_V1_SCOPE.md`

## Prior pack references (v0.2.3)

- [hard-surface-compile.md](./references/hard-surface-compile.md)
- [hydrilla-prop-compile.md](./references/hydrilla-prop-compile.md)
- [prompt-contract.md](./references/prompt-contract.md)
- [quality-bar.md](./references/quality-bar.md)

Do not reintroduce a shared Max-8 skill used for Water.
