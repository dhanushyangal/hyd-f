# compile-3d-prompt — quality bar

Source: [docs/QUALITY_BAR_IMG2THREEJS.md](../../../../docs/QUALITY_BAR_IMG2THREEJS.md) (Gwen).

## Fail-closed before any GPU

| Gate | Action |
|------|--------|
| empty / whitespace intent | refuse |
| **underspec** — shallow intent for compound subjects (multi-object, scene+prop, unclear primary) | refuse / request-input; **no route, no estimate, no GPU** |
| **class / complexity** assessment fails (unsupported class, over-budget complexity for profile) | refuse with reason |
| NSFW / sexualized minors / gore-as-product | refuse |
| faces-as-core / portrait character as primary (v0) | refuse; suggest props/env |
| compiler `ok: false` | stop; no `run.route` |

Do **not** encode: Three.js factory briefs, ObjectSculptSpec, hair/CS2/chirality, GLB-to-rebuild-code, Comfy knobs.
