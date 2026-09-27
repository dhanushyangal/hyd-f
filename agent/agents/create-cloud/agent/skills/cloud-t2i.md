---
description: >-
  Load on a Cloud job when routing set needs_t2i, to produce the studio reference image
  that Pixal image→3D needs. Also load when a text-only Cloud request looks like it
  could skip straight to generate — it cannot. Not image→3D, not scoring.
---

# cloud-t2i

Part of the locked Cloud pipeline: **text→image → image→3D**. Output is a 2D image, not
a mesh.

## Tools

1. `job.submit` with `kind: "t2i"` — the t2i worker sits behind the frozen surface; it
   is not a 13th tool id.
2. `job.await` — park while it runs.
3. `run.checkpoint` — stage `cloud-t2i`, artifact = image URI.

## Prompt discipline

Use the compiled t2i prompt: one prop, clear silhouette, neutral or gray studio
lighting, plain background, no characters, no mesh/topology jargon, no scene clutter.

## Rules

- Never submit Pixal image→3D from here.
- Never skip t2i on a text-only Cloud job when routing set `needs_t2i=true`.
- Output feeds `cloud-preprocess-ref`. Skipping preprocess needs a documented
  `skipReason` on the card.
- Fail closed: a worker error is retryable per job policy, never a silent jump to
  generate.
- Three.js is irrelevant here.
