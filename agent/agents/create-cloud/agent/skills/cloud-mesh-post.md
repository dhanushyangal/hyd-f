---
description: >-
  Load immediately after a Cloud GLB exists, before bake or evaluate, to run the
  deterministic geometry HARD gate and optional remesh. Also load whenever you are
  tempted to score, bake, or promote a mesh that has not passed geometry — it must pass
  first. Zero aesthetics, zero VLM, never skippable.
---

# cloud-mesh-post

The quality layer. Everything downstream is illegal until this is `done`.

## Tools

1. `mesh.post.gate` — worker runs the checks; this skill only routes and judges.
2. Optional AutoRemesher (MIT) on fail, behind the same tool ⇒ re-gate **once**, new
   `runId`.
3. `run.checkpoint` — stage `cloud-mesh-post`, artifact = `gate_report`.

## HARD fail conditions

| Check | Bar | Fail code |
|---|---|---|
| Non-empty GLB | required | `EMPTY_GLB` |
| Normals present | required | `NO_NORMALS` |
| Non-manifold edges | **0** | `NON_MANIFOLD` |
| Self-intersection | none | `SELF_INTERSECT` |
| Finite bounds | required | `NAN_BOUNDS` |
| +Y grounded normalize | required | `NOT_GROUNDED` |
| Triangles (draft) | ≤ **50 000** | `TRI_BUDGET` |
| Floaters / thin shell | per class (glass-liquid props) | `FLOATER` / `THIN_SHELL` |
| Orbit area ratio at 0/90/180/270 | ≥ **0.15** | `ORBIT_COLLAPSE` |

## Rules

- **No aesthetic VLM here.** Geometry only. Objectness and microscope patches belong to
  `cloud-evaluate`.
- **Asset class comes from the JobCard compile contract**, never from a filename.
- **Profiles only RAISE bars.** `vehicle` / `prop-hero` may raise above draft; draft
  never inherits hero floors without an explicit profile.
- Specialty geo packs (Car) apply only when `class=vehicle` — not always-on.
- Adapter assists (depth / FOV) require provenance on the JobCard and **never** grant a
  ship pass.
- **This stage never promotes.** It fails closed: a failing mesh does not ship.
- Skipping on a Create path is **illegal** — the checkpoint will be rejected.

Depth: `agent-skills/Hydrilla AI orchestration/skills/cloud/cloud-mesh-post/`
(`hard-surface-geo.md`, `prop-geo-rules.md`, `remesh.md`,
`img2threejs-must-fold.md`, `quality-bar.md`).
