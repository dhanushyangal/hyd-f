# Prop score rubric (mesh-file — Hydrilla Create)

**Engine:** GLB only. Never average with a factory/CSG score.

## Axes (fish-tank-class exemplar)

| Axis | Pass | Fail |
|------|------|------|
| Silhouette | Readable at 0/90/180/270 | Collapsed blob / missing enclosure |
| Glass | Reads transparent/refractive intent; not chalky opaque white | Painted plastic “glass” |
| Liquid | Waterline / fill present when `needs_liquid_volume` | Liquid baked into glass albedo |
| Ground | Contact / no hover | Floating tank |
| Scale | Matches compiled `scale_m` (±20% prop class) | Toy vs room-scale mismatch |
| Parts | Named glass/water/substrate where tagged | Single mush mesh, no part intent |

## Provenance (from asset-role / adapters)

Manifest should record: provider, model/version, seed (if any), cost estimate, artifact path — reject promote if evidence incomplete (see EVIDENCE_MANIFEST).

## Floors (unchanged)

draft continue ≥0.70 · balanced complete ≥0.80 · quality/game_ready ≥0.85 + features.
