# Hard-surface / Car-class compile pack (Create v1)

**Scope:** docs/CREATE_V1_SCOPE.md — props and vehicles only.

## Hard refuse (v1 — not stylized defer)

Compile returns ok:false with refuse_reason for primary subject that is:

- character / humanoid / superhero (including Thor)
- creature / animal-as-core
- face / headshot / hair-as-primary
- cape / costume anatomy as primary deliverable

No stylized exception in v1. Point user to prop or vehicle instead.

## Required fields (vehicle)

| Field | Rule |
|-------|------|
| subject | One car or hard-surface prop |
| parts[] | body, wheel_fl/fr/rl/rr, glass_*, lights, grille; chrome trim / mirrors if visible |
| materials[] | paint (basecolor + metal low-mid + clearcoat), glass (transmission/ior~1.5), rubber (tires, metal 0), chrome (metal~1, rough low) — never fuse paint into glass |
| scale_m | Real meters (sedan length ~4.2-4.8) |
| ground_contact | true — all wheels on ground |
| forward_axis | state -Z or +Z convention for export |
| style_lock | product / hard-surface; no showroom scene |
| tags | needs_transparency if glass; asset_role hero|mid|scatter; poly_budget_hint; class=vehicle|prop |

## Geo vs texture

- Geo brief: silhouette, wheel arches, cabin volume, ground clearance — no paint adjectives.
- Texture brief: paint color, clearcoat, glass tint, rubber, chrome — separate.

## Also refuse

Full scenes, multi-car lots, interior-only cockpit, logo/plate text, CAD-exact mm, factory createModel as primary.

## Sibling

Glass/liquid props: hydrilla-prop-compile.md
