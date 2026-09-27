# i2_3d intake (Hydrilla)

## Goals

Clean single-subject refs for image-to-3D workers. Create stays GLB; this skill only prepares pixels.

## Rules

1. Run rembg when BG is cluttered or non-studio.
2. Composite on **gray/studio** — never black.
3. Subject bbox area **> ½** of frame after crop/pad; recenter if needed.
4. Plain BG only — no room, no other props.
5. fal catalog rembg→i2_3d chain is **adapter overflow** (MIT fal-ai-community patterns); Cloud default remains harness BiRefNet + Pixal/Trellis.

## Attribution

Intake tips adapted from fal-ai-community skills catalog `image-to-3d` (MIT-intent). Hydrilla BiRefNet remains default.
