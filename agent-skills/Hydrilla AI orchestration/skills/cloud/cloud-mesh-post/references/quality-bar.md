# mesh-post-gate — quality bar

Source: [docs/QUALITY_BAR_IMG2THREEJS.md](../../../../docs/QUALITY_BAR_IMG2THREEJS.md) (Gwen). Scripts: `geometry_integrity.py`, `self_intersection.py`, `turntable_gate.py`.

## Hard fails (0 LLM tokens; scripts only) — Ben lock 2026-09-05

| Check | Rule |
|-------|------|
| `geometry_integrity` | non-empty GLB + normals; **0 non-manifold**; watertight per profile; finite bounds; +Y grounded normalize |
| `self_intersection` | **HARD fail** if self-intersecting |
| turntable collapse | 0/90/180/270 orbit area ratio **≥ 0.15** (fail if collapsed) |
| draft tri budget | draft **≤ 50k** before remesh attempt (game_ready tiers owned by bake) |
| subject AABB | **nonzero volume only** for now (min AABB TBD when gate CLIs ship) |
| NaN / Inf verts | any → hard fail |

**token_class: judge; 0 LLM.** Hard geo fail → **never** VLM-rescued. Blocks `mesh.bake` and promote.
