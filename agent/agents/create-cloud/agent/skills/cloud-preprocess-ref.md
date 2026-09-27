---
description: >-
  Load before Cloud generate whenever an image exists — user-supplied or produced by
  cloud-t2i — to remove background and run admission checks. Also load when a reference
  image looks cropped, cluttered, or tiny and you must decide whether to spend GPU
  credits on it. Not generate, not bake, not scoring.
---

# cloud-preprocess-ref

Last cheap gate before paid GPU. Reject here, not after.

## Tools

1. `image.rembg` — BiRefNet/rembg + admission report.
2. `run.checkpoint` — stage `cloud-preprocess-ref`, artifact = cleaned image +
   `admission_report`.

## Admission floors (HARD)

| Check | Floor | Fail code |
|---|---|---|
| Foreground coverage | **5 – 97 %** of frame | `ADMISSION_FG` |
| Shortest side | ≥ **64 px** | `ADMISSION_SIZE` |
| Largest connected blob | ≥ **60 %** of foreground | `ADMISSION_BLOB` |

Matte to **gray, not black** — black mattes bleed into dark subjects.

## Rules

- Admission fail ⇒ request a new image or re-run `cloud-t2i`. **Never call Pixal on a
  rejected image.**
- Judge admission only. No aesthetics, no VLM here.
- Skipping is allowed only with an explicit `skipReason` (e.g. clean studio reference,
  rembg disabled by policy).
- The `admission_report` is a required EvidenceManifest capture whenever a Cloud job had
  a reference image.
