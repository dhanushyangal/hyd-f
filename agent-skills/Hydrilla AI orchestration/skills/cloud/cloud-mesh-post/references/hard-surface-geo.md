# Hard-surface geo gate — symmetry + hard edges (Car-class)

Zero LLM. After GLB download; before bake/score.

## HARD

| Check | Fail |
|-------|------|
| Floaters under chassis / orphan wheel blobs | FLOATER |
| Non-manifold body/glass after remesh budget | NON_MANIFOLD |
| Car bbox longest edge outside [0.5 m, 12 m] (unless override) | SCALE |
| Prop class outside [0.05 m, 5 m] | SCALE |
| NaNs / empty mesh | NAN |

## Symmetry (vehicle)

| Check | Action |
|-------|--------|
| L/R wheel count mismatch | HARD |
| Bilateral body panel / wheel well parity beyond threshold | quality fail; balanced warn |
| Cabin/grille centerline drift | warn / fail on quality |

## Hard-edge defend

- Prefer remesh that preserves sharp creases (panel gaps, wheel arches) — do not over-smooth into organic blob.
- AutoRemesher MIT default; if crease loss, remesh params retry once, then BYOK remesh escalate (never Meshy bake).

## Soft / profile

| Check | Action |
|-------|--------|
| Wheels intersecting ground or hover >2% height | fail or escalate |
| Glass opaque slab despite needs_transparency | flag to score material QA |
| Tris after remesh | see route-and-estimate/references/class-poly-budgets.md |

## Do not

Thumbnail-only approve; VLM override HARD; GeometryPack GPL default.
