# Prompt contract (Hydrilla)

## One object isolation

Compile describes **one** isolated prop: name, silhouette, construction materials, style, scale_m, orientation. Exclude ground plane, backdrop, extra props, labels, and lighting rigs from the generate brief.

## Geometry ≠ texture

When the Water adapter supports preview→refine (Meshy-class):

- **Geometry brief:** silhouette, parts, thickness, openings, waterline — no finish adjectives that belong on albedo.
- **Texture / material brief:** transmission, ior, roughness, color — applied in refine/texture stage or materials[].

Do not dump lighting/photography keywords into geometry prompts; they mainly affect albedo.

## Asset-role → inject (Hydrilla rewrite)

| Role | Inject | Route hint |
|------|--------|------------|
| `hero` | higher `poly_budget_hint`, PBR preferred | profile ≥ balanced |
| `mid` | medium budget | balanced |
| `scatter` | low poly_budget_hint; draft OK | draft / balanced |

Role never switches Cloud↔Water. Scatter ≠ Kenney catalog default — Create still ships generative GLB.

## Attribution

- Meshy geo≠texture / preview→refine: adapted from generative-media-skills `meshy-3d` (MIT).
- One-object / role ideas: Hydrilla rewrite inspired by openmontage patterns (AGPL — inspiration only, no pasted text).
