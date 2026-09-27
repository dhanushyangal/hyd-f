# Prop geo rules — fish-tank checklist

## Checklist (HARD unless noted)

| Check | Fail if |
|-------|---------|
| Manifold glass shell | any non-manifold edge/vert on `glass_*` |
| Min wall thickness | below compile thickness_mm hint (or <1 mm default) after scale |
| Water ∩ glass | water volume intersects glass inner surface beyond epsilon |
| Floaters | disconnected components inside tank AABB (debris) |
| Scale | longest bbox edge ∉ [0.05 m, 5 m] (prop class; job card may override) |
| Self-intersection | any (Ben lock) |
| Draft tris | >50k before remesh attempt |
| Silhouette | remesh must preserve outer glass silhouette (soft metric → remesh retry) |

## Remesh

AutoRemesher MIT default toward **10–30k** for draft/balanced. GeometryPack GPL sidecar-only ([remesh.md](./remesh.md)). Preserve thin-shell intent — do not collapse walls to zero thickness.

## After BYOK gen

Verify `face_limit` / poly vs route; do not trust provider "game-ready" claims without this gate.
