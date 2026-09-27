---
name: cloud-mesh-post
description: >-
  Use when a Cloud Pixal GLB must pass geometric HARD gates (and optional
  AutoRemesher) before bake or score. Zero aesthetic VLM. Not generate.
metadata:
  version: "0.3.1"
  author: hydrilla
  engine: cloud
  token_class: judge
compatibility: mesh.post.gate; Cloud agent only.
---

# cloud-mesh-post

## When to use

Immediately after `cloud-run-pixal` export; **before** `cloud-bake` / `cloud-evaluate`. Skipping on Create paths is **illegal**.

## Tool sequence

1. `mesh.post.gate` (worker/CLI — skill only judges)
2. Optional AutoRemesher (MIT) → re-gate
3. `run.checkpoint` — mark `mesh_post`

## HARD fail (numbers unchanged)

- Non-empty GLB + normals; 0 non-manifold; self-intersection HARD
- Finite bounds; +Y grounded normalize
- Tri: draft ≤50k; game_ready tiers via later `cloud-bake`
- Thin-shell / floater rules for glass-liquid props
- Turntable prep orbits 0/90/180/270; orbit area ratio ≥0.15 (collapse below → fail)

## Gwen must-fold (IMG2THREEJS_DELTA)

See [img2threejs-must-fold.md](./references/img2threejs-must-fold.md).

1. **Asset class** comes from JobCard/compile contract — never infer from filename/keywords.
2. **Profiles only RAISE floors** — `vehicle` / `prop-hero` may raise HARD bars above draft; draft cannot inherit hero floors without explicit profile.
3. **Stage-aware:** this skill must HARD-pass before bake-channel QA or evaluate VLM; do not run bake gates on draft path.
4. Specialty geo packs (Car) apply when `class=vehicle` — not always-on.
5. Mechanical checks = workers; this skill routes/judges only.
6. Adapter assists (depth/FOV) require provenance on JobCard; **never** grant ship pass.
7. Does not promote — geo only. Objectness/microscope live in `cloud-evaluate`.

## Rule

No aesthetic VLM here. No factory theater. Engine = Cloud only.

## Prior pack references

- [hard-surface-geo.md](./references/hard-surface-geo.md)
- [prop-geo-rules.md](./references/prop-geo-rules.md)
- [remesh.md](./references/remesh.md)
- [quality-bar.md](./references/quality-bar.md)
- [img2threejs-must-fold.md](./references/img2threejs-must-fold.md)
