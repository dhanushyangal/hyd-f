# Cursor prompt — Implement quality gates & evaluator

## Task

1. Wire `cloud-mesh-post` / `water-mesh-post` to `mesh.post.gate` + AutoRemesher MIT; port thresholds from `QUALITY_BAR_IMG2THREEJS.md` + `data/img2threejs-extract/gates/`.
2. Wire `*-evaluate` to `asset.render_views` + `asset.score` with **one** comparison sheet (`make_comparison_sheet` discipline).
3. EvidenceManifest check before promote (`EVIDENCE_MANIFEST.md`).
4. `*-refine-loop` caps; VLM never overrides HARD fail.
5. Own `mesh.bake`; Needle flag-only.

## Skeptical QA checklist

HARD geo → Tier1 → one sheet → heuristics → optional VLM → promoteEligible.

Generator skills must not self-promote.
