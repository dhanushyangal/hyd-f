---
description: >-
  Load on Water when a reference image exists and the path needs it cleaned and admitted
  before spending the customer's BYOK budget. Also load to decide whether a cropped,
  cluttered, or tiny reference is worth paying for. Skip with a reason on text-only
  paths. Not generate, not bake, not scoring.
---

# water-preprocess-ref

Last cheap gate before a paid BYOK submit. Fail closed here, not after the charge.

## Tools

1. `image.rembg` — BiRefNet/rembg + admission report.
2. `run.checkpoint` — only if `water-preprocess-ref` exists as a stage on the card.

## Admission floors (HARD — same as Cloud)

| Check | Floor | Fail code |
|---|---|---|
| Foreground coverage | **5 – 97 %** of frame | `ADMISSION_FG` |
| Shortest side | ≥ **64 px** | `ADMISSION_SIZE` |
| Largest connected blob | ≥ **60 %** of foreground | `ADMISSION_BLOB` |

Matte to gray, not black.

## Rules

- Text-only path ⇒ skip with `skipReason`.
- Admission fail ⇒ ask for a new image. **Never submit a rejected reference to a paid
  BYOK provider.**
- Admission only. No aesthetics, no VLM here.
