# Hydrilla prop compile — fish-tank class

Exemplar for glass / liquid / thin-shell props. Apply the same field discipline to similar assets (vases, bottles, aquariums, display cases).

## Required CompiledPrompt fields

| Field | Rule |
|-------|------|
| `subject` | One primary object (e.g. rectangular hobby aquarium with gravel and water) |
| `parts[]` | Named parts: `glass_*`, `frame_*`, `water_*`, `gravel_*` — never fuse liquid into glass |
| `materials[]` | Per-part: transmission/ior for glass; separate liquid albedo/roughness; no "clear plastic" for glass |
| `scale_m` | Real-world meters; hobby tank length default **0.3–0.6** unless user specifies |
| `ground_contact` | true for freestanding props; false only if hanging/mounted and stated |
| `style_lock` | Art style + refuse drift tags |
| inject tags | `needs_transparency`, `needs_thin_shell`, `needs_liquid_volume`, `poly_budget_hint` |

## Worked example — hobby fish tank

```text
subject: hobby rectangular glass aquarium with water and gravel base
parts:
  - glass_walls (shell, thickness_mm: 4–6)
  - glass_bottom
  - water_volume (fill_pct: 85, waterline visible)
  - gravel_bed
materials:
  - glass_*: transmission + ior≈1.5, not opaque white, not plastic
  - water_*: separate liquid; never painted into glass albedo
  - gravel_*: opaque PBR
scale_m: { length: 0.45, height: 0.28, depth: 0.25 }  # +Y up GLB
ground_contact: true
style_lock: realistic product/prop, no logos, no room scene
tags: needs_transparency, needs_thin_shell, needs_liquid_volume, poly_budget_hint=hero
```

## Failure classes (Tripo/Meshy heuristics — MIT adapted)

| Class | Why it fails gen | Compile action |
|-------|------------------|----------------|
| Text logos / fine labels on glass | Generators smear glyphs into albedo | Refuse logos; strip typography from prompt |
| Thin lattices / fine bars | Non-manifold / broken shells | Prefer solid frame + thick glass; tag `needs_thin_shell` |
| Transparent / refractive as albedo | Glass reads chalky opaque | Force transmission/ior language; `needs_transparency` |
| Liquid baked into glass | No waterline; wrong refraction | Separate `water_*` part + fill % |
| Full room / multi-object scene | One-subject models collapse | Refuse; ask for single primary prop |
| CAD-exact tolerances | Generative ≈ not measured | Refuse exact mm manufacturing claims |

## Attribution

Failure-class heuristics adapted from calesthio/generative-media-skills `meshy-3d` / `tripo-3d` (MIT). Fish-tank field rules are Hydrilla product law.
