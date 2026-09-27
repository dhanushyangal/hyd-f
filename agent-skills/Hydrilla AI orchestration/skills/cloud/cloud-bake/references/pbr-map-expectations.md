# PBR map expectations (Hydrilla own bake)

Adapted from generative-media-skills `3d-asset-production` (MIT) — map contracts only; bake ownership stays Hydrilla.

## Required maps (game_ready)

| Map | Notes |
|-----|-------|
| baseColor | sRGB; no baked lighting preferred |
| normal | tangent-space, linear |
| metallic | linear |
| roughness | linear |

glTF metallic-roughness packing: roughness G, metalness B when packed.

## LOD

Protect silhouette, contact surfaces, UV/material boundaries during reduce. hero 8–12k / mid 3–6k / distant 1–3k (skill body).

## Glass / liquid

Do not collapse transmission into opaque baseColor. Liquid stays separate material where possible.

## Car-class slots (Create v1)

| Part | Maps | Notes |
|------|------|-------|
| `body` | basecolor (sRGB), metallic-roughness (linear), optional clearcoat, normal | Paint: metal 0–0.2 for most car paint; clearcoat high |
| `glass_*` | basecolor + transmission / alpha mode; roughness low | Not opaque white; pack alpha carefully for Unity/Unreal |
| `wheels` / tires | basecolor, roughness high, normal | Rubber: metal 0 |
| `lights` | emissive optional + basecolor | Keep draw-call count low |

LOD: game_ready may emit LOD1/2 after reduce — still own bake worker, never Meshy bake owner.
