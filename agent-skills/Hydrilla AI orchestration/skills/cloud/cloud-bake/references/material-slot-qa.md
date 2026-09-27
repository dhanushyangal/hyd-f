# Post-bake material-slot QA (Car / prop)

Own bake only. Run after pack, before/with score.

| Slot | Expect | Fail |
|------|--------|------|
| paint / body | opaque; metal low-mid; clearcoat optional; sRGB basecolor | glass shader on body |
| glass | transmission or alpha; low roughness; separate mesh/slot | chalky opaque white glass |
| chrome / trim | metal ~1; low roughness | rubber metalness |
| rubber / tire | metal 0; high roughness | chrome on tires |
| lights | optional emissive; limited materials | unbounded material count |

Also: texture sizes under 4K unless asked; metal-rough linear; +Y up meters preserved through bake.
