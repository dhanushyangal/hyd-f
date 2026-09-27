---
description: >-
  Load at the very start of any Cloud Create job, before routing or spending credits,
  to turn raw user text and optional reference images into a CompiledPrompt. Also load
  when deciding whether a request must be refused (characters, humanoids, faces, hair,
  creatures) or whether text-only input needs t2i. Not for routing, generating, or
  scoring.
---

# cloud-compile-prompt

First brain step on every Cloud path. Produces exactly one `CompiledPrompt` per user
turn, consumed by `cloud-route-estimate`.

## Tools

1. `prompt.compile` — once per user turn.
2. `run.checkpoint` — stage `cloud-compile-prompt`.

## Emit

- `subject`, `parts[]`, `materials[]`, `scale_m`, `ground_contact`, `style_lock`.
- **geo_brief** and **tex_brief** kept separate — geometry intent is not texture intent.
- **t2i prompt** text: single object, clear silhouette, neutral/studio lighting, no mesh
  jargon, no characters.
- **i2_3d intent** tags for Pixal: `poly_budget_hint`, transparency and thin-shell flags.
- `needs_t2i` signal for routing (text-only input ⇒ true).
- Declared `assetClass` — `prop` | `vehicle` | `prop-hero`.

## Rules

- Single primary object. Meters. +Y up implied for the GLB.
- **Asset class is declared from the contract.** Never infer it from a filename, a path,
  or prompt keywords — keyword detection silently applies specialty floors.
- Engine is never chosen here. The session is already `engine=cloud`.
- Never emit Three.js factory language; Cloud delivers a mesh.

## HARD-REFUSE → `ok:false` + `refuse_reason`

Characters · humanoids · people · faces · hair · creatures · NSFW or prohibited content ·
"make it a Three.js scene instead" · "switch to Water". Refuse and stop — do not compile
a softened variant.

Depth: `agent-skills/Hydrilla AI orchestration/skills/cloud/cloud-compile-prompt/`
(`prompt-contract.md`, `hard-surface-compile.md`, `hydrilla-prop-compile.md`,
`quality-bar.md`).
